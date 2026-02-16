/**
 * Test setup file for Vitest
 * Sets up environment variables and mocks needed for testing
 */

// Set test environment variables
(process.env as Record<string, string>).NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long-for-hs256';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters-long-for-hs256';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://:resumebuddy_redis_pass@localhost:6379';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://resumebuddy:resumebuddy_db_pass@localhost:5432/resumebuddy';
process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'resumebuddy';
process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'resumebuddy_minio_pass';
process.env.MINIO_BUCKET = process.env.MINIO_BUCKET || 'resumebuddy-test';
process.env.LATEX_SERVICE_URL = process.env.LATEX_SERVICE_URL || 'http://localhost:8080';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:9002';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.EMAIL_FROM = 'test@test.com';

// Global test utilities
import { afterAll } from 'vitest';

afterAll(async () => {
  // Cleanup: disconnect Redis if connected during tests
  try {
    const { disconnectRedis } = await import('@resumebuddy/auth');
    await disconnectRedis();
  } catch {
    // Ignore if not connected
  }
});
