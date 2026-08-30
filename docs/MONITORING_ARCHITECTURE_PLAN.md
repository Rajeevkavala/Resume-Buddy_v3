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

    subgraph MonitoringControlPlane["Monitoring Control Plane (monitor.resume-buddy.tech)"]
        EdgeAuth["Edge Basic Auth & Reverse Proxy\n(Vercel Edge Middleware)"]
        DashboardUI["Observability UI\n(Next.js 16 + React 19 + Tremor / Radix UI)"]
        MonitorAPI["Monitoring API Server\n(/api/v1/monitor/*)"]
        SSEHub["Realtime SSE Hub\n(Live Telemetry Broadcaster)"]
        ProbeWorker["Synthetic & Health Probe Worker\n(Scheduled BullMQ / Upstash Engine)"]
        MetricAggregator["Metrics Aggregator & Rollup Engine\n(10s -> 1m -> 1h -> 1d)"]
        AlertManager["Alert & Escalation Engine\n(Multi-channel Router)"]
    end

    subgraph MonitoredEcosystem["Resume Buddy Production Ecosystem"]
        WebEdge["Next.js Frontend & Edge Gateway\n(www.resume-buddy.tech / Vercel CDN)"]
        
        subgraph EC2Host["AWS Graviton EC2 (13.207.140.19 / api.resume-buddy.tech)"]
            NginxProxy["Nginx Reverse Proxy & SSL\n(Ports 80 / 443)"]
            LaTeXService["LaTeX Microservice\n(Fastify + Tectonic :8080)"]
            WSService["WebSocket Gateway\n(Socket.io Server :3001)"]
        end

        SupabaseDB["Supabase PostgreSQL 16\n(PgBouncer :6543 / Direct :5432)"]
        UpstashRedis["Upstash Serverless Redis 7\n(TLS Cache & BullMQ Queues)"]
        S3Storage["AWS S3 Object Storage\n(resumebuddy-storage-277352717671)"]
        
        subgraph AITier["Multi-Tier AI Routing Infrastructure"]
            GroqAI["Tier 1: Groq API\n(GPT-OSS 20B / 120B)"]
            OpenRouterAI["Tier 2: OpenRouter API\n(Qwen 3.6 / DeepSeek Coder)"]
            GeminiAI["Tier 3: Google Gemini\n(Gemini 2.5 Flash Fallback)"]
            SarvamAI["Audio Tier: Sarvam AI\n(Indic Voice Inferences)"]
        end

        subgraph ExternalSaaS["Third-Party Integrations"]
            RazorpayAPI["Razorpay API & Webhooks\n(Live Payments)"]
            ResendAPI["Resend Email API\n(Transactional Mail)"]
            TwilioAPI["Twilio SMS & Voice\n(2FA OTP & On-Call Alerts)"]
        end
    end

    subgraph NotificationChannels["Alert Notification Channels"]
        EmailAlerts["Resend Email\n(alerts@resume-buddy.tech)"]
        SMSAlerts["Twilio SMS & WhatsApp\n(Emergency On-Call)"]
        SlackWebhook["Slack / Discord Ops Webhooks"]
    end

    AdminBrowser -->|HTTPS Basic Auth + Admin JWT| EdgeAuth
    EdgeAuth --> DashboardUI
    DashboardUI <-->|REST APIs| MonitorAPI
    DashboardUI <-->|Server-Sent Events SSE| SSEHub

    ProbeWorker -->|Active Probes & Synthetics| WebEdge
    ProbeWorker -->|Probes /healthz & Compile| NginxProxy
    NginxProxy --> LaTeXService
    NginxProxy --> WSService
    ProbeWorker -->|SQL Probes & Latency Pings| SupabaseDB
    ProbeWorker -->|RESP PING & Key Probes| UpstashRedis
    ProbeWorker -->|HeadBucket & Presigned Probes| S3Storage
    ProbeWorker -->|Inference Ping & Token Est| AITier
    ProbeWorker -->|API Health Probes| ExternalSaaS

    WebEdge -.->|Push Error Logs & Latency Events| MonitorAPI
    EC2Host -.->|Push Host Metrics & Log Events| MonitorAPI

    ProbeWorker --> MetricAggregator
    MetricAggregator --> AlertManager
    AlertManager --> EmailAlerts
    AlertManager --> SMSAlerts
    AlertManager --> SlackWebhook
