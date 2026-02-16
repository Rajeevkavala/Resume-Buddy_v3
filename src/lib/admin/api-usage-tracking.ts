/**
 * API Usage Tracking — Prisma/PostgreSQL based
 * Tracks per-call API usage and aggregate statistics
 */

import { prisma } from '@/lib/db';

// ============ Types ============

export interface UserUsageStats {
  totalCalls: number;
  totalTokens: number;
  dailyCalls: number;
  dailyTokens: number;
  monthlyCalls: number;
  monthlyTokens: number;
  byProvider: Record<string, { calls: number; tokens: number }>;
}

export interface AggregatedStats {
  totalUsers: number;
  activeUsers: number;
  totalCalls: number;
  totalTokens: number;
  byProvider: Record<string, { calls: number; tokens: number }>;
}

export interface HistoricalDataPoint {
  date: string;
  calls: number;
  tokens: number;
  uniqueUsers: number;
}

// ============ Core Tracking ============

/**
 * Track an API call — called from multi-provider.ts after each AI generation
 */
export async function trackApiUsage(
  userId: string,
  provider: 'groq' | 'gemini' | 'openrouter',
  operation: string,
  tokensUsed: number,
  options?: { latencyMs?: number; success?: boolean; error?: string }
): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.$transaction([
      prisma.apiCallLog.create({
        data: {
          userId,
          provider,
          operation,
          tokensUsed,
          latencyMs: options?.latencyMs,
          success: options?.success ?? true,
          error: options?.error,
        },
      }),
      prisma.usageRecord.upsert({
        where: {
          userId_feature_date: { userId, feature: `api-${provider}`, date: today },
        },
        update: { count: { increment: 1 } },
        create: { userId, feature: `api-${provider}`, count: 1, date: today },
      }),
    ]);
  } catch (err) {
    console.warn('Failed to track API usage:', err);
  }
}

export const logApiUsage = trackApiUsage;

// ============ User Stats ============

export async function getUserUsageStats(userId: string): Promise<UserUsageStats> {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allTime, daily, monthly, byProvider] = await Promise.all([
    prisma.apiCallLog.aggregate({ where: { userId }, _count: true, _sum: { tokensUsed: true } }),
    prisma.apiCallLog.aggregate({ where: { userId, createdAt: { gte: todayStart } }, _count: true, _sum: { tokensUsed: true } }),
    prisma.apiCallLog.aggregate({ where: { userId, createdAt: { gte: monthStart } }, _count: true, _sum: { tokensUsed: true } }),
    prisma.apiCallLog.groupBy({ by: ['provider'], where: { userId }, _count: true, _sum: { tokensUsed: true } }),
  ]);

  const providerMap: Record<string, { calls: number; tokens: number }> = {};
  for (const p of byProvider) {
    providerMap[p.provider] = { calls: p._count, tokens: p._sum.tokensUsed ?? 0 };
  }

  return {
    totalCalls: allTime._count, totalTokens: allTime._sum.tokensUsed ?? 0,
    dailyCalls: daily._count, dailyTokens: daily._sum.tokensUsed ?? 0,
    monthlyCalls: monthly._count, monthlyTokens: monthly._sum.tokensUsed ?? 0,
    byProvider: providerMap,
  };
}

export async function getAggregatedUsageStats(): Promise<AggregatedStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUsers, totals, byProvider] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
    prisma.apiCallLog.aggregate({ _count: true, _sum: { tokensUsed: true } }),
    prisma.apiCallLog.groupBy({ by: ['provider'], _count: true, _sum: { tokensUsed: true } }),
  ]);

  const providerMap: Record<string, { calls: number; tokens: number }> = {};
  for (const p of byProvider) {
    providerMap[p.provider] = { calls: p._count, tokens: p._sum.tokensUsed ?? 0 };
  }

  return { totalUsers, activeUsers, totalCalls: totals._count, totalTokens: totals._sum.tokensUsed ?? 0, byProvider: providerMap };
}

// ============ Usage Limits ============

export async function resetUserDailyUsage(userId: string): Promise<void> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  await prisma.usageRecord.deleteMany({ where: { userId, date: today } });
}

export async function resetUserMonthlyUsage(userId: string): Promise<void> {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  await prisma.usageRecord.deleteMany({ where: { userId, date: { gte: monthStart } } });
}

export async function checkUserLimits(userId: string): Promise<{
  dailyExceeded: boolean; monthlyExceeded: boolean;
  dailyUsed: number; monthlyUsed: number;
  dailyLimit: number; monthlyLimit: number;
}> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  const isPro = user?.subscription?.tier === 'PRO' && user?.subscription?.status === 'ACTIVE';
  const dailyLimit = isPro ? 50 : 10;
  const monthlyLimit = isPro ? 1000 : 150;

  const [dailyCount, monthlyCount] = await Promise.all([
    prisma.apiCallLog.count({ where: { userId, createdAt: { gte: today } } }),
    prisma.apiCallLog.count({ where: { userId, createdAt: { gte: monthStart } } }),
  ]);

  return {
    dailyExceeded: dailyCount >= dailyLimit, monthlyExceeded: monthlyCount >= monthlyLimit,
    dailyUsed: dailyCount, monthlyUsed: monthlyCount, dailyLimit, monthlyLimit,
  };
}

export async function setUserLimits(userId: string, _dailyLimit: number, _monthlyLimit: number): Promise<void> {
  // Custom limits can be stored as user metadata or in a separate config table
  // For now this is a no-op — tier-based limits are used
  console.log(`setUserLimits called for ${userId} — using tier-based limits`);
}

// ============ Historical Data ============

export async function getHistoricalUsageData(days: number = 30): Promise<HistoricalDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const result = await prisma.$queryRaw<Array<{
    date: Date; calls: bigint; tokens: bigint; unique_users: bigint;
  }>>`
    SELECT DATE(created_at) as date, COUNT(*) as calls,
      COALESCE(SUM(tokens_used), 0) as tokens, COUNT(DISTINCT user_id) as unique_users
    FROM api_call_logs WHERE created_at >= ${startDate}
    GROUP BY DATE(created_at) ORDER BY date ASC
  `;

  return result.map((row) => ({
    date: row.date.toISOString().split('T')[0],
    calls: Number(row.calls), tokens: Number(row.tokens), uniqueUsers: Number(row.unique_users),
  }));
}

export async function deleteOldApiUsageLogs(daysOld: number): Promise<number> {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - daysOld);
  const result = await prisma.apiCallLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return result.count;
}

export async function getApiUsageLogCount(): Promise<number> {
  return prisma.apiCallLog.count();
}
