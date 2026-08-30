# Resume Buddy Monitoring Platform — Architecture & Implementation Plan

**Target System:** `monitor.resume-buddy.tech`  
**Classification:** Internal Administrative Observability, Telemetry & Incident Response Platform  
**Target File:** `docs/MONITORING_ARCHITECTURE_PLAN.md`  
**Deployment Model:** Standalone Isolated Application (`apps/monitor`) deployed independently to Vercel  
**Telemetry Engines:** AWS CloudWatch (Metrics, Logs Insights, Alarms, CWAgent) & Vercel Ecosystem (Vercel CLI, REST API, Speed Insights, Log Drains)  
**Authors / Roles:** Principal Site Reliability Engineer (SRE), Staff DevOps Engineer, Cloud Architect & Senior Full-Stack Engineer  
**Date:** August 30, 2026  
**Status:** Approved for Implementation

---

# 1. Executive Summary & Standalone Architecture

### 1.1 Mission & Scope
The **Resume Buddy Monitoring Platform** (`monitor.resume-buddy.tech`) is an autonomous, real-time observability, telemetry, and synthetic testing platform designed specifically for the distributed architecture of Resume Buddy v3. It provides zero-blindspot visibility across edge web traffic, compute instances, database transactions, caching layers, multi-tier AI inference pipelines, cloud storage, payment flows, and transactional notifications.

To provide enterprise-grade reliability and deep operational control:
- **AWS Infrastructure Stats:** All AWS EC2 Graviton host resources, Docker containers, EBS storage IOPS, S3 object storage metrics, and application logs are collected and analyzed via the **AWS CloudWatch Ecosystem** (`AWS/EC2`, `CWAgent`, `AWS/S3`, CloudWatch Logs Insights, and CloudWatch Alarms).
- **Frontend & Edge Stats:** All Next.js edge traffic, deployments, serverless function runtimes, Core Web Vitals, and runtime console logs are managed and streamed via the **Vercel Ecosystem** (Vercel CLI, Vercel REST API, Speed Insights, and Log Drains).

### 1.2 Zero-Conflict Standalone Application Principle
To guarantee **100% isolation** from the customer-facing application:
1. **Dedicated Monorepo Package (`apps/monitor`):** The monitoring application is built as an independent Next.js 16 application in `apps/monitor`, completely isolated from the primary root web application (`Resume_Buddy_v3`).
2. **Zero Code or Dependency Interference:** `apps/monitor` has its own `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.js`, and dependencies. Modifications, builds, or dependencies of the monitor will never impact customer checkout, AI resume creation, or LaTeX compilation.
3. **Independent Vercel Project Deployment:**
   - Primary App: Vercel Project `resume-buddy-v3` (Root: `./`) ➔ `https://www.resume-buddy.tech`
   - Monitoring App: Vercel Project `resume-buddy-monitor` (Root: `apps/monitor`) ➔ `https://monitor.resume-buddy.tech`
4. **Out-of-Band Probing & Telemetry:** Ingestion occurs asynchronously via AWS CloudWatch SDKs, Vercel APIs, and non-blocking synthetic workers without blocking or intercepting live user traffic.

---

