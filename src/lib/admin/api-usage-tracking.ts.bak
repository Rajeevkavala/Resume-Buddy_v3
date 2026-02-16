/**
 * API Usage Tracking System
 * Tracks and manages per-user API usage limits
 */
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import type { ApiUsageStats, UserData } from '@/types/admin';

const COLLECTIONS = {
  USERS: 'users',
  API_USAGE_LOGS: 'api_usage_logs',
};

/**
 * Convert Firestore Timestamp or Date to ISO string for RSC serialization
 */
function toISOString(value: unknown): string | null {
  if (!value) return null;
  // Handle Firestore Timestamp with toDate method
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  // Handle Date object
  if (value instanceof Date) return value.toISOString();
  // Handle ISO string (passthrough)
  if (typeof value === 'string') return value;
  // Handle raw Firestore Timestamp object {seconds, nanoseconds}
  if (typeof value === 'object' && 'seconds' in value) {
    const ts = value as { seconds: number; nanoseconds?: number };
    return new Date(ts.seconds * 1000).toISOString();
  }
  return null;
}

/**
 * Convert Firestore Timestamp to Date safely
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'object' && 'seconds' in value) {
    const ts = value as { seconds: number; nanoseconds?: number };
    return new Date(ts.seconds * 1000);
  }
  return null;
}

/**
 * Get daily/monthly usage key dates
 */
function getUsagePeriods(): { dailyKey: string; monthlyKey: string } {
  const now = new Date();
  const dailyKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const monthlyKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  return { dailyKey, monthlyKey };
}

/**
 * Track an API call for a user
 */
export async function trackApiUsage(
  uid: string, 
  provider: 'groq' | 'gemini' | 'openrouter',
  operation: string,
  tokensUsed?: number
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { allowed: false, remaining: 0, reason: 'User not found' };
    }
    
    const userData = userDoc.data();
    const { dailyKey, monthlyKey } = getUsagePeriods();
    
    // Check if we need to reset counters
    const currentUsage = userData.apiUsage || { dailyCount: 0, monthlyCount: 0, totalCount: 0 };
    const lastResetTimestamp = currentUsage.lastReset;
    const lastResetDate = toDate(lastResetTimestamp) || new Date(0);
    const lastResetDay = lastResetDate.toISOString().split('T')[0];
    
    let dailyCount = currentUsage.dailyCount || 0;
    let monthlyCount = currentUsage.monthlyCount || 0;
    
    // Reset daily counter if it's a new day
    if (lastResetDay !== dailyKey) {
      dailyCount = 0;
    }
    
    // Reset monthly counter if it's a new month
    const lastResetMonth = `${lastResetDate.getFullYear()}-${String(lastResetDate.getMonth() + 1).padStart(2, '0')}`;
    if (lastResetMonth !== monthlyKey) {
      monthlyCount = 0;
    }
    
    // Get limits
    const limits = userData.limits || { dailyLimit: 10, monthlyLimit: 300 };
    const dailyLimit = limits.dailyLimit || 10;
    const monthlyLimit = limits.monthlyLimit || 300;
    
    // Check limits
    if (dailyCount >= dailyLimit) {
      return { 
        allowed: false, 
        remaining: 0, 
        reason: `Daily limit reached (${dailyLimit}/day)` 
      };
    }
    
    if (monthlyCount >= monthlyLimit) {
      return { 
        allowed: false, 
        remaining: 0, 
        reason: `Monthly limit reached (${monthlyLimit}/month)` 
      };
    }
    
    // Increment counters
    await updateDoc(userRef, {
      'apiUsage.dailyCount': dailyCount + 1,
      'apiUsage.monthlyCount': monthlyCount + 1,
      'apiUsage.totalCount': increment(1),
      'apiUsage.lastReset': Timestamp.now(),
      'apiUsage.lastProvider': provider,
      'apiUsage.lastOperation': operation,
    });
    
    // Log the usage
    await logApiUsage(uid, provider, operation, tokensUsed);
    
    const remainingDaily = dailyLimit - (dailyCount + 1);
    const remainingMonthly = monthlyLimit - (monthlyCount + 1);
    
    return { 
      allowed: true, 
      remaining: Math.min(remainingDaily, remainingMonthly) 
    };
  } catch (error) {
    console.error('Error tracking API usage:', error);
    // Allow on error to not block users
    return { allowed: true, remaining: -1 };
  }
}

/**
 * Log API usage to separate collection for analytics
 */
