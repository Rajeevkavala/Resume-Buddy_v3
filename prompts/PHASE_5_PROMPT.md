# Phase 5: Launch - Testing, QA & Production Deployment

> **Copilot Agent Prompt for Phase 5 Implementation**
> **Estimated Duration**: ~8 hours
> **Dependencies**: ALL previous phases (1-4) must be complete
> **Blocking**: None (final phase)

---

## Instruction

Take the `ARCHITECTURE_TRANSFORMATION.md` as the **primary reference** and `IMPLEMENTATION_TIMELINE_7_DAYS.md` as the secondary reference for phase-wise implementation.

Now implement **Phase 5 completely end-to-end** — it should work 100% without any errors. Test after implementing.

**Important**: If `IMPLEMENTATION_TIMELINE_7_DAYS.md` does not have enough context, use `ARCHITECTURE_TRANSFORMATION.md` as the primary source of truth for all code, schemas, configurations, and architectural decisions.

**Prerequisite**: ALL phases must be fully working:
- Phase 1: Docker infrastructure (PostgreSQL, Redis, MinIO) + Custom auth (JWT, sessions, OAuth)
- Phase 2: Complete Prisma schema + migrated server actions + subscription/rate limiting on PostgreSQL/Redis
- Phase 3: OTP authentication + email notification system with BullMQ
- Phase 4: MinIO file storage + Resume Library UI

---

## Phase 5 Scope

Phase 5 has two sub-phases:
1. **Phase 5.1 — Testing & QA** (~4 hours)
2. **Phase 5.2 — Production Deployment** (~4 hours)

---

## Phase 5.1: Testing & QA

### Objective
Write comprehensive integration tests, fix discovered bugs, optimize performance, and ensure the entire migrated platform works flawlessly end-to-end.

### Tasks (implement in order)

#### 1. Set Up Test Infrastructure
- Install test dependencies:
  ```bash
  pnpm add -D vitest @testing-library/react @testing-library/jest-dom
  pnpm add -D @testing-library/user-event msw  # Mock Service Worker for API mocking
  pnpm add -D testcontainers                    # Docker-based test containers (optional)
  ```
- Create `vitest.config.ts` at root:
  ```typescript
  import { defineConfig } from 'vitest/config';
  import path from 'path';

  export default defineConfig({
    test: {
      globals: true,
      environment: 'node',         // Use 'jsdom' for component tests
      include: ['**/*.test.ts', '**/*.test.tsx'],
      exclude: ['node_modules', '.next', 'services'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules', '.next', '**/*.d.ts', '**/*.config.*'],
      },
      setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@resumebuddy/auth': path.resolve(__dirname, 'packages/auth/src'),
        '@resumebuddy/database': path.resolve(__dirname, 'packages/database/src'),
        '@resumebuddy/storage': path.resolve(__dirname, 'packages/storage/src'),
        '@resumebuddy/queue': path.resolve(__dirname, 'packages/queue/src'),
      },
    },
  });
  ```
- Create `tests/setup.ts` with environment variables for test DB/Redis

#### 2. Auth Integration Tests (`tests/auth/`)

**`tests/auth/jwt.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { generateAccessToken, verifyAccessToken, generateTokenPair, verifyRefreshToken } from '@resumebuddy/auth';

describe('JWT Token System', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    role: 'USER' as const,
    tier: 'free' as const,
  };

  it('should generate a valid access token', async () => {
    const token = await generateAccessToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid access token', async () => {
    const token = await generateAccessToken(mockUser);
    const payload = await verifyAccessToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-123');
    expect(payload?.email).toBe('test@test.com');
  });

  it('should reject an expired access token', async () => {
    // Generate token with 0-second expiry (already expired)
    // Verify returns null
  });

  it('should reject a tampered token', async () => {
    const token = await generateAccessToken(mockUser);
    const tampered = token.slice(0, -5) + 'xxxxx';
    const payload = await verifyAccessToken(tampered);
    expect(payload).toBeNull();
  });

  it('should generate a valid token pair', async () => {
    const pair = await generateTokenPair(mockUser);
    expect(pair.accessToken).toBeDefined();
    expect(pair.refreshToken).toBeDefined();
    expect(pair.expiresIn).toBe(900); // 15 minutes
  });

  it('should verify refresh token separately', async () => {
    const pair = await generateTokenPair(mockUser);
    const payload = await verifyRefreshToken(pair.refreshToken);
    expect(payload?.sub).toBe('user-123');
    expect(payload?.type).toBe('refresh');
  });
});
```

