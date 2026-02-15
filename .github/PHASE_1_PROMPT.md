# Phase 1: Foundation - Infrastructure + Authentication

> **Copilot Agent Prompt for Phase 1 Implementation**
> **Estimated Duration**: ~16 hours
> **Dependencies**: None (starting point)
> **Blocking**: All other phases depend on this

---

## Instruction

Take the `ARCHITECTURE_TRANSFORMATION.md` as the **primary reference** and `IMPLEMENTATION_TIMELINE_7_DAYS.md` as the secondary reference for phase-wise implementation.

Now implement **Phase 1 completely end-to-end** — it should work 100% without any errors. Test after implementing.

**Important**: If `IMPLEMENTATION_TIMELINE_7_DAYS.md` does not have enough context, use `ARCHITECTURE_TRANSFORMATION.md` as the primary source of truth for all code, schemas, configurations, and architectural decisions.

---

## Phase 1 Scope

Phase 1 has two sub-phases:
1. **Phase 1.1 — Infrastructure Setup** (~8 hours)
2. **Phase 1.2 — Authentication System** (~8 hours)

---

## Phase 1.1: Infrastructure Setup

### Objective
Get all infrastructure services (PostgreSQL, Redis, MinIO, Traefik) running locally with Docker Compose, plus establish the monorepo structure with Turborepo/pnpm workspaces.

### Tasks (implement in order)

#### 1. Create Monorepo Structure with Turborepo
- Initialize pnpm workspaces with `pnpm-workspace.yaml`
- Create `turbo.json` with build/dev/lint/test pipelines
- Create folder structure:
  ```
  apps/
  ├── web/                  # Next.js Frontend + API (move existing src/ here)
  └── websocket/            # Real-time Server (placeholder for now)
  packages/
  ├── database/             # Prisma Schema + Client
  ├── auth/                 # Authentication Library
  ├── storage/              # File Storage Client
  ├── queue/                # Job Queue
  └── shared/               # Shared Types & Utils
  infrastructure/
  ├── docker/
  └── scripts/
  ```
- Each package needs its own `package.json` and `tsconfig.json`
- Root `package.json` should use `pnpm` workspaces

#### 2. Docker Compose with PostgreSQL 16
- Create `infrastructure/docker/docker-compose.yml`
- PostgreSQL 16 Alpine image with:
  - Container name: `resumebuddy-db`
  - Volume: `postgres_data:/var/lib/postgresql/data`
  - Port: `5432:5432`
  - Health check: `pg_isready -U ${DB_USER:-resumebuddy}`
  - Environment: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` from env vars

#### 3. Redis 7 for Cache + Sessions
- Add Redis 7 Alpine to docker-compose with:
  - Container name: `resumebuddy-redis`
  - Command: `redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}`
  - Volume: `redis_data:/data`
  - Port: `6379:6379`
  - Health check: `redis-cli -a "${REDIS_PASSWORD}" ping`

#### 4. MinIO (S3-Compatible Storage)
- Add MinIO to docker-compose with:
  - Container name: `resumebuddy-storage`
  - Command: `server /data --console-address ":9001"`
  - Volume: `minio_data:/data`
  - Ports: `9000:9000` (S3 API), `9001:9001` (Console)
  - Health check: `curl -f http://localhost:9000/minio/health/live`

#### 5. Traefik Reverse Proxy (Production Profile)
- Add Traefik v3 to docker-compose with `profiles: [production]`
- Auto SSL via Let's Encrypt
- Ports: `80`, `443`, `8081` (dashboard)

#### 6. Web App Service in Docker Compose
- Add Next.js web service with:
  - Build context pointing to root, Dockerfile at `infrastructure/docker/Dockerfile.web`
  - All env vars: `DATABASE_URL`, `REDIS_URL`, `MINIO_*`, `JWT_SECRET`, AI keys
  - Port: `9002:9002`
  - Depends on: `postgres` (healthy), `redis` (healthy)