### 1.3 High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Admin & SRE Clients"]
        AdminBrowser["Admin Browser\n(monitor.resume-buddy.tech)"]
        AdminCLI["SRE CLI Operator\n(Vercel CLI + AWS CLI)"]
    end

    subgraph StandaloneMonitorApp["Standalone Monitoring Application (apps/monitor)"]
        EdgeAuth["Edge Basic Auth & Reverse Proxy\n(Vercel Edge Middleware)"]
        DashboardUI["Observability UI\n(Next.js 16 + React 19 + Tremor / Radix UI)"]
        MonitorAPI["Monitoring API Server\n(/api/v1/monitor/*)"]
        SSEHub["Realtime SSE Hub\n(Live Telemetry Broadcaster)"]
        ProbeWorker["Synthetic & Health Probe Worker\n(Scheduled BullMQ / Upstash Engine)"]
        MetricAggregator["Metrics Aggregator & Rollup Engine\n(10s -> 1m -> 1h -> 1d)"]
        AlertManager["Alert & Escalation Engine\n(Multi-channel Router)"]
        VercelStreamAggregator["Vercel CLI & API Bridge\n(Deployments, Logs & Speed Insights)"]
        CloudWatchCollector["AWS CloudWatch Collector\n(Metrics, Alarms & Logs Insights)"]
    end

    subgraph VercelEcosystem["Vercel Global Edge Network (Frontend & Edge Layer)"]
        WebEdge["Main Next.js Frontend (Root ./)\n(www.resume-buddy.tech)"]
        VercelAPI["Vercel REST API\n(api.vercel.com/v6/deployments)"]
        VercelLogDrain["Vercel Log Drains & Speed Insights\n(Live Edge Telemetry)"]
        VercelCLIEngine["Vercel CLI Subsystem\n(vercel status / inspect / logs / rollback)"]
    end

    subgraph AWSEcosystem["AWS Cloud Infrastructure (ap-south-1 Mumbai)"]
        subgraph EC2Host["AWS Graviton EC2 (13.207.140.19 / api.resume-buddy.tech)"]
            NginxProxy["Nginx Reverse Proxy & SSL\n(Ports 80 / 443)"]
            LaTeXService["LaTeX Microservice\n(Fastify + Tectonic :8080)"]
            WSService["WebSocket Gateway\n(Socket.io Server :3001)"]
            CWAgent["AWS CloudWatch Unified Agent\n(Memory, Disk, Swap & Docker Stats)"]
        end

        S3Storage["AWS S3 Object Storage\n(resumebuddy-storage-277352717671)"]
        
        subgraph CloudWatchServices["AWS CloudWatch Observability Suite"]
            CWMetrics["CloudWatch Metrics\n(AWS/EC2, CWAgent, AWS/S3)"]
            CWLogs["CloudWatch Logs & Insights\n(/aws/ec2/resumebuddy/*)"]
            CWAlarms["CloudWatch Alarms & SNS\n(P1/P2 Incident Triggers)"]
        end
    end

    subgraph ManagedCloudServices["Managed Data & AI Infrastructure"]
        SupabaseDB["Supabase PostgreSQL 16\n(PgBouncer :6543 / Direct :5432)"]
        UpstashRedis["Upstash Serverless Redis 7\n(TLS Cache & BullMQ Queues)"]
        
        subgraph AITier["Multi-Tier AI Routing Infrastructure"]
            GroqAI["Tier 1: Groq API (GPT-OSS 20B)"]
            OpenRouterAI["Tier 2: OpenRouter API (Qwen 3.6)"]
            GeminiAI["Tier 3: Google Gemini (2.5 Flash)"]
            SarvamAI["Audio Tier: Sarvam AI (Indic Voice)"]
        end

        subgraph ExternalSaaS["Third-Party Integrations"]
            RazorpayAPI["Razorpay API & Webhooks"]
            ResendAPI["Resend Email API"]
            TwilioAPI["Twilio SMS & Voice (2FA & Alerts)"]
        end
    end

    subgraph NotificationChannels["Alert Notification Channels"]
        EmailAlerts["Resend Email (alerts@resume-buddy.tech)"]
        SMSAlerts["Twilio SMS & WhatsApp (Emergency On-Call)"]
        SlackWebhook["Slack / Discord Ops Webhooks"]
    end

    AdminBrowser -->|HTTPS Basic Auth + Admin JWT| EdgeAuth
    EdgeAuth --> DashboardUI
    DashboardUI <-->|REST APIs| MonitorAPI
    DashboardUI <-->|Server-Sent Events SSE| SSEHub
    AdminCLI -->|Direct CLI Management| VercelCLIEngine

    %% Vercel Telemetry Lineage
    VercelCLIEngine -.->|CLI Telemetry & Inspect| VercelStreamAggregator
    VercelAPI -->|Deployment Metadata & Analytics| VercelStreamAggregator
    VercelLogDrain -->|Live JSON Logs| MonitorAPI
    VercelStreamAggregator --> MetricAggregator

    %% AWS CloudWatch Telemetry Lineage
    CWAgent -->|Push Host OS Metrics & Docker Logs| CloudWatchServices
    EC2Host -->|Push Container Logs (awslogs driver)| CWLogs
    S3Storage -->|Storage & Request Telemetry| CWMetrics
    CWMetrics -->|GetMetricData (SigV4)| CloudWatchCollector
    CWLogs -->|CloudWatch Logs Insights API| CloudWatchCollector
    CWAlarms -->|SNS Webhook Notification| MonitorAPI
    CloudWatchCollector --> MetricAggregator

    %% Out-of-Band Synthetic Probes
    ProbeWorker -->|Active Health Probes| WebEdge
    ProbeWorker -->|Probes /healthz & Compile| NginxProxy
    NginxProxy --> LaTeXService
    NginxProxy --> WSService
    ProbeWorker -->|SQL Probes & Pool Depth| SupabaseDB
    ProbeWorker -->|RESP PING & Latency| UpstashRedis
    ProbeWorker -->|HeadBucket & Upload Test| S3Storage
    ProbeWorker -->|Inference Ping & Fallback| AITier
    ProbeWorker -->|Vendor API Health| ExternalSaaS

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
        VercelCLIUser["SRE Terminal (Vercel CLI)"]
    end

    subgraph VercelEdge["Vercel Global Edge Network"]
        MonitorApp["Vercel Project: resume-buddy-monitor\nRoot: apps/monitor\nDomain: monitor.resume-buddy.tech"]
        ProdApp["Vercel Project: resume-buddy-v3\nRoot: ./\nDomain: www.resume-buddy.tech"]
    end

    subgraph AWSRegion["AWS ap-south-1 (Mumbai)"]
        subgraph EC2["AWS Graviton2 EC2 (13.207.140.19)"]
            Nginx["Nginx Reverse Proxy (:443)"]
            DockerLaTeX["Docker: LaTeX Service (:8080)"]
            DockerWS["Docker: WebSocket (:3001)"]
            CWAgentHost["CloudWatch Agent (ARM64)"]
        end
        S3Bucket["AWS S3 Bucket\n(resumebuddy-storage-277352717671)"]
        CloudWatchSuite["AWS CloudWatch\n(Metrics, Logs Insights, Alarms)"]
    end

    subgraph CloudServices["Managed Cloud & SaaS Providers"]
        Supabase["Supabase PostgreSQL\n(AWS ap-northeast-2)"]
        Upstash["Upstash Redis Cluster\n(AWS ap-south-1)"]
        AIEndpoints["Groq / Gemini / OpenRouter\n(Global Anycast)"]
    end

    AdminUser -->|HTTPS :443 Basic Auth| MonitorApp
    VercelCLIUser -->|CLI Command Line| ProdApp
    MonitorApp -->|Vercel REST API + CLI bridge| ProdApp
    MonitorApp -->|HTTPS /healthz| Nginx
    Nginx --> DockerLaTeX
    Nginx --> DockerWS
    CWAgentHost -->|CloudWatch Telemetry Push| CloudWatchSuite
    MonitorApp -->|AWS SigV4 CloudWatch API| CloudWatchSuite
    MonitorApp -->|Postgres Wire SSL :6543| Supabase
    MonitorApp -->|TLS TCP :6379| Upstash
    MonitorApp -->|AWS SigV4 HTTPS S3| S3Bucket
    MonitorApp -->|HTTPS REST| AIEndpoints
```

### 2.1 Interaction Matrix & Network Routes

| Target Service | Physical Location | Probing Protocol | Network Path & Security | Auth Mechanism | Telemetry Payload Output |
|:---|:---|:---|:---|:---|:---|
| **Frontend Web & Edge** | Vercel Edge Global | Vercel CLI (`vercel inspect`, `vercel logs`), REST API (`/v6/deployments`), HTTPS (`/api/health`) | Public Edge CDN (`https://www.resume-buddy.tech`) / Vercel API Gateway | Vercel Auth Token (`VERCEL_TOKEN`) + Bearer Internal Token | Deployment state, Edge Bandwidth (GB), Function Execution Duration (ms), Speed Insights RUM, 4xx/5xx edge error rates |
| **AWS EC2 Host & OS** | AWS EC2 Graviton (`ap-south-1`) | AWS CloudWatch API (`GetMetricData`) & CloudWatch Agent | CloudWatch Telemetry Gateway (`monitoring.ap-south-1.amazonaws.com`) | AWS SigV4 IAM Credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) | `CPUUtilization`, `mem_used_percent`, `disk_used_percent`, `StatusCheckFailed`, `NetworkIn/Out`, `EBSRead/WriteOps` |
| **LaTeX Service** | AWS EC2 Graviton (`ap-south-1`) | HTTP/HTTPS (`/healthz`, `/v1/resume/latex/compile`) + CloudWatch Logs | Direct EIP (`13.207.140.19`) / `https://api.resume-buddy.tech` | Nginx SSL + Service Secret + AWS CloudWatch Logs API | Uptime, memory RSS, compile duration (p50/p95), Tectonic compilation failure rates |
| **WebSocket Hub** | AWS EC2 Graviton (`ap-south-1`) | WSS / Socket.io Polling Handshake + CloudWatch Logs | `https://api.resume-buddy.tech/socket.io/?EIO=4` | Socket handshake payload + AWS CloudWatch Logs API | Connected sockets, rooms, dropped frames, handshake latency |
| **Supabase DB** | Supabase AWS (`ap-northeast-2`) | TCP / Postgres Wire (`SELECT 1;`) | `aws-1-ap-northeast-2.pooler.supabase.com:6543` | SSL SCRAM-SHA-256 (`DATABASE_URL`) | Query latency, pooler saturation, deadlocks, slow query log |
| **Upstash Redis** | Upstash AWS (`ap-south-1`) | TLS TCP / Redis RESP (`PING`, `INFO`) | `rediss://together-crawdad-240298.upstash.io:6379` | AUTH Token (`REDIS_PASSWORD`) | Memory used, commands/sec, cache hit ratio, queue depth |
| **AWS S3 Bucket** | AWS `ap-south-1` | AWS CloudWatch Metrics (`AWS/S3`) + HeadBucket / PutObject REST | `https://s3.ap-south-1.amazonaws.com` | AWS SigV4 IAM Credentials | `BucketSizeBytes`, `NumberOfObjects`, `5xxErrors`, Presigned upload/download latency |
| **AI Providers** | Cloud APIs (Groq, Gemini, OpenRouter) | HTTPS JSON POST (Minimal Prompt Ping) | Global Anycast REST Endpoints | API Keys (`GROQ_API_KEY`, etc.) | Tokens generated, latency, fallback rate, provider cost ($) |
| **SaaS Providers** | Razorpay, Resend, Twilio | HTTPS REST Status Probes + Webhooks | Global Vendor APIs | Vendor API Tokens | API status, webhook latency, OTP delivery latency, bounce rate |

