'use server';

/**
 * Payment Server Actions
 * 
 * Server actions for Razorpay one-time payment integration.
 * Payment Model: ₹99 for 30 days Pro access (student-friendly, no auto-debit)
 * 
 * These actions handle:
 * - Creating payment orders
 * - Verifying payments after checkout
 * - Activating Pro access for 30 days
 */

import {
  createProOrder,
  createProOrderWithPrice,
  verifyPayment,
  getOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
  calculateProExpiry,
  PRO_PRICE_INR,
  PRO_DURATION_DAYS,
  type CreateOrderInput,
} from '@/lib/payments/razorpay';
import { 
  getSubscription as getFirestoreSubscription,
  updateSubscription,
  getUserTier,
} from '@/lib/subscription-service';
import { getActivePriceAction } from './admin-settings';
import type { SubscriptionDoc } from '@/lib/types/subscription';

// ============================================================================
// Types
// ============================================================================

/** Map Prisma Subscription to SubscriptionDoc for frontend compatibility */
function toSubscriptionDoc(sub: {
  userId: string;
  tier: string;
  status: string;
  razorpayCustomerId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySubscriptionId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SubscriptionDoc {
  return {
    uid: sub.userId,
    tier: sub.tier === 'PRO' ? 'pro' : 'free',
    status: sub.status === 'ACTIVE' ? 'active' 
      : sub.status === 'CANCELLED' ? 'canceled'
      : sub.status === 'PAST_DUE' ? 'past_due'
      : 'inactive',
    provider: 'razorpay',
    razorpayCustomerId: sub.razorpayCustomerId ?? undefined,
    razorpayOrderId: sub.razorpayOrderId ?? undefined,
    razorpayPaymentId: sub.razorpayPaymentId ?? undefined,
    razorpaySubscriptionId: sub.razorpaySubscriptionId ?? undefined,
    currentPeriodStart: sub.currentPeriodStart?.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}

export interface CreateOrderResult {
  success?: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  prefill?: {
    email: string;
    name?: string;
    contact?: string;
  };
  theme?: {
    color: string;
    backdrop_color: string;
  };
  error?: string;
}

export interface VerifyPaymentResult {
  success?: boolean;
  tier?: 'pro';
  expiresAt?: string;
  error?: string;
}

export interface SubscriptionInfoResult {
  subscription?: SubscriptionDoc | null;
  razorpayKeyId?: string;
  priceINR?: number;
  durationDays?: number;
  error?: string;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new Razorpay order for Pro purchase
 * Uses dynamic pricing from admin settings
 * Returns order details for Razorpay Checkout
 */
export async function createOrderAction(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    if (!isRazorpayConfigured()) {
      return { error: 'Payment gateway not configured. Please contact support.' };
    }

    if (!input.userId || !input.email) {
      return { error: 'User ID and email are required' };
    }

    // Get dynamic pricing from settings
    const priceResult = await getActivePriceAction();
    const pricePaise = priceResult.success && priceResult.data 
      ? priceResult.data.pricePaise 
      : 9900; // Fallback to ₹99
    const durationDays = priceResult.success && priceResult.data
      ? priceResult.data.durationDays
      : 30;

    // Check if user already has active Pro
    const currentTier = await getUserTier(input.userId);
    const subscription = await getFirestoreSubscription(input.userId);
    
    if (currentTier === 'pro' && subscription?.currentPeriodEnd) {
      const expiryDate = new Date(subscription.currentPeriodEnd);
      if (expiryDate > new Date()) {
        const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { 
          error: `You already have Pro access! ${daysLeft} days remaining.` 
        };
      }
    }

    // Create new order with dynamic price
    const orderResponse = await createProOrderWithPrice(input, pricePaise, durationDays);

    return {
      success: true,
      orderId: orderResponse.orderId,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      keyId: orderResponse.keyId,
      prefill: orderResponse.prefill,
      theme: orderResponse.theme,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    };
  }
}

/**
 * Verify payment after Razorpay Checkout completes
 * This activates Pro access for 30 days
 */
export async function verifyPaymentAction(
  userId: string,
  orderId: string,
  paymentId: string,
  signature: string
): Promise<VerifyPaymentResult> {
  try {
    if (!userId || !orderId || !paymentId || !signature) {
      return { error: 'Missing payment verification details' };
    }

    // Verify signature
    const isValid = verifyPayment({ orderId, paymentId, signature });
    
    if (!isValid) {
      console.error('Invalid payment signature:', { orderId, paymentId });
      return { error: 'Payment verification failed. Please contact support.' };
    }

    // Double-check order status with Razorpay
    const order = await getOrder(orderId);
    if (order.status !== 'paid') {
      return { error: 'Payment not completed. Please try again.' };
    }

    // Verify user ID matches the order
    if (order.notes.user_id !== userId) {
      console.error('User ID mismatch:', { orderUserId: order.notes.user_id, requestUserId: userId });
      return { error: 'Payment verification failed. User mismatch.' };
    }

    // Calculate expiry (30 days from now)
    const expiryDate = calculateProExpiry();
    const now = new Date();

    // Activate Pro in Firestore
    await updateSubscription(userId, {
      tier: 'pro',
      status: 'active',
      provider: 'razorpay',
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: expiryDate.toISOString(),
      cancelAtPeriodEnd: true, // Will auto-expire (no auto-renewal)
      updatedAt: now.toISOString(),
    });

    console.log(`✅ Activated Pro for user ${userId} until ${expiryDate.toISOString()}`);

    return {
      success: true,
      tier: 'pro',
      expiresAt: expiryDate.toISOString(),
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to verify payment' 
    };
  }
}

/**
 * Get user's subscription info and pricing details
 * Uses dynamic pricing from admin settings
 * If userId is empty, returns just pricing info (for public pricing page)
 */
export async function getSubscriptionInfoAction(
  userId: string
): Promise<SubscriptionInfoResult> {
  try {
    // Get dynamic pricing from settings (always available)
    const priceResult = await getActivePriceAction();
    const priceINR = priceResult.success && priceResult.data 
      ? priceResult.data.priceINR 
      : PRO_PRICE_INR;
    const durationDays = priceResult.success && priceResult.data
      ? priceResult.data.durationDays
      : PRO_DURATION_DAYS;
    
    // If no userId, return just pricing info (for public pricing page)
    if (!userId) {
      return {
        subscription: null,
        razorpayKeyId: getRazorpayKeyId(),
        priceINR,
        durationDays,
      };
    }

    const sub = await getFirestoreSubscription(userId);
    
    return {
      subscription: sub ? toSubscriptionDoc(sub) : null,
      razorpayKeyId: getRazorpayKeyId(),
      priceINR,
      durationDays,
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to get subscription info' 
    };
  }
}

/**
 * Check if user's Pro access is still valid
 */
export async function checkProStatusAction(userId: string): Promise<{
  isPro: boolean;
  expiresAt?: string;
  daysRemaining?: number;
}> {
  try {
    if (!userId) {
      return { isPro: false };
    }

    const tier = await getUserTier(userId);
    
    if (tier !== 'pro') {
      return { isPro: false };
    }

    const subscription = await getFirestoreSubscription(userId);
    
    if (!subscription?.currentPeriodEnd) {
      return { isPro: true };
    }

    const expiryDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    
    if (expiryDate <= now) {
      // Expired, downgrade
      await updateSubscription(userId, {
        tier: 'free',
        status: 'inactive',
      });
      return { isPro: false };
    }

    // Use calendar day difference for accurate day counting
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endDateCopy = new Date(expiryDate);
    endDateCopy.setHours(0, 0, 0, 0);
    const daysRemaining = Math.max(0, Math.round((endDateCopy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      isPro: true,
      expiresAt: expiryDate.toISOString(),
      daysRemaining,
    };
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return { isPro: false };
  }
}

/**
 * Extend Pro access (for renewals - creates new order)
 */
export async function renewProAction(input: CreateOrderInput): Promise<CreateOrderResult> {
  // Same as createOrderAction but allows renewal even if Pro is active
  try {
    if (!isRazorpayConfigured()) {
      return { error: 'Payment gateway not configured.' };
    }

    if (!input.userId || !input.email) {
      return { error: 'User ID and email are required' };
    }

    const orderResponse = await createProOrder(input);

    return {
      success: true,
      orderId: orderResponse.orderId,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      keyId: orderResponse.keyId,
      prefill: orderResponse.prefill,
      theme: orderResponse.theme,
    };
  } catch (error) {
    console.error('Error creating renewal order:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to create renewal order' 
    };
  }
}