**`tests/auth/session.test.ts`**
```typescript
describe('Redis Session Management', () => {
  it('should create a session and return sessionId');
  it('should retrieve a session by sessionId');
  it('should update session activity timestamp');
  it('should delete a session');
  it('should delete all sessions for a user');
  it('should list all active sessions for a user');
  it('should expire sessions after TTL');
});
```

**`tests/auth/password.test.ts`**
```typescript
describe('Password Utilities', () => {
  it('should hash a password with bcrypt');
  it('should verify correct password');
  it('should reject incorrect password');
  it('should validate password requirements (length, chars)');
  it('should reject weak passwords');
  it('should rate password strength correctly');
});
```

**`tests/auth/otp.test.ts`**
```typescript
describe('OTP System', () => {
  it('should generate 6-digit OTP');
  it('should store OTP in Redis with TTL');
  it('should verify correct OTP');
  it('should reject incorrect OTP and decrement attempts');
  it('should block after max attempts');
  it('should enforce cooldown between sends');
  it('should clear OTP after successful verification');
});
```

#### 3. API Route Tests (`tests/api/`)

**`tests/api/auth-routes.test.ts`**
```typescript
describe('Auth API Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens');
    it('should return 400 for invalid input');
    it('should return 409 for duplicate email');
    it('should return 400 for weak password');
    it('should create initial free subscription');
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials');
    it('should return 401 for wrong password');
    it('should return 404 for non-existent user');
    it('should return 403 for suspended user');
    it('should set session cookie');
  });

  describe('POST /api/auth/logout', () => {
    it('should clear session and cookies');
    it('should work even without valid session');
  });

  describe('POST /api/auth/refresh', () => {
    it('should rotate tokens and return new pair');
    it('should return 401 for invalid refresh token');
    it('should revoke old refresh token');
  });

  describe('GET /api/auth/session', () => {
    it('should return user data for valid session');
    it('should return 401 for invalid session');
  });
});
```

**`tests/api/resume-routes.test.ts`**
```typescript
describe('Resume API Routes', () => {
  describe('GET /api/resumes', () => {
    it('should list user resumes with pagination');
    it('should return 401 for unauthenticated request');
    it('should filter by active/archived');
  });

  describe('POST /api/resumes/upload', () => {
    it('should upload PDF file successfully');
    it('should reject files over size limit');
    it('should reject non-PDF/DOCX files');
    it('should create StoredFile record');
  });

  describe('GET /api/resumes/[id]', () => {
    it('should return resume with download URL');
    it('should return 404 for non-existent resume');
    it('should return 403 for other user\'s resume');
  });

  describe('DELETE /api/resumes/[id]', () => {
    it('should soft delete resume');
    it('should delete associated files from MinIO');
  });
});
```

#### 4. Business Logic Tests (`tests/business/`)

**`tests/business/subscription.test.ts`**
```typescript
describe('Subscription Service', () => {
  it('should return free tier for user without subscription');
  it('should return pro tier for active pro subscription');
  it('should return free tier for expired pro subscription');
  it('should enforce feature access based on tier');
  it('should block free users from pro-only features');
  it('should track daily usage correctly');
  it('should enforce daily credit limits');
});
```

**`tests/business/rate-limiter.test.ts`**
```typescript
describe('Rate Limiter', () => {
  it('should allow requests within limit');
  it('should block requests exceeding limit');
  it('should reset after window expires');
  it('should return remaining count');
  it('should enforce daily limits from UsageRecord');
  it('should differentiate between free and pro limits');
});
```

