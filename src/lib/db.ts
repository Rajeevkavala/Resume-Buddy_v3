import 'server-only';

// Re-export Prisma client from packages/database for use in the Next.js app via @/lib/db
// This is server-only: Prisma Client cannot run in the browser.

export { prisma } from '../../packages/database/src';
export type { PrismaClient } from '@prisma/client';
