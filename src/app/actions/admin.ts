'use server';

/**
 * Admin Server Actions
 * Server-side actions for admin panel operations
 */

import { 
  addToWhitelist,
  removeFromWhitelist,
  blockUser,
  unblockUser,
  updateUserRole,
  getAllWhitelistedUsers,
  isAdmin,
  bulkAddToWhitelist,
} from '@/lib/access-control';

import {
  getAllUsers,
  getUserById,
  updateUserLimits,
  updateUserStatus,
  logAdminAction,
  getAdminActionLogs,
  getUserStats,
  deleteUser,
  softDeleteUser,
  permanentDeleteUser,
  bulkDeleteUsers,
} from '@/lib/admin';

import type { DeleteUserOptions } from '@/types/admin';

import {
  getUserUsageStats,
  getAggregatedUsageStats,
  resetUserDailyUsage,
  resetUserMonthlyUsage,
  setUserLimits,
  getHistoricalUsageData,
  deleteOldApiUsageLogs,
  getApiUsageLogCount,
} from '@/lib/admin/api-usage-tracking';

// ============================================================
// Admin Verification
// ============================================================

export async function verifyAdmin(email: string): Promise<boolean> {
  return await isAdmin(email);
}

// ============================================================
// Whitelist Management
// ============================================================

export async function addUserToWhitelist(
  email: string,
  adminEmail: string,
  role: 'user' | 'admin' = 'user',
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    const success = await addToWhitelist(email, adminEmail, role, notes);
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: 'add_to_whitelist',
        targetUserId: email,
        targetEmail: email,
        details: { role, notes },
      });
    }

    return { 
      success, 
      message: success ? `Added ${email} to whitelist` : 'Failed to add user' 
    };
  } catch (error) {
    console.error('Error in addUserToWhitelist:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function removeUserFromWhitelist(
  email: string,
  adminEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    const success = await removeFromWhitelist(email);
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: 'remove_from_whitelist',
        targetUserId: email,
        targetEmail: email,
      });
    }

    return { 
      success, 
      message: success ? `Removed ${email} from whitelist` : 'Failed to remove user' 
    };
  } catch (error) {
    console.error('Error in removeUserFromWhitelist:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function bulkAddUsersToWhitelist(
  emails: string[],
  adminEmail: string,
  role: 'user' | 'admin' = 'user'
): Promise<{ success: boolean; results: { success: string[]; failed: string[] } }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, results: { success: [], failed: emails } };
    }

    const results = await bulkAddToWhitelist(emails, adminEmail, role);
    
    await logAdminAction({
      adminId: adminEmail,
      adminEmail,
      action: 'bulk_add_to_whitelist',
      details: { 
        successCount: results.success.length,
        failedCount: results.failed.length,
        role,
      },
    });

    return { success: true, results };
  } catch (error) {
    console.error('Error in bulkAddUsersToWhitelist:', error);
    return { success: false, results: { success: [], failed: emails } };
  }
}

// Alias for cleaner imports
export async function bulkAddToWhitelistAction(
  emails: string[],
  adminEmail: string,
  role: 'user' | 'admin' = 'user'
): Promise<{ success: boolean; message: string; added: number; skipped: number }> {
  const result = await bulkAddUsersToWhitelist(emails, adminEmail, role);
  return {
    success: result.success,
    message: result.success 
      ? `Successfully processed ${emails.length} emails` 
      : 'Failed to add emails to whitelist',
    added: result.results.success.length,
    skipped: result.results.failed.length,
  };
}

export async function getWhitelist(adminEmail: string): Promise<{ 
  success: boolean; 
  data: Awaited<ReturnType<typeof getAllWhitelistedUsers>> | null 
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const data = await getAllWhitelistedUsers();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getWhitelist:', error);
    return { success: false, data: null };
  }
}

// ============================================================
// User Management
// ============================================================

