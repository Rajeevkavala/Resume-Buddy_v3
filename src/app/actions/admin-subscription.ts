'use server';

/**
 * Admin Subscription Management Server Actions
 * Manage user subscriptions, upgrade/downgrade Pro access, view stats
 */

import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import type { SubscriptionTier, SubscriptionDoc } from '@/lib/types/subscription';

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Verify if the email belongs to an admin
 * Checks environment variable and Firestore admins collection
 */
async function verifyAdmin(email: string): Promise<boolean> {
  // Option 1: Check against environment variable list
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  if (adminEmails.includes(email.toLowerCase())) {
    return true;
  }
  
  // Option 2: Check Firestore admins collection
  try {
    const adminRef = doc(db, 'admins', email.toLowerCase());
    const adminDoc = await getDoc(adminRef);
    return adminDoc.exists() && adminDoc.data()?.active === true;
  } catch {
    return false;
  }
}

/**
 * Log admin actions for audit trail
 */
async function logAdminAction(
  adminEmail: string, 
  action: string, 
  targetUserId: string, 
  details: Record<string, unknown>
) {
  try {
    const logsRef = collection(db, 'admin_logs');
    await addDoc(logsRef, {
      adminEmail,
      action,
      targetUserId,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

/**
 * Convert Firestore Timestamp to Date
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'object' && 'seconds' in (value as Record<string, unknown>)) {
    const ts = value as { seconds: number };
    return new Date(ts.seconds * 1000);
  }
  return null;
}

// ============================================================================
// Admin Subscription Management Actions
// ============================================================================

/**
 * Get all users with their subscription status
 */
export async function getAllUsersWithSubscriptionsAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  data?: UserWithSubscription[];
}> {
  try {
    // Verify admin
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    // Get all users from profiles collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const users = await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const uid = userDoc.id;
        
        // Get subscription data
        const subRef = doc(db, 'subscriptions', uid);
        const subDoc = await getDoc(subRef);
        const subData = subDoc.exists() ? subDoc.data() as SubscriptionDoc : null;
        
        // Determine tier
        let tier: SubscriptionTier = 'free';
        let proExpiresAt: string | null = null;
        let daysRemaining = 0;
        
        if (subData?.tier === 'pro' && subData.currentPeriodEnd) {
          const endDate = toDate(subData.currentPeriodEnd);
          
          if (endDate && endDate > new Date()) {
            tier = 'pro';
            proExpiresAt = endDate.toISOString();
            // Use calendar day difference for accurate day counting
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDateCopy = new Date(endDate);
            endDateCopy.setHours(0, 0, 0, 0);
            daysRemaining = Math.max(0, Math.round((endDateCopy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }
        
        // Get payment history count and last payment
        let totalPayments = 0;
        let lastPayment: string | null = null;
        
        if (subData?.razorpayPaymentId) {
          totalPayments = 1; // At least one payment exists
        }
        
        // Check payments collection for this user
        try {
          const paymentsRef = collection(db, 'payments');
          const paymentsSnapshot = await getDocs(paymentsRef);
          const userPayments = paymentsSnapshot.docs.filter(
            pDoc => pDoc.data().userId === uid && pDoc.data().status === 'completed'
          );
          totalPayments = userPayments.length;
          
          if (userPayments.length > 0) {
            // Get most recent payment
            const sortedPayments = userPayments
              .map(p => {
                const data = p.data();
                return { id: p.id, createdAt: data.createdAt as string };
              })
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            lastPayment = sortedPayments[0]?.createdAt || null;
          }
        } catch {
          // Ignore payment fetch errors
        }
        
        return {
          uid,
          email: userData.email || 'N/A',
          displayName: userData.displayName || userData.name || 'N/A',
          tier,
          proExpiresAt,
          daysRemaining,
          totalPayments,
          lastPayment,
          createdAt: userData.createdAt ? toDate(userData.createdAt)?.toISOString() || null : null,
        };
      })
    );

    // Sort by tier (pro first) then by name
    users.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === 'pro' ? -1 : 1;
      return (a.displayName || '').localeCompare(b.displayName || '');
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users with subscriptions:', error);
    return { success: false, message: 'Failed to fetch users' };
  }
}

/**
 * Upgrade a user to Pro tier (admin action)
 */
export async function adminUpgradeUserToProAction(
  adminEmail: string,
  userId: string,
  durationDays: number = 30,
  reason: string = 'Admin grant'
): Promise<{ success: boolean; message: string; expiresAt?: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subRef = doc(db, 'subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    const updateData: Partial<SubscriptionDoc> = {
      tier: 'pro',
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      updatedAt: now.toISOString(),
      provider: 'razorpay', // Mark as admin-granted
    };

    if (subDoc.exists()) {
      await updateDoc(subRef, updateData);
    } else {
      await setDoc(subRef, {
        ...updateData,
        uid: userId,
        createdAt: now.toISOString(),
      });
    }

    // Log admin action
    await logAdminAction(adminEmail, 'upgrade_to_pro', userId, { durationDays, reason });

    return { 
      success: true, 
      message: `User upgraded to Pro for ${durationDays} days`,
      expiresAt: endDate.toISOString(),
    };
  } catch (error) {
    console.error('Error upgrading user:', error);
    return { success: false, message: 'Failed to upgrade user' };
  }
}

/**
 * Downgrade a user to Free tier (admin action)
 */
export async function adminDowngradeUserToFreeAction(
  adminEmail: string,
  userId: string,
  reason: string = 'Admin action'
): Promise<{ success: boolean; message: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    const subRef = doc(db, 'subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (subDoc.exists()) {
      await updateDoc(subRef, {
        tier: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        updatedAt: new Date().toISOString(),
      });
    }

    await logAdminAction(adminEmail, 'downgrade_to_free', userId, { reason });

    return { success: true, message: 'User downgraded to Free tier' };
  } catch (error) {
    console.error('Error downgrading user:', error);
    return { success: false, message: 'Failed to downgrade user' };
  }
}

/**
 * Extend a user's Pro subscription
 */
export async function adminExtendProAction(
  adminEmail: string,
  userId: string,
  additionalDays: number,
  reason: string = 'Admin extension'
): Promise<{ success: boolean; message: string; newExpiresAt?: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    const subRef = doc(db, 'subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) {
      return { success: false, message: 'User has no subscription record' };
    }

    const subData = subDoc.data() as SubscriptionDoc;
    
    // Calculate new end date (extend from current end or from now if expired)
    let baseDate = new Date();
    if (subData.currentPeriodEnd) {
      const currentEnd = toDate(subData.currentPeriodEnd);
      if (currentEnd && currentEnd > baseDate) {
        baseDate = currentEnd;
      }
    }
    
    const newEndDate = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    await updateDoc(subRef, {
      tier: 'pro',
      status: 'active',
      currentPeriodEnd: newEndDate.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logAdminAction(adminEmail, 'extend_pro', userId, { additionalDays, reason });

    return { 
      success: true, 
      message: `Pro extended by ${additionalDays} days`,
      newExpiresAt: newEndDate.toISOString(),
    };
  } catch (error) {
    console.error('Error extending subscription:', error);
    return { success: false, message: 'Failed to extend subscription' };
  }
}

/**
 * Get subscription statistics for admin dashboard
 */
export async function getSubscriptionStatsAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  data?: SubscriptionStats;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    // Get all users first
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const totalUsers = usersSnapshot.size;

    const subsRef = collection(db, 'subscriptions');
    const subsSnapshot = await getDocs(subsRef);
    
    let proUsers = 0;
    let expiringSoon = 0; // Pro expiring in 7 days
    let totalRevenue = 0;
    
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    subsSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data() as SubscriptionDoc;
      
      if (data.tier === 'pro' && data.currentPeriodEnd) {
        const endDate = toDate(data.currentPeriodEnd);
        if (endDate && endDate > now) {
          proUsers++;
          if (endDate <= sevenDaysLater) {
            expiringSoon++;
          }
        }
      }
    });

    // Get total revenue from payments collection
    try {
      const paymentsRef = collection(db, 'payments');
      const paymentsSnapshot = await getDocs(paymentsRef);
      
      paymentsSnapshot.docs.forEach(pDoc => {
        const payment = pDoc.data();
        // Check for both 'completed' and 'captured' status (Razorpay uses 'captured')
        if (payment.status === 'completed' || payment.status === 'captured' || payment.status === 'success') {
          totalRevenue += (payment.amount || 0) / 100; // Convert paise to rupees
        }
      });
    } catch {
      // Ignore payment calculation errors
    }

    const freeUsers = totalUsers - proUsers;

    return { 
      success: true, 
      data: {
        totalUsers,
        proUsers,
        freeUsers,
        expiringSoon,
        totalRevenue,
        conversionRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0',
      }
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return { success: false, message: 'Failed to fetch stats' };
  }
}