```

---

# 2. Deployment Architecture & Network Topography

```mermaid
flowchart LR
    subgraph Internet["Public Internet / Admin Network"]
        AdminUser["SRE / Admin User"]
    end

    subgraph VercelEdge["Vercel Global Edge Network"]
        MonitorApp["monitor.resume-buddy.tech\n(Next.js 16 Monitoring App)"]
        ProdApp["www.resume-buddy.tech\n(Main SaaS App)"]
    end

    subgraph AWSRegion["AWS ap-south-1 (Mumbai)"]
        subgraph EC2["AWS Graviton2 EC2 (13.207.140.19)"]
            Nginx["Nginx Reverse Proxy"]
            DockerLaTeX["Docker: LaTeX Service (:8080)"]
            DockerWS["Docker: WebSocket (:3001)"]
        end
        S3Bucket["AWS S3 Bucket\n(resumebuddy-storage-*)"]
    end

    subgraph CloudServices["Managed Cloud & SaaS Providers"]
        Supabase["Supabase PostgreSQL\n(AWS ap-northeast-2)"]
        Upstash["Upstash Redis Cluster\n(AWS ap-south-1)"]
        AIEndpoints["Groq / Gemini / OpenRouter\n(Global Anycast)"]
    end

    AdminUser -->|HTTPS :443 Basic Auth| MonitorApp
    MonitorApp -->|HTTPS /api/health| ProdApp
    MonitorApp -->|HTTPS /healthz| Nginx
    Nginx --> DockerLaTeX
    Nginx --> DockerWS
    MonitorApp -->|Postgres Wire SSL :6543| Supabase
    MonitorApp -->|TLS TCP :6379| Upstash
    MonitorApp -->|AWS SigV4 HTTPS| S3Bucket
    MonitorApp -->|HTTPS REST| AIEndpoints
```

### 2.1 Interaction Matrix & Network Routes

| Target Service | Physical Location | Probing Protocol | Network Path & Security | Auth Mechanism | Telemetry Payload Output |
|:---|:---|:---|:---|:---|:---|
| **Frontend Web** | Vercel Edge Global | HTTPS (`/api/health`, `/api/metrics`) | Public Edge CDN (`https://www.resume-buddy.tech`) | Bearer Internal Health Token | Status, route timers, active edge nodes |
| **LaTeX Service** | AWS EC2 Graviton (`ap-south-1`) | HTTP/HTTPS (`/healthz`, `/v1/resume/latex/compile`) | Direct EIP (`13.207.140.19`) / `https://api.resume-buddy.tech` | Nginx SSL + Service Secret | Uptime, memory RSS, compile duration |
| **WebSocket Hub** | AWS EC2 Graviton (`ap-south-1`) | WSS / Socket.io Polling Handshake | `https://api.resume-buddy.tech/socket.io/?EIO=4` | Socket handshake payload | Connected sockets, rooms, dropped frames |
| **Supabase DB** | Supabase AWS (`ap-northeast-2`) | TCP / Postgres Wire (`SELECT 1;`) | `aws-1-ap-northeast-2.pooler.supabase.com:6543` | SSL SCRAM-SHA-256 (`DATABASE_URL`) | Query latency, pooler saturation, deadlocks |
| **Upstash Redis** | Upstash AWS (`ap-south-1`) | TLS TCP / Redis RESP (`PING`) | `rediss://together-crawdad-240298.upstash.io:6379` | AUTH Token (`REDIS_PASSWORD`) | Memory used, commands/sec, hit ratio |
| **AWS S3 Bucket** | AWS `ap-south-1` | HTTPS REST (HeadBucket / PutObject) | `https://s3.ap-south-1.amazonaws.com` | AWS SigV4 IAM Credentials | Presigned URL latency, storage size |
| **AI Providers** | Cloud APIs (Groq, Gemini, OpenRouter) | HTTPS JSON POST (Minimal Prompt Ping) | Global Anycast REST Endpoints | API Keys (`GROQ_API_KEY`, etc.) | Tokens generated, latency, fallback rate |
| **SaaS Providers** | Razorpay, Resend, Twilio | HTTPS REST Status Probes | Global Vendor APIs | Vendor API Tokens | API status, webhook latency, OTP delivery |

---

# 3. Telemetry Data Lineage ("Where the Info Comes From")