export async function blockUserAction(
  email: string,
  adminEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    const success = await blockUser(email);
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: 'block_user',
        targetEmail: email,
      });
    }

    return { 
      success, 
      message: success ? `Blocked ${email}` : 'Failed to block user' 
    };
  } catch (error) {
    console.error('Error in blockUserAction:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function unblockUserAction(
  email: string,
  adminEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    const success = await unblockUser(email);
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: 'unblock_user',
        targetEmail: email,
      });
    }

    return { 
      success, 
      message: success ? `Unblocked ${email}` : 'Failed to unblock user' 
    };
  } catch (error) {
    console.error('Error in unblockUserAction:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function updateUserRoleAction(
  email: string,
  adminEmail: string,
  role: 'user' | 'admin'
): Promise<{ success: boolean; message: string }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    const success = await updateUserRole(email, role);
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: 'update_role',
        targetEmail: email,
        details: { newRole: role },
      });
    }

    return { 
      success, 
      message: success ? `Updated ${email} role to ${role}` : 'Failed to update role' 
    };
  } catch (error) {
    console.error('Error in updateUserRoleAction:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function getAllUsersAction(adminEmail: string): Promise<{
  success: boolean;
  data: Awaited<ReturnType<typeof getAllUsers>> | null;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const data = await getAllUsers();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getAllUsersAction:', error);
    return { success: false, data: null };
  }
}

export async function getUserStatsAction(adminEmail: string): Promise<{
  success: boolean;
  data: Awaited<ReturnType<typeof getUserStats>> | null;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const data = await getUserStats();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getUserStatsAction:', error);
    return { success: false, data: null };
  }
}

export async function deleteUserAction(
  uid: string,
  adminEmail: string,
  permanent: boolean = false,
  options?: DeleteUserOptions
): Promise<{ success: boolean; message: string; deletedItems?: string[] }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    // Get user info before deletion for logging
    const user = await getUserById(uid);
    
    let success: boolean;
    let deletedItems: string[] = [];

    if (permanent && options) {
      // Full permanent delete with options
      const result = await permanentDeleteUser(uid, options);
      success = result.success;
      deletedItems = result.deletedItems;
    } else if (permanent) {
      // Simple permanent delete
      success = await deleteUser(uid);
      deletedItems = success ? ['user_data'] : [];
    } else {
      // Soft delete
      success = await softDeleteUser(uid);
      deletedItems = success ? ['soft_deleted'] : [];
    }
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: permanent ? 'permanent_delete_user' : 'delete_user',
        targetUserId: uid,
        targetEmail: user?.email || 'Unknown',
        details: { permanent, options, deletedItems },
      });
    }

    return { 
      success, 
      message: success 
        ? `User ${permanent ? 'permanently ' : ''}deleted successfully` 
        : 'Failed to delete user',
      deletedItems
    };
  } catch (error) {
    console.error('Error in deleteUserAction:', error);
    return { success: false, message: 'Server error' };
  }
}

/**
 * Bulk delete users action
 */
export async function bulkDeleteUsersAction(
  uids: string[],
  adminEmail: string,
  permanent: boolean = false,
  options?: DeleteUserOptions
): Promise<{ success: boolean; results: { success: string[]; failed: string[] } }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, results: { success: [], failed: uids } };
    }

    const results = await bulkDeleteUsers(uids, permanent, options);
    
    await logAdminAction({
      adminId: adminEmail,
      adminEmail,
      action: 'bulk_delete_users',
      details: { 
        permanent,
        options,
        successCount: results.success.length,
        failedCount: results.failed.length,
      },
    });

    return { success: true, results };
  } catch (error) {
    console.error('Error in bulkDeleteUsersAction:', error);
    return { success: false, results: { success: [], failed: uids } };
  }
}

// ============================================================
// API Usage Management
// ============================================================

export async function updateUserLimitsAction(
  uid: string,
  adminEmail: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<{ success: boolean; message: string }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    let success = false;
    try {
      await setUserLimits(uid, dailyLimit, monthlyLimit);
      success = true;
    } catch { /* noop */ }
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: 'update_limits',
        targetUserId: uid,
        details: { dailyLimit, monthlyLimit },
      });
    }

    return { 
      success, 
      message: success ? `Updated limits: ${dailyLimit}/day, ${monthlyLimit}/month` : 'Failed to update limits' 
    };
  } catch (error) {
    console.error('Error in updateUserLimitsAction:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function resetUserUsageAction(
  uid: string,
  adminEmail: string,
  type: 'daily' | 'monthly'
): Promise<{ success: boolean; message: string }> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, message: 'Not authorized' };
    }

    let success = false;
    try {
      if (type === 'daily') {
        await resetUserDailyUsage(uid);
      } else {
        await resetUserMonthlyUsage(uid);
      }
      success = true;
    } catch { /* noop */ }
    
    if (success) {
      await logAdminAction({
        adminId: adminEmail,
        adminEmail,
        action: `reset_${type}_usage`,
        targetUserId: uid,
      });
    }

    return { 
      success, 
      message: success ? `Reset ${type} usage for user` : 'Failed to reset usage' 
    };
  } catch (error) {
    console.error('Error in resetUserUsageAction:', error);
    return { success: false, message: 'Server error' };
  }
}

