# ResumeBuddy - AI Coding Agent Instructions

## Project Overview
ResumeBuddy is a **Next.js 15 + React 19** SaaS application providing AI-powered resume analysis. Uses multi-provider AI (Groq → Gemini → OpenRouter fallback), custom JWT + Session auth with PostgreSQL & Redis, and a tiered subscription model (Free/Pro via Razorpay).

**Tech Stack**: Next.js 15, React 19, TypeScript, shadcn/ui, PostgreSQL + Prisma, Redis, MinIO (object storage), Tailwind CSS, Docker, tectonic (LaTeX), Socket.io (WebSocket)

## Architecture

### Service Boundaries
```
ResumeBuddy (monorepo with Turborepo)
├── Next.js App (port 9002)
│   ├── Client: React 19 + shadcn/ui + contexts
│   ├── Server: App Router + Server Actions
│   └── AI: Multi-provider with smart routing
├── WebSocket Service (port 3001)
│   └── Real-time interview & notifications
├── LaTeX Service (Docker, port 8080)
│   └── Fastify + tectonic for PDF generation
└── Packages (shared libraries)
    ├── @resumebuddy/auth       # JWT, sessions, OAuth, OTP
    ├── @resumebuddy/database   # Prisma client + migrations
    ├── @resumebuddy/queue      # Job queue management
    ├── @resumebuddy/shared     # Types & utilities
    └── @resumebuddy/storage    # MinIO object storage
```

### Core Directory Structure
```
src/
├── ai/
│   ├── flows/              # 12 AI features (analyze, qa, interview, improvements, parse, structure, cover-letter, interview-session, dsa-questions, evaluate-answer, evaluate-code, follow-up-question)
│   ├── providers/          # groq.ts, gemini.ts, openrouter.ts
│   ├── multi-provider.ts   # Fallback orchestration + caching (267 lines)
│   ├── smart-router.ts     # Cost-optimized 3-tier model selection (546 lines)
│   └── index.ts            # Public AI API exports (142 lines)
├── app/
│   ├── actions.ts          # ALL server actions (1358 lines: AI + data + LaTeX exports)
│   ├── api/                # API routes (auth, webhooks, admin, metrics, notifications)
│   └── [routes]/           # dashboard, analysis, qa, interview, create-resume, billing, admin, profile, resume-library
├── components/             # Feature tabs, templates, ui/ (shadcn)
├── context/                # auth-context.tsx (197 lines), resume-context.tsx
├── lib/
│   ├── types/subscription.ts  # SubscriptionTier, TIER_LIMITS, feature access (263 lines)
│   ├── subscription-service.ts # getUserTier(), assertFeatureAllowed() (454 lines)
│   ├── rate-limiter.ts     # Tier-aware rate limiting (502 lines)
│   ├── db.ts               # Prisma client re-export
│   ├── auth.ts             # Auth functions re-export from packages/auth
│   ├── storage.ts          # MinIO object storage client
│   ├── redis.ts            # Redis client for caching/sessions
│   ├── response-cache.ts   # LRU response caching (1hr TTL)
│   ├── request-deduplicator.ts # Concurrent request deduplication
│   ├── user-cache.ts       # Per-user analysis caching
│   ├── prompt-optimizer.ts # Prompt compression utilities
│   ├── global-rate-limiter.ts # Provider rate limiting
│   ├── retry-handler.ts    # Exponential backoff retries
│   └── usage-analytics.ts  # Usage tracking & alerts
packages/
├── auth/                   # JWT, sessions, OAuth, OTP authentication
├── database/               # Prisma schema, migrations, client
├── queue/                  # Job queue management (BullMQ)
├── shared/                 # Shared types & utilities
└── storage/                # MinIO object storage wrapper
apps/
└── websocket/              # Socket.io server for real-time features
services/
└── resume-latex-service/   # Standalone PDF compilation (112 line README, Docker)
```

### Critical Data Flows

1. **AI Request Flow** (40-60% API cost reduction via caching):
   ```
   UI → Server Action → enforceRateLimitAsync(userId, operation)
   → AI Flow (truncateToTokens for optimization)
   → smartGenerate(feature: AIFeature)
   → Provider Fallback (Groq → Gemini → OpenRouter)
   → Response Cache (LRU, 1hr TTL) + PostgreSQL persistence
   ```

