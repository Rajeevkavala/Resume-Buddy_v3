/**
 * Subscription types and tier configuration for SaaS platform
 * Free tier: Resume Analysis + Improvements only, 2 exports/day, 5 AI credits/day
 * Pro tier: All features, unlimited exports, 10 AI credits/day
 */

// ============ Subscription Tier Types ============

export type SubscriptionTier = 'free' | 'pro';

export type SubscriptionStatus = 
  | 'active'      // Subscription is active and paid
  | 'inactive'    // Never subscribed or expired
  | 'trialing'    // In trial period
  | 'past_due'    // Payment failed, grace period
  | 'canceled';   // User canceled (may still have access until period end)

export type PaymentProvider = 'razorpay' | 'stripe';

// ============ Firestore Document Schemas ============

/**
 * Subscription document stored at: subscriptions/{uid}
 */
export interface SubscriptionDoc {
  uid: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  
  // Payment provider linking
  provider?: PaymentProvider;
  
  // Razorpay-specific fields (one-time payment model)
  razorpayCustomerId?: string;
  razorpayOrderId?: string;      // Order ID for one-time payment
  razorpayPaymentId?: string;    // Payment ID after successful payment
  razorpaySubscriptionId?: string | null;  // Legacy - for subscription model
  razorpayPlanId?: string;
  razorpayStatus?: string;
  
  // Stripe-specific fields (for future)
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  
  // Billing period
  currentPeriodStart?: string | Date; // ISO date string or Date
  currentPeriodEnd?: string | Date | null;   // ISO date string or Date (Pro expires on this date)
  cancelAtPeriodEnd?: boolean;  // true = one-time payment (no auto-renewal)
  
  // Metadata
  createdAt: string | Date; // ISO date string or Date
  updatedAt: string | Date; // ISO date string or Date
}

/**
 * Export usage document stored at: usage/{uid}/exports/daily
 */
export interface DailyExportUsage {
  date: string;       // YYYY-MM-DD format
  count: number;
  updatedAt: string;  // ISO date string
}

/**
 * Payment record stored at: payments/{paymentId}
 */
export interface PaymentRecord {
  id: string;
  userId: string;
  provider: PaymentProvider;
  
  // Payment details
  amount: number;
  currency: string; // INR, USD
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Provider-specific IDs
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  
  // Subscription linking
  subscriptionId?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============ Tier Configuration ============

export interface TierLimits {
  // AI request limits
  dailyAICredits: number;
  monthlyAICredits: number;
  
  // Export limits (-1 = unlimited)
  dailyExports: number;
  
  // Feature access
  allowedFeatures: AIFeature[];
  
  // Template access
  exportTemplates: 'all' | 'basic';
  exportWatermark: boolean;
  
  // Storage
  maxResumesStored: number;
  
  // Support
  prioritySupport: boolean;
}

export type AIFeature = 
  | 'analyze-resume'
  | 'improve-resume'
  | 'generate-qa'
  | 'generate-questions'
  | 'parse-resume'
  | 'structure-job'
  | 'ai-interview';

/**
 * Tier limits configuration
 * Free: Limited features, 3 AI credits/day, 2 exports/day
 * Pro: All features, 10 AI credits/day, unlimited exports
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    dailyAICredits: 3,
    monthlyAICredits: 30,
    dailyExports: 2,
    allowedFeatures: ['analyze-resume', 'improve-resume'],
    exportTemplates: 'basic',
    exportWatermark: true,
    maxResumesStored: 1,
    prioritySupport: false,
  },
  pro: {
    dailyAICredits: 10,
    monthlyAICredits: 300,
    dailyExports: -1, // Unlimited
    allowedFeatures: [
      'analyze-resume',
      'improve-resume',
      'generate-qa',
      'generate-questions',
      'parse-resume',
      'structure-job',
      'ai-interview',
    ],
    exportTemplates: 'all',
    exportWatermark: false,
    maxResumesStored: 10,
    prioritySupport: true,
  },
};

// ============ Feature Gating ============

/**
 * Feature names for UI display
 */
export const FEATURE_DISPLAY_NAMES: Record<AIFeature, string> = {
  'analyze-resume': 'Resume Analysis',
  'improve-resume': 'Resume Improvements',
  'generate-qa': 'Q&A Preparation',
  'generate-questions': 'Interview Questions',
  'parse-resume': 'Resume Parsing',
  'structure-job': 'Job Description Structuring',
  'ai-interview': 'AI Interview',
};

/**
 * Features that require Pro tier
 */
export const PRO_ONLY_FEATURES: AIFeature[] = [
  'generate-qa',
  'generate-questions',
  'ai-interview',
];

// ============ Pricing Configuration ============

export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  
  // Pricing
  priceINR: number;       // Price in INR (paise for Razorpay)
  priceUSD: number;       // Price in USD (cents for Stripe)
  interval: 'month' | 'year';
  
  // Razorpay Plan ID
  razorpayPlanId?: string;
  
  // Display
  features: string[];
  highlighted?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    priceINR: 0,
    priceUSD: 0,
    interval: 'month',
    features: [
      'Resume Analysis',
      'Resume Improvements',
      '2 PDF Exports per day',
      '5 AI Credits per day',
      'Basic templates',
    ],
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    tier: 'pro',
    priceINR: 79900, // ₹799 in paise
    priceUSD: 999,   // $9.99 in cents
    interval: 'month',
    razorpayPlanId: process.env.RAZORPAY_PLAN_ID_PRO,
    features: [
      'Everything in Free',
      'Q&A Preparation',
      'Interview Questions',
      'AI Interview (Live Voice)',
      'Unlimited PDF Exports',
      '10 AI Credits per day',
      'All premium templates',
      'No watermarks',
      'Priority support',
    ],
    highlighted: true,
  },
];

// ============ Helper Types ============

/**
 * Result of checking feature access
 */
export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentTier?: SubscriptionTier;
  requiredTier?: SubscriptionTier;
}

/**
 * Result of checking usage limits
 */
export interface UsageLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  limitType: 'daily' | 'monthly';
}

/**
 * Aggregated subscription status for frontend
 */
export interface SubscriptionState {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  
  // Usage tracking
  dailyAICreditsUsed: number;
  dailyAICreditsRemaining: number;
  dailyExportsUsed: number;
  dailyExportsRemaining: number;
  
  // Limits
  limits: TierLimits;
  
  // Billing
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  
  // Timestamps
  resetAt: Date;
}
