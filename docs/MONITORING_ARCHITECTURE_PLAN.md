# Resume Buddy Monitoring Platform — Architecture & Implementation Plan

**Target System:** `monitor.resume-buddy.tech`  
**Classification:** Internal Administrative Observability & Incident Response Platform  
**Target File:** `docs/MONITORING_ARCHITECTURE_PLAN.md`  
**Authors / Roles:** Principal Site Reliability Engineer (SRE), Staff DevOps Engineer, Cloud Architect & Senior Full-Stack Engineer  
**Date:** August 30, 2026  
**Status:** Approved for Implementation

---

# 1. Executive Summary & System Architecture

### 1.1 Mission & Scope
The **Resume Buddy Monitoring Platform** (`monitor.resume-buddy.tech`) is an autonomous, real-time observability, telemetry, and synthetic testing platform designed specifically for the distributed architecture of Resume Buddy v3. It provides zero-blindspot visibility across edge web traffic, compute instances, database transactions, caching layers, multi-tier AI inference pipelines, cloud storage, payment flows, and transactional notifications.

### 1.2 Core Architectural Principles
1. **Zero Impact on Production SLA:** Telemetry gathering occurs out-of-band or through non-blocking asynchronous polling to guarantee zero CPU/memory degradation on client-facing applications.
2. **Hybrid Ingestion Model (Pull + Push):** 
   - **Pull (Active Polling & Synthetics):** A central worker schedules regular HTTP/TCP/gRPC health checks, latency probes, and end-to-end user synthetic journeys.
   - **Push (Event Ingestion):** Production servers stream error logs, unhandled exceptions, and SLA metrics via lightweight webhooks/API events.
3. **Defense-in-Depth Security:** Gated behind two-layer security: HTTP Basic Authentication at the edge proxy level + Session-based Admin RBAC validating authenticated administrators against `ADMIN_EMAILS`.
4. **Resilient Failover:** The monitoring platform operates independently of the primary Next.js runtime so that if the main web frontend or microservice cluster degrades, the monitor remains online to alert and diagnose root causes.

---

### 1.3 High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Admin Clients"]
        AdminBrowser["Admin Browser\n(monitor.resume-buddy.tech)"]
    end

    subgraph MonitoringPlatform["Monitoring Control Plane (monitor.resume-buddy.tech)"]
        EdgeAuth["Edge Basic Auth & Reverse Proxy\n(Vercel Edge / Nginx)"]
        DashboardUI["Observability UI\n(Next.js 16 + React 19 + Tremor/Radix)"]
        MonitorAPI["Monitoring API Server\n(/api/v1/monitor/*)"]
        SSEHub["Realtime SSE & WebSocket Hub\n(Live Telemetry Broadcaster)"]
        ProbeWorker["Synthetic & Health Probe Worker\n(Scheduled BullMQ / Cron Engine)"]
        MetricAggregator["Metrics Aggregator & Rollup Engine\n(10s -> 1m -> 1h -> 1d)"]
        AlertManager["Alert & Escalation Engine\n(Multi-channel Router)"]
    end

    subgraph MonitoredEcosystem["Resume Buddy Production Ecosystem"]
        WebEdge["Next.js Frontend & API Gateway\n(www.resume-buddy.tech)"]
        EC2Microservices["AWS Graviton EC2 (api.resume-buddy.tech)\n├── LaTeX Service (Port 8080)\n└── WebSocket Server (Port 3001)"]
        SupabaseDB["Supabase PostgreSQL 16\n(Pooler 6543 / Direct 5432)"]
        UpstashRedis["Upstash Serverless Redis 7\n(TLS Cache & BullMQ)"]
        S3Storage["AWS S3 Bucket\n(resumebuddy-storage-*)"]
        AIProviders["Multi-Tier AI Routing Tier\n├── Groq (GPT-OSS / Llama)\n├── OpenRouter (Qwen / DeepSeek)\n├── Google Gemini 2.5 Flash\n└── Sarvam AI (Indic Voice)"]
        SaaSServices["External SaaS Services\n├── Razorpay (Payments)\n├── Resend (Email)\n└── Twilio (SMS / WhatsApp)"]
    end

    subgraph NotificationChannels["Alert Notification Channels"]
        EmailAlerts["Resend Email\n(admin-alerts@resume-buddy.tech)"]
        SMSAlerts["Twilio SMS & WhatsApp\n(Emergency On-Call Escalation)"]
        SlackWebhook["Slack / Discord Ops Webhooks"]
    end

    AdminBrowser -->|HTTPS Basic Auth + Admin JWT| EdgeAuth
    EdgeAuth --> DashboardUI
    DashboardUI <-->|REST APIs| MonitorAPI
    DashboardUI <-->|Server-Sent Events (SSE)| SSEHub

    ProbeWorker -->|Active Health Probes & Synthetics| WebEdge
    ProbeWorker -->|Probes /healthz & /socket.io| EC2Microservices
    ProbeWorker -->|Connection & Latency Ping| SupabaseDB
    ProbeWorker -->|Read/Write/TTL Probe| UpstashRedis
    ProbeWorker -->|Presigned URL & Read Probe| S3Storage
    ProbeWorker -->|Inference Ping & Token Est| AIProviders
    ProbeWorker -->|API Status & Webhook Ping| SaaSServices

    WebEdge -.->|Push Error Logs & Metrics| MonitorAPI
    EC2Microservices -.->|Push Container Metrics| MonitorAPI

    ProbeWorker --> MetricAggregator
    MetricAggregator --> AlertManager
    AlertManager --> EmailAlerts
    AlertManager --> SMSAlerts
    AlertManager --> SlackWebhook
```

---

# 2. Deployment Architecture & Network Topography

### 2.1 Interaction Matrix & Network Routes

| Target Service | Physical Location | Probing Protocol | Network Path & Security | Auth Mechanism |
|:---|:---|:---|:---|:---|
| **Frontend Web** | Vercel Edge Global | HTTPS (`/api/health`, `/api/metrics`) | Public Edge CDN (`https://www.resume-buddy.tech`) | Bearer Internal Health Token |
| **LaTeX Service** | AWS EC2 Graviton (`ap-south-1`) | HTTP/HTTPS (`/healthz`, `/v1/resume/latex/compile`) | Direct EIP (`13.207.140.19`) / `https://api.resume-buddy.tech` | Nginx SSL + Service Secret |
| **WebSocket Hub** | AWS EC2 Graviton (`ap-south-1`) | WSS / Socket.io Polling Handshake | `https://api.resume-buddy.tech/socket.io/?EIO=4` | Socket handshake payload |
| **Supabase DB** | Supabase AWS (`ap-northeast-2`) | TCP / Postgres Wire (`SELECT 1;`) | `aws-1-ap-northeast-2.pooler.supabase.com:6543` | SSL SCRAM-SHA-256 (`DATABASE_URL`) |
| **Upstash Redis** | Upstash AWS (`ap-south-1`) | TLS TCP / Redis RESP (`PING`) | `rediss://together-crawdad-240298.upstash.io:6379` | AUTH Token (`REDIS_PASSWORD`) |
| **AWS S3 Bucket** | AWS `ap-south-1` | HTTPS REST (HeadBucket / PutObject) | `https://s3.ap-south-1.amazonaws.com` | AWS SigV4 IAM Credentials |
| **AI Providers** | Cloud APIs (Groq, Gemini, OpenRouter) | HTTPS JSON POST (Minimal Prompt Ping) | Global Anycast REST Endpoints | API Keys (`GROQ_API_KEY`, etc.) |
| **SaaS Providers** | Razorpay, Resend, Twilio | HTTPS REST Status Probes | Global Vendor APIs | Vendor API Tokens |