2. **Auth Flow** (JWT + Session based, open registration):
   ```
   Login/Register → POST /api/auth/login or /api/auth/register
   → Generate JWT Access Token + Refresh Token
   → Create Session in Redis (sessionId stored in cookie)
   → Store User in PostgreSQL (users table)
   → middleware.ts validates session → Route protection
   → AuthContext manages client-side auth state
   ```

3. **Subscription Flow** (one-time payment model):
   ```
   Razorpay Payment → POST /api/webhooks/razorpay
   → Update subscriptions table (currentPeriodEnd, tier: 'PRO')
   → getUserTier() checks expiration in PostgreSQL → Feature access control
   → Usage tracked in usage_records table
   ```

4. **LaTeX Export Flow** (120s timeout):
   ```
   UI → Server Action → enforceExportLimit(userId)
   → callLatexCompileService(payload)
   → POST /v1/resume/latex/compile (LaTeX service)
   → PDF base64 (raw, no data: prefix) + LaTeX source
   → Store in MinIO (object storage) + metadata in PostgreSQL
   ```

5. **WebSocket Flow** (Real-time interview & notifications):
   ```
   Client connects → Socket.io WebSocket
   → Authenticate via session token
   → Join user-specific room
   → Receive real-time updates (interview questions, notifications)
   → Redis pub/sub for multi-instance synchronization
   ```

## Key Conventions

### Imports - ALWAYS use `@/` alias
```typescript
import { smartGenerate, parseJsonResponse } from '@/ai';
import { Button } from '@/components/ui/button';
import { enforceRateLimitAsync } from '@/lib/rate-limiter';
import type { SubscriptionTier } from '@/lib/types/subscription';
```

### Server Actions Pattern (`src/app/actions.ts`)
**ALL server actions live in ONE file** (actions.ts, 1358 lines). Pattern:
```typescript
'use server';
import { prisma } from '@/lib/db';

export async function runAnalysisAction(input: { userId: string; resumeText: string; ... }) {
  // 1. Validate with Zod
  const validated = baseSchema.safeParse(input);
  if (!validated.success) throw new Error(validated.error.errors.map(e => e.message).join(', '));
  
  // 2. Rate limit (tier-aware)
  await enforceRateLimitAsync(input.userId, 'analyze-resume');
  
  // 3. Call AI flow
  const result = await analyzeResumeContent({ ... });
  
  // 4. Persist to PostgreSQL via Prisma
  await prisma.resumeData.upsert({
    where: { userId: input.userId },
    update: { analysisData: result },
    create: { userId: input.userId, analysisData: result }
  });
  
  return result;
}
```

### AI Flow Pattern (`src/ai/flows/*.ts`)
Each AI feature follows this structure:
```typescript
'use server';
import { smartGenerate, parseJsonResponse } from '@/ai';
import { z } from 'zod';

// 1. Define Zod schemas
export const AnalyzeInputSchema = z.object({ resumeText: z.string(), jobDescription: z.string() });
export const AnalyzeOutputSchema = z.object({ atsScore: z.number(), ... });
export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

// 2. Implement flow with token optimization
export async function analyzeResumeContent(input: AnalyzeInput) {
  // Token optimization: truncate inputs
  const trimmedResume = truncateToTokens(input.resumeText, 1500);
  const trimmedJD = truncateToTokens(input.jobDescription, 800);
  
  // Smart routing based on feature type
  const result = await smartGenerate({
    feature: 'resume-analysis', // Maps to FEATURE_MODEL_ROUTING
    prompt: buildPrompt(trimmedResume, trimmedJD),
    systemPrompt: SYSTEM_PROMPT,
    jsonMode: true,
  });
  
  // Validate output
  return parseJsonResponse(result, AnalyzeOutputSchema);
}
```

### Subscription-Aware Features
```typescript
// Check tier before premium features
import { getUserTier, assertFeatureAllowed } from '@/lib/subscription-service';
import { prisma } from '@/lib/db';

const tier = await getUserTier(userId); // 'FREE' | 'PRO' from PostgreSQL
await assertFeatureAllowed(userId, 'interview-questions'); // Throws if Free tier

// Rate limits (TIER_LIMITS in subscription.ts)
// Free: 5 AI credits/day, 2 exports/day, resume-analysis + improvements only
// Pro: 10 AI credits/day, unlimited exports, all features

// Usage tracking in PostgreSQL
await prisma.usageRecord.create({
  data: {
    userId,
    feature: 'resume-analysis',
    count: 1,
    date: new Date(),
  }
});
```