async function logApiUsage(
  uid: string,
  provider: string,
  operation: string,
  tokensUsed?: number
): Promise<void> {
  try {
    const { dailyKey } = getUsagePeriods();
    const logRef = doc(db, COLLECTIONS.API_USAGE_LOGS, `${uid}_${dailyKey}_${Date.now()}`);
    
    await setDoc(logRef, {
      uid,
      provider,
      operation,
      tokensUsed: tokensUsed || 0,
      timestamp: Timestamp.now(),
      date: dailyKey,
    });
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

/**
 * Get user's current usage stats
 */
export async function getUserUsageStats(uid: string): Promise<ApiUsageStats | null> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    const usage = userData.apiUsage || { dailyCount: 0, monthlyCount: 0, totalCount: 0 };
    const limits = userData.limits || { dailyLimit: 10, monthlyLimit: 300 };
    
    return {
      dailyCount: usage.dailyCount || 0,
      monthlyCount: usage.monthlyCount || 0,
      totalCount: usage.totalCount || 0,
      dailyLimit: limits.dailyLimit || 10,
      monthlyLimit: limits.monthlyLimit || 300,
      lastReset: toISOString(usage.lastReset) || new Date().toISOString(),
    } as unknown as ApiUsageStats;
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    return null;
  }
}

/**
 * Get aggregated usage stats for all users
 */
export async function getAggregatedUsageStats(): Promise<{
  totalRequests: number;
  activeUsersToday: number;
  requestsByProvider: Record<string, number>;
  topUsers: Array<{ uid: string; email: string; count: number }>;
}> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const snapshot = await getDocs(usersRef);
    
    let totalRequests = 0;
    let activeUsersToday = 0;
    const topUsers: Array<{ uid: string; email: string; count: number }> = [];
    
    const { dailyKey } = getUsagePeriods();
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const usage = data.apiUsage || { totalCount: 0, dailyCount: 0 };
      
      totalRequests += usage.totalCount || 0;
      
      // Check if user was active today - multiple checks
      let wasActiveToday = false;
      
      // Check 1: User has dailyCount > 0 and lastReset is today
      const lastReset = toDate(usage.lastReset);
      if (lastReset && lastReset.toISOString().split('T')[0] === dailyKey && usage.dailyCount > 0) {
        wasActiveToday = true;
      }
      
      // Check 2: User's lastLogin was today
      const lastLogin = toDate(data.lastLogin);
      if (lastLogin && lastLogin.toISOString().split('T')[0] === dailyKey) {
        wasActiveToday = true;
      }
      
      if (wasActiveToday) activeUsersToday++;
      
      topUsers.push({
        uid: docSnap.id,
        email: data.email || 'Unknown',
        count: usage.totalCount || 0,
      });
    });
    
    // Sort by count and get top 10
    topUsers.sort((a, b) => b.count - a.count);
    
    return {
      totalRequests,
      activeUsersToday,
      requestsByProvider: { groq: 0, gemini: 0, openrouter: 0 }, // Would need additional tracking
      topUsers: topUsers.slice(0, 10),
    };
  } catch (error) {
    console.error('Error getting aggregated stats:', error);
    return {
      totalRequests: 0,
      activeUsersToday: 0,
      requestsByProvider: {},
      topUsers: [],
    };
  }
}

/**
 * Reset a user's daily usage counter
 */
export async function resetUserDailyUsage(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      'apiUsage.dailyCount': 0,
      'apiUsage.lastReset': Timestamp.now(),
    });
    console.log(`🔄 Reset daily usage for user ${uid}`);
    return true;
  } catch (error) {
    console.error('Error resetting daily usage:', error);
    return false;
  }
}

/**
 * Reset a user's monthly usage counter
 */
export async function resetUserMonthlyUsage(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      'apiUsage.monthlyCount': 0,
      'apiUsage.lastReset': Timestamp.now(),
    });
    console.log(`🔄 Reset monthly usage for user ${uid}`);
    return true;
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    return false;
  }
}

/**
 * Check if user is within limits (without incrementing)
 */
export async function checkUserLimits(uid: string): Promise<{
  withinLimits: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
}> {
  try {
    const stats = await getUserUsageStats(uid);
    
    if (!stats) {
      return { withinLimits: true, dailyRemaining: 10, monthlyRemaining: 300 };
    }
    
    const dailyRemaining = Math.max(0, stats.dailyLimit - stats.dailyCount);
    const monthlyRemaining = Math.max(0, stats.monthlyLimit - stats.monthlyCount);
    
    return {
      withinLimits: dailyRemaining > 0 && monthlyRemaining > 0,
      dailyRemaining,
      monthlyRemaining,
    };
  } catch (error) {
    console.error('Error checking user limits:', error);
    return { withinLimits: true, dailyRemaining: 10, monthlyRemaining: 300 };
  }
}

/**
 * Set custom limits for a user
 */