/**
 * Get recent payments for admin dashboard
 */
export async function getRecentPaymentsAction(
  adminEmail: string, 
  limit: number = 10
): Promise<{
  success: boolean;
  message?: string;
  data?: RecentPayment[];
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    const paymentsRef = collection(db, 'payments');
    const paymentsSnapshot = await getDocs(paymentsRef);
    
    const allPayments: RecentPayment[] = paymentsSnapshot.docs
      .map(pDoc => {
        const data = pDoc.data();
        return {
          razorpayPaymentId: data.razorpayPaymentId,
          razorpayOrderId: data.razorpayOrderId,
          amount: data.amount || 0,
          status: data.status || 'unknown',
          createdAt: data.createdAt || '',
          userId: data.userId || '',
          userEmail: data.userEmail || undefined,
        };
      })
      .filter(p => p.createdAt);

    // Sort by date descending
    allPayments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { 
      success: true, 
      data: allPayments.slice(0, limit)
    };
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    return { success: false, message: 'Failed to fetch payments' };
  }
}

/**
 * Payment analytics data structure
 */
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

/**
 * Get comprehensive payment analytics for admin dashboard
 */
export async function getPaymentAnalyticsAction(adminEmail: string): Promise<{
  success: boolean;
  message?: string;
  data?: PaymentAnalytics;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    const paymentsRef = collection(db, 'payments');
    const paymentsSnapshot = await getDocs(paymentsRef);
    
    const allPayments: RecentPayment[] = paymentsSnapshot.docs
      .map(pDoc => {
        const data = pDoc.data();
        return {
          razorpayPaymentId: data.razorpayPaymentId,
          razorpayOrderId: data.razorpayOrderId,
          amount: data.amount || 0,
          status: data.status || 'unknown',
          createdAt: data.createdAt || '',
          userId: data.userId || '',
          userEmail: data.userEmail || undefined,
        };
      })
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate analytics
    let totalRevenue = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    let pendingTransactions = 0;
    const statusCounts: Record<string, number> = {};
    const revenueByDayMap: Record<string, { revenue: number; count: number }> = {};
    const revenueByMonthMap: Record<string, { revenue: number; count: number }> = {};

    allPayments.forEach(payment => {
      const status = payment.status.toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === 'completed' || status === 'captured' || status === 'success') {
        const amountInRupees = payment.amount / 100;
        totalRevenue += amountInRupees;
        successfulTransactions++;

        // Group by day
        const date = new Date(payment.createdAt).toISOString().split('T')[0];
        if (!revenueByDayMap[date]) {
          revenueByDayMap[date] = { revenue: 0, count: 0 };
        }
        revenueByDayMap[date].revenue += amountInRupees;
        revenueByDayMap[date].count++;

        // Group by month
        const month = new Date(payment.createdAt).toISOString().slice(0, 7);
        if (!revenueByMonthMap[month]) {
          revenueByMonthMap[month] = { revenue: 0, count: 0 };
        }
        revenueByMonthMap[month].revenue += amountInRupees;
        revenueByMonthMap[month].count++;
      } else if (status === 'failed') {
        failedTransactions++;
      } else {
        pendingTransactions++;
      }
    });

    const totalTransactions = allPayments.length;
    const averageOrderValue = successfulTransactions > 0 
      ? totalRevenue / successfulTransactions 
      : 0;

    // Convert maps to sorted arrays
    const revenueByDay = Object.entries(revenueByDayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    const revenueByMonth = Object.entries(revenueByMonthMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Calculate payment status breakdown
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
        totalRevenue,
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        averageOrderValue,
        revenueByDay,
        revenueByMonth,
        paymentStatusBreakdown,
        recentPayments: allPayments.slice(0, 10),
        allPayments,
      },
    };
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    return { success: false, message: 'Failed to fetch payment analytics' };
  }
}

