/**
 * API Route Rate Limiter
 * 
 * Redis-based sliding window rate limiter for API routes.
 * Designed for auth endpoints (login, register, OTP) to prevent
 * brute-force attacks and abuse.
 * 
 * Production-ready for 5000+ concurrent users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

// ============ Configuration ============

interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Key prefix for Redis */
  keyPrefix: string;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Auth endpoints — strict limits to prevent brute-force
  'auth-login': {
    maxRequests: 10,
    windowSeconds: 900, // 15 minutes
    keyPrefix: 'rl:auth:login:',
  },
  'auth-register': {
    maxRequests: 5,
    windowSeconds: 3600, // 1 hour
    keyPrefix: 'rl:auth:register:',
  },
  'auth-otp-send': {
    maxRequests: 5,
    windowSeconds: 600, // 10 minutes
    keyPrefix: 'rl:auth:otp:send:',
  },
  'auth-otp-verify': {
    maxRequests: 10,
    windowSeconds: 600, // 10 minutes
    keyPrefix: 'rl:auth:otp:verify:',
  },
  'auth-password-reset': {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    keyPrefix: 'rl:auth:pwd:reset:',
  },
  'auth-verify-email': {
    maxRequests: 5,
    windowSeconds: 600, // 10 minutes
    keyPrefix: 'rl:auth:verify:',
  },
  // General API — less strict
  'api-general': {
    maxRequests: 100,
    windowSeconds: 60, // 1 minute
    keyPrefix: 'rl:api:general:',
  },
};

// ============ Rate Limit Check ============

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until retry allowed
}

/**
 * Check rate limit using Redis sliding window algorithm.
 * Uses IP address as the rate limit key for unauthenticated endpoints.
 */
export async function checkApiRateLimit(
  identifier: string,
  configName: string
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[configName] || RATE_LIMIT_CONFIGS['api-general'];
  const key = `${config.keyPrefix}${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  try {
    const redis = getRedisClient();

    // Sliding window using sorted set
    const pipeline = redis.pipeline();
    // Remove entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count current entries
    pipeline.zcard(key);
    // Add current request
    pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
    // Set TTL to auto-cleanup
    pipeline.expire(key, config.windowSeconds + 1);

    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) || 0;

    if (currentCount >= config.maxRequests) {
      // Get oldest entry to calculate retry-after
      const oldestEntries = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldestEntries.length >= 2 ? parseInt(oldestEntries[1], 10) : now;
      const retryAfter = Math.ceil((oldestTimestamp + config.windowSeconds * 1000 - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        limit: config.maxRequests,
        resetAt: Math.ceil((now + config.windowSeconds * 1000) / 1000),
        retryAfter: Math.max(1, retryAfter),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      limit: config.maxRequests,
      resetAt: Math.ceil((now + config.windowSeconds * 1000) / 1000),
    };
  } catch (error) {
    console.error('[API Rate Limiter] Redis error:', error);
    // Fail open — don't block requests if Redis is down
    return {
      allowed: true,
      remaining: config.maxRequests,
      limit: config.maxRequests,
      resetAt: Math.ceil((now + config.windowSeconds * 1000) / 1000),
    };
  }
}

/**
 * Extract client IP from request headers.
 * Handles proxied requests (X-Forwarded-For, X-Real-IP).
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP (client IP in XFF chain)
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // Fallback
  return '127.0.0.1';
}

/**
 * Middleware helper: Check rate limit and return 429 if exceeded.
 * Use at the start of API route handlers.
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await enforceApiRateLimit(request, 'auth-login');
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // ... rest of handler
 * }
 * ```
 */
export async function enforceApiRateLimit(
  request: NextRequest,
  configName: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result = await checkApiRateLimit(ip, configName);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter || 60),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null; // Allowed
}
