import type { FastifyInstance } from 'fastify';

import {
  latexCompileRequestSchema,
  latexCompileSuccessResponseSchema,
} from '../schemas.js';
import { serializeToLatex } from '../latex/serialize.js';
import { compileWithTectonic } from '../latex/compile.js';
import { compileQueue } from '../queue.js';
import { pdfCache, PDFCache } from '../cache.js';
import { rateLimiter } from '../rate-limiter.js';

function toErrorResponse(params: {
  error: 'INVALID_REQUEST' | 'COMPILE_FAILED' | 'INTERNAL_ERROR' | 'QUEUE_ERROR' | 'RATE_LIMITED';
  message: string;
  details?: unknown;
}) {
  return {
    ok: false as const,
    error: params.error,
    message: params.message,
    details: params.details,
  };
}

/**
 * Extract client IP from request (handles proxies)
 */
function getClientIp(request: any): string {
  // Check X-Forwarded-For header (set by load balancers/proxies)
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    // Take the first IP in the chain (original client)
    const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ips.split(',')[0].trim();
  }
  
  // Check X-Real-IP header (Nginx)
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }
  
  // Fallback to socket address
  return request.ip || request.socket?.remoteAddress || 'unknown';
}

export async function registerResumeRoutes(app: FastifyInstance) {
  app.post('/v1/resume/latex/compile', async (request, reply) => {
    const startTime = Date.now();
    const clientIp = getClientIp(request);
    const requestId = Math.random().toString(36).substring(2, 10);
    
    // Log incoming request
    console.log(`\n📥 [${requestId}] INCOMING REQUEST`);
    console.log(`   └─ IP: ${clientIp}`);
    console.log(`   └─ Time: ${new Date().toISOString()}`);

    // Rate limiting check
    const rateCheck = rateLimiter.check(clientIp);
    
    if (!rateCheck.allowed) {
      const duration = Date.now() - startTime;
      console.log(`🚫 [${requestId}] RATE LIMITED`);
      console.log(`   └─ Remaining: 0 | Retry After: ${rateCheck.retryAfter}s`);
      console.log(`   └─ Duration: ${duration}ms`);
      
      reply.header('Retry-After', String(rateCheck.retryAfter));
      reply.header('X-RateLimit-Remaining', '0');
      return reply.status(429).send(
        toErrorResponse({
          error: 'RATE_LIMITED',
          message: 'Too many requests. Please wait before trying again.',
          details: {
            retryAfter: rateCheck.retryAfter,
            limitPerMinute: 10,
          },
        }),
      );
    }
    
    console.log(`   └─ Rate Limit: ${rateCheck.remaining}/10 remaining`);
    
    // Add rate limit headers
    reply.header('X-RateLimit-Remaining', String(rateCheck.remaining));
    reply.header('X-RateLimit-Limit', '10');

    const parsed = latexCompileRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      const duration = Date.now() - startTime;
      console.log(`❌ [${requestId}] INVALID REQUEST`);
      console.log(`   └─ Error: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
      console.log(`   └─ Duration: ${duration}ms`);
      
      return reply.status(400).send(
        toErrorResponse({
          error: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: parsed.error.flatten(),
        }),
      );
    }

    const input = parsed.data;
    console.log(`   └─ Source: ${input.source} | Template: ${input.templateId}`);

    // Check cache first
    const cacheKey = PDFCache.generateKey({
      source: input.source,
      templateId: input.templateId,
      resumeText: input.source === 'resumeText' ? input.resumeText : undefined,
      resumeData: input.source === 'resumeData' ? input.resumeData : undefined,
    });

    const cached = pdfCache.get(cacheKey);
    if (cached) {
      const duration = Date.now() - startTime;
      console.log(`✅ [${requestId}] CACHE HIT`);
      console.log(`   └─ Duration: ${duration}ms`);
      
      request.log.info({ cacheHit: true }, 'Serving cached PDF');
      const response = {
        ok: true as const,
        latexSource: cached.latexSource,
        pdfBase64: cached.pdfBase64,
        cached: true,
      };
      return reply.status(200).send(response);
    }

    console.log(`   └─ Cache: MISS - Compiling...`);

    try {
      // Use queue for concurrency control
      const result = await compileQueue.enqueue(async () => {
        const { latexSource } = serializeToLatex(input);
        const { pdfBytes } = await compileWithTectonic(latexSource);
        return { latexSource, pdfBase64: pdfBytes.toString('base64') };
      });

      // Cache the result
      pdfCache.set(cacheKey, result);

      const response = {
        ok: true as const,
        latexSource: result.latexSource,
        pdfBase64: result.pdfBase64,
      };

      // Defensive: ensure response matches contract.
      const validated = latexCompileSuccessResponseSchema.parse(response);

      const duration = Date.now() - startTime;
      const pdfSizeKB = Math.round(result.pdfBase64.length * 0.75 / 1024);
      console.log(`✅ [${requestId}] COMPLETED`);
      console.log(`   └─ PDF Size: ${pdfSizeKB}KB | Duration: ${duration}ms`);

      return reply.status(200).send(validated);
    } catch (err) {
      const duration = Date.now() - startTime;
      const message = err instanceof Error ? err.message : 'Unknown error';
      const code = (err as any)?.code;

      // Handle queue errors (503 Service Unavailable)
      if (code === 'QUEUE_FULL' || code === 'QUEUE_TIMEOUT') {
        console.log(`⚠️  [${requestId}] QUEUE ERROR`);
        console.log(`   └─ Code: ${code} | Duration: ${duration}ms`);
        
        return reply.status(503).send(
          toErrorResponse({
            error: 'QUEUE_ERROR',
            message: 'Service busy. Please retry.',
            details: {
              code,
              retryAfter: code === 'QUEUE_FULL' ? 5 : 10,
              queueStats: compileQueue.stats,
            },
          }),
        );
      }

      // Handle known compile failures.
      if (
        code === 'TECTONIC_FAILED' ||
        code === 'TECTONIC_NOT_FOUND' ||
        code === 'TECTONIC_SPAWN_FAILED' ||
        code === 'EMPTY_PDF' ||
        code === 'INVALID_PDF' ||
        code === 'PDF_TOO_LARGE' ||
        code === 'TIMEOUT'
      ) {
        console.log(`❌ [${requestId}] COMPILE FAILED`);
        console.log(`   └─ Code: ${code} | Error: ${message}`);
        console.log(`   └─ Duration: ${duration}ms`);
        
        return reply.status(422).send(
          toErrorResponse({
            error: 'COMPILE_FAILED',
            message: 'LaTeX compilation failed',
            details: {
              code,
              error: message,
            },
          }),
        );
      }

      console.log(`❌ [${requestId}] INTERNAL ERROR`);
      console.log(`   └─ Error: ${message}`);
      console.log(`   └─ Duration: ${duration}ms`);

      request.log.error({ err }, 'latex compile failed');
      return reply.status(500).send(
        toErrorResponse({
          error: 'INTERNAL_ERROR',
          message: 'Internal error',
        }),
      );
    }
  });
}
