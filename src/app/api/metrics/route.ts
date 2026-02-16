import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/metrics
 * Expose basic application metrics for monitoring.
 * Protected: requires ADMIN_API_KEY or admin session.
 */
export async function GET(request: NextRequest) {
  // Verify authorization — require admin API key or internal access
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metrics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '2.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  };

  // Database metrics
  try {
    const { prisma } = await import('@/lib/db');
    const [userCount, resumeCount, subscriptionCount] = await Promise.all([
      prisma.user.count(),
      prisma.resumeData.count(),
      prisma.subscription.count(),
    ]);
    metrics.database = {
      users: userCount,
      resumes: resumeCount,
      subscriptions: subscriptionCount,
    };
  } catch (error) {
    metrics.database = {
      error: error instanceof Error ? error.message : 'unavailable',
    };
  }

  // Redis metrics
  try {
    const { getRedis } = await import('@/lib/auth');
    const redis = getRedis();
    const info = await redis.info('memory');
    const usedMemoryMatch = info.match(/used_memory_human:(.+)/);
    metrics.redis = {
      status: 'connected',
      usedMemory: usedMemoryMatch ? usedMemoryMatch[1].trim() : 'unknown',
    };
  } catch (error) {
    metrics.redis = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'unavailable',
    };
  }

  // Storage metrics
  try {
    const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const res = await fetch(`${minioEndpoint}/minio/health/live`, {
      signal: AbortSignal.timeout(3000),
    });
    metrics.storage = {
      status: res.ok ? 'healthy' : 'unhealthy',
    };
  } catch {
    metrics.storage = {
      status: 'unavailable',
    };
  }

  return NextResponse.json(metrics, { status: 200 });
}
