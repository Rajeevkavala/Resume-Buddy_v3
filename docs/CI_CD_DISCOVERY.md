# Resume Buddy CI/CD Discovery Report

**Repository:** `Resume-Buddy_v3`  
**Generated Date:** August 30, 2026  
**Role / Authors:** Senior DevOps Engineer, Staff Software Engineer & Solutions Architect  
**Target File:** `docs/CI_CD_DISCOVERY.md`  
**System Classification:** Production Hybrid Web Application & ARM64 Distributed Microservices

---

# 1. Executive Summary

### 1.1 Project Purpose
**ResumeBuddy v3** is an enterprise-grade, AI-powered career enablement platform offering intelligent resume creation, ATS parsing and score analysis, real-time LaTeX PDF compilation, cover letter generation, interactive voice/text mock interviews, and Data Structures & Algorithms (DSA) technical evaluation.

### 1.2 Architecture Overview
The platform operates as a **polyglot hybrid distributed system**:
1. **Frontend & Application Gateway Layer:** Next.js 14/15 App Router delivering server-rendered and static web pages, UI interactions, client sessions, and Edge API route handlers.
2. **Realtime Communication Gateway:** Standalone Socket.io Node.js server (`apps/websocket`) handling real-time audio streams, live interview signaling, and token generation.
3. **High-Performance Document Compilation Microservice:** Dedicated Fastify + Tectonic engine (`services/resume-latex-service`) deployed on ARM64 Linux containers for sub-second, sandboxed LaTeX-to-PDF compilation.
4. **Data Persistence & Caching Tier:** PostgreSQL 16 hosted on Supabase (accessed via Prisma ORM 6.19 with PgBouncer connection pooling) and Upstash Serverless Redis 7 for distributed rate limiting, caching, and background BullMQ job coordination.
5. **Cloud Storage Tier:** AWS S3 (`ap-south-1`) with SSE-S3 AES-256 server-side encryption and presigned download/upload URLs for resumes and binary assets.
6. **Multi-Model AI Hierarchy:** 3-tier fallback routing across Groq (Llama/GPT-OSS), OpenRouter (Qwen/DeepSeek/Llama), Google Gemini (Gemini 2.5 Flash), and Sarvam AI (Indic speech & voice).

### 1.3 Deployment Model
- **Edge Web App:** Vercel Global Edge CDN serving canonical domain `https://www.resume-buddy.tech`.
- **Backend Microservices:** AWS EC2 Graviton ARM64 (`t4g.small`, Elastic IP `13.207.140.19`) fronted by Nginx reverse proxy with SSL termination at `https://api.resume-buddy.tech`.
- **Containers:** Multi-stage Docker containers for Web, WebSocket, and LaTeX services.

### 1.4 Maturity Assessment
- **Codebase Maturity:** **8.5 / 10** (Robust modular packages, extensive TypeScript types, multi-tier fallback patterns, comprehensive E2E test suites).
- **CI/CD Maturity:** **3.5 / 10** (Single basic WebSocket deployment action exists; automated CI testing, lint gates, container registries, and automated EC2 Graviton deployment workflows are missing).

---

# 2. Repository Structure

### 2.1 Repository Type
**Monorepo** managed with `pnpm` workspaces (`pnpm-workspace.yaml`) and Turborepo (`turbo.json`), alongside root npm lockfile support.

### 2.2 Directory Hierarchy Tree

