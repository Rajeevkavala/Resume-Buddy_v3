# Phase 2: Core Platform - Database Layer + Business Logic

> **Copilot Agent Prompt for Phase 2 Implementation**
> **Estimated Duration**: ~16 hours
> **Dependencies**: Phase 1 (Infrastructure + Auth) must be complete
> **Blocking**: Phase 3, 4, 5 depend on this

---

## Instruction

Take the `ARCHITECTURE_TRANSFORMATION.md` as the **primary reference** and `IMPLEMENTATION_TIMELINE_7_DAYS.md` as the secondary reference for phase-wise implementation.

Now implement **Phase 2 completely end-to-end** — it should work 100% without any errors. Test after implementing.

**Important**: If `IMPLEMENTATION_TIMELINE_7_DAYS.md` does not have enough context, use `ARCHITECTURE_TRANSFORMATION.md` as the primary source of truth for all code, schemas, configurations, and architectural decisions.

**Prerequisite**: Phase 1 must be fully working before starting Phase 2. Verify:
- Docker services (PostgreSQL, Redis, MinIO) are running and healthy
- Auth system works (register, login, jwt, sessions)
- `packages/auth` is functional

---

## Phase 2 Scope

Phase 2 has two sub-phases:
1. **Phase 2.1 — Database Layer** (~8 hours)
2. **Phase 2.2 — Business Logic Migration** (~8 hours)

---

## Phase 2.1: Database Layer

### Objective
Define the complete Prisma schema with all models and enums, run migrations, set up database client singleton, and optionally create a data migration script from Firebase/Firestore.

### Tasks (implement in order)

#### 1. Set Up `packages/database` Package
- Create `package.json`, `tsconfig.json`
- Install: `@prisma/client`, `prisma` (dev)
- Create `prisma/schema.prisma` pointing to `DATABASE_URL`
- Create `src/client.ts` for global Prisma singleton
- Create `src/index.ts` to export client + helpers

#### 2. Full Prisma Schema (`packages/database/prisma/schema.prisma`)
Define the following models with ALL fields exactly as specified in ARCHITECTURE_TRANSFORMATION.md Section 5:

**Enums:**
```prisma
enum Role {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum VerificationType {
  EMAIL
  PHONE
  PASSWORD_RESET
}

enum SubscriptionTier {
  FREE
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PAST_DUE
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum InterviewType {
  TECHNICAL
  BEHAVIORAL
  SYSTEM_DESIGN
  HR
  MIXED
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}

enum InterviewStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum ResumeFormat {
  LATEX
  PDF
  DOCX
}

enum ResumeStatus {
  DRAFT
  GENERATING
  COMPLETED
  FAILED
}
```

**Models (implement ALL fields from ARCHITECTURE_TRANSFORMATION.md):**

- **User** — id (cuid), email (unique), passwordHash (optional for OAuth), name, phone (optional unique), phoneVerified, avatar, role (USER/ADMIN), status (ACTIVE), emailVerified, lastLoginAt, createdAt, updatedAt. Relations: accounts, sessions, refreshTokens, subscription, payments, usageRecords, resumes, interviews, storedFiles, generatedResumes.

- **Account** — id, userId (FK), provider ('email'/'google'/'github'), providerAccountId, accessToken, refreshToken, expiresAt, createdAt. `@@unique([provider, providerAccountId])`

- **Session** — id, sessionId (unique), userId (FK), userAgent, ipAddress, expiresAt, createdAt, lastActivityAt.

- **RefreshToken** — id, token (unique), userId (FK), expiresAt, revokedAt, replacedByToken, createdAt.

- **Subscription** — id, userId (unique FK), tier (FREE/PRO), status (ACTIVE), razorpaySubscriptionId, razorpayCustomerId, currentPeriodStart, currentPeriodEnd, cancelledAt, createdAt, updatedAt.

- **Payment** — id, userId (FK), amount (Decimal 10,2), currency (default "INR"), status (PaymentStatus), razorpayPaymentId (unique optional), razorpayOrderId, razorpaySignature, planType (optional), description (optional), metadata (Json optional), createdAt.

