# ResumeBuddy 2.0 - Implementation Phases

> **Sprint Duration**: 7 Days (End-to-End)  
> **Go-Live Target**: End of Phase 5  
> **Team Size**: 1-2 Developers  

---

## Quick Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION PHASES                                │
├───────────┬─────────────────────────────────────────────────────────────────┤
│ PHASE 1   │ 🏗️  FOUNDATION (Infrastructure + Authentication)                │
│           │     Docker, PostgreSQL, Redis, MinIO, JWT, OAuth                │
│           │     Duration: ~16 hours                                         │
├───────────┼─────────────────────────────────────────────────────────────────┤
│ PHASE 2   │ 🗄️  CORE PLATFORM (Database + Business Logic)                   │
│           │     Prisma Schema, Migration, APIs, Rate Limiting               │
│           │     Duration: ~16 hours                                         │
├───────────┼─────────────────────────────────────────────────────────────────┤
│ PHASE 3   │ 📱 COMMUNICATION (Notifications & Messaging)                    │
│           │     WhatsApp OTP, Email Templates, SMS, Workers                 │
│           │     Duration: ~8 hours                                          │
├───────────┼─────────────────────────────────────────────────────────────────┤
│ PHASE 4   │ ☁️  STORAGE & DELIVERY (Cloud Storage + Frontend)               │
│           │     MinIO Integration, Resume Library, Downloads                │
│           │     Duration: ~8 hours                                          │
├───────────┼─────────────────────────────────────────────────────────────────┤
│ PHASE 5   │ 🚀 LAUNCH (Testing + Deployment)                                │
│           │     Integration Tests, SSL, Production, Monitoring              │
│           │     Duration: ~8 hours                                          │
└───────────┴─────────────────────────────────────────────────────────────────┘
                              TOTAL: ~56 hours
```

---

## Phase 1: Foundation 🏗️

**Duration**: ~16 hours  
**Dependencies**: None (starting point)  
**Blocking**: All other phases depend on this

### 1.1 Infrastructure Setup (~8 hours)

**Objective**: Get all infrastructure services running locally with Docker

| Task | Time | Deliverable |
|------|------|-------------|
| Create monorepo structure with Turborepo | 1h | `turbo.json`, `pnpm-workspace.yaml` |
| Set up `docker-compose.yml` with PostgreSQL | 1h | PostgreSQL 16 container running |
| Add Redis to docker-compose | 1h | Redis 7 container with persistence |
| Add MinIO (S3-compatible storage) | 1h | MinIO console accessible at :9001 |
| Configure Traefik reverse proxy | 1h | SSL termination, routing |
| Create `.env.template` with all variables | 1h | Environment configuration |
| Write `infrastructure/scripts/setup.sh` | 1h | One-command local setup |
| Test full stack startup & connectivity | 1h | All services healthy |

**Phase 1.1 Deliverables**:
```
infrastructure/
├── docker/
│   ├── docker-compose.yml      ✅
│   └── docker-compose.prod.yml ✅
├── scripts/
│   └── setup.sh                ✅
└── .env.template               ✅
```

**Verification Commands**:
```bash
# Initialize monorepo
pnpm init
pnpm add -D turbo
mkdir -p apps/web apps/websocket packages/{database,auth,storage,queue,shared}
mkdir -p infrastructure/{docker,scripts}

# Start infrastructure
cd infrastructure/docker
docker-compose up -d postgres redis minio