#### 7. Create `.env.template`
Create a comprehensive `.env.template` with ALL environment variables documented:
```bash
# Database
DB_USER=resumebuddy
DB_PASSWORD=your_secure_password_here
DB_NAME=resumebuddy
DATABASE_URL=postgresql://resumebuddy:your_secure_password_here@localhost:5432/resumebuddy

# Redis
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:your_redis_password_here@localhost:6379

# MinIO Storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_minio_secret_here
MINIO_BUCKET=resumebuddy

# Authentication
JWT_SECRET=your_jwt_secret_min_32_chars_here
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
SESSION_COOKIE_NAME=rb_session
SESSION_TTL=604800

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@resumebuddy.com
EMAIL_FROM_NAME=ResumeBuddy
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# WhatsApp (Twilio / Meta / Gupshup)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# SMS
SMS_PROVIDER=twilio

# AI Providers
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxx

# Services
LATEX_SERVICE_URL=http://localhost:8080
WEBSOCKET_URL=ws://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development

# Razorpay (Keep Existing)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Production Only
ACME_EMAIL=admin@yourdomain.com
```

#### 8. Create Setup Script
Write `infrastructure/scripts/setup.sh` (and `setup.ps1` for Windows):
- Check Docker is installed
- Copy `.env.template` to `.env` if not exists
- Run `docker-compose up -d postgres redis minio`
- Wait for health checks to pass
- Create MinIO default bucket
- Print success message with service URLs

#### 9. Docker Network
- All services on network: `resumebuddy-network`
- Named volumes: `postgres_data`, `redis_data`, `minio_data`, `letsencrypt`

### Phase 1.1 Verification
After implementing, verify:
```bash
cd infrastructure/docker
docker-compose up -d postgres redis minio
docker-compose ps           # All 3 services "healthy"
docker-compose logs postgres # No errors
# PostgreSQL: psql -U resumebuddy -d resumebuddy (should connect)
# Redis: redis-cli -a <password> ping (should return PONG)
# MinIO Console: http://localhost:9001 (should load)
```

---

## Phase 1.2: Authentication System

### Objective
Build a complete custom authentication system replacing Firebase Auth, using JWT (jose library), Redis sessions, bcrypt password hashing, and Google OAuth.

### Tasks (implement in order)

#### 1. Create `packages/auth` Package
- `package.json` with dependencies: `jose`, `bcryptjs`, `ioredis`, `nanoid`, `zod`, `google-auth-library`
- `tsconfig.json` extending root config
- Export everything from `src/index.ts`

#### 2. JWT Token System (`packages/auth/src/jwt.ts`)
Implement using the `jose` library (NOT jsonwebtoken):

```typescript
// Key types and functions to implement:
interface TokenPayload extends JWTPayload {
  sub: string;        // User ID
  email: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
  type: 'access' | 'refresh';
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;   // seconds
}

// Functions:
generateAccessToken(payload)    // 15-minute expiry, HS256, issuer: 'resumebuddy'
generateRefreshToken(payload)   // 7-day expiry, separate secret
generateTokenPair(user)         // Returns both tokens
verifyAccessToken(token)        // Verify + return payload or null
verifyRefreshToken(token)       // Verify + return payload or null
extractBearerToken(authHeader)  // Extract token from "Bearer xxx"
```

- Use `JWT_SECRET` env var for access tokens
- Use `JWT_REFRESH_SECRET` env var for refresh tokens
- Both use `HS256` algorithm
- Set issuer: `'resumebuddy'`, audience: `'resumebuddy-web'`

#### 3. Redis Session Management (`packages/auth/src/session.ts`)
```typescript
interface SessionData {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  lastActivityAt: number;
}

// Functions:
createSession(data)             // Returns sessionId (nanoid 32 chars), stores in Redis with 7-day TTL
getSession(sessionId)           // Returns SessionData or null
updateSessionActivity(id)       // Update lastActivityAt timestamp
deleteSession(sessionId)        // Remove session + from user's session set
deleteAllUserSessions(userId)   // Sign out all devices
getUserActiveSessions(userId)   // List all active sessions
```

- Redis key pattern: `session:{sessionId}`
- Track user sessions in Redis Set: `user_sessions:{userId}`
- Default TTL: 7 days (604800 seconds)

