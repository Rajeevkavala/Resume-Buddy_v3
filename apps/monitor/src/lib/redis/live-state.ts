// =============================================================================
// Resume Buddy Monitor v2 — Redis Live State Readers & Writers
// =============================================================================

import { getRedisClient } from "./client";
import type { ServiceKey, ServiceStatus } from "@/types/monitor";
import type {
  RedisLiveSummary,
  RedisLiveServiceHealth,
  RedisLiveSlo,
  RedisLiveCosts,
} from "@/types/redis";
import type { AlertEventDTO, IncidentDTO } from "@/types/api";

const PREFIX = "monitor:live:";
const TTL_SHORT = 60; // 1 minute
const TTL_MEDIUM = 120; // 2 minutes
const TTL_LONG = 300; // 5 minutes

export async function setLiveSummary(summary: RedisLiveSummary): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(`${PREFIX}summary`, JSON.stringify(summary), "EX", TTL_SHORT);
  } catch {}
}

export async function getLiveSummary(): Promise<RedisLiveSummary | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`${PREFIX}summary`);
    if (!raw) return null;
    return JSON.parse(raw) as RedisLiveSummary;
  } catch {
    return null;
  }
}

export async function setLiveServiceHealth(
  health: RedisLiveServiceHealth
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(
      `${PREFIX}health:${health.serviceKey}`,
      JSON.stringify(health),
      "EX",
      TTL_SHORT
    );
  } catch {}
}

export async function getLiveServiceHealth(
  serviceKey: ServiceKey
): Promise<RedisLiveServiceHealth | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`${PREFIX}health:${serviceKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as RedisLiveServiceHealth;
  } catch {
    return null;
  }
}

export async function getAllLiveServices(
  serviceKeys: ServiceKey[]
): Promise<RedisLiveServiceHealth[]> {
  try {
    const redis = getRedisClient();
    if (serviceKeys.length === 0) return [];
    const keys = serviceKeys.map((k) => `${PREFIX}health:${k}`);
    const results = await redis.mget(...keys);
    return results
      .filter((r): r is string => Boolean(r))
      .map((r) => JSON.parse(r) as RedisLiveServiceHealth);
  } catch {
    return [];
  }
}

export async function setLiveMetrics(
  metricKey: string,
  data: unknown,
  ttlSeconds = TTL_MEDIUM
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(
      `${PREFIX}metrics:${metricKey}`,
      JSON.stringify(data),
      "EX",
      ttlSeconds
    );
  } catch {}
}

export async function getLiveMetrics<T>(metricKey: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`${PREFIX}metrics:${metricKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setLiveAlerts(alerts: AlertEventDTO[]): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(`${PREFIX}alerts:active`, JSON.stringify(alerts));
  } catch {}
}

export async function getLiveAlerts(): Promise<AlertEventDTO[]> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`${PREFIX}alerts:active`);
    if (!raw) return [];
    return JSON.parse(raw) as AlertEventDTO[];
  } catch {
    return [];
  }
}

export async function setLiveIncidents(
  incidents: IncidentDTO[]
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(`${PREFIX}incidents:open`, JSON.stringify(incidents));
  } catch {}
}

export async function getLiveIncidents(): Promise<IncidentDTO[]> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`${PREFIX}incidents:open`);
    if (!raw) return [];
    return JSON.parse(raw) as IncidentDTO[];
  } catch {
    return [];
  }
}

export async function setLiveSlo(slo: RedisLiveSlo): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(`${PREFIX}slo`, JSON.stringify(slo), "EX", TTL_LONG);
  } catch {}
}

export async function getLiveSlo(): Promise<RedisLiveSlo | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`${PREFIX}slo`);
    if (!raw) return null;
    return JSON.parse(raw) as RedisLiveSlo;
  } catch {
    return null;
  }
}

export async function setLiveCosts(costs: RedisLiveCosts): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(`${PREFIX}costs`, JSON.stringify(costs), "EX", TTL_LONG);
  } catch {}
}

export async function getLiveCosts(): Promise<RedisLiveCosts | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(`${PREFIX}costs`);
    if (!raw) return null;
    return JSON.parse(raw) as RedisLiveCosts;
  } catch {
    return null;
  }
}