# Verify services
docker-compose ps
docker-compose logs -f postgres
```

### 1.2 Authentication System (~8 hours)

**Objective**: Complete custom auth replacing Firebase Auth

| Task | Time | Deliverable |
|------|------|-------------|
| Create `packages/auth` structure | 1h | Package with dependencies |
| Implement JWT token generation/verification | 1h | `jwt.ts` with access/refresh tokens |
| Implement Redis session management | 1h | `session.ts` with CRUD operations |
| Implement password hashing (bcrypt) | 1h | `password.ts` with validation |
| Implement Google OAuth flow | 1h | `oauth/google.ts` |
| Create auth API routes | 1h | `/api/auth/*` endpoints |
| Implement auth middleware | 1h | `middleware.ts` for route protection |
| Create `AuthContext` for React | 1h | Client-side auth state |

**Phase 1.2 Deliverables**:
```
packages/auth/
├── src/
│   ├── jwt.ts              # Token generation/verification
│   ├── session.ts          # Redis session management
│   ├── password.ts         # bcrypt hashing
│   ├── oauth/
│   │   └── google.ts       # Google OAuth
│   └── index.ts            # Public exports
└── package.json

apps/web/src/app/api/auth/
├── login/route.ts          ✅
├── register/route.ts       ✅
├── logout/route.ts         ✅
├── refresh/route.ts        ✅
└── callback/google/route.ts ✅
```

### Phase 1 Completion Checklist

```
Infrastructure:
- [ ] PostgreSQL running and accessible
- [ ] Redis running with password auth
- [ ] MinIO running with default bucket created
- [ ] Traefik routing requests correctly
- [ ] All services connected via Docker network
- [ ] `.env` file configured with all secrets
- [ ] `docker-compose up -d` brings up entire stack

Authentication:
- [ ] JWT generation with 15min access / 7d refresh tokens
- [ ] Redis session store working
- [ ] Password hashing with bcrypt (12 rounds)
- [ ] Google OAuth login flow complete
- [ ] `/api/auth/login` endpoint working
- [ ] `/api/auth/register` endpoint working
- [ ] `/api/auth/logout` endpoint working
- [ ] `/api/auth/refresh` endpoint working
- [ ] Protected routes redirecting to login
- [ ] `useAuth()` hook providing user state
```

### Phase 1 Exit Criteria

✅ All Docker services healthy  
✅ User can register with email/password  
✅ User can login and receive JWT tokens  
✅ Protected routes require authentication  
✅ Session persists across page refreshes  

---

## Phase 2: Core Platform 🗄️

**Duration**: ~16 hours  
**Dependencies**: Phase 1 (Infrastructure + Auth)  
**Blocking**: Phase 3, Phase 4

### 2.1 Database Layer (~8 hours)

**Objective**: PostgreSQL schema + Prisma ORM + Data migration from Firestore

| Task | Time | Deliverable |
|------|------|-------------|
| Write complete Prisma schema | 1.5h | All models defined |
| Run initial migration | 1h | Tables created in PostgreSQL |
| Create Prisma client exports | 1.5h | Type-safe database client |
| Write Firestore → PostgreSQL migration script | 1.5h | `scripts/migrate-firebase.ts` |
| Migrate users, subscriptions, analyses | 1.5h | Data in PostgreSQL |
| Verify data integrity & indexes | 1h | All queries optimized |

**Prisma Schema Models**:
```prisma
// Core models to implement
model User { ... }
model Subscription { ... }
model Analysis { ... }
model InterviewSession { ... }
model QASession { ... }
model CoverLetter { ... }
model GeneratedResume { ... }
model UsageRecord { ... }
model RefreshToken { ... }
model Session { ... }
```

**Migration Commands**:
```bash
# Generate Prisma client
cd packages/database
pnpm prisma generate

# Create and apply migration
pnpm prisma migrate dev --name init

# View database
pnpm prisma studio
```

### 2.2 Business Logic (~8 hours)

**Objective**: Core business logic - all AI features + subscription management

| Task | Time | Deliverable |
|------|------|-------------|
| Update `actions.ts` for PostgreSQL | 1h | DB calls updated |
| Implement subscription service | 1h | `subscription-service.ts` |
| Implement rate limiter (Redis-backed) | 1h | `rate-limiter.ts` |
| Update AI flows for new DB | 1h | Cache + persistence |
| Create API routes for analyses | 1h | CRUD endpoints |
| Create API routes for interviews | 1h | CRUD endpoints |
| Update Razorpay webhook for PostgreSQL | 1h | Payment processing |
| Test all server actions end-to-end | 1h | Full flow working |

**Phase 2.2 API Endpoints**:
```
POST /api/analysis        → Run resume analysis
POST /api/interview       → Generate interview questions
POST /api/qa              → Answer resume questions
POST /api/improvements    → Get improvement suggestions
POST /api/export          → Export to PDF
GET  /api/usage           → Get usage stats
POST /api/razorpay/webhook → Handle payments
```

### Phase 2 Completion Checklist

```
Database:
- [ ] Prisma schema with all models (User, Subscription, Analysis, etc.)
- [ ] Initial migration run successfully
- [ ] All indexes created for performance
- [ ] Firestore export script working
- [ ] User data migrated
- [ ] Subscription data migrated
- [ ] Analysis history migrated
- [ ] Data integrity verified
- [ ] Prisma client generating TypeScript types

Business Logic:
- [ ] `runAnalysisAction` working with PostgreSQL
- [ ] `runInterviewAction` working with PostgreSQL
- [ ] `runQAAction` working with PostgreSQL
- [ ] `runImprovementAction` working with PostgreSQL
- [ ] `exportResumeAction` working with PostgreSQL
- [ ] Redis rate limiting functional
- [ ] Subscription tier checks working
- [ ] Usage tracking incrementing correctly
- [ ] Razorpay webhook updating subscriptions
- [ ] All AI flows returning valid responses
```

### Phase 2 Exit Criteria

✅ All database models created and migrated  
✅ Firestore data successfully transferred  
✅ All AI features functional with PostgreSQL  
✅ Subscription checks enforcing tier limits  
✅ Rate limiting protecting API endpoints  

---

## Phase 3: Communication 📱

**Duration**: ~8 hours  
**Dependencies**: Phase 2 (Database + Users exist)  
**Blocking**: None (can run parallel with Phase 4)

### 3.1 OTP Authentication (~4 hours)

**Objective**: Multi-channel OTP for login and verification

| Task | Time | Deliverable |
|------|------|-------------|
| Implement WhatsApp OTP service | 1.5h | `otp/whatsapp.ts` |
| Implement SMS fallback (Twilio) | 1.5h | `otp/sms.ts` |
| Implement Email OTP | 1h | `otp/email-otp.ts` |

**OTP Flow**:
```
User Request → Rate Limit Check → Generate 6-digit Code 
    → Store in Redis (5min TTL) 
    → Send via WhatsApp/SMS/Email 
    → Return masked identifier
```

### 3.2 Email Notifications (~4 hours)

**Objective**: Transactional emails and notification workers

| Task | Time | Deliverable |
|------|------|-------------|
| Create email templates (10 types) | 1.5h | HTML templates |
| Set up BullMQ notification workers | 1.5h | Background processing |
| Implement notification preferences | 0.5h | User settings |
| Test all notification channels | 0.5h | E2E verification |

**Email Templates**:
```
1. welcome.html           - New user onboarding
2. verify-email.html      - Email verification
3. password-reset.html    - Password reset link
4. subscription.html      - Pro upgrade confirmation
5. expiring-soon.html     - 7-day warning
6. expired.html           - Subscription ended
7. export-ready.html      - PDF download link
8. analysis-complete.html - ATS score summary
9. login-alert.html       - New device login
10. daily-summary.html    - Usage statistics
```

### Phase 3 Completion Checklist

```
OTP System:
- [ ] WhatsApp OTP sending via Twilio/Gupshup
- [ ] SMS fallback when WhatsApp fails
- [ ] Email OTP with verification
- [ ] Rate limiting on OTP requests (3/min)
- [ ] OTP expiry after 5 minutes
- [ ] Max 3 verification attempts

Notifications:
- [ ] Welcome email template
- [ ] Password reset email template
- [ ] Export ready notification
- [ ] Subscription confirmation email
- [ ] BullMQ workers processing jobs
- [ ] Notification preferences in user settings
```

### Phase 3 Exit Criteria

✅ Users can verify phone via WhatsApp/SMS OTP  
✅ Email notifications delivered reliably  
✅ Background workers processing queue  
✅ User can manage notification preferences  

---

## Phase 4: Storage & Delivery ☁️

**Duration**: ~8 hours  
**Dependencies**: Phase 2 (Database)  
**Blocking**: None (can run parallel with Phase 3)

### 4.1 Cloud Storage Backend (~4 hours)

**Objective**: MinIO integration for resume storage

| Task | Time | Deliverable |
|------|------|-------------|
| Implement MinIO client | 1.5h | `minio-client.ts` |
| Implement resume storage service | 1.5h | `resume-storage.ts` |
| Create resume API routes | 1h | CRUD + download |

**Storage Service Functions**:
```typescript
storeGeneratedResume()    // Save PDF with metadata
getResumeDownloadUrl()    // Generate presigned URL
listUserResumes()         // Paginated list
downloadResume()          // Direct download
deleteStoredResume()      // Soft/hard delete
toggleResumeArchive()     // Archive management
cleanupExpiredResumes()   // Cron job cleanup
```

### 4.2 Resume Library Frontend (~4 hours)

**Objective**: User-facing resume management UI

| Task | Time | Deliverable |
|------|------|-------------|
| Build Resume Library component | 1.5h | React UI |
| Integrate export action with storage | 1h | Auto-save to cloud |
| Implement presigned URL refresh | 1h | Secure downloads |
| Test upload/download/delete flow | 0.5h | Full cycle working |

**API Routes**:
```
GET    /api/resumes              → List user's resumes
GET    /api/resumes/[id]         → Get download URL
PATCH  /api/resumes/[id]         → Rename resume
DELETE /api/resumes/[id]         → Delete resume
GET    /api/resumes/[id]/download → Direct file download
POST   /api/resumes/[id]/archive  → Toggle archive
```

### Phase 4 Completion Checklist

```
Storage Backend:
- [ ] MinIO client connecting successfully
- [ ] `storeGeneratedResume()` saving PDFs
- [ ] `getResumeDownloadUrl()` generating presigned URLs
- [ ] `listUserResumes()` returning paginated results
- [ ] `deleteStoredResume()` soft/hard delete working
- [ ] Content-hash deduplication working

Frontend:
- [ ] Resume Library UI showing all resumes
- [ ] Download button working with presigned URLs
- [ ] Delete confirmation dialog
- [ ] Rename functionality
- [ ] Archive/unarchive toggle
- [ ] Export action auto-storing to cloud
- [ ] Search/filter resumes
```

### Phase 4 Exit Criteria

✅ Generated PDFs automatically stored in MinIO  
✅ Users can view, download, rename, delete resumes  
✅ Presigned URLs working with 7-day expiry  
✅ Resume Library component fully functional  

---

## Phase 5: Launch 🚀

**Duration**: ~8 hours  
**Dependencies**: Phases 1-4 complete  
**Blocking**: None (final phase)

### 5.1 Testing & Quality Assurance (~4 hours)

**Objective**: Ensure stability before production deployment

| Task | Time | Deliverable |
|------|------|-------------|
| Write integration tests | 1.5h | Jest/Vitest test suite |
| Fix any bugs found | 1.5h | Stable codebase |
| Performance optimization | 1h | < 3s page loads |

**Test Coverage Areas**:
```
1. Auth Flow        → register → login → logout
2. AI Features      → analysis, interview, QA, improvements
3. Export Flow      → generate → store → download
4. Subscription     → upgrade → webhook → access check
5. Notifications    → email delivery, OTP verification
```

### 5.2 Production Deployment (~4 hours)

**Objective**: Deploy to production with monitoring

| Task | Time | Deliverable |
|------|------|-------------|
| Create production docker-compose | 1h | `docker-compose.prod.yml` |
| Set up SSL certificates (Let's Encrypt) | 1h | HTTPS enabled |
| Deploy to production server | 1h | Live environment |
| Smoke test production | 1h | All features verified |

**Deployment Commands**:
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to server
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec web pnpm prisma migrate deploy

# Check logs
docker-compose logs -f web

# Health check
curl https://yourdomain.com/api/health
```

### Phase 5 Completion Checklist

```
Testing:
- [ ] Auth flow tested (register → login → logout)
- [ ] AI features tested (analysis, interview, QA)
- [ ] Export flow tested (generate → store → download)
- [ ] Subscription flow tested (upgrade → webhook → access)
- [ ] Notification delivery verified
- [ ] Performance under load acceptable

Deployment:
- [ ] Production environment variables set
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] DNS pointing to production
- [ ] Final smoke test passed ✅
```

### Phase 5 Exit Criteria

✅ All integration tests passing  
✅ Production environment accessible via HTTPS  
✅ All features working in production  
✅ Monitoring dashboards active  
✅ Backup system operational  

---

## Phase Summary

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| **1** | Foundation (Infra + Auth) | 16h | None |
| **2** | Core Platform (DB + Logic) | 16h | Phase 1 |
| **3** | Communication (Notifications) | 8h | Phase 2 |
| **4** | Storage & Delivery | 8h | Phase 2 |
| **5** | Launch (Test + Deploy) | 8h | Phases 1-4 |
| | **TOTAL** | **56h** | |

### Parallel Execution Opportunities

```
          Phase 1          Phase 2        Phase 3
         (16 hours)       (16 hours)     (8 hours)
    ┌─────────────────┬───────────────┬─────────────┐
    │  Infrastructure │   Database    │     OTP     │
    │       +         │      +        │     +       │
    │     Auth        │ Business Logic│   Email     │
    └─────────────────┴───────────────┴──────┬──────┘
                                             │
                                      ┌──────┴──────┐
                                      │   Phase 4   │ (Can run parallel
                                      │   Storage   │  with Phase 3)
                                      │  (8 hours)  │
                                      └──────┬──────┘
                                             │
                                      ┌──────┴──────┐
                                      │   Phase 5   │
                                      │   Launch    │
                                      │  (8 hours)  │
                                      └─────────────┘
```

**With 2 developers**: Phase 3 & 4 can run in parallel → Total time: ~48 hours

---

## Risk Mitigation

### Potential Blockers & Solutions

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OAuth provider issues | Low | High | Have email/password as fallback |
| MinIO configuration | Medium | Medium | Use AWS S3 env vars if needed |
| Data migration issues | Medium | High | Run migration on copy first |
| WhatsApp API approval | High | Medium | Use SMS as primary initially |
| Performance issues | Medium | Medium | Add caching layer early |

### Fallback Plans

1. **If OAuth takes too long** → Ship with email/password only, add OAuth post-launch
2. **If WhatsApp API delayed** → Use email OTP as primary verification
3. **If MinIO complex** → Use local filesystem with presigned URLs
4. **If migration fails** → Keep Firebase read-only, migrate incrementally

---

## Final Success Criteria

### Launch Day Checklist

```
✅ User can register with email/password
✅ User can login with Google OAuth
✅ User can verify phone via OTP
✅ User can upload resume and get analysis
✅ User can generate interview questions
✅ User can export PDF resume
✅ PDF is stored in cloud and downloadable
✅ User receives email notifications
✅ Pro subscription upgrades work
✅ All data persists in PostgreSQL
✅ No Firebase dependencies remain
✅ Production deployment accessible via HTTPS
```

---

## Post-Launch Roadmap

### Immediate Follow-ups (Week 2)

1. **Monitor production** - Watch logs, errors, performance
2. **User feedback** - Address any UX issues
3. **Optimize queries** - Add indexes where needed
4. **Scale infrastructure** - Add replicas if needed

### Future Enhancements (v2.1+)

- [ ] GitHub OAuth
- [ ] Two-factor authentication (2FA)
- [ ] WebSocket real-time updates
- [ ] Admin dashboard
- [ ] Analytics/metrics dashboard
- [ ] Mobile app API support

---

## Quick Reference Commands

```bash
# Phase 1: Start infrastructure
docker-compose up -d

# Phase 1: Test auth
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Phase 2: Run migration
pnpm prisma migrate dev

# Phase 2: Test API
curl http://localhost:3000/api/health

# Phase 3: Test notifications
pnpm run test:email

# Phase 4: Test storage
pnpm run test:storage

# Phase 5: Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

**🎯 Goal**: From Firebase-dependent to fully self-hosted in 5 phases!

*Last Updated: February 2026*
