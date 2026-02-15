# ResumeBuddy 2.0 - Complete Architecture Transformation

## Executive Summary

This document outlines the complete transformation of ResumeBuddy from a Firebase-dependent SaaS to a **fully self-hosted, production-grade platform** built entirely from scratch. The goal is to eliminate all third-party auth/database dependencies (Firebase, Supabase) while maintaining enterprise-level scalability, security, and performance.

**Current State**: Next.js 16 + Firebase Auth + Firestore + Razorpay  
**Target State**: Next.js 16 + Custom Auth + PostgreSQL + Self-hosted Stack

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Target Architecture Vision](#2-target-architecture-vision)
3. [Core Infrastructure Changes](#3-core-infrastructure-changes)
4. [Custom Authentication System](#4-custom-authentication-system)
5. [Database Layer (PostgreSQL)](#5-database-layer-postgresql)
6. [API Gateway & Backend Services](#6-api-gateway--backend-services)
7. [File Storage Solution](#7-file-storage-solution)
8. [Caching Infrastructure](#8-caching-infrastructure)
9. [Job Queue & Background Processing](#9-job-queue--background-processing)
10. [Real-time Features](#10-real-time-features)
11. [Observability & Monitoring](#11-observability--monitoring)
12. [Security Hardening](#12-security-hardening)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Migration Strategy](#14-migration-strategy)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Cost Analysis](#16-cost-analysis)

---

## 1. Current Architecture Analysis

### 1.1 Current Dependencies to Replace

| Component | Current Solution | Issues | Replacement Strategy |
|-----------|-----------------|--------|---------------------|
| **Authentication** | Firebase Auth | Vendor lock-in, limited customization, cold starts | Custom JWT + Sessions |
| **Database** | Firestore (NoSQL) | Limited querying, expensive at scale, no relations | PostgreSQL + Prisma ORM |
| **File Storage** | Firebase Storage | Tied to Firebase, limited CDN options | MinIO (S3-compatible) or local FS |
| **Real-time** | Firestore listeners | Tied to Firestore | WebSocket server (Socket.io/ws) |
| **Payments** | Razorpay | Keep this - works well | Keep Razorpay (already decoupled) |

### 1.2 Current Data Flow (Firebase-Dependent)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

User → Next.js App → Firebase Auth (SDK)
                   ↓
              Server Actions → Firestore SDK → Google Cloud (Firestore)
                   ↓
              AI Providers (Groq/Gemini/OpenRouter)
                   ↓
              LaTeX Service (Docker)

Problems:
• Firebase SDK adds 100KB+ to bundle
• Cold starts on Firebase Functions
• Firestore costs scale poorly (reads/writes)
• Limited query capabilities (no JOINs, aggregations)
• Vendor lock-in for auth tokens
• Real-time subscriptions are expensive
```

### 1.3 Files Requiring Major Changes

```
HIGH IMPACT (Complete Rewrite):
├── src/lib/firebase.ts           → DELETE (replace with custom DB client)
├── src/lib/firestore.ts          → REWRITE to PostgreSQL
├── src/context/auth-context.tsx  → REWRITE custom auth hooks
├── src/lib/subscription-service.ts → REWRITE to PostgreSQL queries
├── src/lib/rate-limiter.ts       → REWRITE to Redis-backed
├── middleware.ts                 → UPDATE for custom JWT

MEDIUM IMPACT (Significant Updates):
├── src/app/actions.ts            → UPDATE DB calls
├── src/app/api/razorpay/*        → UPDATE user lookup
├── src/lib/local-storage.ts      → Keep (client-side)
├── src/lib/fast-auth.ts          → UPDATE to custom tokens

LOW IMPACT (Minor Updates):
├── src/ai/*                      → Minimal changes
├── src/components/*              → UI changes for new auth
└── services/resume-latex-service → No changes needed
```

---

## 2. Target Architecture Vision

### 2.1 New Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESUMEBUDDY 2.0 ARCHITECTURE                          │
│                     (100% Self-Hosted, No Firebase/Supabase)                 │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────┐
                            │   NGINX/Traefik  │
                            │   (Reverse Proxy │
                            │    + SSL + WAF)  │
                            └────────┬─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
           ┌────────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐
           │   Next.js App  │ │  WebSocket  │ │ LaTeX       │
           │   (Port 9002)  │ │  Server     │ │ Service     │
           │                │ │  (Port 3001)│ │ (Port 8080) │
           │  - App Router  │ │             │ │             │
           │  - Server      │ │  - Real-time│ │ - PDF Gen   │
           │    Actions     │ │    updates  │ │ - Caching   │
           │  - API Routes  │ │  - Presence │ │             │
           └───────┬────────┘ └──────┬──────┘ └─────────────┘
                   │                 │
                   │     ┌───────────┴───────────┐
                   │     │                       │
           ┌───────▼─────▼────┐          ┌──────▼──────┐
           │     PostgreSQL   │          │    Redis    │
           │    (Port 5432)   │          │ (Port 6379) │
           │                  │          │             │
           │  - Users         │          │ - Sessions  │
           │  - Subscriptions │          │ - Rate Limit│
           │  - Usage Data    │          │ - Cache     │
           │  - Interviews    │          │ - Job Queue │
           │  - Payments      │          │ - Pub/Sub   │
           └──────────────────┘          └─────────────┘
                   │
           ┌───────▼──────────┐
           │   MinIO Storage  │
           │   (Port 9000)    │
           │                  │
           │  - Resumes (PDF) │
           │  - Profile Photos│
           │  - Exports       │
           └──────────────────┘
```

### 2.2 Technology Stack Decision Matrix

| Layer | Technology | Why This Choice |
|-------|------------|-----------------|
| **Web Framework** | Next.js 16 (App Router) | Keep current - excellent DX, SSR, RSC |
| **Database** | PostgreSQL 16 | ACID, relations, JSON support, extensions |
| **ORM** | Prisma 5 | Type-safe, migrations, great DX |
| **Cache/Sessions** | Redis 7 | Fast, pub/sub, sorted sets for rate limits |
| **Auth** | Custom (Jose + bcrypt) | Full control, no vendor lock-in |
| **File Storage** | MinIO (S3-compatible) | Self-hosted S3, unlimited storage |
| **Job Queue** | BullMQ (Redis-based) | Reliable, retries, scheduling |
| **Real-time** | Socket.io | Battle-tested, fallback transports |
| **Email Service** | Resend / Nodemailer | Transactional emails, templates |
| **WhatsApp OTP** | WhatsApp Business API (via Twilio/Gupshup) | Phone verification, notifications |
| **SMS Fallback** | Twilio / MSG91 | OTP delivery when WhatsApp unavailable |
| **Reverse Proxy** | Traefik / NGINX | Auto SSL, load balancing |
| **Containerization** | Docker + Compose | Consistent environments |
| **Orchestration** | Docker Swarm / K8s (later) | Scale when needed |

### 2.3 Notification & Messaging Use Cases

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                     NOTIFICATION CHANNELS & USE CASES                          │
└───────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║                           📱 WHATSAPP NOTIFICATIONS                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 1. OTP Authentication      │ Send 6-digit verification code for login       ║
║ 2. Welcome Message         │ Greet new users with onboarding tips           ║
║ 3. Login Alert             │ Notify user of new device/location login       ║
║ 4. Subscription Confirmed  │ Pro upgrade confirmation with benefits         ║
║ 5. Export Ready            │ Notify when PDF resume is ready (with link)    ║
║ 6. Interview Reminder      │ Remind about scheduled interview practice      ║
║ 7. Daily Resume Tip        │ Send daily career/resume improvement tips      ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                            📧 EMAIL NOTIFICATIONS                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 1. Welcome Email           │ Rich HTML onboarding with feature highlights   ║
║ 2. Email Verification      │ 6-digit code + verification link               ║
║ 3. Password Reset          │ Secure reset code with expiry warning          ║
║ 4. Pro Subscription        │ Receipt, features unlocked, order details      ║
║ 5. Subscription Expiring   │ Reminder 7 days before Pro expires             ║
║ 6. Subscription Expired    │ Notice with renewal link                       ║
║ 7. Export Ready            │ Download link with 24hr expiry                 ║
║ 8. Analysis Complete       │ ATS score summary with detailed report link    ║
║ 9. Cover Letter Ready      │ Notification when AI cover letter is done      ║
║ 10. Account Activity       │ Suspicious login / security alerts             ║
║ 11. Daily Summary          │ Usage stats: analyses, exports, credits left   ║
║ 12. Weekly Digest          │ Feature highlights, tips, success stories      ║
║ 13. Feedback Request       │ NPS survey after 7 days of usage               ║
║ 14. Interview Reminder     │ Scheduled practice session reminder            ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                           📲 SMS NOTIFICATIONS (Fallback)                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 1. OTP Code                │ Fallback when WhatsApp delivery fails          ║
║ 2. Security Alert          │ Critical account security notifications        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Notification Priority & Rate Limits:
┌────────────────────┬──────────┬─────────────────────────────────────────────┐
│ Type               │ Priority │ Rate Limit                                  │
├────────────────────┼──────────┼─────────────────────────────────────────────┤
│ OTP / Verification │ HIGH     │ 3 per identifier per minute                 │
│ Security Alerts    │ HIGH     │ Immediate, no limit                         │
│ Transaction Emails │ MEDIUM   │ 100/minute                                  │
│ WhatsApp Messages  │ MEDIUM   │ 50/minute (WhatsApp API limits)             │
│ Marketing/Digest   │ LOW      │ Batched, sent during low-traffic hours      │
└────────────────────┴──────────┴─────────────────────────────────────────────┘
```

### 2.4 New Directory Structure

```
resumebuddy-v2/
├── apps/
│   ├── web/                      # Next.js Frontend + API
│   │   ├── src/
│   │   │   ├── app/              # App Router
│   │   │   ├── components/       # React Components
│   │   │   ├── hooks/            # Custom Hooks
│   │   │   ├── lib/              # Utilities
│   │   │   └── styles/           # CSS
│   │   ├── next.config.mjs
│   │   └── package.json
│   │
│   └── websocket/                # Real-time Server
│       ├── src/
│       │   ├── server.ts
│       │   ├── handlers/
│       │   └── middleware/
│       └── package.json
│
├── packages/
│   ├── database/                 # Prisma Schema + Client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── auth/                     # Authentication Library
│   │   ├── src/
│   │   │   ├── jwt.ts
│   │   │   ├── session.ts
│   │   │   ├── password.ts
│   │   │   ├── otp/
│   │   │   │   ├── whatsapp.ts
│   │   │   │   ├── sms.ts
│   │   │   │   └── email-otp.ts
│   │   │   ├── oauth/
│   │   │   │   ├── google.ts
│   │   │   │   └── github.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ai/                       # AI Engine (mostly unchanged)
│   │   ├── src/
│   │   │   ├── flows/
│   │   │   ├── providers/
│   │   │   ├── smart-router.ts
│   │   │   └── multi-provider.ts
│   │   └── package.json
│   │
│   ├── storage/                  # File Storage Client
│   │   ├── src/
│   │   │   ├── minio-client.ts
│   │   │   ├── local-client.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── queue/                    # Job Queue
│   │   ├── src/
│   │   │   ├── workers/
│   │   │   ├── jobs/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared/                   # Shared Types & Utils
│       ├── src/
│       │   ├── types/
│       │   ├── utils/
│       │   └── constants/
│       └── package.json
│
├── services/
│   └── resume-latex-service/     # Keep existing (no changes)
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.websocket
│   │   └── nginx/
│   │       └── nginx.conf
│   │
│   ├── scripts/
│   │   ├── setup.sh
│   │   ├── migrate.sh
│   │   └── backup.sh
│   │
│   └── terraform/                # Optional: IaC for cloud
│       ├── main.tf
│       └── variables.tf
│
├── turbo.json                    # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. Core Infrastructure Changes

### 3.1 Docker Compose Setup

Create `infrastructure/docker/docker-compose.yml`:

```yaml
version: '3.9'

services:
  # ============ PostgreSQL Database ============
  postgres:
    image: postgres:16-alpine
    container_name: resumebuddy-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-resumebuddy}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-resumebuddy}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-resumebuddy}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============ Redis Cache + Sessions ============
  redis:
    image: redis:7-alpine
    container_name: resumebuddy-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============ MinIO File Storage ============
  minio:
    image: minio/minio:latest
    container_name: resumebuddy-storage
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Console
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # ============ Next.js Web App ============
  web:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.web
    container_name: resumebuddy-web
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      MINIO_ENDPOINT: http://minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      JWT_SECRET: ${JWT_SECRET}
      GROQ_API_KEY: ${GROQ_API_KEY}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
    ports:
      - "9002:9002"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9002/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============ WebSocket Server ============
  websocket:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.websocket
    container_name: resumebuddy-ws
    restart: unless-stopped
    environment:
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      redis:
        condition: service_healthy

  # ============ LaTeX Service (Existing) ============
  latex:
    build:
      context: ../../services/resume-latex-service
      dockerfile: Dockerfile
    container_name: resumebuddy-latex
    restart: unless-stopped
    ports:
      - "8080:8080"
    deploy:
      resources:
        limits:
          memory: 1536M

  # ============ Reverse Proxy (Production) ============
  traefik:
    image: traefik:v3.0
    container_name: resumebuddy-proxy
    restart: unless-stopped
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
      - "8081:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    profiles:
      - production

volumes:
  postgres_data:
  redis_data:
  minio_data:
  letsencrypt:

networks:
  default:
    name: resumebuddy-network
```

### 3.2 Environment Variables

Create `.env.template`:

```bash
# ============ Database ============
DB_USER=resumebuddy
DB_PASSWORD=your_secure_password_here
DB_NAME=resumebuddy
DATABASE_URL=postgresql://resumebuddy:your_secure_password_here@localhost:5432/resumebuddy

# ============ Redis ============
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:your_redis_password_here@localhost:6379

# ============ MinIO Storage ============
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_minio_secret_here
MINIO_BUCKET=resumebuddy

# ============ Authentication ============
JWT_SECRET=your_jwt_secret_min_32_chars_here
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
SESSION_COOKIE_NAME=rb_session
SESSION_TTL=604800  # 7 days in seconds

# ============ OAuth Providers ============
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ============ Email Service (Resend / SendGrid / SMTP) ============
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@resumebuddy.com
EMAIL_FROM_NAME=ResumeBuddy
# Alternative: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# ============ WhatsApp Business API ============
# Option 1: Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Option 2: Gupshup WhatsApp
GUPSHUP_API_KEY=your_gupshup_api_key
GUPSHUP_APP_NAME=ResumeBuddy
GUPSHUP_SOURCE_NUMBER=917834811114

# Option 3: Meta WhatsApp Business API (Direct)
WHATSAPP_BUSINESS_PHONE_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# ============ SMS Fallback (Twilio / MSG91) ============
SMS_PROVIDER=twilio  # or 'msg91'
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=RBUDDY
MSG91_TEMPLATE_ID=your_template_id

# ============ AI Providers ============
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxx

# ============ Services ============
LATEX_SERVICE_URL=http://localhost:8080
WEBSOCKET_URL=ws://localhost:3001

# ============ Application ============
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development

# ============ Razorpay (Keep Existing) ============
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx

# ============ Production Only ============
ACME_EMAIL=admin@yourdomain.com
```

---

## 4. Custom Authentication System

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION SYSTEM                                 │
│                  (Multi-Method: Email, OAuth, OTP)                          │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │   Client     │
                         │   Browser    │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Next.js    │
                         │   Middleware │
                         └──────┬───────┘
                                │
     ┌──────────────┬───────────┼───────────┬──────────────┐
     │              │           │           │              │
┌────▼────┐  ┌──────▼──────┐ ┌──▼──┐ ┌──────▼──────┐ ┌─────▼─────┐
│ Email/  │  │  WhatsApp   │ │Magic│ │   Google    │ │  GitHub   │
│Password │  │    OTP      │ │Link │ │   OAuth     │ │  OAuth    │
└────┬────┘  └──────┬──────┘ └──┬──┘ └──────┬──────┘ └─────┬─────┘
     │              │           │           │              │
     │         ┌────▼────┐      │           │              │
     │         │ WhatsApp│      │           │              │
     │         │ Business│      │           │              │
     │         │   API   │      │           │              │
     │         └────┬────┘      │           │              │
     │              │           │           │              │
     └──────────────┴───────────┼───────────┴──────────────┘
                                │
                         ┌──────▼──────┐
                         │   Auth      │
                         │   Handler   │
                         └──────┬──────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
    ┌─────▼─────┐        ┌──────▼──────┐       ┌──────▼──────┐
    │  bcrypt   │        │    JWT      │       │   Redis     │
    │  (hash)   │        │   (jose)    │       │  Sessions   │
    └───────────┘        └─────────────┘       │  + OTP Store│
                                               └─────────────┘

Authentication Methods:
• Email/Password: Traditional signup with bcrypt hashing
• WhatsApp OTP: Phone verification via WhatsApp Business API
• Magic Link: Passwordless email login (6-digit code or link)
• Google OAuth: Social login with Google account
• GitHub OAuth: Social login for developers

Token Strategy:
• Access Token (JWT): 15 minutes, stored in memory
• Refresh Token: 7 days, httpOnly cookie + Redis
• Session ID: httpOnly cookie, backed by Redis
• OTP Codes: 6-digit, 5-minute TTL, stored in Redis
```

### 4.2 Database Schema for Auth

Add to `packages/database/prisma/schema.prisma`:

```prisma
// ============ Authentication Models ============

model User {
  id            String    @id @default(cuid())
  email         String?   @unique  // Optional for phone-only users
  emailVerified DateTime?
  phone         String?   @unique  // Phone number with country code
  phoneVerified DateTime?
  name          String?
  image         String?
  password      String?   // Null for OAuth/OTP users
  
  // OAuth
  accounts      Account[]
  
  // Auth
  sessions      Session[]
  refreshTokens RefreshToken[]
  passwordResetTokens PasswordResetToken[]
  
  // Business Logic
  subscription  Subscription?
  usageRecords  UsageRecord[]
  resumeData    ResumeData?
  interviews    Interview[]
  payments      Payment[]
  
  // Notification Preferences
  notifyEmail   Boolean   @default(true)
  notifyWhatsApp Boolean  @default(true)
  notifySMS     Boolean   @default(false)
  
  // Metadata
  role          Role      @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  @@map("users")
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("password_reset_tokens")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String  // "google", "github", "credentials", "whatsapp", "phone"
  providerAccountId String
  type              String  // "oauth", "credentials", "phone"
  
  // OAuth tokens (encrypted)
  accessToken       String?
  refreshToken      String?
  expiresAt         Int?
  tokenType         String?
  scope             String?
  idToken           String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  userAgent    String?
  ipAddress    String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expires   DateTime
  revoked   Boolean  @default(false)
  revokedAt DateTime?
  createdAt DateTime @default(now())
  userAgent String?
  ipAddress String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  type       VerificationType
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@index([email])
  @@map("password_reset_tokens")
}

enum Role {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum VerificationType {
  EMAIL
  PASSWORD_RESET
  TWO_FACTOR
}
```

### 4.3 JWT & Session Implementation

Create `packages/auth/src/jwt.ts`:

```typescript
import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// ============ Types ============

export interface TokenPayload extends JWTPayload {
  sub: string;        // User ID
  email: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============ Configuration ============

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

const ACCESS_TOKEN_TTL = '15m';   // 15 minutes
const REFRESH_TOKEN_TTL = '7d';   // 7 days

// ============ Token Generation ============

export async function generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuer('resumebuddy')
    .setAudience('resumebuddy-web')
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .setIssuer('resumebuddy')
    .setAudience('resumebuddy-web')
    .sign(REFRESH_SECRET);
}

export async function generateTokenPair(user: {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
}): Promise<TokenPair> {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier,
  };

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

// ============ Token Verification ============

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'resumebuddy',
      audience: 'resumebuddy-web',
    });

    if (payload.type !== 'access') return null;
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET, {
      issuer: 'resumebuddy',
      audience: 'resumebuddy-web',
    });

    if (payload.type !== 'refresh') return null;
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}

// ============ Token Extraction ============

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
```

Create `packages/auth/src/session.ts`:

```typescript
import { Redis } from 'ioredis';
import { nanoid } from 'nanoid';

// ============ Types ============

export interface SessionData {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  lastActivityAt: number;
}

// ============ Redis Client ============

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!);
  }
  return redis;
}

// ============ Session Management ============

const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

export async function createSession(data: Omit<SessionData, 'createdAt' | 'lastActivityAt'>): Promise<string> {
  const redis = getRedis();
  const sessionId = nanoid(32);
  
  const sessionData: SessionData = {
    ...data,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  // Store session
  await redis.setex(
    `${SESSION_PREFIX}${sessionId}`,
    SESSION_TTL,
    JSON.stringify(sessionData)
  );

  // Track user's sessions (for "sign out all devices")
  await redis.sadd(`${USER_SESSIONS_PREFIX}${data.userId}`, sessionId);

  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const redis = getRedis();
  const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  
  if (!data) return null;
  
  return JSON.parse(data) as SessionData;
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const redis = getRedis();
  const session = await getSession(sessionId);
  
  if (session) {
    session.lastActivityAt = Date.now();
    await redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session)
    );
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedis();
  const session = await getSession(sessionId);
  
  if (session) {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
    await redis.srem(`${USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  const redis = getRedis();
  const sessionIds = await redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`);
  
  if (sessionIds.length > 0) {
    const keys = sessionIds.map(id => `${SESSION_PREFIX}${id}`);
    await redis.del(...keys);
    await redis.del(`${USER_SESSIONS_PREFIX}${userId}`);
  }
}

export async function getUserActiveSessions(userId: string): Promise<SessionData[]> {
  const redis = getRedis();
  const sessionIds = await redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`);
  
  const sessions = await Promise.all(
    sessionIds.map(id => getSession(id))
  );
  
  return sessions.filter((s): s is SessionData => s !== null);
}
```

Create `packages/auth/src/password.ts`:

```typescript
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// ============ Password Validation Schema ============

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ============ Password Operations ============

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(e => e.message),
  };
}

// ============ Password Strength Meter ============

export function getPasswordStrength(password: string): 'weak' | 'fair' | 'good' | 'strong' {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 16) score++;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  if (score <= 5) return 'good';
  return 'strong';
}
```

### 4.4 OAuth Implementation

Create `packages/auth/src/oauth/google.ts`:

```typescript
import { OAuth2Client } from 'google-auth-library';

// ============ Types ============

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

// ============ Google OAuth Client ============

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
);

// ============ OAuth Flow ============

export function getGoogleAuthUrl(state: string): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
    prompt: 'consent',
  });
}

export async function getGoogleUser(code: string): Promise<GoogleUser> {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload()!;

  return {
    id: payload.sub,
    email: payload.email!,
    name: payload.name || '',
    picture: payload.picture || '',
    emailVerified: payload.email_verified || false,
  };
}

export async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date!,
  };
}
```

### 4.5 OTP Authentication (WhatsApp, SMS, Email)

Create `packages/auth/src/otp/types.ts`:

```typescript
// ============ OTP Types ============

export type OTPChannel = 'whatsapp' | 'sms' | 'email';
export type OTPPurpose = 'login' | 'verify' | 'password-reset' | '2fa';

export interface OTPRecord {
  id: string;
  identifier: string;      // phone number or email
  code: string;            // hashed OTP code
  channel: OTPChannel;
  purpose: OTPPurpose;
  attempts: number;        // failed verification attempts
  maxAttempts: number;     // max allowed attempts (default: 3)
  expiresAt: number;       // Unix timestamp
  createdAt: number;
  verifiedAt?: number;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    country?: string;
  };
}

export interface SendOTPResult {
  success: boolean;
  messageId?: string;
  expiresAt: number;
  retryAfter?: number;     // seconds until can request new OTP
  error?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
  attemptsRemaining?: number;
}
```

Create `packages/auth/src/otp/store.ts`:

```typescript
import { Redis } from 'ioredis';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { OTPRecord, OTPChannel, OTPPurpose } from './types';

// ============ Redis Client ============

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!);
  }
  return redis;
}

// ============ Constants ============

const OTP_PREFIX = 'otp:';
const OTP_RATE_PREFIX = 'otp_rate:';
const OTP_TTL = 5 * 60;           // 5 minutes
const OTP_RATE_WINDOW = 60;       // 1 minute rate limit window
const MAX_OTP_REQUESTS = 3;       // Max 3 OTPs per minute
const MAX_VERIFY_ATTEMPTS = 3;    // Max 3 verification attempts

// ============ OTP Generation ============

function generateOTPCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

// ============ OTP Storage Operations ============

export async function createOTP(
  identifier: string,
  channel: OTPChannel,
  purpose: OTPPurpose,
  metadata?: OTPRecord['metadata']
): Promise<{ code: string; record: OTPRecord } | { error: string }> {
  const redis = getRedis();
  const normalizedId = normalizeIdentifier(identifier, channel);
  
  // Rate limiting check
  const rateKey = `${OTP_RATE_PREFIX}${normalizedId}`;
  const requestCount = await redis.incr(rateKey);
  
  if (requestCount === 1) {
    await redis.expire(rateKey, OTP_RATE_WINDOW);
  }
  
  if (requestCount > MAX_OTP_REQUESTS) {
    const ttl = await redis.ttl(rateKey);
    return { error: `Too many requests. Try again in ${ttl} seconds.` };
  }
  
  // Invalidate any existing OTP for this identifier
  const existingKey = `${OTP_PREFIX}${normalizedId}`;
  await redis.del(existingKey);
  
  // Generate new OTP
  const code = generateOTPCode();
  const hashedCode = await bcrypt.hash(code, 10);
  
  const record: OTPRecord = {
    id: nanoid(),
    identifier: normalizedId,
    code: hashedCode,
    channel,
    purpose,
    attempts: 0,
    maxAttempts: MAX_VERIFY_ATTEMPTS,
    expiresAt: Date.now() + (OTP_TTL * 1000),
    createdAt: Date.now(),
    metadata,
  };
  
  await redis.setex(existingKey, OTP_TTL, JSON.stringify(record));
  
  return { code, record }; // Return plain code for sending, hashed stored
}

export async function verifyOTP(
  identifier: string,
  code: string,
  channel: OTPChannel,
  purpose: OTPPurpose
): Promise<{ valid: boolean; attemptsRemaining?: number; error?: string }> {
  const redis = getRedis();
  const normalizedId = normalizeIdentifier(identifier, channel);
  const key = `${OTP_PREFIX}${normalizedId}`;
  
  const data = await redis.get(key);
  if (!data) {
    return { valid: false, error: 'OTP expired or not found' };
  }
  
  const record: OTPRecord = JSON.parse(data);
  
  // Check expiration
  if (Date.now() > record.expiresAt) {
    await redis.del(key);
    return { valid: false, error: 'OTP has expired' };
  }
  
  // Check purpose match
  if (record.purpose !== purpose || record.channel !== channel) {
    return { valid: false, error: 'Invalid OTP context' };
  }
  
  // Check max attempts
  if (record.attempts >= record.maxAttempts) {
    await redis.del(key);
    return { valid: false, error: 'Maximum attempts exceeded. Request a new OTP.' };
  }
  
  // Verify code
  const isValid = await bcrypt.compare(code, record.code);
  
  if (!isValid) {
    record.attempts++;
    await redis.setex(key, OTP_TTL, JSON.stringify(record));
    return {
      valid: false,
      attemptsRemaining: record.maxAttempts - record.attempts,
      error: `Invalid code. ${record.maxAttempts - record.attempts} attempts remaining.`,
    };
  }
  
  // OTP is valid - mark as verified and delete
  record.verifiedAt = Date.now();
  await redis.del(key);
  
  return { valid: true };
}

function normalizeIdentifier(identifier: string, channel: OTPChannel): string {
  if (channel === 'email') {
    return identifier.toLowerCase().trim();
  }
  // For phone: remove spaces, ensure +country code
  return identifier.replace(/\s/g, '').replace(/^0/, '+91'); // Default to India
}
```

Create `packages/auth/src/otp/whatsapp.ts`:

```typescript
import { SendOTPResult } from './types';
import { addWhatsAppJob } from '@resumebuddy/queue';

// ============ WhatsApp Provider Interface ============

interface WhatsAppProvider {
  sendOTP(to: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ============ Twilio WhatsApp Provider ============

class TwilioWhatsAppProvider implements WhatsAppProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
    this.authToken = process.env.TWILIO_AUTH_TOKEN!;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER!; // whatsapp:+14155238886
  }
  
  async sendOTP(to: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const client = require('twilio')(this.accountSid, this.authToken);
      
      const message = await client.messages.create({
        body: `Your ResumeBuddy verification code is: ${code}. Valid for 5 minutes. Do not share this code.`,
        from: this.fromNumber,
        to: `whatsapp:${to}`,
      });
      
      return { success: true, messageId: message.sid };
    } catch (error: any) {
      console.error('Twilio WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============ Meta WhatsApp Business API Provider ============

class MetaWhatsAppProvider implements WhatsAppProvider {
  private phoneNumberId: string;
  private accessToken: string;
  
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_ID!;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  }
  
  async sendOTP(to: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace('+', ''), // Meta API expects without +
            type: 'template',
            template: {
              name: 'otp_verification', // Pre-approved template
              language: { code: 'en' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: code },
                    { type: 'text', text: '5' }, // minutes
                  ],
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [
                    { type: 'text', text: code },
                  ],
                },
              ],
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id };
      }
      
      return { success: false, error: data.error?.message || 'Unknown error' };
    } catch (error: any) {
      console.error('Meta WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============ Gupshup WhatsApp Provider (Popular in India) ============

class GupshupWhatsAppProvider implements WhatsAppProvider {
  private apiKey: string;
  private appName: string;
  private sourceNumber: string;
  
  constructor() {
    this.apiKey = process.env.GUPSHUP_API_KEY!;
    this.appName = process.env.GUPSHUP_APP_NAME!;
    this.sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER!;
  }
  
  async sendOTP(to: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const params = new URLSearchParams({
        channel: 'whatsapp',
        source: this.sourceNumber,
        destination: to.replace('+', ''),
        'src.name': this.appName,
        message: JSON.stringify({
          type: 'text',
          text: `Your ResumeBuddy verification code is: *${code}*\n\nValid for 5 minutes. Do not share this code with anyone.`,
        }),
      });
      
      const response = await fetch('https://api.gupshup.io/sm/api/v1/msg', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      const data = await response.json();
      
      if (data.status === 'submitted') {
        return { success: true, messageId: data.messageId };
      }
      
      return { success: false, error: data.message || 'Unknown error' };
    } catch (error: any) {
      console.error('Gupshup WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============ WhatsApp Service (with fallback to SMS) ============

function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    return new TwilioWhatsAppProvider();
  }
  if (process.env.WHATSAPP_BUSINESS_PHONE_ID) {
    return new MetaWhatsAppProvider();
  }
  if (process.env.GUPSHUP_API_KEY) {
    return new GupshupWhatsAppProvider();
  }
  throw new Error('No WhatsApp provider configured');
}

export async function sendWhatsAppOTP(
  phoneNumber: string,
  code: string
): Promise<SendOTPResult> {
  try {
    const provider = getWhatsAppProvider();
    const result = await provider.sendOTP(phoneNumber, code);
    
    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      };
    }
    
    // WhatsApp failed - queue SMS fallback
    console.warn('WhatsApp failed, falling back to SMS:', result.error);
    return await sendSMSFallback(phoneNumber, code);
    
  } catch (error: any) {
    console.error('WhatsApp OTP error:', error);
    // Try SMS fallback
    return await sendSMSFallback(phoneNumber, code);
  }
}

async function sendSMSFallback(phoneNumber: string, code: string): Promise<SendOTPResult> {
  try {
    const { addSMSJob } = await import('@resumebuddy/queue');
    
    await addSMSJob({
      type: 'otp',
      to: phoneNumber,
      message: `Your ResumeBuddy verification code is: ${code}. Valid for 5 minutes.`,
    });
    
    return {
      success: true,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  } catch (error: any) {
    return {
      success: false,
      expiresAt: 0,
      error: 'Failed to send verification code',
    };
  }
}
```

Create `packages/auth/src/otp/sms.ts`:

```typescript
import { SendOTPResult } from './types';

// ============ SMS Provider Interface ============

interface SMSProvider {
  sendOTP(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ============ Twilio SMS Provider ============

class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
    this.authToken = process.env.TWILIO_AUTH_TOKEN!;
    this.fromNumber = process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER!.replace('whatsapp:', '');
  }
  
  async sendOTP(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const client = require('twilio')(this.accountSid, this.authToken);
      
      const msg = await client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
      });
      
      return { success: true, messageId: msg.sid };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// ============ MSG91 Provider (Popular in India) ============

class MSG91Provider implements SMSProvider {
  private authKey: string;
  private senderId: string;
  private templateId: string;
  
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY!;
    this.senderId = process.env.MSG91_SENDER_ID!;
    this.templateId = process.env.MSG91_TEMPLATE_ID!;
  }
  
  async sendOTP(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Extract OTP code from message for template
      const codeMatch = message.match(/\d{6}/);
      const code = codeMatch ? codeMatch[0] : '';
      
      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: this.templateId,
          mobile: to.replace('+', ''),
          otp: code,
        }),
      });
      
      const data = await response.json();
      
      if (data.type === 'success') {
        return { success: true, messageId: data.request_id };
      }
      
      return { success: false, error: data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// ============ SMS Service ============

function getSMSProvider(): SMSProvider {
  const provider = process.env.SMS_PROVIDER || 'twilio';
  
  if (provider === 'msg91' && process.env.MSG91_AUTH_KEY) {
    return new MSG91Provider();
  }
  
  return new TwilioSMSProvider();
}

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SendOTPResult> {
  try {
    const provider = getSMSProvider();
    const result = await provider.sendOTP(phoneNumber, message);
    
    return {
      success: result.success,
      messageId: result.messageId,
      expiresAt: Date.now() + 5 * 60 * 1000,
      error: result.error,
    };
  } catch (error: any) {
    return {
      success: false,
      expiresAt: 0,
      error: error.message,
    };
  }
}
```

Create `packages/auth/src/otp/email-otp.ts`:

```typescript
import { addEmailJob } from '@resumebuddy/queue';
import { SendOTPResult } from './types';

export async function sendEmailOTP(
  email: string,
  code: string,
  purpose: 'login' | 'verify' | 'password-reset'
): Promise<SendOTPResult> {
  try {
    const templates: Record<string, { subject: string; type: string }> = {
      login: {
        subject: 'Your ResumeBuddy Login Code',
        type: 'magic-link' as any,
      },
      verify: {
        subject: 'Verify your Email - ResumeBuddy',
        type: 'verification',
      },
      'password-reset': {
        subject: 'Reset your Password - ResumeBuddy',
        type: 'password-reset',
      },
    };
    
    const template = templates[purpose];
    
    await addEmailJob({
      type: template.type as any,
      to: email,
      subject: template.subject,
      data: {
        code,
        expiresIn: '5 minutes',
        purpose,
      },
    });
    
    return {
      success: true,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  } catch (error: any) {
    return {
      success: false,
      expiresAt: 0,
      error: error.message,
    };
  }
}
```

### 4.6 OTP API Routes

Create `apps/web/src/app/api/auth/otp/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOTP } from '@resumebuddy/auth/otp/store';
import { sendWhatsAppOTP } from '@resumebuddy/auth/otp/whatsapp';
import { sendSMS } from '@resumebuddy/auth/otp/sms';
import { sendEmailOTP } from '@resumebuddy/auth/otp/email-otp';
import { prisma } from '@resumebuddy/database';

const sendOTPSchema = z.object({
  identifier: z.string().min(1),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  purpose: z.enum(['login', 'verify', 'password-reset', '2fa']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sendOTPSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }
    
    const { identifier, channel, purpose } = validated.data;
    
    // For login/verify, check if user exists (for login) or doesn't exist (for signup verify)
    if (channel === 'email') {
      const user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
      });
      
      if (purpose === 'password-reset' && !user) {
        // Don't reveal if email exists
        return NextResponse.json({ 
          success: true, 
          message: 'If the email exists, you will receive a code.',
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
      }
    }
    
    // Create OTP record
    const otpResult = await createOTP(identifier, channel, purpose, {
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
    });
    
    if ('error' in otpResult) {
      return NextResponse.json(
        { error: otpResult.error },
        { status: 429 }
      );
    }
    
    const { code } = otpResult;
    
    // Send OTP via appropriate channel
    let sendResult;
    
    switch (channel) {
      case 'whatsapp':
        sendResult = await sendWhatsAppOTP(identifier, code);
        break;
      case 'sms':
        sendResult = await sendSMS(identifier, `Your ResumeBuddy code: ${code}. Valid for 5 minutes.`);
        break;
      case 'email':
        sendResult = await sendEmailOTP(identifier, code, purpose as any);
        break;
    }
    
    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || 'Failed to send verification code' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Verification code sent via ${channel}`,
      expiresAt: sendResult.expiresAt,
      // For development only - remove in production!
      ...(process.env.NODE_ENV === 'development' && { code }),
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `apps/web/src/app/api/auth/otp/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP } from '@resumebuddy/auth/otp/store';
import { prisma } from '@resumebuddy/database';
import { generateTokenPair, createSession } from '@resumebuddy/auth';
import { cookies } from 'next/headers';
import { addEmailJob, addWhatsAppJob } from '@resumebuddy/queue';

const verifyOTPSchema = z.object({
  identifier: z.string().min(1),
  code: z.string().length(6),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  purpose: z.enum(['login', 'verify', 'password-reset', '2fa']),
  // For new user registration via phone
  userData: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifyOTPSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }
    
    const { identifier, code, channel, purpose, userData } = validated.data;
    
    // Verify OTP
    const verifyResult = await verifyOTP(identifier, code, channel, purpose);
    
    if (!verifyResult.valid) {
      return NextResponse.json(
        { 
          error: verifyResult.error,
          attemptsRemaining: verifyResult.attemptsRemaining,
        },
        { status: 400 }
      );
    }
    
    // OTP is valid - handle based on purpose
    let user;
    let isNewUser = false;
    
    if (channel === 'email') {
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
        include: { subscription: true },
      });
    } else {
      // Phone-based auth (WhatsApp/SMS)
      user = await prisma.user.findFirst({
        where: { phone: identifier },
        include: { subscription: true },
      });
    }
    
    // Handle different purposes
    switch (purpose) {
      case 'login':
        if (!user) {
          // Auto-register for phone login
          if (channel !== 'email' && userData) {
            user = await prisma.user.create({
              data: {
                name: userData.name,
                email: userData.email?.toLowerCase(),
                phone: identifier,
                phoneVerified: new Date(),
                accounts: {
                  create: {
                    provider: channel,
                    providerAccountId: identifier,
                    type: 'phone',
                  },
                },
                subscription: {
                  create: {
                    tier: 'free',
                    status: 'ACTIVE',
                  },
                },
              },
              include: { subscription: true },
            });
            isNewUser = true;
            
            // Send welcome notifications
            if (user.email) {
              await addEmailJob({
                type: 'welcome',
                to: user.email,
                subject: 'Welcome to ResumeBuddy! 🎉',
                data: { name: user.name },
              });
            }
            
            await addWhatsAppJob({
              type: 'welcome',
              to: identifier,
              templateName: 'welcome_message',
              templateData: { name: user.name || 'there' },
            });
          } else {
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }
        }
        break;
        
      case 'verify':
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Update verification status
        if (channel === 'email') {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { phoneVerified: new Date() },
          });
        }
        
        return NextResponse.json({
          success: true,
          message: `${channel === 'email' ? 'Email' : 'Phone'} verified successfully`,
        });
        
      case 'password-reset':
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Generate password reset token
        const resetToken = crypto.randomUUID();
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token: resetToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          },
        });
        
        return NextResponse.json({
          success: true,
          resetToken, // Client uses this to submit new password
        });
        
      case '2fa':
        // 2FA verification - user must already be partially authenticated
        return NextResponse.json({
          success: true,
          message: '2FA verified',
        });
    }
    
    // For login purpose, create session and tokens
    if (purpose === 'login' && user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      
      const tokens = await generateTokenPair({
        id: user.id,
        email: user.email || '',
        role: user.role,
        tier: user.subscription?.tier || 'free',
      });
      
      const sessionId = await createSession({
        userId: user.id,
        email: user.email || '',
        role: user.role,
        tier: user.subscription?.tier || 'free',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
      });
      
      const cookieStore = await cookies();
      
      cookieStore.set('rb_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      
      cookieStore.set('rb_refresh', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      
      // Send login alert via WhatsApp if phone user
      if (user.phone) {
        await addWhatsAppJob({
          type: 'login-alert',
          to: user.phone,
          templateName: 'login_notification',
          templateData: {
            device: request.headers.get('user-agent')?.substring(0, 50) || 'Unknown device',
            time: new Date().toLocaleString(),
          },
        });
      }
      
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          tier: user.subscription?.tier || 'free',
        },
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        isNewUser,
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.7 Auth API Routes

Create `apps/web/src/app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@resumebuddy/database';
import { hashPassword, validatePassword, generateTokenPair, createSession } from '@resumebuddy/auth';
import { cookies } from 'next/headers';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name } = validated.data;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password too weak', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        emailVerified: null, // Send verification email
        accounts: {
          create: {
            provider: 'credentials',
            providerAccountId: email.toLowerCase(),
            type: 'credentials',
          },
        },
        subscription: {
          create: {
            tier: 'free',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    // Generate tokens
    const tokens = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      tier: user.subscription?.tier || 'free',
    });

    // Create session
    const sessionId = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      tier: user.subscription?.tier || 'free',
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
    });

    // Set cookies
    const cookieStore = await cookies();
    
    cookieStore.set('rb_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    cookieStore.set('rb_refresh', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.subscription?.tier || 'free',
      },
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `apps/web/src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@resumebuddy/database';
import { verifyPassword, generateTokenPair, createSession } from '@resumebuddy/auth';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is suspended' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      tier: user.subscription?.tier || 'free',
    });

    // Create session
    const sessionId = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      tier: user.subscription?.tier || 'free',
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
    });

    // Set cookies
    const cookieStore = await cookies();
    
    cookieStore.set('rb_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    cookieStore.set('rb_refresh', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        tier: user.subscription?.tier || 'free',
      },
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.6 Auth Context (Client-Side)

Create `apps/web/src/context/auth-context.tsx`:

```typescript
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ============ Types ============

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tier: 'free' | 'pro';
}

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ Token Storage (Memory) ============

let accessTokenStore: string | null = null;
let tokenExpiresAt: number = 0;

// ============ Provider ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  // Refresh token logic
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        accessTokenStore = data.accessToken;
        tokenExpiresAt = Date.now() + data.expiresIn * 1000;
        setAccessToken(data.accessToken);
        setUser(data.user);
        return;
      }

      // Refresh failed, clear state
      accessTokenStore = null;
      tokenExpiresAt = 0;
      setAccessToken(null);
      setUser(null);
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          accessTokenStore = data.accessToken;
          tokenExpiresAt = Date.now() + data.expiresIn * 1000;
          setAccessToken(data.accessToken);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(() => {
      const timeUntilExpiry = tokenExpiresAt - Date.now();
      // Refresh 1 minute before expiration
      if (timeUntilExpiry < 60 * 1000) {
        refreshToken();
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  // Login
  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    accessTokenStore = data.accessToken;
    tokenExpiresAt = Date.now() + data.expiresIn * 1000;
    setAccessToken(data.accessToken);
    
    router.push('/dashboard');
  };

  // Register
  const register = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    accessTokenStore = data.accessToken;
    tokenExpiresAt = Date.now() + data.expiresIn * 1000;
    setAccessToken(data.accessToken);
    
    router.push('/dashboard');
  };

  // Google OAuth
  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      accessTokenStore = null;
      tokenExpiresAt = 0;
      setAccessToken(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============ Token Getter for API Calls ============

export function getAccessToken(): string | null {
  return accessTokenStore;
}
```

### 4.7 WhatsApp OTP Login Component

Create `apps/web/src/components/whatsapp-otp-login.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Smartphone, ArrowLeft, Check } from 'lucide-react';

type Step = 'phone' | 'otp' | 'name' | 'success';

export function WhatsAppOTPLogin() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  
  const router = useRouter();
  const { toast } = useToast();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send OTP
  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: 'Invalid phone number', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formattedPhone,
          channel: 'whatsapp',
          purpose: 'login',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast({ title: 'OTP sent via WhatsApp! 📱' });
      setStep('otp');
      setCountdown(60); // 60 seconds cooldown
      
      // Focus first OTP input
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every(d => d) && value) {
      setTimeout(() => handleVerifyOTP(newOtp.join('')), 100);
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      toast({ title: 'Please enter complete OTP', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formattedPhone,
          code: otpCode,
          channel: 'whatsapp',
          purpose: 'login',
          userData: name ? { name } : undefined,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.attemptsRemaining !== undefined) {
          toast({ 
            title: `Invalid OTP. ${data.attemptsRemaining} attempts remaining.`,
            variant: 'destructive' 
          });
          setOtp(['', '', '', '', '', '']);
          otpInputsRef.current[0]?.focus();
        } else {
          throw new Error(data.error || 'Verification failed');
        }
        return;
      }

      // Check if new user needs to provide name
      if (data.isNewUser && !data.user?.name) {
        setIsNewUser(true);
        setStep('name');
        return;
      }

      // Success!
      setStep('success');
      toast({ title: 'Welcome back! 🎉' });
      
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Complete registration with name
  const handleCompleteName = async () => {
    if (!name.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Re-verify with name
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formattedPhone,
          code: otp.join(''),
          channel: 'whatsapp',
          purpose: 'login',
          userData: { name: name.trim() },
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      setStep('success');
      toast({ title: 'Account created! Welcome! 🎉' });
      
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Step: Phone Number */}
      {step === 'phone' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Smartphone className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Login with WhatsApp</h2>
            <p className="text-muted-foreground mt-2">
              We'll send a verification code to your WhatsApp
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                className="w-16 text-center"
                value="+91"
                disabled
              />
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
              />
            </div>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleSendOTP}
            disabled={loading || phone.length < 10}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Smartphone className="w-4 h-4 mr-2" />
            )}
            Send OTP via WhatsApp
          </Button>
        </div>
      )}

      {/* Step: OTP Verification */}
      {step === 'otp' && (
        <div className="space-y-4">
          <button
            onClick={() => setStep('phone')}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Change number
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold">Enter OTP</h2>
            <p className="text-muted-foreground mt-2">
              Code sent to WhatsApp on +91 {phone}
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (otpInputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                className="w-12 h-14 text-center text-2xl font-bold"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                maxLength={1}
              />
            ))}
          </div>

          <Button
            className="w-full"
            onClick={() => handleVerifyOTP()}
            disabled={loading || otp.some(d => !d)}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Verify OTP
          </Button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Didn't receive code? Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step: Name for New Users */}
      {step === 'name' && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Almost there!</h2>
            <p className="text-muted-foreground mt-2">
              What should we call you?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCompleteName()}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCompleteName}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Complete Signup
          </Button>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Welcome! 🎉</h2>
          <p className="text-muted-foreground">
            Redirecting to dashboard...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        </div>
      )}
    </div>
  );
}
```

---

## 5. Database Layer (PostgreSQL)

### 5.1 Complete Prisma Schema

Create `packages/database/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ Authentication (from Section 4) ============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?
  
  accounts      Account[]
  sessions      Session[]
  refreshTokens RefreshToken[]
  
  subscription  Subscription?
  usageRecords  UsageRecord[]
  resumeData    ResumeData?
  interviews    Interview[]
  payments      Payment[]
  
  role          Role       @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  lastLoginAt   DateTime?
  
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  type              String
  accessToken       String?
  refreshToken      String?
  expiresAt         Int?
  tokenType         String?
  scope             String?
  idToken           String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  userAgent    String?
  ipAddress    String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}

