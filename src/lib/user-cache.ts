/**
 * User-Level Cache System
 * Caches AI results per user to avoid re-analyzing the same content
 */
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// User cache data structure
interface UserCacheData {
  resumeAnalysis?: {
    result: unknown;
    resumeHash: string;
    jobDescHash: string;
    analyzedAt: Date;
  };
  interviewQuestions?: {
    questions: unknown;
    resumeHash: string;
    jobDescHash: string;
    generatedAt: Date;
  };
  improvements?: {
    suggestions: unknown;
    resumeHash: string;
    jobDescHash: string;
    generatedAt: Date;
  };
  parsedResume?: {
    data: unknown;
    resumeHash: string;
    parsedAt: Date;
  };
  qaQuestions?: {
    questions: unknown;
    resumeHash: string;
    jobDescHash: string;
    generatedAt: Date;
  };
}

// User cache with 24-hour TTL - Optimized for 250+ concurrent users
const userCache = new LRUCache<string, UserCacheData>({
  max: 500, // Optimized for memory efficiency with 250+ users
  ttl: 1000 * 60 * 60 * 12, // 12 hour TTL (reduced for memory optimization)
  maxSize: 50 * 1024 * 1024, // 50MB max cache size
  sizeCalculation: (value) => JSON.stringify(value).length,
  allowStale: true, // Allow stale entries while revalidating
  updateAgeOnGet: true, // Reset TTL on cache hit
  updateAgeOnHas: true,
});

/**
 * Generate a hash for content comparison
 */
function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Get user's cached data
 * @param userId - User identifier
 */
export function getUserCache(userId: string): UserCacheData {
  return userCache.get(userId) || {};
}

/**
 * Update user's cached data
 * @param userId - User identifier
 * @param data - Partial cache data to merge
 */
export function setUserCache(userId: string, data: Partial<UserCacheData>): void {
  const existing = getUserCache(userId);
  userCache.set(userId, { ...existing, ...data });
}

/**
 * Check if resume analysis is cached and valid
 */
export function getCachedResumeAnalysis(
  userId: string,
  resumeText: string,
  jobDescription: string
): unknown | null {
  const cache = getUserCache(userId);
  const resumeHash = hashContent(resumeText);
  const jobDescHash = hashContent(jobDescription);

  if (
    cache.resumeAnalysis &&
    cache.resumeAnalysis.resumeHash === resumeHash &&
    cache.resumeAnalysis.jobDescHash === jobDescHash
  ) {
    console.log(`👤 User cache hit: resume analysis`);
    return cache.resumeAnalysis.result;
  }

  return null;
}

/**
 * Cache resume analysis result
 */
export function cacheResumeAnalysis(
  userId: string,
  resumeText: string,
  jobDescription: string,
  result: unknown
): void {
  setUserCache(userId, {
    resumeAnalysis: {
      result,
      resumeHash: hashContent(resumeText),
      jobDescHash: hashContent(jobDescription),
      analyzedAt: new Date(),
    },
  });
  console.log(`👤 User cache set: resume analysis`);
}

/**
 * Check if interview questions are cached and valid
 */
export function getCachedInterviewQuestions(
  userId: string,
  resumeText: string,
  jobDescription: string
): unknown | null {
  const cache = getUserCache(userId);
  const resumeHash = hashContent(resumeText);
  const jobDescHash = hashContent(jobDescription);

  if (
    cache.interviewQuestions &&
    cache.interviewQuestions.resumeHash === resumeHash &&
    cache.interviewQuestions.jobDescHash === jobDescHash
  ) {
    console.log(`👤 User cache hit: interview questions`);
    return cache.interviewQuestions.questions;
  }

  return null;
}

/**
 * Cache interview questions
 */
export function cacheInterviewQuestions(
  userId: string,
  resumeText: string,
  jobDescription: string,
  questions: unknown
): void {
  setUserCache(userId, {
    interviewQuestions: {
      questions,
      resumeHash: hashContent(resumeText),
      jobDescHash: hashContent(jobDescription),
      generatedAt: new Date(),
    },
  });
  console.log(`👤 User cache set: interview questions`);
}

/**
 * Check if improvements are cached and valid
 */
export function getCachedImprovements(
  userId: string,
  resumeText: string,
  jobDescription: string
): unknown | null {
  const cache = getUserCache(userId);
  const resumeHash = hashContent(resumeText);
  const jobDescHash = hashContent(jobDescription);

  if (
    cache.improvements &&
    cache.improvements.resumeHash === resumeHash &&
    cache.improvements.jobDescHash === jobDescHash
  ) {
    console.log(`👤 User cache hit: improvements`);
    return cache.improvements.suggestions;
  }

  return null;
}

/**
 * Cache improvement suggestions
 */
export function cacheImprovements(
  userId: string,
  resumeText: string,
  jobDescription: string,
  suggestions: unknown
): void {
  setUserCache(userId, {
    improvements: {
      suggestions,
      resumeHash: hashContent(resumeText),
      jobDescHash: hashContent(jobDescription),
      generatedAt: new Date(),
    },
  });
  console.log(`👤 User cache set: improvements`);
}

/**
 * Check if parsed resume is cached and valid
 */
export function getCachedParsedResume(
  userId: string,
  resumeText: string
): unknown | null {
  const cache = getUserCache(userId);
  const resumeHash = hashContent(resumeText);

  if (
    cache.parsedResume &&
    cache.parsedResume.resumeHash === resumeHash
  ) {
    console.log(`👤 User cache hit: parsed resume`);
    return cache.parsedResume.data;
  }

  return null;
}

/**
 * Cache parsed resume
 */
export function cacheParsedResume(
  userId: string,
  resumeText: string,
  data: unknown
): void {
  setUserCache(userId, {
    parsedResume: {
      data,
      resumeHash: hashContent(resumeText),
      parsedAt: new Date(),
    },
  });
  console.log(`👤 User cache set: parsed resume`);
}

/**
 * Clear all cache for a user
 */
export function clearUserCache(userId: string): void {
  userCache.delete(userId);
  console.log(`🗑️ User cache cleared for: ${userId}`);
}

/**
 * Get cache statistics
 */
export function getUserCacheStats(): {
  totalUsers: number;
  maxUsers: number;
} {
  return {
    totalUsers: userCache.size,
    maxUsers: 1000,
  };
}