**`tests/business/actions.test.ts`**
```typescript
describe('Server Actions', () => {
  describe('runAnalysisAction', () => {
    it('should analyze resume and save to PostgreSQL');
    it('should return cached result for duplicate input');
    it('should enforce rate limits');
    it('should increment usage counter');
  });

  describe('exportResumeAction', () => {
    it('should generate PDF and store in MinIO');
    it('should create GeneratedResume record');
    it('should return download URL');
    it('should enforce export limits');
  });
});
```

#### 5. Storage Tests (`tests/storage/`)

**`tests/storage/minio.test.ts`**
```typescript
describe('MinIO Storage', () => {
  it('should create default bucket if not exists');
  it('should upload file and return objectKey');
  it('should download file by objectKey');
  it('should list user files');
  it('should delete file');
  it('should generate presigned download URL');
  it('should generate presigned upload URL');
  it('should delete all user files');
});
```

#### 6. End-to-End Flow Tests (`tests/e2e/`)

**`tests/e2e/user-journey.test.ts`**
```typescript
describe('Complete User Journey', () => {
  it('should complete: register → upload resume → analyze → export → download', async () => {
    // 1. Register new user
    // 2. Login (get tokens)
    // 3. Upload resume PDF
    // 4. Run AI analysis (or mock)
    // 5. Export to PDF with template
    // 6. Download exported file
    // 7. Check all records in PostgreSQL
    // 8. Check file in MinIO
  });

  it('should complete: login → OTP verify → dashboard', async () => {
    // WhatsApp/Email OTP login flow
  });

  it('should enforce free tier limits correctly', async () => {
    // 1. Use up 5 AI credits
    // 2. 6th request should be rejected
    // 3. Use up 2 exports
    // 4. 3rd export should be rejected
  });

  it('should handle Pro upgrade flow', async () => {
    // 1. Simulate Razorpay webhook
    // 2. Verify subscription updated to PRO
    // 3. Verify Pro features now accessible
  });
});
```

#### 7. Performance Testing

**`tests/performance/load-test.ts`**
```typescript
// Use autocannon or custom script
// Test scenarios:
// 1. Auth endpoint: 100 concurrent login requests
// 2. API throughput: 50 concurrent resume list requests
// 3. File upload: 10 concurrent 5MB uploads
// 4. AI analysis: 5 concurrent analysis requests
// 5. Rate limiter: Verify correct behavior under load

// Performance targets:
// - Auth endpoints: < 200ms p95
// - API endpoints: < 500ms p95
// - File upload: < 2s for 5MB
// - Health check: < 50ms
```

#### 8. Bug Fixing & Optimization
After running all tests, fix any discovered issues:
- Fix failing tests
- Fix edge cases discovered during testing
- Optimize slow queries (add indexes, use SELECT specific fields)
- Fix memory leaks (check for unclosed connections)
- Fix race conditions in concurrent operations
- Ensure proper error handling in all routes

#### 9. Security Audit Checklist
Verify these security measures:

```
Authentication:
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] JWTs use strong secrets (32+ chars)
- [ ] Access tokens expire in 15 minutes
- [ ] Refresh tokens stored httpOnly, secure, sameSite
- [ ] Session invalidation works (logout, revoke all)
- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] OTP blocked after 3 failed attempts

API Security:
- [ ] All protected routes require valid session
- [ ] Users can only access their own data (ownership check)
- [ ] Input validation with Zod on all endpoints
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS prevented (React auto-escaping + CSP headers)
- [ ] CSRF protection (sameSite cookies)

Headers:
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Content-Security-Policy set appropriately
- [ ] Strict-Transport-Security (production only)

Data:
- [ ] No secrets in client-side code
- [ ] Environment variables not exposed to client
- [ ] Presigned URLs expire appropriately
- [ ] File type validation prevents malicious uploads
```

#### 10. Remove Firebase Dependencies
**This is the final cleanup step** — remove all Firebase code:

