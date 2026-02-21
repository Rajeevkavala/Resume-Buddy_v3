/**
 * Subscription Service — PostgreSQL-backed (Phase 2)
 * Handles subscription management, tier lookups, and feature access control
 * 
 * PostgreSQL tables:
 * - subscriptions - Subscription records per user
 * - usage_records - Daily usage tracking per feature
 */

import { prisma } from '@/lib/db';
import { getRedisClient, isRedisAvailableSync } from '@/lib/redis';
import {
  type SubscriptionTier,
  type SubscriptionStatus,
  type AIFeature,
  type FeatureAccessResult,
  type UsageLimitResult,
  type SubscriptionState,
  type DailyExportUsage,
  TIER_LIMITS,
  PRO_ONLY_FEATURES,
  FEATURE_DISPLAY_NAMES,
} from './types/subscription';

// ============ Subscription Tier Cache ============
// Caches tier lookup in Redis for TIER_CACHE_TTL seconds to avoid
// a DB query on every authenticated request.
const TIER_CACHE_PREFIX = 'sub_tier:';
const TIER_CACHE_TTL = 300; // 5 minutes

async function getCachedTier(userId: string): Promise<SubscriptionTier | null> {
  if (!isRedisAvailableSync()) return null;
  try {
    const cached = await getRedisClient().get(`${TIER_CACHE_PREFIX}${userId}`);
    return cached ? (cached as SubscriptionTier) : null;
  } catch {
    return null;
  }
}

async function setCachedTier(userId: string, tier: SubscriptionTier): Promise<void> {
  if (!isRedisAvailableSync()) return;
  try {
    await getRedisClient().setex(`${TIER_CACHE_PREFIX}${userId}`, TIER_CACHE_TTL, tier);
  } catch {
    // non-critical
  }
}

/**
 * Invalidate the cached subscription tier for a user.
 * Call this whenever a subscription is updated/cancelled.
 */
export async function invalidateSubscriptionCache(userId: string): Promise<void> {
  if (!isRedisAvailableSync()) return;
  try {
    await getRedisClient().del(`${TIER_CACHE_PREFIX}${userId}`);
  } catch {
    // non-critical
  }
}

// ============ Date Utilities ============

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

function getNextMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// ============ Subscription CRUD ============

/**
 * Get user's subscription from PostgreSQL
 */
