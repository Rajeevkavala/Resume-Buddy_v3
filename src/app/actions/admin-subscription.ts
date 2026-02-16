'use server';

/**
 * Admin Subscription Management Server Actions — Prisma/PostgreSQL based
 * Manage user subscriptions, upgrade/downgrade Pro access, view stats
 */

import { prisma } from '@/lib/db';
import type { SubscriptionTier } from '@/lib/types/subscription';
import { isAdmin as checkIsAdmin } from '@/lib/access-control';
import { logAdminAction } from '@/lib/admin';

// ============================================================================
// Types
// ============================================================================

export interface UserWithSubscription {
  uid: string;
  email: string;
  displayName: string;
  tier: SubscriptionTier;
  proExpiresAt: string | null;
  daysRemaining: number;
  totalPayments: number;
  lastPayment: string | null;
  createdAt: string | null;
}

export interface SubscriptionStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  expiringSoon: number;
  totalRevenue: number;
  conversionRate: string;
}

export interface RecentPayment {
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amount: number;
  status: string;
  createdAt: string;
  userId: string;
  userEmail?: string;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageOrderValue: number;
  revenueByDay: Array<{ date: string; revenue: number; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; count: number }>;
  paymentStatusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  recentPayments: RecentPayment[];
  allPayments: RecentPayment[];
}

// ============================================================================
// Helpers
// ============================================================================

async function verifyAdmin(email: string): Promise<boolean> {
  return checkIsAdmin(email);
}

async function logAction(adminEmail: string, action: string, targetUserId: string, details: Record<string, unknown>) {
  try {
    await logAdminAction({
      adminId: adminEmail,
      adminEmail,
      action,
      targetUserId,
      details,
    });
  } catch (e) {
    console.error('Error logging admin action:', e);
  }
}

// ============================================================================
// Read Operations
// ============================================================================

export async function getAllUsersWithSubscriptionsAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  data?: UserWithSubscription[];
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized - Admin access required' };

    const users = await prisma.user.findMany({
      include: {
        subscription: true,
        payments: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const data: UserWithSubscription[] = users.map((u) => {
      let tier: SubscriptionTier = 'free';
      let proExpiresAt: string | null = null;
      let daysRemaining = 0;

      if (u.subscription?.tier === 'PRO' && u.subscription.currentPeriodEnd) {
        const end = new Date(u.subscription.currentPeriodEnd);
        if (end > now) {
          tier = 'pro';
          proExpiresAt = end.toISOString();
          const today = new Date(now); today.setHours(0, 0, 0, 0);
          const endDay = new Date(end); endDay.setHours(0, 0, 0, 0);
          daysRemaining = Math.max(0, Math.round((endDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }

      return {
        uid: u.id,
        email: u.email,
        displayName: u.name || 'N/A',
        tier,
        proExpiresAt,
        daysRemaining,
        totalPayments: u.payments.length,
        lastPayment: u.payments[0]?.createdAt.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      };
    });

    data.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === 'pro' ? -1 : 1;
      return (a.displayName || '').localeCompare(b.displayName || '');
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching users with subscriptions:', error);
    return { success: false, message: 'Failed to fetch users' };
  }
}

export async function getSubscriptionStatsAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  data?: SubscriptionStats;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, proSubs, expiringSoonSubs, revenueAgg] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({
        where: { tier: 'PRO', status: 'ACTIVE', currentPeriodEnd: { gt: now } },
      }),
      prisma.subscription.count({
        where: { tier: 'PRO', status: 'ACTIVE', currentPeriodEnd: { gt: now, lte: sevenDaysLater } },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0) / 100;

    return {
      success: true,
      data: {
        totalUsers,
        proUsers: proSubs,
        freeUsers: totalUsers - proSubs,
        expiringSoon: expiringSoonSubs,
        totalRevenue,
        conversionRate: totalUsers > 0 ? ((proSubs / totalUsers) * 100).toFixed(1) : '0',
      },
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return { success: false, message: 'Failed to fetch stats' };
  }
}

export async function getRecentPaymentsAction(
  adminEmail: string,
  limit: number = 10
): Promise<{ success: boolean; message?: string; data?: RecentPayment[] }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { email: true } } },
    });

    return {
      success: true,
      data: payments.map((p) => ({
        razorpayPaymentId: p.razorpayPaymentId ?? undefined,
        razorpayOrderId: p.razorpayOrderId ?? undefined,
        amount: Number(p.amount),
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        userId: p.userId,
        userEmail: p.user.email,
      })),
    };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return { success: false, message: 'Failed to fetch payments' };
  }
}

