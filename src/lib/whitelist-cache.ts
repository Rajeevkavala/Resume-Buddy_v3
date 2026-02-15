/**
 * Whitelist Cache System
 * Reduces Firestore reads by caching whitelist entries
 * Optimized for 250+ concurrent users
 */

import { LRUCache } from 'lru-cache';
import type { AccessCheckResult } from '@/types/admin';

interface CachedAccessResult extends AccessCheckResult {
  cachedAt: number;
}

// Cache configuration
const CACHE_CONFIG = {
  maxEntries: 500,           // Support 250+ users with buffer
  ttlMs: 5 * 60 * 1000,      // 5 minute TTL
  staleWhileRevalidate: true,
};

// Whitelist cache - stores access check results
const whitelistCache = new LRUCache<string, CachedAccessResult>({
  max: CACHE_CONFIG.maxEntries,
  ttl: CACHE_CONFIG.ttlMs,
  allowStale: CACHE_CONFIG.staleWhileRevalidate,
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

// Track cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  invalidations: 0,
};

/**
 * Get cached access result for an email
 */
export function getCachedAccess(email: string): AccessCheckResult | null {
  const normalizedEmail = email.toLowerCase().trim();
  const cached = whitelistCache.get(normalizedEmail);
  
  if (cached) {
    cacheStats.hits++;
    // Return without internal timestamp
    const { cachedAt, ...result } = cached;
    return result;
  }
  
  cacheStats.misses++;
  return null;
}

/**
 * Cache access result for an email
 */
export function setCachedAccess(email: string, result: AccessCheckResult): void {
  const normalizedEmail = email.toLowerCase().trim();
  whitelistCache.set(normalizedEmail, {
    ...result,
    cachedAt: Date.now(),
  });
}

/**
 * Invalidate cache for a specific email
 * Call this when whitelist entry is modified
 */
export function invalidateAccess(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  whitelistCache.delete(normalizedEmail);
  cacheStats.invalidations++;
}

/**
 * Invalidate all cached access entries
 * Call this when bulk whitelist changes occur
 */
export function invalidateAllAccess(): void {
  whitelistCache.clear();
  cacheStats.invalidations++;
}

/**
 * Get cache statistics
 */
export function getAccessCacheStats() {
  const total = cacheStats.hits + cacheStats.misses;
  return {
    ...cacheStats,
    hitRate: total > 0 ? (cacheStats.hits / total * 100).toFixed(2) + '%' : '0%',
    size: whitelistCache.size,
    maxSize: CACHE_CONFIG.maxEntries,
  };
}

/**
 * Preload whitelist entries into cache
 * Call this on server startup or periodically
 */
export function preloadAccessCache(entries: Array<{ email: string; result: AccessCheckResult }>): void {
  for (const entry of entries) {
    setCachedAccess(entry.email, entry.result);
  }
}
