/**
 * Rate limiter for AI requests using Redis sorted sets + PostgreSQL UsageRecord
 * Supports operation-specific limits, user-level rate limiting, and daily limits
 * Daily limits are persisted in PostgreSQL for reliability across page refreshes
 * Per-minute sliding window uses Redis sorted sets for performance
 * 
 * Tier-aware: Free users get 5 AI credits/day, Pro users get 10 AI credits/day
 */
import { getRedisClient, isRedisAvailable } from './redis';
import { prisma } from '@/lib/db';
import { type SubscriptionTier, TIER_LIMITS } from './types/subscription';
import { getUserTier } from './subscription-service';

interface RateLimitConfig {
  windowMs: number;      // Time window in ms
  maxRequests: number;   // Max requests per window
  blockDuration?: number; // Optional block duration after limit hit
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
  dailyLimitExceeded?: boolean;
  dailyRemaining?: number;
  tier?: SubscriptionTier;
}

// Default daily limit configuration
const DAILY_LIMIT_CONFIG = {
  maxRequestsPerDay: 10,  // Default: Pro tier limit
};

/**
 * Get daily AI limit based on subscription tier
 */
export function getTierDailyLimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].dailyAICredits;
}

// Different limits for different operations
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  'analyze-resume': {
    windowMs: 60000,
    maxRequests: 5,
  },
  'generate-questions': {
    windowMs: 60000,
    maxRequests: 3,
  },
  'generate-qa': {
    windowMs: 60000,
    maxRequests: 5,
  },
  'improve-resume': {
    windowMs: 60000,
    maxRequests: 10,
  },
  'parse-resume': {
    windowMs: 60000,
    maxRequests: 5,
  },
  'structure-job': {
    windowMs: 60000,
    maxRequests: 10,
  },
  'generate-cover-letter': {
    windowMs: 60000,
    maxRequests: 5,
  },
  'interview-session': {
    windowMs: 60000,
    maxRequests: 3,
  },
  'evaluate-answer': {
    windowMs: 60000,
    maxRequests: 10,
  },
  'evaluate-code': {
    windowMs: 60000,
    maxRequests: 5,
  },
  'follow-up-question': {
    windowMs: 60000,
    maxRequests: 10,
  },
  'live-interview-respond': {
    windowMs: 60000,
    maxRequests: 30,    // Higher limit for real-time conversation
  },
  'live-interview-stt': {
    windowMs: 60000,
    maxRequests: 40,    // Frequent audio chunks
  },
  'live-interview-tts': {
    windowMs: 60000,
    maxRequests: 30,
  },
  'default': {
    windowMs: 60000,
    maxRequests: 20,
  },
};

// ============ Date Utilities ============

