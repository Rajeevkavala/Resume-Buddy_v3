/**
 * Next.js Instrumentation Hook
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 *
 * Runs once when the server starts. Used to:
 * 1. Warm up the Prisma connection pool so the first user request doesn't
 *    pay the cold-start penalty (~1000ms → ~20ms after warm-up).
 * 2. Establish the Redis connection early.
 * 3. Verify all required environment variables are present.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run in the Node.js runtime (not Edge)

    // ---- Validate required environment variables ----
    const required = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error(`[Startup] Missing required env vars: ${missing.join(', ')}`);
    }

    // ---- Warm up Prisma (establish connection pool) ----
    // $connect() forces the pool to open at least one connection immediately.
    // Without this, the pool is lazy — the first request after a cold start pays
    // the full TCP + TLS + auth handshake cost (~500-1000ms for cloud DBs).
    try {
      const { prisma } = await import('./packages/database/src');
      // Establish pool first, then run a no-op query to confirm connectivity
      await prisma.$connect();
      await prisma.$queryRawUnsafe('SELECT 1');
      console.log('[Startup] Database connection pool warmed up ✓');

      // ---- Keep-alive heartbeat ----
      // Cloud DBs (Supabase, Neon, DigitalOcean) drop idle TCP connections
      // after ~5 minutes. A lightweight ping every 4 minutes keeps the pool
      // active so subsequent requests get a warm connection instantly.
      if (process.env.NODE_ENV === 'production') {
        setInterval(async () => {
          try {
            await prisma.$queryRawUnsafe('SELECT 1');
          } catch {
            // Reconnect happens automatically via pool retry strategy
          }
        }, 4 * 60 * 1000); // every 4 minutes
      }
    } catch (err) {
      console.error('[Startup] Database warm-up failed:', err);
    }

    // ---- Warm up Redis ----
    try {
      const { getRedisClient } = await import('./src/lib/redis');
      const redis = getRedisClient();
      await redis.ping();
      console.log('[Startup] Redis connection established ✓');
    } catch (err) {
      console.error('[Startup] Redis warm-up failed:', err);
    }
  }
}
