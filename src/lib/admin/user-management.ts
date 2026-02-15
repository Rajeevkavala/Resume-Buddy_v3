/**
 * User Management System
 * Handles user data, activity logging, and admin operations
 */
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  Timestamp,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import type { UserData, UserActivity, AdminAction, DeleteUserOptions, DeleteUserResult } from '@/types/admin';

const COLLECTIONS = {
  USERS: 'users',
  USER_ACTIVITY: 'user_activity',
  ADMIN_ACTIONS: 'admin_actions',
  API_USAGE: 'api_usage',
  API_CALLS: 'api_calls',
  WHITELIST: 'whitelist',
};

/**
 * Helper to safely convert Firestore Timestamp to ISO string
 */
function toISOString(value: unknown): string | null {
  if (!value) return null;
  // Handle Firestore Timestamp with toDate()
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }
  // Handle ISO string already
  if (typeof value === 'string') {
    return value;
  }
  // Handle raw Firestore timestamp {seconds, nanoseconds}
  if (typeof value === 'object' && 'seconds' in value) {
    const ts = value as { seconds: number; nanoseconds?: number };
    return new Date(ts.seconds * 1000).toISOString();
  }
  return null;
}

/**
 * Get all users from the database
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const apiUsage = data.apiUsage || {};
      return {
        uid: docSnap.id,
        email: data.email || '',
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        status: data.status || 'active',
        role: data.role || 'user',
        createdAt: toISOString(data.createdAt) || new Date().toISOString(),
        lastLogin: toISOString(data.lastLogin),
        apiUsage: {
          dailyCount: apiUsage.dailyCount || 0,
          monthlyCount: apiUsage.monthlyCount || 0,
          totalCount: apiUsage.totalCount || 0,
          lastReset: toISOString(apiUsage.lastReset) || new Date().toISOString(),
          lastProvider: apiUsage.lastProvider || null,
          lastOperation: apiUsage.lastOperation || null,
        },
        limits: data.limits || { dailyLimit: 10, monthlyLimit: 300 },
      } as unknown as UserData;
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get a single user by UID
 */
