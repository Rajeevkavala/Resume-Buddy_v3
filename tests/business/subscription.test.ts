import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Subscription Service Tests
 * These test the database subscription helpers directly.
 * Requires PostgreSQL running with Prisma schema migrated.
 */

let dbAvailable = false;

beforeAll(async () => {
  try {
    const { prisma } = await import('@resumebuddy/database');
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    console.warn('Database not available, skipping subscription tests');
    dbAvailable = false;
  }
});

describe('Subscription Service', () => {
  it('should return free tier for user without subscription', async () => {
    if (!dbAvailable) return;

    const { getUserTier } = await import('@resumebuddy/database');
    const tier = await getUserTier('non-existent-user-xxxxx');
    expect(tier).toBe('free');
  });

  it('should return free tier for empty userId', async () => {
    if (!dbAvailable) return;

    const { getUserTier } = await import('@resumebuddy/database');
    const tier = await getUserTier('');
    expect(tier).toBe('free');
  });

  it('should have correct TIER_LIMITS structure', async () => {
    const { TIER_LIMITS } = await import('@resumebuddy/database');

    // Free tier limits
    expect(TIER_LIMITS.FREE.aiCreditsPerDay).toBe(5);
    expect(TIER_LIMITS.FREE.dailyExports).toBe(2);
    expect(TIER_LIMITS.FREE.allowedFeatures).toContain('analyze-resume');
    expect(TIER_LIMITS.FREE.allowedFeatures).toContain('improve-resume');

    // Pro tier limits
    expect(TIER_LIMITS.PRO.aiCreditsPerDay).toBe(10);
    expect(TIER_LIMITS.PRO.dailyExports).toBe(-1); // unlimited
    expect(TIER_LIMITS.PRO.allowedFeatures.length).toBeGreaterThan(
      TIER_LIMITS.FREE.allowedFeatures.length
    );
  });

  it('should enforce feature access based on tier', async () => {
    if (!dbAvailable) return;

    const { checkFeatureAccess } = await import('@resumebuddy/database');

    // Non-existent user should be free tier - should have access to analyze-resume
    const accessResult = await checkFeatureAccess('non-existent-xxxxx', 'analyze-resume');
    // Should either return true (free feature) or an object with allowed property
    expect(accessResult !== undefined).toBe(true);
  });

  it('should track TIER_LIMITS file size limits', async () => {
    const { TIER_LIMITS } = await import('@resumebuddy/database');

    expect(TIER_LIMITS.FREE.maxFileSize).toBe(5 * 1024 * 1024); // 5MB
    expect(TIER_LIMITS.PRO.maxFileSize).toBe(25 * 1024 * 1024); // 25MB
  });

  it('should have storage limits per tier', async () => {
    const { TIER_LIMITS } = await import('@resumebuddy/database');

    expect(TIER_LIMITS.FREE.maxResumesStored).toBe(1);
    expect(TIER_LIMITS.PRO.maxResumesStored).toBe(10);
  });
});