/**
 * Bulk upgrade multiple users to Pro
 */
export async function adminBulkUpgradeAction(
  adminEmail: string,
  userIds: string[],
  durationDays: number = 30,
  reason: string = 'Bulk admin upgrade'
): Promise<{
  success: boolean;
  message: string;
  successCount?: number;
  failedCount?: number;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    if (!userIds.length) {
      return { success: false, message: 'No users specified' };
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    let successCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      try {
        const subRef = doc(db, 'subscriptions', userId);
        const subDoc = await getDoc(subRef);
        
        const updateData: Partial<SubscriptionDoc> = {
          tier: 'pro',
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: endDate.toISOString(),
          updatedAt: now.toISOString(),
        };

        if (subDoc.exists()) {
          await updateDoc(subRef, updateData);
        } else {
          await setDoc(subRef, {
            ...updateData,
            uid: userId,
            createdAt: now.toISOString(),
          });
        }
        successCount++;
      } catch {
        failedCount++;
      }
    }

    // Log bulk action
    await logAdminAction(adminEmail, 'bulk_upgrade_to_pro', 'multiple', { 
      userCount: userIds.length, 
      successCount, 
      failedCount,
      durationDays, 
      reason 
    });

    return { 
      success: true, 
      message: `Upgraded ${successCount} users to Pro (${failedCount} failed)`,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error in bulk upgrade:', error);
    return { success: false, message: 'Bulk upgrade failed' };
  }
}

