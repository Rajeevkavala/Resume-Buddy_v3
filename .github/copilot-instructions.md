# ResumeBuddy - AI Coding Agent Instructions

## Project Overview
ResumeBuddy is a **Next.js 16 + React 19** SaaS application providing AI-powered resume analysis. Uses multi-provider AI (Groq → Gemini → OpenRouter fallback), Firebase Auth + Firestore, and a tiered subscription model (Free/Pro via Razorpay).

**Tech Stack**: Next.js 16, React 19, TypeScript, shadcn/ui, Firebase (Auth + Firestore), Tailwind CSS, Docker, tectonic (LaTeX)

## Architecture

### Service Boundaries
```
ResumeBuddy (monorepo)
├── Next.js App (port 9002)
│   ├── Client: React 19 + shadcn/ui + contexts
│   ├── Server: App Router + Server Actions
│   └── AI: Multi-provider with smart routing
└── LaTeX Service (Docker, port 8080)
    └── Fastify + tectonic for PDF generation
```

### Core Directory Structure
```
src/
├── ai/
│   ├── flows/              # 7 AI features (analyze, qa, interview, improvements, parse, structure, cover-letter)
│   ├── providers/          # groq.ts, gemini.ts, openrouter.ts
│   ├── multi-provider.ts   # Fallback orchestration + caching
│   ├── smart-router.ts     # Cost-optimized 3-tier model selection
│   └── index.ts            # Public AI API exports
├── app/
│   ├── actions.ts          # ALL server actions (1192 lines: AI + data + LaTeX exports)
│   └── [routes]/           # dashboard, analysis, qa, interview, create-resume, billing, admin
├── components/             # Feature tabs, templates, ui/ (shadcn)
├── context/                # auth-context.tsx (297 lines), resume-context.tsx
├── lib/
│   ├── types/subscription.ts  # SubscriptionTier, TIER_LIMITS, feature access (286 lines)
│   ├── subscription-service.ts # getUserTier(), assertFeatureAllowed() (542 lines)
│   ├── rate-limiter.ts     # Tier-aware rate limiting (614 lines)
│   ├── firestore.ts        # User data persistence
│   ├── response-cache.ts   # LRU response caching (1hr TTL)
│   ├── request-deduplicator.ts # Concurrent request deduplication
│   ├── user-cache.ts       # Per-user analysis caching
│   ├── prompt-optimizer.ts # Prompt compression utilities
│   ├── global-rate-limiter.ts # Provider rate limiting
│   ├── retry-handler.ts    # Exponential backoff retries
│   └── usage-analytics.ts  # Usage tracking & alerts
services/resume-latex-service/  # Standalone PDF compilation (112 line README, Docker)
```

### Critical Data Flows

1. **AI Request Flow** (40-60% API cost reduction via caching):
   ```
   UI → Server Action → enforceRateLimitAsync(userId, operation)
   → AI Flow (truncateToTokens for optimization)
   → smartGenerate(feature: AIFeature)
   → Provider Fallback (Groq → Gemini → OpenRouter)
   → Response Cache (LRU, 1hr TTL) + Firestore persistence
   ```

2. **Auth Flow** (open registration, no whitelist):
   ```
   Firebase Auth → AuthContext.verifyUserAccess()
   → setFastAuthCookie(uid) → middleware.ts route protection
   → createUserProfile() in Firestore
   ```

3. **Subscription Flow** (one-time payment model):
   ```
   Razorpay Payment → /api/razorpay/webhook
   → Update subscriptions/{uid} (currentPeriodEnd, tier: 'pro')
   → getUserTier() checks expiration → Feature access control
   ```