```text
d:\Resume_Buddy_v3\
├── .agents/                        # Specialized IDE & AI agent tools
├── .github/                        # GitHub Actions CI/CD workflows and instructions
│   └── workflows/
│       └── deploy-websocket.yml    # WebSocket deployment pipeline to Vercel
├── apps/                           # Monorepo standalone application packages
│   ├── video/                      # Video interview recording and media processing
│   └── websocket/                  # Standalone Socket.io real-time server & Dockerfile
├── packages/                       # Shared internal monorepo library packages
│   ├── auth/                       # Centralized JWT, OTP, and session management
│   ├── database/                   # Prisma ORM schema (schema.prisma) and DB client
│   ├── queue/                      # BullMQ background worker definitions
│   ├── shared/                     # Shared TypeScript contracts, DTOs, and schemas
│   └── storage/                    # Unified AWS S3 / MinIO storage adapter
├── services/                       # Standalone backend microservices
│   └── resume-latex-service/       # Fastify + Tectonic LaTeX compilation microservice
├── src/                            # Main Next.js 14/15 App Router codebase
│   ├── ai/                         # Smart router, token estimators, and AI providers
│   ├── app/                        # Next.js App Router (Pages, Layouts, API Routes)
│   ├── components/                 # UI components (Radix primitives, Tailwind, Monaco)
│   ├── contexts/                   # React context providers
│   ├── hooks/                      # Custom React UI hooks
│   ├── lib/                        # Server utilities, DB clients, rate limiters
│   └── types/                      # Domain and API TypeScript definitions
├── infrastructure/                 # Infrastructure and container orchestration
│   ├── docker/                     # Dockerfiles (Web, WS), Compose files, Nginx configs
│   └── scripts/                    # Deployment, setup, and backup automation scripts
├── scripts/                        # Operational automation and E2E verification suites
├── tests/                          # Automated test suites
│   ├── api/                        # Next.js API route integration tests
│   ├── auth/                       # JWT, OTP, and password security unit tests
│   ├── business/                   # Rate limiting, subscription, and business logic
│   ├── e2e/                        # End-to-end user journey workflows
│   ├── performance/                # Load and stress test scenarios
│   └── storage/                    # S3 / MinIO object storage tests
├── docs/                           # Architecture specs, deployment guides, audit reports
├── public/                         # Static web assets (SVG icons, templates, images)
├── next.config.mjs                 # Next.js compilation, headers, and bundle optimization
├── package.json                    # Monorepo root dependencies and run scripts
├── pnpm-workspace.yaml             # Workspace definition across apps, packages, services
├── turbo.json                      # Turborepo task pipeline and caching rules
└── vitest.config.ts                # Vitest unit and integration test runner config
```

---

# 3. Technology Stack

