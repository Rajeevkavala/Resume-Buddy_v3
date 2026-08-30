/**
 * Next.js Instrumentation Hook for Resume Buddy Monitor
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Warm up Prisma
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$connect();
      console.log("[Startup] Monitor DB pool warmed up ✓");
    } catch (err) {
      console.error("[Startup] Monitor DB warm-up note:", (err as Error)?.message || err);
    }

    // Warm up Redis
    try {
      const { getRedisClient } = await import("@/lib/redis/client");
      const redis = getRedisClient();
      await redis.ping();
      console.log("[Startup] Monitor Redis connection established ✓");
    } catch (err) {
      console.error("[Startup] Monitor Redis warm-up note:", (err as Error)?.message || err);
    }
  }
}
