'use server';

/**
 * Razorpay Admin Server Actions
 * 
 * Fetch real payment data from Razorpay API for admin dashboard.
 * Uses Razorpay's REST API with Basic Auth.
 */

import { isAdmin as checkIsAdmin } from '@/lib/access-control';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

// ============================================================================
// Types
// ============================================================================

export interface RazorpayPaymentItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  email: string;
  contact: string;
  orderId: string;
  description: string;
  createdAt: number;
  capturedAt: number | null;
  refundStatus: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  card: {
    last4: string;
    network: string;
    type: string;
  } | null;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  errorCode: string | null;
  errorDescription: string | null;
}

export interface RazorpayOrderItem {
  id: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  receipt: string;
  status: string;
  notes: Record<string, string>;
  createdAt: number;
}

export interface RazorpayTransactionStats {
  totalPayments: number;
  totalRevenue: number;
  capturedPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  averageOrderValue: number;
  successRate: number;
  revenueByDay: Array<{ date: string; revenue: number; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; count: number }>;
  paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
}

export interface RazorpayDashboardData {
  stats: RazorpayTransactionStats;
  recentPayments: RazorpayPaymentItem[];
  allPayments: RazorpayPaymentItem[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthHeader(): string {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

async function verifyAdmin(email: string): Promise<boolean> {
  return checkIsAdmin(email);
}

// ============================================================================
// Razorpay API Functions
// ============================================================================

/**
 * Fetch all payments from Razorpay API
 */
async function fetchRazorpayPayments(count: number = 100, skip: number = 0): Promise<RazorpayPaymentItem[]> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay credentials not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${RAZORPAY_API_BASE}/payments?count=${count}&skip=${skip}`,
      {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('Razorpay API error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    const items = data.items || [];

    return items.map((payment: Record<string, unknown>) => ({
      id: payment.id as string,
      amount: (payment.amount as number) || 0,
      currency: (payment.currency as string) || 'INR',
      status: (payment.status as string) || 'unknown',
      method: (payment.method as string) || 'unknown',
      email: (payment.email as string) || '',
      contact: (payment.contact as string) || '',
      orderId: (payment.order_id as string) || '',
      description: (payment.description as string) || '',
      createdAt: (payment.created_at as number) || 0,
      capturedAt: (payment.captured_at as number) || null,
      refundStatus: (payment.refund_status as string) || null,
      bank: (payment.bank as string) || null,
      wallet: (payment.wallet as string) || null,
      vpa: (payment.vpa as string) || null,
      card: payment.card ? {
        last4: ((payment.card as Record<string, unknown>).last4 as string) || '',
        network: ((payment.card as Record<string, unknown>).network as string) || '',
        type: ((payment.card as Record<string, unknown>).type as string) || '',
      } : null,
      notes: (payment.notes as Record<string, string>) || {},
      fee: (payment.fee as number) || 0,
      tax: (payment.tax as number) || 0,
      errorCode: (payment.error_code as string) || null,
      errorDescription: (payment.error_description as string) || null,
    }));
  } catch (error) {
    console.error('Error fetching Razorpay payments:', error);
    return [];
  }
}

/**
 * Fetch a single payment by ID
 */
export async function fetchRazorpayPaymentById(
  adminEmail: string,
  paymentId: string
): Promise<{ success: boolean; data?: RazorpayPaymentItem; message?: string }> {
  try {
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return { success: false, message: 'Razorpay not configured' };
    }

    const response = await fetch(
      `${RAZORPAY_API_BASE}/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return { success: false, message: `Payment not found: ${paymentId}` };
    }

    const payment = await response.json();

    return {
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount || 0,
        currency: payment.currency || 'INR',
        status: payment.status || 'unknown',
        method: payment.method || 'unknown',
        email: payment.email || '',
        contact: payment.contact || '',
        orderId: payment.order_id || '',
        description: payment.description || '',
        createdAt: payment.created_at || 0,
        capturedAt: payment.captured_at || null,
        refundStatus: payment.refund_status || null,
        bank: payment.bank || null,
        wallet: payment.wallet || null,
        vpa: payment.vpa || null,
        card: payment.card ? {
          last4: payment.card.last4 || '',
          network: payment.card.network || '',
          type: payment.card.type || '',
        } : null,
        notes: payment.notes || {},
        fee: payment.fee || 0,
        tax: payment.tax || 0,
        errorCode: payment.error_code || null,
        errorDescription: payment.error_description || null,
      },
    };
  } catch (error) {
    console.error('Error fetching payment:', error);
    return { success: false, message: 'Failed to fetch payment details' };
  }
}