---

# 3. Comprehensive Service Monitoring Strategy

For every service in the ecosystem, the monitoring platform maintains strict probing cadence, failure thresholds, and automatic recovery protocols:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PROBING LIFECYCLE STATE MACHINE                           │
│                                                                                        │
│   [HEALTHY] ──(1 Failure)──> [DEGRADED] ──(3 Consecutive Failures)──> [DOWN / CRITICAL] │
│      ▲                              │                                        │         │
│      │                              └────────(Latency Recovery)──────────────┤         │
│      └───────────────────────────(2 Consecutive Passes)──────────────────────┘         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Probing Specifications Table

| Service Identifier | Probed Target & Assertion | Frequency | Timeout | Retry Count | Degraded Threshold | Failure / Critical Condition | Auto-Recovery Condition |
|:---|:---|:---:|:---:|:---:|:---|:---|:---|
| `web-frontend` | `GET https://www.resume-buddy.tech/api/health` ➔ HTTP 200 & `status: "ok"` | 15s | 3000ms | 2 | Latency > 1200ms or 1 failed probe | 3 consecutive failures or HTTP 5xx | 2 consecutive HTTP 200 (< 500ms) |
| `latex-service` | `GET https://api.resume-buddy.tech/healthz` ➔ HTTP 200 & `uptime > 0` | 10s | 2500ms | 2 | Latency > 800ms | 3 consecutive failures or compilation timeout | 2 consecutive HTTP 200 (< 200ms) |
| `websocket-gateway`| Socket.io Polling Handshake ➔ HTTP 200 & `sid` returned | 15s | 3000ms | 2 | Handshake > 600ms | 3 consecutive handshake drops | 2 consecutive successful pings |
| `database-postgres`| `SELECT count(*) FROM "User";` execution time | 30s | 4000ms | 2 | Query latency > 450ms | Connection refused or timeout > 4s | 2 consecutive queries (< 100ms) |
| `redis-cache` | `PING` ➔ `PONG` & temporary key `SET/GET/DEL` | 15s | 2000ms | 2 | Latency > 400ms | Connection timeout or auth rejection | 2 consecutive PONG (< 150ms) |
| `s3-storage` | S3 `HeadBucket` + 1KB probe object write/delete | 60s | 5000ms | 2 | Operation > 1500ms | 403 Forbidden or 500 Internal | 2 consecutive clean write/delete |
| `ai-groq-primary` | Fast inference probe (token count = 5) | 45s | 4000ms | 1 | Latency > 2500ms | HTTP 429 (Rate limit) or 5xx | 2 consecutive responses (< 1000ms) |
| `ai-openrouter-sec`| Secondary model routing check | 60s | 5000ms | 1 | Latency > 3500ms | HTTP 429 or 502 Bad Gateway | 2 consecutive responses (< 1500ms) |
| `ai-gemini-fallback`| Gemini 2.5 Flash fallback health | 60s | 4000ms | 1 | Latency > 2000ms | API quota exhaustion / 5xx | 2 consecutive valid JSON returns |
| `ssl-certificates` | TLS Handshake on domain certificates | 12h | 10000ms| 3 | Expiration within 14 days | Expiration within 3 days or invalid cert | Valid cert > 30 days remaining |
| `dns-namify-records`| DNS A/CNAME resolution for apex, www, api | 1h | 5000ms | 2 | Response time > 500ms | Resolution mismatch / NXDOMAIN | Correct IP/CNAME returned |
| `payments-razorpay`| Razorpay live credentials & orders API ping | 5m | 5000ms | 2 | Latency > 2000ms | HTTP 401/5xx | 2 consecutive valid responses |
| `email-resend` | Resend API domain verification status | 5m | 5000ms | 2 | Latency > 1500ms | HTTP 401 or domain unverified | Domain verified & API active |

---

# 4. Comprehensive Dashboard Page Designs

The dashboard UI at `monitor.resume-buddy.tech` is structured into 18 dedicated views:

```text
monitor.resume-buddy.tech/
├── /overview                # Realtime Command Center & System Vital Signs
├── /infrastructure          # AWS EC2 Graviton, CPU, RAM, Disk, Nginx status
├── /frontend                # Vercel CDN metrics, Core Web Vitals, Edge Latency
├── /backend                 # LaTeX Engine (Port 8080) & WebSocket Gateway (Port 3001)
├── /database                # PostgreSQL Pooler connection depth, queries, slow queries
├── /redis                   # Upstash Redis memory, hit/miss ratios, BullMQ queues
├── /storage                 # AWS S3 lifecycle, bucket quota, presigned URL metrics
├── /ai-providers            # Groq, Gemini, OpenRouter, Sarvam availability & tokens
├── /payments                # Razorpay live transactions, webhooks, failure rates
├── /notifications           # Resend email deliverability & Twilio SMS/WhatsApp OTPs
├── /deployments             # GitHub Actions CI/CD runs & Vercel deployment events
├── /synthetics              # 12 Automated End-to-End user workflow probes
├── /logs                    # Centralized real-time log stream with search & filters
├── /incidents               # Active and past outages, root causes, post-mortems
├── /alerts                  # Alert rule manager, threshold settings, on-call rotation
├── /audit-logs              # Tamper-evident admin activity log & session history
├── /user-sessions           # Live active user sessions, geographic traffic map
└── /settings                # Monitoring intervals, webhook URLs, and escalation policies
```

### 4.1 Page Breakdown & UI Layout Specifications

#### 1. Overview Page (`/overview`)
- **Top Status Banner:** Big visual status badge ("ALL SYSTEMS OPERATIONAL" / "DEGRADED PERFORMANCE" / "SYSTEM OUTAGE").
- **Metric Cards (Row 1):** Overall Platform Uptime (99.98%), Average API Latency (114ms), Active Database Connections (12/100), Active Redis Memory (14.2 MB), Daily AI Inference Requests (4,821).
- **Service Health Grid (Row 2):** Realtime pulsing cards for Web, LaTeX, WebSocket, Supabase, Redis, S3, Groq, Gemini, OpenRouter, Razorpay, Resend, Twilio.
- **Latency Sparklines (Row 3):** 24-hour interactive latency chart comparing Frontend vs LaTeX vs Supabase vs AI Router.
- **Recent Incidents & Alerts Stream (Row 4):** Live audit feed of recent warning/critical alerts.

