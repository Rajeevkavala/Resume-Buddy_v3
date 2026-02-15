/**
 * Rate limiter for AI requests using LRU cache + Firestore persistence
 * Supports operation-specific limits, user-level rate limiting, and daily limits
 * Daily limits are persisted in Firestore for reliability across page refreshes
 * 
 * Tier-aware: Free users get 5 AI credits/day, Pro users get 10 AI credits/day
 */
import { LRUCache } from 'lru-cache';
import { getDailyUsage, incrementDailyUsageInDb } from './firestore';
import { type SubscriptionTier, TIER_LIMITS } from './types/subscription';
import { getUserTier } from './subscription-service';

interface RateLimitConfig {
  windowMs: number;      // Time window in ms
  maxRequests: number;   // Max requests per window
  blockDuration?: number; // Optional block duration after limit hit
}

interface RateLimitState {
  requests: number[];
  blockedUntil?: Date;
}

// Daily limit tracking
interface DailyLimitState {
  count: number;
  date: string; // YYYY-MM-DD format
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

// Default daily limit configuration (used when tier is unknown)
// Tier-specific limits are in TIER_LIMITS from subscription types
const DAILY_LIMIT_CONFIG = {
  maxRequestsPerDay: 10,  // Default: Pro tier limit
  maxRequestsPerMonth: 300, // Maximum 300 AI requests per user per month
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
    windowMs: 60000,      // 1 minute
    maxRequests: 5,       // 5 analyses per minute
  },
  'generate-questions': {
    windowMs: 60000,
    maxRequests: 3,       // 3 generations per minute
  },
  'generate-qa': {
    windowMs: 60000,
    maxRequests: 5,       // 5 Q&A generations per minute
  },
  'improve-resume': {
    windowMs: 60000,
    maxRequests: 10,      // 10 improvements per minute
  },
  'parse-resume': {
    windowMs: 60000,
    maxRequests: 5,       // 5 parses per minute
  },
  'structure-job': {
    windowMs: 60000,
    maxRequests: 10,      // 10 job structuring per minute
  },
  'generate-cover-letter': {
    windowMs: 60000,
    maxRequests: 5,       // 5 cover letters per minute
  },
  'interview-session': {
    windowMs: 60000,
    maxRequests: 3,       // 3 session starts per minute
  },
  'evaluate-answer': {
    windowMs: 60000,
    maxRequests: 10,      // 10 evaluations per minute (one per question)
  },
  'evaluate-code': {
    windowMs: 60000,
    maxRequests: 5,       // 5 code evals per minute
  },
  'follow-up-question': {
    windowMs: 60000,
    maxRequests: 10,      // 10 follow-ups per minute
  },
  'default': {
    windowMs: 60000,
    maxRequests: 20,      // 20 total requests per minute
  },
};

// Track request timestamps per user+operation - Optimized for 250+ concurrent users
const rateLimitCache = new LRUCache<string, RateLimitState>({
  max: 5000, // Optimized: ~20 operations per user × 250 users
  ttl: 1000 * 60 * 60, // 1 hour cleanup
  allowStale: false, // Rate limits must be accurate
  updateAgeOnGet: false, // Don't reset TTL on rate limit checks
});

// Track daily usage per user - Optimized for 250+ users
const dailyLimitCache = new LRUCache<string, DailyLimitState>({
  max: 500, // Support 250+ users
  ttl: 1000 * 60 * 60 * 25, // 25 hours (covers day rollover)
  allowStale: false,
  updateAgeOnGet: false,
});

/**
 * Get current date string in YYYY-MM-DD format (local timezone)
 * Uses local time to ensure limits reset at midnight local time
 */
function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get midnight of next day for reset time
 */
function getNextMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Check if user has exceeded daily limit
 */
export function checkDailyLimit(userId: string): { allowed: boolean; remaining: number; resetAt: Date } {
  const key = `daily:${userId}`;
  const today = getCurrentDateString();
  let state = dailyLimitCache.get(key);
  
  // Reset if it's a new day
  if (!state || state.date !== today) {
    state = { count: 0, date: today };
  }
  
  const remaining = Math.max(0, DAILY_LIMIT_CONFIG.maxRequestsPerDay - state.count);
  
  return {
    allowed: state.count < DAILY_LIMIT_CONFIG.maxRequestsPerDay,
    remaining,
    resetAt: getNextMidnight(),
  };
}