model RefreshToken {
  id        String    @id @default(cuid())
  token     String    @unique
  userId    String
  expires   DateTime
  revoked   Boolean   @default(false)
  revokedAt DateTime?
  createdAt DateTime  @default(now())
  userAgent String?
  ipAddress String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  type       VerificationType
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@index([email])
  @@map("password_reset_tokens")
}

// ============ Subscription & Billing ============

model Subscription {
  id                 String             @id @default(cuid())
  userId             String             @unique
  tier               SubscriptionTier   @default(FREE)
  status             SubscriptionStatus @default(ACTIVE)
  
  // Payment provider
  provider           String?            // "razorpay"
  razorpayPaymentId  String?
  razorpayOrderId    String?
  
  // Billing period
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean            @default(false)
  
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("subscriptions")
}

model Payment {
  id                 String        @id @default(cuid())
  userId             String
  amount             Decimal       @db.Decimal(10, 2)
  currency           String        @default("INR")
  status             PaymentStatus @default(PENDING)
  
  provider           String        // "razorpay"
  razorpayPaymentId  String?
  razorpayOrderId    String?
  razorpaySignature  String?
  
  description        String?
  metadata           Json?
  
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([razorpayPaymentId])
  @@map("payments")
}

// ============ Usage Tracking ============

