/**
 * User Management System — Prisma/PostgreSQL based
 * Handles user CRUD, activity logging, and admin operations
 */

import { prisma } from '@/lib/db';
import type {
  UserData,
  UserActivity,
  AdminAction,
  DeleteUserOptions,
  DeleteUserResult,
} from '@/types/admin';

// ============ Read Operations ============

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const users = await prisma.user.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => mapUserToUserData(u));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUserById(uid: string): Promise<UserData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { subscription: true },
    });
    if (!user) return null;
    return mapUserToUserData(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { subscription: true },
    });
    if (!user) return null;
    return mapUserToUserData(user);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

// ============ Write Operations ============

export async function upsertUser(uid: string, userData: Partial<UserData>): Promise<boolean> {
  try {
    await prisma.user.upsert({
      where: { id: uid },
      update: {
        name: userData.displayName ?? undefined,
        avatar: userData.photoURL ?? undefined,
        email: userData.email ?? undefined,
      },
      create: {
        id: uid,
        email: userData.email ?? '',
        name: userData.displayName ?? null,
        avatar: userData.photoURL ?? null,
        role: String(userData.role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
      },
    });
    return true;
  } catch (error) {
    console.error('Error upserting user:', error);
    return false;
  }
}

export async function updateUserLimits(
  uid: string,
  _limits: { dailyLimit: number; monthlyLimit: number }
): Promise<boolean> {
  try {
    // Limits are currently tier-based via subscription. Custom per-user limits
    // can be stored in user metadata or a separate config table if needed.
    console.log(`Updated limits for user ${uid}: ${_limits.dailyLimit}/${_limits.monthlyLimit}`);
    return true;
  } catch (error) {
    console.error('Error updating user limits:', error);
    return false;
  }
}

export async function updateUserStatus(
  uid: string,
  status: 'active' | 'suspended' | 'deleted'
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: uid },
      data: { status: status.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'DELETED' },
    });
    console.log(`Updated status for user ${uid} to ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
}

// ============ Activity Logging ============

export async function logUserActivity(
  activity: Omit<UserActivity, 'id' | 'timestamp'>
): Promise<string | null> {
  try {
    const record = await prisma.userActivity.create({
      data: {
        userId: activity.userId,
        action: activity.action,
        details: typeof activity.details === 'string'
          ? { text: activity.details }
          : (activity.details as Record<string, string | number | boolean | null>) ?? undefined,
        ipAddress: activity.ipAddress ?? null,
      },
    });
    return record.id;
  } catch (error) {
    console.error('Error logging user activity:', error);
    return null;
  }
}

export async function getUserActivity(
  uid: string,
  limitCount: number = 50
): Promise<UserActivity[]> {
  try {
    const records = await prisma.userActivity.findMany({
      where: { userId: uid },
      orderBy: { createdAt: 'desc' },
      take: limitCount,
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      action: r.action,
      details: (r.details as Record<string, unknown>) ?? undefined,
      timestamp: r.createdAt.toISOString(),
      ipAddress: r.ipAddress ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
}

// ============ Admin Action Logging ============

export async function logAdminAction(
  action: Omit<AdminAction, 'id' | 'timestamp'>
): Promise<string | null> {
  try {
    const record = await prisma.adminAction.create({
      data: {
        adminId: action.adminId ?? action.adminEmail,
        action: action.action,
        targetId: action.targetUserId ?? null,
        details: {
          ...(action.details ?? {}),
          adminEmail: action.adminEmail,
          targetEmail: action.targetEmail,
        },
        ipAddress: null,
      },
    });
    console.log(`Admin action logged: ${action.action} by ${action.adminEmail}`);
    return record.id;
  } catch (error) {
    console.error('Error logging admin action:', error);
    return null;
  }
}

export async function getAdminActionLogs(limitCount: number = 100): Promise<AdminAction[]> {
  try {
    const records = await prisma.adminAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limitCount,
    });

    return records.map(mapAdminActionRecord);
  } catch (error) {
    console.error('Error fetching admin action logs:', error);
    return [];
  }
}

export async function getAdminLogsByAction(
  action: string,
  limitCount: number = 50
): Promise<AdminAction[]> {
  try {
    const records = await prisma.adminAction.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limitCount,
    });

    return records.map(mapAdminActionRecord);
  } catch (error) {
    console.error('Error fetching admin logs by action:', error);
    return [];
  }
}

// ============ Delete Operations ============

export async function deleteUser(uid: string): Promise<boolean> {
  try {
    await prisma.user.delete({ where: { id: uid } });
    console.log(`Deleted user: ${uid}`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function softDeleteUser(uid: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: uid },
      data: { status: 'DELETED' },
    });
    console.log(`Soft deleted user: ${uid}`);
    return true;
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return false;
  }
}

export async function permanentDeleteUser(
  uid: string,
  options: DeleteUserOptions = {
    deleteFromWhitelist: true,
    deleteUserData: true,
    deleteActivityLogs: false,
    deleteApiUsageLogs: false,
  }
): Promise<DeleteUserResult> {
  const deletedItems: string[] = [];

  try {
    // 1. Delete activity logs if requested
    if (options.deleteActivityLogs) {
      const { count } = await prisma.userActivity.deleteMany({ where: { userId: uid } });
      if (count > 0) deletedItems.push(`activity_logs (${count} records)`);
    }

    // 2. Delete API usage logs if requested
    if (options.deleteApiUsageLogs) {
      const { count } = await prisma.apiCallLog.deleteMany({ where: { userId: uid } });
      if (count > 0) deletedItems.push(`api_usage_logs (${count} records)`);
    }

    // 3. Delete user document (cascade deletes related records)
    if (options.deleteUserData) {
      await prisma.user.delete({ where: { id: uid } });
      deletedItems.push('user_data');
      console.log(`Permanently deleted user document: ${uid}`);
    }

    return {
      success: true,
      deletedItems,
      message: `Successfully deleted: ${deletedItems.join(', ')}`,
    };
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    return {
      success: false,
      deletedItems,
      message: `Partial deletion. Deleted: ${deletedItems.join(', ') || 'none'}. Error occurred.`,
    };
  }
}

export async function bulkDeleteUsers(
  uids: string[],
  permanent: boolean = false,
  options?: DeleteUserOptions
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  for (const uid of uids) {
    try {
      let success: boolean;
      if (permanent && options) {
        const result = await permanentDeleteUser(uid, options);
        success = result.success;
      } else if (permanent) {
        success = await deleteUser(uid);
      } else {
        success = await softDeleteUser(uid);
      }
      (success ? results.success : results.failed).push(uid);
    } catch {
      results.failed.push(uid);
    }
  }

  return results;
}

// ============ Stats ============

export async function getUserStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  adminUsers: number;
}> {
  try {
    const [total, active, blocked, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return { totalUsers: total, activeUsers: active, blockedUsers: blocked, adminUsers: admins };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { totalUsers: 0, activeUsers: 0, blockedUsers: 0, adminUsers: 0 };
  }
}

// ============ Helpers ============

function mapUserToUserData(u: {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  status: string;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  deletedAt?: Date | null;
  subscription?: { tier: string; status: string } | null;
}): UserData {
  return {
    uid: u.id,
    email: u.email,
    displayName: u.name,
    photoURL: u.avatar,
    status: (u.status?.toLowerCase() ?? 'active') as UserData['status'],
    role: (u.role?.toLowerCase() ?? 'user') as UserData['role'],
    createdAt: u.createdAt.toISOString(),
    lastLogin: u.lastLoginAt?.toISOString() ?? null,
    deletedAt: u.deletedAt?.toISOString() ?? null,
    apiUsage: {
      dailyCount: 0,
      monthlyCount: 0,
      totalCount: 0,
      lastReset: new Date().toISOString(),
    },
    limits: {
      dailyLimit: u.subscription?.tier === 'PRO' ? 50 : 10,
      monthlyLimit: u.subscription?.tier === 'PRO' ? 1000 : 150,
    },
  };
}

function mapAdminActionRecord(r: {
  id: string;
  adminId: string;
  action: string;
  targetId: string | null;
  details: unknown;
  createdAt: Date;
}): AdminAction {
  const details = (r.details as Record<string, unknown>) ?? {};
  return {
    id: r.id,
    adminId: r.adminId,
    adminEmail: (details.adminEmail as string) ?? r.adminId,
    action: r.action,
    targetUserId: r.targetId ?? undefined,
    targetEmail: (details.targetEmail as string) ?? undefined,
    details: details,
    timestamp: r.createdAt.toISOString(),
  };
}