---

# 3. Telemetry Data Lineage ("Where the Info Comes From")

This section documents the exact sources, log streams, CloudWatch metrics, Vercel CLI commands, database queries, and response headers that feed into every monitoring widget.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TELEMETRY DATA LINEAGE MAP                                │
│                                                                                        │
│  SOURCE CATEGORY        EXACT EXTRACTION MECHANISM               METRIC DERIVED        │
│  ─────────────────      ───────────────────────────              ──────────────        │
│  AWS EC2 Host      ──►  AWS CloudWatch MetricData API      ──►  Host CPU%, StatusCheck │
│  EC2 OS & Memory   ──►  CWAgent (mem_used_percent/disk)    ──►  RAM % & NVMe Disk %    │
│  EC2 Logs & Docker ──►  CloudWatch Logs Insights (/aws/..) ──►  Docker RSS & App Logs  │
│  AWS S3 Storage    ──►  CloudWatch AWS/S3 BucketSizeBytes  ──►  S3 Footprint (GB)      │
│  Vercel Deployments──►  Vercel CLI `vercel inspect` / API  ──►  Deploy Status & Dur    │
│  Vercel Edge Logs  ──►  Vercel CLI `vercel logs` & Drains  ──►  Realtime Edge Logs     │
│  Vercel Analytics  ──►  Vercel Speed Insights API RUM     ──►  LCP, FID, CLS, INP     │
│  PostgreSQL DB     ──►  pg_stat_activity & statements      ──►  Pool Depth & Slow SQL  │
│  Upstash Redis     ──►  RESP INFO & CLIENT LIST            ──►  Commands/s & Memory    │
│  Fastify LaTeX     ──►  GET /healthz & Server-Timing       ──►  Compile p50/p95 (ms)   │
│  Socket.io Server  ──►  io.engine.clientsCount             ──►  Active WebSockets      │
│  AI Inference      ──►  usage.total_tokens & Date.now()    ──►  Tokens/s & Cost ($)    │
│  Payment Webhooks  ──►  POST /api/payments/webhook         ──►  Order Conversion Rate  │
│  Resend Webhooks   ──►  email.delivered & email.bounced   ──►  Delivery Rate %        │
│  Twilio Status     ──►  MessageStatus=delivered callback   ──►  OTP Latency (ms)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Data Lineage Matrix

| Metric Identifier | Exact Data Origin / Source | Extraction Mechanism | Parsing & Calculation Logic |
|:---|:---|:---|:---|
| **EC2 CPU & Status Checks** | AWS CloudWatch Metric `AWS/EC2:CPUUtilization` & `StatusCheckFailed` | `@aws-sdk/client-cloudwatch` `GetMetricDataCommand` with MetricName `CPUUtilization` (Namespace: `AWS/EC2`, Dimension: `InstanceId=i-0123456789abcdef0`) | 1-minute period Average (`CPUUtilization`) and Maximum (`StatusCheckFailed`) |
| **EC2 Memory, Disk & Swap**| AWS CloudWatch Agent `CWAgent` custom metrics | `@aws-sdk/client-cloudwatch` querying `mem_used_percent`, `disk_used_percent`, `swap_used_percent` | Direct percentage float values collected at 30s intervals by CWAgent daemon |
| **Docker & Microservice Logs**| CloudWatch Logs `/aws/ec2/resumebuddy/latex-service` & `.../websocket-service` | `@aws-sdk/client-cloudwatch-logs` running `StartQueryCommand` (Logs Insights) | `fields @timestamp, @message \| filter @message like /(ERROR\|WARN)/ \| stats count() by bin(5m)` |
| **S3 Storage Footprint & Ops**| AWS CloudWatch Metric `AWS/S3:BucketSizeBytes` & `NumberOfObjects` | `GetMetricDataCommand` with Dimension: `BucketName=resumebuddy-storage-277352717671`, `StorageType=StandardStorage` | Convert raw bytes to Gigabytes (GB) and count total PDF objects |
| **Vercel Deployments & State**| Vercel REST API (`GET https://api.vercel.com/v6/deployments`) & `vercel inspect` | Polled via Vercel Client using Bearer `VERCEL_TOKEN` | Parse `readyState` (`READY`, `BUILDING`, `ERROR`), `buildingAt`, and `readySubstate` |
| **Vercel Edge Live Logs** | Vercel CLI (`vercel logs --follow`) & Vercel Log Drain Webhook | Child process / Webhook streaming edge logs into SSE Broadcaster | Ingest timestamp, status code, request path, execution duration (ms), memory used (MB) |
| **Core Web Vitals (LCP/FID/CLS)**| Vercel Speed Insights API (`GET /v2/insights`) | Vercel Insights REST API queried for route paths | Compute 75th percentile values for LCP, FID, CLS, INP, FCP, TTFB |
| **Vercel Edge Bandwidth & Req**| Vercel Analytics API (`GET /v1/projects/{id}/analytics`) | Vercel Analytics REST API | Aggregate edge request count, cache hit %, and data egress (GB) |
| **LaTeX Compilation Latency** | Fastify microservice (`services/resume-latex-service`) | Response header `Server-Timing: compile;dur=82.4` and `GET /healthz` | Calculate moving average and p50/p95/p99 histograms |
| **WebSocket Connection Depth** | Socket.io server (`apps/websocket`) | Internal state: `io.of("/").sockets.size` and `io.sockets.adapter.rooms.size` | Polled via authenticated `GET /metrics` on internal loopback |
| **Database Pool Saturation** | Supabase PostgreSQL `pg_stat_activity` | Query: `SELECT count(*), state FROM pg_stat_activity GROUP BY state;` | Ratio of active vs idle connections against max pool limit (100) |
| **Slow Query Identification** | Postgres extension `pg_stat_statements` | Query: `SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;` | Extract SQL statement, average duration, and execution counts |
| **Redis Cache Efficiency** | Upstash Redis REST / RESP `INFO` | Command: `INFO stats` | `keyspace_hits / (keyspace_hits + keyspace_misses) * 100` |
| **AI Inference Tokens & Cost** | Groq / OpenRouter / Gemini API response | JSON response `usage.prompt_tokens` & `usage.completion_tokens` | `(prompt_tokens * input_rate) + (completion_tokens * output_rate)` |
| **Payment Success Ratio** | Razorpay Webhooks (`/api/payments/webhook`) | Event triggers: `payment.captured` vs `payment.failed` | `captured_count / (captured_count + failed_count) * 100` |
| **Email Deliverability Rate** | Resend Webhook Events (`/api/notifications/webhook`) | Event triggers: `email.delivered`, `email.bounced`, `email.complained` | `delivered_count / total_sent * 100` |
| **Twilio SMS / WhatsApp Latency**| Twilio Message Resource callbacks | Delta between `date_sent` and `date_updated` upon status `delivered` | Average delivery delta in milliseconds |
| **TLS Certificate Remaining** | TLS Socket handshake on port 443 + Vercel Domain API | `tls.connect({ host: 'api.resume-buddy.tech', port: 443 })` + `vercel domains inspect` | `(peerCertificate.valid_to - Date.now()) / (1000 * 60 * 60 * 24)` |