export async function getUsageStatsAction(adminEmail: string): Promise<{
  success: boolean;
  data: Awaited<ReturnType<typeof getAggregatedUsageStats>> | null;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const data = await getAggregatedUsageStats();
    return { success: true, data };
  } catch (error) {
    console.error('Error in getUsageStatsAction:', error);
    return { success: false, data: null };
  }
}

export async function getUserUsageAction(
  uid: string,
  adminEmail: string
): Promise<{
  success: boolean;
  data: Awaited<ReturnType<typeof getUserUsageStats>> | null;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const data = await getUserUsageStats(uid);
    return { success: true, data };
  } catch (error) {
    console.error('Error in getUserUsageAction:', error);
    return { success: false, data: null };
  }
}

// ============================================================
// Admin Logs
// ============================================================

export async function getAdminLogsAction(
  adminEmail: string,
  limit: number = 100
): Promise<{
  success: boolean;
  data: Awaited<ReturnType<typeof getAdminActionLogs>> | null;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const data = await getAdminActionLogs(limit);
    return { success: true, data };
  } catch (error) {
    console.error('Error in getAdminLogsAction:', error);
    return { success: false, data: null };
  }
}

export async function getHistoricalUsageAction(
  adminEmail: string,
  days: number = 7
): Promise<{
  success: boolean;
  data: Awaited<ReturnType<typeof getHistoricalUsageData>> | null;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const data = await getHistoricalUsageData(days);
    return { success: true, data };
  } catch (error) {
    console.error('Error in getHistoricalUsageAction:', error);
    return { success: false, data: null };
  }
}

/**
 * Get whitelist statistics for admin dashboard
 * Returns stats only from whitelisted users
 */
export async function getWhitelistStatsAction(
  adminEmail: string
): Promise<{
  success: boolean;
  data: { totalWhitelisted: number; activeUsers: number; blockedUsers: number; adminUsers: number } | null;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, data: null };
    }

    const whitelistedUsers = await getAllWhitelistedUsers();
    
    const stats = {
      totalWhitelisted: whitelistedUsers.length,
      activeUsers: whitelistedUsers.filter(u => u.status === 'active' && u.role !== 'admin').length,
      blockedUsers: whitelistedUsers.filter(u => u.status === 'blocked').length,
      adminUsers: whitelistedUsers.filter(u => u.role === 'admin' && u.status === 'active').length,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getWhitelistStatsAction:', error);
    return { success: false, data: null };
  }
}

// ============================================================
// API Usage Log Cleanup
// ============================================================

/**
 * Clean up old API usage logs
 * @param adminEmail - Admin email for authorization
 * @param daysOld - Number of days after which logs should be deleted (default: 7)
 */
export async function cleanupApiLogsAction(
  adminEmail: string,
  daysOld: number = 7
): Promise<{
  success: boolean;
  deletedCount: number;
  message: string;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, deletedCount: 0, message: 'Not authorized' };
    }

    const deletedCount = await deleteOldApiUsageLogs(daysOld);
    
    await logAdminAction({
      adminId: adminEmail,
      adminEmail,
      action: 'cleanup_api_logs',
      targetUserId: 'system',
      targetEmail: 'system',
      details: { daysOld, deletedCount },
    });

    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} logs older than ${daysOld} days`,
    };
  } catch (error) {
    console.error('Error in cleanupApiLogsAction:', error);
    return { success: false, deletedCount: 0, message: 'Server error' };
  }
}

/**
 * Get count of API usage logs
 */
export async function getApiLogCountAction(
  adminEmail: string
): Promise<{
  success: boolean;
  count: number;
}> {
  try {
    const adminCheck = await isAdmin(adminEmail);
    if (!adminCheck) {
      return { success: false, count: 0 };
    }

    const count = await getApiUsageLogCount();
    return { success: true, count };
  } catch (error) {
    console.error('Error in getApiLogCountAction:', error);
    return { success: false, count: 0 };
  }
}