This section documents the exact sources, log files, system counters, database queries, and response headers that feed into every monitoring widget.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TELEMETRY DATA LINEAGE MAP                                │
│                                                                                        │
│  SOURCE CATEGORY        EXACT EXTRACTION MECHANISM               METRIC DERIVED        │
│  ─────────────────      ───────────────────────────              ──────────────        │
│  Host OS & Kernel  ──►  Linux /proc/stat & /proc/meminfo   ──►  Host CPU% & RAM        │
│  Docker Engine     ──►  Docker Engine Unix Socket          ──►  Container RSS & Status │
│  Nginx Proxy       ──►  stub_status & access.log json      ──►  Active Req/s & 5xx     │
│  PostgreSQL DB     ──►  pg_stat_activity & statements      ──►  Pool Depth & Slow SQL  │
│  Upstash Redis     ──►  RESP INFO & CLIENT LIST            ──►  Commands/s & Memory    │
│  Fastify LaTeX     ──►  GET /healthz & Server-Timing       ──►  Compile p50/p95 (ms)   │
│  Socket.io Server  ──►  io.engine.clientsCount             ──►  Active WebSockets      │
│  AI Inference      ──►  usage.total_tokens & Date.now()    ──►  Tokens/s & Cost ($)    │
│  Browser Clients   ──►  @vercel/speed-insights             ──►  LCP, FID, CLS          │
│  Payment Webhooks  ──►  POST /api/payments/webhook         ──►  Order Conversion Rate  │
│  Resend Webhooks   ──►  email.delivered & email.bounced   ──►  Delivery Rate %        │
│  Twilio Status     ──►  MessageStatus=delivered callback   ──►  OTP Latency (ms)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Data Lineage Matrix

| Metric Identifier | Exact Data Origin / Source | Extraction Mechanism | Parsing & Calculation Logic |
|:---|:---|:---|:---|
| **EC2 CPU & RAM Usage** | EC2 Host `/proc/stat` & `/proc/meminfo` | Scheduled Node probe executing `os.cpus()` and `os.totalmem() - os.freemem()` | `100 - (idle_ticks / total_ticks * 100)` |
| **Container Status & Restarts**| Docker daemon socket (`/var/run/docker.sock`) | Docker HTTP API `GET /containers/json` | Parse `State.Status`, `State.OOMKilled`, and `RestartCount` |
| **Nginx Throughput & Status** | Nginx `http_stub_status_module` | `GET http://127.0.0.1/nginx_status` | Regex match: `Active connections`, `accepts handled requests` |
| **LaTeX Compilation Latency** | Fastify microservice (`services/resume-latex-service`) | Response header `Server-Timing: compile;dur=82.4` and `GET /healthz` | Calculate moving average and p50/p95/p99 histograms |
| **WebSocket Connection Depth** | Socket.io server (`apps/websocket`) | Internal state: `io.of("/").sockets.size` and `io.sockets.adapter.rooms.size` | Polled via authenticated `GET /metrics` on internal loopback |
| **Database Pool Saturation** | Supabase PostgreSQL `pg_stat_activity` | Query: `SELECT count(*), state FROM pg_stat_activity GROUP BY state;` | Ratio of active vs idle connections against max pool limit (100) |
| **Slow Query Identification** | Postgres extension `pg_stat_statements` | Query: `SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;` | Extract SQL statement, average duration, and execution counts |
| **Redis Cache Efficiency** | Upstash Redis REST / RESP `INFO` | Command: `INFO stats` | `keyspace_hits / (keyspace_hits + keyspace_misses) * 100` |
| **S3 Storage Footprint** | AWS CloudWatch Metrics / S3 List API | `AWS.CloudWatch.getMetricData({ MetricName: 'BucketSizeBytes' })` | Convert raw bytes to Gigabytes (GB) |
| **AI Inference Tokens & Cost** | Groq / OpenRouter / Gemini API response | JSON response `usage.prompt_tokens` & `usage.completion_tokens` | `(prompt_tokens * input_rate) + (completion_tokens * output_rate)` |
| **Core Web Vitals (LCP/FID/CLS)**| Client browsers via `@vercel/speed-insights` | Web Vitals JS API streamed to `/api/v1/telemetry/vitals` | Compute 75th percentile values across user navigations |
| **Payment Success Ratio** | Razorpay Webhooks (`/api/payments/webhook`) | Event triggers: `payment.captured` vs `payment.failed` | `captured_count / (captured_count + failed_count) * 100` |
| **Email Deliverability Rate** | Resend Webhook Events (`/api/notifications/webhook`) | Event triggers: `email.delivered`, `email.bounced`, `email.complained` | `delivered_count / total_sent * 100` |
| **Twilio SMS / WhatsApp Latency**| Twilio Message Resource callbacks | Delta between `date_sent` and `date_updated` upon status `delivered` | Average delivery delta in milliseconds |
| **TLS Certificate Remaining** | TLS Socket handshake on port 443 | `tls.connect({ host: 'api.resume-buddy.tech', port: 443 })` | `(peerCertificate.valid_to - Date.now()) / (1000 * 60 * 60 * 24)` |

