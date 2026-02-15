// Re-export Prisma client from packages/database for use in the Next.js app via @/lib/db
// This bridges the monorepo package to the app's import system

export { prisma } from '../../packages/database/src';
export type { PrismaClient } from '@prisma/client';