---

# 4. Probing State Machine & Failure Thresholds

```mermaid
stateDiagram-v2
    [*] --> HEALTHY: Initialize Monitoring
    
    HEALTHY --> DEGRADED: 1 Failed Probe OR Latency > Warning Threshold OR CloudWatch Warn Alarm
    DEGRADED --> HEALTHY: 2 Consecutive Successful Probes (< Healthy Latency)
    DEGRADED --> CRITICAL_DOWN: 3 Consecutive Failed Probes OR HTTP 5xx OR CloudWatch StatusCheckFailed
    
    CRITICAL_DOWN --> INVESTIGATING: Alert Dispatched to On-Call (Twilio SMS / Resend / Slack)
    INVESTIGATING --> MITIGATED: Hotfix Deployed / Vercel Rollback / Auto-Fallback Active
    MITIGATED --> HEALTHY: 5 Consecutive Successful Probes & Alarms Cleared
```

### 4.1 Probing Specifications Table

| Service Identifier | Probed Target & Assertion | Frequency | Timeout | Retry Count | Degraded Threshold | Failure / Critical Condition | Auto-Recovery Condition |
|:---|:---|:---:|:---:|:---:|:---|:---|:---|
| `vercel-frontend` | `GET https://www.resume-buddy.tech/api/health` ➔ HTTP 200 & `status: "ok"` | 15s | 3000ms | 2 | Latency > 1200ms or 1 failed probe | 3 consecutive failures or HTTP 5xx / Vercel build ERROR | 2 consecutive HTTP 200 (< 500ms) |
| `aws-cloudwatch-ec2`| CloudWatch `GetMetricData` (CPU, RAM, StatusChecks) | 30s | 5000ms | 2 | CPU > 75% OR RAM > 80% | `StatusCheckFailed > 0` OR CPU > 90% for 2 cycles | CPU < 65% and RAM < 75% |
| `latex-service` | `GET https://api.resume-buddy.tech/healthz` ➔ HTTP 200 & `uptime > 0` | 10s | 2500ms | 2 | Latency > 800ms | 3 consecutive failures or compilation timeout | 2 consecutive HTTP 200 (< 200ms) |
| `websocket-gateway`| Socket.io Polling Handshake ➔ HTTP 200 & `sid` returned | 15s | 3000ms | 2 | Handshake > 600ms | 3 consecutive handshake drops | 2 consecutive successful pings |
| `database-postgres`| `SELECT count(*) FROM "User";` execution time | 30s | 4000ms | 2 | Query latency > 450ms | Connection refused or timeout > 4s | 2 consecutive queries (< 100ms) |
| `redis-cache` | `PING` ➔ `PONG` & temporary key `SET/GET/DEL` | 15s | 2000ms | 2 | Latency > 400ms | Connection timeout or auth rejection | 2 consecutive PONG (< 150ms) |
| `aws-s3-storage` | CloudWatch `AWS/S3` metrics + `HeadBucket` probe | 60s | 5000ms | 2 | Operation > 1500ms | 403 Forbidden or 500 Internal / CloudWatch 5xxErrors > 1% | 2 consecutive clean write/delete |
| `ai-groq-primary` | Fast inference probe (token count = 5) | 45s | 4000ms | 1 | Latency > 2500ms | HTTP 429 (Rate limit) or 5xx | 2 consecutive responses (< 1000ms) |
| `ai-openrouter-sec`| Secondary model routing check | 60s | 5000ms | 1 | Latency > 3500ms | HTTP 429 or 502 Bad Gateway | 2 consecutive responses (< 1500ms) |
| `ai-gemini-fallback`| Gemini 2.5 Flash fallback health | 60s | 4000ms | 1 | Latency > 2000ms | API quota exhaustion / 5xx | 2 consecutive valid JSON returns |
| `ssl-certificates` | TLS Handshake + Vercel Domains API | 12h | 10000ms| 3 | Expiration within 14 days | Expiration within 3 days or invalid cert | Valid cert > 30 days remaining |
| `payments-razorpay`| Razorpay live credentials & orders API ping | 5m | 5000ms | 2 | Latency > 2000ms | HTTP 401/5xx | 2 consecutive valid responses |
| `email-resend` | Resend API domain verification status | 5m | 5000ms | 2 | Latency > 1500ms | HTTP 401 or domain unverified | Domain verified & API active |

---

# 5. UI Wireframes & Screen Layout Blueprints

The following wireframes provide exact visual references for frontend engineers implementing the monitoring dashboard in `apps/monitor` using Next.js 16 + Tremor + Radix UI.

