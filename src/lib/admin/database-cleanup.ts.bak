/**
 * Database Log Cleanup Utilities
 * 
 * Manages the cleanup of old API usage logs to prevent database bloat.
 * Implements:
 * - Automatic cleanup of logs older than retention period
 * - Batch deletion to avoid memory issues
 * - Aggregation of old data before deletion
 * - Scheduled cleanup functions
 */

import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  writeBatch,
  getCountFromServer,
} from 'firebase/firestore';

const COLLECTIONS = {
  API_USAGE_LOGS: 'api_usage_logs',
  USAGE_AGGREGATES: 'usage_aggregates',
  CLEANUP_LOGS: 'cleanup_logs',
};

// Configuration
const DEFAULT_RETENTION_DAYS = 7; // Keep detailed logs for 7 days
const MAX_BATCH_SIZE = 500; // Firestore batch limit
const AGGREGATE_RETENTION_DAYS = 90; // Keep aggregated data for 90 days

interface CleanupResult {
  success: boolean;
  deletedCount: number;
  aggregatedCount: number;
  error?: string;
  duration: number;
}

interface UsageAggregate {
  date: string;
  totalRequests: number;
  totalTokens: number;
  uniqueUsers: number;
  byProvider: Record<string, number>;
  byOperation: Record<string, number>;
  avgLatency: number;
  errorCount: number;
}

/**
 * Get the count of logs in the database
 */
export async function getLogCount(): Promise<number> {
  try {
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    const snapshot = await getCountFromServer(logsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting log count:', error);
    return -1;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  totalLogs: number;
  logsOlderThan7Days: number;
  logsOlderThan30Days: number;
  aggregatesCount: number;
  estimatedSize: string;
}> {
  try {
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    const aggregatesRef = collection(db, COLLECTIONS.USAGE_AGGREGATES);

    // Total logs
    const totalSnapshot = await getCountFromServer(logsRef);
    const totalLogs = totalSnapshot.data().count;

    // Logs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oldLogsQuery = query(
      logsRef,
      where('timestamp', '<', Timestamp.fromDate(sevenDaysAgo))
    );
    const oldLogsSnapshot = await getCountFromServer(oldLogsQuery);
    const logsOlderThan7Days = oldLogsSnapshot.data().count;

    // Logs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const veryOldLogsQuery = query(
      logsRef,
      where('timestamp', '<', Timestamp.fromDate(thirtyDaysAgo))
    );
    const veryOldLogsSnapshot = await getCountFromServer(veryOldLogsQuery);
    const logsOlderThan30Days = veryOldLogsSnapshot.data().count;

    // Aggregates count
    const aggregatesSnapshot = await getCountFromServer(aggregatesRef);
    const aggregatesCount = aggregatesSnapshot.data().count;

    // Estimate size (rough: ~500 bytes per log document)
    const estimatedSizeBytes = totalLogs * 500;
    const estimatedSize = formatBytes(estimatedSizeBytes);

    return {
      totalLogs,
      logsOlderThan7Days,
      logsOlderThan30Days,
      aggregatesCount,
      estimatedSize,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      totalLogs: 0,
      logsOlderThan7Days: 0,
      logsOlderThan30Days: 0,
      aggregatesCount: 0,
      estimatedSize: '0 B',
    };
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Aggregate logs for a specific date before deletion
 */
async function aggregateLogsForDate(date: string): Promise<UsageAggregate | null> {
  try {
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    const logsQuery = query(
      logsRef,
      where('date', '==', date),
      firestoreLimit(10000) // Safety limit
    );

    const snapshot = await getDocs(logsQuery);
    
    if (snapshot.empty) return null;

    const aggregate: UsageAggregate = {
      date,
      totalRequests: 0,
      totalTokens: 0,
      uniqueUsers: 0,
      byProvider: {},
      byOperation: {},
      avgLatency: 0,
      errorCount: 0,
    };

    const users = new Set<string>();
    let totalLatency = 0;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      
      aggregate.totalRequests++;
      aggregate.totalTokens += data.tokensUsed || 0;
      
      if (data.uid) users.add(data.uid);
      
      const provider = data.provider || 'unknown';
      aggregate.byProvider[provider] = (aggregate.byProvider[provider] || 0) + 1;
      
      const operation = data.operation || 'unknown';
      aggregate.byOperation[operation] = (aggregate.byOperation[operation] || 0) + 1;
      
      if (data.latencyMs) totalLatency += data.latencyMs;
      if (data.error) aggregate.errorCount++;
    });

    aggregate.uniqueUsers = users.size;
    aggregate.avgLatency = aggregate.totalRequests > 0 
      ? Math.round(totalLatency / aggregate.totalRequests) 
      : 0;

    return aggregate;
  } catch (error) {
    console.error(`Error aggregating logs for ${date}:`, error);
    return null;
  }
}