- **UsageRecord** — id, userId (FK), feature, count (default 1), date (DateTime), createdAt. `@@unique([userId, feature, date])`

- **ResumeData** — id, userId (FK), title, resumeText (optional text), jobDescription (optional text), parsedData (Json optional), analysis (Json optional), improvements (Json optional), qaHistory (Json optional), coverLetter (text optional), isActive (default true), lastAnalyzedAt (optional), createdAt, updatedAt.

- **Interview** — id, userId (FK), resumeDataId (optional FK), type (InterviewType), difficulty (DifficultyLevel), role (optional), company (optional), questions (Json), answers (Json optional), feedback (Json optional), score (Int optional), status (InterviewStatus default NOT_STARTED), startedAt (optional), completedAt (optional), createdAt, updatedAt.

- **StoredFile** — id, userId (FK), filename, originalName, mimeType, size (Int), bucket (default "resumebuddy"), objectKey, publicUrl (optional), isPublic (default false), metadata (Json optional), createdAt, updatedAt.

- **GeneratedResume** — id, userId (FK), resumeDataId (FK), templateId, format (ResumeFormat), latexSource (text optional), fileId (optional FK to StoredFile), status (ResumeStatus default DRAFT), error (text optional), generatedAt (optional), createdAt, updatedAt.

**Indexes:**
- User: `@@index([email])`, `@@index([phone])`
- UsageRecord: `@@index([userId, date])`, `@@index([userId, feature])`
- ResumeData: `@@index([userId, isActive])`, `@@index([userId, createdAt])`
- Interview: `@@index([userId, createdAt])`, `@@index([userId, status])`
- StoredFile: `@@index([userId, createdAt])`
- GeneratedResume: `@@index([userId, createdAt])`
- Payment: `@@index([userId, createdAt])`, `@@index([razorpayPaymentId])`

#### 3. Database Client Singleton (`packages/database/src/client.ts`)
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

#### 4. Subscription Helper Functions (`packages/database/src/subscription.ts`)
```typescript
// TIER_LIMITS matching existing TIER_LIMITS from src/lib/types/subscription.ts
const TIER_LIMITS = {
  FREE: {
    aiCreditsPerDay: 5,
    exportsPerDay: 2,
    resumeTemplates: ['professional', 'minimal'],
    features: ['resume-analysis', 'resume-improvement'],
    maxResumes: 3,
    maxFileSize: 5 * 1024 * 1024,
  },
  PRO: {
    aiCreditsPerDay: 10,
    exportsPerDay: -1,           // unlimited
    resumeTemplates: 'all',
    features: 'all',
    maxResumes: 50,
    maxFileSize: 25 * 1024 * 1024,
  },
};

// Functions:
getUserTier(userId)              // Query subscription, check expiration → 'free' | 'pro'
checkFeatureAccess(userId, feature)  // Returns boolean
assertFeatureAllowed(userId, feature) // Throws if not allowed
getRemainingCredits(userId, feature)  // Check UsageRecords today
incrementUsage(userId, feature)       // Create/update UsageRecord
```

#### 5. Run Database Migrations
```bash
cd packages/database
npx prisma generate          # Generate Prisma Client
npx prisma migrate dev --name init  # Create initial migration
npx prisma db push           # Alternative: sync schema
```

#### 6. Firebase Data Migration Script (Optional)
Create `infrastructure/scripts/migrate-from-firebase.ts`:
- Connect to Firestore (read-only)
- For each user doc: create User, Account, Subscription in PostgreSQL
- For each analysis doc: create ResumeData
- For each interview doc: create Interview
- Log migration stats (total, success, failed)
- **This is optional** — only needed if there's existing production data

### Phase 2.1 Verification
```bash
# Schema validation
cd packages/database
npx prisma validate

# Migration
npx prisma migrate dev --name init

# Seed test data (optional)
npx prisma db seed

# Check tables
npx prisma studio   # Opens visual DB browser at localhost:5555
```

---