export async function getSubscription(userId: string) {
  if (!userId) return null;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Get user's subscription tier.
 * Returns 'free' if no subscription exists or is expired.
 * Result is cached in Redis for 5 minutes to avoid repeated DB queries.
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  if (!userId) return 'free';

  // Fast path: Redis cache
  const cachedTier = await getCachedTier(userId);
  if (cachedTier !== null) return cachedTier;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    let tier: SubscriptionTier = 'free';

    if (subscription) {
      // Check if subscription is active
      if (subscription.status === 'ACTIVE') {
        if (subscription.currentPeriodEnd) {
          if (subscription.currentPeriodEnd > new Date()) {
            tier = subscription.tier === 'PRO' ? 'pro' : 'free';
          }
          // else expired → free
        } else {
          tier = subscription.tier === 'PRO' ? 'pro' : 'free';
        }
      } else if (subscription.status === 'PAST_DUE') {
        // Grace period
        tier = subscription.tier === 'PRO' ? 'pro' : 'free';
      } else if (subscription.status === 'CANCELLED' && subscription.currentPeriodEnd) {
        if (subscription.currentPeriodEnd > new Date()) {
          tier = subscription.tier === 'PRO' ? 'pro' : 'free';
        }
      }
    }

    // Cache the result before returning
    await setCachedTier(userId, tier);
    return tier;
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Create or update subscription
 */
export async function updateSubscription(
  userId: string,
  data: {
    tier?: 'free' | 'pro';
    status?: string;
    provider?: string;
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpayPlanId?: string;
    currentPeriodStart?: string | Date;
    currentPeriodEnd?: string | Date | null;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: string | Date;
    updatedAt?: string | Date;
    [key: string]: unknown;
  }
): Promise<void> {
  if (!userId) throw new Error('User ID is required');

  try {
    // Map to Prisma-compatible types
    const prismaData: Record<string, unknown> = {};

    if (data.tier !== undefined) {
      prismaData.tier = data.tier === 'pro' ? 'PRO' : 'FREE';
    }
    if (data.status !== undefined) {
      const statusMap: Record<string, string> = {
        active: 'ACTIVE',
        expired: 'EXPIRED',
        cancelled: 'CANCELLED',
        canceled: 'CANCELLED',
        inactive: 'EXPIRED',
        past_due: 'PAST_DUE',
        trialing: 'ACTIVE',
      };
      prismaData.status = statusMap[data.status] || 'ACTIVE';
    }
    if (data.razorpayCustomerId !== undefined) prismaData.razorpayCustomerId = data.razorpayCustomerId;
    if (data.razorpaySubscriptionId !== undefined) prismaData.razorpaySubscriptionId = data.razorpaySubscriptionId;
    if (data.razorpayOrderId !== undefined) prismaData.razorpayOrderId = data.razorpayOrderId;
    if (data.razorpayPaymentId !== undefined) prismaData.razorpayPaymentId = data.razorpayPaymentId;
    if (data.currentPeriodStart !== undefined) {
      prismaData.currentPeriodStart = data.currentPeriodStart ? new Date(data.currentPeriodStart as string) : null;
    }
    if (data.currentPeriodEnd !== undefined) {
      prismaData.currentPeriodEnd = data.currentPeriodEnd ? new Date(data.currentPeriodEnd as string) : null;
    }
    if (data.cancelAtPeriodEnd !== undefined) prismaData.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    if (data.cancelledAt !== undefined) {
      prismaData.cancelledAt = data.cancelledAt ? new Date(data.cancelledAt as string) : null;
    }

    await prisma.subscription.upsert({
      where: { userId },
      update: prismaData,
      create: {
        userId,
        tier: (prismaData.tier as 'FREE' | 'PRO') || 'FREE',
        status: (prismaData.status as 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE') || 'ACTIVE',
        razorpayCustomerId: prismaData.razorpayCustomerId as string | undefined,
        razorpaySubscriptionId: prismaData.razorpaySubscriptionId as string | undefined,
        razorpayOrderId: prismaData.razorpayOrderId as string | undefined,
        razorpayPaymentId: prismaData.razorpayPaymentId as string | undefined,
        currentPeriodStart: prismaData.currentPeriodStart as Date | undefined,
        currentPeriodEnd: prismaData.currentPeriodEnd as Date | undefined,
        cancelAtPeriodEnd: (prismaData.cancelAtPeriodEnd as boolean) || false,
        cancelledAt: prismaData.cancelledAt as Date | undefined,
      },
    });

    // Invalidate cached tier so the next getUserTier() reads fresh data
    await invalidateSubscriptionCache(userId);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Could not update subscription');
  }
}

/**
 * Activate Pro subscription after successful payment
 */
export async function activateProSubscription(
  userId: string,
  provider: 'razorpay' | 'stripe',
  providerData: {
    customerId?: string;
    subscriptionId?: string;
    planId?: string;
    periodStart?: string;
    periodEnd?: string;
  }
): Promise<void> {
  const now = new Date();

  const updateData: Record<string, unknown> = {
    tier: 'pro',
    status: 'active',
    currentPeriodStart: providerData.periodStart || now.toISOString(),
    currentPeriodEnd: providerData.periodEnd,
    cancelAtPeriodEnd: false,
  };

  if (provider === 'razorpay') {
    updateData.razorpayCustomerId = providerData.customerId;
    updateData.razorpaySubscriptionId = providerData.subscriptionId;
  }

  await updateSubscription(userId, updateData);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await updateSubscription(userId, {
    cancelAtPeriodEnd: true,
    status: 'canceled',
    cancelledAt: new Date().toISOString(),
  });
}

/**
 * Downgrade to free tier (immediate)
 */
export async function downgradeToFree(userId: string): Promise<void> {
  await updateSubscription(userId, {
    tier: 'free',
    status: 'expired',
    cancelAtPeriodEnd: false,
  });
}

/**
 * Find subscription by Razorpay subscription ID
 */
export async function getSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
  if (!razorpaySubscriptionId) return null;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { razorpaySubscriptionId },
    });
    return subscription;
  } catch (error) {
    console.error('Error finding subscription by Razorpay ID:', error);
    return null;
  }
}

// ============ Feature Access Control ============

export function isFeatureAllowed(tier: SubscriptionTier, feature: AIFeature): boolean {
  const limits = TIER_LIMITS[tier];
  return limits.allowedFeatures.includes(feature);
}

export async function checkFeatureAccess(
  userId: string,
  feature: AIFeature
): Promise<FeatureAccessResult> {
  const tier = await getUserTier(userId);
  const allowed = isFeatureAllowed(tier, feature);

  if (allowed) {
    return { allowed: true, currentTier: tier };
  }

  return {
    allowed: false,
    reason: `${FEATURE_DISPLAY_NAMES[feature]} requires a Pro subscription`,
    upgradeRequired: true,
    currentTier: tier,
    requiredTier: 'pro',
  };
}

export async function assertFeatureAllowed(
  userId: string,
  feature: AIFeature
): Promise<SubscriptionTier> {
  const result = await checkFeatureAccess(userId, feature);

  if (!result.allowed) {
    const error = new Error(result.reason || 'Feature not available') as Error & {
      code: string;
      upgradeRequired: boolean;
      currentTier: SubscriptionTier;
    };
    error.code = 'PLAN_REQUIRED';
    error.upgradeRequired = true;
    error.currentTier = result.currentTier || 'free';
    throw error;
  }

  return result.currentTier || 'free';
}

