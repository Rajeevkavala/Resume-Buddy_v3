/**
 * User-Level Cache System — Redis-backed (Phase 2)
 * Caches AI results per user to avoid re-analyzing the same content
 * Falls back to in-memory Map if Redis is unavailable
 */
import { getRedisClient, isRedisAvailable } from './redis';
import crypto from 'crypto';

const USER_CACHE_PREFIX = 'user_cache:';
const USER_CACHE_TTL = 43200; // 12 hours in seconds

// Types for cache data
type CacheType = 'resumeAnalysis' | 'interviewQuestions' | 'improvements' | 'parsedResume' | 'qaQuestions';

// In-memory fallback
const memoryCache = new Map<string, string>();
const MAX_MEMORY_SIZE = 100;

/**
 * Generate a hash for content comparison
 */
function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Build a Redis key for user cache
 */
function buildKey(userId: string, type: CacheType): string {
  return `${USER_CACHE_PREFIX}${userId}:${type}`;
}

/**
 * Get cached data from Redis
 */
async function getCacheEntry(userId: string, type: CacheType): Promise<unknown | null> {
  try {
    const redisAvailable = await isRedisAvailable();
    const key = buildKey(userId, type);

    if (redisAvailable) {
      const redis = getRedisClient();
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      const data = memoryCache.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error(`Cache read error for ${type}:`, error);
    return null;
  }
}

/**
 * Set cached data in Redis
 */
async function setCacheEntry(userId: string, type: CacheType, data: unknown): Promise<void> {
  try {
    const redisAvailable = await isRedisAvailable();
    const key = buildKey(userId, type);
    const serialized = JSON.stringify(data);

    if (redisAvailable) {
      const redis = getRedisClient();
      await redis.setex(key, USER_CACHE_TTL, serialized);
    } else {
      if (memoryCache.size >= MAX_MEMORY_SIZE) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
      }
      memoryCache.set(key, serialized);
    }
  } catch (error) {
    console.error(`Cache write error for ${type}:`, error);
  }
}

/**
 * Check if resume analysis is cached and valid
 */
export async function getCachedResumeAnalysis(
  userId: string,
  resumeText: string,
  jobDescription: string
): Promise<unknown | null> {
  const cached = await getCacheEntry(userId, 'resumeAnalysis') as {
    result: unknown;
    resumeHash: string;
    jobDescHash: string;
  } | null;

  if (
    cached &&
    cached.resumeHash === hashContent(resumeText) &&
    cached.jobDescHash === hashContent(jobDescription)
  ) {
    console.log(`👤 User cache hit: resume analysis`);
    return cached.result;
  }

  return null;
}

/**
 * Cache resume analysis result
 */
export async function cacheResumeAnalysis(
  userId: string,
  resumeText: string,
  jobDescription: string,
  result: unknown
): Promise<void> {
  await setCacheEntry(userId, 'resumeAnalysis', {
    result,
    resumeHash: hashContent(resumeText),
    jobDescHash: hashContent(jobDescription),
    analyzedAt: new Date().toISOString(),
  });
  console.log(`👤 User cache set: resume analysis`);
}

/**
 * Check if interview questions are cached and valid
 */
export async function getCachedInterviewQuestions(
  userId: string,
  resumeText: string,
  jobDescription: string
): Promise<unknown | null> {
  const cached = await getCacheEntry(userId, 'interviewQuestions') as {
    questions: unknown;
    resumeHash: string;
    jobDescHash: string;
  } | null;

  if (
    cached &&
    cached.resumeHash === hashContent(resumeText) &&
    cached.jobDescHash === hashContent(jobDescription)
  ) {
    console.log(`👤 User cache hit: interview questions`);
    return cached.questions;
  }

  return null;
}

/**
 * Cache interview questions
 */
export async function cacheInterviewQuestions(
  userId: string,
  resumeText: string,
  jobDescription: string,
  questions: unknown
): Promise<void> {
  await setCacheEntry(userId, 'interviewQuestions', {
    questions,
    resumeHash: hashContent(resumeText),
    jobDescHash: hashContent(jobDescription),
    generatedAt: new Date().toISOString(),
  });
  console.log(`👤 User cache set: interview questions`);
}

/**
 * Check if improvements are cached and valid
 */
export async function getCachedImprovements(
  userId: string,
  resumeText: string,
  jobDescription: string
): Promise<unknown | null> {
  const cached = await getCacheEntry(userId, 'improvements') as {
    suggestions: unknown;
    resumeHash: string;
    jobDescHash: string;
  } | null;

  if (
    cached &&
    cached.resumeHash === hashContent(resumeText) &&
    cached.jobDescHash === hashContent(jobDescription)
  ) {
    console.log(`👤 User cache hit: improvements`);
    return cached.suggestions;
  }

  return null;
}

/**
 * Cache improvement suggestions
 */
export async function cacheImprovements(
  userId: string,
  resumeText: string,
  jobDescription: string,
  suggestions: unknown
): Promise<void> {
  await setCacheEntry(userId, 'improvements', {
    suggestions,
    resumeHash: hashContent(resumeText),
    jobDescHash: hashContent(jobDescription),
    generatedAt: new Date().toISOString(),
  });
  console.log(`👤 User cache set: improvements`);
}

/**
 * Check if parsed resume is cached and valid
 */
export async function getCachedParsedResume(
  userId: string,
  resumeText: string
): Promise<unknown | null> {
  const cached = await getCacheEntry(userId, 'parsedResume') as {
    data: unknown;
    resumeHash: string;
  } | null;

  if (
    cached &&
    cached.resumeHash === hashContent(resumeText)
  ) {
    console.log(`👤 User cache hit: parsed resume`);
    return cached.data;
  }

  return null;
}

/**
 * Cache parsed resume
 */
export async function cacheParsedResume(
  userId: string,
  resumeText: string,
  data: unknown
): Promise<void> {
  await setCacheEntry(userId, 'parsedResume', {
    data,
    resumeHash: hashContent(resumeText),
    parsedAt: new Date().toISOString(),
  });
  console.log(`👤 User cache set: parsed resume`);
}

/**
 * Clear all cache for a user
 */
export async function clearUserCache(userId: string): Promise<void> {
  try {
    const redisAvailable = await isRedisAvailable();
    if (redisAvailable) {
      const redis = getRedisClient();
      const keys = await redis.keys(`${USER_CACHE_PREFIX}${userId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
    // Also clear memory fallback
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${USER_CACHE_PREFIX}${userId}:`)) {
        memoryCache.delete(key);
      }
    }
    console.log(`🗑️ User cache cleared for: ${userId}`);
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getUserCacheStats(): Promise<{
  totalUsers: number;
  maxUsers: number;
}> {
  try {
    const redisAvailable = await isRedisAvailable();
    if (redisAvailable) {
      const redis = getRedisClient();
      const keys = await redis.keys(`${USER_CACHE_PREFIX}*`);
      // Count unique user IDs
      const userIds = new Set(keys.map(k => k.split(':')[1]));
      return {
        totalUsers: userIds.size,
        maxUsers: -1,
      };
    }
  } catch (error) {
    // ignore
  }

  return {
    totalUsers: memoryCache.size,
    maxUsers: MAX_MEMORY_SIZE,
  };
}
