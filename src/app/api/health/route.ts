import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

// ============ GET /api/health ============

export async function GET() {
  const start = Date.now();
  const services: HealthResponse['services'] = {
    database: { status: 'unhealthy' },
    redis: { status: 'unhealthy' },
    storage: { status: 'unhealthy' },
    latex: { status: 'unhealthy' },
  };

  // 1. Check PostgreSQL
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    services.database = {
      status: 'healthy',
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    services.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // 2. Check Redis
  try {
    const redisStart = Date.now();
    // Dynamic import to avoid breaking if redis isn't configured
    const { getRedis } = await import('@/lib/auth');
    const redis = getRedis();
    const pong = await redis.ping();
    services.redis = {
      status: pong === 'PONG' ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - redisStart,
    };
  } catch (error) {
    services.redis = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }

  // 3. Check MinIO Storage
  try {
    const storageStart = Date.now();
    const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

    const minioRes = await fetch(`${minioEndpoint}/minio/health/live`, {
      signal: controller2.signal,
    });
    clearTimeout(timeoutId2);

    services.storage = {
      status: minioRes.ok ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - storageStart,
    };
  } catch (error) {
    services.storage = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'MinIO unreachable',
    };
  }

  // 4. Check LaTeX Service
  try {
    const latexStart = Date.now();
    const latexUrl = process.env.LATEX_SERVICE_URL || 'http://localhost:8080';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${latexUrl}/healthz`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    services.latex = {
      status: res.ok ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - latexStart,
    };
  } catch (error) {
    services.latex = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'LaTeX service unreachable',
    };
  }

  // Determine overall status
  const allStatuses = Object.values(services).map((s) => s.status);
  const hasUnhealthy = allStatuses.includes('unhealthy');
  const allHealthy = allStatuses.every((s) => s === 'healthy');

  // Database is critical — if it's down, we're unhealthy
  // Redis/LaTeX can be degraded
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

  return NextResponse.json(response, { status: statusCode });
}