/**
 * Increment daily usage counter
 */
export function incrementDailyUsage(userId: string): void {
  const key = `daily:${userId}`;
  const today = getCurrentDateString();
  let state = dailyLimitCache.get(key);
  
  // Reset if it's a new day
  if (!state || state.date !== today) {
    state = { count: 0, date: today };
  }
  
  state.count++;
  dailyLimitCache.set(key, state);
}

/**
 * Get daily usage status without incrementing
 */
export function getDailyUsageStatus(userId: string): { used: number; remaining: number; limit: number; resetAt: Date } {
  const key = `daily:${userId}`;
  const today = getCurrentDateString();
  const state = dailyLimitCache.get(key);
  
  const used = (state && state.date === today) ? state.count : 0;
  
  return {
    used,
    remaining: Math.max(0, DAILY_LIMIT_CONFIG.maxRequestsPerDay - used),
    limit: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
    resetAt: getNextMidnight(),
  };
}

/**
 * Check if a user has exceeded their rate limit for an operation
 * Also checks daily limit (10 requests per day)
 * @param userId - The user's unique identifier
 * @param operation - The operation being performed (default: 'default')
 * @param checkDaily - Whether to check and increment daily limit (default: true)
 * @returns Rate limit result with success status and remaining requests
 */
export function checkRateLimit(
  userId: string,
  operation: string = 'default',
  checkDaily: boolean = true
): RateLimitResult {
  // Check daily limit first (if enabled)
  if (checkDaily) {
    const dailyCheck = checkDailyLimit(userId);
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
      };
    }
  }
  
  const config = rateLimitConfigs[operation] || rateLimitConfigs.default;
  const key = `${userId}:${operation}`;
  const now = Date.now();

  let state = rateLimitCache.get(key) || { requests: [] };

  // Check if user is blocked
  if (state.blockedUntil && state.blockedUntil > new Date()) {
    return {
      success: false,
      remaining: 0,
      resetAt: state.blockedUntil,
      retryAfter: Math.ceil((state.blockedUntil.getTime() - now) / 1000),
    };
  }

  // Filter requests within window
  const windowStart = now - config.windowMs;
  state.requests = state.requests.filter(time => time > windowStart);

  // Check limit
  if (state.requests.length >= config.maxRequests) {
    const resetAt = new Date(state.requests[0] + config.windowMs);

    // Apply block if configured
    if (config.blockDuration) {
      state.blockedUntil = new Date(now + config.blockDuration);
    }

    rateLimitCache.set(key, state);

    return {
      success: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt.getTime() - now) / 1000),
    };
  }

  // Allow request and record timestamp
  state.requests.push(now);
  rateLimitCache.set(key, state);
  
  // Increment daily usage counter
  if (checkDaily) {
    incrementDailyUsage(userId);
  }
  
  // Get updated daily status
  const dailyStatus = getDailyUsageStatus(userId);

  return {
    success: true,
    remaining: config.maxRequests - state.requests.length,
    resetAt: new Date(now + config.windowMs),
    dailyRemaining: dailyStatus.remaining,
  };
}

/**
 * Get current rate limit status without incrementing
 * @param userId - The user's unique identifier
 * @param operation - The operation being performed
 */
export function getRateLimitStatus(
  userId: string,
  operation: string = 'default'
): RateLimitResult {
  const config = rateLimitConfigs[operation] || rateLimitConfigs.default;
  const key = `${userId}:${operation}`;
  const now = Date.now();

  const state = rateLimitCache.get(key) || { requests: [] };

  // Check if user is blocked
  if (state.blockedUntil && state.blockedUntil > new Date()) {
    return {
      success: false,
      remaining: 0,
      resetAt: state.blockedUntil,
      retryAfter: Math.ceil((state.blockedUntil.getTime() - now) / 1000),
    };
  }

  // Filter requests within window
  const windowStart = now - config.windowMs;
  const recentRequests = state.requests.filter(time => time > windowStart);

  return {
    success: recentRequests.length < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - recentRequests.length),
    resetAt: recentRequests.length > 0
      ? new Date(recentRequests[0] + config.windowMs)
      : new Date(now + config.windowMs),
  };
}

