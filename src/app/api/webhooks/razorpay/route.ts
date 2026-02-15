/**
 * Razorpay Webhook Handler
 * 
 * Handles one-time payment events from Razorpay:
 * - order.paid: Payment successful, activate Pro for 30 days
 * - payment.captured: Payment captured (alternative event)
 * - payment.failed: Payment failed
 * 
 * This is a backup for client-side verification.
 * The primary flow uses verifyPaymentAction on the client after checkout.
 * 
 * Webhook URL to configure in Razorpay Dashboard:
 * https://your-domain.com/api/webhooks/razorpay
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  calculateProExpiry,
} from '@/lib/payments/razorpay';
import { updateSubscription, getSubscription } from '@/lib/subscription-service';

// Disable body parsing - we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature({ body, signature })) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = parseWebhookPayload(body);
    if (!payload) {
      console.error('Failed to parse Razorpay webhook payload');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    console.log(`Razorpay webhook received: ${payload.event}`);

    // Handle payment events
    switch (payload.event) {
      case 'order.paid':
        if (payload.payload.order) {
          await handleOrderPaid(payload.payload.order.entity);
        }
        break;

      case 'payment.captured':
        if (payload.payload.payment) {
          await handlePaymentCaptured(payload.payload.payment.entity);
        }
        break;

      case 'payment.failed':
        if (payload.payload.payment) {
          console.log(`Payment failed: ${payload.payload.payment.entity.id}`);
          // No action needed - user will see error on frontend
        }
        break;

      default:
        console.log(`Unhandled event: ${payload.event}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    // Return 500 so Razorpay retries the webhook
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle order.paid event
 * Activates Pro for 30 days
 */
async function handleOrderPaid(order: {
  id: string;
  status: string;
  notes: Record<string, string>;
}) {
  const userId = order.notes?.user_id;

  if (!userId) {
    console.error('No user_id in order notes:', order.id);
    return;
  }

  // Check if already activated (client-side may have handled it)
  const existing = await getSubscription(userId);
  if (existing?.razorpayOrderId === order.id && existing.tier === 'pro') {
    console.log(`Order ${order.id} already processed for user ${userId}`);
    return;
  }

  const expiryDate = calculateProExpiry();
  const now = new Date();

  await updateSubscription(userId, {
    tier: 'pro',
    status: 'active',
    provider: 'razorpay',
    razorpayOrderId: order.id,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: expiryDate.toISOString(),
    cancelAtPeriodEnd: true, // No auto-renewal
    updatedAt: now.toISOString(),
  });

  console.log(`✅ Webhook: Activated Pro for user ${userId} until ${expiryDate.toISOString()}`);
}

/**
 * Handle payment.captured event
 * Alternative to order.paid
 */
async function handlePaymentCaptured(payment: {
  id: string;
  order_id: string;
  status: string;
  notes: Record<string, string>;
}) {
  const userId = payment.notes?.user_id;

  if (!userId) {
    // Try to get user_id from order (may need to fetch order)
    console.log(`No user_id in payment notes, order: ${payment.order_id}`);
    return;
  }

  // Check if already activated
  const existing = await getSubscription(userId);
  if (existing?.razorpayPaymentId === payment.id && existing.tier === 'pro') {
    console.log(`Payment ${payment.id} already processed for user ${userId}`);
    return;
  }

  const expiryDate = calculateProExpiry();
  const now = new Date();

  await updateSubscription(userId, {
    tier: 'pro',
    status: 'active',
    provider: 'razorpay',
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: expiryDate.toISOString(),
    cancelAtPeriodEnd: true, // No auto-renewal
    updatedAt: now.toISOString(),
  });

  console.log(`✅ Webhook: Activated Pro for user ${userId} until ${expiryDate.toISOString()}`);
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Razorpay webhook endpoint is active',
    events: ['order.paid', 'payment.captured', 'payment.failed'],
  });
}