model UsageRecord {
  id        String   @id @default(cuid())
  userId    String
  date      String   // YYYY-MM-DD
  
  // AI credits
  aiCreditsUsed Int  @default(0)
  
  // Export counts
  pdfExports  Int    @default(0)
  docxExports Int    @default(0)
  
  // Feature usage
  analysisCount    Int @default(0)
  improvementCount Int @default(0)
  interviewCount   Int @default(0)
  qaCount          Int @default(0)
  coverLetterCount Int @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, date])
  @@index([userId, date])
  @@map("usage_records")
}

// ============ Resume Data ============

model ResumeData {
  id             String   @id @default(cuid())
  userId         String   @unique
  
  // Raw input
  resumeText     String?  @db.Text
  jobDescription String?  @db.Text
  jobRole        String?
  
  // Structured data (JSON)
  parsedResume   Json?    // ParsedResumeData
  analysis       Json?    // AnalysisResult
  improvements   Json?    // ImprovementSuggestion[]
  
  // File references
  resumeFileId   String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("resume_data")
}

// ============ Interview Sessions ============

model Interview {
  id              String            @id @default(cuid())
  userId          String
  
  jobRole         String
  interviewType   InterviewType
  difficultyLevel DifficultyLevel   @default(MEDIUM)
  
  // Session data (JSON)
  questions       Json              // Question[]
  answers         Json?             // Answer[]
  evaluations     Json?             // Evaluation[]
  
  score           Int?              // Overall score (0-100)
  feedback        String?           @db.Text
  
  status          InterviewStatus   @default(IN_PROGRESS)
  startedAt       DateTime          @default(now())
  completedAt     DateTime?
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@map("interviews")
}

