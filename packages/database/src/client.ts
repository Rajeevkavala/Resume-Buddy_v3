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
 * Append connection pool params to DATABASE_URL if not already present
 */
function appendPoolParams(url: string): string {
  if (!url) return url;
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

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
