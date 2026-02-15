import Fastify from 'fastify';
import { execSync } from 'node:child_process';

import { registerResumeRoutes } from './routes/resume.js';
import { compileQueue } from './queue.js';
import { pdfCache } from './cache.js';
import { rateLimiter } from './rate-limiter.js';

const port = Number(process.env.PORT ?? '8080');
const host = process.env.HOST ?? '0.0.0.0';

// Performance tuning for 500 users on DigitalOcean
const CONNECTION_TIMEOUT = 30_000; // 30s
const KEEP_ALIVE_TIMEOUT = 65_000; // Slightly higher than ALB default (60s)
const REQUEST_TIMEOUT = 120_000; // 2 min max for PDF compilation

/**
 * Validate required dependencies and configuration at startup
 */
function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check tectonic binary
  try {
    execSync('tectonic --version', { stdio: 'pipe' });
  } catch {
    errors.push('tectonic binary not found on PATH. Install tectonic or run this service via Docker.');
  }

  // Validate port
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  // Check memory
  const memMB = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
  if (memMB < 256) {
    warnings.push(`Low initial heap memory: ${memMB}MB. Recommend at least 512MB for production.`);
  }

  // Log warnings
  for (const warning of warnings) {
    console.warn(`⚠️  ${warning}`);
  }

  // Fail on errors
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    for (const error of errors) {
      console.error(`   - ${error}`);
    }
    process.exit(1);
  }

  console.log('✅ Environment validated successfully');
}

async function buildServer() {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'production' 
      ? { level: process.env.LOG_LEVEL ?? 'warn' }
      : true,
    bodyLimit: 1_000_000, // ~1MB
    // Connection handling for high concurrency
    connectionTimeout: CONNECTION_TIMEOUT,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT,
    requestTimeout: REQUEST_TIMEOUT,
    // Trust proxy for DigitalOcean load balancer
    trustProxy: true,
  });

  // CORS for cross-origin requests from main app
  // In production, restrict to specific origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : null; // null means allow all (dev mode)
  
  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin) {
      // Validate origin in production
      const isAllowed = !allowedOrigins || allowedOrigins.includes(origin) || allowedOrigins.includes('*');
      
      if (isAllowed) {
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type');
        reply.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24h
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
      }
    }
    if (request.method === 'OPTIONS') {
      return reply.status(204).send();
    }
  });

  // Response compression headers (let reverse proxy handle actual compression)
  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
  });

  await registerResumeRoutes(app);

  // Health check endpoint
  app.get('/healthz', async () => ({ ok: true }));

  // Readiness probe - checks if service can accept requests
  app.get('/readyz', async () => {
    const stats = compileQueue.stats;
    const isReady = stats.queued < stats.maxQueueSize * 0.9; // Under 90% queue capacity
    return {
      ok: isReady,
      queue: stats,
      cache: pdfCache.stats,
    };
  });

  // Metrics endpoint for monitoring
  app.get('/metrics', async () => {
    const memUsage = process.memoryUsage();
    return {
      queue: compileQueue.stats,
      cache: pdfCache.stats,
      rateLimit: rateLimiter.stats,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      },
      uptime: Math.round(process.uptime()) + 's',
    };
  });

  return app;
}

const app = await buildServer();

// Graceful shutdown with queue draining
let isShuttingDown = false;
const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }
  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  // Stop accepting new connections
  console.log('Stopping new connections...');
  
  // Drain the queue (wait for in-progress tasks)
  console.log('Draining compile queue...');
  await compileQueue.shutdown();
  
  // Clear caches
  console.log('Clearing caches...');
  pdfCache.clear();
  rateLimiter.clear();
  
  // Close server
  await app.close();
  console.log('Server closed, exiting.');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't exit - let it continue if possible
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit - let it continue if possible
});

// Validate environment before starting
validateEnvironment();

await app.listen({ port, host });
console.log(`LaTeX service listening on ${host}:${port}`);
