/**
 * Usage Analytics and Monitoring
 * Tracks AI usage for monitoring, alerting, and optimization
 */
import { LRUCache } from 'lru-cache';

// Usage event structure
interface UsageEvent {
  timestamp: Date;
  userId: string;
  operation: string;
  provider: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
  success: boolean;
  error?: string;
}

// Alert configuration
interface AlertConfig {
  threshold: number;
  metric: 'requests' | 'tokens' | 'errors' | 'latency';
  windowMinutes: number;
  action: 'warn' | 'throttle' | 'block';
}

// Store recent usage events (keep last 10,000)
const usageEvents: UsageEvent[] = [];
const MAX_EVENTS = 10000;

// Daily aggregates for efficiency
const dailyAggregates = new LRUCache<string, {
  totalRequests: number;
  totalTokens: number;
  cachedRequests: number;
  errors: number;
  totalLatency: number;
}>({
  max: 30, // Keep 30 days
  ttl: 1000 * 60 * 60 * 24 * 30, // 30 days
});

// Alert configurations
const alertConfigs: AlertConfig[] = [
  { threshold: 80, metric: 'requests', windowMinutes: 60, action: 'warn' },
  { threshold: 95, metric: 'requests', windowMinutes: 60, action: 'throttle' },
  { threshold: 10, metric: 'errors', windowMinutes: 5, action: 'warn' },
  { threshold: 5000, metric: 'latency', windowMinutes: 5, action: 'warn' },
];

/**
 * Track a usage event
 */
export function trackUsage(event: Omit<UsageEvent, 'timestamp'>): void {
  const fullEvent: UsageEvent = {
    ...event,
    timestamp: new Date(),
  };

  usageEvents.push(fullEvent);

  // Trim old events if over limit
  if (usageEvents.length > MAX_EVENTS) {
    usageEvents.splice(0, usageEvents.length - MAX_EVENTS);
  }

  // Update daily aggregates
  const dateKey = fullEvent.timestamp.toISOString().split('T')[0];
  const existing = dailyAggregates.get(dateKey) || {
    totalRequests: 0,
    totalTokens: 0,
    cachedRequests: 0,
    errors: 0,
    totalLatency: 0,
  };

  existing.totalRequests++;
  existing.totalTokens += event.tokensUsed;
  if (event.cached) existing.cachedRequests++;
  if (!event.success) existing.errors++;
  existing.totalLatency += event.latencyMs;

  dailyAggregates.set(dateKey, existing);
}

/**
 * Get usage statistics for a time period
 * @param hours - Number of hours to look back (default: 24)
 */
export function getUsageStats(hours: number = 24): {
  totalRequests: number;
  cachedRequests: number;
  cacheHitRate: number;
  totalTokens: number;
  avgLatency: number;
  errorRate: number;
  byProvider: Record<string, number>;
  byOperation: Record<string, number>;
  requestsPerHour: { hour: string; count: number }[];
} {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const recentEvents = usageEvents.filter(e => e.timestamp > cutoff);

  const stats = {
    totalRequests: recentEvents.length,
    cachedRequests: recentEvents.filter(e => e.cached).length,
    cacheHitRate: 0,
    totalTokens: 0,
    avgLatency: 0,
    errorRate: 0,
    byProvider: {} as Record<string, number>,
    byOperation: {} as Record<string, number>,
    requestsPerHour: [] as { hour: string; count: number }[],
  };

  if (recentEvents.length === 0) return stats;

  // Calculate cache hit rate
  stats.cacheHitRate = Math.round((stats.cachedRequests / stats.totalRequests) * 100);

  // Sum tokens
  stats.totalTokens = recentEvents.reduce((sum, e) => sum + e.tokensUsed, 0);

  // Average latency (excluding cached)
  const nonCachedEvents = recentEvents.filter(e => !e.cached);
  if (nonCachedEvents.length > 0) {
    stats.avgLatency = Math.round(
      nonCachedEvents.reduce((sum, e) => sum + e.latencyMs, 0) / nonCachedEvents.length
    );
  }

  // Error rate
  const errorCount = recentEvents.filter(e => !e.success).length;
  stats.errorRate = Math.round((errorCount / stats.totalRequests) * 100);

  // Group by provider
  for (const event of recentEvents) {
    stats.byProvider[event.provider] = (stats.byProvider[event.provider] || 0) + 1;
    stats.byOperation[event.operation] = (stats.byOperation[event.operation] || 0) + 1;
  }

  // Requests per hour
  const hourlyMap = new Map<string, number>();
  for (const event of recentEvents) {
    const hourKey = event.timestamp.toISOString().substring(0, 13);
    hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + 1);
  }
  stats.requestsPerHour = Array.from(hourlyMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  return stats;
}