function getCurrentDateString(): string {
  // Use UTC to match PostgreSQL's date column and getStartOfToday()
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfToday(): Date {
  // Use UTC midnight to match PostgreSQL's date column behavior
  // Prisma serializes Date to ISO string (UTC), so we must use UTC midnight
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getNextMidnight(): Date {
  // Use UTC midnight consistent with getStartOfToday() and database queries
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

// ============ Redis Sliding Window Rate Limiting ============

/**
 * Check per-minute rate limit using Redis sorted sets (sliding window)
 * Falls back to allowing if Redis is unavailable
 */
async function checkSlidingWindowLimit(
  userId: string,
  operation: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; retryAfter?: number }> {
  const config = rateLimitConfigs[operation] || rateLimitConfigs.default;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `ratelimit:${userId}:${operation}`;

  try {
    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      // Fallback: allow request if Redis is down
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
      };
    }

    const redis = getRedisClient();

    // Use a pipeline for atomicity
    const pipeline = redis.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count current entries
    pipeline.zcard(key);
    // Add current request (tentatively)
    pipeline.zadd(key, now.toString(), `${now}:${Math.random().toString(36).slice(2, 8)}`);
    // Set TTL on the key
    pipeline.pexpire(key, config.windowMs);

    const results = await pipeline.exec();
    if (!results) {
      return { allowed: true, remaining: config.maxRequests, resetAt: new Date(now + config.windowMs) };
    }

    const currentCount = (results[1]?.[1] as number) || 0;

    if (currentCount >= config.maxRequests) {
      // Over limit - remove the entry we just added
      await redis.zremrangebyscore(key, now, now);
      
      // Find the oldest entry to calculate when the window will expire
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTime = oldest.length >= 2 ? parseInt(oldest[1]) : now;
      const resetAt = new Date(oldestTime + config.windowMs);
      const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetAt: new Date(now + config.windowMs),
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fallback: allow request
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
    };
  }
}

// ============ PostgreSQL Daily Usage ============

/**
 * Get daily AI usage from UsageRecord table
 */
async function getDailyAIUsage(userId: string): Promise<{ count: number; date: string }> {
  try {
    const today = getStartOfToday();
    const todayStr = getCurrentDateString();

    const aiFeatures = [
      'analyze-resume',
      'improve-resume',
      'generate-qa',
      'generate-questions',
      'generate-cover-letter',
      'parse-resume',
      'interview-session',
    ];

    const usage = await prisma.usageRecord.aggregate({
      where: {
        userId,
        date: today,
        feature: { in: aiFeatures },
      },
      _sum: { count: true },
    });

    return {
      count: usage._sum.count || 0,
      date: todayStr,
    };
  } catch (error) {
    console.error('Error getting daily AI usage:', error);
    return { count: 0, date: getCurrentDateString() };
  }
}

/**
 * Increment daily AI usage in UsageRecord table
 */
async function incrementDailyAIUsage(userId: string, operation: string): Promise<number> {
  try {
    const today = getStartOfToday();

    const record = await prisma.usageRecord.upsert({
      where: {
        userId_feature_date: {
          userId,
          feature: operation,
          date: today,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        feature: operation,
        count: 1,
        date: today,
      },
    });

    return record.count;
  } catch (error) {
    console.error('Error incrementing daily usage:', error);
    return 0;
  }
}

// ============ Public API ============

/**
 * Check daily limit using PostgreSQL (persistent)
 * Tier-aware: Free users get 5/day, Pro users get 10/day
 */
export async function checkDailyLimitAsync(
  userId: string,
  tier?: SubscriptionTier
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; used: number; limit: number; tier: SubscriptionTier }> {
  try {
    const userTier = tier || await getUserTier(userId);
    const dailyLimit = getTierDailyLimit(userTier);

    const usage = await getDailyAIUsage(userId);
    const remaining = Math.max(0, dailyLimit - usage.count);

    return {
      allowed: usage.count < dailyLimit,
      remaining,
      used: usage.count,
      limit: dailyLimit,
      tier: userTier,
      resetAt: getNextMidnight(),
    };
  } catch (error) {
    console.error('Error checking daily limit:', error);
    return {
      allowed: true,
      remaining: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
      used: 0,
      limit: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
      tier: 'free' as SubscriptionTier,
      resetAt: getNextMidnight(),
    };
  }
}

/**
 * Get daily usage status from PostgreSQL
 */
export async function getDailyUsageStatusAsync(
  userId: string,
  tier?: SubscriptionTier
): Promise<{ used: number; remaining: number; limit: number; resetAt: Date; tier: SubscriptionTier }> {
  try {
    const userTier = tier || await getUserTier(userId);
    const dailyLimit = getTierDailyLimit(userTier);

    const usage = await getDailyAIUsage(userId);

    return {
      used: usage.count,
      remaining: Math.max(0, dailyLimit - usage.count),
      limit: dailyLimit,
      tier: userTier,
      resetAt: getNextMidnight(),
    };
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return {
      used: 0,
      remaining: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
      limit: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
      tier: 'free' as SubscriptionTier,
      resetAt: getNextMidnight(),
    };
  }
}

/**
 * Synchronous versions for backward compatibility (return defaults)
 */
export function checkDailyLimit(userId: string): { allowed: boolean; remaining: number; resetAt: Date } {
  return {
    allowed: true,
    remaining: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
    resetAt: getNextMidnight(),
  };
}

export function incrementDailyUsage(_userId: string): void {
  // No-op: daily usage is tracked in PostgreSQL via async functions
}

export function getDailyUsageStatus(userId: string): { used: number; remaining: number; limit: number; resetAt: Date } {
  return {
    used: 0,
    remaining: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
    limit: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
    resetAt: getNextMidnight(),
  };
}

/**
 * Check rate limit and throw error if exceeded (sync version for backward compat)
 */
export function checkRateLimit(
  userId: string,
  operation: string = 'default',
  _checkDaily: boolean = true
): RateLimitResult {
  // Sync version returns success by default - use async version for real checks
  const config = rateLimitConfigs[operation] || rateLimitConfigs.default;
  return {
    success: true,
    remaining: config.maxRequests,
    resetAt: new Date(Date.now() + config.windowMs),
  };
}

export function enforceRateLimit(userId: string, operation: string = 'default'): void {
  // Sync version is a no-op - use enforceRateLimitAsync for real enforcement
}

/**
 * Async rate limit check using Redis + PostgreSQL
 * This is the primary rate limiting function for server actions
 */
export async function checkRateLimitAsync(
  userId: string,
  operation: string = 'default',
  checkDaily: boolean = true
): Promise<RateLimitResult> {
  let userTier: SubscriptionTier = 'free';

  // Check daily limit first using PostgreSQL
  if (checkDaily) {
    const dailyCheck = await checkDailyLimitAsync(userId);
    userTier = dailyCheck.tier;

    if (!dailyCheck.allowed) {
      const resetAt = dailyCheck.resetAt;
      const now = Date.now();
      return {
        success: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now) / 1000),
        dailyLimitExceeded: true,
        dailyRemaining: 0,
        tier: userTier,
      };
    }
  }

  // Check per-minute sliding window using Redis
  const windowResult = await checkSlidingWindowLimit(userId, operation);
  if (!windowResult.allowed) {
    return {
      success: false,
      remaining: 0,
      resetAt: windowResult.resetAt,
      retryAfter: windowResult.retryAfter,
      tier: userTier,
    };
  }

  // Increment daily usage in PostgreSQL
  if (checkDaily) {
    await incrementDailyAIUsage(userId, operation);
  }

  // Get updated daily status
  const dailyStatus = await getDailyUsageStatusAsync(userId, userTier);

  return {
    success: true,
    remaining: windowResult.remaining,
    resetAt: windowResult.resetAt,
    dailyRemaining: dailyStatus.remaining,
    tier: userTier,
  };
}