### LaTeX Service Integration (`src/app/actions.ts`)
```typescript
// Pattern for LaTeX export actions
async function callLatexCompileService(payload: unknown) {
  const baseUrl = getLatexServiceUrl(); // LATEX_SERVICE_URL env var
  const endpoint = `${baseUrl}/v1/resume/latex/compile`;
  
  // 120s timeout (matches backend queue timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  
  // Handle 429 (rate limiting from LaTeX service queue)
  if (response.status === 429) {
    throw new Error('LaTeX export service is busy. Please try again in a moment.');
  }
  
  return { latexSource, pdfBase64 }; // Raw base64, no 'data:' prefix
}
```

## Development Commands
```bash
# Main app (default port 9002, configured in package.json)
npm run dev          # Next.js dev server
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run genkit:dev   # Test AI flows at http://localhost:4000

# Infrastructure (PostgreSQL, Redis, MinIO)
npm run infra:up     # Start all infrastructure services
npm run infra:down   # Stop all infrastructure services
npm run infra:ps     # Check service status
npm run infra:logs   # View service logs
npm run infra:setup  # Initial setup script
npm run infra:reset  # Reset all data and restart

# Database (Prisma)
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio (GUI)

# LaTeX service (port 8080)
cd services/resume-latex-service
npm run dev                    # Local dev (requires tectonic on PATH)
npm run docker:build           # Build Docker image
npm run docker:run             # Run in Docker (recommended for Windows)
npm run test:load              # Load test (10 concurrent requests)

# WebSocket service (port 3001)
cd apps/websocket
npm run dev                    # Start WebSocket server

# Utilities
npm run latex:smoke            # End-to-end LaTeX compilation test
npm run tokens:estimate        # Estimate token usage for prompts
npm run test                   # Run all tests
npm run test:auth              # Auth tests
npm run test:api               # API tests
npm run test:e2e               # E2E tests
```

## Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/resumebuddy

# Redis (Sessions + Caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# MinIO Object Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=resumebuddy

# JWT Secrets
JWT_ACCESS_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars

# Session
SESSION_SECRET=your-session-secret-min-32-chars

# AI Providers (server-side) - Fallback order
GROQ_API_KEY=gsk_xxx          # Primary (14,400/day free, llama-3.1-8b-instant / llama-3.3-70b-versatile)
GOOGLE_API_KEY=xxx            # Gemini backup (1,500/day, gemini-1.5-flash)
OPENROUTER_API_KEY=sk-or-xxx  # Last resort (free Llama/Mistral)

# Services
LATEX_SERVICE_URL=http://localhost:8080  # LaTeX compilation service
WEBSOCKET_URL=http://localhost:3001     # WebSocket service

# Payments (Razorpay)
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# OAuth (Google)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:9002/api/auth/google/callback

# Email (Resend)
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@yourdomain.com