/**
 * Reset rate limit for a specific user
 * @param userId - The user's unique identifier
 * @param operation - Optional specific operation to reset
 */
export function resetRateLimit(userId: string, operation?: string): void {
  if (operation) {
    rateLimitCache.delete(`${userId}:${operation}`);
  } else {
    // Reset all operations for user
    for (const op of Object.keys(rateLimitConfigs)) {
      rateLimitCache.delete(`${userId}:${op}`);
    }
  }
}

/**
 * Get all rate limit configurations
 */
export function getRateLimitConfigs(): Record<string, RateLimitConfig> {
  return { ...rateLimitConfigs };
}

/**
 * Check rate limit and throw error if exceeded
 * Convenience function for API routes
 */
export function enforceRateLimit(userId: string, operation: string = 'default'): void {
  const result = checkRateLimit(userId, operation);
  if (!result.success) {
    let errorMessage: string;
    
    if (result.dailyLimitExceeded) {
      // Format reset time nicely
      const resetTime = result.resetAt.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      errorMessage = `Daily limit reached! You've used all 10 AI requests for today. Your limit resets at ${resetTime}. Please come back tomorrow to continue.`;
    } else {
      errorMessage = `Rate limit exceeded. Please wait ${result.retryAfter} seconds before trying again.`;
    }
    
    const error = new Error(errorMessage) as Error & { 
      retryAfter: number; 
      dailyLimitExceeded?: boolean;
      code: string;
    };
    error.retryAfter = result.retryAfter || 60;
    error.dailyLimitExceeded = result.dailyLimitExceeded;
    error.code = result.dailyLimitExceeded ? 'DAILY_LIMIT_EXCEEDED' : 'RATE_LIMIT_EXCEEDED';
    throw error;
  }
}

/**
 * Reset daily limit for a specific user (admin function)
 */
export function resetDailyLimit(userId: string): void {
  const key = `daily:${userId}`;
  dailyLimitCache.delete(key);
}

/**
 * Get daily limit configuration
 */
export function getDailyLimitConfig(): { maxRequestsPerDay: number } {
  return { ...DAILY_LIMIT_CONFIG };
}

// ============ ASYNC FUNCTIONS WITH FIRESTORE PERSISTENCE ============

/**
 * Check daily limit using Firestore (persistent)
 * Use this for accurate daily limit checking across page refreshes
 * Now tier-aware: Free users get 5/day, Pro users get 10/day
 */
export async function checkDailyLimitAsync(
  userId: string,
  tier?: SubscriptionTier
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; used: number; limit: number; tier: SubscriptionTier }> {
  try {
    // Get tier if not provided
    const userTier = tier || await getUserTier(userId);
    const dailyLimit = getTierDailyLimit(userTier);
    
    const usage = await getDailyUsage(userId);
    const remaining = Math.max(0, dailyLimit - usage.count);
    
    // Also update the in-memory cache for faster subsequent checks
    const key = `daily:${userId}`;
    dailyLimitCache.set(key, { count: usage.count, date: usage.date });
    
    return {
      allowed: usage.count < dailyLimit,
      remaining,
      used: usage.count,
      limit: dailyLimit,
      tier: userTier,
      resetAt: getNextMidnight(),
    };
  } catch (error) {
    console.error('Error checking daily limit from Firestore:', error);
    // Fallback to in-memory cache with default limit
    const memoryCheck = checkDailyLimit(userId);
    return { 
      ...memoryCheck, 
      used: DAILY_LIMIT_CONFIG.maxRequestsPerDay - memoryCheck.remaining,
      limit: DAILY_LIMIT_CONFIG.maxRequestsPerDay,
      tier: 'free' as SubscriptionTier,
    };
  }
}

