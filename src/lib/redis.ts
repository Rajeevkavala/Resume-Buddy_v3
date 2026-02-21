/**
 * Redis client singleton for caching, rate limiting, and sessions
 * Uses ioredis with auto-pipelining for high-throughput (5000+ concurrent users)
 */
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 5,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    lazyConnect: true,
    enableReadyCheck: true,
    connectTimeout: 10000,
    // Production optimizations for 5000+ concurrent users:
    enableAutoPipelining: true, // Batch commands on the same tick into pipeline
    enableOfflineQueue: true,   // Queue commands when disconnected
    reconnectOnError: (err) => {
      // Reconnect on READONLY errors (e.g., during Redis failover)
      return err.message.includes('READONLY');
    },
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  // Connect immediately
  client.connect().catch((err) => {
    console.error('[Redis] Initial connection failed:', err.message);
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = createRedisClient();
  }
  return globalForRedis.redis;
}

/**
 * Check if Redis is available.
 * Uses the ioredis connection status directly — no network round-trip ping.
 * Falls back to a real ping if the status is ambiguous, but caches the result
 * for 30 seconds so repeated calls within the same window are free.
 */
let _redisAvailableCache: { value: boolean; until: number } = { value: false, until: 0 };
const REDIS_AVAILABLE_TTL = 30_000; // 30 seconds

export function isRedisAvailableSync(): boolean {
  try {
    const redis = getRedisClient();
    const status = redis.status; // 'ready' | 'connecting' | 'reconnecting' | 'close' | 'end'
    return status === 'ready';
  } catch {
    return false;
  }
}

export async function isRedisAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now < _redisAvailableCache.until) {
    return _redisAvailableCache.value;
  }

  // Fast path: trust ioredis status
  if (isRedisAvailableSync()) {
    _redisAvailableCache = { value: true, until: now + REDIS_AVAILABLE_TTL };
    return true;
  }

  // Slow path: try a real ping when status is uncertain
  try {
    const redis = getRedisClient();
    const result = await redis.ping();
    const available = result === 'PONG';
    _redisAvailableCache = { value: available, until: now + REDIS_AVAILABLE_TTL };
    return available;
  } catch {
    _redisAvailableCache = { value: false, until: now + 5_000 }; // shorter TTL on failure
    return false;
  }
}

export default getRedisClient;