# SMS/WhatsApp (Optional - Twilio)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Application
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development
```

### AI Model Routing (`src/ai/smart-router.ts`)
Smart routing optimizes cost (40-60% savings) by matching model to task complexity:

| Feature | Primary Model | Fallback Chain | Token Limit | Output Est. |
|---------|--------------|----------------|-------------|-------------|
| `resume-qa` | groq-llama-8b (fast) | groq-llama-70b → gemini | 3000 | 400 |
| `auto-fill-resume`, `auto-fill-jd` | groq-llama-8b | groq-llama-70b → gemini | 4000-5000 | 500-600 |
| `resume-analysis` | groq-llama-70b (powerful) | groq-llama-8b → gemini | 6000 | 700 |
| `interview-questions` | groq-llama-70b | groq-llama-8b → gemini | 4000 | 900 |
| `resume-improvement` | groq-llama-70b | groq-llama-8b → gemini | 8000 | 1200 |
| `cover-letter` | groq-llama-70b | groq-llama-8b → gemini | 5000 | 800 |
| `interview-session` | groq-llama-70b | groq-llama-8b → gemini | 5000 | 1200 |
| `dsa-questions` | groq-llama-70b | groq-llama-8b → gemini | 5000 | 1500 |
| `evaluate-answer` | groq-llama-70b | groq-llama-8b → gemini | 4000 | 800 |
| `evaluate-code` | groq-llama-70b | groq-llama-8b → gemini | 5000 | 1000 |
| `follow-up-question` | groq-llama-8b | groq-llama-70b → gemini | 3000 | 400 |

**Model Configs** (MODEL_CONFIGS in smart-router.ts):
```typescript
'groq-llama-8b': { model: 'llama-3.1-8b-instant', tokensPerSecond: 840, cost: $0.05/$0.08 per 1M }
'groq-llama-70b': { model: 'llama-3.3-70b-versatile', tokensPerSecond: 394, cost: $0.59/$0.79 per 1M }
'gemini': { model: 'gemini-1.5-flash', tokensPerSecond: 400, cost: $0.075/$0.30 per 1M }
```

## Adding New AI Features
1. **Create AI Flow** (`src/ai/flows/new-feature.ts`):
   ```typescript
   'use server';
   import { smartGenerate, parseJsonResponse } from '@/ai';
   import { z } from 'zod';
   
   export const InputSchema = z.object({ ... });
   export const OutputSchema = z.object({ ... });
   
   export async function newFeature(input: z.infer<typeof InputSchema>) {
     const result = await smartGenerate({ feature: 'new-feature', ... });
     return parseJsonResponse(result, OutputSchema);
   }
   ```

2. **Register Feature** (`src/ai/smart-router.ts`):
   ```typescript
   export type AIFeature = ... | 'new-feature';
   
   FEATURE_MODEL_ROUTING: {
     'new-feature': { 
       primary: 'groq-llama-8b', 
       fallback: 'groq-llama-70b', 
       lastResort: 'gemini',
       reason: 'Brief explanation of model choice'
     }
   }
   
   FEATURE_TOKEN_LIMITS: { 'new-feature': 5000 }
   FEATURE_OUTPUT_TOKENS: { 'new-feature': 600 }
   ```

3. **Add Server Action** (`src/app/actions.ts`):
   ```typescript
   export async function runNewFeatureAction(input: { userId: string; ... }) {
     await enforceRateLimitAsync(input.userId, 'new-feature');
     
     // Persist to database if needed
     const result = await newFeature({ ... });
     await prisma.someTable.create({ data: { userId: input.userId, ...result } });
     
     return result;
   }
   ```

4. **Configure Rate Limit** (`src/lib/rate-limiter.ts`):
   ```typescript
   rateLimitConfigs: {
     'new-feature': { windowMs: 60000, maxRequests: 5 }
   }
   ```

5. **Create UI Component** calling `runNewFeatureAction()`

## LaTeX Service Details

**Location**: `services/resume-latex-service/` (standalone Node.js service)

**API Endpoint**: `POST /v1/resume/latex/compile`

**Request Body**:
```json
{
  "source": "resumeText" | "resumeData",
  "templateId": "professional" | "faang" | "jake" | "deedy" | "modern" | "minimal" | "tech",
  "resumeText": "plain text resume" (if source=resumeText),
  "resumeData": { personalInfo: {...}, ... } (if source=resumeData),
  "options": { 
    "engine": "tectonic", 
    "return": ["latex", "pdf"] 
  }
}
```

**Response** (success):
```json
{
  "ok": true,
  "latexSource": "\\documentclass...",
  "pdfBase64": "JVBERi0xLjQK..." (raw base64, NO 'data:application/pdf;base64,' prefix),
  "cached": true (optional)
}
```

**Response** (error):
```json
{
  "ok": false,
  "error": "INVALID_REQUEST" | "COMPILE_FAILED" | "QUEUE_ERROR" | "INTERNAL_ERROR",
  "message": "Detailed error message",
  "details": { ... }
}
```

**Features**:
- Request queue (max 3 concurrent compilations to prevent OOM)
- PDF caching (LRU, 60-80% hit rate)
- Pre-warmed tectonic (packages downloaded at build time)
- Health endpoints: `/healthz`, `/readyz`, `/metrics`
- 120s timeout (aligned with client-side fetch timeout)
- Rate limiting (429 when queue full)

**Local Testing**:
```bash
curl -X POST http://localhost:8080/v1/resume/latex/compile \
  -H "Content-Type: application/json" \
  -d '{"source":"resumeText","templateId":"faang","resumeText":"John Doe..."}'