export async function getUserById(uid: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return null;
    
    const data = userDoc.data();
    const apiUsage = data.apiUsage || {};
    return {
      uid,
      email: data.email || '',
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      status: data.status || 'active',
      role: data.role || 'user',
      createdAt: toISOString(data.createdAt) || new Date().toISOString(),
      lastLogin: toISOString(data.lastLogin),
      apiUsage: {
        dailyCount: apiUsage.dailyCount || 0,
        monthlyCount: apiUsage.monthlyCount || 0,
        totalCount: apiUsage.totalCount || 0,
        lastReset: toISOString(apiUsage.lastReset) || new Date().toISOString(),
      },
      limits: data.limits || { dailyLimit: 10, monthlyLimit: 300 },
    } as unknown as UserData;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const apiUsage = data.apiUsage || {};
    return {
      uid: docSnap.id,
      email: data.email || '',
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      status: data.status || 'active',
      role: data.role || 'user',
      createdAt: toISOString(data.createdAt) || new Date().toISOString(),
      lastLogin: toISOString(data.lastLogin),
      apiUsage: {
        dailyCount: apiUsage.dailyCount || 0,
        monthlyCount: apiUsage.monthlyCount || 0,
        totalCount: apiUsage.totalCount || 0,
        lastReset: toISOString(apiUsage.lastReset) || new Date().toISOString(),
      },
      limits: data.limits || { dailyLimit: 10, monthlyLimit: 300 },
    } as unknown as UserData;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Create or update a user record
 */
export async function upsertUser(uid: string, userData: Partial<UserData>): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const existing = await getDoc(userRef);
    
    if (existing.exists()) {
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date(),
      });
    } else {
      await setDoc(userRef, {
        ...userData,
        uid,
        status: userData.status || 'active',
        role: userData.role || 'user',
        apiUsage: userData.apiUsage || { dailyCount: 0, monthlyCount: 0, totalCount: 0, lastReset: new Date() },
        limits: userData.limits || { dailyLimit: 10, monthlyLimit: 300 },
        createdAt: new Date(),
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error upserting user:', error);
    return false;
  }
}

/**
 * Update user limits
 */
export async function updateUserLimits(
  uid: string, 
  limits: { dailyLimit: number; monthlyLimit: number }
): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, { limits });
    console.log(`📊 Updated limits for user ${uid}: ${limits.dailyLimit}/${limits.monthlyLimit}`);
    return true;
  } catch (error) {
    console.error('Error updating user limits:', error);
    return false;
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(
  uid: string, 
  status: 'active' | 'blocked' | 'pending'
): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, { status });
    console.log(`🔄 Updated status for user ${uid} to ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<string | null> {
  try {
    const activityRef = collection(db, COLLECTIONS.USER_ACTIVITY);
    const docRef = await addDoc(activityRef, {
      ...activity,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error logging user activity:', error);
    return null;
  }
}

/**
 * Get user activity history
 */
export async function getUserActivity(
  uid: string, 
  limitCount: number = 50
): Promise<UserActivity[]> {
  try {
    const activityRef = collection(db, COLLECTIONS.USER_ACTIVITY);
    const q = query(
      activityRef, 
      where('userId', '==', uid), 
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        action: data.action,
        details: data.details,
        timestamp: toISOString(data.timestamp) || new Date().toISOString(),
        ipAddress: data.ipAddress,
      } as unknown as UserActivity;
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
}

/**
 * Log admin action
 */
export async function logAdminAction(action: Omit<AdminAction, 'id' | 'timestamp'>): Promise<string | null> {
  try {
    const actionsRef = collection(db, COLLECTIONS.ADMIN_ACTIONS);
    const docRef = await addDoc(actionsRef, {
      ...action,
      timestamp: Timestamp.now(),
    });
    console.log(`📝 Admin action logged: ${action.action} by ${action.adminEmail}`);
    return docRef.id;
  } catch (error) {
    console.error('Error logging admin action:', error);
    return null;
  }
}

/**
 * Get admin action logs
 */
export async function getAdminActionLogs(limitCount: number = 100): Promise<AdminAction[]> {
  try {
    const actionsRef = collection(db, COLLECTIONS.ADMIN_ACTIONS);
    const q = query(actionsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        action: data.action,
        targetUserId: data.targetUserId,
        targetEmail: data.targetEmail,
        details: data.details,
        timestamp: toISOString(data.timestamp) || new Date().toISOString(),
      } as unknown as AdminAction;
    });
  } catch (error) {
    console.error('Error fetching admin action logs:', error);
    return [];
  }
}

/**
 * Get admin logs filtered by action type
 */
export async function getAdminLogsByAction(
  action: string, 
  limitCount: number = 50
): Promise<AdminAction[]> {
  try {
    const actionsRef = collection(db, COLLECTIONS.ADMIN_ACTIONS);
    const q = query(
      actionsRef, 
      where('action', '==', action),
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        action: data.action,
        targetUserId: data.targetUserId,
        targetEmail: data.targetEmail,
        details: data.details,
        timestamp: toISOString(data.timestamp) || new Date().toISOString(),
      } as unknown as AdminAction;
    });
  } catch (error) {
    console.error('Error fetching admin logs by action:', error);
    return [];
  }
}

/**
 * Delete a user completely (admin only) - Simple delete
 */
export async function deleteUser(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await deleteDoc(userRef);
    console.log(`🗑️ Deleted user: ${uid}`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

/**
 * Soft delete user - marks as deleted but preserves data
 */
export async function softDeleteUser(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      status: 'deleted',
      deletedAt: serverTimestamp(),
    });
    console.log(`🗑️ Soft deleted user: ${uid}`);
    return true;
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return false;
  }
}

/**
 * Permanent delete user - removes all user data based on options
 */
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
    // 1. Get user email first for whitelist deletion
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userDoc = await getDoc(userRef);
    const userEmail = userDoc.data()?.email;

    // 2. Delete from whitelist if requested
    if (options.deleteFromWhitelist && userEmail) {
      try {
        const whitelistRef = doc(db, COLLECTIONS.WHITELIST, userEmail.toLowerCase());
        await deleteDoc(whitelistRef);
        deletedItems.push('whitelist');
        console.log(`🗑️ Removed ${userEmail} from whitelist`);
      } catch (whitelistError) {
        console.warn('Could not delete from whitelist:', whitelistError);
      }
    }

    // 3. Delete activity logs if requested
    if (options.deleteActivityLogs) {
      try {
        const activityQuery = query(
          collection(db, COLLECTIONS.USER_ACTIVITY),
          where('userId', '==', uid)
        );
        const activityDocs = await getDocs(activityQuery);
        
        if (!activityDocs.empty) {
          const batch = writeBatch(db);
          activityDocs.forEach(docSnap => batch.delete(docSnap.ref));
          await batch.commit();
          deletedItems.push(`activity_logs (${activityDocs.size} records)`);
          console.log(`🗑️ Deleted ${activityDocs.size} activity logs for user ${uid}`);
        }
      } catch (activityError) {
        console.warn('Could not delete activity logs:', activityError);
      }
    }

    // 4. Delete API usage logs if requested
    if (options.deleteApiUsageLogs) {
      try {
        const usageQuery = query(
          collection(db, COLLECTIONS.API_CALLS),
          where('userId', '==', uid)
        );
        const usageDocs = await getDocs(usageQuery);
        
        if (!usageDocs.empty) {
          const batch = writeBatch(db);
          usageDocs.forEach(docSnap => batch.delete(docSnap.ref));
          await batch.commit();
          deletedItems.push(`api_usage_logs (${usageDocs.size} records)`);
          console.log(`🗑️ Deleted ${usageDocs.size} API usage logs for user ${uid}`);
        }
      } catch (usageError) {
        console.warn('Could not delete API usage logs:', usageError);
      }
    }

    // 5. Delete user document if requested (do this last)
    if (options.deleteUserData) {
      await deleteDoc(userRef);
      deletedItems.push('user_data');
      console.log(`🗑️ Permanently deleted user document: ${uid}`);
    }

    return { 
      success: true, 
      deletedItems,
      message: `Successfully deleted: ${deletedItems.join(', ')}`
    };
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    return { 
      success: false, 
      deletedItems,
      message: `Partial deletion. Deleted: ${deletedItems.join(', ') || 'none'}. Error occurred.`
    };
  }
}

/**
 * Bulk delete users (admin only)
 */
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

      if (success) {
        results.success.push(uid);
      } else {
        results.failed.push(uid);
      }
    } catch (error) {
      console.error(`Error deleting user ${uid}:`, error);
      results.failed.push(uid);
    }
  }

  return results;
}

/**
 * Get user statistics summary
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  adminUsers: number;
}> {
  try {
    const users = await getAllUsers();
    
    // Count admins from the admins collection
    let adminCount = 0;
    try {
      const adminsRef = collection(db, 'admins');
      const adminsSnapshot = await getDocs(adminsRef);
      adminCount = adminsSnapshot.docs.filter(doc => doc.data()?.active === true).length;
    } catch (e) {
      console.error('Error counting admins:', e);
    }
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      blockedUsers: users.filter(u => u.status === 'blocked').length,
      adminUsers: adminCount,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { totalUsers: 0, activeUsers: 0, blockedUsers: 0, adminUsers: 0 };
  }
}
