// =============================================================================
// Resume Buddy Monitor v2 — Upstash Redis Client Singleton
// =============================================================================

import Redis from "ioredis";

let redisInstance: Redis | null = null;
let pubInstance: Redis | null = null;
let subInstance: Redis | null = null;

function createClient(): Redis {
  const url =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "redis://localhost:6379";

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 5) return null; // Stop retrying after 5 attempts
      return Math.min(times * 200, 2000);
    },
    tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    // Gracefully log Redis connection errors without crashing
    if (process.env.NODE_ENV !== "test") {
      console.warn("[Monitor:Redis] Connection error:", err.message);
    }
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = createClient();
    redisInstance.connect().catch(() => {});
  }
  return redisInstance;
}

export function getRedisPubClient(): Redis {
  if (!pubInstance) {
    pubInstance = createClient();
    pubInstance.connect().catch(() => {});
  }
  return pubInstance;
}

export function getRedisSubClient(): Redis {
  if (!subInstance) {
    subInstance = createClient();
    subInstance.connect().catch(() => {});
  }
  return subInstance;
}