4. **LaTeX Export Flow** (120s timeout):
   ```
   UI → Server Action → enforceExportLimit(userId)
   → callLatexCompileService(payload)
   → POST /v1/resume/latex/compile (LaTeX service)
   → PDF base64 (raw, no data: prefix)
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
**ALL server actions live in ONE file** (actions.ts, 1192 lines). Pattern:
```typescript
'use server';
export async function runAnalysisAction(input: { userId: string; resumeText: string; ... }) {
  // 1. Validate with Zod
  const validated = baseSchema.safeParse(input);
  if (!validated.success) throw new Error(validated.error.errors.map(e => e.message).join(', '));
  
  // 2. Rate limit (tier-aware)
  await enforceRateLimitAsync(input.userId, 'analyze-resume');
  
  // 3. Call AI flow
  const result = await analyzeResumeContent({ ... });
  
  // 4. Persist to Firestore
  await saveToDb(input.userId, { analysis: result });
  
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

const tier = await getUserTier(userId); // 'free' | 'pro'
await assertFeatureAllowed(userId, 'interview-questions'); // Throws if Free tier

// Rate limits (TIER_LIMITS in subscription.ts)
// Free: 5 AI credits/day, 2 exports/day, resume-analysis + improvements only
// Pro: 10 AI credits/day, unlimited exports, all features
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

# LaTeX service (port 8080)
cd services/resume-latex-service
npm run dev                    # Local dev (requires tectonic on PATH)
npm run docker:build           # Build Docker image
npm run docker:run             # Run in Docker (recommended for Windows)
npm run test:load              # Load test (10 concurrent requests)

# Utilities
npm run latex:smoke            # End-to-end LaTeX compilation test
npm run tokens:estimate        # Estimate token usage for prompts
npm run db:stats               # Check Firestore usage stats
npm run db:cleanup             # Clean old data (7-day retention)
```

## Configuration

### Required Environment Variables
```env
# Firebase (client-side - NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# AI Providers (server-side) - Fallback order
GROQ_API_KEY=gsk_xxx          # Primary (14,400/day free, llama-3.1-8b-instant / llama-3.3-70b-versatile)
GOOGLE_API_KEY=xxx            # Gemini backup (1,500/day, gemini-1.5-flash)
OPENROUTER_API_KEY=sk-or-xxx  # Last resort (free Llama/Mistral)

# Services
LATEX_SERVICE_URL=http://localhost:8080  # LaTeX compilation service

# Payments (Razorpay)
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
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
     'new-feature': { primary: 'groq-llama-8b', fallback: 'groq-llama-70b', lastResort: 'gemini' }
   }
   
   FEATURE_TOKEN_LIMITS: { 'new-feature': 5000 }
   FEATURE_OUTPUT_TOKENS: { 'new-feature': 600 }
   ```

3. **Add Server Action** (`src/app/actions.ts`):
   ```typescript
   export async function runNewFeatureAction(input: { userId: string; ... }) {
     await enforceRateLimitAsync(input.userId, 'new-feature');
     return await newFeature({ ... });
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
- **No whitelist**: All Firebase-authenticated users get Free tier access immediately
- **Cookie-based**: `fast-auth-uid` cookie set by AuthContext, checked by middleware.ts
- **Protected routes**: `/dashboard`, `/analysis`, `/qa`, `/interview`, `/improvement`, `/create-resume`, `/billing`
- **Public routes**: `/`, `/login`, `/signup`, `/pricing`
- **Admin routes**: `/admin` (requires admin check in component logic)

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
- **Server actions** (1192 lines): [src/app/actions.ts](src/app/actions.ts)
- **AI routing** (509 lines): [src/ai/smart-router.ts](src/ai/smart-router.ts)
- **Multi-provider** (297 lines): [src/ai/multi-provider.ts](src/ai/multi-provider.ts)
- **AI public API** (152 lines): [src/ai/index.ts](src/ai/index.ts)
- **Subscription types** (286 lines): [src/lib/types/subscription.ts](src/lib/types/subscription.ts)
- **Subscription service** (542 lines): [src/lib/subscription-service.ts](src/lib/subscription-service.ts)
- **Rate limiting** (614 lines): [src/lib/rate-limiter.ts](src/lib/rate-limiter.ts)
- **Auth context** (297 lines): [src/context/auth-context.tsx](src/context/auth-context.tsx)
- **Route protection** (129 lines): [middleware.ts](middleware.ts)
- **LaTeX service README** (112 lines): [services/resume-latex-service/README.md](services/resume-latex-service/README.md)

## AI Flows (7 features)
1. [analyze-resume-content.ts](src/ai/flows/analyze-resume-content.ts) - ATS scoring, keyword analysis
2. [generate-interview-questions.ts](src/ai/flows/generate-interview-questions.ts) - Role-based interview prep
3. [generate-resume-qa.ts](src/ai/flows/generate-resume-qa.ts) - Topic-based Q&A
4. [suggest-resume-improvements.ts](src/ai/flows/suggest-resume-improvements.ts) - Content enhancement
5. [parse-resume-intelligently.ts](src/ai/flows/parse-resume-intelligently.ts) - Structured data extraction
6. [structure-job-description.ts](src/ai/flows/structure-job-description.ts) - JD parsing
7. [generate-cover-letter.ts](src/ai/flows/generate-cover-letter.ts) - Personalized cover letters