#### 4. Password Utilities (`packages/auth/src/password.ts`)
```typescript
// Zod schema for password validation:
// - Min 8 chars, max 128 chars
// - At least 1 uppercase, 1 lowercase, 1 number, 1 special character

// Functions:
hashPassword(password)          // bcrypt with 12 salt rounds
verifyPassword(password, hash)  // bcrypt compare
validatePassword(password)      // Returns { valid: boolean, errors: string[] }
getPasswordStrength(password)   // Returns 'weak' | 'fair' | 'good' | 'strong'
```

#### 5. Google OAuth (`packages/auth/src/oauth/google.ts`)
```typescript
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

// Functions:
getGoogleAuthUrl(state)         // Generate OAuth URL with consent prompt
getGoogleUser(code)             // Exchange code for user info
refreshGoogleToken(token)       // Refresh expired OAuth token
```

- Use `google-auth-library` package
- Callback URL: `${NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
- Scopes: `userinfo.email`, `userinfo.profile`

#### 6. Auth Package Exports (`packages/auth/src/index.ts`)
```typescript
// Re-export everything:
export * from './jwt';
export * from './session';
export * from './password';
export { getGoogleAuthUrl, getGoogleUser } from './oauth/google';
```

#### 7. Auth API Routes
Create these API routes in `apps/web/src/app/api/auth/`:

**POST `/api/auth/register`**
- Validate input with Zod: email, password, name
- Validate password strength via `validatePassword()`
- Check if user already exists (409 Conflict)
- Hash password with `hashPassword()`
- Create user in PostgreSQL via Prisma (with Account relation)
- Create free-tier Subscription record
- Generate token pair
- Create Redis session
- Set cookies: `rb_session` (httpOnly), `rb_refresh` (httpOnly)
- Return user object + accessToken + expiresIn

**POST `/api/auth/login`**
- Validate email + password
- Find user by email (include subscription)
- Check user status is ACTIVE (403 if suspended)
- Verify password with `verifyPassword()`
- Update `lastLoginAt`
- Generate token pair + session
- Set cookies
- Return user + accessToken

**POST `/api/auth/logout`**
- Read `rb_session` cookie
- Delete session from Redis
- Clear `rb_session` and `rb_refresh` cookies
- Return success

**POST `/api/auth/refresh`**
- Read `rb_refresh` cookie
- Verify refresh token with `verifyRefreshToken()`
- Check it's not revoked in DB
- Generate new token pair (token rotation)
- Revoke old refresh token, store new one
- Update cookies
- Return user + new accessToken

**GET `/api/auth/session`**
- Read `rb_session` cookie
- Get session from Redis via `getSession()`
- If valid, generate new access token
- Return user + accessToken + expiresIn

**GET `/api/auth/google`**
- Generate random state, store in cookie
- Redirect to `getGoogleAuthUrl(state)`

**GET `/api/auth/callback/google`**
- Verify state matches cookie
- Exchange code for Google user via `getGoogleUser(code)`
- Find or create user by email/provider
- If new user: create User + Account + Subscription
- Generate token pair + session
- Set cookies
- Redirect to `/dashboard`

#### 8. Auth Middleware (`middleware.ts`)
Update the Next.js middleware for custom JWT auth:

```typescript
// Public routes (no auth required):
const PUBLIC_ROUTES = [
  '/', '/login', '/signup', '/pricing', '/forgot-password', '/reset-password',
  '/api/auth/login', '/api/auth/register', '/api/auth/refresh',
  '/api/auth/google', '/api/auth/callback/google',
  '/api/health', '/api/razorpay/webhook',
];

// Logic:
// 1. If public route → allow through, add security headers
// 2. If no `rb_session` cookie → redirect to /login (pages) or 401 (API)
// 3. If valid session → allow through
// 4. Add security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, CSP
```

#### 9. Auth Context (`apps/web/src/context/auth-context.tsx`)
Build React context for client-side auth:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

Key behaviors:
- Store access token in **memory only** (not localStorage)
- On mount: call `/api/auth/session` to restore session
- Auto-refresh token 1 minute before expiry (check every 30s)
- `login()` → POST `/api/auth/login` → set state → redirect `/dashboard`
- `register()` → POST `/api/auth/register` → set state → redirect `/dashboard`
- `loginWithGoogle()` → `window.location.href = '/api/auth/google'`
- `logout()` → POST `/api/auth/logout` → clear state → redirect `/login`

#### 10. Health Check Endpoint
Create `apps/web/src/app/api/health/route.ts`:
- Check PostgreSQL connectivity (`SELECT 1`)
- Check Redis connectivity (`PING`)
- Check LaTeX service (`/healthz`)
- Return: `{ status: 'healthy' | 'degraded', timestamp, checks: {...} }`

---

## Required Dependencies to Install

```bash
# In packages/auth
pnpm add jose bcryptjs ioredis nanoid zod google-auth-library
pnpm add -D @types/bcryptjs