// ============ File Storage Metadata ============

model StoredFile {
  id           String   @id @default(cuid())
  userId       String
  
  filename     String
  originalName String
  mimeType     String
  size         Int
  bucket       String   // MinIO bucket
  key          String   // MinIO object key
  
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@map("stored_files")
}

// ============ Generated Resumes (Cloud Stored) ============

model GeneratedResume {
  id              String   @id @default(cuid())
  userId          String
  
  // Resume Metadata
  title           String              // User-friendly name: "Software Engineer Resume - Google"
  templateId      String              // Template used: "professional", "faang", "modern"
  format          ResumeFormat        @default(PDF)
  
  // Storage Info (MinIO/S3)
  bucket          String              // MinIO bucket
  storageKey      String              // Full path: "user123/resumes/2024-02-14-abc123.pdf"
  fileSize        Int                 // Size in bytes
  
  // Content Hash (for deduplication & caching)
  contentHash     String?             // MD5/SHA256 of the resume content
  
  // Context (for tracking & analytics)
  jobTitle        String?             // Target job title
  companyName     String?             // Target company
  jobDescriptionId String?            // Link to stored JD if any
  
  // Resume Source Data (stored as JSON for flexibility)
  resumeData      Json?               // Structured resume data used for generation
  latexSource     String?    @db.Text // LaTeX source (for re-generation)
  
  // Presigned URL Cache
  presignedUrl    String?             // Cached presigned URL
  urlExpiresAt    DateTime?           // When the URL expires
  
  // Analytics
  downloadCount   Int        @default(0)
  lastDownloadedAt DateTime?
  
  // Status & Lifecycle
  status          ResumeStatus @default(READY)
  isArchived      Boolean     @default(false)
  
  // Timestamps
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  expiresAt       DateTime?   // For auto-cleanup (e.g., 90 days)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([userId, isArchived])
  @@index([status])
  @@index([templateId])
  @@unique([userId, contentHash]) // Prevent duplicates
  @@map("generated_resumes")
}

enum ResumeFormat {
  PDF
  DOCX
  LATEX
}

enum ResumeStatus {
  GENERATING    // Currently being generated
  READY         // Successfully generated and stored
  FAILED        // Generation failed
  ARCHIVED      // Moved to archive
  DELETED       // Soft deleted
}

// ============ Enums ============

enum Role {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum VerificationType {
  EMAIL
  PASSWORD_RESET
  TWO_FACTOR
}

enum SubscriptionTier {
  FREE
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  CANCELED
  PAST_DUE
  TRIALING
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
  DSA
  SYSTEM_DESIGN
  MIXED
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}

enum InterviewStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

### 5.2 Database Client & Helpers

Create `packages/database/src/client.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { Prisma } from '@prisma/client';
export type * from '@prisma/client';
```

Create `packages/database/src/helpers/subscription.ts`:

```typescript
import { prisma, SubscriptionTier, SubscriptionStatus } from '../client';

// ============ Types ============

export interface TierLimits {
  dailyAICredits: number;
  monthlyAICredits: number;
  dailyExports: number;
  allowedFeatures: string[];
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    dailyAICredits: 5,
    monthlyAICredits: 150,
    dailyExports: 2,
    allowedFeatures: ['resume-analysis', 'resume-improvement'],
  },
  PRO: {
    dailyAICredits: 10,
    monthlyAICredits: 300,
    dailyExports: -1, // Unlimited
    allowedFeatures: [
      'resume-analysis',
      'resume-improvement',
      'interview-questions',
      'cover-letter',
      'resume-qa',
      'interview-session',
      'dsa-questions',
    ],
  },
};

// ============ Functions ============

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return 'FREE';

  // Check if active
  if (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING') {
    // Check expiration
    if (subscription.currentPeriodEnd) {
      if (new Date(subscription.currentPeriodEnd) > new Date()) {
        return subscription.tier;
      }
    } else {
      return subscription.tier;
    }
  }

  // Grace period for past_due
  if (subscription.status === 'PAST_DUE') {
    return subscription.tier;
  }

  return 'FREE';
}

export async function assertFeatureAllowed(
  userId: string,
  feature: string
): Promise<void> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier];

  if (!limits.allowedFeatures.includes(feature)) {
    throw new Error(
      `Feature "${feature}" requires Pro subscription. Please upgrade to access this feature.`
    );
  }
}

export async function checkDailyUsage(userId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
}> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier];
  const today = new Date().toISOString().split('T')[0];

  const usage = await prisma.usageRecord.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const used = usage?.aiCreditsUsed ?? 0;

  return {
    used,
    limit: limits.dailyAICredits,
    remaining: Math.max(0, limits.dailyAICredits - used),
  };
}

export async function incrementDailyUsage(
  userId: string,
  field: 'aiCreditsUsed' | 'pdfExports' | 'docxExports' = 'aiCreditsUsed'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  await prisma.usageRecord.upsert({
    where: { userId_date: { userId, date: today } },
    create: {
      userId,
      date: today,
      [field]: 1,
    },
    update: {
      [field]: { increment: 1 },
    },
  });
}
```

---

## 6. API Gateway & Backend Services

### 6.1 Updated Server Actions

Create `apps/web/src/app/actions.ts` (migrated from Firebase):

```typescript
'use server';

import { z } from 'zod';
import { prisma } from '@resumebuddy/database';
import { 
  getUserTier, 
  assertFeatureAllowed, 
  checkDailyUsage, 
  incrementDailyUsage 
} from '@resumebuddy/database/helpers/subscription';
import { 
  analyzeResumeContent,
  generateInterviewQuestions,
  suggestImprovements,
  generateCoverLetter,
} from '@resumebuddy/ai';
import { getSession } from '@resumebuddy/auth';
import { cookies } from 'next/headers';

// ============ Auth Helper ============

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('rb_session')?.value;
  
  if (!sessionId) {
    throw new Error('Unauthorized');
  }
  
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error('Session expired');
  }
  
  return session;
}

// ============ Rate Limiting ============

async function enforceRateLimit(userId: string, operation: string) {
  const usage = await checkDailyUsage(userId);
  
  if (usage.remaining <= 0) {
    throw new Error(
      `Daily limit reached (${usage.limit} AI credits). ` +
      `Resets at midnight. Upgrade to Pro for more credits.`
    );
  }
}

// ============ Resume Analysis Action ============

const analysisSchema = z.object({
  resumeText: z.string().min(100, 'Resume text is too short'),
  jobDescription: z.string().min(50, 'Job description is too short'),
});

export async function runAnalysisAction(input: z.infer<typeof analysisSchema>) {
  // 1. Authenticate
  const session = await getCurrentUser();
  
  // 2. Validate
  const validated = analysisSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }
  
  // 3. Check feature access
  await assertFeatureAllowed(session.userId, 'resume-analysis');
  
  // 4. Rate limit
  await enforceRateLimit(session.userId, 'analyze-resume');
  
  // 5. Execute AI flow
  const result = await analyzeResumeContent({
    resumeText: validated.data.resumeText,
    jobDescription: validated.data.jobDescription,
  });
  
  // 6. Increment usage
  await incrementDailyUsage(session.userId, 'aiCreditsUsed');
  
  // 7. Persist
  await prisma.resumeData.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      resumeText: validated.data.resumeText,
      jobDescription: validated.data.jobDescription,
      analysis: result as any,
    },
    update: {
      resumeText: validated.data.resumeText,
      jobDescription: validated.data.jobDescription,
      analysis: result as any,
      updatedAt: new Date(),
    },
  });
  
  return result;
}

// ============ Interview Questions Action ============

const interviewSchema = z.object({
  jobRole: z.string().min(2),
  difficultyLevel: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  interviewType: z.enum(['TECHNICAL', 'BEHAVIORAL', 'DSA', 'SYSTEM_DESIGN', 'MIXED']),
  resumeContext: z.string().optional(),
});

export async function generateQuestionsAction(input: z.infer<typeof interviewSchema>) {
  const session = await getCurrentUser();
  
  const validated = interviewSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }
  
  // Pro-only feature
  await assertFeatureAllowed(session.userId, 'interview-questions');
  await enforceRateLimit(session.userId, 'generate-questions');
  
  const questions = await generateInterviewQuestions({
    jobRole: validated.data.jobRole,
    difficultyLevel: validated.data.difficultyLevel,
    interviewType: validated.data.interviewType,
    resumeContext: validated.data.resumeContext,
  });
  
  await incrementDailyUsage(session.userId, 'aiCreditsUsed');
  
  // Create interview session
  const interview = await prisma.interview.create({
    data: {
      userId: session.userId,
      jobRole: validated.data.jobRole,
      interviewType: validated.data.interviewType,
      difficultyLevel: validated.data.difficultyLevel,
      questions: questions as any,
      status: 'IN_PROGRESS',
    },
  });
  
  return { interviewId: interview.id, questions };
}

// ... Additional server actions following same pattern
```

### 6.2 API Route Protection Middleware

Update `apps/web/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/google',
  '/api/auth/callback/google',
  '/api/health',
  '/api/razorpay/webhook', // Has its own signature verification
];

// Routes requiring Pro subscription (checked in server actions)
const PRO_ROUTES = [
  '/interview',
  '/cover-letter',
  '/qa',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return addSecurityHeaders(NextResponse.next());
  }
  
  // Check session cookie
  const sessionCookie = request.cookies.get('rb_session');
  
  if (!sessionCookie?.value) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Page routes redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

---

## 7. File Storage Solution

### 7.1 MinIO Client

Create `packages/storage/src/minio-client.ts`:

```typescript
import { Client } from 'minio';
import { Readable } from 'stream';
import { nanoid } from 'nanoid';

// ============ Configuration ============

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!.replace(/^https?:\/\//, '').split(':')[0],
  port: parseInt(process.env.MINIO_ENDPOINT!.split(':').pop() || '9000'),
  useSSL: process.env.MINIO_ENDPOINT!.startsWith('https'),
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'resumebuddy';

// ============ Bucket Management ============

export async function ensureBucketExists(bucket: string = DEFAULT_BUCKET): Promise<void> {
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    await minioClient.makeBucket(bucket);
    console.log(`Bucket "${bucket}" created`);
  }
}

// ============ File Operations ============

export interface UploadResult {
  key: string;
  bucket: string;
  etag: string;
  url: string;
}

export async function uploadFile(
  data: Buffer | Readable,
  options: {
    filename: string;
    mimeType: string;
    bucket?: string;
    folder?: string;
    userId?: string;
  }
): Promise<UploadResult> {
  const bucket = options.bucket || DEFAULT_BUCKET;
  await ensureBucketExists(bucket);

  // Generate unique key
  const timestamp = Date.now();
  const uniqueId = nanoid(8);
  const extension = options.filename.split('.').pop() || '';
  const folder = options.folder || 'uploads';
  const userPrefix = options.userId ? `${options.userId}/` : '';
  
  const key = `${userPrefix}${folder}/${timestamp}-${uniqueId}.${extension}`;

  // Upload
  const etag = await minioClient.putObject(
    bucket,
    key,
    data,
    undefined,
    { 'Content-Type': options.mimeType }
  );

  return {
    key,
    bucket,
    etag: etag.etag,
    url: await getPresignedUrl(key, bucket),
  };
}

export async function downloadFile(
  key: string,
  bucket: string = DEFAULT_BUCKET
): Promise<Buffer> {
  const stream = await minioClient.getObject(bucket, key);
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function deleteFile(
  key: string,
  bucket: string = DEFAULT_BUCKET
): Promise<void> {
  await minioClient.removeObject(bucket, key);
}

export async function getPresignedUrl(
  key: string,
  bucket: string = DEFAULT_BUCKET,
  expirySeconds: number = 3600 // 1 hour
): Promise<string> {
  return minioClient.presignedGetObject(bucket, key, expirySeconds);
}

export async function getPresignedUploadUrl(
  key: string,
  bucket: string = DEFAULT_BUCKET,
  expirySeconds: number = 3600
): Promise<string> {
  return minioClient.presignedPutObject(bucket, key, expirySeconds);
}

// ============ File Listing ============

export async function listFiles(
  prefix: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ key: string; size: number; lastModified: Date }[]> {
  const files: { key: string; size: number; lastModified: Date }[] = [];
  
  const stream = minioClient.listObjects(bucket, prefix, true);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => {
      files.push({
        key: obj.name!,
        size: obj.size,
        lastModified: obj.lastModified,
      });
    });
    stream.on('end', () => resolve(files));
    stream.on('error', reject);
  });
}

// ============ User File Management ============

export async function getUserFiles(userId: string): Promise<{ key: string; size: number; lastModified: Date }[]> {
  return listFiles(`${userId}/`);
}