## Phase 2.2: Business Logic Migration

### Objective
Migrate ALL server actions from Firebase/Firestore to PostgreSQL + Prisma. Update subscription service, rate limiter, AI flows, and payment webhooks.

### Tasks (implement in order)

#### 1. Update Server Actions (`src/app/actions.ts`)
Migrate ALL server actions to use Prisma instead of Firestore. Every Firestore call must be replaced with its Prisma equivalent.

**Key patterns to follow:**

```typescript
// BEFORE (Firebase):
import { db } from '@/lib/firestore';
await db.collection('users').doc(userId).set(data);
const doc = await db.collection('analyses').doc(userId).get();

// AFTER (PostgreSQL):
import { prisma } from '@resumebuddy/database';
await prisma.user.update({ where: { id: userId }, data });
const record = await prisma.resumeData.findFirst({ where: { userId, isActive: true } });
```

**Server Actions to migrate (all in `src/app/actions.ts`):**

1. **`runAnalysisAction`**:
   - Rate limit check: `enforceRateLimitAsync(userId, 'analyze-resume')`
   - Increment usage: `incrementUsage(userId, 'analyze-resume')`
   - Call AI: `analyzeResumeContent({ resumeText, jobDescription })`
   - Save to DB: `prisma.resumeData.upsert({ where: { userId_isActive: ... }, ... })`
   - Return analysis result

2. **`generateQuestionsAction`**:
   - Rate limit + usage tracking
   - Call AI: `generateInterviewQuestions({ ... })`
   - Save to DB: `prisma.interview.create({ data: { userId, type, questions, ... } })`
   - Return questions

3. **`generateQAAction`**:
   - Rate limit + usage tracking
   - Call AI: `generateResumeQA({ ... })`
   - Save to QA history: `prisma.resumeData.update({ qaHistory: appendToJsonArray })`
   - Return Q&A

4. **`suggestImprovementsAction`**:
   - Rate limit + usage tracking
   - Call AI: `suggestResumeImprovements({ ... })`
   - Save to DB: `prisma.resumeData.update({ improvements: result })`
   - Return improvements

5. **`generateCoverLetterAction`**:
   - Rate limit + usage tracking
   - Call AI: `generateCoverLetter({ ... })`
   - Save: `prisma.resumeData.update({ coverLetter: result })`
   - Return cover letter

6. **`exportResumeAction`**:
   - Check export limit: use `UsageRecord` for 'export' feature
   - Call LaTeX service: `callLatexCompileService(payload)`
   - Save generated resume: `prisma.generatedResume.create({ ... })`
   - Increment export usage
   - Return { latexSource, pdfBase64 }

7. **User data actions** (read/write user profile, resume data, etc.):
   - Replace ALL Firestore reads/writes with Prisma queries
   - Use `prisma.user.findUnique()`, `prisma.user.update()`, etc.
   - Save resume text: `prisma.resumeData.create()` or `.update()`

#### 2. Update Subscription Service (`src/lib/subscription-service.ts`)
Replace Firestore-based subscription checks with PostgreSQL:

```typescript
// Replace getUserTier() implementation:
export async function getUserTier(userId: string): Promise<'free' | 'pro'> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return 'free';
  if (subscription.status !== 'ACTIVE') return 'free';
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) return 'free';
  return subscription.tier === 'PRO' ? 'pro' : 'free';
}

// Replace assertFeatureAllowed():
export async function assertFeatureAllowed(userId: string, feature: string): Promise<void> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier.toUpperCase() as keyof typeof TIER_LIMITS];
  
  if (limits.features === 'all') return;
  if (!limits.features.includes(feature)) {
    throw new Error(`Feature '${feature}' requires Pro tier`);
  }
}
```

#### 3. Update Rate Limiter (`src/lib/rate-limiter.ts`)
Migrate from in-memory/Firestore to Redis-backed rate limiting:

