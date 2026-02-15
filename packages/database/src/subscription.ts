/**
 * Subscription helpers for database layer
 * Manages tier lookups, feature access, and usage tracking via PostgreSQL
 */

import { prisma } from './client';

// ============ Tier Limits Configuration ============

export const TIER_LIMITS = {
  FREE: {
    aiCreditsPerDay: 5,
    dailyExports: 2,
    allowedFeatures: ['analyze-resume', 'improve-resume'] as string[],
    maxResumesStored: 1,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  PRO: {
    aiCreditsPerDay: 10,
    dailyExports: -1, // unlimited
    allowedFeatures: [
      'analyze-resume',
      'improve-resume',
      'generate-qa',
      'generate-questions',
      'parse-resume',
      'structure-job',
    ] as string[],
    maxResumesStored: 10,
    maxFileSize: 25 * 1024 * 1024, // 25MB
  },
} as const;

// ============ Helper Functions ============

function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// ============ Subscription Functions ============

/**
 * Get user subscription tier from PostgreSQL
 * Returns 'free' if no subscription exists or is expired
 */
export async function getUserTier(userId: string): Promise<'free' | 'pro'> {
  if (!userId) return 'free';

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return 'free';

    // Check if subscription is active
    if (subscription.status === 'ACTIVE') {
      // Check if still within billing period
      if (subscription.currentPeriodEnd) {
        if (subscription.currentPeriodEnd > new Date()) {
          return subscription.tier === 'PRO' ? 'pro' : 'free';
        }
        // Period expired
        return 'free';
      }
      // No period end set, trust the status
      return subscription.tier === 'PRO' ? 'pro' : 'free';
    }

    // Past due: give grace period
    if (subscription.status === 'PAST_DUE') {
      return subscription.tier === 'PRO' ? 'pro' : 'free';
    }

    // Cancelled but still in period
    if (subscription.status === 'CANCELLED' && subscription.currentPeriodEnd) {
      if (subscription.currentPeriodEnd > new Date()) {
        return subscription.tier === 'PRO' ? 'pro' : 'free';
      }
    }

    return 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Check if a feature is allowed for the user
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  const tier = await getUserTier(userId);
  const tierKey = tier === 'pro' ? 'PRO' : 'FREE';
  return TIER_LIMITS[tierKey].allowedFeatures.includes(feature);
}

/**
 * Assert feature is allowed - throws if not
 */
export async function assertFeatureAllowed(
  userId: string,
  feature: string
): Promise<void> {
  const allowed = await checkFeatureAccess(userId, feature);
  if (!allowed) {
    const error = new Error(
      `This feature requires a Pro subscription. Please upgrade to access it.`
    ) as Error & { code: string; upgradeRequired: boolean };
    error.code = 'PLAN_REQUIRED';
    error.upgradeRequired = true;
    throw error;
  }
}

/**
 * Get remaining AI credits for today
 */
export async function getRemainingCredits(
  userId: string,
  feature: string = 'ai'
): Promise<{ used: number; remaining: number; limit: number }> {
  const tier = await getUserTier(userId);
  const tierKey = tier === 'pro' ? 'PRO' : 'FREE';
  const limit = TIER_LIMITS[tierKey].aiCreditsPerDay;

  const today = getStartOfToday();

  // Sum all AI usage for today
  const usage = await prisma.usageRecord.aggregate({
    where: {
      userId,
      date: today,
      feature: {
        in: [
          'analyze-resume',
          'improve-resume',
          'generate-qa',
          'generate-questions',
          'generate-cover-letter',
          'parse-resume',
        ],
      },
    },
    _sum: { count: true },
  });

  const used = usage._sum.count || 0;
  const remaining = Math.max(0, limit - used);

  return { used, remaining, limit };
}

/**
 * Increment usage for a feature
 */
export async function incrementUsage(
  userId: string,
  feature: string
): Promise<number> {
  const today = getStartOfToday();

  const record = await prisma.usageRecord.upsert({
    where: {
      userId_feature_date: {
        userId,
        feature,
        date: today,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      userId,
      feature,
      count: 1,
      date: today,
    },
  });

  return record.count;
}

/**
 * Get daily export usage
 */
export async function getDailyExportUsage(
  userId: string
): Promise<{ count: number; limit: number; remaining: number }> {
  const tier = await getUserTier(userId);
  const tierKey = tier === 'pro' ? 'PRO' : 'FREE';
  const limit = TIER_LIMITS[tierKey].dailyExports;

  const today = getStartOfToday();

  const usage = await prisma.usageRecord.findUnique({
    where: {
      userId_feature_date: {
        userId,
        feature: 'export',
        date: today,
      },
    },
  });

  const count = usage?.count || 0;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - count);

  return { count, limit, remaining };
}

/**
 * Increment export usage
 */
export async function incrementExportUsage(userId: string): Promise<number> {
  return incrementUsage(userId, 'export');
}