/**
 * Async enforce rate limit - throws if exceeded
 * Returns the user's subscription tier
 */
export async function enforceRateLimitAsync(userId: string, operation: string = 'default'): Promise<SubscriptionTier> {
  const result = await checkRateLimitAsync(userId, operation);
  if (!result.success) {
    let errorMessage: string;
    const tierLimit = result.tier ? getTierDailyLimit(result.tier) : DAILY_LIMIT_CONFIG.maxRequestsPerDay;

    if (result.dailyLimitExceeded) {
      const resetTime = result.resetAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const upgradeMsg = result.tier === 'free'
        ? ' Upgrade to Pro for more credits!'
        : '';
      errorMessage = `Daily limit reached! You've used all ${tierLimit} AI requests for today. Your limit resets at ${resetTime}.${upgradeMsg}`;
    } else {
      errorMessage = `Rate limit exceeded. Please wait ${result.retryAfter} seconds before trying again.`;
    }

    const error = new Error(errorMessage) as Error & {
      retryAfter: number;
      dailyLimitExceeded?: boolean;
      code: string;
      tier?: SubscriptionTier;
    };
    error.retryAfter = result.retryAfter || 60;
    error.dailyLimitExceeded = result.dailyLimitExceeded;
    error.code = result.dailyLimitExceeded ? 'DAILY_LIMIT_EXCEEDED' : 'RATE_LIMIT_EXCEEDED';
    error.tier = result.tier;
    throw error;
  }

  return result.tier || 'free';
}

/**
 * Get rate limit status without incrementing
 */
export function getRateLimitStatus(
  userId: string,
  operation: string = 'default'
): RateLimitResult {
  const config = rateLimitConfigs[operation] || rateLimitConfigs.default;
  return {
    success: true,
    remaining: config.maxRequests,
    resetAt: new Date(Date.now() + config.windowMs),
  };
}

/**
 * Reset rate limit for user (admin)
 */
export async function resetRateLimit(userId: string, operation?: string): Promise<void> {
  try {
    const redisAvailable = await isRedisAvailable();
    if (redisAvailable) {
      const redis = getRedisClient();
      if (operation) {
        await redis.del(`ratelimit:${userId}:${operation}`);
      } else {
        const keys = await redis.keys(`ratelimit:${userId}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    }
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Get all rate limit configurations
 */
export function getRateLimitConfigs(): Record<string, RateLimitConfig> {
  return { ...rateLimitConfigs };
}

/**
 * Reset daily limit for a user (admin)
 */
export async function resetDailyLimit(userId: string): Promise<void> {
  try {
    const today = getStartOfToday();
    await prisma.usageRecord.deleteMany({
      where: {
        userId,
        date: today,
      },
    });
  } catch (error) {
    console.error('Error resetting daily limit:', error);
  }
}

/**
 * Get daily limit configuration
 */
export function getDailyLimitConfig(): { maxRequestsPerDay: number } {
  return { ...DAILY_LIMIT_CONFIG };
}

/**
 * Increment daily usage in DB (async)
 */
export async function incrementDailyUsageAsync(userId: string): Promise<number> {
  return incrementDailyAIUsage(userId, 'ai-request');
}
