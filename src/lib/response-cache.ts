/**
 * Response cache for AI requests using Redis
 * Caches AI responses to reduce API calls and improve performance
 * Falls back to in-memory Map if Redis is unavailable
 */
import { getRedisClient, isRedisAvailableSync } from './redis';
import crypto from 'crypto';

const CACHE_PREFIX = 'ai_cache:';
const CACHE_TTL = 3600; // 1 hour in seconds

// In-memory fallback cache (limited size)
const memoryFallback = new Map<string, { response: string; provider: string; timestamp: number }>();
const MAX_MEMORY_ENTRIES = 200;

/**
 * Generate a cache key from prompt and system prompt
 */
function generateCacheKey(prompt: string, systemPrompt?: string): string {
  const content = `${systemPrompt || ''}::${prompt}`;
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Get a cached response if available
 */
export async function getCachedResponse(
  prompt: string,
  systemPrompt?: string
): Promise<{ content: string; provider: string } | undefined> {
  const key = generateCacheKey(prompt, systemPrompt);

  try {
    const redisAvailable = isRedisAvailableSync();
    if (redisAvailable) {
      const redis = getRedisClient();
      const cached = await redis.get(`${CACHE_PREFIX}${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`📦 Cache hit (Redis) for key: ${key.substring(0, 8)}...`);
        return { content: parsed.response, provider: `${parsed.provider} (cached)` };
      }
    } else {
      // Fallback to memory
      const cached = memoryFallback.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
        console.log(`📦 Cache hit (memory) for key: ${key.substring(0, 8)}...`);
        return { content: cached.response, provider: `${cached.provider} (cached)` };
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }

  return undefined;
}

/**
 * Store a response in the cache
 */
export async function setCachedResponse(
  prompt: string,
  response: string,
  provider: string,
  systemPrompt?: string
): Promise<void> {
  const key = generateCacheKey(prompt, systemPrompt);

  try {
    const redisAvailable = isRedisAvailableSync();
    if (redisAvailable) {
      const redis = getRedisClient();
      await redis.setex(
        `${CACHE_PREFIX}${key}`,
        CACHE_TTL,
        JSON.stringify({ response, provider, timestamp: Date.now() })
      );
      console.log(`💾 Cached response (Redis) for key: ${key.substring(0, 8)}...`);
    } else {
      // Fallback to memory
      if (memoryFallback.size >= MAX_MEMORY_ENTRIES) {
        // Evict oldest entry
        const firstKey = memoryFallback.keys().next().value;
        if (firstKey) memoryFallback.delete(firstKey);
      }
      memoryFallback.set(key, { response, provider, timestamp: Date.now() });
      console.log(`💾 Cached response (memory) for key: ${key.substring(0, 8)}...`);
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Clear a specific cached response
 */
export async function clearCachedResponse(prompt: string, systemPrompt?: string): Promise<void> {
  const key = generateCacheKey(prompt, systemPrompt);

  try {
    const redisAvailable = isRedisAvailableSync();
    if (redisAvailable) {
      const redis = getRedisClient();
      await redis.del(`${CACHE_PREFIX}${key}`);
    }
    memoryFallback.delete(key);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Clear all cached responses
 */
export async function clearAllCache(): Promise<void> {
  try {
    const redisAvailable = isRedisAvailableSync();
    if (redisAvailable) {
      const redis = getRedisClient();
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
    memoryFallback.clear();
    console.log('🗑️ All cached responses cleared');
  } catch (error) {
    console.error('Cache clear all error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  size: number;
  maxSize: number;
  hitRate: string;
}> {
  try {
    const redisAvailable = isRedisAvailableSync();
    if (redisAvailable) {
      const redis = getRedisClient();
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      return {
        size: keys.length,
        maxSize: -1, // Redis has no fixed max
        hitRate: 'N/A',
      };
    }
  } catch (error) {
    // Fallback
  }

  return {
    size: memoryFallback.size,
    maxSize: MAX_MEMORY_ENTRIES,
    hitRate: 'N/A',
  };
}
