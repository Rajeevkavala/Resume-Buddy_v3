// ============ Redis-Backed OTP Store ============
// Redis key patterns:
// otp:{channel}:{destination} → Hash { code, attempts, purpose, createdAt }
// otp_cooldown:{channel}:{destination} → "1" (TTL-based cooldown)
// otp_block:{channel}:{destination} → "1" (temporary block after too many failures)

import { randomInt } from 'crypto';
import { getRedis } from '../session';
import { DEFAULT_OTP_CONFIG, type OTPChannel, type OTPPurpose, type OTPConfig, type OTPResult } from './types';

// ============ Key Helpers ============

function otpKey(channel: OTPChannel, destination: string): string {
  return `otp:${channel}:${destination}`;
}

function cooldownKey(channel: OTPChannel, destination: string): string {
  return `otp_cooldown:${channel}:${destination}`;
}

function blockKey(channel: OTPChannel, destination: string): string {
  return `otp_block:${channel}:${destination}`;
}

// ============ OTP Generation ============

/**
 * Generate a cryptographically random numeric OTP of the given length.
 */
export function generateOTP(length: number = 6): string {
  const max = Math.pow(10, length);
  const code = randomInt(0, max);
  return code.toString().padStart(length, '0');
}

// ============ Store OTP ============

/**
 * Generate and store an OTP in Redis with TTL.
 * Returns the generated OTP code.
 */
export async function storeOTP(
  destination: string,
  channel: OTPChannel,
  purpose: OTPPurpose,
  config: OTPConfig = DEFAULT_OTP_CONFIG
): Promise<{ code: string; expiresIn: number }> {
  const redis = getRedis();
  const code = generateOTP(config.length);
  const key = otpKey(channel, destination);

  // Store as Redis hash
  await redis.hset(key, {
    code,
    attempts: '0',
    purpose,
    createdAt: Date.now().toString(),
  });

  // Set TTL for auto-expiry
  await redis.expire(key, config.expirySeconds);

  // Set cooldown to prevent rapid resends
  const cdKey = cooldownKey(channel, destination);
  await redis.set(cdKey, '1', 'EX', config.cooldownSeconds);

  return { code, expiresIn: config.expirySeconds };
}

// ============ Verify OTP ============

/**
 * Verify an OTP code. Returns result with success status and remaining attempts.
 */
export async function verifyOTP(
  destination: string,
  channel: OTPChannel,
  code: string,
  config: OTPConfig = DEFAULT_OTP_CONFIG
): Promise<OTPResult> {
  const redis = getRedis();
  const key = otpKey(channel, destination);

  // Check if blocked
  const blocked = await isBlocked(destination, channel);
  if (blocked) {
    return {
      success: false,
      message: 'Too many failed attempts. Please try again later.',
      attemptsRemaining: 0,
    };
  }

  // Get stored OTP data
  const data = await redis.hgetall(key);
  if (!data || !data.code) {
    return {
      success: false,
      message: 'OTP expired or not found. Please request a new code.',
      attemptsRemaining: 0,
    };
  }

  const attempts = parseInt(data.attempts || '0', 10);

  // Check if code matches
  if (data.code === code) {
    // Success — clear OTP
    await clearOTP(destination, channel);
    return {
      success: true,
      message: 'OTP verified successfully.',
    };
  }

  // Wrong code — increment attempts
  const newAttempts = attempts + 1;
  await redis.hset(key, 'attempts', newAttempts.toString());

  const remaining = config.maxAttempts - newAttempts;

  if (remaining <= 0) {
    // Max attempts exceeded — block the destination
    await blockDestination(destination, channel);
    await clearOTP(destination, channel);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please try again in 15 minutes.',
      attemptsRemaining: 0,
    };
  }

  return {
    success: false,
    message: 'Invalid verification code.',
    attemptsRemaining: remaining,
  };
}

// ============ Cooldown ============

/**
 * Check if a resend cooldown is active for this destination+channel.
 */
export async function isOnCooldown(destination: string, channel: OTPChannel): Promise<boolean> {
  const redis = getRedis();
  const key = cooldownKey(channel, destination);
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Get remaining cooldown seconds.
 */
export async function getCooldownRemaining(destination: string, channel: OTPChannel): Promise<number> {
  const redis = getRedis();
  const key = cooldownKey(channel, destination);
  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : 0;
}

// ============ Blocking ============

/**
 * Block a destination for 15 minutes after too many failed attempts.
 */
export async function blockDestination(destination: string, channel: OTPChannel): Promise<void> {
  const redis = getRedis();
  const key = blockKey(channel, destination);
  await redis.set(key, '1', 'EX', 900); // 15 minutes
}

/**
 * Check if a destination is temporarily blocked.
 */
export async function isBlocked(destination: string, channel: OTPChannel): Promise<boolean> {
  const redis = getRedis();
  const key = blockKey(channel, destination);
  const exists = await redis.exists(key);
  return exists === 1;
}

// ============ Cleanup ============

/**
 * Clear OTP data for a destination+channel (after successful verification).
 */
export async function clearOTP(destination: string, channel: OTPChannel): Promise<void> {
  const redis = getRedis();
  const key = otpKey(channel, destination);
  await redis.del(key);
}