#### 2. Infrastructure Page (`/infrastructure`)
- **Host Metrics:** AWS EC2 Graviton ARM64 (`t4g.small` in `ap-south-1`, EIP `13.207.140.19`).
- **Realtime Gauges:** CPU Utilization (%), RAM Usage (MB/GB), NVMe Disk I/O, Network In/Out bandwidth.
- **Docker Container Matrix:** Status, CPU%, Mem%, restart count for `resumebuddy-latex` and `resumebuddy-ws`.
- **Nginx Reverse Proxy Status:** Active connections, request rate per second, 2xx/4xx/5xx distribution.
- **SSL / Certificate Tracker:** Days remaining on `api.resume-buddy.tech` (Let's Encrypt automated auto-renewal monitor).

#### 3. Frontend & Edge Page (`/frontend`)
- **Vercel Edge Telemetry:** Canonical domains (`resume-buddy.tech`, `www.resume-buddy.tech`).
- **Core Web Vitals:** Largest Contentful Paint (LCP < 1.2s), First Input Delay (FID < 50ms), Cumulative Layout Shift (CLS < 0.05).
- **Cache Hit Ratio:** Edge CDN cache hit percentage for static assets and SSR routes.
- **HTTP Error Rate:** Realtime 4xx (Client) and 5xx (Server) error distribution chart.

#### 4. Backend Microservices Page (`/backend`)
- **LaTeX Compilation Microservice:**
  - Average compilation duration histogram (p50: 82ms, p95: 160ms, p99: 310ms).
  - Tectonic cache hit rate (%) & worker memory allocation.
  - Active compilation queue depth and throughput (PDFs generated per minute).
- **WebSocket Gateway:**
  - Connected live socket count, rooms active, real-time interview token streaming rate.
  - Polling vs WebSocket transport protocol ratio.

#### 5. Database Page (`/database`)
- **PostgreSQL Pooler (PgBouncer):** Active clients, waiting client connections, server pool utilization.
- **Query Performance:** Top 10 slowest database queries, average query latency (ms).
- **Table Metrics:** Row counts for `User` (51+), `Resume` (38+), `InterviewSession`, `Subscription`, `VerificationToken`.
- **Database Storage & Disk Usage:** Total tablespace utilized vs Supabase quota.

#### 6. Redis & Queues Page (`/redis`)
- **Upstash Serverless Redis:** Commands per second, hit ratio vs miss ratio, connection count.
- **BullMQ Background Workers:** Active jobs, completed jobs, delayed jobs, failed jobs in retry backoff.
- **Rate Limit Telemetry:** Requests throttled per minute, top throttled IP addresses.

#### 7. Cloud Storage Page (`/storage`)
- **AWS S3 Bucket Metrics:** Total object count, total GB stored in `resumebuddy-storage-277352717671`.
- **Presigned URL Lifecycle:** Number of presigned upload/download URLs issued per hour, expiration failure rate.
- **Upload Latencies:** Average time for client-to-S3 document transfer.

#### 8. AI Provider Routing Page (`/ai-providers`)
- **Provider Performance Comparison Table:**
  | Provider | Configured Tier | Avg Response Time | Success Rate | Token Consumption (Today) | Cost Est ($) |
  |---|---|---|---|---|---|
  | **Groq (GPT-OSS 20B/120B)** | Tier 1 (Primary) | 480ms | 99.7% | 1.84M tokens | $0.82 |
  | **OpenRouter (Qwen 3.6/Coder)**| Tier 2 (Secondary) | 890ms | 99.2% | 620K tokens | $0.41 |
  | **Google Gemini 2.5 Flash** | Tier 3 (Fallback) | 1,120ms | 99.9% | 210K tokens | $0.15 |
  | **Sarvam AI (Voice/Speech)** | Indic Audio | 1,450ms | 98.6% | 140 minutes | $0.70 |
- **Fallback Trigger Frequency:** Realtime counter of how many times Tier 1 failed over to Tier 2 or Tier 3.

#### 9. Payments & Billing Page (`/payments`)
- **Razorpay Live Telemetry:** API status, webhook delivery success rate (100%), payment conversion rate.
- **Order Lifecycle:** Orders created vs payments captured vs payments failed/cancelled.
- **Subscription Health:** Active Pro subscribers, renewal success rate, churn events.

#### 10. Notifications Page (`/notifications`)
- **Resend Email:** Delivery rate, bounce rate, spam complaint rate, average time-to-inbox.
- **Twilio SMS / WhatsApp:** OTP delivery latency, delivery receipt confirmations, carrier failure rates.

#### 11. Deployments & CI/CD Page (`/deployments`)
- **GitHub Actions Stream:** Realtime build status of `ci.yml`, `deploy-backend.yml`, `security-scan.yml`.
- **Vercel Deployments:** Live commit hash, deployment preview URLs, build duration logs.
- **Rollback Trigger Button:** One-click redeployment / rollback to previous healthy Git commit hash.

#### 12. Synthetic Probing Page (`/synthetics`)
- **User Journey Matrix:** Status, latency history, step-by-step breakdown of all 12 synthetic workflows.

#### 13. Centralized Log Explorer (`/logs`)
- **Live Stream Viewer:** Unified log stream combining Next.js API logs, EC2 Fastify logs, Nginx access logs, and Prisma query logs.
- **Log Level Filtering:** `ERROR`, `WARN`, `INFO`, `DEBUG` toggle switches.
- **Structured JSON Search:** Search by `userId`, `resumeId`, `sessionId`, `httpStatus`, or `errorMessage`.

#### 14. Incident Management (`/incidents`)
- **Active Outage Desk:** Open incidents, impacted services, timeline of events, assigned SRE engineer, resolution status.
- **Post-Mortem Generator:** Auto-populated markdown report summarizing outage cause, downtime duration, and mitigation steps.

#### 15. Alert Rules & Escalation (`/alerts`)
- Threshold configuration sliders, alert suppression/snooze controls, on-call contact details.

#### 16. Audit Logs (`/audit-logs`)
- Complete immutable record of admin logins, setting modifications, manual service restarts, and alert acknowledgments.

#### 17. User Sessions & Geo Map (`/user-sessions`)
- Worldwide map displaying active user connections, browser user-agents, and session durations.

#### 18. System Settings (`/settings`)
- Global probe frequencies, notification webhooks, Basic Auth credential rotations, maintenance mode toggles.

---

# 5. Dashboard Widget Catalog

```
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│     Overall Health        │      System Latency       │    Active DB Poolers      │
│         [ 99.98% ]        │          [ 114ms ]        │         [ 12 / 100 ]      │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│       EC2 CPU Load        │       EC2 RAM Usage       │      LaTeX Warm Latency   │
│         [ 14.2% ]         │       [ 412 MB / 2 GB ]   │          [ 82ms ]         │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│     Redis Memory Used     │    Active WebSockets      │    Daily AI Inferences    │
│         [ 14.8 MB ]       │          [ 48 ]           │         [ 4,821 ]         │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│     S3 Storage Quota      │    SSL Expiry Countdown   │    GitHub CI Status       │
│         [ 2.4 GB ]        │        [ 82 Days ]        │         [ Passing ]       │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

### Complete Widget Inventory Table

| Widget Name | Category | Visualization Type | Data Source | Refresh Rate |
|:---|:---|:---|:---|:---:|
| **Overall Health Badge** | Vital | Status Pill (Green/Yellow/Red) | Aggregate of all 12 services | 5s |
| **P50 / P95 / P99 Latency**| Performance | Line Chart with Area fill | Synthetic probes & API metrics | 10s |
| **EC2 CPU Utilization** | Infrastructure | Radial Gauge (0–100%) | Nginx / Host agent probe | 10s |
| **EC2 RAM & Swap Usage** | Infrastructure | Stacked Bar Chart | Docker container memory stats | 10s |
| **LaTeX Service Latency** | Microservice | Single Value + Sparkline | Fastify `/healthz` probe | 10s |
| **WebSocket Active Sockets**| Realtime | Live Counter + Waveform | Socket.io server connection pool | 5s |
| **PostgreSQL Pool Depth** | Database | Donut Chart (Active vs Idle) | Supabase PgBouncer stats query | 15s |
| **Slow Query Monitor** | Database | Sortable Table | `pg_stat_statements` | 60s |
| **Redis Memory & Keys** | Cache | Gauge + Key Counter | Upstash Redis `INFO` response | 15s |
| **BullMQ Job Throughput** | Queues | Multi-line Bar Chart | BullMQ Queue counts | 10s |
| **S3 Storage & Object Count**| Storage | Area Chart over 30 days | AWS CloudWatch / S3 HeadBucket | 1h |
| **AI Provider Fallback Rate**| AI Routing | Stacked Percent Bar | Smart AI Router fallback counter | 30s |
| **AI Token Usage & Cost** | Business / AI | Metric Card ($ & Tokens) | Token estimator + AI logs | 5m |
| **Payment Success Rate** | Billing | Percentage Gauge (Target >98%)| Razorpay Webhook Events | 1m |
| **Email Deliverability** | Notifications | Progress Bar (Target >99%) | Resend Delivery Status API | 5m |
| **SMS/WhatsApp OTP Latency**| Notifications | Number Callout (Target <5s) | Twilio Delivery Logs | 5m |
| **SSL Expiration Days** | Security | Countdown Card (Warning <14d)| TLS Certificate Socket probe | 6h |
| **DNS Record Health** | Networking | Status Table (Apex, WWW, API)| DNS over HTTPS (DoH) Resolver | 1h |
| **GitHub Actions Pipeline**| CI/CD | Commit Hash + Status Badge | GitHub REST API (`gh run list`) | 30s |
| **Error Rate (HTTP 5xx)** | Quality | Threshold Chart (Red if >1%) | Next.js API log stream | 10s |

---

# 6. End-to-End Synthetic Monitoring Workflows

Synthetic monitoring simulates authentic multi-step user operations on production continuously to detect user-facing regressions before real customers experience them.

```mermaid
sequenceDiagram
    autonumber
    actor SyntheticBot as Synthetic Monitor Agent
    participant Web as Next.js Web App
    participant Auth as Session & JWT Tier
    participant DB as Supabase PostgreSQL
    participant LaTeX as AWS Graviton LaTeX Microservice
    participant S3 as AWS S3 Storage
    participant AI as Smart AI Router

    SyntheticBot->>Web: 1. Probes Homepage & Metadata
    Web-->>SyntheticBot: Returns 200 OK & Valid HTML
    SyntheticBot->>Auth: 2. Authenticates Synthetic Test User
    Auth-->>SyntheticBot: Returns Valid JWT Session Token
    SyntheticBot->>AI: 3. Requests Resume Bullet Improvement
    AI-->>SyntheticBot: Returns AI Rewritten Response (< 1.5s)
    SyntheticBot->>LaTeX: 4. Compiles Sample LaTeX Source
    LaTeX-->>SyntheticBot: Returns Valid %PDF-1.5 Binary (< 200ms)
    SyntheticBot->>S3: 5. Tests S3 Presigned Upload & Download
    S3-->>SyntheticBot: Validates Object Lifecycle Integrity
    SyntheticBot->>DB: 6. Runs Read Verification Query
    DB-->>SyntheticBot: Verifies DB Pool Latency (< 100ms)
```

### 6.1 Synthetic Test Specifications

#### Workflow 1: Homepage & Public Asset Availability
- **Steps:** `GET https://www.resume-buddy.tech` ➔ Assert status 200 ➔ Assert HTML contains `<title>ResumeBuddy` ➔ Assert CSS/JS bundles load with status 200.
- **Failure Condition:** HTTP status != 200, latency > 2000ms, or missing critical DOM selectors.
- **Alert Trigger:** P2 Alert if failed 2 consecutive runs.

#### Workflow 2: User Authentication & Token Validation
- **Steps:** `POST /api/auth/login` with test credentials ➔ Assert JWT cookie received ➔ Verify JWT signature via `jose` ➔ Assert user role and session presence.
- **Failure Condition:** HTTP status != 200, invalid token signature, or latency > 1500ms.
- **Alert Trigger:** P1 Critical Alert (Blocks login functionality).

#### Workflow 3: Full Resume Creation & LaTeX PDF Generation Flow
- **Steps:** Authenticate ➔ `POST /api/resume` (Create draft) ➔ `POST https://api.resume-buddy.tech/v1/resume/latex/compile` with sample LaTeX document ➔ Assert binary buffer starts with `%PDF-1.5` ➔ Assert compilation time < 500ms.
- **Failure Condition:** Compilation error, HTTP status != 200, or duration > 3000ms.
- **Alert Trigger:** P1 Critical Alert (Core document value proposition broken).

#### Workflow 4: AWS S3 Object Storage Full Lifecycle
- **Steps:** Request presigned upload URL from `/api/storage/presigned` ➔ `PUT` test PDF buffer (2KB) directly to AWS S3 ➔ Issue presigned download `GET` ➔ Compare SHA-256 hashes ➔ `DELETE` test object.
- **Failure Condition:** Hash mismatch, 403 Forbidden, or upload duration > 2500ms.
- **Alert Trigger:** P1 Critical Alert.

#### Workflow 5: Multi-Tier Smart AI Inference Routing
- **Steps:** Dispatch standard test prompt ("Improve this resume bullet") to `/api/ai/smart-route` ➔ Verify Primary Model (Groq / GPT-OSS 20B) responds within 1500ms ➔ Inject simulated timeout and verify seamless fallback to Tier 2 (OpenRouter) and Tier 3 (Gemini 2.5 Flash).
- **Failure Condition:** All 3 tiers fail to return structured JSON.
- **Alert Trigger:** P1 Critical Alert if all tiers down; P3 Warning if Tier 1 degraded.

#### Workflow 6: Realtime WebSocket Handshake & Audio Signaling
- **Steps:** Connect WebSocket client to `wss://api.resume-buddy.tech` ➔ Send `join-room` payload ➔ Receive confirmation event ➔ Measure round-trip ping time (< 150ms) ➔ Disconnect cleanly.
- **Failure Condition:** Handshake failure, connection timeout > 3000ms, or disconnect drops.
- **Alert Trigger:** P2 Alert (Impacts live mock interviews).

#### Workflow 7: Payment Checkout Initialization
- **Steps:** `POST /api/payments/create-order` with Pro Plan ID ➔ Assert Razorpay `order_id` returned with format `order_*` ➔ Validate amount matches catalog.
- **Failure Condition:** Razorpay API connection timeout or auth failure.
- **Alert Trigger:** P1 Critical Alert (Impacts revenue collection).

#### Workflow 8: Notification Dispatch Pipeline
- **Steps:** Trigger transactional email test probe via Resend ➔ Query delivery receipt ➔ Trigger SMS OTP probe via Twilio API.
- **Failure Condition:** API rejection or delivery error.
- **Alert Trigger:** P2 Alert.

---

# 7. Comprehensive Metrics Collection Architecture

```mermaid
flowchart LR
    subgraph Sources["Metric Sources"]
        ClientMetrics["Client Web Vitals\n(@vercel/speed-insights)"]
        ServerMetrics["Next.js Route Timers\n(Server-Timing headers)"]
        MicroserviceMetrics["LaTeX & WS Fastify Metrics\n(Memory / SLA)"]
        DBMetrics["Postgres pg_stat_activity\n(Pool depth & queries)"]
        RedisMetrics["Upstash Redis INFO\n(Memory & IO)"]
    end

    subgraph CollectionTier["Collection & Aggregation Tier"]
        CollectorAPI["Telemetry Ingestion API\n(POST /api/v1/telemetry)"]
        TimeSeriesBuffer["In-Memory Sliding Buffer\n(10s high-res window)"]
        RollupEngine["Rollup & Aggregation Engine\n(Calculates p50, p95, p99, avg)"]
    end

    subgraph StorageTier["Telemetry Storage Tier"]
        RedisTimeSeries["Upstash Redis\n(Live 24-hour buffer)"]
        PostgresMetrics["Supabase PostgreSQL\n(Hourly/Daily Long-Term Stats)"]
    end

    Sources --> CollectorAPI
    CollectorAPI --> TimeSeriesBuffer
    TimeSeriesBuffer --> RollupEngine
    RollupEngine --> RedisTimeSeries
    RollupEngine --> PostgresMetrics
```

### Metrics Taxonomy Matrix

1. **Frontend & User Experience Metrics:**
   - Client Response Time (TTFB, LCP, FID, CLS).
   - Client-side JavaScript errors / unhandled promise rejections.
   - Page view throughput and route navigation durations.
2. **Backend & Microservices Metrics:**
   - Route execution durations (p50, p90, p95, p99).
   - LaTeX PDF generation duration (ms per page).
   - WebSocket connection counts, dropped frames, token generation rates.
3. **Infrastructure & Host Metrics:**
   - EC2 CPU usage (User %, System %, Idle %).
   - Resident Set Size (RSS) memory per Docker container.
   - Nginx active connections, connection read/write rates.
4. **Database & Cache Metrics:**
   - Active, idle, and waiting PgBouncer connections.
   - Transaction commit rate, rollback count, deadlock frequency.
   - Redis memory consumed, evicted keys, commands/sec.
5. **Business & Domain KPIs:**
   - Resumes created, parsed, compiled, and downloaded per hour.
   - Mock interview sessions initiated and completed.
   - Conversion rate from Free to Pro tier subscriptions.
   - Token expenditure per active user.

---

# 8. Alerting & Multi-Channel Escalation Matrix

### 8.1 Severity Classifications & SLAs

| Severity Level | Definition | Response SLA | Resolution Target | Notification Channels |
|:---|:---|:---:|:---:|:---|
| **P1 - CRITICAL** | Full system outage, core resume compilation failure, database unreachable, or payments blocked. | **< 5 Minutes** | **< 30 Minutes** | Twilio SMS + Twilio WhatsApp Voice Call + Urgent Email + Slack `#critical-ops` |
| **P2 - HIGH** | Degraded performance, secondary AI fallback active, WebSocket latency > 1000ms, or elevated error rates (> 3%). | **< 15 Minutes**| **< 2 Hours** | Resend Email + Slack `#ops-alerts` |
| **P3 - MEDIUM** | High CPU (> 80%), SSL cert expiring in < 14 days, non-critical background queue delays. | **< 1 Hour** | **< 12 Hours** | Slack `#ops-alerts` + Dashboard Notification |
| **P4 - LOW / INFO**| Deployment finished, scheduled maintenance, weekly security audit clean. | Informational | N/A | Daily Email Digest + Dashboard Stream |

### 8.2 Detailed Alert Rule Definitions

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              ALERT TRIGGER & SUPPRESSION RULES                           │
│                                                                                          │
│  RULE 1: Web Service 5xx Surge                                                          │
│  Condition: HTTP 5xx errors > 2% of total requests over 3 consecutive minutes           │
│  Severity: P1 Critical                                                                   │
│  Action: Trigger On-Call SMS + Auto-fetch last 50 error traces                           │
│                                                                                          │
│  RULE 2: LaTeX Compilation Outage                                                       │
│  Condition: Probes to /v1/resume/latex/compile fail for 2 consecutive runs (30s)         │
│  Severity: P1 Critical                                                                   │
│  Action: Trigger On-Call SMS + Send container restart signal                            │
│                                                                                          │
│  RULE 3: Database Pool Exhaustion                                                       │
│  Condition: PgBouncer active poolers > 90% capacity for > 2 minutes                      │
│  Severity: P2 High                                                                       │
│  Action: Slack Notification + Alert DB Administrator                                     │
│                                                                                          │
│  RULE 4: AI Tier 1 Degradation                                                           │
│  Condition: Groq primary endpoint returns 429 / 5xx for > 3 requests in a 1-minute window │
│  Severity: P3 Medium (System auto-heals via Tier 2 OpenRouter fallback)                  │
│  Action: Log event + Slack warning                                                       │
│                                                                                          │
│  RULE 5: S3 Upload Failure                                                               │
│  Condition: Synthetic S3 upload probe fails                                             │
│  Severity: P1 Critical                                                                   │
│  Action: Trigger On-Call WhatsApp + Email                                                │
│                                                                                          │
│  RULE 6: SSL Expiration Warning                                                         │
│  Condition: Let's Encrypt certificate remaining days < 14                                │
│  Severity: P3 Medium                                                                     │
│  Action: Send notification email + verify Certbot renew task                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. Incident Management & Automated Post-Mortem System

### 9.1 Incident Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Triggered: Threshold Breached
    Triggered --> Acknowledged: SRE Confirms via SMS/Dashboard
    Acknowledged --> Investigating: Diagnosis & Root Cause Analysis
    Investigating --> Mitigated: Fallback/Hotfix Applied (Service Recovered)
    Mitigated --> Resolved: Verification Probes Pass for 10 Mins
    Resolved --> PostMortem: Auto-Generated Incident Report
    PostMortem --> [*]
```

### 9.2 Incident Data Schema
Every incident records:
1. `id`: Unique identifier (`INC-20260830-01`).
2. `severity`: `P1`, `P2`, `P3`, `P4`.
3. `impactedService`: `web`, `latex`, `websocket`, `supabase`, `redis`, `s3`, `ai-router`, `razorpay`.
4. `title`: Human-readable summary (e.g., "LaTeX Service ARM64 Container Out of Memory").
5. `startTime`, `acknowledgedTime`, `mitigatedTime`, `resolvedTime`.
6. `rootCauseCategory`: `Infrastructure`, `Code Regression`, `Third-Party Outage`, `Resource Exhaustion`.
7. `timeline`: Array of chronological event logs with timestamps.
8. `postMortemMarkdown`: Generated post-mortem document summarizing timeline, financial impact, token losses, and preventative action items.

---

# 10. Security & Authentication Architecture

To ensure the monitoring platform cannot be accessed by unauthorized entities:

```text
                               INCOMING REQUEST
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Layer 1: Edge HTTP Basic Authentication          │
             │ Header: Authorization: Basic <base64(user:pass)> │
             └────────────────────────┬─────────────────────────┘
                                      │ (Pass)
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │ Layer 2: Admin Session Token & RBAC              │
             │ JWT verification + ADMIN_EMAILS email validation │
             └────────────────────────┬─────────────────────────┘
                                      │ (Pass)
                                      ▼
                     [ 200 OK: Access Monitor GUI ]
```

### 10.1 Layer 1: Edge Basic Auth
- Secured with environment variables: `MONITOR_ADMIN_USER` and `MONITOR_ADMIN_PASSWORD`.
- Edge middleware rejects any unauthenticated request with `HTTP 401 Unauthorized` and `WWW-Authenticate: Basic realm="ResumeBuddy Monitor"`.

### 10.2 Layer 2: Admin Role-Based Access Control (RBAC)
- Validates that the active session token belongs to an administrator whose email is listed in `ADMIN_EMAILS` (e.g., `kavalarajeev34@gmail.com`).
- Normal users attempting to navigate to `monitor.resume-buddy.tech` are rejected.

### 10.3 Additional Hardening Measures
- **IP Whitelisting (Optional):** Restricts monitoring routes to known office or VPN CIDR ranges.
- **Session Lifetime:** Short-lived admin session tokens (TTL: 4 hours) requiring automatic re-authentication.
- **Audit Logging:** Every read and write action inside the monitoring platform is written to the immutable `MonitorAuditLog` table.

---

# 11. Monitoring REST & Streaming APIs

The platform exposes dedicated internal endpoints:

```text
GET    /api/v1/monitor/overview              # Comprehensive platform vital signs & statuses
GET    /api/v1/monitor/services              # List all monitored services and their current health
GET    /api/v1/monitor/services/:id/history  # 24h / 7d / 30d latency and uptime history
GET    /api/v1/monitor/metrics/live          # Live stream of high-resolution 10s metrics
GET    /api/v1/monitor/synthetics            # Results of the latest synthetic workflow runs
POST   /api/v1/monitor/synthetics/run        # Trigger an immediate manual synthetic test
GET    /api/v1/monitor/incidents             # List all active and historical incidents
POST   /api/v1/monitor/incidents/:id/ack     # Acknowledge an active incident
POST   /api/v1/monitor/incidents/:id/resolve # Mark an incident as resolved
GET    /api/v1/monitor/logs                  # Query centralized structured logs with filters
GET    /api/v1/monitor/deployments           # GitHub Actions and Vercel deployment events
POST   /api/v1/monitor/alerts/test           # Trigger a test alert to SMS/Email/Slack
GET    /api/v1/monitor/stream                # Server-Sent Events (SSE) live telemetry feed
```

---

# 12. Database Schema Design (Prisma Data Model)

To retain historical operational telemetry, incidents, and audit trails without polluting the primary application tables, the following relational models are integrated:

```prisma
// ============================================================================
// Monitor Models for Observability & Incident Response
// ============================================================================

enum ServiceStatus {
  HEALTHY
  DEGRADED
  DOWN
  MAINTENANCE
}

enum IncidentSeverity {
  P1_CRITICAL
  P2_HIGH
  P3_MEDIUM
  P4_LOW
}

enum IncidentStatus {
  OPEN
  ACKNOWLEDGED
  INVESTIGATING
  MITIGATED
  RESOLVED
}

model MonitorServiceHealth {
  id              String        @id @default(cuid())
  serviceKey      String        // e.g. "web", "latex", "websocket", "supabase", "redis", "s3", "groq"
  serviceName     String        // e.g. "LaTeX PDF Compiler (ARM64)"
  status          ServiceStatus @default(HEALTHY)
  latencyMs       Float
  statusCode      Int?
  errorMessage    String?
  metadata        Json?
  checkedAt       DateTime      @default(now())

  @@index([serviceKey, checkedAt])
  @@index([status, checkedAt])
}

model MonitorMetricRollup {
  id              String        @id @default(cuid())
  serviceKey      String
  period          String        // "1m", "1h", "1d"
  timestamp       DateTime
  p50LatencyMs    Float
  p95LatencyMs    Float
  p99LatencyMs    Float
  avgLatencyMs    Float
  requestCount    Int
  errorCount      Int
  uptimePercent   Float

  @@unique([serviceKey, period, timestamp])
  @@index([serviceKey, timestamp])
}

model MonitorSyntheticRun {
  id              String        @id @default(cuid())
  workflowKey     String        // e.g. "resume-creation-flow", "payment-init-flow"
  workflowName    String
  success         Boolean
  durationMs      Float
  failedStepIndex Int?
  failureReason   String?
  stepTimings     Json          // Array of { stepName, durationMs, success }
  executedAt      DateTime      @default(now())

  @@index([workflowKey, executedAt])
  @@index([success, executedAt])
}

model MonitorIncident {
  id              String           @id @default(cuid())
  incidentNumber  String           @unique // e.g. "INC-20260830-01"
  severity        IncidentSeverity
  status          IncidentStatus   @default(OPEN)
  title           String
  impactedService String
  triggerReason   String
  acknowledgedBy  String?
  acknowledgedAt  DateTime?
  mitigatedAt     DateTime?
  resolvedAt      DateTime?
  downtimeSeconds Int?
  postMortem      String?          @db.Text
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  events          MonitorIncidentEvent[]

  @@index([status, severity])
}

model MonitorIncidentEvent {
  id          String          @id @default(cuid())
  incidentId  String
  incident    MonitorIncident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  message     String
  actor       String          // "System Alert Engine" or "Admin User"
  eventType   String          // "TRIGGERED", "ACKNOWLEDGED", "NOTE_ADDED", "RESOLVED"
  createdAt   DateTime        @default(now())

  @@index([incidentId, createdAt])
}

model MonitorAuditLog {
  id          String    @id @default(cuid())
  adminEmail  String
  action      String    // "ACK_INCIDENT", "RESTART_CONTAINER", "CHANGE_SETTING"
  target      String?
  ipAddress   String?
  userAgent   String?
  payload     Json?
  createdAt   DateTime  @default(now())

  @@index([adminEmail, createdAt])
}
```

---

# 13. Realtime Telemetry Strategy: SSE vs WebSockets

### Evaluation Matrix

| Criterion | Server-Sent Events (SSE) | WebSockets | Polling (10s interval) | Recommended Choice |
|:---|:---:|:---:|:---:|:---:|
| **Server Overhead** | Very Low (HTTP/2 multiplexed) | Low (Persistent TCP socket) | Medium (Repeated HTTP handshakes) | **SSE** |
| **Vercel Edge Compatibility**| **Native 100% Support** | Requires external WS server | Native 100% Support | **SSE** |
| **Directionality** | Unidirectional (Server ➔ Client)| Bidirectional | Client-driven | **SSE** (Monitor is 98% telemetry display) |
| **Reconnection Handling** | Built-in browser auto-reconnect | Custom heartbeat logic needed | N/A | **SSE** |
| **Firewall & Proxy Traversal**| Standard HTTPS (Port 443) | Can be blocked by enterprise proxies| Standard HTTPS | **SSE** |

### Architectural Decision: Hybrid SSE + Event-Driven REST
- **Live Stream:** Use **Server-Sent Events (`/api/v1/monitor/stream`)** for high-frequency telemetry (gauges, latency sparklines, live status updates) pushed directly from the server to the browser over standard HTTPS.
- **User Actions:** Use standard authenticated REST mutations for incident acknowledgement, test alerts, and configuration updates.

---

# 14. Data Retention & Rollup Aggregation Strategy

To prevent uncontrolled database growth while keeping high resolution for recent events:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TIERED DATA RETENTION PIPELINE                            │
│                                                                                        │
│   [ Live Probes (10s) ]  ──(After 24h)──> [ 1-Minute Rollups ]                         │
│           │                                      │                                     │
│     Retained 24 Hours                      Retained 14 Days                            │
│                                                  │                                     │
│                                            (After 14d)                                 │
│                                                  ▼                                     │
│                                       [ 1-Hour / 1-Day Rollups ]                       │
│                                                  │                                     │
│                                            Retained 1 Year                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Retention Schedule Table

| Telemetry Type | Resolution | Retention Duration | Storage Medium | Automated Cleanup Mechanism |
|:---|:---|:---:|:---|:---|
| **Raw Live Probes** | 10 seconds | **24 Hours** | Upstash Redis Sliding List | Redis Key TTL expiration (`EX 86400`) |
| **1-Minute Metrics Rollups**| 1 minute | **14 Days** | PostgreSQL `MonitorMetricRollup` | Automated cron cleanup task (`0 2 * * *`) |
| **Hourly / Daily Rollups** | 1 hour / 1 day | **365 Days** | PostgreSQL `MonitorMetricRollup` | Retained for SLA & trend reporting |
| **Synthetic Test Runs** | Per execution (5m) | **30 Days** | PostgreSQL `MonitorSyntheticRun` | Rolling deletion of records > 30d |
| **Incidents & Post-Mortems**| Event-based | **Permanent (Indefinite)** | PostgreSQL `MonitorIncident` | Never deleted |
| **Audit Logs** | Event-based | **90 Days** | PostgreSQL `MonitorAuditLog` | Legal & compliance retention policy |

---

# 15. Performance & Resource Budget

- **Target Admin Load:** 1 to 10 simultaneous admin dashboard viewers.
- **Telemetry Overhead:** < 0.2% CPU utilization on the AWS Graviton host and < 1 MB additional RAM footprint on Next.js.
- **SSE Stream Bandwidth:** Compressed JSON delta frames (~120 bytes per tick) consuming < 1.2 KB/s per connected dashboard.
- **Probe Concurrency:** Asynchronous non-blocking worker with `Promise.allSettled()` executing all 12 service probes in parallel in under 800ms total wall time.

---

# 16. Deployment Strategy for `monitor.resume-buddy.tech`

### 16.1 Deployment Topography
The monitoring dashboard can be deployed as an independent sub-application on **Vercel** bound to the subdomain `monitor.resume-buddy.tech`.

### 16.2 DNS Configuration Table (Namify `manage.get.tech`)

| Record Type | Host Name | Target / Destination Value | Suggested TTL | Purpose |
|:---:|:---:|:---:|:---:|:---|
| **CNAME** | `monitor` | `cname.vercel-dns.com` | 3600 (1 hr) | Points `monitor.resume-buddy.tech` to Vercel Global Edge |

### 16.3 Required Monitoring Environment Variables

```env
# ==============================================================================
# Resume Buddy Monitoring Platform Environment Variables
# ==============================================================================

# Authentication & Security
MONITOR_ADMIN_USER=admin
MONITOR_ADMIN_PASSWORD=CHANGE_THIS_STRONG_RANDOM_PASSWORD_64_CHARS
ADMIN_EMAILS="kavalarajeev34@gmail.com"
JWT_SECRET="YOUR_STRONG_RANDOM_JWT_SECRET_AT_LEAST_32_CHARS"

# Production Service Endpoints to Probe
PROBE_TARGET_WEB_URL="https://www.resume-buddy.tech"
PROBE_TARGET_BACKEND_URL="https://api.resume-buddy.tech"
PROBE_TARGET_EC2_HOST="13.207.140.19"

# Data Persistence & Cache
DATABASE_URL="postgresql://postgres.USER:PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
REDIS_URL="rediss://default:YOUR_UPSTASH_REDIS_PASSWORD@together-crawdad-240298.upstash.io:6379"

# Storage
AWS_REGION="ap-south-1"
AWS_S3_BUCKET="resumebuddy-storage-277352717671"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"

# AI Inference Providers
GROQ_API_KEY="YOUR_GROQ_API_KEY"
GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
OPENROUTER_API_KEY="YOUR_OPENROUTER_API_KEY"
SARVAM_API_KEY="YOUR_SARVAM_API_KEY"

# Emergency Alerting Channels
RESEND_API_KEY="YOUR_RESEND_API_KEY"
ALERT_EMAIL_FROM="alerts@resume-buddy.tech"
ALERT_EMAIL_TO="kavalarajeev34@gmail.com"
TWILIO_ACCOUNT_SID="YOUR_TWILIO_ACCOUNT_SID"
TWILIO_AUTH_TOKEN="YOUR_TWILIO_AUTH_TOKEN"
ALERT_PHONE_NUMBER="+919876543210"

# Payments & Integrations
RAZORPAY_KEY_ID="YOUR_RAZORPAY_KEY_ID"
RAZORPAY_KEY_SECRET="YOUR_RAZORPAY_KEY_SECRET"
```

---

# 17. Proposed Project Folder Structure

```text
src/
├── app/
│   └── (monitor)/
│       ├── layout.tsx                     # Global Monitor shell with Sidebar & Top Nav
│       ├── page.tsx                       # Redirects to /overview
│       ├── overview/page.tsx              # Main Mission Control Dashboard
│       ├── infrastructure/page.tsx        # EC2 Graviton & Nginx metrics
│       ├── frontend/page.tsx              # Vercel Edge & Core Web Vitals
│       ├── backend/page.tsx               # LaTeX Service & WebSocket Gateway
│       ├── database/page.tsx              # Supabase PostgreSQL Pooler stats
│       ├── redis/page.tsx                 # Upstash Redis & BullMQ
│       ├── storage/page.tsx               # AWS S3 Storage metrics
│       ├── ai-providers/page.tsx          # Multi-tier AI Router telemetry
│       ├── payments/page.tsx              # Razorpay checkout & webhook health
│       ├── notifications/page.tsx         # Resend & Twilio deliverability
│       ├── deployments/page.tsx           # GitHub Actions CI & Vercel builds
│       ├── synthetics/page.tsx            # Synthetic E2E user test matrix
│       ├── logs/page.tsx                  # Realtime structured log explorer
│       ├── incidents/page.tsx             # Active incident desk & post-mortems
│       ├── alerts/page.tsx                # Alert thresholds & on-call policies
│       ├── audit-logs/page.tsx            # Tamper-evident admin action log
│       └── settings/page.tsx              # Probe frequencies & integration keys
│
├── components/
│   └── monitor/
│       ├── ui/                            # Tremor & Radix UI visualization primitives
│       ├── status-badge.tsx               # Animated pulsing status indicator
│       ├── latency-chart.tsx              # Interactive SVG latency sparklines
│       ├── incident-card.tsx              # Incident triage card with Ack button
│       ├── synthetic-stepper.tsx          # Step-by-step workflow timeline
│       ├── live-log-viewer.tsx            # Virtualized high-speed log viewer
│       ├── gauge-widget.tsx               # Radial CPU/Memory utilization gauge
│       └── metric-card.tsx                # Metric callout with delta indicators
│
├── lib/
│   └── monitor/
│       ├── probes/                        # Autonomous probe executors
│       │   ├── web.probe.ts               # Next.js frontend HTTP probe
│       │   ├── latex.probe.ts             # LaTeX compilation probe
│       │   ├── websocket.probe.ts         # Socket.io handshake probe
│       │   ├── database.probe.ts          # Postgres pooler query probe
│       │   ├── redis.probe.ts             # Upstash Redis latency probe
│       │   ├── s3.probe.ts                # S3 object upload/download probe
│       │   └── ai.probe.ts                # Smart AI router fallback probe
│       ├── synthetics/                    # 12 End-to-End synthetic workflows
│       ├── alerts/                        # Alert rule evaluator & notification dispatcher
│       ├── sse/                           # Server-Sent Events subscription hub
│       └── rollup.ts                      # 1m/1h/1d statistical aggregation engine
│
└── types/
    └── monitor.ts                         # Complete TypeScript domain contracts
```

---

# 18. Technology Choices & Justifications

| Layer | Recommended Technology | Justification / Trade-off Analysis |
|:---|:---|:---|
| **Framework** | Next.js 16 + React 19 App Router | Leverages existing repository tech stack, server components, and native Vercel Edge performance. |
| **Charts & Graphs** | Tremor (`@tremor/react`) + Recharts | Purpose-built for enterprise observability dashboards with dark-mode support and clean aesthetics. |
| **Component Primitives**| Radix UI + Tailwind CSS | Ultra-responsive, accessible, and matches Resume Buddy's premium UI standard. |
| **State Management** | TanStack Query v5 (React Query) | Efficient client-side caching, polling sync, and optimistic UI updates for incident triage. |
| **Realtime Transport** | Server-Sent Events (SSE) | Native HTTP/2 streaming over standard HTTPS port 443 with built-in reconnect logic; zero WebSocket server maintenance required. |
| **Scheduling Engine** | BullMQ + Upstash Redis | Robust cron scheduling with exponential backoff and distributed lock support to prevent duplicate probes. |
| **ORM & Data Access** | Prisma ORM 6.19 | Type-safe migrations and queries natively integrated with existing PostgreSQL database. |
| **Alert Routing** | Resend API + Twilio SDK | Uses existing production-verified credentials for instant multi-channel email/SMS escalations. |

---

# 19. Phased Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              7-PHASE IMPLEMENTATION ROADMAP                            │
│                                                                                        │
│   Phase 1: Core Dashboard & Health Probes ───────────► Days 1–2 (48h)                  │
│   Phase 2: Realtime SSE Telemetry & Infrastructure ──► Days 3–4 (48h)                  │
│   Phase 3: Synthetic User Journey Probing ───────────► Days 5–6 (48h)                  │
│   Phase 4: Multi-Channel Alerting & On-Call ────────► Days 7–8 (48h)                  │
│   Phase 5: Incident Management & Post-Mortems ───────► Days 9–10 (48h)                 │
│   Phase 6: Log Explorer & Historical Analytics ──────► Days 11–12 (48h)                │
│   Phase 7: Production Hardening & DNS Setup ─────────► Days 13–14 (48h)                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Phase Details:
1. **Phase 1 (Core Dashboard & Service Probes):** Implement edge Basic Auth, service probe engines for Web, LaTeX, WebSocket, DB, Redis, S3, and the `/overview` dashboard view.
2. **Phase 2 (Realtime Telemetry & Infrastructure):** Connect SSE streaming hub, integrate host CPU/RAM/Disk metrics for EC2 Graviton, and build `/infrastructure`, `/database`, `/redis`, `/storage` pages.
3. **Phase 3 (Synthetic User Journey Probing):** Implement 12 synthetic test suites (Resume generation, LaTeX compilation, S3 upload, AI fallback) on 5-minute recurring timers.
4. **Phase 4 (Alerting & Multi-Channel Escalation):** Implement threshold evaluator, connect Resend Email and Twilio SMS/WhatsApp dispatchers with alert de-duplication and suppression.
5. **Phase 5 (Incident Management Desk):** Build `/incidents` triage interface, SLA timers, acknowledgment buttons, and automated Markdown post-mortem generators.
6. **Phase 6 (Centralized Log Explorer & Analytics):** Stream structured JSON logs, implement multi-field search, and configure 1m/1h/1d statistical rollups.
7. **Phase 7 (Production Hardening & DNS Setup):** Configure `monitor.resume-buddy.tech` CNAME record in Namify DNS, verify SSL certificates, and execute end-to-end failure simulation drills.

---

# 20. Risk Analysis & Mitigation Matrix

| Identified Risk | Risk Severity | Potential Impact | Engineering Mitigation Strategy |
|:---|:---:|:---|:---|
| **Monitoring Probe Storm** | Medium | Probes overwhelming production database or Redis poolers. | Enforce strict rate limits on probes, use lightweight `SELECT 1;` queries, and reuse connection pools. |
| **Alert Fatigue** | High | SREs ignoring notifications due to excessive false-positive alerts. | Implement **3-consecutive-failure hysteresis** before triggering P1 alerts; add 30-minute alert deduplication windows. |
| **Monitoring Outage During Failure** | High | Inability to diagnose production if monitoring runs on same cluster. | Host monitoring control plane on Vercel Edge, completely isolated from AWS EC2 compute instances. |
| **Credential Leak via Telemetry** | High | Health payloads exposing database passwords or API keys. | Enforce strict schema validation stripping all auth headers and secret values before logging or streaming. |
| **Synthetic Test Data Pollution** | Medium | Synthetic test users polluting production metrics and analytics. | Tag synthetic test users with `is_synthetic: true` and exclude them from production business reports. |

---

# 21. Production-Grade Nice-to-Have Capabilities

1. **AI Model Performance Leaderboard:** Automatic benchmarking comparing Groq vs OpenRouter vs Gemini for response latency, cost per 1K tokens, and markdown formatting accuracy.
2. **One-Click Hot Reload & Restart:** Admin button dispatching an authenticated webhook to EC2 to restart `resumebuddy-latex` or `resumebuddy-ws` Docker containers without SSHing.
3. **SLA & Uptime Certificates:** Publicly shareable or PDF-exportable 99.9% uptime compliance certificates for enterprise users.
4. **Interactive Read-Only Terminal:** Web-based terminal emulator allowing on-call engineers to run pre-approved diagnostic commands (`docker ps`, `nginx -t`, `df -h`) directly from the dashboard.
5. **Dark Mode & PWA Support:** Mobile-friendly progressive web app allowing on-call engineers to triage incidents and acknowledge alerts from smartphones.