```typescript
// 1. Remove Firebase imports across ALL files
// Search for: import.*firebase|import.*firestore
// Replace with PostgreSQL/Prisma equivalents (already done in Phase 2)

// 2. Remove Firebase packages from package.json:
// - firebase
// - firebase-admin
// - @firebase/app
// - @firebase/auth
// - @firebase/firestore

// 3. Remove Firebase config files:
// - firebase.json (if exists)
// - .firebaserc (if exists)
// - firebaseConfig.ts or similar

// 4. Remove old Firestore utility files:
// - src/lib/firestore.ts
// - Any Firebase-specific helpers

// 5. Remove Firebase environment variables from .env:
// - NEXT_PUBLIC_FIREBASE_API_KEY
// - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
// - NEXT_PUBLIC_FIREBASE_PROJECT_ID
// - etc.

// 6. Update apphosting.yaml if it references Firebase

// IMPORTANT: Only remove Firebase code AFTER confirming all replacement
// functionality works via the tests above. Keep a backup branch.
```

### Phase 5.1 Verification
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test suites
pnpm test tests/auth/
pnpm test tests/api/
pnpm test tests/business/
pnpm test tests/storage/
pnpm test tests/e2e/

# Type check
pnpm typecheck

# Lint
pnpm lint
```

---

## Phase 5.2: Production Deployment

### Objective
Prepare production Docker Compose, configure SSL, deploy to VPS, run smoke tests, and set up monitoring.

### Tasks (implement in order)

#### 1. Production Docker Compose (`infrastructure/docker/docker-compose.prod.yml`)
```yaml
version: '3.8'

services:
  # Traefik Reverse Proxy with Let's Encrypt SSL
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks:
      - resumebuddy-network

  # PostgreSQL 16 (Production)
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - resumebuddy-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M

  # Redis 7 (Production)
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - resumebuddy-network
    restart: unless-stopped

  # MinIO (Production)
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - resumebuddy-network
    restart: unless-stopped

  # Next.js Web Application
  web:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.web
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      MINIO_ENDPOINT: http://minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      GROQ_API_KEY: ${GROQ_API_KEY}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      NEXT_PUBLIC_APP_URL: https://${DOMAIN}
      LATEX_SERVICE_URL: http://latex:8080
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=9002"
    networks:
      - resumebuddy-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G

  # LaTeX Compilation Service
  latex:
    build:
      context: ../../services/resume-latex-service
      dockerfile: Dockerfile
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - resumebuddy-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M

networks:
  resumebuddy-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  letsencrypt:
```

#### 2. Production Dockerfile (`infrastructure/docker/Dockerfile.web`)
```dockerfile
# Multi-stage build for Next.js

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/storage/package.json ./packages/storage/
COPY packages/queue/package.json ./packages/queue/
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules
COPY . .
# Generate Prisma Client
RUN cd packages/database && npx prisma generate
# Build Next.js
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 9002
ENV PORT=9002
CMD ["node", "server.js"]
```

#### 3. Production Environment Configuration
Create `infrastructure/docker/.env.production.template`:
```bash
# Domain
DOMAIN=resumebuddy.yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Database (use strong passwords!)
DB_USER=resumebuddy
DB_PASSWORD=<generate-strong-32-char-password>
DB_NAME=resumebuddy

# Redis
REDIS_PASSWORD=<generate-strong-32-char-password>

# MinIO
MINIO_ACCESS_KEY=<generate-strong-access-key>
MINIO_SECRET_KEY=<generate-strong-secret-key>

# Auth (generate with: openssl rand -hex 32)
JWT_SECRET=<generate-strong-64-char-hex>
JWT_REFRESH_SECRET=<generate-different-64-char-hex>

# AI Keys (copy from development)
GROQ_API_KEY=gsk_xxx
GOOGLE_API_KEY=AIzaSyxxx
OPENROUTER_API_KEY=sk-or-xxx

# Payments
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=ResumeBuddy
```

#### 4. Deployment Script (`infrastructure/scripts/deploy.sh`)
```bash
#!/bin/bash
set -e

