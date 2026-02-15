/**
 * Subscription Service
 * Handles subscription management, tier lookups, and feature access control
 * 
 * Firestore collections:
 * - subscriptions/{uid} - Subscription documents
 * - usage/{uid}/exports/daily - Daily export usage
 */

import { doc, getDoc, setDoc, updateDoc, runTransaction, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import {
  type SubscriptionTier,
  type SubscriptionDoc,
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

// ============ Date Utilities ============

/**
 * Get current date string in YYYY-MM-DD format
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

// ============ Subscription CRUD ============

/**
 * Get user's subscription document from Firestore
 * Returns null if no subscription exists (treat as free tier)
 */
export async function getSubscription(userId: string): Promise<SubscriptionDoc | null> {
  if (!userId) return null;
  
  try {
    const subRef = doc(db, 'subscriptions', userId);
    const subSnap = await getDoc(subRef);
    
    if (subSnap.exists()) {
      return subSnap.data() as SubscriptionDoc;
    }
    return null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Get user's subscription tier
 * Returns 'free' if no subscription exists or subscription is inactive
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  if (!userId) return 'free';
  
  try {
    const subscription = await getSubscription(userId);
    
    if (!subscription) {
      return 'free';
    }
    
    // Check if subscription is active
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      // Check if still within billing period
      if (subscription.currentPeriodEnd) {
        const periodEnd = new Date(subscription.currentPeriodEnd);
        if (periodEnd > new Date()) {
          return subscription.tier;
        }
      } else {
        // No period end set, trust the status
        return subscription.tier;
      }
    }
    
    // Past due: give grace period (still return tier)
    if (subscription.status === 'past_due') {
      return subscription.tier;
    }
    
    // Canceled but still in period
    if (subscription.status === 'canceled' && subscription.currentPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      if (periodEnd > new Date()) {
        return subscription.tier;
      }
    }
    
    return 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    // Fail closed - return free tier on error
    return 'free';
  }
}

/**
 * Create or update subscription document
 */
export async function updateSubscription(
  userId: string,
  data: Partial<SubscriptionDoc>
): Promise<void> {
  if (!userId) throw new Error('User ID is required');
  
  try {
    const subRef = doc(db, 'subscriptions', userId);
    const now = new Date().toISOString();
    
    const subSnap = await getDoc(subRef);
    
    if (subSnap.exists()) {
      // Update existing
      await updateDoc(subRef, {
        ...data,
        updatedAt: now,
      });
    } else {
      // Create new
      await setDoc(subRef, {
        uid: userId,
        tier: 'free',
        status: 'inactive',
        createdAt: now,
        updatedAt: now,
        ...data,
      });
    }
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
  const now = new Date().toISOString();
  
  const updateData: Partial<SubscriptionDoc> = {
    tier: 'pro',
    status: 'active',
    provider,
    currentPeriodStart: providerData.periodStart || now,
    currentPeriodEnd: providerData.periodEnd,
    cancelAtPeriodEnd: false,
    updatedAt: now,
  };
  
  if (provider === 'razorpay') {
    updateData.razorpayCustomerId = providerData.customerId;
    updateData.razorpaySubscriptionId = providerData.subscriptionId;
    updateData.razorpayPlanId = providerData.planId;
  }
  
  await updateSubscription(userId, updateData);
}

/**
 * Cancel subscription (will expire at period end)
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await updateSubscription(userId, {
    cancelAtPeriodEnd: true,
    status: 'canceled',
  });
}

/**
 * Downgrade to free tier (immediate)
 */
export async function downgradeToFree(userId: string): Promise<void> {
  await updateSubscription(userId, {
    tier: 'free',
    status: 'inactive',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: undefined,
  });
}

/**
 * Find subscription by Razorpay subscription ID
 * Used by webhook handlers to find which user a subscription belongs to
 */
export async function getSubscriptionByRazorpayId(
  razorpaySubscriptionId: string
): Promise<(SubscriptionDoc & { uid: string }) | null> {
  if (!razorpaySubscriptionId) return null;
  
  try {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('razorpaySubscriptionId', '==', razorpaySubscriptionId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const docSnap = querySnapshot.docs[0];
    return {
      ...(docSnap.data() as SubscriptionDoc),
      uid: docSnap.id,
    };
  } catch (error) {
    console.error('Error finding subscription by Razorpay ID:', error);
    return null;
  }
}

// ============ Feature Access Control ============

/**
 * Check if a feature is allowed for the given tier
 */
export function isFeatureAllowed(tier: SubscriptionTier, feature: AIFeature): boolean {
  const limits = TIER_LIMITS[tier];
  return limits.allowedFeatures.includes(feature);
}

/**
 * Check if user can access a specific feature
 * Returns detailed result with reason if denied
 */
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

/**
 * Assert feature access - throws if not allowed
 * Use in server actions for gating
 */
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

/**
 * Get daily export usage from Firestore
 */
export async function getDailyExportUsage(userId: string): Promise<DailyExportUsage> {
  if (!userId) {
    return { date: getCurrentDateString(), count: 0, updatedAt: new Date().toISOString() };
  }
  
  try {
    const usageRef = doc(db, 'usage', userId, 'exports', 'daily');
    const usageSnap = await getDoc(usageRef);
    
    if (usageSnap.exists()) {
      const data = usageSnap.data() as DailyExportUsage;
      const today = getCurrentDateString();
      
      // Reset if it's a new day
      if (data.date !== today) {
        return { date: today, count: 0, updatedAt: new Date().toISOString() };
      }
      
      return data;
    }
    
    return { date: getCurrentDateString(), count: 0, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Error getting export usage:', error);
    return { date: getCurrentDateString(), count: 0, updatedAt: new Date().toISOString() };
  }
}

/**
 * Increment daily export usage (with transaction for race condition prevention)
 * Returns the new count
 */
export async function incrementDailyExportUsage(userId: string): Promise<number> {
  if (!userId) return 0;
  
  try {
    const usageRef = doc(db, 'usage', userId, 'exports', 'daily');
    const today = getCurrentDateString();
    const now = new Date().toISOString();
    
    const newCount = await runTransaction(db, async (tx) => {
      const usageSnap = await tx.get(usageRef);
      
      let currentCount = 0;
      if (usageSnap.exists()) {
        const data = usageSnap.data() as DailyExportUsage;
        if (data.date === today) {
          currentCount = data.count;
        }
      }
      
      const nextCount = currentCount + 1;
      
      tx.set(usageRef, {
        date: today,
        count: nextCount,
        updatedAt: now,
      });
      
      return nextCount;
    });
    
    return newCount;
  } catch (error) {
    console.error('Error incrementing export usage:', error);
    throw new Error('Could not track export usage');
  }
}

/**
 * Check and enforce daily export limit
 * Returns result with remaining exports
 */
export async function checkExportLimit(userId: string): Promise<UsageLimitResult> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier];
  
  // Unlimited exports for pro
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

/**
 * Enforce export limit - throws if exceeded
 * Also increments usage if allowed
 */
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

/**
 * Get full subscription state for frontend
 * Includes tier, usage, limits, and billing info
 */
export async function getSubscriptionState(userId: string): Promise<SubscriptionState> {
  const [subscription, exportUsage] = await Promise.all([
    getSubscription(userId),
    getDailyExportUsage(userId),
  ]);
  
  // Determine effective tier
  let tier: SubscriptionTier = 'free';
  let status: SubscriptionStatus = 'inactive';
  
  if (subscription) {
    tier = subscription.tier;
    status = subscription.status;
    
    // Check if still within billing period for canceled/past_due
    if ((status === 'canceled' || status === 'past_due') && subscription.currentPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      if (periodEnd < new Date()) {
        tier = 'free';
        status = 'inactive';
      }
    }
  }
  
  const limits = TIER_LIMITS[tier];
  const resetAt = getNextMidnight();
  
  // Get AI usage from user profile (reuse existing tracking)
  // We'll fetch this from the existing apiUsage field
  let dailyAICreditsUsed = 0;
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const apiUsage = userData.apiUsage || {};
      const today = getCurrentDateString();
      if (apiUsage.dailyDate === today) {
        dailyAICreditsUsed = apiUsage.dailyCount || 0;
      }
    }
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
    currentPeriodEnd: subscription?.currentPeriodEnd 
      ? (typeof subscription.currentPeriodEnd === 'string' 
          ? subscription.currentPeriodEnd 
          : subscription.currentPeriodEnd instanceof Date 
            ? subscription.currentPeriodEnd.toISOString() 
            : undefined)
      : undefined,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
    resetAt,
  };
}

// ============ Tier-Aware Rate Limiting ============

/**
 * Get daily AI credit limit for a tier
 */
export function getDailyAILimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].dailyAICredits;
}

/**
 * Check if user is on Pro tier (helper for quick checks)
 */
export async function isProUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === 'pro';
}