```

## Important Patterns

### Authentication (open registration)
- **JWT + Session based**: Uses custom JWT access/refresh tokens + Redis sessions (not Firebase)
- **Multiple auth methods**: Email/password, Google OAuth, OTP (email/SMS/WhatsApp)
- **Session management**: `rb_session` cookie with sessionId, stored in Redis
- **Token refresh**: Automatic refresh token rotation for security
- **Cookie-based**: Session cookie checked by middleware.ts for route protection
- **Protected routes**: `/dashboard`, `/analysis`, `/qa`, `/interview`, `/improvement`, `/create-resume`, `/billing`, `/profile`, `/resume-library`
- **Public routes**: `/`, `/login`, `/signup`, `/pricing`
- **Admin routes**: `/admin` (requires role check in PostgreSQL users.role = 'ADMIN')
- **User management**: Full CRUD in PostgreSQL users table with Prisma
- **Email verification**: OTP-based email verification flow
- **Password reset**: OTP-based password reset with Redis cooldowns

### Optimization Stack (supports 500+ concurrent users)
- **Response Caching**: LRU cache, 1hr TTL, 40-60% API call reduction
- **Request Deduplication**: Prevents concurrent duplicate requests, 10-20% reduction
- **Prompt Compression**: Removes whitespace, 20-30% token reduction
- **User-Level Caching**: Per-user analysis results, 30-40% reduction
- **Token Truncation**: `truncateToTokens()` in AI flows to stay under FEATURE_TOKEN_LIMITS

### Error Handling
- **Zod validation**: All server actions validate inputs with safeParse()
- **Rate limit errors**: Return `{ success: false, remaining: 0, dailyLimitExceeded: true }`
- **AI errors**: Provider fallback chain automatically retries with next provider
- **LaTeX errors**: 429 (queue full), timeouts (120s), compilation failures (COMPILE_FAILED)

## Key Files Reference
- **Server actions** (1358 lines): [src/app/actions.ts](src/app/actions.ts)
- **AI routing** (546 lines): [src/ai/smart-router.ts](src/ai/smart-router.ts)
- **Multi-provider** (267 lines): [src/ai/multi-provider.ts](src/ai/multi-provider.ts)
- **AI public API** (142 lines): [src/ai/index.ts](src/ai/index.ts)
- **Subscription types** (263 lines): [src/lib/types/subscription.ts](src/lib/types/subscription.ts)
- **Subscription service** (454 lines): [src/lib/subscription-service.ts](src/lib/subscription-service.ts)
- **Rate limiting** (502 lines): [src/lib/rate-limiter.ts](src/lib/rate-limiter.ts)
- **Auth context** (197 lines): [src/context/auth-context.tsx](src/context/auth-context.tsx)
- **Route protection** (116 lines): [middleware.ts](middleware.ts)
- **LaTeX service README** (112 lines): [services/resume-latex-service/README.md](services/resume-latex-service/README.md)
- **Database schema** (416 lines): [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
- **Auth package**: [packages/auth/src/index.ts](packages/auth/src/index.ts)

## AI Flows (12 features)
1. [analyze-resume-content.ts](src/ai/flows/analyze-resume-content.ts) - ATS scoring, keyword analysis
2. [generate-interview-questions.ts](src/ai/flows/generate-interview-questions.ts) - Role-based interview prep
3. [generate-interview-session.ts](src/ai/flows/generate-interview-session.ts) - Full interview session generation
4. [generate-dsa-questions.ts](src/ai/flows/generate-dsa-questions.ts) - DSA coding problems
5. [evaluate-interview-answer.ts](src/ai/flows/evaluate-interview-answer.ts) - Answer scoring & feedback
6. [evaluate-code-solution.ts](src/ai/flows/evaluate-code-solution.ts) - Code evaluation
7. [generate-follow-up-question.ts](src/ai/flows/generate-follow-up-question.ts) - Dynamic follow-ups
8. [generate-resume-qa.ts](src/ai/flows/generate-resume-qa.ts) - Topic-based Q&A
9. [suggest-resume-improvements.ts](src/ai/flows/suggest-resume-improvements.ts) - Content enhancement
10. [parse-resume-intelligently.ts](src/ai/flows/parse-resume-intelligently.ts) - Structured data extraction
11. [structure-job-description.ts](src/ai/flows/structure-job-description.ts) - JD parsing
12. [generate-cover-letter.ts](src/ai/flows/generate-cover-letter.ts) - Personalized cover letters
