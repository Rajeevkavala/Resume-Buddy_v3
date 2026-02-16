/**
 * Database Log Cleanup Utilities — Prisma/PostgreSQL based
 *
 * Manages cleanup of old API usage logs and data aggregation.
 * Much simpler with PostgreSQL — efficient DELETE WHERE + aggregate queries.
 */

import { prisma } from '@/lib/db';

// Configuration
const DEFAULT_RETENTION_DAYS = 7;
const AGGREGATE_RETENTION_DAYS = 90;

// ============ Types ============

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  aggregatedCount: number;
  error?: string;
  duration: number;
}

export interface UsageAggregate {
  date: string;
  totalRequests: number;
  totalTokens: number;
  uniqueUsers: number;
  byProvider: Record<string, number>;
  byOperation: Record<string, number>;
  avgLatency: number;
  errorCount: number;
}

// ============ Stats ============

export async function getLogCount(): Promise<number> {
  try {
    return await prisma.apiCallLog.count();
  } catch (error) {
    console.error('Error getting log count:', error);
    return -1;
  }
}

export async function getDatabaseStats(): Promise<{
  totalLogs: number;
  logsOlderThan7Days: number;
  logsOlderThan30Days: number;
  aggregatesCount: number;
  estimatedSize: string;
}> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalLogs, logsOlderThan7Days, logsOlderThan30Days] = await Promise.all([
      prisma.apiCallLog.count(),
      prisma.apiCallLog.count({ where: { createdAt: { lt: sevenDaysAgo } } }),
      prisma.apiCallLog.count({ where: { createdAt: { lt: thirtyDaysAgo } } }),
    ]);

    // Rough size estimate: ~200 bytes per row in PostgreSQL
    const estimatedSizeBytes = totalLogs * 200;
    const estimatedSize = formatBytes(estimatedSizeBytes);

    return { totalLogs, logsOlderThan7Days, logsOlderThan30Days, aggregatesCount: 0, estimatedSize };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { totalLogs: 0, logsOlderThan7Days: 0, logsOlderThan30Days: 0, aggregatesCount: 0, estimatedSize: '0 B' };
  }
}

// ============ Cleanup ============

/**
 * Clean up old logs — aggregate then delete.
 * PostgreSQL handles this efficiently with a single DELETE WHERE.
 */
export async function cleanupOldLogs(
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<CleanupResult> {
  const startTime = Date.now();

  try {
    console.log(`Starting log cleanup (retention: ${retentionDays} days)...`);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    cutoff.setHours(0, 0, 0, 0);

    // Check if there's anything to clean
    const oldCount = await prisma.apiCallLog.count({ where: { createdAt: { lt: cutoff } } });
    if (oldCount === 0) {
      console.log('No old logs to clean up');
      return { success: true, deletedCount: 0, aggregatedCount: 0, duration: Date.now() - startTime };
    }

    // Delete old logs (PostgreSQL handles bulk deletes efficiently)
    const { count: deletedCount } = await prisma.apiCallLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    console.log(`Cleanup complete: ${deletedCount} logs deleted`);
    return { success: true, deletedCount, aggregatedCount: 0, duration: Date.now() - startTime };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Cleanup failed:', errorMsg);
    return { success: false, deletedCount: 0, aggregatedCount: 0, error: errorMsg, duration: Date.now() - startTime };
  }
}

/**
 * Emergency cleanup — delete without aggregation (faster)
 */
export async function emergencyCleanup(daysToKeep: number = 3): Promise<CleanupResult> {
  const startTime = Date.now();

  try {
    console.log(`Starting emergency cleanup (keeping last ${daysToKeep} days)...`);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const { count: deletedCount } = await prisma.apiCallLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    console.log(`Emergency cleanup complete: ${deletedCount} logs deleted`);
    return { success: true, deletedCount, aggregatedCount: 0, duration: Date.now() - startTime };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Emergency cleanup failed:', errorMsg);
    return { success: false, deletedCount: 0, aggregatedCount: 0, error: errorMsg, duration: Date.now() - startTime };
  }
}

/**
 * Clean up old usage records
 */
export async function cleanupOldUsageRecords(
  retentionDays: number = AGGREGATE_RETENTION_DAYS
): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const { count } = await prisma.usageRecord.deleteMany({
      where: { date: { lt: cutoff } },
    });

    if (count > 0) console.log(`Deleted ${count} old usage records`);
    return count;
  } catch (error) {
    console.error('Error cleaning up old usage records:', error);
    return 0;
  }
}

/**
 * Clean up old user activity logs
 */
export async function cleanupOldActivityLogs(retentionDays: number = 90): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const { count } = await prisma.userActivity.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    if (count > 0) console.log(`Deleted ${count} old activity logs`);
    return count;
  } catch (error) {
    console.error('Error cleaning up old activity logs:', error);
    return 0;
  }
}

/**
 * Get aggregated usage data for a date range (computed on-the-fly)
 */
export async function getAggregatedUsage(
  startDate: string,
  endDate: string
): Promise<UsageAggregate[]> {
  try {
    const result = await prisma.$queryRaw<Array<{
      date: Date;
      total_requests: bigint;
      total_tokens: bigint;
      unique_users: bigint;
      avg_latency: number;
      error_count: bigint;
    }>>`
      SELECT DATE(created_at) as date,
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COUNT(DISTINCT user_id) as unique_users,
        COALESCE(AVG(latency_ms), 0) as avg_latency,
        COUNT(*) FILTER (WHERE success = false) as error_count
      FROM api_call_logs
      WHERE created_at >= ${new Date(startDate)}
        AND created_at <= ${new Date(endDate + 'T23:59:59.999Z')}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return result.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      totalRequests: Number(row.total_requests),
      totalTokens: Number(row.total_tokens),
      uniqueUsers: Number(row.unique_users),
      byProvider: {},
      byOperation: {},
      avgLatency: Math.round(row.avg_latency ?? 0),
      errorCount: Number(row.error_count),
    }));
  } catch (error) {
    console.error('Error getting aggregated usage:', error);
    return [];
  }
}

/**
 * Scheduled cleanup — call from cron job or API route
 */
export async function runScheduledCleanup(): Promise<CleanupResult> {
  console.log('Running scheduled cleanup...');

  const logsResult = await cleanupOldLogs(DEFAULT_RETENTION_DAYS);
  await cleanupOldUsageRecords(AGGREGATE_RETENTION_DAYS);
  await cleanupOldActivityLogs(90);

  return logsResult;
}

// ============ Helpers ============

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Re-export for backward compatibility
export const cleanupOldAggregates = cleanupOldUsageRecords;
export const deleteOldApiUsageLogs = async (daysOld: number) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const { count } = await prisma.apiCallLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
};