echo "=== ResumeBuddy Production Deployment ==="

# 1. Pull latest code
git pull origin main

# 2. Check environment
if [ ! -f infrastructure/docker/.env.production ]; then
  echo "ERROR: .env.production not found. Copy from .env.production.template and fill in values."
  exit 1
fi

# 3. Build images
echo "Building Docker images..."
cd infrastructure/docker
docker-compose -f docker-compose.prod.yml --env-file .env.production build

# 4. Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml --env-file .env.production run --rm web \
  npx prisma migrate deploy

# 5. Start services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 6. Wait for health checks
echo "Waiting for services to be healthy..."
sleep 10

# 7. Create MinIO bucket if needed
echo "Ensuring MinIO bucket exists..."
docker-compose -f docker-compose.prod.yml exec web node -e "
  const { ensureBucket } = require('@resumebuddy/storage');
  ensureBucket().then(() => console.log('Bucket ready')).catch(console.error);
"

# 8. Run smoke test
echo "Running smoke test..."
curl -sf https://${DOMAIN}/api/health || echo "WARNING: Health check failed"

echo "=== Deployment Complete ==="
echo "App: https://${DOMAIN}"
echo "Health: https://${DOMAIN}/api/health"
```

#### 5. Health Check Enhancement (`apps/web/src/app/api/health/route.ts`)
Enhance the health check from Phase 1 with comprehensive checks:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@resumebuddy/database';
import Redis from 'ioredis';

export async function GET() {
  const checks: Record<string, {
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> = {};

  // PostgreSQL check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy', latency: Date.now() - start };
  } catch (e) {
    checks.database = { status: 'unhealthy', error: String(e) };
  }

  // Redis check
  try {
    const start = Date.now();
    const redis = new Redis(process.env.REDIS_URL!);
    await redis.ping();
    await redis.quit();
    checks.redis = { status: 'healthy', latency: Date.now() - start };
  } catch (e) {
    checks.redis = { status: 'unhealthy', error: String(e) };
  }

  // MinIO check
  try {
    const start = Date.now();
    const response = await fetch(`${process.env.MINIO_ENDPOINT}/minio/health/live`);
    checks.storage = {
      status: response.ok ? 'healthy' : 'unhealthy',
      latency: Date.now() - start,
    };
  } catch (e) {
    checks.storage = { status: 'unhealthy', error: String(e) };
  }

  // LaTeX service check
  try {
    const start = Date.now();
    const response = await fetch(`${process.env.LATEX_SERVICE_URL}/healthz`);
    checks.latex = {
      status: response.ok ? 'healthy' : 'unhealthy',
      latency: Date.now() - start,
    };
  } catch (e) {
    checks.latex = { status: 'unhealthy', error: String(e) };
  }

  const overallStatus = Object.values(checks).every(c => c.status === 'healthy')
    ? 'healthy'
    : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: process.uptime(),
    checks,
  }, {
    status: overallStatus === 'healthy' ? 200 : 503,
  });
}
```

#### 6. Logger Utility (`packages/shared/src/logger.ts`)
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
};

function log(level: LogLevel, msg: string, data?: unknown) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: msg,
    ...(data && { data }),
  };

  if (process.env.NODE_ENV === 'production') {
    // Structured JSON logging for production
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
  } else {
    // Pretty logging for development
    const colors = { debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' };
    console[level === 'debug' ? 'log' : level](
      `${colors[level]}[${level.toUpperCase()}]\x1b[0m ${msg}`,
      data || ''
    );
  }
}
```

#### 7. Monitoring & Observability

**Metrics Endpoint (`apps/web/src/app/api/metrics/route.ts`)**
```typescript
// Expose basic application metrics:
// - request_count (total API requests)
// - active_sessions (count from Redis)
// - queue_sizes (BullMQ queue depths)
// - database_pool (active/idle connections)
// - storage_usage (total bytes in MinIO)
// - error_count (by type)