/**
 * Get usage statistics per user
 */
export function getUserUsageStats(userId: string, hours: number = 24): {
  totalRequests: number;
  totalTokens: number;
  operations: Record<string, number>;
} {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const userEvents = usageEvents.filter(
    e => e.userId === userId && e.timestamp > cutoff
  );

  const operations: Record<string, number> = {};
  for (const event of userEvents) {
    operations[event.operation] = (operations[event.operation] || 0) + 1;
  }

  return {
    totalRequests: userEvents.length,
    totalTokens: userEvents.reduce((sum, e) => sum + e.tokensUsed, 0),
    operations,
  };
}

/**
 * Check for alert conditions
 */
export function checkAlerts(): { triggered: boolean; alerts: string[] } {
  const alerts: string[] = [];
  const stats = getUsageStats(1); // Last hour

  for (const config of alertConfigs) {
    let value = 0;

    switch (config.metric) {
      case 'requests':
        // Check against daily limit (14,400 for Groq)
        value = (stats.totalRequests / 14400) * 100;
        break;
      case 'tokens':
        value = stats.totalTokens;
        break;
      case 'errors':
        value = stats.errorRate;
        break;
      case 'latency':
        value = stats.avgLatency;
        break;
    }

    if (value >= config.threshold) {
      alerts.push(
        `⚠️ ${config.metric.toUpperCase()}: ${value.toFixed(1)} exceeds threshold ${config.threshold} (action: ${config.action})`
      );
    }
  }

  return { triggered: alerts.length > 0, alerts };
}

/**
 * Estimate cost for a period (mostly $0 with free tiers)
 */
export function estimateCost(hours: number = 24): {
  totalCost: number;
  byProvider: Record<string, number>;
} {
  const costPer1kTokens: Record<string, number> = {
    groq: 0.00,         // Free tier
    gemini: 0.000125,   // ~$0.125 per 1M tokens (only if over free tier)
    openrouter: 0.00,   // Free models
  };

  const stats = getUsageStats(hours);
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const recentEvents = usageEvents.filter(e => e.timestamp > cutoff);

  const byProvider: Record<string, number> = {};
  let totalCost = 0;

  for (const event of recentEvents) {
    const costPerToken = (costPer1kTokens[event.provider] || 0) / 1000;
    const cost = event.tokensUsed * costPerToken;
    byProvider[event.provider] = (byProvider[event.provider] || 0) + cost;
    totalCost += cost;
  }

  return { totalCost, byProvider };
}

/**
 * Get top users by usage
 */
export function getTopUsers(hours: number = 24, limit: number = 10): {
  userId: string;
  requests: number;
  tokens: number;
}[] {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const recentEvents = usageEvents.filter(e => e.timestamp > cutoff);

  const userMap = new Map<string, { requests: number; tokens: number }>();

  for (const event of recentEvents) {
    const existing = userMap.get(event.userId) || { requests: 0, tokens: 0 };
    existing.requests++;
    existing.tokens += event.tokensUsed;
    userMap.set(event.userId, existing);
  }

  return Array.from(userMap.entries())
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, limit);
}

/**
 * Clear all analytics data (for testing)
 */
export function clearAnalytics(): void {
  usageEvents.length = 0;
  dailyAggregates.clear();
  console.log('🗑️ Analytics data cleared');
}

/**
 * Export analytics data for external monitoring
 */
export function exportAnalytics(hours: number = 24): {
  stats: ReturnType<typeof getUsageStats>;
  alerts: ReturnType<typeof checkAlerts>;
  cost: ReturnType<typeof estimateCost>;
  topUsers: ReturnType<typeof getTopUsers>;
} {
  return {
    stats: getUsageStats(hours),
    alerts: checkAlerts(),
    cost: estimateCost(hours),
    topUsers: getTopUsers(hours),
  };
}
