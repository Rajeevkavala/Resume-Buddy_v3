// Re-export Prisma client singleton
export { prisma, default as prismaClient } from './client';

// Re-export Prisma types
export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';

// Re-export subscription helpers
export {
  getUserTier,
  checkFeatureAccess,
  assertFeatureAllowed,
  getRemainingCredits,
  incrementUsage,
  getDailyExportUsage,
  incrementExportUsage,
  TIER_LIMITS,
} from './subscription';