export async function getPaymentAnalyticsAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  data?: PaymentAnalytics;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };

    const allPayments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });

    let totalRevenue = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    let pendingTransactions = 0;
    const statusCounts: Record<string, number> = {};
    const revenueByDayMap: Record<string, { revenue: number; count: number }> = {};
    const revenueByMonthMap: Record<string, { revenue: number; count: number }> = {};

    const mapped: RecentPayment[] = allPayments.map((p) => {
      const status = p.status.toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const amountNum = Number(p.amount);
      if (['completed', 'captured', 'success'].includes(status)) {
        const amountInRupees = amountNum / 100;
        totalRevenue += amountInRupees;
        successfulTransactions++;

        const date = p.createdAt.toISOString().split('T')[0];
        if (!revenueByDayMap[date]) revenueByDayMap[date] = { revenue: 0, count: 0 };
        revenueByDayMap[date].revenue += amountInRupees;
        revenueByDayMap[date].count++;

        const month = p.createdAt.toISOString().slice(0, 7);
        if (!revenueByMonthMap[month]) revenueByMonthMap[month] = { revenue: 0, count: 0 };
        revenueByMonthMap[month].revenue += amountInRupees;
        revenueByMonthMap[month].count++;
      } else if (status === 'failed') {
        failedTransactions++;
      } else {
        pendingTransactions++;
      }

      return {
        razorpayPaymentId: p.razorpayPaymentId ?? undefined,
        razorpayOrderId: p.razorpayOrderId ?? undefined,
        amount: amountNum,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        userId: p.userId,
        userEmail: p.user.email,
      };
    });

    const totalTransactions = mapped.length;
    const averageOrderValue = successfulTransactions > 0 ? totalRevenue / successfulTransactions : 0;

    const revenueByDay = Object.entries(revenueByDayMap)
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    const revenueByMonth = Object.entries(revenueByMonthMap)
      .map(([month, d]) => ({ month, ...d }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const paymentStatusBreakdown = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalTransactions > 0 ? Math.round((count / totalTransactions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        totalRevenue, totalTransactions, successfulTransactions, failedTransactions,
        pendingTransactions, averageOrderValue, revenueByDay, revenueByMonth,
        paymentStatusBreakdown, recentPayments: mapped.slice(0, 10), allPayments: mapped,
      },
    };
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    return { success: false, message: 'Failed to fetch payment analytics' };
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

export async function adminUpgradeUserToProAction(
  adminEmail: string,
  userId: string,
  durationDays: number = 30,
  reason: string = 'Admin grant'
): Promise<{ success: boolean; message: string; expiresAt?: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };

    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      },
      create: {
        userId,
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      },
    });

    await logAction(adminEmail, 'upgrade_to_pro', userId, { durationDays, reason });
    return { success: true, message: `User upgraded to Pro for ${durationDays} days`, expiresAt: endDate.toISOString() };
  } catch (error) {
    console.error('Error upgrading user:', error);
    return { success: false, message: 'Failed to upgrade user' };
  }
}

export async function adminDowngradeUserToFreeAction(
  adminEmail: string,
  userId: string,
  reason: string = 'Admin action'
): Promise<{ success: boolean; message: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };

    await prisma.subscription.updateMany({
      where: { userId },
      data: { tier: 'FREE', status: 'EXPIRED', currentPeriodEnd: null },
    });

    await logAction(adminEmail, 'downgrade_to_free', userId, { reason });
    return { success: true, message: 'User downgraded to Free tier' };
  } catch (error) {
    console.error('Error downgrading user:', error);
    return { success: false, message: 'Failed to downgrade user' };
  }
}

export async function adminExtendProAction(
  adminEmail: string,
  userId: string,
  additionalDays: number,
  reason: string = 'Admin extension'
): Promise<{ success: boolean; message: string; newExpiresAt?: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };

    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return { success: false, message: 'User has no subscription record' };

    let baseDate = new Date();
    if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > baseDate) {
      baseDate = new Date(sub.currentPeriodEnd);
    }

    const newEndDate = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { userId },
      data: { tier: 'PRO', status: 'ACTIVE', currentPeriodEnd: newEndDate },
    });

    await logAction(adminEmail, 'extend_pro', userId, { additionalDays, reason });
    return { success: true, message: `Pro extended by ${additionalDays} days`, newExpiresAt: newEndDate.toISOString() };
  } catch (error) {
    console.error('Error extending subscription:', error);
    return { success: false, message: 'Failed to extend subscription' };
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

export async function adminBulkUpgradeAction(
  adminEmail: string,
  userIds: string[],
  durationDays: number = 30,
  reason: string = 'Bulk admin upgrade'
): Promise<{ success: boolean; message: string; successCount?: number; failedCount?: number }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };
    if (!userIds.length) return { success: false, message: 'No users specified' };

    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    let successCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      try {
        await prisma.subscription.upsert({
          where: { userId },
          update: { tier: 'PRO', status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: endDate },
          create: { userId, tier: 'PRO', status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: endDate },
        });
        successCount++;
      } catch { failedCount++; }
    }

    await logAction(adminEmail, 'bulk_upgrade_to_pro', 'multiple', { userCount: userIds.length, successCount, failedCount, durationDays, reason });
    return { success: true, message: `Upgraded ${successCount} users (${failedCount} failed)`, successCount, failedCount };
  } catch (error) {
    console.error('Error in bulk upgrade:', error);
    return { success: false, message: 'Bulk upgrade failed' };
  }
}