// ============ Export Usage Tracking ============

export async function getDailyExportUsage(userId: string): Promise<DailyExportUsage> {
  if (!userId) {
    return { date: getCurrentDateString(), count: 0, updatedAt: new Date().toISOString() };
  }

  try {
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

    return {
      date: getCurrentDateString(),
      count: usage?.count || 0,
      updatedAt: usage?.createdAt.toISOString() || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting export usage:', error);
    return { date: getCurrentDateString(), count: 0, updatedAt: new Date().toISOString() };
  }
}

export async function incrementDailyExportUsage(userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    const today = getStartOfToday();

    const record = await prisma.usageRecord.upsert({
      where: {
        userId_feature_date: {
          userId,
          feature: 'export',
          date: today,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        feature: 'export',
        count: 1,
        date: today,
      },
    });

    return record.count;
  } catch (error) {
    console.error('Error incrementing export usage:', error);
    throw new Error('Could not track export usage');
  }
}

export async function checkExportLimit(userId: string): Promise<UsageLimitResult> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier];

  if (limits.dailyExports === -1) {
    return {
      allowed: true,
      used: 0,
      limit: -1,
      remaining: -1,
      resetAt: getNextMidnight(),
      limitType: 'daily',
    };
  }

  const usage = await getDailyExportUsage(userId);
  const remaining = Math.max(0, limits.dailyExports - usage.count);

  return {
    allowed: usage.count < limits.dailyExports,
    used: usage.count,
    limit: limits.dailyExports,
    remaining,
    resetAt: getNextMidnight(),
    limitType: 'daily',
  };
}

export async function enforceExportLimit(userId: string): Promise<void> {
  const result = await checkExportLimit(userId);

  if (!result.allowed) {
    const resetTime = result.resetAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const error = new Error(
      `Daily export limit reached! You've used all ${result.limit} exports for today. ` +
      `Your limit resets at ${resetTime}. Upgrade to Pro for unlimited exports.`
    ) as Error & {
      code: string;
      remaining: number;
      resetAt: Date;
      upgradeRequired: boolean;
    };
    error.code = 'EXPORT_LIMIT_EXCEEDED';
    error.remaining = 0;
    error.resetAt = result.resetAt;
    error.upgradeRequired = true;
    throw error;
  }

  // Increment usage after allowing
  await incrementDailyExportUsage(userId);
}

// ============ Aggregated Subscription State ============

export async function getSubscriptionState(userId: string): Promise<SubscriptionState> {
  const [subscription, exportUsage] = await Promise.all([
    getSubscription(userId),
    getDailyExportUsage(userId),
  ]);

  let tier: SubscriptionTier = 'free';
  let status: SubscriptionStatus = 'inactive';

  if (subscription) {
    tier = subscription.tier === 'PRO' ? 'pro' : 'free';
    const statusMap: Record<string, SubscriptionStatus> = {
      ACTIVE: 'active',
      EXPIRED: 'inactive',
      CANCELLED: 'canceled',
      PAST_DUE: 'past_due',
    };
    status = statusMap[subscription.status] || 'inactive';

    // Check if still within billing period for canceled/past_due
    if ((status === 'canceled' || status === 'past_due') && subscription.currentPeriodEnd) {
      if (subscription.currentPeriodEnd < new Date()) {
        tier = 'free';
        status = 'inactive';
      }
    }
  }

  const limits = TIER_LIMITS[tier];
  const resetAt = getNextMidnight();

  // Get AI usage from UsageRecord table
  let dailyAICreditsUsed = 0;
  try {
    const today = getStartOfToday();
    const aiFeatures = [
      'analyze-resume',
      'improve-resume',
      'generate-qa',
      'generate-questions',
      'generate-cover-letter',
      'parse-resume',
    ];

    const usage = await prisma.usageRecord.aggregate({
      where: {
        userId,
        date: today,
        feature: { in: aiFeatures },
      },
      _sum: { count: true },
    });

    dailyAICreditsUsed = usage._sum.count || 0;
  } catch (error) {
    console.error('Error fetching AI usage:', error);
  }

  const dailyAICreditsRemaining = Math.max(0, limits.dailyAICredits - dailyAICreditsUsed);
  const dailyExportsUsed = exportUsage.count;
  const dailyExportsRemaining = limits.dailyExports === -1
    ? -1
    : Math.max(0, limits.dailyExports - dailyExportsUsed);

  return {
    tier,
    status,
    dailyAICreditsUsed,
    dailyAICreditsRemaining,
    dailyExportsUsed,
    dailyExportsRemaining,
    limits,
    currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
    resetAt,
  };
}

// ============ Helpers ============

export function getDailyAILimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].dailyAICredits;
}

export async function isProUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === 'pro';
}