/**
 * Increment daily usage in Firestore (persistent)
 * Also updates the in-memory cache
 */
export async function incrementDailyUsageAsync(userId: string): Promise<number> {
  try {
    const newCount = await incrementDailyUsageInDb(userId);
    
    // Also update the in-memory cache
    const key = `daily:${userId}`;
    const today = getCurrentDateString();
    dailyLimitCache.set(key, { count: newCount, date: today });
    
    return newCount;
  } catch (error) {
    console.error('Error incrementing daily usage in Firestore:', error);
    // Fallback to in-memory increment
    incrementDailyUsage(userId);
    return getDailyUsageStatus(userId).used;
  }
}

/**
 * Get daily usage status from Firestore (persistent)
 * Now tier-aware: returns limit based on user's subscription tier
 */
export async function getDailyUsageStatusAsync(
  userId: string,
  tier?: SubscriptionTier
): Promise<{ used: number; remaining: number; limit: number; resetAt: Date; tier: SubscriptionTier }> {
  try {
    // Get tier if not provided
    const userTier = tier || await getUserTier(userId);
    const dailyLimit = getTierDailyLimit(userTier);
    
    const usage = await getDailyUsage(userId);
    
    // Update in-memory cache
    const key = `daily:${userId}`;
    dailyLimitCache.set(key, { count: usage.count, date: usage.date });
    
    return {
      used: usage.count,
      remaining: Math.max(0, dailyLimit - usage.count),
      limit: dailyLimit,
      tier: userTier,
      resetAt: getNextMidnight(),
    };
  } catch (error) {
    console.error('Error getting daily usage from Firestore:', error);
    // Fallback to in-memory status with default
    const memStatus = getDailyUsageStatus(userId);
    return { ...memStatus, tier: 'free' as SubscriptionTier };
  }
}

/**
 * Async version of checkRateLimit that uses Firestore for daily limits
 * Use this in server actions for persistent rate limiting
 * Now tier-aware: automatically fetches user tier and applies appropriate limits
 */
export async function checkRateLimitAsync(
  userId: string,
  operation: string = 'default',
  checkDaily: boolean = true
): Promise<RateLimitResult> {
  let userTier: SubscriptionTier = 'free';
  
  // Check daily limit first (if enabled) - using Firestore
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
  
  const config = rateLimitConfigs[operation] || rateLimitConfigs.default;
  const key = `${userId}:${operation}`;
  const now = Date.now();

  let state = rateLimitCache.get(key) || { requests: [] };

  // Check if user is blocked
  if (state.blockedUntil && state.blockedUntil > new Date()) {
    return {
      success: false,
      remaining: 0,
      resetAt: state.blockedUntil,
      retryAfter: Math.ceil((state.blockedUntil.getTime() - now) / 1000),
    };
  }

  // Filter requests within window
  const windowStart = now - config.windowMs;
  state.requests = state.requests.filter(time => time > windowStart);

  // Check per-minute limit
  if (state.requests.length >= config.maxRequests) {
    const resetAt = new Date(state.requests[0] + config.windowMs);

    if (config.blockDuration) {
      state.blockedUntil = new Date(now + config.blockDuration);
    }

    rateLimitCache.set(key, state);

    return {
      success: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt.getTime() - now) / 1000),
    };
  }

  // Allow request and record timestamp
  state.requests.push(now);
  rateLimitCache.set(key, state);
  
  // Increment daily usage counter in Firestore
  if (checkDaily) {
    await incrementDailyUsageAsync(userId);
  }
  
  // Get updated daily status
  const dailyStatus = await getDailyUsageStatusAsync(userId);

  return {
    success: true,
    remaining: config.maxRequests - state.requests.length,
    resetAt: new Date(now + config.windowMs),
    dailyRemaining: dailyStatus.remaining,
    tier: userTier,
  };
}

/**
 * Async version of enforceRateLimit that uses Firestore for persistence
 * Use this in server actions for reliable rate limiting
 * Now tier-aware: shows dynamic limit based on user's subscription tier
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
        hour12: true 
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