# In packages/database
pnpm add @prisma/client
pnpm add -D prisma

# In root
pnpm add -D turbo typescript
```

---

## File Deliverables Checklist

```
Phase 1.1 (Infrastructure):
├── turbo.json                              ✅
├── pnpm-workspace.yaml                     ✅
├── infrastructure/docker/docker-compose.yml ✅
├── infrastructure/docker/docker-compose.prod.yml ✅
├── infrastructure/scripts/setup.sh         ✅
├── infrastructure/scripts/setup.ps1        ✅ (Windows)
├── .env.template                           ✅

Phase 1.2 (Authentication):
├── packages/auth/package.json              ✅
├── packages/auth/tsconfig.json             ✅
├── packages/auth/src/index.ts              ✅
├── packages/auth/src/jwt.ts                ✅
├── packages/auth/src/session.ts            ✅
├── packages/auth/src/password.ts           ✅
├── packages/auth/src/oauth/google.ts       ✅
├── apps/web/src/app/api/auth/register/route.ts  ✅
├── apps/web/src/app/api/auth/login/route.ts     ✅
├── apps/web/src/app/api/auth/logout/route.ts    ✅
├── apps/web/src/app/api/auth/refresh/route.ts   ✅
├── apps/web/src/app/api/auth/session/route.ts   ✅
├── apps/web/src/app/api/auth/google/route.ts    ✅
├── apps/web/src/app/api/auth/callback/google/route.ts ✅
├── apps/web/src/app/api/health/route.ts    ✅
├── middleware.ts (updated)                 ✅
├── apps/web/src/context/auth-context.tsx   ✅
```

---

## Phase 1 Exit Criteria (Test All)

```
Infrastructure:
- [ ] PostgreSQL running and accessible (port 5432)
- [ ] Redis running with password auth (port 6379)
- [ ] MinIO running with default bucket created (ports 9000/9001)
- [ ] All services connected via Docker network
- [ ] `.env` file configured with all secrets
- [ ] `docker-compose up -d` brings up entire stack
- [ ] Health check endpoint returns 200

Authentication:
- [ ] JWT generation with 15min access / 7d refresh tokens
- [ ] Redis session store working (create, get, delete)
- [ ] Password hashing with bcrypt (12 rounds) verified
- [ ] POST /api/auth/register creates user and returns tokens
- [ ] POST /api/auth/login validates credentials and returns tokens
- [ ] POST /api/auth/logout clears session and cookies
- [ ] POST /api/auth/refresh rotates tokens correctly
- [ ] GET /api/auth/session restores session from cookie
- [ ] Google OAuth login flow complete (redirect → callback → session)
- [ ] Protected routes redirect to /login when unauthenticated
- [ ] API routes return 401 when unauthenticated
- [ ] useAuth() hook provides user state in components
- [ ] Access token auto-refreshes before expiry
- [ ] Security headers set on all responses

Test Commands:
curl -X POST http://localhost:9002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@","name":"Test User"}'

curl -X POST http://localhost:9002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@"}'

curl http://localhost:9002/api/health
```

---

## Important Notes

1. **Do NOT delete existing Firebase code yet** — it will be removed in Phase 5. Phase 1 builds the new system alongside.
2. **Prisma schema stub**: Create a minimal User model in `packages/database/prisma/schema.prisma` with just enough fields for auth to work. The full schema comes in Phase 2.
3. **Use `@resumebuddy/auth` import alias** in packages. Configure in `tsconfig.json` path mapping.
4. **All cookies must be `httpOnly`, `secure` (in production), `sameSite: 'lax'`**.
5. **Access tokens stored in memory ONLY** — never localStorage or regular cookies.
6. **Test on Windows** — use `setup.ps1` for Windows, `setup.sh` for Linux/Mac.