/**
 * Save aggregate data
 */
async function saveAggregate(aggregate: UsageAggregate): Promise<boolean> {
  try {
    const aggregateRef = doc(db, COLLECTIONS.USAGE_AGGREGATES, aggregate.date);
    await setDoc(aggregateRef, {
      ...aggregate,
      createdAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error saving aggregate:', error);
    return false;
  }
}

/**
 * Delete logs in batches for a specific date
 */
async function deleteLogsForDate(date: string): Promise<number> {
  let totalDeleted = 0;
  
  try {
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    
    // Delete in batches to avoid memory issues
    while (true) {
      const logsQuery = query(
        logsRef,
        where('date', '==', date),
        firestoreLimit(MAX_BATCH_SIZE)
      );

      const snapshot = await getDocs(logsQuery);
      
      if (snapshot.empty) break;

      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      totalDeleted += snapshot.docs.length;

      console.log(`🗑️ Deleted batch of ${snapshot.docs.length} logs for ${date}`);
      
      // If we got fewer than batch size, we're done
      if (snapshot.docs.length < MAX_BATCH_SIZE) break;
      
      // Small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return totalDeleted;
  } catch (error) {
    console.error(`Error deleting logs for ${date}:`, error);
    return totalDeleted;
  }
}

/**
 * Clean up old logs with aggregation
 * Aggregates and deletes logs older than the retention period
 */
export async function cleanupOldLogs(
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<CleanupResult> {
  const startTime = Date.now();
  let totalDeleted = 0;
  let totalAggregated = 0;

  try {
    console.log(`🧹 Starting log cleanup (retention: ${retentionDays} days)...`);

    // Get dates to clean up
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    cutoffDate.setHours(0, 0, 0, 0);

    // Get unique dates in the logs that are older than cutoff
    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);
    const oldLogsQuery = query(
      logsRef,
      where('timestamp', '<', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'asc'),
      firestoreLimit(1000)
    );

    const snapshot = await getDocs(oldLogsQuery);
    
    if (snapshot.empty) {
      console.log('✅ No old logs to clean up');
      return {
        success: true,
        deletedCount: 0,
        aggregatedCount: 0,
        duration: Date.now() - startTime,
      };
    }

    // Get unique dates
    const datesToClean = new Set<string>();
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data.date) datesToClean.add(data.date);
    });

    console.log(`📅 Found ${datesToClean.size} dates to clean up`);

    // Process each date - convert Set to Array for iteration
    for (const date of Array.from(datesToClean)) {
      console.log(`\n📊 Processing ${date}...`);

      // Aggregate first
      const aggregate = await aggregateLogsForDate(date);
      if (aggregate) {
        const saved = await saveAggregate(aggregate);
        if (saved) {
          totalAggregated++;
          console.log(`  ✅ Aggregated: ${aggregate.totalRequests} requests, ${aggregate.uniqueUsers} users`);
        }
      }

      // Then delete
      const deleted = await deleteLogsForDate(date);
      totalDeleted += deleted;
      console.log(`  🗑️ Deleted: ${deleted} logs`);
    }

    // Log cleanup result
    await logCleanupResult({
      timestamp: new Date(),
      retentionDays,
      deletedCount: totalDeleted,
      aggregatedCount: totalAggregated,
      success: true,
    });

    console.log(`\n✅ Cleanup complete: ${totalDeleted} logs deleted, ${totalAggregated} days aggregated`);

    return {
      success: true,
      deletedCount: totalDeleted,
      aggregatedCount: totalAggregated,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Cleanup failed:', errorMsg);

    return {
      success: false,
      deletedCount: totalDeleted,
      aggregatedCount: totalAggregated,
      error: errorMsg,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Emergency cleanup - delete logs without aggregation (faster)
 */
export async function emergencyCleanup(daysToKeep: number = 3): Promise<CleanupResult> {
  const startTime = Date.now();
  let totalDeleted = 0;

  try {
    console.log(`🚨 Starting emergency cleanup (keeping last ${daysToKeep} days)...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const logsRef = collection(db, COLLECTIONS.API_USAGE_LOGS);

    while (true) {
      const oldLogsQuery = query(
        logsRef,
        where('timestamp', '<', Timestamp.fromDate(cutoffDate)),
        firestoreLimit(MAX_BATCH_SIZE)
      );

      const snapshot = await getDocs(oldLogsQuery);
      
      if (snapshot.empty) break;

      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      totalDeleted += snapshot.docs.length;
      console.log(`🗑️ Deleted batch: ${snapshot.docs.length} (total: ${totalDeleted})`);

      if (snapshot.docs.length < MAX_BATCH_SIZE) break;
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`✅ Emergency cleanup complete: ${totalDeleted} logs deleted`);

    return {
      success: true,
      deletedCount: totalDeleted,
      aggregatedCount: 0,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Emergency cleanup failed:', errorMsg);

    return {
      success: false,
      deletedCount: totalDeleted,
      aggregatedCount: 0,
      error: errorMsg,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Clean up old aggregates (keep only last N days)
 */
export async function cleanupOldAggregates(
  retentionDays: number = AGGREGATE_RETENTION_DAYS
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const aggregatesRef = collection(db, COLLECTIONS.USAGE_AGGREGATES);
    const oldAggregatesQuery = query(
      aggregatesRef,
      where('date', '<', cutoffDateStr)
    );

    const snapshot = await getDocs(oldAggregatesQuery);
    
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    console.log(`🗑️ Deleted ${snapshot.docs.length} old aggregates`);

    return snapshot.docs.length;
  } catch (error) {
    console.error('Error cleaning up old aggregates:', error);
    return 0;
  }
}

/**
 * Log cleanup result for audit trail
 */
async function logCleanupResult(result: {
  timestamp: Date;
  retentionDays: number;
  deletedCount: number;
  aggregatedCount: number;
  success: boolean;
  error?: string;
}): Promise<void> {
  try {
    const logRef = doc(db, COLLECTIONS.CLEANUP_LOGS, `cleanup_${result.timestamp.toISOString()}`);
    await setDoc(logRef, {
      ...result,
      timestamp: Timestamp.fromDate(result.timestamp),
    });
  } catch (error) {
    console.error('Error logging cleanup result:', error);
  }
}

/**
 * Get aggregated usage data for a date range
 */
export async function getAggregatedUsage(
  startDate: string,
  endDate: string
): Promise<UsageAggregate[]> {
  try {
    const aggregatesRef = collection(db, COLLECTIONS.USAGE_AGGREGATES);
    const aggregatesQuery = query(
      aggregatesRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(aggregatesQuery);
    
    return snapshot.docs.map(docSnap => docSnap.data() as UsageAggregate);
  } catch (error) {
    console.error('Error getting aggregated usage:', error);
    return [];
  }
}

/**
 * Schedule cleanup to run automatically
 * Call this from a cron job or scheduled function
 */
export async function runScheduledCleanup(): Promise<CleanupResult> {
  console.log('🕐 Running scheduled cleanup...');
  
  // Clean up detailed logs (keep 7 days)
  const logsResult = await cleanupOldLogs(7);
  
  // Clean up old aggregates (keep 90 days)
  await cleanupOldAggregates(90);
  
  return logsResult;
}
