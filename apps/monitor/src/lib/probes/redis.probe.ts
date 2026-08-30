import type { ProbeResult, RedisStats } from "@/types/monitor";

const REDIS_URL = process.env.REDIS_URL || "";

let redisClient: import("ioredis").Redis | null = null;

async function getRedis() {
  if (!redisClient) {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 2000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
  }
  return redisClient;
}

export async function runRedisProbe(): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const redis = await getRedis();
    const pingResult = await redis.ping();
    const latency = Date.now() - start;

    const isDegraded = latency > 400;

    if (pingResult !== "PONG") {
      return {
        serviceKey: "redis-cache",
        serviceName: "Upstash Redis",
        status: "DOWN",
        latencyMs: latency,
        errorMessage: "PING did not return PONG",
        checkedAt: new Date(),
      };
    }

    // Quick SET/GET/DEL roundtrip
    const testKey = `monitor:probe:${Date.now()}`;
    await redis.set(testKey, "ok", "EX", 10);
    const val = await redis.get(testKey);
    await redis.del(testKey);
    const roundtripOk = val === "ok";

    return {
      serviceKey: "redis-cache",
      serviceName: "Upstash Redis",
      status: !roundtripOk ? "DOWN" : isDegraded ? "DEGRADED" : "HEALTHY",
      latencyMs: latency,
      metadata: { pingOk: true, roundtripOk },
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      serviceKey: "redis-cache",
      serviceName: "Upstash Redis",
      status: "DOWN",
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : "Redis probe failed",
      checkedAt: new Date(),
    };
  }
}

export async function getRedisStats(): Promise<RedisStats | null> {
  try {
    const redis = await getRedis();
    const pingStart = Date.now();
    await redis.ping();
    const pingLatencyMs = Date.now() - pingStart;

    const info = await redis.info("all");
    const lines = info.split("\r\n");
    const get = (key: string): string => {
      const line = lines.find((l) => l.startsWith(`${key}:`));
      return line ? line.split(":")[1]?.trim() || "0" : "0";
    };

    const memUsedBytes = parseInt(get("used_memory"), 10);
    const keyspaceHits = parseInt(get("keyspace_hits"), 10);
    const keyspaceMisses = parseInt(get("keyspace_misses"), 10);
    const totalCommands = parseInt(get("total_commands_processed"), 10);
    const connectedClients = parseInt(get("connected_clients"), 10);

    const hitRatio =
      keyspaceHits + keyspaceMisses > 0
        ? (keyspaceHits / (keyspaceHits + keyspaceMisses)) * 100
        : 0;

    // Count total keys
    const dbInfo = get("db0");
    const keyMatch = dbInfo.match(/keys=(\d+)/);
    const totalKeys = keyMatch ? parseInt(keyMatch[1], 10) : 0;

    return {
      memoryUsedBytes: memUsedBytes,
      memoryUsedMB: memUsedBytes / (1024 * 1024),
      commandsPerSecond: totalCommands,
      keyspaceHits,
      keyspaceMisses,
      hitRatioPercent: hitRatio,
      connectedClients,
      totalKeys,
      pingLatencyMs,
    };
  } catch {
    return null;
  }
}