### 5.1 Overview / Mission Control Wireframe (`apps/monitor/src/app/overview/page.tsx`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  RESUME BUDDY OBSERVABILITY  [LIVE STREAM ●]                     [Prod: ap-south-1]  [Admin: rajeev@tech] [⚙] |
+---------------------------------------------------------------------------------------------------------------+
|  OVERALL SYSTEM STATUS: [ ● ALL SYSTEMS FULLY OPERATIONAL ]                    Uptime (30d): 99.982%          |
+---------------------------------------------------------------------------------------------------------------+
|  VITAL METRICS & TELEMETRY                                                                                    |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+  +----------+ |
|  | Avg Edge Latency   |  | AWS EC2 CPU (CW)   |  | LaTeX Warm Latency |  | Active WebSockets  |  | AI Cost  | |
|  |   42 ms (Vercel)   |  |   14.2% (Graviton) |  |   82 ms (Tectonic) |  |   54 Connected     |  | $2.41/day| |
|  |   ▲ 2.1% (p95:110ms|  |   ■■■□□□□□□□ (14%) |  |   ▼ 4.2ms vs avg   |  |   12 Active Rooms  |  | 2.8M Tok | |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+  +----------+ |
+---------------------------------------------------------------------------------------------------------------+
|  SERVICE HEALTH MATRIX (REALTIME STATUS & LATENCY)                                                            |
|  +----------------------------------------------------------------------------------------------------------+ |
|  | [●] Vercel Edge (Next.js 16) 42ms | [●] AWS EC2 (CloudWatch)     14% | [●] LaTeX Engine (Fastify)   82ms      | |
|  | [●] WebSocket Gateway        18ms | [●] Supabase PostgreSQL      18ms | [●] Upstash Redis            12ms      | |
|  | [●] AWS S3 Bucket (CW)       94ms | [●] Groq (Tier 1 AI)        480ms | [●] OpenRouter (Tier 2 AI)  890ms      | |
|  | [●] Gemini 2.5 (Tier 3)    1120ms | [●] Razorpay Payments       210ms | [●] Resend Email            140ms      | |
|  +----------------------------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  LATENCY & TELEMETRY SPARKLINE (PAST 24 HOURS)                                                                |
|  1200ms |                                                                                                     |
|   800ms |                                             __/\_ (AI Inference Spike)                              |
|   400ms |   ----------------------------------------/------\--------------------------- (LaTeX Engine: 82ms)  |
|     0ms +---+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-------------+ |
|        00:00 02:00 04:00 06:00 08:00 10:00 12:00 14:00 16:00 18:00 20:00 22:00                               |
+---------------------------------------------------------------------------------------------------------------+
|  RECENT ALERTS & SYSTEM EVENTS (AWS CLOUDWATCH & VERCEL CLI)                                                  |
|  [ 16:04:12 ] INFO   [Vercel CLI] Deployment dpl_88b1990a promoted to Production (Build time: 42s).           |
|  [ 15:48:20 ] INFO   [AWS CloudWatch] MetricAlarm 'resumebuddy-ec2-cpu' evaluated: OK (14.2% < 85%).          |
|  [ 14:12:05 ] INFO   GitHub Actions Workflow #33306588158 (Deploy AWS Backend) completed successfully (1m 12s)|
+---------------------------------------------------------------------------------------------------------------+
```

---

### 5.2 Infrastructure & AWS CloudWatch Observability Wireframe (`/infrastructure`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  INFRASTRUCTURE OBSERVABILITY: AWS CloudWatch (ap-south-1 | Instance: i-0123456789abcdef0 | Graviton2 t4g.small)|
+---------------------------------------------------------------------------------------------------------------+
|  CLOUDWATCH METRICS & AGENT TELEMETRY (Live via @aws-sdk/client-cloudwatch)                                    |
|  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------+ |
|  | AWS/EC2 CPUUtilization  |  | CWAgent mem_used_percent|  | CWAgent disk_used_pct   |  | AWS/EC2 StatusCheck|
|  |       [ 14.2 % ]        |  |   584 MB / 2048 MB      |  |   8.4 GB / 30.0 GB      |  | System: OK (0)    | |
|  |  ( ) ( ) Graviton ARM64 |  |   [|||||.............]  |  |   [|||||||...........]  |  | Instance: OK (0)  | |
|  |  p95: 22.4% | Max: 38.1%|  |   28.5% Utilized        |  |   28.0% Utilized (EBS)  |  | Alarms: 0 Active  | |
|  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  DOCKER RUNTIME & CONTAINER LOG STREAMS (Ingested into CloudWatch Logs /aws/ec2/resumebuddy/*)                |
|  +----------------------+----------+-------------+------------+--------------+-----------+------------------+ |
|  | Container Name       | Status   | CPU Usage   | Memory RSS | Port Mapping | Restarts  | CloudWatch Stream| |
|  +----------------------+----------+-------------+------------+--------------+-----------+------------------+ |
|  | resumebuddy-latex    | UP (●)   | 4.2%        | 164 MB     | 127.0.0.1:8080| 0         | cw-latex-stream  | |
|  | resumebuddy-ws       | UP (●)   | 1.8%        | 88 MB      | 127.0.0.1:3001| 0         | cw-ws-stream     | |
|  +----------------------+----------+-------------+------------+--------------+-----------+------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  AWS S3 BUCKET METRICS (resumebuddy-storage-277352717671)                                                     |
|  +------------------------------------------------------+  +------------------------------------------------+ |
|  | Storage Size (CloudWatch AWS/S3 BucketSizeBytes)     |  | Object Count & Error Rate                      | |
|  | Standard Storage: 14.8 GB                            |  | Total Resume PDFs: 2,410 objects               | |
|  | 24h Data Egress: 3.2 GB                              |  | CloudWatch 5xxErrors: 0.00% (0 errors)         | |
|  | Presigned URL GetObject Latency: 94 ms               |  | HeadBucket Ping: 42 ms                         | |
|  +------------------------------------------------------+  +------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  CLOUDWATCH LOGS INSIGHTS REALTIME QUERY RUNNER                                                               |
|  Query: fields @timestamp, @message | filter @message like /(ERROR|WARN|Tectonic)/ | limit 50                  |
|  [ 16:11:02.1 ] INFO  [latex-service] Tectonic compiled document ID res_9921 in 82.4ms (Cache Hit)            |
|  [ 16:09:44.8 ] INFO  [websocket-service] Socket connection authorized: client_usr_882 (Room: mock-41)        |
+---------------------------------------------------------------------------------------------------------------+
```

---

### 5.3 Vercel Edge & Frontend Observability Wireframe (`/frontend`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  FRONTEND & EDGE OBSERVABILITY: Vercel Project `resume-buddy-v3`                                              |
+---------------------------------------------------------------------------------------------------------------+
|  VERCEL CLI & REST API TELEMETRY (api.vercel.com / vercel inspect / vercel status)                            |
|  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------+ |
|  | Active Deployment       |  | Edge Request Volume     |  | Edge Bandwidth (Egress) |  | Edge Cache Hit %  | |
|  |   dpl_99a8f102 (Ready)  |  |   84,210 requests/24h   |  |   4.12 GB / 24h         |  |   89.4% HIT       | |
|  |   Branch: main (Clean)  |  |   Error Rate: 0.02%     |  |   Vercel Free Quota: 4% |  |   Edge Compute: OK| |
|  |   Build Time: 48s       |  |   2xx: 99.8% | 5xx: 0%  |  |   Avg Payload: 48 KB    |  |   Edge Nodes: 18  | |
|  +-------------------------+  +-------------------------+  +-------------------------+  +-------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  CORE WEB VITALS (REAL USER MONITORING via Vercel Speed Insights API)                                         |
|  +--------------------------+--------------------------+--------------------------+-------------------------+ |
|  | LCP (Largest Contentful) | FID / INP (Interactivity)| CLS (Cumulative Shift)   | TTFB (Time to First Byte| |
|  |   0.82 s [ GOOD ● ]      |   18 ms [ GOOD ● ]       |   0.004 [ GOOD ● ]       |   112 ms [ GOOD ● ]     | |
|  +--------------------------+--------------------------+--------------------------+-------------------------+ |
+---------------------------------------------------------------------------------------------------------------+
|  VERCEL CLI ACTIONS & REMEDIATION DESK                                                                        |
|  [ ▷ Run `vercel status` ]   [ ▷ Inspect Deployment ]   [ ▷ Stream Live Logs ]   [ ⚠ One-Click Rollback ]     |
|  Active Production URL: https://www.resume-buddy.tech  |  Target Domain: Namify CNAME (cname.vercel-dns.com)   |
+---------------------------------------------------------------------------------------------------------------+
```

---

### 5.4 Centralized Realtime Log Explorer Wireframe (`/logs`)

```text
+---------------------------------------------------------------------------------------------------------------+
|  CENTRALIZED LOG EXPLORER                                                          [Auto-Scroll: ON] [Clear]  |
|  Log Provider: [ ● AWS CloudWatch Logs ]  [ ● Vercel Edge Live Stream ]   Search: [ "latex" / "429" ]         |
+---------------------------------------------------------------------------------------------------------------+
| TIME       | PROVIDER    | SERVICE    | LVL  | TRACE ID     | MESSAGE / STRUCTURED PAYLOAD                    |
|------------+-------------+------------+------+--------------+-------------------------------------------------|
| 16:09:12.4 | VERCEL CLI  | web-edge   | INFO | tr_99a8f102  | GET /api/health HTTP/1.1 200 OK - 12.4ms (bom1) |
| 16:09:10.1 | CLOUDWATCH  | latex-svc  | INFO | tr_44c1029e  | Compile request completed in 82.1ms (Tectonic)  |
| 16:08:44.2 | CLOUDWATCH  | ai-router  | WARN | tr_88b1990a  | Groq API returned 429 - routing to Tier 2       |
| 16:08:44.8 | CLOUDWATCH  | ai-router  | INFO | tr_88b1990a  | Tier 2 OpenRouter responded in 740ms (280 tok)  |
| 16:07:01.0 | CLOUDWATCH  | database   | INFO | db_pool_01   | PgBouncer connection pool pruned (Active: 12)   |
| 16:05:12.8 | CLOUDWATCH  | websocket  | INFO | ws_sock_42   | Room 'interview-room-41' closed cleanly.        |
+---------------------------------------------------------------------------------------------------------------+
```

---

# 6. Detailed End-to-End Synthetic Monitoring Workflows

```mermaid
sequenceDiagram
    autonumber
    actor SyntheticBot as Synthetic Monitor Agent (apps/monitor)
    participant VercelWeb as Next.js Web App (Vercel Edge)
    participant Auth as Session & JWT Tier
    participant DB as Supabase PostgreSQL
    participant LaTeX as AWS Graviton LaTeX Microservice
    participant S3 as AWS S3 Storage (CloudWatch Tracked)
    participant CW as AWS CloudWatch Metrics / Logs
    participant AI as Smart AI Router

    SyntheticBot->>VercelWeb: 1. Probes Homepage & Metadata
    VercelWeb-->>SyntheticBot: Returns 200 OK & Valid HTML (< 50ms)
    SyntheticBot->>Auth: 2. Authenticates Synthetic Test User
    Auth-->>SyntheticBot: Returns Valid JWT Session Token
    SyntheticBot->>AI: 3. Requests Resume Bullet Improvement
    AI-->>SyntheticBot: Returns AI Rewritten Response (< 1.5s)
    SyntheticBot->>LaTeX: 4. Compiles Sample LaTeX Source
    LaTeX-->>SyntheticBot: Returns Valid %PDF-1.5 Binary (< 200ms)
    SyntheticBot->>S3: 5. Tests S3 Presigned Upload & SHA-256 Check
    S3-->>SyntheticBot: Validates Object Lifecycle Integrity
    SyntheticBot->>DB: 6. Runs Read Verification Query
    DB-->>SyntheticBot: Verifies DB Pool Latency (< 100ms)
    SyntheticBot->>CW: 7. Ingests Host & Service Telemetry
    CW-->>SyntheticBot: Confirms CPUUtilization=14.2%, StatusCheckFailed=0
```

---

# 7. Alerting & Multi-Channel Escalation Matrix

### 7.1 Severity Classifications & SLAs

| Severity Level | Definition | Response SLA | Resolution Target | Notification Channels |
|:---|:---|:---:|:---:|:---|
| **P1 - CRITICAL** | Full system outage, core resume compilation failure, database unreachable, AWS CloudWatch `StatusCheckFailed > 0`, or payments blocked. | **< 5 Minutes** | **< 30 Minutes** | Twilio SMS + Twilio WhatsApp Voice Call + Urgent Email + Slack `#critical-ops` |
| **P2 - HIGH** | Degraded performance, secondary AI fallback active, CloudWatch EC2 CPU > 85%, Vercel Edge 5xx error rate > 2%, or WebSocket latency > 1000ms. | **< 15 Minutes**| **< 2 Hours** | Resend Email + Slack `#ops-alerts` |
| **P3 - MEDIUM** | High CPU (> 75%), CWAgent memory > 80%, SSL cert expiring in < 14 days, non-critical background queue delays. | **< 1 Hour** | **< 12 Hours** | Slack `#ops-alerts` + Dashboard Notification |
| **P4 - LOW / INFO**| Deployment finished via Vercel CLI, scheduled maintenance, weekly security audit clean. | Informational | N/A | Daily Email Digest + Dashboard Stream |

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
             ┌──────────────────────────────────────────────────┐
             │ Layer 3: Cloud Provider Security Credentials     │
             │ AWS SigV4 (CloudWatch/S3) + VERCEL_TOKEN (CLI/API)│
             └────────────────────────┬─────────────────────────┘
                                       │ (Pass)
                                       ▼
                      [ 200 OK: Access Monitor GUI ]
```

---

# 9. Database Schema Design (Prisma Data Model)

```prisma
// ============================================================================
// Monitor Models for Observability, CloudWatch Alarms & Vercel Deployments
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
  serviceKey      String        // e.g. "vercel-edge", "aws-ec2", "latex", "websocket", "supabase", "redis", "s3", "groq"
  serviceName     String        // e.g. "AWS EC2 Graviton (CloudWatch)", "Vercel Edge Frontend"
  status          ServiceStatus @default(HEALTHY)
  latencyMs       Float
  statusCode      Int?
  errorMessage    String?
  metadata        Json?         // Stores CloudWatch metrics (CPU, RAM) or Vercel deployment UID
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
  cpuUtilization  Float?        // Ingested from AWS CloudWatch
  memoryUsagePct  Float?        // Ingested from CWAgent
  bandwidthBytes  BigInt?       // Ingested from Vercel Analytics

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

model MonitorVercelDeployment {
  id              String        @id @default(cuid())
  deploymentId    String        @unique // e.g. "dpl_88b1990a"
  url             String
  name            String
  state           String        // "READY", "BUILDING", "ERROR", "CANCELED"
  buildDurationMs Int?
  creatorEmail    String?
  commitSha       String?
  commitMessage   String?
  deployedAt      DateTime      @default(now())

  @@index([state, deployedAt])
}

model MonitorCloudWatchAlarmEvent {
  id              String        @id @default(cuid())
  alarmName       String        // e.g. "resumebuddy-ec2-cpu-high"
  oldState        String        // "OK", "ALARM", "INSUFFICIENT_DATA"
  newState        String
  reason          String
  timestamp       DateTime      @default(now())

  @@index([alarmName, timestamp])
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
  actor       String          // "CloudWatch Alarm Engine" or "Vercel CLI" or "Admin User"
  eventType   String          // "TRIGGERED", "ACKNOWLEDGED", "NOTE_ADDED", "RESOLVED"
  createdAt   DateTime        @default(now())

  @@index([incidentId, createdAt])
}

model MonitorAuditLog {
  id          String    @id @default(cuid())
  adminEmail  String
  action      String    // "ACK_INCIDENT", "VERCEL_ROLLBACK", "RESTART_CONTAINER"
  target      String?
  ipAddress   String?
  userAgent   String?
  payload     Json?
  createdAt   DateTime  @default(now())

  @@index([adminEmail, createdAt])
}
```

---

# 10. Standalone Project Directory Layout (`apps/monitor`)

```text
apps/monitor/
├── package.json                   # Independent dependencies (Next 16, React 19, Tremor, @aws-sdk/client-cloudwatch, @aws-sdk/client-cloudwatch-logs)
├── next.config.mjs                # Standalone Next.js compiler config with standalone output
├── tsconfig.json                  # Isolated TypeScript config targeting ES2022
├── tailwind.config.js             # Dedicated Tailwind configuration with Tremor theme tokens
├── postcss.config.mjs             # Dedicated PostCSS config
├── vercel.json                    # Vercel project deployment manifest
├── .env.example                   # Template of monitoring environment variables
├── middleware.ts                  # Edge Basic Auth & Admin RBAC verification middleware
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with sidebar navigation, breadcrumbs & status badge
│   │   ├── page.tsx               # Entry point (auto-redirects to /overview)
│   │   ├── overview/page.tsx      # Main Mission Control Dashboard
│   │   ├── infrastructure/page.tsx# AWS CloudWatch EC2 Graviton & Nginx metrics view
│   │   ├── frontend/page.tsx      # Vercel Edge, Speed Insights & Deployments view
│   │   ├── backend/page.tsx       # LaTeX Engine & WebSocket Gateway view
│   │   ├── database/page.tsx      # Supabase PostgreSQL Pooler saturation view
│   │   ├── redis/page.tsx         # Upstash Redis & BullMQ jobs view
│   │   ├── storage/page.tsx       # AWS S3 CloudWatch quota & latency view
│   │   ├── ai-providers/page.tsx  # Multi-tier AI Router telemetry & leaderboard
│   │   ├── payments/page.tsx      # Razorpay live transactions view
│   │   ├── notifications/page.tsx # Resend email & Twilio OTP deliverability view
│   │   ├── deployments/page.tsx   # GitHub Actions CI/CD runs & Vercel CLI deployment view
│   │   ├── synthetics/page.tsx    # 12 Synthetic user journey test matrix view
│   │   ├── logs/page.tsx          # Realtime dual-pane CloudWatch & Vercel log explorer view
│   │   ├── incidents/page.tsx     # Active incident desk & post-mortem editor
│   │   ├── alerts/page.tsx        # CloudWatch Alarms & threshold manager
│   │   ├── audit-logs/page.tsx    # Tamper-evident admin action log
│   │   ├── settings/page.tsx      # Probe intervals & integration key settings
│   │   │
│   │   └── api/v1/
│   │       ├── monitor/
│   │       │   ├── health/route.ts       # Health endpoint of the monitor itself
│   │       │   ├── stream/route.ts       # Realtime Server-Sent Events SSE stream
│   │       │   └── trigger-probe/route.ts# Manual probe execution trigger
│   │       ├── ingest/
│   │       │   ├── cloudwatch/route.ts   # SNS webhook receiver for CloudWatch Alarms
│   │       │   └── vercel/route.ts       # Vercel Log Drain structured JSON receiver
│   │       └── vercel-actions/
│   │           ├── rollback/route.ts     # Triggers Vercel CLI rollback on incident
│   │           └── inspect/route.ts      # Queries deployment metadata via Vercel API
│   │
│   ├── components/
│   │   ├── sidebar.tsx            # Modern collapsible navigation sidebar
│   │   ├── header.tsx             # Top navigation with live stream indicator and clock
│   │   ├── status-badge.tsx       # Animated pulsing status indicator
│   │   ├── cloudwatch-chart.tsx   # Interactive CloudWatch metrics visualizer
│   │   ├── vercel-deploy-card.tsx # Vercel deployment card with inspect/rollback actions
│   │   ├── incident-card.tsx      # Incident triage card with Ack button
│   │   ├── synthetic-stepper.tsx  # Step-by-step workflow timeline
│   │   ├── dual-log-viewer.tsx    # Dual-pane CloudWatch Logs & Vercel CLI log streamer
│   │   └── gauge-widget.tsx       # Radial CPU/Memory utilization gauge
│   │
│   ├── lib/
│   │   ├── aws/
│   │   │   ├── cloudwatch.ts      # AWS SDK CloudWatch client (GetMetricData, MetricAlarms)
│   │   │   └── cloudwatch-logs.ts # AWS SDK CloudWatch Logs Insights query engine
│   │   ├── vercel/
│   │   │   ├── vercel-cli.ts      # Vercel CLI execution wrapper (status, inspect, logs, rollback)
│   │   │   └── vercel-api.ts      # Vercel REST API client (deployments, analytics, insights)
│   │   ├── probes/                # Autonomous service probe executors
│   │   │   ├── aws-cloudwatch.probe.ts # Ingests EC2 CPU, RAM, Disk, StatusCheck metrics
│   │   │   ├── vercel-edge.probe.ts    # Ingests Vercel deployment state & Speed Insights
│   │   │   ├── latex.probe.ts     # LaTeX compilation probe
│   │   │   ├── websocket.probe.ts # Socket.io handshake probe
│   │   │   ├── database.probe.ts  # Postgres pooler query probe
│   │   │   ├── redis.probe.ts     # Upstash Redis latency probe
│   │   │   ├── s3.probe.ts        # S3 object upload/download probe
│   │   │   └── ai.probe.ts        # Smart AI router fallback probe
│   │   ├── synthetics/            # 12 End-to-End synthetic workflows
│   │   ├── alerts/                # Alert rule evaluator & notification dispatcher
│   │   └── sse/                   # Server-Sent Events subscription hub
│   │
│   └── types/
│       └── monitor.ts             # Complete TypeScript domain contracts
```

---

# 11. Operational Guide for Vercel CLI & AWS CloudWatch Setup

### 11.1 Vercel CLI Operational & Automation Guide

The SRE team and the automated monitoring backend interact with the Vercel Edge infrastructure using the Vercel CLI (`vercel` / `npx vercel`) and the Vercel REST API.

#### Key Vercel CLI Commands for Telemetry & Ops:

```bash
# 1. Check Project Status & Active Production Deployment
npx vercel status --token=$VERCEL_TOKEN

# 2. Deeply Inspect a Production Deployment (Regions, Routes, Environment)
npx vercel inspect https://www.resume-buddy.tech --token=$VERCEL_TOKEN

# 3. Stream Live Edge Runtime Logs in Real Time (Last 100 entries or follow)
npx vercel logs www.resume-buddy.tech -n 100 --token=$VERCEL_TOKEN
npx vercel logs www.resume-buddy.tech --follow --token=$VERCEL_TOKEN

# 4. Environment Variable Verification & Drift Check
npx vercel env ls --token=$VERCEL_TOKEN

# 5. Domain & SSL Status Inspection
npx vercel domains inspect monitor.resume-buddy.tech --token=$VERCEL_TOKEN

# 6. Deploy apps/monitor Standalone Project to Production
cd apps/monitor
npx vercel link --project resume-buddy-monitor --yes --token=$VERCEL_TOKEN
npx vercel --prod --token=$VERCEL_TOKEN

# 7. Automated Incident Rollback (Executed on critical P1 incidents)
npx vercel rollback [PREVIOUS_DEPLOYMENT_ID] --token=$VERCEL_TOKEN --yes
```

---

### 11.2 AWS CloudWatch Agent & EC2 Telemetry Configuration

To collect deep operating system metrics (Memory %, Disk %, Swap %, and Docker container logs) from the AWS EC2 Graviton instance (`13.207.140.19`):

#### 1. CloudWatch Unified Agent Configuration (`/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`):

```json
{
  "agent": {
    "metrics_collection_interval": 30,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 30,
        "totalcpu": true
      },
      "mem": {
        "measurement": ["mem_used_percent", "mem_available", "mem_total"],
        "metrics_collection_interval": 30
      },
      "disk": {
        "measurement": ["disk_used_percent", "disk_free"],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      },
      "swap": {
        "measurement": ["swap_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/resumebuddy/nginx/access",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/resumebuddy/nginx/error",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
```

#### 2. Docker Compose CloudWatch `awslogs` Logging Driver (`docker-compose.backend.yml`):

```yaml
services:
  latex-service:
    build:
      context: ./services/resume-latex-service
      dockerfile: Dockerfile
    container_name: resumebuddy-latex
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "ap-south-1"
        awslogs-group: "/aws/ec2/resumebuddy/latex-service"
        awslogs-stream: "latex-container"

  websocket-service:
    build:
      context: ./apps/websocket
      dockerfile: Dockerfile
    container_name: resumebuddy-ws
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "ap-south-1"
        awslogs-group: "/aws/ec2/resumebuddy/websocket-service"
        awslogs-stream: "ws-container"
```

#### 3. CloudWatch IAM Least-Privilege Policy (`ResumeBuddyCloudWatchPolicy`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "logs:StartQuery",
        "logs:GetQueryResults",
        "logs:StopQuery",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### 11.3 DNS Configuration Table (Namify `manage.get.tech`)

| Record Type | Host Name | Target / Destination Value | Suggested TTL | Purpose |
|:---:|:---:|:---:|:---:|:---|
| **CNAME** | `monitor` | `cname.vercel-dns.com` | 3600 (1 hr) | Points `monitor.resume-buddy.tech` to Vercel Global Edge |
| **A** | `api` | `13.207.140.19` | 3600 (1 hr) | Points `api.resume-buddy.tech` to AWS Graviton EC2 |
| **CNAME** | `www` | `cname.vercel-dns.com` | 3600 (1 hr) | Points `www.resume-buddy.tech` to primary Vercel app |

---

# 12. Phased Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              7-PHASE IMPLEMENTATION TIMELINE                           │
│                                                                                        │
│   Phase 1: Scaffold apps/monitor & Edge Basic Auth ──► Days 1–2 (Estimated: 16h)       │
│   Phase 2: AWS CloudWatch SDK & Vercel API Bridge ───► Days 3–4 (Estimated: 16h)       │
│   Phase 3: Realtime SSE Streaming & Overview UI ─────► Days 5–6 (Estimated: 16h)       │
│   Phase 4: Deep Infrastructure, Database & Cache ────► Days 7–8 (Estimated: 16h)       │
│   Phase 5: 12 Synthetic User Journey Probes ────────► Days 9–10 (Estimated: 16h)      │
│   Phase 6: Multi-Channel Alerting & CloudWatch Alarms► Days 11–12 (Estimated: 16h)     │
│   Phase 7: Log Explorer, DNS & Production Deploy ────► Days 13–14 (Estimated: 16h)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Phase Details:
1. **Phase 1 (Scaffold `apps/monitor` & Edge Basic Auth):** Create `apps/monitor` with independent `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.js`, edge Basic Auth middleware, and Prisma models.
2. **Phase 2 (AWS CloudWatch SDK & Vercel API Integration):** Implement CloudWatch Metrics client (`@aws-sdk/client-cloudwatch`), CloudWatch Logs Insights engine, and Vercel CLI/API bridge (`src/lib/vercel/vercel-cli.ts`).
3. **Phase 3 (Realtime SSE & Overview Dashboard):** Implement `/api/v1/monitor/stream` and the `/overview` dashboard with Tremor charts and live telemetry.
4. **Phase 4 (Deep Infrastructure Views):** Build `/infrastructure` (CloudWatch EC2 metrics), `/frontend` (Vercel deployments & Speed Insights), `/database`, `/redis`, `/storage`, and `/ai-providers` pages.
5. **Phase 5 (12 Synthetic User Journeys):** Automate end-to-end user workflows on a 5-minute recurring schedule.
6. **Phase 6 (Multi-Channel Alerting & Incident Desk):** Integrate CloudWatch Alarms SNS webhook, Resend Email, and Twilio SMS/WhatsApp with alert deduplication and post-mortem generation.
7. **Phase 7 (Production Vercel Deployment):** Configure Namify CNAME DNS record, run `npx vercel --prod` from `apps/monitor`, and verify `https://monitor.resume-buddy.tech`.

---

# 13. Environment Configuration Template

```env
# ==============================================================================
# Resume Buddy Monitoring Platform Environment Variables (apps/monitor/.env)
# ==============================================================================

# Authentication & Security
MONITOR_ADMIN_USER=admin
MONITOR_ADMIN_PASSWORD=CHANGE_THIS_STRONG_RANDOM_PASSWORD_64_CHARS
ADMIN_EMAILS="kavalarajeev34@gmail.com"
JWT_SECRET="YOUR_STRONG_RANDOM_JWT_SECRET_AT_LEAST_32_CHARS"

# Vercel CLI & REST API Integration
VERCEL_TOKEN="YOUR_VERCEL_API_TOKEN"
VERCEL_ORG_ID="YOUR_VERCEL_ORG_OR_TEAM_ID"
VERCEL_PROJECT_ID="YOUR_VERCEL_PROJECT_ID"
NEXT_PUBLIC_VERCEL_PROD_URL="https://www.resume-buddy.tech"

# AWS CloudWatch Telemetry & EC2 Infrastructure
AWS_REGION="ap-south-1"
AWS_EC2_INSTANCE_ID="i-0123456789abcdef0"
AWS_CLOUDWATCH_NAMESPACE="CWAgent"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_S3_BUCKET="resumebuddy-storage-277352717671"

# Production Service Endpoints to Probe
PROBE_TARGET_WEB_URL="https://www.resume-buddy.tech"
PROBE_TARGET_BACKEND_URL="https://api.resume-buddy.tech"
PROBE_TARGET_EC2_HOST="13.207.140.19"

# Data Persistence & Cache
DATABASE_URL="postgresql://postgres.USER:PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
REDIS_URL="rediss://default:YOUR_UPSTASH_REDIS_PASSWORD@together-crawdad-240298.upstash.io:6379"

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