export async function adminAddUserWithProAction(
  adminEmail: string,
  userEmail: string,
  displayName: string,
  durationDays: number = 30,
  reason: string = 'Admin manual add'
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };
    if (!userEmail || !userEmail.includes('@')) return { success: false, message: 'Invalid email' };

    const normalizedEmail = userEmail.toLowerCase().trim();
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        name: displayName || normalizedEmail.split('@')[0],
        passwordHash: '',
      },
    });

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { tier: 'PRO', status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: endDate },
      create: { userId: user.id, tier: 'PRO', status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: endDate },
    });

    await logAction(adminEmail, 'add_user_with_pro', user.id, { userEmail: normalizedEmail, displayName, durationDays, reason });
    return { success: true, message: `Added ${normalizedEmail} with ${durationDays} days Pro`, userId: user.id };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, message: 'Failed to add user' };
  }
}

export async function adminBulkAddUsersAction(
  adminEmail: string,
  usersData: Array<{ email: string; displayName?: string }>,
  durationDays: number = 30,
  reason: string = 'Bulk admin add'
): Promise<{ success: boolean; message: string; successCount?: number; failedCount?: number; skippedCount?: number }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };
    if (!usersData.length) return { success: false, message: 'No users provided' };

    let successCount = 0, failedCount = 0, skippedCount = 0;
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    for (const ud of usersData) {
      if (!ud.email || !ud.email.includes('@')) { skippedCount++; continue; }
      try {
        const email = ud.email.toLowerCase().trim();
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: ud.displayName || email.split('@')[0], passwordHash: '' },
        });
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: { tier: 'PRO', status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: endDate },
          create: { userId: user.id, tier: 'PRO', status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: endDate },
        });
        successCount++;
      } catch { failedCount++; }
    }

    await logAction(adminEmail, 'bulk_add_users', 'multiple', { userCount: usersData.length, successCount, failedCount, skippedCount, durationDays, reason });
    return { success: true, message: `Added ${successCount} users (${failedCount} failed, ${skippedCount} skipped)`, successCount, failedCount, skippedCount };
  } catch (error) {
    console.error('Error in bulk add:', error);
    return { success: false, message: 'Bulk add failed' };
  }
}

export async function adminBulkDowngradeAction(
  adminEmail: string,
  userIds: string[],
  reason: string = 'Bulk admin downgrade'
): Promise<{ success: boolean; message: string; successCount?: number; failedCount?: number }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };
    if (!userIds.length) return { success: false, message: 'No users specified' };

    let successCount = 0, failedCount = 0;
    for (const userId of userIds) {
      try {
        await prisma.subscription.upsert({
          where: { userId },
          update: { tier: 'FREE', status: 'EXPIRED', currentPeriodEnd: null },
          create: { userId, tier: 'FREE', status: 'EXPIRED' },
        });
        successCount++;
      } catch { failedCount++; }
    }

    await logAction(adminEmail, 'bulk_downgrade_to_free', 'multiple', { userCount: userIds.length, successCount, failedCount, reason });
    return { success: true, message: `Downgraded ${successCount} users (${failedCount} failed)`, successCount, failedCount };
  } catch (error) {
    console.error('Error in bulk downgrade:', error);
    return { success: false, message: 'Bulk downgrade failed' };
  }
}

export async function adminRemoveUsersAction(
  adminEmail: string,
  userIds: string[],
  reason: string = 'Admin removal'
): Promise<{ success: boolean; message: string; successCount?: number; failedCount?: number }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) return { success: false, message: 'Unauthorized' };
    if (!userIds.length) return { success: false, message: 'No users specified' };

    let successCount = 0, failedCount = 0;
    for (const userId of userIds) {
      try {
        // Cascade delete handles related records
        await prisma.user.delete({ where: { id: userId } });
        successCount++;
      } catch { failedCount++; }
    }

    await logAction(adminEmail, 'remove_users', 'multiple', { userCount: userIds.length, successCount, failedCount, reason });
    return { success: true, message: `Removed ${successCount} users (${failedCount} failed)`, successCount, failedCount };
  } catch (error) {
    console.error('Error removing users:', error);
    return { success: false, message: 'Remove users failed' };
  }
}
