import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Production-ready Prisma client with connection pool configuration
// Connection pool size is controlled via DATABASE_URL params:
//   ?connection_limit=25&pool_timeout=30
// Or via environment variable below as fallback
const POOL_SIZE = parseInt(process.env.DATABASE_POOL_SIZE || '25', 10);

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
      parsedUrl.searchParams.set('connection_limit', isSupabasePooler ? '1' : String(POOL_SIZE));
    }

    if (!parsedUrl.searchParams.has('pool_timeout')) {
      parsedUrl.searchParams.set('pool_timeout', '30');
    }

    if (!parsedUrl.searchParams.has('connect_timeout')) {
      parsedUrl.searchParams.set('connect_timeout', '10');
    }

    return parsedUrl.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    const params: string[] = [];
    if (!url.includes('connection_limit')) {
      params.push(`connection_limit=${POOL_SIZE}`);
    }
    if (!url.includes('pool_timeout')) {
      params.push('pool_timeout=30');
    }
    if (!url.includes('connect_timeout')) {
      params.push('connect_timeout=10');
    }
    return params.length > 0 ? `${url}${separator}${params.join('&')}` : url;
  }
}

// Always assign to global so the singleton persists across hot-reloads in dev
// AND across module re-evaluations in production (serverless / edge warm instances).
// Previously this only ran in non-production, meaning every production request that
// triggered a new module evaluation had to re-establish the full connection pool.
globalForPrisma.prisma = prisma;

export default prisma;
