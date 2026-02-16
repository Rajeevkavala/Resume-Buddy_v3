import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  isOnCooldown,
  getCooldownRemaining,
  isBlocked,
  clearOTP,
  getRedis,
} from '@resumebuddy/auth';

// OTP tests require a running Redis instance
let redisAvailable = false;

beforeAll(async () => {
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    redisAvailable = pong === 'PONG';
  } catch {
    console.warn('Redis not available, skipping OTP tests');
    redisAvailable = false;
  }
});

afterAll(async () => {
  if (!redisAvailable) return;
  // Cleanup test OTP keys
  try {
    const redis = getRedis();
    const keys = await redis.keys('otp:*:test-otp-*');
    const cooldownKeys = await redis.keys('otp_cooldown:*:test-otp-*');
    const blockKeys = await redis.keys('otp_block:*:test-otp-*');
    const allKeys = [...keys, ...cooldownKeys, ...blockKeys];
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }
  } catch {
    // Ignore cleanup errors
  }
});

describe('OTP System', () => {
  describe('generateOTP', () => {
    it('should generate 6-digit OTP by default', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate OTP of specified length', () => {
      const otp4 = generateOTP(4);
      expect(otp4).toHaveLength(4);
      expect(/^\d{4}$/.test(otp4)).toBe(true);

      const otp8 = generateOTP(8);
      expect(otp8).toHaveLength(8);
      expect(/^\d{8}$/.test(otp8)).toBe(true);
    });

    it('should pad with zeros if needed', () => {
      // Generate many OTPs - at least some should have leading zeros
      const otps = Array.from({ length: 100 }, () => generateOTP(6));
      // All should be exactly 6 chars
      otps.forEach((otp) => expect(otp).toHaveLength(6));
    });
  });

  describe('storeOTP', () => {
    it('should store OTP in Redis with TTL', async () => {
      if (!redisAvailable) return;

      const result = await storeOTP('test-otp-store@example.com', 'email', 'login');
      expect(result.code).toBeDefined();
      expect(result.code).toHaveLength(6);
      expect(result.expiresIn).toBe(300); // Default 5 min
    });

    it('should set cooldown after storing', async () => {
      if (!redisAvailable) return;

      await storeOTP('test-otp-cooldown@example.com', 'email', 'login');
      const onCooldown = await isOnCooldown('test-otp-cooldown@example.com', 'email');
      expect(onCooldown).toBe(true);
    });
  });

  describe('verifyOTP', () => {
    it('should verify correct OTP', async () => {
      if (!redisAvailable) return;

      const { code } = await storeOTP('test-otp-verify@example.com', 'email', 'login');
      const result = await verifyOTP('test-otp-verify@example.com', 'email', code);
      expect(result.success).toBe(true);
      expect(result.message).toContain('verified');
    });

    it('should reject incorrect OTP and decrement attempts', async () => {
      if (!redisAvailable) return;

      await storeOTP('test-otp-wrong@example.com', 'email', 'login');
      const result = await verifyOTP('test-otp-wrong@example.com', 'email', '000000');
      expect(result.success).toBe(false);
      expect(result.attemptsRemaining).toBeDefined();
    });

    it('should return failure for expired/non-existent OTP', async () => {
      if (!redisAvailable) return;

      const result = await verifyOTP('test-otp-noexist@example.com', 'email', '123456');
      expect(result.success).toBe(false);
    });

    it('should clear OTP after successful verification', async () => {
      if (!redisAvailable) return;

      const { code } = await storeOTP('test-otp-clear@example.com', 'email', 'login');
      await verifyOTP('test-otp-clear@example.com', 'email', code);

      // Trying to verify again should fail
      const result = await verifyOTP('test-otp-clear@example.com', 'email', code);
      expect(result.success).toBe(false);
    });

    it('should block after max attempts', async () => {
      if (!redisAvailable) return;

      const dest = 'test-otp-block@example.com';
      await storeOTP(dest, 'email', 'login');

      // Exhaust attempts (default max = 3)
      await verifyOTP(dest, 'email', '111111');
      await verifyOTP(dest, 'email', '222222');
      const lastResult = await verifyOTP(dest, 'email', '333333');

      expect(lastResult.success).toBe(false);
      expect(lastResult.attemptsRemaining).toBe(0);

      // Should be blocked now
      const blocked = await isBlocked(dest, 'email');
      expect(blocked).toBe(true);
    });
  });

  describe('cooldown', () => {
    it('should enforce cooldown between sends', async () => {
      if (!redisAvailable) return;

      const dest = 'test-otp-cd@example.com';
      await storeOTP(dest, 'email', 'login');

      const onCooldown = await isOnCooldown(dest, 'email');
      expect(onCooldown).toBe(true);

      const remaining = await getCooldownRemaining(dest, 'email');
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60); // Default cooldown is 60s
    });

    it('should return 0 remaining for no cooldown', async () => {
      if (!redisAvailable) return;

      const remaining = await getCooldownRemaining('test-otp-no-cd@example.com', 'email');
      expect(remaining).toBe(0);
    });
  });

  describe('clearOTP', () => {
    it('should clear OTP data from Redis', async () => {
      if (!redisAvailable) return;

      const dest = 'test-otp-cleartest@example.com';
      const { code } = await storeOTP(dest, 'email', 'login');

      await clearOTP(dest, 'email');

      const result = await verifyOTP(dest, 'email', code);
      expect(result.success).toBe(false);
    });
  });
});
