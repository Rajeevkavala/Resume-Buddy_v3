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
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export default getRedisClient;
