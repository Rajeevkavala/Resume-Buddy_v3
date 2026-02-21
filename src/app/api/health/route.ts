import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latencyMs?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    storage: ServiceStatus;
    latex: ServiceStatus;
  };
}

// ============ In-memory health cache (10 s) ============
// Prevents hammering the DB/storage on every scrape or load-balancer probe.
let _healthCache: { result: HealthResponse; statusCode: number; at: number } | null = null;
const HEALTH_CACHE_TTL_MS = 10_000; // 10 seconds

// ============ Per-service check helpers ============

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Use a raw query that bypasses Prisma query engine overhead.
    // Race against a hard 3-second timeout so a slow DB doesn't block everything.
    await withTimeout(
      prisma.$queryRawUnsafe<unknown[]>('SELECT 1'),
      3000,
      'database'
    );
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Database connection failed',
    };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Re-use the already-connected singleton — no dynamic import overhead.
    const redis = getRedisClient();
    const pong = await withTimeout(redis.ping(), 2000, 'redis');
    return {
      status: pong === 'PONG' ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Redis connection failed',
    };
  }
}

async function checkStorage(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Normalise the MINIO_ENDPOINT — it may be "host:port" or "http://host:port"
    let base = process.env.MINIO_ENDPOINT ?? 'http://localhost:9000';
    if (!base.startsWith('http')) base = `http://${base}`;
    // Remove trailing slash
    base = base.replace(/\/$/, '');

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${base}/minio/health/live`, {
      method: 'HEAD', // lighter than GET — no body transfer
      signal: controller.signal,
    });
    clearTimeout(tid);
    return {
      status: res.ok ? 'healthy' : 'degraded',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'MinIO unreachable',
    };
  }
}

async function checkLatex(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const latexUrl = (process.env.LATEX_SERVICE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${latexUrl}/healthz`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(tid);
    return {
      status: res.ok ? 'healthy' : 'degraded',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'LaTeX service unreachable',
    };
  }
}

// ============ GET /api/health ============

export async function GET() {
  // Serve cached result if still fresh
  if (_healthCache && Date.now() - _healthCache.at < HEALTH_CACHE_TTL_MS) {
    return NextResponse.json(_healthCache.result, {
      status: _healthCache.statusCode,
      headers: { 'X-Health-Cached': 'true' },
    });
  }

  // Run ALL four checks in parallel — total time = slowest single check, not sum
  const [database, redis, storage, latex] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
    checkLatex(),
  ]);

  const services: HealthResponse['services'] = { database, redis, storage, latex };

  const allStatuses = Object.values(services).map((s) => s.status);
  const allHealthy = allStatuses.every((s) => s === 'healthy');

  const overallStatus: HealthResponse['status'] =
    services.database.status === 'unhealthy'
      ? 'unhealthy'
      : allHealthy
        ? 'healthy'
        : 'degraded';

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: process.uptime(),
    services,
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  // Cache the result
  _healthCache = { result: response, statusCode, at: Date.now() };

  return NextResponse.json(response, { status: statusCode });
}