---

# 4. Probing State Machine & Failure Thresholds

```mermaid
stateDiagram-v2
    [*] --> HEALTHY: Initialize Monitoring
    
    HEALTHY --> DEGRADED: 1 Failed Probe OR Latency > Warning Threshold
    DEGRADED --> HEALTHY: 2 Consecutive Successful Probes (< Healthy Latency)
    DEGRADED --> CRITICAL_DOWN: 3 Consecutive Failed Probes OR HTTP 5xx
    
    CRITICAL_DOWN --> INVESTIGATING: Alert Dispatched to On-Call (SMS / Slack)
    INVESTIGATING --> MITIGATED: Hotfix Deployed / Auto-Fallback Active
    MITIGATED --> HEALTHY: 5 Consecutive Successful Probes
```

### 4.1 Probing Specifications Table

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

# 5. UI Wireframes & Screen Layout Blueprints

The following wireframes provide exact visual references for frontend engineers implementing the monitoring dashboard in Next.js 16 + Tremor + Radix UI.

### 5.1 Overview / Mission Control Wireframe (`/overview`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  RESUME BUDDY OBSERVABILITY  [LIVE STREAM ●]                     [Prod: ap-south-1]  [Admin: rajeev@tech] [⚙] |
+---------------------------------------------------------------------------------------------------------------+
|  OVERALL SYSTEM STATUS: [ ● ALL SYSTEMS FULLY OPERATIONAL ]                    Uptime (30d): 99.982%          |
+---------------------------------------------------------------------------------------------------------------+
|  VITAL METRICS                                                                                                |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+  +----------+ |
|  | Avg API Latency    |  | Active DB Pool     |  | LaTeX Warm Latency |  | Active WebSockets  |  | AI Cost  | |
|  |   114 ms           |  |   14 / 100         |  |   82 ms            |  |   54 Connected     |  | $2.41/day| |
|  |   ▲ 2.1% (p95:210ms|  |   ■■■□□□□□□□ (14%) |  |   ▼ 4.2ms vs avg   |  |   12 Active Rooms  |  | 2.8M Tok | |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+  +----------+ |
+---------------------------------------------------------------------------------------------------------------+
|  SERVICE HEALTH MATRIX (REALTIME STATUS & LATENCY)                                                            |
|  +----------------------------------------------------------------------------------------------------------+ |
|  | [●] Web App (Vercel Edge)    42ms | [●] LaTeX Engine (Fastify)   82ms | [●] WebSocket Gateway    18ms      | |
|  | [●] Supabase PostgreSQL      18ms | [●] Upstash Redis            12ms | [●] AWS S3 Storage       94ms      | |
|  | [●] Groq (Tier 1 AI)        480ms | [●] OpenRouter (Tier 2 AI)  890ms | [●] Gemini 2.5 (Tier 3) 1120ms     | |
|  | [●] Razorpay Payments       210ms | [●] Resend Email            140ms | [●] Twilio SMS / Voice  310ms      | |
|  +----------------------------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  LATENCY COMPARISON SPARKLINE (PAST 24 HOURS)                                                                 |
|  1200ms |                                                                                                     |
|   800ms |                                             __/\_ (AI Inference Spike)                              |
|   400ms |   ----------------------------------------/------\--------------------------- (LaTeX Engine: 82ms)  |
|     0ms +---+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-------------+ |
|        00:00 02:00 04:00 06:00 08:00 10:00 12:00 14:00 16:00 18:00 20:00 22:00                               |
+---------------------------------------------------------------------------------------------------------------+
|  RECENT ALERTS & SYSTEM EVENTS                                                                                |
|  [ 16:04:12 ] INFO   Synthetic Workflow "LaTeX Resume Compile" passed in 142ms.                              |
|  [ 15:48:20 ] WARN   Groq Tier 1 response time exceeded 2000ms (2140ms). Auto-fallback evaluated.             |
|  [ 14:12:05 ] INFO   GitHub Actions Workflow #33306588158 (CI Quality Gate) completed successfully (3m 4s).   |
+---------------------------------------------------------------------------------------------------------------+
```

---

### 5.2 Infrastructure & AWS EC2 Graviton Wireframe (`/infrastructure`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  INFRASTRUCTURE OBSERVABILITY: AWS EC2 Graviton2 (t4g.small | ap-south-1 | 13.207.140.19)                     |
+---------------------------------------------------------------------------------------------------------------+
|  HOST RESOURCE UTILIZATION                                                                                    |
|  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------+ |
|  | CPU Load (2 vCPUs)      |  | Memory (RAM)            |  | NVMe Storage (Disk)     |  | Network I/O       | |
|  |       [ 14.2 % ]        |  |   584 MB / 2048 MB      |  |   8.4 GB / 30.0 GB      |  | In:  1.2 MB/s     | |
|  |  ( ) ( ) User: 8.1%     |  |   [|||||.............]  |  |   [|||||||...........]  |  | Out: 4.8 MB/s     | |
|  |      System: 6.1%       |  |   28.5% Utilized        |  |   28.0% Utilized        |  | Total: 14.2 GB    | |
|  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  DOCKER CONTAINER RUNTIME (ARM64 LINUX ENGINE)                                                                |
|  +----------------------+----------+-------------+------------+--------------+-----------+------------------+ |
|  | Container Name       | Status   | CPU Usage   | Memory RSS | Port Mapping | Restarts  | Uptime           | |
|  +----------------------+----------+-------------+------------+--------------+-----------+------------------+ |
|  | resumebuddy-latex    | UP (●)   | 4.2%        | 164 MB     | 127.0.0.1:8080| 0         | 18d 14h 22m      | |
|  | resumebuddy-ws       | UP (●)   | 1.8%        | 88 MB      | 127.0.0.1:3001| 0         | 18d 14h 22m      | |
|  +----------------------+----------+-------------+------------+--------------+-----------+------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  NGINX REVERSE PROXY & DOMAIN SSL STATUS                                                                      |
|  +------------------------------------------------------+  +------------------------------------------------+ |
|  | Nginx Virtual Host Metrics                           |  | SSL Certificate Lifecycle (api.resume-buddy)   | |
|  | Active Connections: 48                               |  | Issuer: Let's Encrypt Authority - R3           | |
|  | Total Requests Handled: 1,482,910                    |  | Valid From: 2026-08-30  Valid To: 2026-11-28   | |
|  | Response Codes: 2xx: 99.4% | 4xx: 0.5% | 5xx: 0.1%   |  | Days Remaining: [ 90 Days ] (Auto-Renew ON)    | |
|  +------------------------------------------------------+  +------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------------+
```

---

### 5.3 Multi-Tier AI Provider Routing Wireframe (`/ai-providers`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  AI ROUTING & INFERENCE TELEMETRY                                                [Active Policy: Cost-Optimal]|
+---------------------------------------------------------------------------------------------------------------+
|  PROVIDER TIERS & LIVE BENCHMARKS                                                                             |
|  +-----------------+---------------------+-----------+----------+-----------------+-------------+-----------+ |
|  | Provider Tier   | Target Model        | Health    | Latency  | Success Rate    | Tokens/Day  | Est. Cost | |
|  +-----------------+---------------------+-----------+----------+-----------------+-------------+-----------+ |
|  | Tier 1 (Primary)| Groq / GPT-OSS 20B  | HEALTHY ● | 480 ms   | 99.72% (1 fail) | 1,842,000   | $0.82     | |
|  | Tier 2 (Secndry)| OpenRouter / Qwen   | HEALTHY ● | 890 ms   | 99.10% (3 fail) |   620,000   | $0.41     | |
|  | Tier 3 (Fallbck)| Gemini 2.5 Flash    | HEALTHY ● | 1120 ms  | 99.98% (0 fail) |   210,000   | $0.15     | |
|  | Voice / Audio   | Sarvam AI (Indic)   | HEALTHY ● | 1450 ms  | 98.60% (2 fail) |   140 Mins  | $0.70     | |
|  +-----------------+---------------------+-----------+----------+-----------------+-------------+-----------+ |
+---------------------------------------------------------------------------------------------------------------+
|  SMART ROUTER FALLBACK FREQUENCY (PAST 24 HOURS)                                                              |
|  Total Inferences: 4,821 requests                                                                             |
|  [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■□□] 96.8%  |
|  ■ Tier 1 Handled (4,668)  |  ■ Tier 2 Fallbacks (132)  |  ■ Tier 3 Fallbacks (21)                            |
+---------------------------------------------------------------------------------------------------------------+
```

---

### 5.4 Synthetic Probing Matrix Wireframe (`/synthetics`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  SYNTHETIC USER JOURNEY TESTING (12 RECURRING WORKFLOWS)                      [Run All Probes Now ▷]          |
+---------------------------------------------------------------------------------------------------------------+
|  WORKFLOW PIPELINE STATUS                                                                                     |
|  +-------------------------------------+-----------+----------+--------------------+------------------------+ |
|  | Synthetic Workflow Name             | Status    | Duration | Last Execution     | Step Breakdown         | |
|  +-------------------------------------+-----------+----------+--------------------+------------------------+ |
|  | 01. Homepage & Public Assets CDN    | PASSED ●  | 62 ms    | 1 min ago (16:09)  | [✓ HTML] [✓ CSS] [✓ JS]| |
|  | 02. User Login & JWT Signature      | PASSED ●  | 148 ms   | 1 min ago (16:09)  | [✓ Auth] [✓ Set-Cookie]| |
|  | 03. Full Resume LaTeX PDF Compile   | PASSED ●  | 210 ms   | 1 min ago (16:09)  | [✓ Create] [✓ Compile] | |
|  | 04. AWS S3 Upload & SHA-256 Check   | PASSED ●  | 185 ms   | 1 min ago (16:09)  | [✓ Sign] [✓ Put] [✓ Get| |
|  | 05. Multi-Tier AI Prompt & Fallback | PASSED ●  | 540 ms   | 1 min ago (16:09)  | [✓ Groq] [✓ Valid JSON]| |
|  | 06. WebSocket Handshake & Audio     | PASSED ●  | 88 ms    | 1 min ago (16:09)  | [✓ Connect] [✓ Ping]   | |
|  | 07. Razorpay Order Creation Flow    | PASSED ●  | 280 ms   | 1 min ago (16:09)  | [✓ OrderID] [✓ Catalog]| |
|  | 08. Resend Email Delivery Receipt   | PASSED ●  | 310 ms   | 1 min ago (16:09)  | [✓ API] [✓ Delivered]  | |
|  +-------------------------------------+-----------+----------+--------------------+------------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  WORKFLOW DETAIL INSPECTOR: "03. Full Resume LaTeX PDF Compile"                                               |
|  Step 1: Authenticate Synthetic Runner (POST /api/auth/login)  ...... 42ms  [✓ 200 OK]                        |
|  Step 2: Initialize Draft Resume in DB (POST /api/resume)       ...... 24ms  [✓ 201 Created ID: res_syn_99]    |
|  Step 3: Compile Tectonic Binary (POST /v1/resume/latex/compile)..... 144ms [✓ 200 OK Buffer: 48,210 bytes]   |
|  Step 4: Validate %PDF-1.5 Header Magic Bytes                  ...... 0.2ms [✓ Valid Binary Header]          |
+---------------------------------------------------------------------------------------------------------------+
```

---

### 5.5 Centralized Realtime Log Explorer Wireframe (`/logs`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  CENTRALIZED LOG EXPLORER                                                          [Auto-Scroll: ON] [Clear]  |
|  Filter by Service: [ All Services ▼ ]   Level: [✓ Error] [✓ Warn] [✓ Info] [ Debug]   Search: [ "latex"    ] |
+---------------------------------------------------------------------------------------------------------------+
| TIME       | SERVICE    | LVL  | TRACE ID     | MESSAGE / STRUCTURED PAYLOAD                                  |
+------------+------------+------+--------------+---------------------------------------------------------------+
| 16:09:12.4 | web-edge   | INFO | tr_99a8f102  | GET /api/health HTTP/1.1 200 OK - 12.4ms (edge-bom)          |
| 16:09:10.1 | latex-svc  | INFO | tr_44c1029e  | Compile request completed in 82.1ms (Tectonic warm cache hit) |
| 16:08:44.2 | ai-router  | WARN | tr_88b1990a  | Groq API returned 429 Too Many Requests - routing to Tier 2   |
| 16:08:44.8 | ai-router  | INFO | tr_88b1990a  | Tier 2 OpenRouter responded successfully in 740ms (Tokens:280)|
| 16:07:01.0 | database   | INFO | db_pool_01   | PgBouncer connection pool pruned (Active: 12, Idle: 88)       |
| 16:05:12.8 | websocket  | INFO | ws_sock_42   | Room 'interview-room-41' closed. Clean socket disconnect.     |
+------------+------------+------+--------------+---------------------------------------------------------------+
```

---

### 5.6 Incident Management Desk Wireframe (`/incidents`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  INCIDENT MANAGEMENT DESK                                                     [Create Manual Incident +]     |
|  Active Incidents: 0  |  Resolved (30d): 2  |  Mean Time to Detect (MTTD): 1.2m  |  MTTR: 14.5m               |
+---------------------------------------------------------------------------------------------------------------+
|  INCIDENT HISTORY & POST-MORTEM RECORDS                                                                       |
|  +-----------------+-------------+-------------------------------+---------------+------------+-------------+ |
|  | Incident ID     | Severity    | Title / Impacted Service      | Duration      | Status     | Post-Mortem | |
|  +-----------------+-------------+-------------------------------+---------------+------------+-------------+ |
|  | INC-20260830-01 | P2 - HIGH   | Groq AI Rate Limit Surge      | 8 mins        | RESOLVED ✓ | [View Doc ↗]| |
|  | INC-20260824-01 | P1 - CRIT   | EC2 Port 8080 Latency Spike   | 21 mins       | RESOLVED ✓ | [View Doc ↗]| |
|  +-----------------+-------------+-------------------------------+---------------+------------+-------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  POST-MORTEM VIEWER: INC-20260830-01                                                                          |
|  Summary: On Aug 30, 2026, Groq Tier 1 returned HTTP 429 for 3 minutes due to upstream quota reset.           |
|  Mitigation: Smart Router automatically failed over to OpenRouter (Tier 2). User impact: 0 failed requests.   |
|  Action Items: Increased Groq tier rate limit threshold; added local token bucket rate limiting.             |
+---------------------------------------------------------------------------------------------------------------+
```

---

# 6. Detailed End-to-End Synthetic Monitoring Workflows

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

### Complete List of 12 Synthetic Probes

1. **Homepage & Static Bundles:** Asserts status 200, `<title>ResumeBuddy`, and core CSS/JS bundle loading.
2. **User Authentication & Session:** Authenticates test user, checks JWT signature via `jose`, asserts HTTP cookie.
3. **Resume Draft Creation:** Writes test record to Supabase and verifies ID generation.
4. **LaTeX PDF Compilation:** Compiles LaTeX sample on EC2 port 8080 and verifies `%PDF-1.5` magic bytes.
5. **AWS S3 Object Lifecycle:** Issues presigned URL, puts 2KB buffer, downloads, verifies SHA-256, and deletes.
6. **Smart AI Router Inference:** Pings Tier 1 Groq and verifies structured JSON parsing.
7. **AI Provider Fallback Drill:** Injects artificial timeout to verify Tier 1 ➔ Tier 2 ➔ Tier 3 failover.
8. **WebSocket Audio Handshake:** Connects WSS socket, joins test room, asserts roundtrip ping < 150ms.
9. **Razorpay Order Creation:** Pings `/api/payments/create-order` and asserts valid order format `order_*`.
10. **Resend Email Delivery:** Pings Resend API and verifies delivery receipt callback.
11. **Twilio SMS OTP:** Dispatches synthetic OTP request and verifies delivery timestamp.
12. **DNS & SSL Health:** Performs DoH query for apex, www, api, and verifies SSL certificate days remaining > 14.

---

# 7. Alerting & Multi-Channel Escalation Matrix

### 7.1 Severity Classifications & SLAs

| Severity Level | Definition | Response SLA | Resolution Target | Notification Channels |
|:---|:---|:---:|:---:|:---|
| **P1 - CRITICAL** | Full system outage, core resume compilation failure, database unreachable, or payments blocked. | **< 5 Minutes** | **< 30 Minutes** | Twilio SMS + Twilio WhatsApp Voice Call + Urgent Email + Slack `#critical-ops` |
| **P2 - HIGH** | Degraded performance, secondary AI fallback active, WebSocket latency > 1000ms, or elevated error rates (> 3%). | **< 15 Minutes**| **< 2 Hours** | Resend Email + Slack `#ops-alerts` |
| **P3 - MEDIUM** | High CPU (> 80%), SSL cert expiring in < 14 days, non-critical background queue delays. | **< 1 Hour** | **< 12 Hours** | Slack `#ops-alerts` + Dashboard Notification |
| **P4 - LOW / INFO**| Deployment finished, scheduled maintenance, weekly security audit clean. | Informational | N/A | Daily Email Digest + Dashboard Stream |

---

# 8. Security & Authentication Architecture

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

---

# 9. Database Schema Design (Prisma Data Model)

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

# 10. Implementation Work Breakdown & Phased Execution

The entire implementation of the Resume Buddy Monitoring Platform is structured into **7 sequential, production-ready phases**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              7-PHASE IMPLEMENTATION TIMELINE                           │
│                                                                                        │
│   Phase 1: Core Foundation & Edge Basic Auth ────────► Days 1–2 (Estimated: 16h)       │
│   Phase 2: Autonomous Probing & Telemetry ───────────► Days 3–4 (Estimated: 16h)       │
│   Phase 3: Realtime SSE Streaming & Overview UI ─────► Days 5–6 (Estimated: 16h)       │
│   Phase 4: Infrastructure, Database & Cache Views ───► Days 7–8 (Estimated: 16h)       │
│   Phase 5: 12 Synthetic User Journey Probes ────────► Days 9–10 (Estimated: 16h)      │
│   Phase 6: Multi-Channel Alerting & Incidents ───────► Days 11–12 (Estimated: 16h)     │
│   Phase 7: Log Explorer, DNS & Production Hardening ─► Days 13–14 (Estimated: 16h)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Core Foundation, Edge Security & Database Migrations
- **Objective:** Establish isolated monitoring route hierarchy, edge security, and database tables.
- **Deliverables:**
  - Create Prisma migration adding `MonitorServiceHealth`, `MonitorMetricRollup`, `MonitorSyntheticRun`, `MonitorIncident`, `MonitorAuditLog`.
  - Implement edge Basic Auth middleware (`MONITOR_ADMIN_USER` & `MONITOR_ADMIN_PASSWORD`).
  - Implement admin RBAC validation checking active JWT against `ADMIN_EMAILS`.
  - Scaffold `(monitor)` directory layout with Sidebar and Top Navigation.
- **Verification:** Unauthorized requests receive HTTP 401; valid admin credentials grant dashboard shell.

---

### Phase 2: Autonomous Probing Engine & Service Probes
- **Objective:** Build background health probe workers that test all 12 services in parallel.
- **Deliverables:**
  - Create probe handlers in `src/lib/monitor/probes/` for Web, LaTeX, WebSocket, Supabase, Redis, S3, Groq, OpenRouter, Gemini, Razorpay, Resend, Twilio.
  - Implement `Promise.allSettled()` batch runner with non-blocking execution (<800ms).
  - Persist probe results to Upstash Redis sliding window buffer.
- **Verification:** Probes return real status codes, latencies, and healthy/degraded states.

---

### Phase 3: Realtime SSE Streaming & Overview Dashboard View
- **Objective:** Stream live telemetry to the browser and build the central Mission Control view.
- **Deliverables:**
  - Implement Server-Sent Events endpoint `/api/v1/monitor/stream`.
  - Build `/overview` page with status badge, 5 vital cards, 12-service status grid, and 24h latency chart.
  - Integrate Tremor + Radix UI interactive chart primitives.
- **Verification:** Browser displays live updating gauges and sparklines without page refresh.

---

### Phase 4: Infrastructure, Database & Cache Views
- **Objective:** Build deep observability pages for EC2 host, Supabase DB pooler, and Upstash Redis.
- **Deliverables:**
  - Build `/infrastructure` page displaying CPU/RAM radial gauges, Docker container matrix, and Nginx stats.
  - Build `/database` page displaying PgBouncer pooler saturation and slow queries.
  - Build `/redis` and `/storage` pages displaying memory usage, BullMQ jobs, and S3 quota.
- **Verification:** Verified accuracy against `docker stats`, `pg_stat_activity`, and Upstash `INFO`.

---

### Phase 5: 12 Synthetic User Journey Probes
- **Objective:** Automate synthetic end-to-end user workflows on a 5-minute recurring schedule.
- **Deliverables:**
  - Implement 12 synthetic test suites in `src/lib/monitor/synthetics/`.
  - Build `/synthetics` UI displaying step-by-step progress, duration breakdown, and error logs.
  - Persist synthetic runs to `MonitorSyntheticRun`.
- **Verification:** All 12 synthetic workflows complete with green status and accurate latency breakdowns.

---

### Phase 6: Multi-Channel Alerting & Incident Management Desk
- **Objective:** Automate alert dispatching and provide an active outage response desk.
- **Deliverables:**
  - Implement alert rule evaluator with 3-consecutive-failure hysteresis and 30-minute deduplication.
  - Integrate Resend Email and Twilio SMS/WhatsApp dispatchers.
  - Build `/incidents` page with incident triage cards, SLA timers, acknowledgment buttons, and automated Markdown post-mortem generators.
- **Verification:** Triggered test alert successfully delivers SMS, Email, and creates incident in DB.

---

### Phase 7: Centralized Log Explorer, DNS Configuration & Production Hardening
- **Objective:** Complete the platform with structured log streaming, DNS setup, and security audits.
- **Deliverables:**
  - Build `/logs` page with log stream virtualized viewer, level filters, and search.
  - Implement automated daily rollup cron task (`0 2 * * *`) aggregating 1m ➔ 1h ➔ 1d metrics.
  - Add CNAME record `monitor` ➔ `cname.vercel-dns.com` in Namify DNS.
  - Execute end-to-end chaos test (simulating service restart and validating automated recovery).
- **Verification:** `https://monitor.resume-buddy.tech` is live, SSL secured, and operational.

---

# 11. Environment Configuration Template

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