// Format: JSON (or Prometheus text if integrating with Prometheus)
```

**Error Tracking**
```typescript
// In error.tsx and global-error.tsx:
// Log errors to structured logs
// Include: error message, stack trace, user ID (if available), request URL, timestamp
// In production: could forward to external service (Sentry, etc.)
```

#### 8. Backup Strategy
Create `infrastructure/scripts/backup.sh`:
```bash
#!/bin/bash
# Daily backup script (run via cron)

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# PostgreSQL dump
docker exec resumebuddy-db pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db.sql.gz"

# Redis snapshot
docker exec resumebuddy-redis redis-cli -a $REDIS_PASSWORD BGSAVE
sleep 5
docker cp resumebuddy-redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb"

# MinIO (mc mirror)
# docker run --rm minio/mc mirror minio/resumebuddy "$BACKUP_DIR/storage/"

echo "Backup completed: $BACKUP_DIR"
# Optionally upload to remote storage (S3, GCS, etc.)
```

#### 9. CI/CD Pipeline (`.github/workflows/deploy.yml`)
```yaml
name: Deploy ResumeBuddy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: cd packages/database && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-32-chars-at-least-ok
          JWT_REFRESH_SECRET: test-refresh-secret-32-chars-ok
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/resumebuddy
            git pull origin main
            cd infrastructure/docker
            docker-compose -f docker-compose.prod.yml --env-file .env.production build
            docker-compose -f docker-compose.prod.yml --env-file .env.production run --rm web npx prisma migrate deploy
            docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
            curl -sf https://${{ secrets.DOMAIN }}/api/health || echo "Health check failed"
```

#### 10. Production Smoke Tests (`infrastructure/scripts/smoke-test.sh`)
```bash
#!/bin/bash
DOMAIN=${1:-"localhost:9002"}
PROTOCOL=${2:-"http"}
BASE_URL="${PROTOCOL}://${DOMAIN}"
PASSED=0
FAILED=0

check() {
  local name=$1; local url=$2; local expected_status=${3:-200}
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" -eq "$expected_status" ]; then
    echo "✅ $name (HTTP $status)"
    ((PASSED++))
  else
    echo "❌ $name (Expected $expected_status, got $status)"
    ((FAILED++))
  fi
}

echo "=== Smoke Test: $BASE_URL ==="

# Public pages
check "Homepage" "$BASE_URL/"
check "Login page" "$BASE_URL/login"
check "Signup page" "$BASE_URL/signup"
check "Pricing page" "$BASE_URL/pricing"

# API endpoints
check "Health check" "$BASE_URL/api/health"
check "Auth session (no cookie)" "$BASE_URL/api/auth/session" 401

# Protected routes (should redirect)
check "Dashboard (no auth)" "$BASE_URL/dashboard" 307

# Register test user
REGISTER_RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-test@test.com","password":"SmokeTest123!@","name":"Smoke Test"}')
if [ "$REGISTER_RESULT" -eq 200 ] || [ "$REGISTER_RESULT" -eq 409 ]; then
  echo "✅ Registration endpoint ($REGISTER_RESULT)"
  ((PASSED++))
else
  echo "❌ Registration endpoint ($REGISTER_RESULT)"
  ((FAILED++))
fi

echo ""
echo "=== Results: $PASSED passed, $FAILED failed ==="
exit $FAILED
```

#### 11. Security Headers in `next.config.mjs`
Ensure production security headers:
```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// In next.config.mjs headers() function:
async headers() {
  return [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ];
}
```

---

## Required Dependencies to Install

```bash
# Testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event msw
pnpm add -D @vitest/coverage-v8