/**
 * Get all Razorpay transactions with analytics
 */
export async function getRazorpayTransactionsAction(
  adminEmail: string
): Promise<{ success: boolean; data?: RazorpayDashboardData; message?: string }> {
  try {
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    // Fetch all payments from Razorpay
    const allPayments = await fetchRazorpayPayments(100);

    // Calculate stats
    let totalRevenue = 0;
    let capturedPayments = 0;
    let failedPayments = 0;
    let pendingPayments = 0;
    let refundedPayments = 0;

    const revenueByDayMap: Record<string, { revenue: number; count: number }> = {};
    const revenueByMonthMap: Record<string, { revenue: number; count: number }> = {};
    const methodCountMap: Record<string, { count: number; amount: number }> = {};
    const statusCountMap: Record<string, number> = {};

    allPayments.forEach(payment => {
      const status = payment.status.toLowerCase();
      statusCountMap[status] = (statusCountMap[status] || 0) + 1;

      // Method breakdown
      const method = payment.method || 'unknown';
      if (!methodCountMap[method]) {
        methodCountMap[method] = { count: 0, amount: 0 };
      }
      methodCountMap[method].count++;

      if (status === 'captured') {
        const amountInRupees = payment.amount / 100;
        totalRevenue += amountInRupees;
        capturedPayments++;
        methodCountMap[method].amount += amountInRupees;

        // Group by day
        const date = new Date(payment.createdAt * 1000).toISOString().split('T')[0];
        if (!revenueByDayMap[date]) {
          revenueByDayMap[date] = { revenue: 0, count: 0 };
        }
        revenueByDayMap[date].revenue += amountInRupees;
        revenueByDayMap[date].count++;

        // Group by month
        const month = new Date(payment.createdAt * 1000).toISOString().slice(0, 7);
        if (!revenueByMonthMap[month]) {
          revenueByMonthMap[month] = { revenue: 0, count: 0 };
        }
        revenueByMonthMap[month].revenue += amountInRupees;
        revenueByMonthMap[month].count++;
      } else if (status === 'failed') {
        failedPayments++;
      } else if (status === 'refunded') {
        refundedPayments++;
      } else {
        pendingPayments++;
      }
    });

    const totalPayments = allPayments.length;
    const averageOrderValue = capturedPayments > 0 ? totalRevenue / capturedPayments : 0;
    const successRate = totalPayments > 0 ? (capturedPayments / totalPayments) * 100 : 0;

    // Convert maps to arrays
    const revenueByDay = Object.entries(revenueByDayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    const revenueByMonth = Object.entries(revenueByMonthMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const paymentMethodBreakdown = Object.entries(methodCountMap)
      .map(([method, data]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        ...data,
      }))
      .sort((a, b) => b.count - a.count);

    const statusBreakdown = Object.entries(statusCountMap)
      .map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalPayments > 0 ? Math.round((count / totalPayments) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        stats: {
          totalPayments,
          totalRevenue,
          capturedPayments,
          failedPayments,
          pendingPayments,
          refundedPayments,
          averageOrderValue,
          successRate,
          revenueByDay,
          revenueByMonth,
          paymentMethodBreakdown,
          statusBreakdown,
        },
        recentPayments: allPayments.slice(0, 10),
        allPayments,
      },
    };
  } catch (error) {
    console.error('Error fetching Razorpay transactions:', error);
    return { success: false, message: 'Failed to fetch transactions' };
  }
}

/**
 * Check if Razorpay is configured
 */
export async function checkRazorpayConfigAction(
  adminEmail: string
): Promise<{ success: boolean; configured: boolean; message?: string }> {
  try {
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return { success: false, configured: false, message: 'Unauthorized' };
    }

    const configured = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
    return { success: true, configured };
  } catch (error) {
    console.error('Error checking Razorpay config:', error);
    return { success: false, configured: false, message: 'Error checking configuration' };
  }
}