/**
 * Add a new user manually with Pro access
 */
export async function adminAddUserWithProAction(
  adminEmail: string,
  userEmail: string,
  displayName: string,
  durationDays: number = 30,
  reason: string = 'Admin manual add'
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    if (!userEmail || !userEmail.includes('@')) {
      return { success: false, message: 'Invalid email address' };
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    // Generate a unique user ID based on email
    const userId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

    // Create user profile
    const userRef = doc(db, 'users', userId);
    const existingUser = await getDoc(userRef);
    
    if (!existingUser.exists()) {
      await setDoc(userRef, {
        email: normalizedEmail,
        displayName: displayName || normalizedEmail.split('@')[0],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        addedBy: adminEmail,
        manuallyAdded: true,
      });
    }

    // Create subscription
    const subRef = doc(db, 'subscriptions', userId);
    await setDoc(subRef, {
      uid: userId,
      tier: 'pro',
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      provider: 'admin',
    });

    await logAdminAction(adminEmail, 'add_user_with_pro', userId, { 
      userEmail: normalizedEmail, 
      displayName,
      durationDays, 
      reason 
    });

    return { 
      success: true, 
      message: `Added ${normalizedEmail} with ${durationDays} days Pro access`,
      userId,
    };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, message: 'Failed to add user' };
  }
}

/**
 * Bulk add users from CSV/list with Pro access
 */
export async function adminBulkAddUsersAction(
  adminEmail: string,
  usersData: Array<{ email: string; displayName?: string }>,
  durationDays: number = 30,
  reason: string = 'Bulk admin add'
): Promise<{
  success: boolean;
  message: string;
  successCount?: number;
  failedCount?: number;
  skippedCount?: number;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    if (!usersData.length) {
      return { success: false, message: 'No users provided' };
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const userData of usersData) {
      try {
        if (!userData.email || !userData.email.includes('@')) {
          skippedCount++;
          continue;
        }

        const normalizedEmail = userData.email.toLowerCase().trim();
        const userId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

        // Check if user already exists
        const userRef = doc(db, 'users', userId);
        const existingUser = await getDoc(userRef);
        
        if (!existingUser.exists()) {
          await setDoc(userRef, {
            email: normalizedEmail,
            displayName: userData.displayName || normalizedEmail.split('@')[0],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            addedBy: adminEmail,
            manuallyAdded: true,
          });
        }

        // Create/update subscription
        const subRef = doc(db, 'subscriptions', userId);
        const existingSub = await getDoc(subRef);
        
        if (existingSub.exists()) {
          await updateDoc(subRef, {
            tier: 'pro',
            status: 'active',
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: endDate.toISOString(),
            updatedAt: now.toISOString(),
          });
        } else {
          await setDoc(subRef, {
            uid: userId,
            tier: 'pro',
            status: 'active',
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: endDate.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            provider: 'admin',
          });
        }
        
        successCount++;
      } catch {
        failedCount++;
      }
    }

    await logAdminAction(adminEmail, 'bulk_add_users', 'multiple', { 
      userCount: usersData.length, 
      successCount, 
      failedCount,
      skippedCount,
      durationDays, 
      reason 
    });

    return { 
      success: true, 
      message: `Added ${successCount} users with Pro access (${failedCount} failed, ${skippedCount} skipped)`,
      successCount,
      failedCount,
      skippedCount,
    };
  } catch (error) {
    console.error('Error in bulk add users:', error);
    return { success: false, message: 'Bulk add users failed' };
  }
}