export async function setUserLimits(
  uid: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<boolean> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, {
      'limits.dailyLimit': dailyLimit,
      'limits.monthlyLimit': monthlyLimit,
    });
    console.log(`📊 Set limits for ${uid}: ${dailyLimit}/day, ${monthlyLimit}/month`);
    return true;
  } catch (error) {
    console.error('Error setting user limits:', error);
    return false;
  }
}

/**
 * Get historical API usage data for charts
 */
export async function getHistoricalUsageData(days: number = 7): Promise<{
  dailyUsage: Array<{ date: string; requests: number; uniqueUsers: number }>;
  hourlyDistribution: Array<{ hour: number; requests: number }>;
  userUsageDistribution: Array<{ userId: string; email: string; daily: number; monthly: number; total: number }>;
}> {
  try {
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Query logs from the past N days
    const logsQuery = query(
      logsRef,
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(logsQuery);
    
    // Process daily usage
    const dailyMap = new Map<string, { requests: number; users: Set<string> }>();
    const hourlyMap = new Map<number, number>();
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const timestamp = toDate(data.timestamp);
      if (!timestamp) return;
      
      // Daily aggregation
      const dateKey = timestamp.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { requests: 0, users: new Set() });
      }
      const dayData = dailyMap.get(dateKey)!;
      dayData.requests++;
      if (data.uid) dayData.users.add(data.uid);
      
      // Hourly distribution
      const hour = timestamp.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });
    
    // Generate array of all dates in the range
    const dailyUsage: Array<{ date: string; requests: number; uniqueUsers: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = dailyMap.get(dateKey);
      dailyUsage.push({
        date: dateKey,
        requests: dayData?.requests || 0,
        uniqueUsers: dayData?.users.size || 0,
      });
    }
    
    // Generate hourly distribution (0-23)
    const hourlyDistribution: Array<{ hour: number; requests: number }> = [];
    for (let i = 0; i < 24; i++) {
      hourlyDistribution.push({
        hour: i,
        requests: hourlyMap.get(i) || 0,
      });
    }
    
    // Get user usage distribution from users collection
    const usersRef = collection(db, COLLECTIONS.USERS);
    const usersSnapshot = await getDocs(usersRef);
    
    const userUsageDistribution: Array<{ userId: string; email: string; daily: number; monthly: number; total: number }> = [];
    
    usersSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const usage = data.apiUsage || { dailyCount: 0, monthlyCount: 0, totalCount: 0 };
      
      // Only include users with some usage
      if (usage.totalCount > 0 || usage.dailyCount > 0 || usage.monthlyCount > 0) {
        userUsageDistribution.push({
          userId: docSnap.id,
          email: data.email || 'Unknown',
          daily: usage.dailyCount || 0,
          monthly: usage.monthlyCount || 0,
          total: usage.totalCount || 0,
        });
      }
    });
    
    // Sort by total usage descending
    userUsageDistribution.sort((a, b) => b.total - a.total);
    
    return {
      dailyUsage,
      hourlyDistribution,
      userUsageDistribution: userUsageDistribution.slice(0, 20), // Top 20 users
    };
  } catch (error) {
    console.error('Error getting historical usage data:', error);
    return {
      dailyUsage: [],
      hourlyDistribution: [],
      userUsageDistribution: [],
    };
  }
}

/**
 * Delete API usage logs older than specified days
 * Automatically cleans up old logs to keep the database size manageable
 * @param daysOld - Number of days after which logs should be deleted (default: 7)
 * @returns Object with count of deleted logs and any errors
 */
export async function deleteOldApiUsageLogs(daysOld: number = 7): Promise<{
  deletedCount: number;
  success: boolean;
  error?: string;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    cutoffDate.setHours(0, 0, 0, 0); // Start of day
    
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    const oldLogsQuery = query(
      logsRef,
      where('timestamp', '<', Timestamp.fromDate(cutoffDate)),
      firestoreLimit(500) // Process in batches to avoid timeout
    );
    
    let deletedCount = 0;
    let hasMore = true;
    
    // Delete in batches to handle large numbers of old logs
    while (hasMore) {
      const snapshot = await getDocs(oldLogsQuery);
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
        deletedCount++;
      });
      
      await batch.commit();
      
      // If we got fewer than 500, we're done
      if (snapshot.docs.length < 500) {
        hasMore = false;
      }
    }
    
    console.log(`🗑️ Deleted ${deletedCount} API usage logs older than ${daysOld} days`);
    return { deletedCount, success: true };
  } catch (error) {
    console.error('Error deleting old API usage logs:', error);
    return { 
      deletedCount: 0, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get the count of API usage logs
 * Useful for monitoring log volume
 */
export async function getApiUsageLogCount(): Promise<number> {
  try {
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    const snapshot = await getDocs(logsRef);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting log count:', error);
    return 0;
  }
}
