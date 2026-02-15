/**
 * Response cache for AI requests using LRU cache
 * Caches AI responses to reduce API calls and improve performance
 */
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

interface CacheEntry {
  response: string;
  provider: string;
  timestamp: number;
}

// Cache AI responses with 1 hour TTL
const responseCache = new LRUCache<string, CacheEntry>({
  max: 1000, // Max cached responses
  ttl: 1000 * 60 * 60, // 1 hour cache
});

/**
 * Generate a cache key from prompt and system prompt
 */
function generateCacheKey(prompt: string, systemPrompt?: string): string {
  const content = `${systemPrompt || ''}::${prompt}`;
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Get a cached response if available
 * @param prompt - The user prompt
 * @param systemPrompt - The system prompt (optional)
 * @returns Cached content and provider, or undefined if not cached
 */
export function getCachedResponse(
  prompt: string,
  systemPrompt?: string
): { content: string; provider: string } | undefined {
  const key = generateCacheKey(prompt, systemPrompt);
  const cached = responseCache.get(key);

  if (cached) {
    console.log(`📦 Cache hit for key: ${key.substring(0, 8)}...`);
    return { content: cached.response, provider: `${cached.provider} (cached)` };
  }

  return undefined;
}

/**
 * Store a response in the cache
 * @param prompt - The user prompt
 * @param response - The AI response to cache
 * @param provider - The provider that generated the response
 * @param systemPrompt - The system prompt (optional)
 */
export function setCachedResponse(
  prompt: string,
  response: string,
  provider: string,
  systemPrompt?: string
): void {
  const key = generateCacheKey(prompt, systemPrompt);
  responseCache.set(key, {
    response,
    provider,
    timestamp: Date.now(),
  });
  console.log(`💾 Cached response for key: ${key.substring(0, 8)}...`);
}

/**
 * Clear a specific cached response
 */
export function clearCachedResponse(prompt: string, systemPrompt?: string): void {
  const key = generateCacheKey(prompt, systemPrompt);
  responseCache.delete(key);
}

/**
 * Clear all cached responses
 */
export function clearAllCache(): void {
  responseCache.clear();
  console.log('🗑️ All cached responses cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: string;
} {
  return {
    size: responseCache.size,
    maxSize: 1000,
    hitRate: 'N/A', // LRU cache doesn't track hit rate natively
  };
}