/**
 * Bulk downgrade users to Free tier
 */
export async function adminBulkDowngradeAction(
  adminEmail: string,
  userIds: string[],
  reason: string = 'Bulk admin downgrade'
): Promise<{
  success: boolean;
  message: string;
  successCount?: number;
  failedCount?: number;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    if (!userIds.length) {
      return { success: false, message: 'No users specified' };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      try {
        const subRef = doc(db, 'subscriptions', userId);
        const subDoc = await getDoc(subRef);
        
        if (subDoc.exists()) {
          await updateDoc(subRef, {
            tier: 'free',
            status: 'inactive',
            currentPeriodEnd: null,
            updatedAt: new Date().toISOString(),
          });
          successCount++;
        } else {
          // Create a free subscription record
          await setDoc(subRef, {
            uid: userId,
            tier: 'free',
            status: 'inactive',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          successCount++;
        }
      } catch {
        failedCount++;
      }
    }

    await logAdminAction(adminEmail, 'bulk_downgrade_to_free', 'multiple', { 
      userCount: userIds.length, 
      successCount, 
      failedCount,
      reason 
    });

    return { 
      success: true, 
      message: `Downgraded ${successCount} users to Free (${failedCount} failed)`,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error in bulk downgrade:', error);
    return { success: false, message: 'Bulk downgrade failed' };
  }
}

/**
 * Remove users completely (delete user profile and subscription)
 */
export async function adminRemoveUsersAction(
  adminEmail: string,
  userIds: string[],
  reason: string = 'Admin removal'
): Promise<{
  success: boolean;
  message: string;
  successCount?: number;
  failedCount?: number;
}> {
  try {
    const isAdminUser = await verifyAdmin(adminEmail);
    if (!isAdminUser) {
      return { success: false, message: 'Unauthorized - Admin access required' };
    }

    if (!userIds.length) {
      return { success: false, message: 'No users specified' };
    }

    const { deleteDoc } = await import('firebase/firestore');
    
    let successCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      try {
        // Delete subscription
        const subRef = doc(db, 'subscriptions', userId);
        await deleteDoc(subRef);
        
        // Delete user profile (only if manually added)
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data()?.manuallyAdded) {
          await deleteDoc(userRef);
        }
        
        successCount++;
      } catch {
        failedCount++;
      }
    }

    await logAdminAction(adminEmail, 'remove_users', 'multiple', { 
      userCount: userIds.length, 
      successCount, 
      failedCount,
      reason 
    });

    return { 
      success: true, 
      message: `Removed ${successCount} users (${failedCount} failed)`,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error removing users:', error);
    return { success: false, message: 'Remove users failed' };
  }
}

/**
 * Parse CSV content for bulk operations (internal helper - not exported as server action)
 */
function parseCSVContent(csvContent: string): Array<{ email: string; displayName?: string; days?: number }> {
  const lines = csvContent.split(/[\n\r]+/).filter(line => line.trim());
  const users: Array<{ email: string; displayName?: string; days?: number }> = [];
  
  for (const line of lines) {
    // Support formats: email OR email,name OR email,name,days
    const parts = line.split(',').map(p => p.trim());
    const email = parts[0];
    
    if (email && email.includes('@')) {
      users.push({
        email: email.toLowerCase(),
        displayName: parts[1] || undefined,
        days: parts[2] ? parseInt(parts[2]) : undefined,
      });
    }
  }
  
  return users;
}