export async function deleteUserFiles(userId: string): Promise<void> {
  const files = await listFiles(`${userId}/`);
  
  if (files.length > 0) {
    await minioClient.removeObjects(
      DEFAULT_BUCKET,
      files.map(f => f.key)
    );
  }
}
```

### 7.2 Resume Storage Service

Create `packages/storage/src/resume-storage.ts`:

```typescript
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { prisma } from '@resumebuddy/database';
import { 
  uploadFile, 
  downloadFile, 
  deleteFile, 
  getPresignedUrl 
} from './minio-client';

// ============ Types ============

export interface StoreResumeInput {
  userId: string;
  title: string;
  templateId: string;
  format: 'PDF' | 'DOCX' | 'LATEX';
  pdfBuffer: Buffer;
  latexSource?: string;
  resumeData?: Record<string, unknown>;
  jobTitle?: string;
  companyName?: string;
}

export interface StoredResumeResult {
  id: string;
  storageKey: string;
  downloadUrl: string;
  expiresAt: Date;
}

export interface ResumeListItem {
  id: string;
  title: string;
  templateId: string;
  format: string;
  fileSize: number;
  jobTitle: string | null;
  companyName: string | null;
  downloadCount: number;
  createdAt: Date;
  downloadUrl?: string;
}

// ============ Constants ============

const RESUME_FOLDER = 'resumes';
const URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'resumebuddy';

// ============ Resume Storage Functions ============

/**
 * Store a generated resume in cloud storage and track in database
 */
export async function storeGeneratedResume(
  input: StoreResumeInput
): Promise<StoredResumeResult> {
  const { userId, title, templateId, format, pdfBuffer, latexSource, resumeData, jobTitle, companyName } = input;
  
  // Generate content hash for deduplication
  const contentHash = createHash('sha256').update(pdfBuffer).digest('hex');
  
  // Check for existing identical resume
  const existing = await prisma.generatedResume.findUnique({
    where: { userId_contentHash: { userId, contentHash } },
  });
  
  if (existing && existing.status === 'READY') {
    // Return existing resume with fresh URL
    const downloadUrl = await getPresignedUrl(existing.storageKey, existing.bucket, URL_EXPIRY_SECONDS);
    return {
      id: existing.id,
      storageKey: existing.storageKey,
      downloadUrl,
      expiresAt: new Date(Date.now() + URL_EXPIRY_SECONDS * 1000),
    };
  }
  
  // Generate unique storage key
  const timestamp = new Date().toISOString().split('T')[0];
  const uniqueId = nanoid(12);
  const extension = format.toLowerCase();
  const storageKey = `${userId}/${RESUME_FOLDER}/${timestamp}-${uniqueId}.${extension}`;
  
  // Upload to MinIO
  const uploadResult = await uploadFile(pdfBuffer, {
    filename: `${title}.${extension}`,
    mimeType: format === 'PDF' ? 'application/pdf' : 
              format === 'DOCX' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              'text/plain',
    folder: RESUME_FOLDER,
    userId,
  });
  
  // Generate presigned URL (valid for 7 days)
  const downloadUrl = await getPresignedUrl(uploadResult.key, DEFAULT_BUCKET, URL_EXPIRY_SECONDS);
  const urlExpiresAt = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000);
  
  // Create database record
  const resume = await prisma.generatedResume.create({
    data: {
      userId,
      title,
      templateId,
      format,
      bucket: uploadResult.bucket,
      storageKey: uploadResult.key,
      fileSize: pdfBuffer.length,
      contentHash,
      jobTitle,
      companyName,
      resumeData: resumeData || undefined,
      latexSource,
      presignedUrl: downloadUrl,
      urlExpiresAt,
      status: 'READY',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });
  
  return {
    id: resume.id,
    storageKey: uploadResult.key,
    downloadUrl,
    expiresAt: urlExpiresAt,
  };
}

/**
 * Get a fresh download URL for a stored resume
 */
export async function getResumeDownloadUrl(
  resumeId: string,
  userId: string
): Promise<{ downloadUrl: string; expiresAt: Date }> {
  const resume = await prisma.generatedResume.findFirst({
    where: { id: resumeId, userId, status: 'READY' },
  });
  
  if (!resume) {
    throw new Error('Resume not found');
  }
  
  // Check if cached URL is still valid (with 1 hour buffer)
  if (resume.presignedUrl && resume.urlExpiresAt) {
    const bufferTime = 60 * 60 * 1000; // 1 hour
    if (new Date(resume.urlExpiresAt).getTime() - Date.now() > bufferTime) {
      // Increment download count
      await prisma.generatedResume.update({
        where: { id: resumeId },
        data: { 
          downloadCount: { increment: 1 },
          lastDownloadedAt: new Date(),
        },
      });
      
      return {
        downloadUrl: resume.presignedUrl,
        expiresAt: resume.urlExpiresAt,
      };
    }
  }
  
  // Generate fresh URL
  const downloadUrl = await getPresignedUrl(resume.storageKey, resume.bucket, URL_EXPIRY_SECONDS);
  const urlExpiresAt = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000);
  
  // Update cache and increment download count
  await prisma.generatedResume.update({
    where: { id: resumeId },
    data: { 
      presignedUrl: downloadUrl,
      urlExpiresAt,
      downloadCount: { increment: 1 },
      lastDownloadedAt: new Date(),
    },
  });
  
  return { downloadUrl, expiresAt: urlExpiresAt };
}

/**
 * List all resumes for a user
 */
export async function listUserResumes(
  userId: string,
  options?: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ resumes: ResumeListItem[]; total: number }> {
  const { includeArchived = false, limit = 50, offset = 0 } = options || {};
  
  const where = {
    userId,
    status: 'READY' as const,
    ...(includeArchived ? {} : { isArchived: false }),
  };
  
  const [resumes, total] = await Promise.all([
    prisma.generatedResume.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        templateId: true,
        format: true,
        fileSize: true,
        jobTitle: true,
        companyName: true,
        downloadCount: true,
        createdAt: true,
        presignedUrl: true,
        urlExpiresAt: true,
      },
    }),
    prisma.generatedResume.count({ where }),
  ]);
  
  // Return with valid URLs only
  const resumeList: ResumeListItem[] = resumes.map(r => ({
    id: r.id,
    title: r.title,
    templateId: r.templateId,
    format: r.format,
    fileSize: r.fileSize,
    jobTitle: r.jobTitle,
    companyName: r.companyName,
    downloadCount: r.downloadCount,
    createdAt: r.createdAt,
    // Only include URL if still valid
    downloadUrl: r.urlExpiresAt && new Date(r.urlExpiresAt) > new Date() 
      ? r.presignedUrl ?? undefined 
      : undefined,
  }));
  
  return { resumes: resumeList, total };
}

/**
 * Download resume content (for re-downloading or processing)
 */
export async function downloadResume(
  resumeId: string,
  userId: string
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const resume = await prisma.generatedResume.findFirst({
    where: { id: resumeId, userId, status: 'READY' },
  });
  
  if (!resume) {
    throw new Error('Resume not found');
  }
  
  const buffer = await downloadFile(resume.storageKey, resume.bucket);
  
  const mimeType = resume.format === 'PDF' ? 'application/pdf' :
                   resume.format === 'DOCX' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                   'text/plain';
  
  const extension = resume.format.toLowerCase();
  const filename = `${resume.title}.${extension}`;
  
  // Increment download count
  await prisma.generatedResume.update({
    where: { id: resumeId },
    data: { 
      downloadCount: { increment: 1 },
      lastDownloadedAt: new Date(),
    },
  });
  
  return { buffer, filename, mimeType };
}

/**
 * Delete a stored resume
 */
export async function deleteStoredResume(
  resumeId: string,
  userId: string,
  hardDelete: boolean = false
): Promise<void> {
  const resume = await prisma.generatedResume.findFirst({
    where: { id: resumeId, userId },
  });
  
  if (!resume) {
    throw new Error('Resume not found');
  }
  
  if (hardDelete) {
    // Delete from storage
    await deleteFile(resume.storageKey, resume.bucket);
    
    // Delete from database
    await prisma.generatedResume.delete({
      where: { id: resumeId },
    });
  } else {
    // Soft delete
    await prisma.generatedResume.update({
      where: { id: resumeId },
      data: { status: 'DELETED', isArchived: true },
    });
  }
}

/**
 * Archive/unarchive a resume
 */
export async function toggleResumeArchive(
  resumeId: string,
  userId: string
): Promise<{ isArchived: boolean }> {
  const resume = await prisma.generatedResume.findFirst({
    where: { id: resumeId, userId, status: 'READY' },
  });
  
  if (!resume) {
    throw new Error('Resume not found');
  }
  
  const updated = await prisma.generatedResume.update({
    where: { id: resumeId },
    data: { isArchived: !resume.isArchived },
  });
  
  return { isArchived: updated.isArchived };
}

/**
 * Rename a resume
 */
export async function renameResume(
  resumeId: string,
  userId: string,
  newTitle: string
): Promise<void> {
  await prisma.generatedResume.updateMany({
    where: { id: resumeId, userId },
    data: { title: newTitle },
  });
}

/**
 * Cleanup expired resumes (run as cron job)
 */
export async function cleanupExpiredResumes(): Promise<{ deleted: number }> {
  const expired = await prisma.generatedResume.findMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { status: 'DELETED', updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
  });
  
  let deleted = 0;
  
  for (const resume of expired) {
    try {
      await deleteFile(resume.storageKey, resume.bucket);
      await prisma.generatedResume.delete({ where: { id: resume.id } });
      deleted++;
    } catch (error) {
      console.error(`Failed to delete expired resume ${resume.id}:`, error);
    }
  }
  
  return { deleted };
}
```

### 7.3 Resume API Routes

Create `apps/web/src/app/api/resumes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@resumebuddy/auth';
import { listUserResumes } from '@resumebuddy/storage/resume-storage';
import { cookies } from 'next/headers';

// GET /api/resumes - List user's stored resumes
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('rb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    
    const result = await listUserResumes(session.userId, {
      limit,
      offset,
      includeArchived,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('List resumes error:', error);
    return NextResponse.json(
      { error: 'Failed to list resumes' },
      { status: 500 }
    );
  }
}
```

Create `apps/web/src/app/api/resumes/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@resumebuddy/auth';
import { 
  getResumeDownloadUrl, 
  deleteStoredResume, 
  renameResume 
} from '@resumebuddy/storage/resume-storage';
import { cookies } from 'next/headers';

// GET /api/resumes/:id - Get download URL for a resume
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('rb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    
    const { downloadUrl, expiresAt } = await getResumeDownloadUrl(
      params.id,
      session.userId
    );
    
    return NextResponse.json({ downloadUrl, expiresAt });
  } catch (error: any) {
    if (error.message === 'Resume not found') {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    console.error('Get resume URL error:', error);
    return NextResponse.json(
      { error: 'Failed to get resume URL' },
      { status: 500 }
    );
  }
}

// PATCH /api/resumes/:id - Update resume (rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('rb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    
    const body = await request.json();
    const { title } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    await renameResume(params.id, session.userId, title);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update resume error:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

// DELETE /api/resumes/:id - Delete a resume
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('rb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';
    
    await deleteStoredResume(params.id, session.userId, hardDelete);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Resume not found') {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    console.error('Delete resume error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
```

Create `apps/web/src/app/api/resumes/[id]/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@resumebuddy/auth';
import { downloadResume } from '@resumebuddy/storage/resume-storage';
import { cookies } from 'next/headers';

// GET /api/resumes/:id/download - Direct download of resume file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('rb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    
    const { buffer, filename, mimeType } = await downloadResume(
      params.id,
      session.userId
    );
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    if (error.message === 'Resume not found') {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    console.error('Download resume error:', error);
    return NextResponse.json(
      { error: 'Failed to download resume' },
      { status: 500 }
    );
  }
}
```

Create `apps/web/src/app/api/resumes/[id]/archive/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@resumebuddy/auth';
import { toggleResumeArchive } from '@resumebuddy/storage/resume-storage';
import { cookies } from 'next/headers';

// POST /api/resumes/:id/archive - Toggle archive status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('rb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    
    const result = await toggleResumeArchive(params.id, session.userId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Resume not found') {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    console.error('Archive resume error:', error);
    return NextResponse.json(
      { error: 'Failed to archive resume' },
      { status: 500 }
    );
  }
}
```

### 7.4 Updated Server Actions for Resume Generation

Update `apps/web/src/app/actions.ts` to store generated resumes:

```typescript
// Add to existing actions.ts

import { storeGeneratedResume } from '@resumebuddy/storage/resume-storage';
import { addEmailJob, addWhatsAppJob } from '@resumebuddy/queue';

// ============ LaTeX Export Action (with Cloud Storage) ============

const latexExportSchema = z.object({
  templateId: z.string(),
  resumeData: z.object({}).passthrough().optional(),
  resumeText: z.string().optional(),
  source: z.enum(['resumeData', 'resumeText']),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  storeInCloud: z.boolean().default(true),
});

