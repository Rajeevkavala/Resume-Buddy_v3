# ResumeBuddy v3 — Hybrid Deployment Guide: Vercel Frontend + AWS Graviton Backend + Upstash Redis
**Production Guide: Vercel (Next.js Frontend & Serverless APIs) + AWS EC2 Graviton (LaTeX & WebSocket Microservices) + Upstash Redis Free Tier + Supabase PostgreSQL**  

**Target Domains & Service Endpoints:**
* **Frontend Web App (Vercel):** [`https://www.resume-buddy.tech`](https://www.resume-buddy.tech) & `https://resume-buddy.tech`  
* **Backend Services (AWS EC2 Graviton):** [`https://api.resume-buddy.tech`](https://api.resume-buddy.tech) & `wss://api.resume-buddy.tech` (or `ws.resume-buddy.tech`)

**Verified Production Services:**
* **Vercel Project:** `resume-buddy-v3` (`prj_2cKLtBFf8bzUTnz14wezeE41jE4W`) | Account: `rajeevkavala`
* **Upstash Redis DB:** `Resume Buddy` (`dcae4566-9aca-4597-8f40-3e706dce4789`) | Endpoint: `equal-snake-38143.upstash.io:6379` | TLS Enabled

---

## Table of Contents

1. [Architecture Overview & Hybrid Topology](#1-architecture-overview--hybrid-topology)
2. [User Capacity & Workload Math](#2-user-capacity--workload-math)
   - [2.1 Capacity Matrix & Tier Breakdown](#21-capacity-matrix--tier-breakdown)
   - [2.2 Upstash Redis Free Tier Command Budgeting (10k cmd/day)](#22-upstash-redis-free-tier-command-budgeting-10k-cmdday)
   - [2.3 LaTeX Compilation & WebSocket Concurrency Limits](#23-latex-compilation--websocket-concurrency-limits)
3. [Comprehensive Monthly Cost Breakdown ($0 – $12/mo)](#3-comprehensive-monthly-cost-breakdown-0--12mo)
4. [Critical Integration Conflicts & How to Prevent Them](#4-critical-integration-conflicts--how-to-prevent-them)
   - [4.1 Google Cloud Console OAuth 2.0 Setup & Conflict Matrix](#41-google-cloud-console-oauth-20-setup--conflict-matrix)
   - [4.2 CORS & Cross-Origin Communication (Vercel ↔ AWS EC2)](#42-cors--cross-origin-communication-vercel--aws-ec2)
   - [4.3 Authentication Cookies vs Subdomain Scoping](#43-authentication-cookies-vs-subdomain-scoping)
   - [4.4 Content Security Policy (CSP) & Middleware Whitelisting](#44-content-security-policy-csp--middleware-whitelisting)
   - [4.5 Database Connection Starvation & PgBouncer Pooling](#45-database-connection-starvation--pgbouncer-pooling)
5. [Step 1: Upstash Serverless Redis Configuration & CLI Sync](#5-step-1-upstash-serverless-redis-configuration--cli-sync)
6. [Step 2: Database Setup (Supabase PostgreSQL Free Tier)](#6-step-2-database-setup-supabase-postgresql-free-tier)
7. [Step 3: Google Cloud Console OAuth 2.0 Configuration](#7-step-3-google-cloud-console-oauth-20-configuration)
8. [Step 4: Vercel Frontend Configuration & Environment Sync (`resume-buddy-v3`)](#8-step-4-vercel-frontend-configuration--environment-sync-resume-buddy-v3)
9. [Step 5: Provision AWS EC2 Graviton Instance (Backend Microservices)](#9-step-5-provision-aws-ec2-graviton-instance-backend-microservices)
10. [Step 6: Server OS Bootstrap & Swap Space Setup](#10-step-6-server-os-bootstrap--swap-space-setup)
11. [Step 7: AWS Docker Compose Configuration (LaTeX + WebSocket)](#11-step-7-aws-docker-compose-configuration-latex--websocket)
12. [Step 8: Production Nginx Reverse Proxy & Let's Encrypt SSL on AWS](#12-step-8-production-nginx-reverse-proxy--lets-encrypt-ssl-on-aws)
13. [Step 9: Domain & DNS Record Setup (`resume-buddy.tech` & `api.resume-buddy.tech`)](#13-step-9-domain--dns-record-setup-resume-buddytech--apiresume-buddytech)
14. [Step 10: Auto-Healing Systemd Service & Automated Deployments](#14-step-10-auto-healing-systemd-service--automated-deployments)
15. [Step 11: End-to-End Verification & Health Checks](#15-step-11-end-to-end-verification--health-checks)
16. [Troubleshooting & Operator Runbook](#16-troubleshooting--operator-runbook)

---

## 1. Architecture Overview & Hybrid Topology

In this production-ready hybrid architecture, workloads are distributed according to their ideal compute model:

1. **Frontend & Next.js Full-Stack App on Vercel (`resume-buddy-v3` / `prj_2cKLtBFf8bzUTnz14wezeE41jE4W`):**
   * Global Edge Network delivering React 19 UI, Next.js Server Components (SSR), App Router API routes, Server Actions, and user authentication endpoints.
   * Auto-scaling, zero cold-start edge caching, and global CDN delivery.
2. **Backend Microservices on AWS EC2 Graviton (ARM64 `t4g.small`):**
   * **Tectonic LaTeX PDF Microservice (`resumebuddy-latex`):** Fastify microservice compiling raw LaTeX templates into pixel-perfect PDF resumes using native ARM64 Tectonic binary.
   * **Realtime WebSocket Server (`resumebuddy-ws`):** Socket.io stateful server managing Live AI Voice Mock Interviews, bidirectional speech chunks, and push notifications.
   * **Nginx Reverse Proxy:** Terminating SSL for `https://api.resume-buddy.tech`, managing CORS preflights, and forwarding WebSocket upgrades.
3. **Serverless Free-Tier Data Layer:**
   * **Upstash Redis (`Resume Buddy` / `equal-snake-38143.upstash.io`):** Central serverless Redis cluster handling auth sessions, rate limiting, and Socket.io pub/sub adapter.
   * **Supabase PostgreSQL:** Managed database with PgBouncer transaction connection pooler for serverless safety.

```
                                [ Users & Browsers ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
           HTTPS (Port 443)                             HTTPS / WSS (Port 443)
                 │                                               │
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │  Vercel Edge Network  │                       │  AWS EC2 Graviton     │
     │  www.resume-buddy.tech│                       │  api.resume-buddy.tech│
     │  (resume-buddy-v3)    │                       │  (t4g.small ARM64)    │
     │  ├── SSR & React 19   │                       │                       │
     │  ├── Auth Routes      │                       │  [ Nginx Proxy + SSL ]│
     │  ├── Payment Hooks    │                       │     │           │     │
     │  └── Server Actions   │                       │ :8080           │:3001│
     └───────────┬───────────┘                       │     ▼           ▼     │
                 │                                   │ [Tectonic]  [Socket.io│
                 │ (Direct REST / Webhooks)          │ [LaTeX]     [Realtime]│
                 ├───────────────────────────────────┼─────┘           │     │
                 │                                   └─────────┬───────┘     │
                 │                                             │             │
                 ├─────────────────────┬───────────────────────┤             │
                 │ TLS :6379           │ TLS :6543             │ TLS :6379   │
                 ▼                     ▼                       ▼             │
     ┌───────────────────────┐ ┌───────────────────────┐                     │
     │  Upstash Redis Free   │ │  Supabase PostgreSQL  │                     │
     │ (equal-snake-38143)   │ │  (Transaction Pooler) │                     │
     │  ├── User Sessions    │ │  ├── Users & Resumes  │                     │
     │  ├── Rate Limiters    │ │  ├── Payments & Plans │                     │
     │  └── Socket.io Adapter│ │  └── ATS Score Logs   │                     │
     └───────────────────────┘ └───────────────────────┘                     │
```

---

## 2. User Capacity & Workload Math

### 2.1 Capacity Matrix & Tier Breakdown

| Metric | Vercel Free / Pro | AWS EC2 `t4g.small` (Backend) | Combined Hybrid Capacity |
|---|---|---|---|
| **Hosting Cost** | **$0.00** (Hobby) or **$20/mo** | **$12.26 / mo** (Free with AWS trial credits) | **~$0.00 – $12.26 / mo** |
| **Total Registered Users** | Unlimited | 5,000+ active profiles | **5,000 – 15,000 users** |
| **Daily Active Users (DAU)** | 1,000 – 5,000 DAU | 500 – 1,200 DAU | **500 – 1,000 DAU** (Free Upstash limit) |
| **Concurrent Browsing Users** | 500+ simultaneous | N/A (Handled by Vercel Edge) | **500+ simultaneous users** |
| **Concurrent Live Voice WS Sessions** | N/A | **30 – 50 simultaneous voice sessions** | **30 – 50 voice interviews** |
| **LaTeX PDF Compilations** | N/A | **2 – 3 parallel / ~150 PDFs/hr** | **~150 compiled PDFs/hr** |
| **Page Load Speed (TTFB)** | **< 60ms** globally | N/A | **< 60ms worldwide** |

---

### 2.2 Upstash Redis Free Tier Command Budgeting (10k cmd/day)

Upstash Redis Free Tier offers **10,000 commands/day** and **256 MB storage**. In a hybrid architecture:

1. **Vercel Frontend Consumption:**
   * Session Check: ~1 `GET session:<id>` per authenticated dynamic page (mitigated by in-memory LRU caching on warm serverless lambdas).
   * Rate Limiting: 1 `INCR` + `EXPIRE` per API write request.
2. **AWS EC2 WebSocket Consumption:**
   * Socket.io Redis Adapter: ~2 commands on connect/disconnect, minimal during active room broadcasts.
3. **Capacity Math:**
   * Average active user generates **~12–18 Redis commands** across their session.
   * **10,000 commands ÷ 18 commands/user = ~550 Daily Active Users (DAU)** supported 100% inside the **$0.00 Free Tier**.
   * If usage spikes above 10k, Upstash Pay-As-You-Go is **$0.20 per 100,000 commands** (~$1.50/month for 2,500 DAU).

---

### 2.3 LaTeX Compilation & WebSocket Concurrency Limits

* **Tectonic Engine on ARM64 Graviton:** Compiles complex multi-page LaTeX resumes in **~650ms to 950ms**.
* **Memory footprint per compile:** ~90MB.
* **Concurrency limit on `t4g.small` (2GB RAM + 4GB Swap):** Max **2–3 parallel compiles** enforced by Fastify internal queue. Additional requests wait in queue for < 1.5s.
* **WebSocket Memory footprint:** ~150KB per active socket connection. 100 concurrent connections consume only ~15MB RAM.

---

## 3. Comprehensive Monthly Cost Breakdown ($0 – $12/mo)

| Infrastructure Component | Provider & Tier | Free Tier Allowance | Real Monthly Cost |
|---|---|---|---|
| **Frontend & Serverless APIs** | **Vercel** (Hobby Plan) | 100 GB Bandwidth, Edge Functions, SSL | **$0.00** |
| **Backend Microservices (LaTeX + WS)** | **AWS EC2** (`t4g.small` ARM64) | 750 hrs free trial / AWS credits | **$0.00 – $12.26** |
| **EBS Storage (Backend)** | AWS gp3 SSD (30 GB) | 30 GB Free Tier (12 Months) | **$0.00 – $2.40** |
| **Redis Cache & Queues** | **Upstash Redis** | 10,000 commands/day, 256 MB | **$0.00** |
| **Relational Database** | **Supabase** (PostgreSQL) | 500 MB DB, 2 vCPU shared pool | **$0.00** |
| **Object Storage (PDFs)** | **Amazon S3 / Cloudflare R2** | 10 GB free on R2 / 5 GB on S3 | **$0.00** |
| **SSL Certificates** | **Let's Encrypt / Vercel SSL** | Automatic Wildcard & Renewals | **$0.00** |
| **DNS & DDoS Protection** | **Cloudflare** (Free Plan) | Global Anycast DNS & Edge Shield | **$0.00** |
| **Transactional Email** | **Resend / Amazon SES** | 3,000 emails/month free | **$0.00** |
| **AI LLM Inference** | **Groq + Google Gemini API** | 14,400 Groq req/day + 1,500 Gemini/day | **$0.00** |
| **TOTAL ESTIMATED COST** | | | **~$0.00 to $12.26 / mo** |

---

## 4. Critical Integration Conflicts & How to Prevent Them

Deploying frontend on Vercel and backend services on AWS introduces cross-origin, authentication, cookie, and cloud provider constraints. **Read this section carefully before deployment.**

### 4.1 Google Cloud Console OAuth 2.0 Setup & Conflict Matrix

When users click **"Sign in with Google"** on Vercel (`www.resume-buddy.tech`), Google executes an OAuth 2.0 code exchange. Common failures and exact solutions:

```
[User Browser: www.resume-buddy.tech]
       │
       ├─ 1. Clicks "Continue with Google" -> calls /api/auth/google
       │     (Generates CSRF state cookie: oauth_state)
       │
       ├─ 2. Redirects to https://accounts.google.com/o/oauth2/v2/auth
       │     (Includes redirect_uri: https://www.resume-buddy.tech/api/auth/callback/google)
       │
       ├─ 3. Google verifies Authorized Redirect URI in Google Cloud Console
       │     ❌ CONFLICT: If URI does not match EXACTLY -> Error 400: redirect_uri_mismatch
       │
       ├─ 4. Google redirects browser back to Vercel with ?code=...&state=...
       │     (Vercel verifies state against oauth_state cookie)
       │     ❌ CONFLICT: If user navigated via apex (resume-buddy.tech) and redirected to www.,
       │                  cookie might be dropped unless Domain is scoped or 301 is enforced.
       │
       └─ 5. Vercel backend exchanges code for Google profile, creates Upstash Redis session,
             and sets authentication cookies (`rb_session`, `rb_refresh`).
```

#### Conflict 1: `redirect_uri_mismatch` (Google Error 400)
* **Cause:** The `redirectUri` generated in code (`${NEXT_PUBLIC_APP_URL}/api/auth/callback/google`) does not match the URI registered in Google Cloud Console byte-for-byte.
* **Fix:** In Google Cloud Console -> **APIs & Services** -> **Credentials** -> **OAuth 2.0 Client IDs**, register **all** variations:
  * `https://www.resume-buddy.tech/api/auth/callback/google`
  * `https://resume-buddy.tech/api/auth/callback/google`
  * `https://resume-buddy-v3.vercel.app/api/auth/callback/google`
  * `http://localhost:9002/api/auth/callback/google` (for local development)

#### Conflict 2: Authorized JavaScript Origins Rejection
* **Cause:** Trailing slashes or subpaths in Authorized JavaScript Origins.
* **Fix:** Origins must only contain protocol + hostname + port:
  * `https://www.resume-buddy.tech`
  * `https://resume-buddy.tech`
  * `https://resume-buddy-v3.vercel.app`
  * `http://localhost:9002`

#### Conflict 3: OAuth Consent Screen "Testing" vs "Production"
* **Cause:** If your Google OAuth Consent Screen is in **"Testing"** status, any user not explicitly added under "Test Users" receives `Error 403: access_denied` ("App is not verified").
* **Fix:**
  1. Go to Google Cloud Console -> **OAuth consent screen**.
  2. Click **Publish App** to switch status to **In Production**.
  3. Ensure required scopes are added:
     * `.../auth/userinfo.email`
     * `.../auth/userinfo.profile`
     * `openid`

#### Conflict 4: Missing Google Cloud Domain Verification
* **Cause:** Custom domains (`resume-buddy.tech`) used in Google OAuth consent screens must be verified in Google Search Console if requesting sensitive scopes.
* **Fix:** For basic profile/email scopes, non-sensitive verification is automatic. Verify domain ownership in [Google Search Console](https://search.google.com/search-console) via DNS TXT record for optimal delivery.

---

### 4.2 CORS & Cross-Origin Communication (Vercel ↔ AWS EC2)

Because the frontend is on `https://www.resume-buddy.tech` and the backend is on `https://api.resume-buddy.tech`:

1. **Browser Preflight (OPTIONS Requests):**
   * When Vercel frontend invokes the LaTeX compile API (`https://api.resume-buddy.tech/api/compile`), the browser sends an HTTP `OPTIONS` preflight.
   * AWS Nginx and Fastify must respond with `204 No Content` and the following headers:
     ```http
     Access-Control-Allow-Origin: https://www.resume-buddy.tech
     Access-Control-Allow-Methods: GET, POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
     Access-Control-Allow-Credentials: true
     Access-Control-Max-Age: 86400
     ```
2. **WebSocket Cross-Origin Handshake:**
   * Socket.io connections from Vercel to `wss://api.resume-buddy.tech/socket.io/` send `Origin: https://www.resume-buddy.tech`.
   * Socket.io server on AWS must explicitly allow `https://www.resume-buddy.tech` and `https://*.vercel.app`.

---

### 4.3 Authentication Cookies vs Subdomain Scoping

* **Vercel Auth Cookies (`rb_session`, `rb_refresh`):**
  * Set with `SameSite=Lax`, `Secure=true`, `HttpOnly=true`.
  * **Critical:** To allow API requests across subdomains without token header gymnastics:
    * Cookie domain can be left default (scoped to `www.resume-buddy.tech`) when Vercel API routes proxy requests, OR
    * Set `Domain=.resume-buddy.tech` if calling `api.resume-buddy.tech` directly from browser with `withCredentials: true`.
  * **Recommended Best Practice:** The frontend passes the JWT Access Token in the `Authorization: Bearer <token>` header or uses Next.js API route proxies to talk to AWS EC2 backend.

---

### 4.4 Content Security Policy (CSP) & Middleware Whitelisting

Your Next.js `middleware.ts` enforces strict CSP headers. If AWS backend or Google URLs are missing from `connect-src` or `frame-src`, the browser will block the network calls.

In `middleware.ts`, verify the `CSP_HEADER` contains your AWS EC2 domain:

```typescript
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob: https://lh3.googleusercontent.com",
  "connect-src 'self' https://accounts.google.com https://api.razorpay.com https://lumberjack.razorpay.com https://www.resume-buddy.tech https://resume-buddy-v3.vercel.app https://api.resume-buddy.tech wss://api.resume-buddy.tech",
  "frame-src https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "worker-src 'self' blob:"
].join('; ');
```

---

### 4.5 Database Connection Starvation & PgBouncer Pooling

* **The Problem:** Vercel serverless functions scale up to dozens of simultaneous lambdas during traffic surges. If each lambda opens a direct connection to PostgreSQL, the database exceeds its connection limit (Supabase free tier: max 60 direct connections), crashing the app (`FATAL: remaining connection slots are reserved`).
* **The Solution:**
  * In Vercel environment variables, set `DATABASE_URL` to Supabase **Transaction Connection Pooler** (Port `6543`, `?pgbouncer=true`).
  * Set `DIRECT_URL` to Port `5432` for running migrations from CLI.

---

## 5. Step 1: Upstash Serverless Redis Configuration & CLI Sync

Upstash serves as the central serverless Redis cluster handling auth sessions, rate limiting, and Socket.io pub/sub adapter.

### 5.1 Verified Upstash Database Configuration

* **Database Name:** `Resume Buddy`
* **Database ID:** `dcae4566-9aca-4597-8f40-3e706dce4789`
* **Endpoint:** `equal-snake-38143.upstash.io`
* **Port:** `6379`
* **TLS:** **Enabled** (`rediss://`)
* **Primary Region:** `ap-northeast-1`
* **Full Redis TLS Connection URL:**
  ```
  rediss://default:AZT_AAIncDFhYzAzODM2MTFjNDE0ZGU0ODI4MjU1ZTJmZWY0OWJkOHAxMzgxNDM@equal-snake-38143.upstash.io:6379
  ```
* **REST URL:** `https://equal-snake-38143.upstash.io`
* **REST Token:** `AZT_AAIncDFhYzAzODM2MTFjNDE0ZGU0ODI4MjU1ZTJmZWY0OWJkOHAxMzgxNDM`

---

### 5.2 Upstash CLI Authentication & Usage

The Upstash CLI is installed via npm (`@upstash/cli`). Authenticate your machine using either PowerShell (Windows) or Bash (Linux/macOS):

#### Windows (PowerShell):
```powershell
# Set environment variables for current session
$env:UPSTASH_EMAIL="rajeevkavala34@gmail.com"
$env:UPSTASH_API_KEY="3557015c-7630-4d54-b5f0-1cbfe709e261"

# Or save permanently to ~/.config/upstash/config.json
New-Item -ItemType Directory -Force -Path "$HOME\.config\upstash"
@{ email = "rajeevkavala34@gmail.com"; api_key = "3557015c-7630-4d54-b5f0-1cbfe709e261" } | ConvertTo-Json | Set-Content "$HOME\.config\upstash\config.json"
```

#### Linux / macOS (Bash):
```bash
export UPSTASH_EMAIL="rajeevkavala34@gmail.com"
export UPSTASH_API_KEY="3557015c-7630-4d54-b5f0-1cbfe709e261"
```

---

### 5.3 Useful Upstash CLI Commands

```bash
# 1. List all Redis databases
npx @upstash/cli redis list

# 2. Get database details (credentials hidden)
npx @upstash/cli redis get --db-id dcae4566-9aca-4597-8f40-3e706dce4789 --hide-credentials

# 3. Check real-time database stats & command usage
npx @upstash/cli redis stats --db-id dcae4566-9aca-4597-8f40-3e706dce4789

# 4. Test live Redis PING via REST
npx @upstash/cli redis exec --db-url "https://equal-snake-38143.upstash.io" --db-token "AZT_AAIncDFhYzAzODM2MTFjNDE0ZGU0ODI4MjU1ZTJmZWY0OWJkOHAxMzgxNDM" PING
# Expected Output: {"result":"PONG"}
```

---

## 6. Step 2: Database Setup (Supabase PostgreSQL Free Tier)

1. Go to [supabase.com](https://supabase.com) and create project `resumebuddy-db`.
2. Select your AWS Region (e.g., `ap-south-1` or `us-east-1`).
3. Go to **Project Settings** -> **Database** -> **Connection String**:
   * **URI (Transaction Pooler - Port 6543):**
     ```
     postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   * **URI (Direct Connection - Port 5432):**
     ```
     postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
4. Apply Prisma migrations from your local terminal:
   ```bash
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npx prisma db push --schema=packages/database/prisma/schema.prisma
   ```

---

## 7. Step 3: Google Cloud Console OAuth 2.0 Configuration

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select project: `ResumeBuddy-Production`.
3. Configure **OAuth Consent Screen**:
   * User Type: **External**
   * App Name: `ResumeBuddy`
   * User Support Email: `your-email@gmail.com`
   * App Domain:
     * Application home page: `https://www.resume-buddy.tech`
     * Privacy Policy: `https://www.resume-buddy.tech/privacy`
     * Terms of Service: `https://www.resume-buddy.tech/terms`
   * Authorized Domains: Add `resume-buddy.tech` and `vercel.app`
   * Scopes: Add `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
   * Publishing status: Click **Publish App** (Move from "Testing" to "In production").
4. Create **Credentials** -> **OAuth Client ID**:
   * Application type: **Web application**
   * Name: `ResumeBuddy Web Client`
   * **Authorized JavaScript origins:**
     * `https://www.resume-buddy.tech`
     * `https://resume-buddy.tech`
     * `https://resume-buddy-v3.vercel.app`
     * `http://localhost:9002`
   * **Authorized redirect URIs:**
     * `https://www.resume-buddy.tech/api/auth/callback/google`
     * `https://resume-buddy.tech/api/auth/callback/google`
     * `https://resume-buddy-v3.vercel.app/api/auth/callback/google`
     * `http://localhost:9002/api/auth/callback/google`
5. Copy your **Client ID** and **Client Secret**.

---

## 8. Step 4: Vercel Frontend Configuration & Environment Sync (`resume-buddy-v3`)

The frontend is already provisioned on Vercel:
* **Project Name:** `resume-buddy-v3`
* **Project ID:** `prj_2cKLtBFf8bzUTnz14wezeE41jE4W`
* **Account Scope:** `rajeevkavala`

### 8.1 Link Local Workspace to Vercel Project

From the project root directory (`d:\Resume_Buddy_v3`):

```bash
# Link local codebase to existing Vercel project
vercel link --project resume-buddy-v3 --yes
```

### 8.2 Verify & Update Production Environment Variables

You can view existing environment variables with the CLI:
```bash
vercel env ls --project resume-buddy-v3
```

Ensure the following critical environment variables are set for **Production, Preview, and Development**:

| Environment Variable | Required Value / Format | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Production optimizations |
| `NEXT_PUBLIC_APP_URL` | `https://www.resume-buddy.tech` | Canonical frontend URL |
| `APP_DOMAIN` | `www.resume-buddy.tech` | Cookie / Domain binding |
| `LATEX_SERVICE_URL` | `https://api.resume-buddy.tech` | Points to AWS Graviton Tectonic LaTeX |
| `NEXT_PUBLIC_WEBSOCKET_URL` | `https://api.resume-buddy.tech` | Points to AWS Graviton Socket.io WS |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PW]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase Transaction Pooler |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[PW]@aws-0-[REGION].pooler.supabase.com:5432/postgres` | Supabase Direct (Migrations) |
| `REDIS_URL` | `rediss://default:AZT_AAIncDFhYzAzODM2MTFjNDE0ZGU0ODI4MjU1ZTJmZWY0OWJkOHAxMzgxNDM@equal-snake-38143.upstash.io:6379` | Upstash Serverless Redis TLS |
| `GOOGLE_CLIENT_ID` | `[ID].apps.googleusercontent.com` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `[SECRET]` | Google Cloud OAuth Secret |
| `JWT_SECRET` | `[64-character random hex]` | User JWT Token Signing |
| `JWT_REFRESH_SECRET` | `[64-character random hex]` | Refresh Token Signing |
| `SESSION_COOKIE_NAME` | `rb_session` | Auth Session Cookie |
| `GROQ_API_KEY` | `gsk_[KEY]` | Primary AI Inference |
| `GOOGLE_API_KEY` | `[KEY]` | Backup Gemini AI Inference |
| `RAZORPAY_KEY_ID` | `rzp_live_[KEY]` | Payment Gateway Live Key |
| `RAZORPAY_KEY_SECRET` | `[SECRET]` | Razorpay Secret |
| `RAZORPAY_WEBHOOK_SECRET` | `[WEBHOOK_SECRET]` | Razorpay Webhook Signing |

To add or update any missing variable via Vercel CLI:
```bash
# Example: Setting AWS backend and Upstash Redis endpoints
vercel env add LATEX_SERVICE_URL production --project resume-buddy-v3
vercel env add NEXT_PUBLIC_WEBSOCKET_URL production --project resume-buddy-v3
```

### 8.3 Pull Environment Variables for Local Development
```bash
vercel env pull .env.local --project resume-buddy-v3
```

### 8.4 Trigger Production Deploy via Vercel CLI
```bash
# Deploy latest build to Production
vercel --prod
```

---

## 9. Step 5: Provision AWS EC2 Graviton Instance (Backend Microservices)

1. Open [AWS EC2 Console](https://console.aws.amazon.com/ec2/) and select region (e.g. `ap-south-1` Mumbai).
2. Click **Launch Instance**:
   * **Name:** `resumebuddy-backend-graviton`
   * **OS:** **Ubuntu Server 24.04 LTS (HVM)**
   * **Architecture:** **`64-bit (Arm)`** *(Graviton)*
   * **Instance Type:** **`t4g.small`** (2 vCPU, 2GB RAM)
   * **Key Pair:** `resumebuddy-key.pem`
   * **Security Group:**
     * Allow SSH (Port 22) from your IP
     * Allow HTTP (Port 80) from `0.0.0.0/0`
     * Allow HTTPS (Port 443) from `0.0.0.0/0`
   * **Storage:** `30 GiB` gp3 SSD.
3. Allocate and associate an **Elastic IP (Static IPv4)** to the instance. Note the IP: `[AWS_ELASTIC_IP]`.

---

## 10. Step 6: Server OS Bootstrap & Swap Space Setup

SSH into your AWS Graviton server:

```bash
ssh -i resumebuddy-key.pem ubuntu@YOUR_AWS_ELASTIC_IP
```

Run the automated setup script to configure Docker, a **4GB Swapfile**, and system optimizations:

```bash
#!/bin/bash
set -e

echo ">>> 1. Updating System..."
sudo apt-get update -y && sudo apt-get upgrade -y

echo ">>> 2. Creating 4GB Swap Space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
fi

echo ">>> 3. Installing Docker (ARM64) & Tools..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu

sudo mkdir -p /opt/resumebuddy
sudo chown -R ubuntu:ubuntu /opt/resumebuddy
echo ">>> OS Bootstrap Complete!"
```

---

## 11. Step 7: AWS Docker Compose Configuration (LaTeX + WebSocket)

On the AWS EC2 server, configure the backend microservices.

### 11.1 Create `/opt/resumebuddy/.env.backend`

```bash
cat << 'EOF' > /opt/resumebuddy/.env.backend
NODE_ENV=production
PORT=3001
REDIS_URL="rediss://default:AZT_AAIncDFhYzAzODM2MTFjNDE0ZGU0ODI4MjU1ZTJmZWY0OWJkOHAxMzgxNDM@equal-snake-38143.upstash.io:6379"
NEXT_PUBLIC_APP_URL="https://www.resume-buddy.tech"
ALLOWED_ORIGINS="https://www.resume-buddy.tech,https://resume-buddy.tech,https://resume-buddy-v3.vercel.app"
JWT_SECRET="YOUR_64_CHAR_RANDOM_HEX_SECRET"
EOF
```

### 11.2 Create `/opt/resumebuddy/docker-compose.yml`

This lightweight compose file runs only the backend engines (**Tectonic LaTeX** and **Socket.io Realtime WS**), keeping memory footprint under ~450MB:

```yaml
version: '3.9'

services:
  # ============================================================================
  # 1. Tectonic LaTeX PDF Microservice
  # ============================================================================
  latex:
    build:
      context: ./services/resume-latex-service
      dockerfile: Dockerfile
    container_name: resumebuddy-latex
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=8080
      - HOST=0.0.0.0
      - NODE_OPTIONS=--max-old-space-size=384
      - ALLOWED_ORIGINS=https://www.resume-buddy.tech,https://resume-buddy.tech,https://resume-buddy-v3.vercel.app
      - LOG_LEVEL=warn
    ports:
      - "127.0.0.1:8080:8080"
    deploy:
      resources:
        limits:
          memory: 500M
          cpus: "1.2"
        reservations:
          memory: 120M
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/healthz || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - resumebuddy-backend

  # ============================================================================
  # 2. Socket.io Realtime WebSocket Server (Live AI Voice Interview Engine)
  # ============================================================================
  websocket:
    build:
      context: .
      dockerfile: apps/websocket/Dockerfile
    container_name: resumebuddy-ws
    restart: unless-stopped
    env_file: .env.backend
    environment:
      - NODE_ENV=production
      - PORT=3001
      - NODE_OPTIONS=--max-old-space-size=256
    ports:
      - "127.0.0.1:3001:3001"
    deploy:
      resources:
        limits:
          memory: 300M
          cpus: "0.8"
        reservations:
          memory: 100M
    networks:
      - resumebuddy-backend

networks:
  resumebuddy-backend:
    driver: bridge
```

---

## 12. Step 8: Production Nginx Reverse Proxy & Let's Encrypt SSL on AWS

Create `/etc/nginx/sites-available/resume-buddy-api.conf`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# 1. HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.resume-buddy.tech;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://api.resume-buddy.tech$request_uri;
    }
}

# 2. Main Production Backend API & WebSocket Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.resume-buddy.tech;

    # SSL Certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.resume-buddy.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.resume-buddy.tech/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Global CORS Headers for Vercel Frontend
    set $cors_origin "";
    if ($http_origin ~* "^https:\/\/(www\.)?resume-buddy\.tech$|^https:\/\/resume-buddy-v3\.vercel\.app$") {
        set $cors_origin $http_origin;
    }

    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    client_max_body_size 25M;

    # ---- 1. Tectonic LaTeX PDF Compilation Endpoints ----
    location /api/compile {
        limit_req zone=api_limit burst=15 nodelay;

        # Preflight handling
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        proxy_pass http://127.0.0.1:8080/compile;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    # LaTeX Service Health
    location /healthz {
        proxy_pass http://127.0.0.1:8080/healthz;
    }

    # ---- 2. Socket.io Realtime WebSocket Traffic ----
    location /socket.io/ {
        # Preflight handling
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            return 204;
        }

        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Persistent stream timeouts for voice interviews
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }

    # Default fallback / status
    location / {
        return 200 '{"status":"online","service":"ResumeBuddy AWS Microservices"}';
        add_header Content-Type application/json;
    }
}
```

### Enable Site & Issue SSL Certificate:

```bash
# 1. Link site configuration
sudo ln -sf /etc/nginx/sites-available/resume-buddy-api.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 2. Issue Let's Encrypt Certificate
sudo certbot certonly --standalone -d api.resume-buddy.tech --email admin@resume-buddy.tech --agree-tos --non-interactive

# 3. Reload Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## 13. Step 9: Domain & DNS Record Setup (`resume-buddy.tech` & `api.resume-buddy.tech`)

Configure DNS records at your domain registrar or DNS provider (Namify / Cloudflare / Route 53):

> [!TIP]
> **Namify Domains Inc. Registrar Guide:**  
> For step-by-step instructions on navigating **Namify Domains Inc. (`manage.get.tech`)**, see the dedicated guide: [NAMIFY_DOMAIN_AND_DNS_SETUP_GUIDE.md](file:///d:/Resume_Buddy_v3/docs/NAMIFY_DOMAIN_AND_DNS_SETUP_GUIDE.md).

| Type | Hostname / Subdomain | Target / Value | TTL | Notes / Registrar Status |
|---|---|---|---|---|
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto | Vercel Frontend (Canonical) |
| **A** | `@` (apex) | `76.76.21.21` (Vercel IP) | Auto | Vercel Apex Redirect |
| **A** | `api` | `[AWS_EC2_ELASTIC_IP]` | 3600 | AWS Graviton Microservices (LaTeX + WS) |
| **CNAME** | `ws` (optional) | `api.resume-buddy.tech` | Auto | Optional alias |

> [!IMPORTANT]
> If using Cloudflare in front of `api.resume-buddy.tech`:
> 1. In Cloudflare Dashboard -> **Network** -> Ensure **WebSockets** is toggled **ON**.
> 2. In Cloudflare Dashboard -> **SSL/TLS** -> Set mode to **Full (Strict)**.

---

## 14. Step 10: Auto-Healing Systemd Service & Automated Deployments

### 14.1 Create Systemd Service (`/etc/systemd/system/resumebuddy.service`)

```ini
[Unit]
Description=ResumeBuddy AWS Backend Microservices
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/resumebuddy
ExecStart=/usr/bin/docker compose -f /opt/resumebuddy/docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f /opt/resumebuddy/docker-compose.yml down
TimeoutStartSec=0
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable auto-start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable resumebuddy
sudo systemctl start resumebuddy
```

---

## 15. Step 11: End-to-End Verification & Health Checks

Verify all components from your local terminal:

```bash
# 1. Verify Vercel Frontend
curl -I https://www.resume-buddy.tech
# Output: HTTP/2 200 OK

# 2. Verify Upstash Redis Connectivity via REST
curl -s "https://equal-snake-38143.upstash.io/ping?_token=AZT_AAIncDFhYzAzODM2MTFjNDE0ZGU0ODI4MjU1ZTJmZWY0OWJkOHAxMzgxNDM"
# Output: {"result":"PONG"}

# 3. Verify AWS Backend API Status
curl -s https://api.resume-buddy.tech/
# Output: {"status":"online","service":"ResumeBuddy AWS Microservices"}

# 4. Verify Tectonic LaTeX Health on AWS
curl -s https://api.resume-buddy.tech/healthz
# Output: {"ok":true}

# 5. Verify Socket.io Endpoint on AWS
curl -I "https://api.resume-buddy.tech/socket.io/?EIO=4&transport=polling"
# Output: HTTP/2 200 OK (returns handshake payload)

# 6. Verify Google OAuth Redirect URL
curl -s -X GET https://www.resume-buddy.tech/api/auth/google
# Output: {"url":"https://accounts.google.com/o/oauth2/v2/auth?..."}
```

---

## 16. Troubleshooting & Operator Runbook

### 1. Google OAuth Throws `redirect_uri_mismatch`
* **Symptoms:** Clicking "Sign in with Google" displays Google Error 400 with `redirect_uri_mismatch`.
* **Fix:**
  1. Inspect the URL parameter in Google's error page to see the exact requested `redirect_uri`.
  2. Copy that exact string and paste it into Google Cloud Console -> **Credentials** -> **OAuth 2.0 Client IDs** -> **Authorized redirect URIs**.
  3. Ensure `NEXT_PUBLIC_APP_URL` on Vercel is set to `https://www.resume-buddy.tech` without a trailing slash.

### 2. Browser Blocks LaTeX API or WebSocket (`CORS error: No 'Access-Control-Allow-Origin'`)
* **Symptoms:** Resume compilation fails on the frontend with browser network red flag on `https://api.resume-buddy.tech/api/compile`.
* **Fix:**
  1. Verify Nginx `sites-available/resume-buddy-api.conf` contains the `$cors_origin` matcher for `resume-buddy.tech` and `vercel.app`.
  2. Test preflight with curl:
     ```bash
     curl -I -X OPTIONS https://api.resume-buddy.tech/api/compile \
       -H "Origin: https://www.resume-buddy.tech" \
       -H "Access-Control-Request-Method: POST"
     ```
     Ensure output contains `Access-Control-Allow-Origin: https://www.resume-buddy.tech` and HTTP status `204`.

### 3. Upstash Redis Connection or Authentication Error
* **Symptoms:** Next.js throws `NOAUTH Authentication required` or `Connection timeout`.
* **Fix:**
  1. Check that the connection string starts with `rediss://` (double `s` for TLS).
  2. Verify credentials using the CLI:
     ```bash
     npx @upstash/cli redis get --db-id dcae4566-9aca-4597-8f40-3e706dce4789
     ```

### 4. WebSocket Disconnects During Live AI Mock Interviews
* **Symptoms:** Audio streaming cuts off after 60 seconds with `WebSocket closed`.
* **Fix:**
  1. Check that Nginx has `proxy_read_timeout 86400s;` and `proxy_buffering off;`.
  2. Ensure Cloudflare proxy has WebSockets enabled (Cloudflare -> Network -> WebSockets ON).
  3. Verify Upstash Redis adapter connection by inspecting backend logs: `docker compose logs websocket`.

### 5. Vercel Database Connection Errors (`Max client connections reached`)
* **Symptoms:** Vercel API routes return 500 error: `FATAL: remaining connection slots are reserved`.
* **Fix:** Verify Vercel `DATABASE_URL` uses the Supabase **Transaction Pooler** URL (Port `6543` with `?pgbouncer=true`), NOT the direct port `5432`.