| Layer | Component | Version / Identifier | Source Evidence |
|:---|:---|:---|:---|
| **Frontend Framework** | Next.js (App Router) | `14.2+ / 16.0.10` | [`package.json`](file:///d:/Resume_Buddy_v3/package.json#L102) |
| **UI Library & React** | React & React DOM | `19.2.3` | [`package.json`](file:///d:/Resume_Buddy_v3/package.json#L107-L109) |
| **Component Primitives** | Radix UI / Shadcn UI | `@radix-ui/react-*` | [`package.json`](file:///d:/Resume_Buddy_v3/package.json#L51-L70) |
| **Styling & Animations** | Tailwind CSS & Framer Motion | Tailwind `3.4.1`, Framer `12.23` | [`package.json`](file:///d:/Resume_Buddy_v3/package.json#L89) |
| **Code Editor** | Monaco Editor | `@monaco-editor/react 4.7.0` | [`package.json`](file:///d:/Resume_Buddy_v3/package.json#L49) |
| **Backend API Layer** | Next.js Route Handlers / Actions | Node.js Runtime | [`src/app/api/`](file:///d:/Resume_Buddy_v3/src/app/api) |
| **LaTeX Microservice** | Fastify + Tectonic Engine | Fastify `4.26`, Tectonic `0.15.0` | [`services/resume-latex-service/package.json`](file:///d:/Resume_Buddy_v3/services/resume-latex-service/package.json) |
| **Realtime Service** | Socket.io Server | Socket.io `4.8.3` | [`apps/websocket/package.json`](file:///d:/Resume_Buddy_v3/apps/websocket/package.json) |
| **Primary Database** | PostgreSQL 16 (Supabase) | Supabase Pooler (PgBouncer) | [`.env.production`](file:///d:/Resume_Buddy_v3/.env.production) |
| **ORM / Data Access** | Prisma ORM | `6.19.2` | [`packages/database/prisma/schema.prisma`](file:///d:/Resume_Buddy_v3/packages/database/prisma/schema.prisma) |
| **Distributed Cache & Queues** | Upstash Redis 7 / BullMQ | `ioredis 5.9.3`, `bullmq 5.52.2` | [`package.json`](file:///d:/Resume_Buddy_v3/package.json#L79-L94) |
| **Cloud Object Storage** | AWS S3 (`ap-south-1`) | `@aws-sdk/client-s3 3.1121.0` | [`packages/storage/src/index.ts`](file:///d:/Resume_Buddy_v3/packages/storage/src/index.ts) |
| **Authentication** | JWT (Stateless) + Refresh Sessions | `jose 6.1.3`, `bcryptjs 3.0.3` | [`packages/auth/src/index.ts`](file:///d:/Resume_Buddy_v3/packages/auth/src/index.ts) |
| **AI LLM Routing** | Groq, OpenRouter, Gemini, Sarvam | Groq SDK `0.37.0`, Google Genkit | [`src/ai/smart-router.ts`](file:///d:/Resume_Buddy_v3/src/ai/smart-router.ts) |
| **Payment Gateway** | Razorpay Live API | REST API (`rzp_live_*`) | [`src/app/api/payments/`](file:///d:/Resume_Buddy_v3/src/app/api/payments) |
| **Email & SMS** | Resend API + Twilio | `resend 6.9.2`, Twilio REST | [`src/lib/email/`](file:///d:/Resume_Buddy_v3/src/lib/email) |
| **Node Version** | Node.js LTS | `v20.x` / `v22.x` | [`.nvmrc` / Dockerfiles] |
| **Package Manager** | `pnpm` / `npm` | `pnpm 9+`, `npm 10+` | [`pnpm-workspace.yaml`](file:///d:/Resume_Buddy_v3/pnpm-workspace.yaml) |

---

# 4. Dependencies

### 4.1 Critical Production Dependencies
- **Data & Storage:** `@prisma/client` (`6.19.2`), `@aws-sdk/client-s3` (`^3.1121.0`), `@aws-sdk/s3-request-presigner` (`^3.1121.0`), `ioredis` (`^5.9.3`), `bullmq` (`^5.52.2`).
- **Authentication & Security:** `jose` (`^6.1.3`), `bcryptjs` (`^3.0.3`), `zod` (`^3.25.76`).
- **AI & Integrations:** `groq-sdk` (`^0.37.0`), `genkit` (`1.19.3`), `@genkit-ai/googleai` (`1.19.3`), `resend` (`^6.9.2`).
- **Document & PDF Processing:** `docx` (`^8.5.0`), `jspdf` (`^3.0.3`), `html2canvas` (`^1.4.1`), `pdf-parse-fork` (`^1.2.0`), `mammoth` (`^1.8.0`).
- **UI & Visualization:** `framer-motion` (`^12.23.22`), `lucide-react` (`^0.561.0`), `recharts` (`^2.12.7`), `@monaco-editor/react` (`^4.7.0`).

### 4.2 Development Dependencies
- **Build & Monorepo Tooling:** `turbo` (`^2.5.4`), `typescript` (`^5`), `@next/bundle-analyzer` (`^15.5.4`), `postcss` (`^8`), `tailwindcss` (`^3.4.1`), `cssnano` (`^7.1.1`).
- **Testing & Coverage:** `vitest` (`^4.0.18`), `@vitest/coverage-v8` (`^4.0.18`), `canvas` (`^3.2.1`), `pdf2pic` (`^3.2.0`).

### 4.3 Outdated / Peer Dependency Notes
> [!WARNING]
> The root `package.json` specifies `"react": "^19.2.3"` alongside `"next": "^16.0.10"`. Several third-party dependencies (`react-dropzone`, `@hookform/resolvers`) expect React 18 peer compatibility. All build scripts and Dockerfiles must use `npm install --legacy-peer-deps` or `pnpm install` with appropriate peer dependency overrides to avoid CI lockfile validation failures.

---

# 5. Build Process

### 5.1 Build Commands Matrix

| Component | Target Directory | Build Command | Output Artifact |
|:---|:---|:---|:---|
| **Next.js Web Frontend** | Root (`/`) | `npm run db:generate && next build --webpack` | `.next/standalone`, `.next/static`, `public` |
| **Vercel Build** | Root (`/`) | `npm run build:vercel` | Vercel Edge Serverless Functions |
| **LaTeX Microservice** | `services/resume-latex-service` | `npm run build` | `dist/index.js`, `dist/` |
| **WebSocket Service** | `apps/websocket` | `npm run build` | `dist/server.js`, `dist/` |
| **Prisma ORM Client** | `packages/database` | `npm run db:generate` | `node_modules/@prisma/client` |

### 5.2 Build Artifact Lifecycle
- **Standalone Web Server:** When `output: 'standalone'` is triggered (in non-Vercel environments), Next.js packages the entire server and minimal `node_modules` into `.next/standalone/server.js`.
- **LaTeX Engine:** Compiles TypeScript into CommonJS/ESM in `dist/` and runs with prewarmed Tectonic binary.

---

# 6. Testing

### 6.1 Test Framework & Execution
- **Test Runner:** Vitest v4.0.18 configured via [`vitest.config.ts`](file:///d:/Resume_Buddy_v3/vitest.config.ts).
- **Environment:** `node` test environment with global assertion injection.
- **Coverage Engine:** `@vitest/coverage-v8` outputting HTML, JSON, and text reports.

### 6.2 Test Suites Breakdown

| Test Suite | Path | Purpose |
|:---|:---|:---|
| **API Route Tests** | `tests/api/` | Verifies Next.js authentication & resume generation route handlers |
| **Auth Security Tests** | `tests/auth/` | Validates JWT verification, token expiration, OTP hashing, password salt |
| **Business Logic Tests** | `tests/business/` | Tests rate limiting calculations, token estimation, subscription logic |
| **Storage Lifecycle Tests**| `tests/storage/` | Probes S3 bucket creation, presigned URLs, and buffer verification |
| **E2E User Journey** | `tests/e2e/` | Simulates multi-step registration, resume upload, and compile flows |
| **Performance Tests** | `tests/performance/`| Concurrency and load thresholds |

### 6.3 Test Execution Commands
```bash
# Run all unit and integration tests
npm run test

# Run tests with code coverage report
npm run test:coverage

# Run dedicated phase test scripts
npx tsx scripts/test_production_e2e.ts
```

---

# 7. Code Quality

### 7.1 Linting & Type Checking
- **Linting:** `next lint` (configured with Next.js core ESLint rules).
- **Type Checking:** `tsc --noEmit` (`npm run typecheck`).
- **Formatting:** Prettier / PostCSS formatting.

### 7.2 Strictness & CI Gates
- In [`next.config.mjs`](file:///d:/Resume_Buddy_v3/next.config.mjs#L16-L18), `typescript: { ignoreBuildErrors: true }` is enabled for fast development builds.
- **Recommendation for CI:** The CI pipeline **must enforce** an explicit `npm run typecheck` step before building to guarantee 100% type safety on pull requests.

---

# 8. Docker

### 8.1 Docker Images Summary

| Dockerfile | Base Image | Target Application | Architecture |
|:---|:---|:---|:---|
| [`infrastructure/docker/Dockerfile.web`](file:///d:/Resume_Buddy_v3/infrastructure/docker/Dockerfile.web) | `node:20-alpine` | Next.js Standalone App | `linux/amd64`, `linux/arm64` |
| [`services/resume-latex-service/Dockerfile`](file:///d:/Resume_Buddy_v3/services/resume-latex-service/Dockerfile) | `node:20-slim` | Fastify + Tectonic Engine | `linux/arm64` (Graviton), `linux/amd64` |
| [`apps/websocket/Dockerfile`](file:///d:/Resume_Buddy_v3/apps/websocket/Dockerfile) | `node:20-alpine` | Standalone Socket.io Gateway | `linux/amd64`, `linux/arm64` |

### 8.2 Multi-Stage Docker Optimizations
- **Non-Root Execution:** Containers run under dedicated unprivileged users (`nextjs:nodejs`, `latex:latex`, `wsuser:nodejs`).
- **Prewarmed LaTeX Binary:** Tectonic downloads and caches standard CTAN LaTeX packages during Docker image build (`/home/latex/.cache/Tectonic`), reducing runtime cold starts from ~4s to ~80ms.
- **Resource Limits:** Docker Compose configs define strict CPU and RAM thresholds (`mem_limit: 500M`, `cpus: "1.2"` for LaTeX service).

---

# 9. Infrastructure

### 9.1 Hosting & Compute Infrastructure

```text
                                Namify DNS (manage.get.tech)
                                             │
               ┌─────────────────────────────┴─────────────────────────────┐
               ▼                                                           ▼
    resume-buddy.tech / www                                     api.resume-buddy.tech
       (Vercel Edge CDN)                                      (AWS Elastic IP: 13.207.140.19)
               │                                                           │
               ▼                                                           ▼
   Next.js 14 Web Application                                   Nginx Reverse Proxy (EC2)
 (SSR / ISR / API Routes / UI)                              ├── /v1/resume/latex/compile ➔ Port 8080
                                                            └── /socket.io/             ➔ Port 3001
```

- **Cloud Provider:** AWS (`ap-south-1` Mumbai region).
- **Compute Instance:** EC2 ARM64 Graviton (`i-0a7b170d82c9c9d23`, t4g.small, Ubuntu 24.04).
- **Reverse Proxy:** Nginx with Let's Encrypt automated ACME SSL certificate.
- **Frontend CDN:** Vercel Edge Network.

---

# 10. Deployment

### 10.1 Current Deployment Mechanisms
1. **Frontend:** Deployed automatically via Vercel GitHub integration upon push to `main`.
2. **WebSocket Microservice:** Deployed via GitHub Actions workflow `.github/workflows/deploy-websocket.yml` to Vercel/EC2.
3. **AWS Graviton EC2 Microservices:** Provisioned and managed via Docker Compose (`infrastructure/docker/docker-compose.prod.yml`) and auto-healing Systemd service `resumebuddy.service`.

---

# 11. Git Strategy

- **Primary Trunk Branch:** `main`
- **Active Release Strategy:** Continuous Deployment from `main` to staging/production.
- **Recommended Branching Model:**
  - `main`: Protected branch representing production-ready code.
  - `feature/*`: Short-lived branches for feature development.
  - `fix/*`: Bug fixes and patch releases.
  - `hotfix/*`: Production critical interventions.

---

# 12. Environments

| Environment | Purpose | Hosting | Configuration Source |
|:---|:---|:---|:---|
| **Local** | Developer workstation | `localhost:9002`, `localhost:8080`, `localhost:3001` | `.env`, `.env.local` |
| **Preview / Staging** | Pull Request Previews | Vercel Preview Deployments | Vercel Environment Variables |
| **Production** | Live Public Traffic | Vercel Edge (`www`) + AWS Graviton (`api`) | `.env.production`, GitHub Secrets |

---

# 13. Database

### 13.1 Schema & Migrations
- **Engine:** PostgreSQL 16 (Supabase hosted).
- **ORM:** Prisma 6.19.2 ([`packages/database/prisma/schema.prisma`](file:///d:/Resume_Buddy_v3/packages/database/prisma/schema.prisma)).
- **Connection Model:**
  - **Transaction Pooler (PgBouncer - Port 6543):** `DATABASE_URL=postgresql://...?pgbouncer=true` (Used by Next.js Serverless runtime).
  - **Direct Session Connection (Port 5432):** `DIRECT_URL=postgresql://...:5432/postgres` (Used by Prisma schema migrations).
- **Migration Commands:**
  ```bash
  # Apply migrations in CI/CD production deployment
  npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

  # Generate fresh client bindings
  npx prisma generate --schema=packages/database/prisma/schema.prisma
  ```

---

# 14. Security

### 14.1 Authentication & Secrets
- **Tokens:** Stateless JSON Web Tokens (`jose` library) signed with minimum 256-bit `JWT_SECRET`.
- **Password Security:** Salted BCrypt hashing (`bcryptjs`) with 12 salt rounds.
- **Storage Security:** AWS S3 bucket `resumebuddy-storage-277352717671` enforces **Block All Public Access** and **AES-256 Server-Side Encryption**. Access is restricted strictly to presigned time-limited URLs (TTL: 900s).
- **Codebase Secrets:** Sanitized — all production credentials are authenticated via environment variables.

---

# 15. Observability

- **Health Endpoints:**
  - Next.js Web: `GET /api/health` (Probes DB, Redis, and S3).
  - Metrics Engine: `GET /api/metrics` (System SLA, memory, latency).
  - LaTeX Engine: `GET /healthz` (Port 8080).
  - WebSocket: `GET /healthz` (Port 3001).
- **Logging:** Fastify structured logging with log level control (`LOG_LEVEL=warn` in production).
- **Real-User Monitoring:** `@vercel/analytics` and `@vercel/speed-insights`.

---

# 16. Performance

- **Prewarmed LaTeX Compilation:** Reduces Tectonic compilation from 4.4s cold to **82ms warm**.
- **Edge Static Caching:** Next.js `staleTimes: { dynamic: 30, static: 300 }` keeps prefetched routes fresh.
- **Serverless Redis Caching:** Upstash Redis latency under **550ms** globally.
- **Virtual S3 Uploads:** Client direct-to-S3 upload via presigned PUT URLs bypasses Next.js server memory buffers.

---

# 17. External Services

| Service | Category | Endpoint / Role |
|:---|:---|:---|
| **AWS S3** | Object Storage | Resume PDF/DOCX storage (`ap-south-1`) |
| **AWS EC2 Graviton** | Microservices Compute | ARM64 Ubuntu instance hosting LaTeX & WS |
| **Supabase** | Managed PostgreSQL | User data, resumes, subscriptions, logs |
| **Upstash** | Serverless Redis | Rate limiting, cache, BullMQ queues |
| **Groq Cloud** | Primary AI LLM | High-speed Llama-3.3 / GPT-OSS inference |
| **OpenRouter** | Secondary AI LLM | Qwen 2.5/3.6, Llama, DeepSeek models |
| **Google Gemini** | Fallback AI LLM | Gemini 2.5 Flash fallback |
| **Sarvam AI** | Indic Voice AI | Indian English speech and interview evaluation |
| **Resend** | Transactional Email | Email verification, password reset |
| **Twilio** | SMS / WhatsApp | Phone verification, WhatsApp notifications |
| **Razorpay** | Payment Gateway | Subscription checkout and webhooks |
| **Namify Domains** | DNS Registrar | Apex, www, and api DNS records |

---

# 18. Required Environment Variables

| Variable Name | Required | Description | Consuming Component |
|:---|:---:|:---|:---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection URL with `?pgbouncer=true` | Next.js API, Prisma Client |
| `DIRECT_URL` | **Yes** | Direct PostgreSQL connection URL (Port 5432) | Prisma Migrations in CI |
| `REDIS_URL` | **Yes** | Upstash Redis connection string (`rediss://...`) | Rate limiter, Cache, WS |
| `REDIS_PASSWORD` | **Yes** | Redis authentication password | Upstash Redis Client |
| `STORAGE_PROVIDER` | **Yes** | `s3` or `minio` | `@resumebuddy/storage` |
| `AWS_REGION` | **Yes** | AWS Region (`ap-south-1`) | AWS SDK S3 |
| `AWS_S3_BUCKET` | **Yes** | S3 bucket name (`resumebuddy-storage-...`) | AWS SDK S3 |
| `AWS_ACCESS_KEY_ID` | **Yes** | IAM User Access Key ID | AWS SDK S3 |
| `AWS_SECRET_ACCESS_KEY` | **Yes** | IAM User Secret Access Key | AWS SDK S3 |
| `LATEX_SERVICE_URL` | **Yes** | LaTeX API (`https://api.resume-buddy.tech`) | Next.js Resume PDF compiler |
| `WEBSOCKET_URL` | **Yes** | WS Endpoint (`https://api.resume-buddy.tech`) | Server-side WS events |
| `NEXT_PUBLIC_WEBSOCKET_URL`| **Yes** | Client WS Endpoint (`https://api.resume-buddy.tech`)| Browser client socket |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Web Domain (`https://www.resume-buddy.tech`) | Next.js Auth, CORS, Emails |
| `JWT_SECRET` | **Yes** | Secret string (min 32 chars) for JWT signing | `@resumebuddy/auth` |
| `JWT_REFRESH_SECRET` | **Yes** | Secret string for session refresh tokens | `@resumebuddy/auth` |
| `GROQ_API_KEY` | **Yes** | Groq Cloud API Key | Smart AI Router |
| `GOOGLE_API_KEY` | **Yes** | Google Gemini API Key | Gemini 2.5 Flash Fallback |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter API Key | Qwen / Llama Models |
| `SARVAM_API_KEY` | Optional| Sarvam AI API Key | Indic Voice Interviews |
| `RESEND_API_KEY` | **Yes** | Resend Transactional Email API Key | Email Notification Service |
| `EMAIL_FROM` | **Yes** | Sender email address (`noreply@...`) | Resend Email Service |
| `TWILIO_ACCOUNT_SID` | Optional| Twilio Account SID | SMS / WhatsApp OTP |
| `TWILIO_AUTH_TOKEN` | Optional| Twilio Auth Token | SMS / WhatsApp OTP |
| `RAZORPAY_KEY_ID` | **Yes** | Razorpay Live Key ID | Payment API Routes |
| `RAZORPAY_KEY_SECRET` | **Yes** | Razorpay Live Key Secret | Payment Verification |

---

# 19. Existing CI/CD

### 19.1 Existing Workflows
- **File:** [`.github/workflows/deploy-websocket.yml`](file:///d:/Resume_Buddy_v3/.github/workflows/deploy-websocket.yml)
- **Trigger:** Push to `main` with changes in `apps/websocket/**` or manual `workflow_dispatch`.
- **Action:** Builds WebSocket project and deploys to Vercel via Vercel CLI, followed by a curl smoke test.

### 19.2 Identified Gaps in Current Setup
1. No automated CI pipeline executing `tsc --noEmit`, `npm run lint`, or Vitest test suites on Pull Requests.
2. No automated Docker image build or push to Amazon ECR / GitHub Container Registry (GHCR).
3. No automated deployment pipeline for the ARM64 Graviton LaTeX microservice.
4. No automated Prisma migration execution in CI before frontend deployments.
5. No dependency vulnerability scanning or secret leak detection gates.

---

# 20. Recommended Production GitHub Actions Pipeline

To achieve enterprise-grade continuous delivery, the following four GitHub Actions workflows are recommended:

### 20.1 Workflow 1: Pull Request Continuous Integration (`.github/workflows/ci.yml`)

```yaml
name: CI Quality Gate

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-typecheck-test:
    name: Lint, Typecheck & Vitest
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci --legacy-peer-deps

      - name: Generate Prisma Client
        run: npx prisma generate --schema=packages/database/prisma/schema.prisma

      - name: Run Typecheck
        run: npm run typecheck

      - name: Run ESLint
        run: npm run lint

      - name: Run Vitest Suite with Coverage
        run: npm run test:coverage
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test' }}
          JWT_SECRET: "test-secret-32-chars-at-least-super-safe"
          STORAGE_PROVIDER: "s3"
          AWS_REGION: "ap-south-1"
          AWS_S3_BUCKET: "test-bucket"
```

> **Note on Frontend Deployment:** Next.js Web Frontend continuous deployment is natively and automatically handled by **Vercel Native Git Integration** on every push to `main` (along with automatic ephemeral preview environments for Pull Requests). No manual GitHub Action is needed for frontend builds.

### 20.2 Workflow 2: AWS Graviton ARM64 Backend Microservices Deploy (`.github/workflows/deploy-backend.yml`)

```yaml
name: Deploy AWS Backend Microservices

on:
  push:
    branches: [main]
    paths:
      - 'services/resume-latex-service/**'
      - 'apps/websocket/**'
      - 'infrastructure/docker/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy-ec2:
    name: Build & Deploy to AWS EC2 Graviton
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Deploy to AWS EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }} # 13.207.140.19
          username: ubuntu
          key: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
          script: |
            cd /opt/resumebuddy
            git fetch origin main
            git reset --hard origin/main
            docker compose -f infrastructure/docker/docker-compose.prod.yml build --parallel
            docker compose -f infrastructure/docker/docker-compose.prod.yml up -d
            systemctl reload nginx

      - name: Microservices Smoke Test
        run: |
          LATEX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${{ secrets.EC2_HOST }}/healthz" || echo "000")
          echo "LaTeX Microservice Health: $LATEX_STATUS"
          if [ "$LATEX_STATUS" != "200" ]; then
            echo "❌ LaTeX health probe failed" && exit 1
          fi
          echo "✅ Backend Microservices are healthy!"
```

### 20.3 Workflow 3: Automated Security & CodeQL Vulnerability Scanning (`.github/workflows/security-scan.yml`)

```yaml
name: Security & Vulnerability Scan

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday midnight
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  codeql-and-trivy:
    name: CodeQL & Container Audit
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy Scan Results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
```

---

# 21. Missing Items

| Priority | Area | Reason | Recommendation |
|:---:|:---|:---|:---|
| **P0** | **CI Test & Lint Action** | Pull requests currently merge directly without automated test or typecheck verification. | Create `.github/workflows/ci.yml` gating PR merges on `npm run typecheck`, `npm run lint`, and `vitest run`. |
| **P0** | **EC2 Deploy Pipeline** | AWS EC2 Graviton microservices must be manually pulled and rebuilt via terminal. | Implement `.github/workflows/deploy-backend.yml` via SSH or AWS SSM Agent. |
| **P1** | **Database Migration Automation** | DB schema changes must be applied manually before code deployment. | Add `prisma migrate deploy` job in CI pipeline before triggering Vercel build. |
| **P1** | **Security Scanning** | Dependencies and Docker base images lack automated vulnerability scans. | Integrate GitHub CodeQL and Trivy container scan workflows. |
| **P2** | **Multi-Arch Container Registry** | Images are built on the target EC2 machine rather than pulled prebuilt. | Setup GitHub Packages (GHCR) with `docker/build-push-action` supporting `linux/arm64`. |

---

# 22. Risks

### 22.1 Security Risks
- **Risk:** Unauthenticated health endpoints exposing internal database metrics.  
  *Mitigation:* Mask detailed internal infrastructure logs on public `/api/metrics` routes.
- **Risk:** Accidental secret commits in pull requests.  
  *Mitigation:* Enforce `trufflehog` or GitHub Secret Scanning on all branches.

### 22.2 Deployment & Scaling Risks
- **Risk:** Monolithic build failure on React 19 / Next 16 peer dependencies.  
  *Mitigation:* Lock package manager resolution with `--legacy-peer-deps` or pnpm overrides.
- **Risk:** Graviton EC2 single-point-of-failure for LaTeX PDF generation.  
  *Mitigation:* Add AWS Auto-Scaling Group (ASG) or AWS ECS Fargate ARM64 behind an Application Load Balancer (ALB) when traffic exceeds 5,000 daily compilations.

---

# 23. Final Recommendations

### 23.1 Phased Implementation Roadmap
1. **Immediate (Day 1):**
   - Commit `.github/workflows/ci.yml` to gate all future PRs.
   - Configure GitHub repository secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `EC2_HOST`, `EC2_SSH_PRIVATE_KEY`).
2. **Medium-Term (Week 1–2):**
   - Setup `.github/workflows/deploy-backend.yml` to automatically update the Graviton EC2 instance on git push.
   - Add automated `prisma migrate deploy` step to the deployment pipeline.
3. **Long-Term (Month 1):**
   - Transition EC2 single instance into AWS ECS Fargate ARM64 cluster for zero-downtime auto-scaling.
   - Configure automated Rollback triggers based on Sentry/Datadog error rate anomalies.

### 23.2 Architecture Metrics Summary
- **Current CI/CD Maturity Score:** **3.5 / 10** ➔ **Target with Proposed Workflows: 9.0 / 10**
- **Production Readiness Score:** **8.5 / 10**
- **Deployment Complexity:** **Medium** (Standard Next.js edge deployment + single ARM64 container host).
