/**
 * Razorpay Payment Integration
 * 
 * This module handles Razorpay one-time payment operations:
 * - Creating payment orders (one-time, ₹99/month)
 * - Verifying payment signatures
 * - Managing Pro activation (30 days from payment)
 * 
 * Payment Model: One-time payment for 30-day Pro access
 * Target: Students - affordable, no auto-debit
 * 
 * Environment variables required:
 * - RAZORPAY_KEY_ID: Your Razorpay Key ID
 * - RAZORPAY_KEY_SECRET: Your Razorpay Key Secret
 * - RAZORPAY_WEBHOOK_SECRET: Secret for webhook signature verification
 */

import crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Pro plan pricing (in paise - 500 = ₹5 for testing)
export const PRO_PRICE_PAISE = 500;
export const PRO_PRICE_INR = 5;
export const PRO_DURATION_DAYS = 30;

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

// ============================================================================
// Types
// ============================================================================

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  method: string;
  email: string;
  contact: string;
  notes: Record<string, string>;
  created_at: number;
}

export interface CreateOrderInput {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  prefill: {
    email: string;
    name?: string;
    contact?: string;
  };
  theme: {
    color: string;
    backdrop_color: string;
  };
  notes: Record<string, string>;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    order?: {
      entity: RazorpayOrder;
    };
    payment?: {
      entity: RazorpayPayment;
    };
  };
  created_at: number;
}

export interface VerifySignatureInput {
  body: string;
  signature: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthHeader(): string {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

async function razorpayRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${RAZORPAY_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Razorpay API error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

// ============================================================================
// Order Management (One-Time Payments)
// ============================================================================

/**
 * Create a new order for one-time Pro purchase (₹99 for 30 days)
 * Returns order details for Razorpay Checkout
 */
export async function createProOrder(
  input: CreateOrderInput
): Promise<CreateOrderResponse> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  // Receipt must be <= 40 chars. Use last 8 chars of userId + base36 timestamp
  const shortUserId = input.userId.slice(-8);
  const shortTimestamp = Date.now().toString(36);
  const receipt = `pro_${shortUserId}_${shortTimestamp}`;

  const order = await razorpayRequest<RazorpayOrder>('/orders', 'POST', {
    amount: PRO_PRICE_PAISE, // ₹99 in paise
    currency: 'INR',
    receipt,
    notes: {
      user_id: input.userId,
      email: input.email,
      name: input.name || '',
      plan: 'pro_monthly',
      duration_days: String(PRO_DURATION_DAYS),
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
    prefill: {
      email: input.email,
      name: input.name,
      contact: input.phone,
    },
    theme: {
      // Modern theme matching ResumeBuddy
      color: '#7c3aed', // Primary purple
      backdrop_color: 'rgba(0, 0, 0, 0.7)',
    },
    notes: order.notes,
  };
}

/**
 * Create a new order with dynamic pricing from admin settings
 * Returns order details for Razorpay Checkout
 */
export async function createProOrderWithPrice(
  input: CreateOrderInput,
  pricePaise: number,
  durationDays: number
): Promise<CreateOrderResponse> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  // Receipt must be <= 40 chars. Use last 8 chars of userId + base36 timestamp
  const shortUserId = input.userId.slice(-8);
  const shortTimestamp = Date.now().toString(36);
  const receipt = `pro_${shortUserId}_${shortTimestamp}`;

  const order = await razorpayRequest<RazorpayOrder>('/orders', 'POST', {
    amount: pricePaise,
    currency: 'INR',
    receipt,
    notes: {
      user_id: input.userId,
      email: input.email,
      name: input.name || '',
      plan: 'pro_monthly',
      duration_days: String(durationDays),
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
    prefill: {
      email: input.email,
      name: input.name,
      contact: input.phone,
    },
    theme: {
      color: '#7c3aed',
      backdrop_color: 'rgba(0, 0, 0, 0.7)',
    },
    notes: order.notes,
  };
}

/**
 * Get order details by ID
 */
export async function getOrder(orderId: string): Promise<RazorpayOrder> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  return razorpayRequest<RazorpayOrder>(`/orders/${orderId}`);
}

/**
 * Get payment details by ID
 */
export async function getPayment(paymentId: string): Promise<RazorpayPayment> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  return razorpayRequest<RazorpayPayment>(`/payments/${paymentId}`);
}

/**
 * Verify payment signature from Razorpay Checkout
 * This confirms the payment is genuine and not tampered
 */
export function verifyPayment(input: VerifyPaymentInput): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    console.error('Razorpay key secret not configured');
    return false;
  }

  try {
    const body = `${input.orderId}|${input.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(input.signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Payment signature verification failed:', error);
    return false;
  }
}

/**
 * Calculate Pro expiry date (30 days from now)
 */
export function calculateProExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + PRO_DURATION_DAYS);
  return expiry;
}

// ============================================================================
// Webhook Signature Verification
// ============================================================================

/**
 * Verify Razorpay webhook signature
 * 
 * Razorpay signs webhooks with HMAC-SHA256 using your webhook secret.
 * The signature is sent in the `X-Razorpay-Signature` header.
 */
export function verifyWebhookSignature(input: VerifySignatureInput): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error('Razorpay webhook secret not configured');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(input.body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(input.signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Parse and validate webhook payload
 */
export function parseWebhookPayload(body: string): RazorpayWebhookPayload | null {
  try {
    return JSON.parse(body) as RazorpayWebhookPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// Checkout Configuration
// ============================================================================

/**
 * Get Razorpay Checkout options for the frontend
 * Modern themed to match ResumeBuddy design
 */
export function getCheckoutConfig(orderResponse: CreateOrderResponse) {
  return {
    key: orderResponse.keyId,
    amount: orderResponse.amount,
    currency: orderResponse.currency,
    name: 'ResumeBuddy',
    description: `Pro Access - ${PRO_DURATION_DAYS} Days`,
    order_id: orderResponse.orderId,
    prefill: orderResponse.prefill,
    notes: orderResponse.notes,
    theme: orderResponse.theme,
    modal: {
      ondismiss: () => {
        console.log('Payment modal closed');
      },
      escape: true,
      animation: true,
    },
    // Modern UI options
    config: {
      display: {
        language: 'en',
        hide: [
          { method: 'wallet' }, // Hide wallets for simplicity
        ],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
  };
}

/**
 * Format price for display
 */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

// ============================================================================
// Configuration Check
// ============================================================================

/**
 * Check if Razorpay is properly configured
 */
export function isRazorpayConfigured(): boolean {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

/**
 * Get Razorpay Key ID (safe to expose to frontend)
 */
export function getRazorpayKeyId(): string {
  return RAZORPAY_KEY_ID;
}