```typescript
import Redis from 'ioredis';

// Use Redis sorted sets for sliding window rate limiting:
// Key pattern: `ratelimit:{userId}:{operation}`
// Score: timestamp, Member: unique request ID

export async function enforceRateLimitAsync(
  userId: string,
  operation: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const redis = getRedisClient();
  const key = `ratelimit:${userId}:${operation}`;
  const now = Date.now();
  const windowMs = rateLimitConfigs[operation]?.windowMs || 60000;
  const maxRequests = rateLimitConfigs[operation]?.maxRequests || 5;

  // Remove expired entries
  await redis.zremrangebyscore(key, 0, now - windowMs);

  // Count current window
  const count = await redis.zcard(key);

  if (count >= maxRequests) {
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = new Date(Number(oldest[1]) + windowMs);
    return { allowed: false, remaining: 0, resetAt };
  }

  // Add new entry
  await redis.zadd(key, now, `${now}:${Math.random()}`);
  await redis.expire(key, Math.ceil(windowMs / 1000));

  return { allowed: true, remaining: maxRequests - count - 1, resetAt: new Date(now + windowMs) };
}
```

Also integrate tier-aware daily limits:
- Check `UsageRecord` table for daily usage count
- Free tier: 5 AI credits/day, 2 exports/day
- Pro tier: 10 AI credits/day, unlimited exports
- Return `{ dailyLimitExceeded: true }` when exceeded

#### 4. Update AI Flows for PostgreSQL
Ensure all AI flows in `src/ai/flows/` work with the new data layer:
- **No direct DB calls in AI flows** — they only receive input and return output
- Database interaction stays in server actions (actions.ts)
- AI flows don't need modification unless they import Firestore directly
- Verify `smartGenerate()` and `parseJsonResponse()` still work
- Ensure `truncateToTokens()` is still applied

#### 5. Update Razorpay Webhook (`src/app/api/razorpay/webhook/route.ts`)
Migrate webhook handler from Firestore to PostgreSQL:

```typescript
// On successful payment:
async function handlePaymentSuccess(payment: RazorpayPayment) {
  const userId = payment.notes?.userId;
  if (!userId) return;

  // Create payment record
  await prisma.payment.create({
    data: {
      userId,
      amount: payment.amount / 100,  // Convert from paise
      currency: payment.currency,
      status: 'COMPLETED',
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
      planType: 'PRO',
      description: 'Pro subscription',
    },
  });

  // Update subscription
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);  // 1 year

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier: 'PRO',
      status: 'ACTIVE',
      razorpayCustomerId: payment.customer_id,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      tier: 'PRO',
      status: 'ACTIVE',
      razorpayCustomerId: payment.customer_id,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}
```

#### 6. Update API Routes for Database Access
Any existing API routes that use Firestore must be migrated:
- `/api/razorpay/webhook` → Use Prisma
- Any `/api/admin/*` routes → Use Prisma
- User profile endpoints → Use Prisma

#### 7. Response Cache Update (`src/lib/response-cache.ts`)
Consider migrating from in-memory LRU to Redis-backed cache:
```typescript
// Redis cache with 1hr TTL (same as existing LRU)
const CACHE_TTL = 3600; // seconds

export async function getCachedResponse(key: string) {
  const redis = getRedisClient();
  const cached = await redis.get(`cache:${key}`);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedResponse(key: string, value: unknown) {
  const redis = getRedisClient();
  await redis.setex(`cache:${key}`, CACHE_TTL, JSON.stringify(value));
}
```

#### 8. User Cache Migration (`src/lib/user-cache.ts`)
Use Redis instead of in-memory cache for user-level analysis results:
```typescript
// Redis key: `user_cache:${userId}:${analysisType}`
// TTL: 1 hour
```

---

## Required Dependencies to Install

```bash
# In packages/database
pnpm add @prisma/client
pnpm add -D prisma

# In apps/web (if not already present)
pnpm add ioredis
pnpm add -D @types/node

# Root (if using turborepo)
pnpm add -D turbo
```

---

## File Deliverables Checklist