export async function exportResumeAction(input: z.infer<typeof latexExportSchema>) {
  const session = await getCurrentUser();
  
  const validated = latexExportSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }
  
  // Check export limits for free tier
  const tier = await getUserTier(session.userId);
  const limits = TIER_LIMITS[tier];
  
  if (limits.dailyExports !== -1) {
    const usage = await prisma.usageRecord.findUnique({
      where: { userId_date: { userId: session.userId, date: new Date().toISOString().split('T')[0] } },
    });
    
    if ((usage?.pdfExports ?? 0) >= limits.dailyExports) {
      throw new Error(`Daily export limit reached (${limits.dailyExports}). Upgrade to Pro for unlimited exports.`);
    }
  }
  
  // Call LaTeX service
  const latexServiceUrl = process.env.LATEX_SERVICE_URL || 'http://localhost:8080';
  const response = await fetch(`${latexServiceUrl}/v1/resume/latex/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: validated.data.source,
      templateId: validated.data.templateId,
      resumeData: validated.data.resumeData,
      resumeText: validated.data.resumeText,
      options: { engine: 'tectonic', return: ['latex', 'pdf'] },
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate resume');
  }
  
  const result = await response.json();
  const { pdfBase64, latexSource } = result;
  
  // Convert base64 to buffer
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  
  // Increment usage
  await incrementDailyUsage(session.userId, 'pdfExports');
  
  // Store in cloud if requested
  let storedResume = null;
  if (validated.data.storeInCloud) {
    const title = validated.data.companyName 
      ? `${validated.data.jobTitle || 'Resume'} - ${validated.data.companyName}`
      : `Resume - ${new Date().toLocaleDateString()}`;
    
    storedResume = await storeGeneratedResume({
      userId: session.userId,
      title,
      templateId: validated.data.templateId,
      format: 'PDF',
      pdfBuffer,
      latexSource,
      resumeData: validated.data.resumeData as Record<string, unknown>,
      jobTitle: validated.data.jobTitle,
      companyName: validated.data.companyName,
    });
    
    // Get user info for notifications
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, phone: true, name: true, notifyEmail: true, notifyWhatsApp: true },
    });
    
    // Send notifications
    if (user?.notifyEmail && user.email) {
      await addEmailJob({
        type: 'export-ready',
        to: user.email,
        subject: 'Your resume is ready to download! 📄',
        data: {
          name: user.name || 'there',
          format: 'PDF',
          downloadUrl: storedResume.downloadUrl,
        },
      });
    }
    
    if (user?.notifyWhatsApp && user.phone) {
      await addWhatsAppJob({
        type: 'export-ready',
        to: user.phone,
        templateName: 'export_ready',
        templateData: {
          downloadUrl: storedResume.downloadUrl,
        },
      });
    }
  }
  
  return {
    pdfBase64,
    latexSource,
    storedResume: storedResume ? {
      id: storedResume.id,
      downloadUrl: storedResume.downloadUrl,
      expiresAt: storedResume.expiresAt,
    } : null,
  };
}
```

### 7.5 Resume Library Frontend Component

Create `apps/web/src/components/resume-library.tsx`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Download,
  Trash2,
  Archive,
  MoreVertical,
  FileText,
  Pencil,
  ExternalLink,
  CloudDownload,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

// ============ Types ============

interface Resume {
  id: string;
  title: string;
  templateId: string;
  format: string;
  fileSize: number;
  jobTitle: string | null;
  companyName: string | null;
  downloadCount: number;
  createdAt: string;
  downloadUrl?: string;
}

interface ResumeListResponse {
  resumes: Resume[];
  total: number;
}

// ============ Component ============

export function ResumeLibrary() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Fetch resumes
  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
        includeArchived: includeArchived.toString(),
      });
      
      const response = await fetch(`/api/resumes?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }
      
      const data: ResumeListResponse = await response.json();
      setResumes(data.resumes);
      setTotal(data.total);
    } catch (error) {
      toast({ title: 'Failed to load resumes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [includeArchived, toast]);
  
  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);
  
  // Download resume
  const handleDownload = async (resume: Resume) => {
    setActionLoading(resume.id);
    try {
      // Get fresh download URL
      const response = await fetch(`/api/resumes/${resume.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
      
      const { downloadUrl } = await response.json();
      
      // Open in new tab (will trigger download)
      window.open(downloadUrl, '_blank');
      
      toast({ title: 'Download started!' });
    } catch (error) {
      toast({ title: 'Download failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };
  
  // Rename resume
  const handleRename = async () => {
    if (!selectedResume || !newTitle.trim()) return;
    
    setActionLoading(selectedResume.id);
    try {
      const response = await fetch(`/api/resumes/${selectedResume.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to rename');
      }
      
      toast({ title: 'Resume renamed!' });
      setRenameDialogOpen(false);
      setSelectedResume(null);
      setNewTitle('');
      fetchResumes();
    } catch (error) {
      toast({ title: 'Failed to rename', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };
  
  // Delete resume
  const handleDelete = async () => {
    if (!selectedResume) return;
    
    setActionLoading(selectedResume.id);
    try {
      const response = await fetch(`/api/resumes/${selectedResume.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete');
      }
      
      toast({ title: 'Resume deleted!' });
      setDeleteDialogOpen(false);
      setSelectedResume(null);
      fetchResumes();
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };
  
  // Archive resume
  const handleArchive = async (resume: Resume) => {
    setActionLoading(resume.id);
    try {
      const response = await fetch(`/api/resumes/${resume.id}/archive`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive');
      }
      
      const { isArchived } = await response.json();
      toast({ title: isArchived ? 'Resume archived!' : 'Resume unarchived!' });
      fetchResumes();
    } catch (error) {
      toast({ title: 'Failed to archive', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Filter resumes by search query
  const filteredResumes = resumes.filter(resume => {
    const query = searchQuery.toLowerCase();
    return (
      resume.title.toLowerCase().includes(query) ||
      resume.jobTitle?.toLowerCase().includes(query) ||
      resume.companyName?.toLowerCase().includes(query)
    );
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resume Library</h2>
          <p className="text-muted-foreground">
            {total} resume{total !== 1 ? 's' : ''} stored in cloud
          </p>
        </div>
        
        <Button variant="outline" onClick={fetchResumes} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant={includeArchived ? 'default' : 'outline'}
          onClick={() => setIncludeArchived(!includeArchived)}
        >
          <Archive className="w-4 h-4 mr-2" />
          {includeArchived ? 'Showing Archived' : 'Show Archived'}
        </Button>
      </div>
      
      {/* Resume List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredResumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CloudDownload className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No resumes found</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-2">
              {searchQuery 
                ? 'No resumes match your search. Try a different query.'
                : 'Generate your first resume to see it here!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base line-clamp-1">
                      {resume.title}
                    </CardTitle>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {actionLoading === resume.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(resume)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedResume(resume);
                          setNewTitle(resume.title);
                          setRenameDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(resume)}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedResume(resume);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(resume.jobTitle || resume.companyName) && (
                    <p className="text-muted-foreground line-clamp-1">
                      {[resume.jobTitle, resume.companyName].filter(Boolean).join(' at ')}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{formatDate(resume.createdAt)}</span>
                    <span>{formatFileSize(resume.fileSize)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Template: {resume.templateId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {resume.downloadCount} download{resume.downloadCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => handleDownload(resume)}
                  disabled={actionLoading === resume.id}
                >
                  {actionLoading === resume.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download {resume.format}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new name..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim() || actionLoading !== null}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{selectedResume?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={actionLoading !== null}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### 7.6 Resume Library Page

Create `apps/web/src/app/resumes/page.tsx`:

```typescript
import { Metadata } from 'next';
import { ResumeLibrary } from '@/components/resume-library';

export const metadata: Metadata = {
  title: 'Resume Library - ResumeBuddy',
  description: 'View and manage all your generated resumes stored in the cloud.',
};

export default function ResumesPage() {
  return (
    <div className="container max-w-6xl py-8">
      <ResumeLibrary />
    </div>
  );
}
```

### 7.7 AWS S3 Alternative (Production)

For production deployments on AWS, replace MinIO with native S3. Update `packages/storage/src/s3-client.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// ============ S3 Client Configuration ============

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined, // Use IAM role if in AWS
});

const DEFAULT_BUCKET = process.env.S3_BUCKET || 'resumebuddy-resumes';

// ============ Upload File ============

export async function uploadFile(
  data: Buffer | Readable,
  options: {
    filename: string;
    mimeType: string;
    bucket?: string;
    folder?: string;
    userId?: string;
  }
): Promise<{ key: string; bucket: string; etag: string; url: string }> {
  const bucket = options.bucket || DEFAULT_BUCKET;
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substring(7);
  const extension = options.filename.split('.').pop() || '';
  const folder = options.folder || 'uploads';
  const userPrefix = options.userId ? `${options.userId}/` : '';
  
  const key = `${userPrefix}${folder}/${timestamp}-${uniqueId}.${extension}`;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: options.mimeType,
  });
  
  const result = await s3Client.send(command);
  
  // Generate presigned URL
  const url = await getPresignedUrl(key, bucket);
  
  return {
    key,
    bucket,
    etag: result.ETag || '',
    url,
  };
}

// ============ Get Presigned URL ============

export async function getPresignedUrl(
  key: string,
  bucket: string = DEFAULT_BUCKET,
  expirySeconds: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
}

// ============ Download File ============

export async function downloadFile(
  key: string,
  bucket: string = DEFAULT_BUCKET
): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  const stream = response.Body as Readable;
  
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

// ============ Delete File ============

export async function deleteFile(
  key: string,
  bucket: string = DEFAULT_BUCKET
): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  await s3Client.send(command);
}

// ============ List Files ============

export async function listFiles(
  prefix: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ key: string; size: number; lastModified: Date }[]> {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });
  
  const response = await s3Client.send(command);
  
  return (response.Contents || []).map(obj => ({
    key: obj.Key!,
    size: obj.Size!,
    lastModified: obj.LastModified!,
  }));
}
```

**Environment Variables for AWS S3:**

```bash
# Add to .env for AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET=resumebuddy-resumes
```

### 8.1 Redis Cache Implementation

Create `packages/cache/src/redis-cache.ts`:

```typescript
import Redis from 'ioredis';
import { createHash } from 'crypto';

// ============ Redis Client ============

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    });
  }
  return redis;
}

// ============ Cache Keys ============

export const CACHE_PREFIXES = {
  AI_RESPONSE: 'ai_response:',
  USER_SESSION: 'session:',
  RATE_LIMIT: 'rate_limit:',
  USER_TIER: 'user_tier:',
  PDF_CACHE: 'pdf:',
} as const;

// ============ Generic Cache Operations ============

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await getRedis().get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<void> {
  await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) {
    await getRedis().del(...keys);
  }
}

// ============ AI Response Cache ============

export function generateCacheKey(prompt: string, systemPrompt?: string): string {
  const combined = `${systemPrompt || ''}::${prompt}`;
  return createHash('md5').update(combined).digest('hex');
}

export async function getCachedAIResponse(
  prompt: string,
  systemPrompt?: string
): Promise<string | null> {
  const key = `${CACHE_PREFIXES.AI_RESPONSE}${generateCacheKey(prompt, systemPrompt)}`;
  return cacheGet<string>(key);
}

export async function setCachedAIResponse(
  prompt: string,
  response: string,
  systemPrompt?: string,
  ttlSeconds: number = 3600
): Promise<void> {
  const key = `${CACHE_PREFIXES.AI_RESPONSE}${generateCacheKey(prompt, systemPrompt)}`;
  await cacheSet(key, response, ttlSeconds);
}

// ============ Rate Limiting ============

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  const key = `${CACHE_PREFIXES.RATE_LIMIT}${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const count = await redis.zcard(key);

  if (count >= maxRequests) {
    // Get oldest entry for reset time
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = oldest.length > 1 
      ? parseInt(oldest[1]) + windowMs 
      : now + windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add new request
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.pexpire(key, windowMs);

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetAt: now + windowMs,
  };
}

// ============ User Tier Cache ============

export async function getCachedUserTier(userId: string): Promise<'FREE' | 'PRO' | null> {
  const key = `${CACHE_PREFIXES.USER_TIER}${userId}`;
  return cacheGet<'FREE' | 'PRO'>(key);
}

export async function setCachedUserTier(
  userId: string,
  tier: 'FREE' | 'PRO',
  ttlSeconds: number = 300 // 5 minutes
): Promise<void> {
  const key = `${CACHE_PREFIXES.USER_TIER}${userId}`;
  await cacheSet(key, tier, ttlSeconds);
}

export async function invalidateUserTierCache(userId: string): Promise<void> {
  const key = `${CACHE_PREFIXES.USER_TIER}${userId}`;
  await cacheDelete(key);
}
```

---

## 9. Job Queue & Background Processing

### 9.1 BullMQ Setup

Create `packages/queue/src/index.ts`:

```typescript
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// ============ Redis Connection ============

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // BullMQ requirement
});

// ============ Queue Definitions ============

export const emailQueue = new Queue('emails', { connection });
export const whatsappQueue = new Queue('whatsapp', { connection });
export const smsQueue = new Queue('sms', { connection });
export const aiQueue = new Queue('ai-tasks', { connection });
export const cleanupQueue = new Queue('cleanup', { connection });
export const analyticsQueue = new Queue('analytics', { connection });
export const notificationQueue = new Queue('notifications', { connection });

// ============ Job Types ============

export interface EmailJob {
  type: 
    | 'welcome'              // New user signup
    | 'verification'         // Email verification
    | 'password-reset'       // Password reset request
    | 'subscription'         // Pro subscription confirmation
    | 'subscription-expiring'// Pro subscription expiring soon
    | 'subscription-expired' // Pro subscription expired
    | 'daily-summary'        // Daily usage summary
    | 'weekly-digest'        // Weekly feature highlights
    | 'export-ready'         // PDF/DOCX export completed
    | 'interview-reminder'   // Scheduled interview reminder
    | 'analysis-complete'    // Resume analysis done
    | 'cover-letter-ready'   // Cover letter generated
    | 'account-activity'     // Suspicious login attempt
    | 'feedback-request';    // Request for app feedback
  to: string;
  subject: string;
  data: Record<string, unknown>;
}

export interface WhatsAppJob {
  type:
    | 'otp'                  // OTP verification code
    | 'welcome'              // Welcome message
    | 'login-alert'          // New login notification
    | 'subscription'         // Pro upgrade confirmation
    | 'export-ready'         // PDF export ready (with link)
    | 'interview-reminder'   // Interview practice reminder
    | 'daily-tip';           // Daily resume tip
  to: string;                // Phone number with country code
  templateName: string;      // WhatsApp template name
  templateData: Record<string, string>;  // Template variables
}

export interface SMSJob {
  type: 'otp' | 'alert';
  to: string;
  message: string;
}

export interface AIJob {
  type: 'analysis' | 'interview' | 'cover-letter';
  userId: string;
  input: Record<string, unknown>;
  callbackUrl?: string;
}

export interface CleanupJob {
  type: 'expired-sessions' | 'old-usage-records' | 'orphaned-files';
  olderThanDays?: number;
}

// ============ Add Jobs ============

export async function addEmailJob(data: EmailJob): Promise<Job> {
  return emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    priority: data.type === 'verification' || data.type === 'password-reset' ? 1 : 5,
  });
}

export async function addWhatsAppJob(data: WhatsAppJob): Promise<Job> {
  return whatsappQueue.add('send-whatsapp', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    priority: data.type === 'otp' ? 1 : 5, // OTPs are high priority
  });
}

export async function addSMSJob(data: SMSJob): Promise<Job> {
  return smsQueue.add('send-sms', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    priority: 1, // SMS (usually OTP) is always high priority
  });
}

export async function addAIJob(data: AIJob): Promise<Job> {
  return aiQueue.add('process-ai', data, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    timeout: 120000, // 2 minutes
  });
}

export async function scheduleCleanup(data: CleanupJob): Promise<Job> {
  return cleanupQueue.add('cleanup', data, {
    repeat: {
      pattern: '0 3 * * *', // Every day at 3 AM
    },
  });
}
```

### 9.2 Comprehensive Notification Workers

Create `packages/queue/src/email-service.ts`:

```typescript
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// ============ Email Provider Interface ============

interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ============ Resend Provider (Recommended) ============

class ResendProvider implements EmailProvider {
  private client: Resend;
  private from: string;
  
  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
    this.from = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`;
  }
  
  async send(params: { to: string; subject: string; html: string; text?: string }) {
    try {
      const { data, error } = await this.client.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// ============ Nodemailer Provider (SMTP Fallback) ============

class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private from: string;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    this.from = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`;
  }
  
  async send(params: { to: string; subject: string; html: string; text?: string }) {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// ============ Email Service ============

function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) {
    return new ResendProvider();
  }
  return new NodemailerProvider();
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const provider = getEmailProvider();
  return provider.send(params);
}
```

Create `packages/queue/src/email-templates.ts`:

```typescript
// ============ Email Template Engine ============

interface TemplateData {
  [key: string]: unknown;
  appName?: string;
  appUrl?: string;
  supportEmail?: string;
  year?: number;
}

const DEFAULT_DATA: TemplateData = {
  appName: 'ResumeBuddy',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://resumebuddy.com',
  supportEmail: 'support@resumebuddy.com',
  year: new Date().getFullYear(),
};

function interpolate(template: string, data: TemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => 
    String(data[key] ?? DEFAULT_DATA[key] ?? '')
  );
}

// ============ Email Templates ============

const templates = {
  // 1. Welcome Email (New User Signup)
  welcome: {
    subject: 'Welcome to ResumeBuddy! 🎉',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ResumeBuddy</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ResumeBuddy! 🎉</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px;">Hi {{name}},</p>
    
    <p>Thanks for joining ResumeBuddy! We're excited to help you create a standout resume and land your dream job.</p>
    
    <h3 style="color: #667eea;">Here's what you can do:</h3>
    <ul style="padding-left: 20px;">
      <li><strong>AI Resume Analysis</strong> - Get instant ATS score and improvement tips</li>
      <li><strong>Smart Keyword Matching</strong> - Optimize for any job description</li>
      <li><strong>Professional Export</strong> - Download in PDF or DOCX formats</li>
      <li><strong>Interview Prep</strong> - Practice with AI-generated questions</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Get Started Now</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Need help? Just reply to this email or visit our <a href="{{appUrl}}/help" style="color: #667eea;">Help Center</a>.</p>
    
    <p>Best,<br><strong>The ResumeBuddy Team</strong></p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>© {{year}} {{appName}}. All rights reserved.</p>
    <p><a href="{{appUrl}}/unsubscribe?email={{email}}" style="color: #999;">Unsubscribe</a></p>
  </div>
</body>
</html>`,
  },
  
  // 2. Email Verification
  verification: {
    subject: 'Verify your email - ResumeBuddy',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #333;">Verify Your Email Address</h2>
    
    <p>Hi {{name}},</p>
    <p>Please verify your email address to complete your ResumeBuddy registration.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 2px dashed #667eea; display: inline-block;">
        <p style="margin: 0; color: #666; font-size: 14px;">Your verification code:</p>
        <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0;">{{code}}</p>
        <p style="margin: 0; color: #999; font-size: 12px;">Valid for {{expiresIn}}</p>
      </div>
    </div>
    
    <p style="text-align: center; color: #666;">Or click the button below:</p>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{appUrl}}/verify?code={{code}}&email={{email}}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
    </div>
    
    <p style="color: #999; font-size: 13px;">If you didn't create a ResumeBuddy account, please ignore this email.</p>
  </div>
</body>
</html>`,
  },
  
  // 3. Password Reset
  'password-reset': {
    subject: 'Reset your password - ResumeBuddy',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #856404;">🔐 Password Reset Request</h2>
    
    <p>Hi {{name}},</p>
    <p>We received a request to reset your ResumeBuddy password. If you didn't make this request, you can safely ignore this email.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: #fff; padding: 20px; border-radius: 8px; display: inline-block;">
        <p style="margin: 0; color: #666; font-size: 14px;">Your reset code:</p>
        <p style="font-size: 32px; font-weight: bold; color: #856404; letter-spacing: 8px; margin: 10px 0;">{{code}}</p>
        <p style="margin: 0; color: #999; font-size: 12px;">Valid for {{expiresIn}}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{appUrl}}/reset-password?code={{code}}&email={{email}}" style="background: #ffc107; color: #333; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    
    <p style="color: #856404; font-size: 13px; margin-top: 20px;">⚠️ For security, this link expires in {{expiresIn}}. If you didn't request this reset, please secure your account.</p>
  </div>
</body>
</html>`,
  },
  
  // 4. Pro Subscription Confirmation
  subscription: {
    subject: 'Welcome to ResumeBuddy Pro! 🚀',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🚀 You're Now Pro!</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px;">Hi {{name}},</p>
    
    <p>Thank you for upgrading to ResumeBuddy Pro! Your payment of <strong>₹{{amount}}</strong> has been received.</p>
    
    <h3 style="color: #f5576c;">Your Pro Benefits:</h3>
    <ul style="padding-left: 20px;">
      <li>✅ <strong>10 AI Credits/Day</strong> (instead of 5)</li>
      <li>✅ <strong>Unlimited Exports</strong> - PDF & DOCX</li>
      <li>✅ <strong>Interview Questions Generator</strong></li>
      <li>✅ <strong>Cover Letter Generator</strong></li>
      <li>✅ <strong>Advanced Q&A Practice</strong></li>
      <li>✅ <strong>Priority Support</strong></li>
    </ul>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>Order Details:</strong></p>
      <p style="margin: 5px 0; color: #666;">Order ID: {{orderId}}</p>
      <p style="margin: 5px 0; color: #666;">Valid Until: {{expiresAt}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Using Pro Features</a>
    </div>
    
    <p>Best,<br><strong>The ResumeBuddy Team</strong></p>
  </div>
</body>
</html>`,
  },
  
  // 5. Subscription Expiring Soon
  'subscription-expiring': {
    subject: '⏰ Your ResumeBuddy Pro expires in {{daysLeft}} days',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #856404;">⏰ Your Pro Plan Expires Soon</h2>
    
    <p>Hi {{name}},</p>
    <p>Your ResumeBuddy Pro subscription will expire in <strong>{{daysLeft}} days</strong> (on {{expiresAt}}).</p>
    
    <p>Don't lose access to:</p>
    <ul>
      <li>Interview Questions Generator</li>
      <li>Cover Letter Generator</li>
      <li>Unlimited Exports</li>
      <li>10 AI Credits per day</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/billing" style="background: #ffc107; color: #333; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Renew Now</a>
    </div>
  </div>
</body>
</html>`,
  },
  
  // 6. Export Ready Notification
  'export-ready': {
    subject: 'Your resume is ready to download! 📄',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #d4edda; border: 1px solid #28a745; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #155724;">📄 Your Resume is Ready!</h2>
    
    <p>Hi {{name}},</p>
    <p>Great news! Your resume export in <strong>{{format}}</strong> format is ready for download.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{downloadUrl}}" style="background: #28a745; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download Resume</a>
    </div>
    
    <p style="color: #666; font-size: 13px;">This download link expires in 24 hours. You can always re-export from your dashboard.</p>
  </div>
</body>
</html>`,
  },
  
  // 7. Analysis Complete
  'analysis-complete': {
    subject: 'Your Resume Analysis is Ready! 📊',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #e7f3ff; border: 1px solid #007bff; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #0056b3;">📊 Analysis Complete!</h2>
    
    <p>Hi {{name}},</p>
    <p>Your resume analysis for <strong>{{jobTitle}}</strong> is ready.</p>
    
    <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <p style="font-size: 48px; font-weight: bold; color: {{scoreColor}}; margin: 0;">{{atsScore}}%</p>
      <p style="color: #666; margin: 5px 0;">ATS Compatibility Score</p>
    </div>
    
    <p>Key findings:</p>
    <ul>
      <li>{{finding1}}</li>
      <li>{{finding2}}</li>
      <li>{{finding3}}</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/analysis" style="background: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Full Analysis</a>
    </div>
  </div>
</body>
</html>`,
  },
  
  // 8. Account Activity Alert
  'account-activity': {
    subject: '🔔 New login to your ResumeBuddy account',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8d7da; border: 1px solid #dc3545; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #721c24;">🔔 New Login Detected</h2>
    
    <p>Hi {{name}},</p>
    <p>We detected a new login to your ResumeBuddy account:</p>
    
    <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Device:</strong> {{device}}</p>
      <p style="margin: 5px 0;"><strong>Location:</strong> {{location}}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> {{time}}</p>
      <p style="margin: 5px 0;"><strong>IP Address:</strong> {{ipAddress}}</p>
    </div>
    
    <p>If this was you, you can safely ignore this email.</p>
    
    <p style="color: #dc3545; font-weight: bold;">If this wasn't you, please secure your account immediately:</p>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{appUrl}}/profile/security" style="background: #dc3545; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Secure Account</a>
    </div>
  </div>
</body>
</html>`,
  },
  
  // 9. Daily Summary
  'daily-summary': {
    subject: '📈 Your ResumeBuddy Daily Summary',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #333;">📈 Your Daily Summary</h2>
    
    <p>Hi {{name}},</p>
    <p>Here's what happened on ResumeBuddy yesterday:</p>
    
    <div style="display: flex; justify-content: space-around; text-align: center; margin: 20px 0;">
      <div style="background: #fff; padding: 15px 25px; border-radius: 8px;">
        <p style="font-size: 28px; font-weight: bold; color: #667eea; margin: 0;">{{analysisCount}}</p>
        <p style="color: #666; margin: 5px 0;">Analyses</p>
      </div>
      <div style="background: #fff; padding: 15px 25px; border-radius: 8px;">
        <p style="font-size: 28px; font-weight: bold; color: #28a745; margin: 0;">{{exportCount}}</p>
        <p style="color: #666; margin: 5px 0;">Exports</p>
      </div>
      <div style="background: #fff; padding: 15px 25px; border-radius: 8px;">
        <p style="font-size: 28px; font-weight: bold; color: #ffc107; margin: 0;">{{creditsRemaining}}</p>
        <p style="color: #666; margin: 5px 0;">Credits Left</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
    </div>
  </div>
</body>
</html>`,
  },
  
  // 10. Feedback Request
  'feedback-request': {
    subject: 'Quick question about ResumeBuddy 💭',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h2 style="text-align: center; color: #333;">We'd Love Your Feedback! 💭</h2>
    
    <p>Hi {{name}},</p>
    <p>You've been using ResumeBuddy for {{daysUsing}} days now. We'd love to hear your thoughts!</p>
    
    <p>On a scale of 1-10, how likely are you to recommend ResumeBuddy to a friend?</p>
    
    <div style="text-align: center; margin: 20px 0;">
      {{ratingButtons}}
    </div>
    
    <p style="color: #666; font-size: 13px;">Your feedback helps us improve ResumeBuddy for everyone.</p>
  </div>
</body>
</html>`,
  },
};

// ============ Template Renderer ============

export function renderEmailTemplate(
  templateName: keyof typeof templates,
  data: TemplateData
): { subject: string; html: string } {
  const template = templates[templateName];
  
  if (!template) {
    throw new Error(`Email template "${templateName}" not found`);
  }
  
  const mergedData = { ...DEFAULT_DATA, ...data };
  
  return {
    subject: interpolate(template.subject, mergedData),
    html: interpolate(template.html, mergedData),
  };
}

export type EmailTemplate = keyof typeof templates;
```

Create `packages/queue/src/workers/email.worker.ts`:

```typescript
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { EmailJob } from '../index';
import { sendEmail } from '../email-service';
import { renderEmailTemplate } from '../email-templates';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const emailWorker = new Worker<EmailJob>(
  'emails',
  async (job: Job<EmailJob>) => {
    const { type, to, subject, data } = job.data;

    console.log(`📧 Processing email job: ${type} to ${to}`);

    try {
      // Render template
      const rendered = renderEmailTemplate(type as any, {
        ...data,
        email: to,
      });
      
      // Override subject if provided
      const finalSubject = subject || rendered.subject;
      
      // Send email
      const result = await sendEmail({
        to,
        subject: finalSubject,
        html: rendered.html,
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      console.log(`✅ Email sent successfully: ${type} to ${to} (${result.messageId})`);
      
      return { 
        sent: true, 
        to, 
        type, 
        messageId: result.messageId 
      };
    } catch (error: any) {
      console.error(`❌ Email failed: ${type} to ${to}:`, error.message);
      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 emails concurrently
    limiter: {
      max: 100, // Max 100 emails per minute
      duration: 60000,
    },
  }
);

// ============ Event Handlers ============

emailWorker.on('completed', (job) => {
  console.log(`📧 Email job ${job.id} completed: ${job.data.type} to ${job.data.to}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`📧 Email job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
  
  // Optionally notify on critical failures
  if (job && job.attemptsMade >= 3) {
    console.error(`🚨 CRITICAL: Email to ${job.data.to} failed permanently`);
    // TODO: Send to error tracking service (Sentry, etc.)
  }
});

emailWorker.on('stalled', (jobId) => {
  console.warn(`📧 Email job ${jobId} stalled`);
});

export { emailWorker };
```

Create `packages/queue/src/workers/whatsapp.worker.ts`:

```typescript
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { WhatsAppJob } from '../index';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ============ WhatsApp Templates ============

const WHATSAPP_TEMPLATES = {
  otp_verification: {
    body: 'Your ResumeBuddy verification code is: {{1}}. Valid for {{2}} minutes. Do not share this code.',
  },
  welcome_message: {
    body: 'Welcome to ResumeBuddy, {{1}}! 🎉 Your AI-powered resume assistant is ready. Start analyzing your resume at {{2}}',
  },
  login_notification: {
    body: '🔔 New login to your ResumeBuddy account detected from {{1}} at {{2}}. If this wasn\'t you, secure your account immediately.',
  },
  subscription_confirmation: {
    body: '🚀 Congratulations {{1}}! Your ResumeBuddy Pro subscription is now active. Enjoy unlimited exports and advanced features!',
  },
  export_ready: {
    body: '📄 Your resume export is ready! Download it here: {{1}}. Link expires in 24 hours.',
  },
  interview_reminder: {
    body: '📅 Reminder: You have interview practice scheduled for {{1}} role. Practice your questions now: {{2}}',
  },
  daily_tip: {
    body: '💡 Resume Tip of the Day: {{1}}\n\nApply this tip to boost your ATS score!',
  },
};

// ============ WhatsApp Provider ============

interface WhatsAppProvider {
  sendTemplate(
    to: string,
    templateName: string,
    templateData: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class TwilioWhatsAppProvider implements WhatsAppProvider {
  private client: any;
  private fromNumber: string;
  
  constructor() {
    this.client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER!;
  }
  
  async sendTemplate(
    to: string,
    templateName: string,
    templateData: Record<string, string>
  ) {
    try {
      const template = WHATSAPP_TEMPLATES[templateName as keyof typeof WHATSAPP_TEMPLATES];
      if (!template) {
        return { success: false, error: `Template "${templateName}" not found` };
      }
      
      // Replace template variables
      let body = template.body;
      Object.entries(templateData).forEach(([key, value], index) => {
        body = body.replace(`{{${index + 1}}}`, value);
      });
      
      const message = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to: `whatsapp:${to}`,
      });
      
      return { success: true, messageId: message.sid };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class MetaWhatsAppProvider implements WhatsAppProvider {
  private phoneNumberId: string;
  private accessToken: string;
  
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_ID!;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  }
  
  async sendTemplate(
    to: string,
    templateName: string,
    templateData: Record<string, string>
  ) {
    try {
      const parameters = Object.values(templateData).map(text => ({
        type: 'text',
        text,
      }));
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to.replace('+', ''),
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
              components: [
                {
                  type: 'body',
                  parameters,
                },
              ],
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id };
      }
      
      return { success: false, error: data.error?.message || 'Unknown error' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// ============ Get Provider ============

function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    return new TwilioWhatsAppProvider();
  }
  if (process.env.WHATSAPP_BUSINESS_PHONE_ID) {
    return new MetaWhatsAppProvider();
  }
  throw new Error('No WhatsApp provider configured');
}

// ============ Worker ============

const whatsappWorker = new Worker<WhatsAppJob>(
  'whatsapp',
  async (job: Job<WhatsAppJob>) => {
    const { type, to, templateName, templateData } = job.data;

    console.log(`📱 Processing WhatsApp job: ${type} to ${to}`);

    try {
      const provider = getWhatsAppProvider();
      const result = await provider.sendTemplate(to, templateName, templateData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send WhatsApp message');
      }
      
      console.log(`✅ WhatsApp sent: ${type} to ${to} (${result.messageId})`);
      
      return { 
        sent: true, 
        to, 
        type, 
        messageId: result.messageId 
      };
    } catch (error: any) {
      console.error(`❌ WhatsApp failed: ${type} to ${to}:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 50, // WhatsApp has stricter rate limits
      duration: 60000,
    },
  }
);

// ============ Event Handlers ============

whatsappWorker.on('completed', (job) => {
  console.log(`📱 WhatsApp job ${job.id} completed: ${job.data.type} to ${job.data.to}`);
});

whatsappWorker.on('failed', (job, err) => {
  console.error(`📱 WhatsApp job ${job?.id} failed:`, err.message);
});

export { whatsappWorker };
```

Create `packages/queue/src/workers/sms.worker.ts`:

```typescript
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { SMSJob } from '../index';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ============ SMS Providers ============

interface SMSProvider {
  send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class TwilioSMSProvider implements SMSProvider {
  private client: any;
  private fromNumber: string;
  
  constructor() {
    this.client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_SMS_NUMBER || 
      process.env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', '') || '';
  }
  
  async send(to: string, message: string) {
    try {
      const msg = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to,
      });
      return { success: true, messageId: msg.sid };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class MSG91Provider implements SMSProvider {
  private authKey: string;
  
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY!;
  }
  
  async send(to: string, message: string) {
    try {
      const otp = message.match(/\d{6}/)?.[0] || '';
      
      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: to.replace('+', ''),
          otp,
        }),
      });
      
      const data = await response.json();
      
      if (data.type === 'success') {
        return { success: true, messageId: data.request_id };
      }
      
      return { success: false, error: data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

function getSMSProvider(): SMSProvider {
  if (process.env.SMS_PROVIDER === 'msg91' && process.env.MSG91_AUTH_KEY) {
    return new MSG91Provider();
  }
  return new TwilioSMSProvider();
}

// ============ Worker ============

const smsWorker = new Worker<SMSJob>(
  'sms',
  async (job: Job<SMSJob>) => {
    const { type, to, message } = job.data;

    console.log(`📲 Processing SMS job: ${type} to ${to}`);

    try {
      const provider = getSMSProvider();
      const result = await provider.send(to, message);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send SMS');
      }
      
      console.log(`✅ SMS sent: ${type} to ${to} (${result.messageId})`);
      
      return { sent: true, to, type, messageId: result.messageId };
    } catch (error: any) {
      console.error(`❌ SMS failed: ${type} to ${to}:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 30,
      duration: 60000,
    },
  }
);

smsWorker.on('completed', (job) => {
  console.log(`📲 SMS job ${job.id} completed: ${job.data.type} to ${job.data.to}`);
});

smsWorker.on('failed', (job, err) => {
  console.error(`📲 SMS job ${job?.id} failed:`, err.message);
});

export { smsWorker };
```

Create `packages/queue/src/workers/index.ts`:

```typescript
// Worker orchestrator - start all workers
import { emailWorker } from './email.worker';
import { whatsappWorker } from './whatsapp.worker';
import { smsWorker } from './sms.worker';

console.log('🚀 Starting notification workers...');
console.log('📧 Email worker ready');
console.log('📱 WhatsApp worker ready');
console.log('📲 SMS worker ready');

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down workers...');
  
  await Promise.all([
    emailWorker.close(),
    whatsappWorker.close(),
    smsWorker.close(),
  ]);
  
  console.log('All workers stopped');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { emailWorker, whatsappWorker, smsWorker };
```

---

## 10. Real-time Features

### 10.1 WebSocket Server

Create `apps/websocket/src/server.ts`:

```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { verifyAccessToken } from '@resumebuddy/auth';

// ============ Setup ============

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Redis adapter for scaling
const pubClient = new Redis(process.env.REDIS_URL!);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// ============ Authentication Middleware ============

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }

  const payload = await verifyAccessToken(token);
  
  if (!payload) {
    return next(new Error('Invalid token'));
  }

  // Attach user data to socket
  socket.data.userId = payload.sub;
  socket.data.email = payload.email;
  socket.data.tier = payload.tier;

  next();
});

// ============ Connection Handlers ============

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`User connected: ${userId}`);

  // Join user-specific room
  socket.join(`user:${userId}`);

  // ============ AI Progress Events ============

  socket.on('subscribe:ai-progress', (taskId: string) => {
    socket.join(`ai:${taskId}`);
    console.log(`User ${userId} subscribed to AI task: ${taskId}`);
  });

  socket.on('unsubscribe:ai-progress', (taskId: string) => {
    socket.leave(`ai:${taskId}`);
  });

  // ============ Interview Session Events ============

  socket.on('join:interview', (interviewId: string) => {
    socket.join(`interview:${interviewId}`);
    console.log(`User ${userId} joined interview: ${interviewId}`);
  });

  socket.on('leave:interview', (interviewId: string) => {
    socket.leave(`interview:${interviewId}`);
  });

  // ============ Presence ============

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
  });
});

// ============ Helper Functions ============

export function emitToUser(userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitAIProgress(taskId: string, progress: {
  stage: string;
  percent: number;
  message?: string;
}) {
  io.to(`ai:${taskId}`).emit('ai:progress', progress);
}

export function emitAIComplete(taskId: string, result: unknown) {
  io.to(`ai:${taskId}`).emit('ai:complete', result);
}

export function emitAIError(taskId: string, error: string) {
  io.to(`ai:${taskId}`).emit('ai:error', { error });
}

// ============ Start Server ============

const PORT = parseInt(process.env.WS_PORT || '3001');

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

export { io, httpServer };
```

---

## 11. Observability & Monitoring

### 11.1 Logging Setup

Create `packages/shared/src/logger.ts`:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    // In production, send to logging service (e.g., Loki, Elasticsearch)
    // For now, structured JSON output
    const output = JSON.stringify(entry);
    
    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }
}

export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}
```

### 11.2 Metrics & Health Checks

Create `apps/web/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@resumebuddy/database';
import { getRedis } from '@resumebuddy/cache';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {};

  // Database check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    checks.database = { status: 'error', error: (error as Error).message };
  }

  // Redis check
  try {
    const start = Date.now();
    await getRedis().ping();
    checks.redis = { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    checks.redis = { status: 'error', error: (error as Error).message };
  }

  // LaTeX service check
  try {
    const start = Date.now();
    const response = await fetch(`${process.env.LATEX_SERVICE_URL}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.latex = { 
      status: response.ok ? 'ok' : 'error', 
      latency: Date.now() - start 
    };
  } catch (error) {
    checks.latex = { status: 'error', error: (error as Error).message };
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, {
    status: allHealthy ? 200 : 503,
  });
}
```

---

## 12. Security Hardening

### 12.1 Security Checklist

```markdown
## Pre-Launch Security Checklist

### Authentication
- [x] bcrypt with 12 rounds for password hashing
- [x] JWT with short expiry (15 min access, 7 day refresh)
- [x] Refresh token rotation
- [x] Session invalidation on password change
- [x] Rate limiting on auth endpoints
- [ ] Add CAPTCHA for registration
- [ ] Implement account lockout after failed attempts

### Data Protection
- [x] Input validation with Zod on all endpoints
- [x] SQL injection prevention via Prisma ORM
- [x] XSS prevention via React's default escaping
- [ ] Encrypt sensitive fields in database
- [ ] Implement field-level encryption for PII

### Transport Security
- [x] HTTPS only in production
- [x] Secure cookie flags (httpOnly, secure, sameSite)
- [x] CORS configuration
- [ ] Certificate pinning for mobile apps

### Infrastructure
- [x] Environment variables for secrets
- [x] No secrets in git
- [ ] Secret rotation strategy
- [ ] Database backup encryption

### Monitoring & Response
- [x] Structured logging
- [x] Health checks
- [ ] Intrusion detection
- [ ] Incident response playbook
```

### 12.2 Security Headers

Update `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 13. Deployment Architecture

### 13.1 Development Setup

```bash
# 1. Clone and setup
git clone https://github.com/youruser/resumebuddy-v2.git
cd resumebuddy-v2

# 2. Install dependencies (using pnpm workspaces)
pnpm install

# 3. Copy environment template
cp .env.template .env

# 4. Start infrastructure
docker compose up -d postgres redis minio

# 5. Run migrations
pnpm --filter @resumebuddy/database db:migrate

# 6. Seed database (optional)
pnpm --filter @resumebuddy/database db:seed

# 7. Start development servers
pnpm dev
```

### 13.2 Production Deployment

**Option 1: Single VPS (DigitalOcean / Hetzner)**

```bash
# Recommended specs: 4 vCPU, 8GB RAM, 160GB SSD ($48/mo)

# 1. SSH to server
ssh root@your-server

# 2. Clone repository
git clone https://github.com/youruser/resumebuddy-v2.git /opt/resumebuddy

# 3. Copy production env
cp /opt/resumebuddy/.env.prod.template /opt/resumebuddy/.env

# 4. Start with Docker Compose
cd /opt/resumebuddy/infrastructure/docker
docker compose -f docker-compose.prod.yml up -d

# 5. Run migrations
docker compose exec web pnpm db:migrate

# 6. Setup SSL (via Traefik)
# Already configured in docker-compose.prod.yml
```

**Option 2: Kubernetes (for scale)**

```yaml
# k8s/deployment.yaml (example)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resumebuddy-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: resumebuddy-web
  template:
    metadata:
      labels:
        app: resumebuddy-web
    spec:
      containers:
      - name: web
        image: ghcr.io/youruser/resumebuddy-web:latest
        ports:
        - containerPort: 9002
        envFrom:
        - secretRef:
            name: resumebuddy-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 13.3 CI/CD Pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: |
          docker build -f infrastructure/docker/Dockerfile.web -t resumebuddy-web .
          docker build -f infrastructure/docker/Dockerfile.websocket -t resumebuddy-ws .
      - name: Push to registry
        run: |
          echo ${{ secrets.GHCR_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker tag resumebuddy-web ghcr.io/${{ github.repository_owner }}/resumebuddy-web:latest
          docker push ghcr.io/${{ github.repository_owner }}/resumebuddy-web:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/resumebuddy
            docker compose -f infrastructure/docker/docker-compose.prod.yml pull
            docker compose -f infrastructure/docker/docker-compose.prod.yml up -d
            docker compose exec -T web pnpm db:migrate
```

---

## 14. Migration Strategy

### 14.1 Migration Phases

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION TIMELINE                            │
└─────────────────────────────────────────────────────────────────┘

Phase 1: Parallel Infrastructure (Week 1-2)
├── Set up PostgreSQL + Redis + MinIO
├── Create Prisma schema
├── Build custom auth system
└── Test in staging environment

Phase 2: Data Migration (Week 3)
├── Export Firestore data to JSON
├── Transform to PostgreSQL format
├── Migrate users (hash passwords preserved if possible)
├── Migrate subscriptions
└── Migrate usage records

Phase 3: Feature Parity (Week 4-5)
├── Migrate server actions
├── Update auth context
├── Test all AI flows
├── Test payment flows
└── Load testing

Phase 4: Cutover (Week 6)
├── DNS switch (blue-green)
├── Monitor for issues
├── Keep Firebase running read-only (rollback)
└── Full switchover after 48h stable

Phase 5: Cleanup (Week 7)
├── Remove Firebase dependencies
├── Delete old code
├── Update documentation
└── Decommission Firebase project
```

### 14.2 Data Migration Script

Create `scripts/migrate-from-firebase.ts`:

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { prisma } from '@resumebuddy/database';

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
initializeApp({ credential: cert(serviceAccount) });

const firestoreDb = getFirestore();

async function migrateUsers() {
  console.log('Migrating users...');
  
  const usersSnapshot = await firestoreDb.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const firebaseUser = doc.data();
    
    try {
      await prisma.user.create({
        data: {
          id: doc.id, // Preserve Firebase UID
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          image: firebaseUser.photoURL,
          createdAt: firebaseUser.createdAt?.toDate() || new Date(),
          lastLoginAt: firebaseUser.lastLogin?.toDate(),
          role: firebaseUser.role === 'admin' ? 'ADMIN' : 'USER',
          status: 'ACTIVE',
        },
      });
      console.log(`Migrated user: ${firebaseUser.email}`);
    } catch (error) {
      console.error(`Failed to migrate user ${doc.id}:`, error);
    }
  }
}

async function migrateSubscriptions() {
  console.log('Migrating subscriptions...');
  
  const subsSnapshot = await firestoreDb.collection('subscriptions').get();
  
  for (const doc of subsSnapshot.docs) {
    const sub = doc.data();
    
    try {
      await prisma.subscription.create({
        data: {
          userId: doc.id,
          tier: sub.tier === 'pro' ? 'PRO' : 'FREE',
          status: sub.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          provider: sub.provider,
          razorpayPaymentId: sub.razorpayPaymentId,
          currentPeriodStart: sub.currentPeriodStart?.toDate(),
          currentPeriodEnd: sub.currentPeriodEnd?.toDate(),
        },
      });
      console.log(`Migrated subscription for user: ${doc.id}`);
    } catch (error) {
      console.error(`Failed to migrate subscription ${doc.id}:`, error);
    }
  }
}

async function main() {
  console.log('Starting migration from Firebase...');
  
  await migrateUsers();
  await migrateSubscriptions();
  // Add more migration functions as needed
  
  console.log('Migration complete!');
}

main().catch(console.error);
```

---

## 15. Implementation Roadmap

### 15.1 Detailed Task Breakdown

```
Week 1: Infrastructure Setup
├── [ ] Create monorepo structure
├── [ ] Set up Docker Compose
├── [ ] Configure PostgreSQL
├── [ ] Configure Redis
├── [ ] Configure MinIO
├── [ ] Create Prisma schema
└── [ ] Run initial migrations

Week 2: Authentication System
├── [ ] Implement JWT generation/verification
├── [ ] Implement session management (Redis)
├── [ ] Build password hashing utilities
├── [ ] Create auth API routes
├── [ ] Implement Google OAuth
├── [ ] Implement WhatsApp OTP authentication
├── [ ] Implement SMS OTP fallback
├── [ ] Implement Email OTP (magic link)
├── [ ] Build AuthContext (client)
└── [ ] Update middleware

Week 3: Database Layer
├── [ ] Create database helpers
├── [ ] Implement subscription service
├── [ ] Implement usage tracking
├── [ ] Implement rate limiting (Redis)
├── [ ] Create migration scripts
└── [ ] Write database tests

Week 4: API & Server Actions
├── [ ] Migrate server actions
├── [ ] Update AI flow integrations
├── [ ] Implement file storage (MinIO)
├── [ ] Update payment webhooks
└── [ ] Create health check endpoints

Week 5: Real-time & Background Jobs
├── [ ] Set up WebSocket server
├── [ ] Implement BullMQ queues
├── [ ] Create email worker with all templates
├── [ ] Create WhatsApp worker
├── [ ] Create SMS worker
├── [ ] Create cleanup worker
├── [ ] Implement notification service (unified)
├── [ ] Set up email templates (welcome, verification, password-reset, etc.)
└── [ ] Integrate with main app

Week 6: Testing & Migration
├── [ ] Write integration tests
├── [ ] Perform load testing
├── [ ] Execute data migration
├── [ ] Set up monitoring
└── [ ] Blue-green deployment

Week 7: Cleanup & Documentation
├── [ ] Remove Firebase dependencies
├── [ ] Update all documentation
├── [ ] Create runbooks
├── [ ] Performance optimization
└── [ ] Final review
```

### 15.2 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Full Firestore backup, parallel run period |
| Auth system vulnerabilities | Security audit, penetration testing |
| Performance regression | Load testing before cutover, performance benchmarks |
| User disruption | Blue-green deployment, quick rollback capability |
| Subscription billing issues | Test payment flow extensively, manual verification |

---

## 16. Cost Analysis

### 16.1 Firebase vs Self-Hosted Comparison

**Current Firebase Costs (estimated at scale)**:
```
Firebase Auth: $0 (up to 50k MAU free)
Firestore: 
  - Reads: $0.06 per 100k (estimate 5M/month = $3)
  - Writes: $0.18 per 100k (estimate 500k/month = $0.90)
  - Storage: $0.18/GB (estimate 10GB = $1.80)
Firebase Storage: $0.026/GB (estimate 50GB = $1.30)

Total Firebase: ~$7/month (low usage)
At scale (100k users): ~$50-200/month
```

**Self-Hosted Costs**:
```
VPS (DigitalOcean 4vCPU/8GB): $48/month
Managed PostgreSQL (optional): $15/month
Backups (block storage): $10/month
Domain + SSL: $12/year = $1/month

Total Self-Hosted: ~$60-74/month (fixed)
```

### 16.2 Break-Even Analysis

- **Low usage (<10k users)**: Firebase is cheaper
- **Medium usage (10-50k users)**: Self-hosted becomes competitive
- **High usage (>50k users)**: Self-hosted is significantly cheaper
- **Enterprise (>100k users)**: Self-hosted saves $100-500+/month

### 16.3 Hidden Benefits of Self-Hosted

1. **No Vendor Lock-in**: Migrate to any cloud provider
2. **Full Data Ownership**: GDPR compliance simplified
3. **Customization**: No Firebase limitations
4. **Predictable Costs**: Fixed monthly cost vs usage-based
5. **Performance**: Tune database, caching to your needs
6. **Learning**: Deep understanding of your stack

---

## Summary

This transformation moves ResumeBuddy from a Firebase-dependent architecture to a **fully self-hosted, enterprise-grade platform**. Key changes:

1. **Authentication**: Custom JWT + Redis sessions (replaces Firebase Auth)
2. **Database**: PostgreSQL + Prisma ORM (replaces Firestore)
3. **File Storage**: MinIO S3-compatible (replaces Firebase Storage)
4. **Caching**: Redis (unified cache, sessions, rate limiting)
5. **Real-time**: Socket.io (replaces Firestore listeners)
6. **Background Jobs**: BullMQ (new capability)
7. **Monitoring**: Structured logging + health checks

**Total Effort**: ~7 weeks for full migration  
**Team Size**: 1-2 developers  
**Risk Level**: Medium (mitigated by parallel run period)

The result is a production-ready, scalable platform with full control over every component.
