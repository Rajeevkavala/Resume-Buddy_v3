import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Conservative pool size for cloud/managed databases.
// Large pools on Supabase/Neon/DO can exhaust server-side connection limits.
// 10 is a safe default; override with DATABASE_POOL_SIZE env.
const POOL_SIZE = parseInt(process.env.DATABASE_POOL_SIZE || '10', 10);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: appendPoolParams(process.env.DATABASE_URL || ''),
      },
    },
  });

/**
 * Append connection pool params to DATABASE_URL if not already present.
 *
 * Tuning rationale:
 *  - connection_limit: small pool = fewer handshakes, faster check-out on warm runner
 *  - pool_timeout: 10 s — fail fast rather than queueing indefinitely
 *  - connect_timeout: 5 s — cloud DB round-trip; should connect in < 1 s when healthy
 *  - socket_timeout: 30 s — max time for a single query to return
 *
 * For Supabase pooler URLs, Prisma must run in PgBouncer mode
 * to avoid prepared statement collisions (error 42P05).
 */
function appendPoolParams(url: string): string {
  if (!url) return url;

  try {
    const parsedUrl = new URL(url);
    const isSupabasePooler = parsedUrl.hostname.includes('pooler.supabase.com');

    if (isSupabasePooler && !parsedUrl.searchParams.has('pgbouncer')) {
      parsedUrl.searchParams.set('pgbouncer', 'true');
    }

    if (!parsedUrl.searchParams.has('connection_limit')) {
      // Supabase transaction pooler only supports 1 connection per Prisma instance
      parsedUrl.searchParams.set('connection_limit', isSupabasePooler ? '1' : String(POOL_SIZE));
    }

    if (!parsedUrl.searchParams.has('pool_timeout')) {
      parsedUrl.searchParams.set('pool_timeout', '10'); // was 30 — fail fast
    }

    if (!parsedUrl.searchParams.has('connect_timeout')) {
      parsedUrl.searchParams.set('connect_timeout', '5'); // was 10
    }

    if (!parsedUrl.searchParams.has('socket_timeout')) {
      parsedUrl.searchParams.set('socket_timeout', '30');
    }

    return parsedUrl.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    const params: string[] = [];
    if (!url.includes('connection_limit')) params.push(`connection_limit=${POOL_SIZE}`);
    if (!url.includes('pool_timeout')) params.push('pool_timeout=10');
    if (!url.includes('connect_timeout')) params.push('connect_timeout=5');
    if (!url.includes('socket_timeout')) params.push('socket_timeout=30');
    return params.length > 0 ? `${url}${separator}${params.join('&')}` : url;
  }
}

// Always assign to global so the singleton persists across hot-reloads in dev
// AND across module re-evaluations in production (serverless / edge warm instances).
// Previously this only ran in non-production, meaning every production request that
// triggered a new module evaluation had to re-establish the full connection pool.
globalForPrisma.prisma = prisma;

export default prisma;