```
Phase 2.1 (Database):
├── packages/database/package.json                  ✅
├── packages/database/tsconfig.json                 ✅
├── packages/database/prisma/schema.prisma          ✅ (complete schema)
├── packages/database/src/client.ts                 ✅
├── packages/database/src/subscription.ts           ✅
├── packages/database/src/index.ts                  ✅
├── prisma/migrations/xxxxxx_init/migration.sql     ✅ (auto-generated)
├── infrastructure/scripts/migrate-from-firebase.ts ✅ (optional)

Phase 2.2 (Business Logic):
├── src/app/actions.ts                              ✅ (migrated ALL actions)
├── src/lib/subscription-service.ts                 ✅ (PostgreSQL-backed)
├── src/lib/rate-limiter.ts                         ✅ (Redis-backed)
├── src/lib/response-cache.ts                       ✅ (Redis-backed)
├── src/lib/user-cache.ts                           ✅ (Redis-backed)
├── src/app/api/razorpay/webhook/route.ts           ✅ (PostgreSQL-backed)
├── middleware.ts                                   ✅ (updated if needed)
```

---

## Phase 2 Exit Criteria (Test All)

```
Database Layer:
- [ ] Prisma schema validates (`npx prisma validate`)
- [ ] Migration runs without errors (`npx prisma migrate dev`)
- [ ] Prisma Client generates successfully (`npx prisma generate`)
- [ ] All 12 models created in PostgreSQL
- [ ] All enums created correctly
- [ ] Indexes created for query-heavy columns
- [ ] prisma.user.create() works with test data
- [ ] prisma.subscription.findUnique() returns correct tier
- [ ] Prisma Studio opens and shows all tables

Business Logic:
- [ ] runAnalysisAction saves analysis to PostgreSQL ResumeData
- [ ] generateQuestionsAction saves interview to PostgreSQL Interview
- [ ] generateQAAction appends Q&A history to ResumeData.qaHistory
- [ ] suggestImprovementsAction saves improvements to ResumeData
- [ ] generateCoverLetterAction saves cover letter to ResumeData
- [ ] exportResumeAction creates GeneratedResume record
- [ ] getUserTier() returns correct tier from PostgreSQL Subscription
- [ ] assertFeatureAllowed() blocks Free users from Pro features
- [ ] Rate limiting works via Redis sorted sets
- [ ] Daily usage limits enforced via UsageRecord table
- [ ] Response cache works via Redis (set → get → expire)
- [ ] Razorpay webhook creates Payment + updates Subscription in PostgreSQL
- [ ] Existing UI still works with migrated server actions
- [ ] No Firestore imports remain in production code paths
- [ ] AI credits tracking works (Free: 5/day, Pro: 10/day)
- [ ] Export limits enforced (Free: 2/day, Pro: unlimited)

Verification Commands:
npx prisma validate
npx prisma migrate dev
npx prisma studio  # Visual check

# Test server actions via UI flow:
# 1. Login → Dashboard → Upload resume → Run analysis
# 2. Check PostgreSQL: SELECT * FROM "ResumeData" WHERE "userId" = '...';
# 3. Check Redis: redis-cli GET "ratelimit:userId:analyze-resume"
```

---

## Important Notes

1. **Backward Compatibility**: Keep Firestore imports as fallback during Phase 2. They'll be fully removed in Phase 5.
2. **Transaction Safety**: Use `prisma.$transaction()` for operations that modify multiple tables (e.g., payment + subscription update).
3. **JSON Fields**: PostgreSQL JSON columns (`parsedData`, `analysis`, `improvements`, `qaHistory`, `questions`, `answers`) should use `Json` Prisma type. Use `Prisma.JsonValue` for TypeScript typing.
4. **Decimal Fields**: Use `Decimal(10,2)` for payment amounts to avoid floating point issues.
5. **Date Handling**: Store dates as UTC. Use `new Date()` for `createdAt`/`updatedAt` (Prisma handles this with `@default(now())`).
6. **Existing AI flows should NOT be modified** — only the server actions that call them need to change the data persistence layer.
7. **Keep the existing `src/lib/types/subscription.ts`** types compatible — just change the backend implementation.