# Optional
pnpm add -D autocannon    # Load testing
pnpm add -D testcontainers # Docker-based test environments
```

---

## File Deliverables Checklist

```
Phase 5.1 (Testing & QA):
├── vitest.config.ts                                          ✅
├── tests/setup.ts                                            ✅
├── tests/auth/jwt.test.ts                                    ✅
├── tests/auth/session.test.ts                                ✅
├── tests/auth/password.test.ts                               ✅
├── tests/auth/otp.test.ts                                    ✅
├── tests/api/auth-routes.test.ts                             ✅
├── tests/api/resume-routes.test.ts                           ✅
├── tests/business/subscription.test.ts                       ✅
├── tests/business/rate-limiter.test.ts                       ✅
├── tests/business/actions.test.ts                            ✅
├── tests/storage/minio.test.ts                               ✅
├── tests/e2e/user-journey.test.ts                            ✅
├── tests/performance/load-test.ts                            ✅
├── Firebase code fully removed                               ✅
├── All existing bugs fixed                                   ✅

Phase 5.2 (Production Deployment):
├── infrastructure/docker/docker-compose.prod.yml             ✅
├── infrastructure/docker/Dockerfile.web                      ✅
├── infrastructure/docker/.env.production.template            ✅
├── infrastructure/scripts/deploy.sh                          ✅
├── infrastructure/scripts/backup.sh                          ✅
├── infrastructure/scripts/smoke-test.sh                      ✅
├── .github/workflows/deploy.yml                              ✅
├── apps/web/src/app/api/health/route.ts (enhanced)           ✅
├── apps/web/src/app/api/metrics/route.ts                     ✅
├── packages/shared/src/logger.ts                             ✅
├── next.config.mjs (security headers)                        ✅
├── package.json (test scripts added)                         ✅
```

---

## Phase 5 Exit Criteria (Test All)

```
Testing:
- [ ] All unit tests pass (auth, password, OTP, subscription)
- [ ] All API route tests pass (auth, resume, webhook)
- [ ] All integration tests pass (storage, rate limiting, caching)
- [ ] E2E user journey tests pass
- [ ] Test coverage > 70% on critical paths
- [ ] No TypeScript errors (`pnpm typecheck` passes)
- [ ] No lint errors (`pnpm lint` passes)
- [ ] Performance targets met (auth < 200ms p95, API < 500ms p95)

Security:
- [ ] Security audit checklist all green
- [ ] No Firebase dependencies remaining
- [ ] All secrets in environment variables (not code)
- [ ] Security headers verified (use securityheaders.com)

Deployment:
- [ ] docker-compose.prod.yml builds without errors
- [ ] Dockerfile.web multi-stage build works
- [ ] Database migrations run cleanly
- [ ] SSL certificate issued by Let's Encrypt
- [ ] Health check returns 200 with all services healthy
- [ ] Smoke test passes all checks
- [ ] CI/CD pipeline runs green on push to main
- [ ] Backup script creates valid PostgreSQL dump
- [ ] Rollback procedure documented and tested
- [ ] Application accessible via HTTPS on domain

Post-Deployment Verification:
curl -s https://yourdomain.com/api/health | jq .
# Should return: { "status": "healthy", "checks": { "database": "healthy", ... } }

# Run smoke test against production:
bash infrastructure/scripts/smoke-test.sh yourdomain.com https
```

---

## Important Notes

1. **Remove Firebase LAST**: Only remove Firebase dependencies after ALL tests pass and the new system is verified working.
2. **Keep a rollback branch**: Before removing Firebase, create a `pre-migration` git branch for rollback.
3. **Database backups before deploy**: Always dump the PostgreSQL database before deploying new migrations.
4. **SSL setup**: Traefik auto-provisions Let's Encrypt certificates. Ensure port 80 is accessible for ACME HTTP challenge.
5. **DNS setup**: Point your domain's A record to the VPS IP before deploying with SSL.
6. **Docker resources**: Ensure VPS has at least 4GB RAM for all services (PostgreSQL 512MB, Redis 256MB, Next.js 1GB, LaTeX 512MB, Traefik 128MB, MinIO 256MB).
7. **Monitoring**: Start with health checks + structured logs. Add Prometheus/Grafana later if needed.
8. **Zero-downtime deploys**: Use `docker-compose up -d --build web` to rebuild only the web service. Other services persist data via volumes.
9. **Test in staging first**: If possible, deploy to a staging environment before production. Use a separate subdomain (staging.yourdomain.com).
