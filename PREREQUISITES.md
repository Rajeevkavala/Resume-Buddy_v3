# ResumeBuddy 2.0 - Prerequisites & Setup Guide

> **Last Updated:** February 2026
> **Applies To:** Full self-hosted architecture (no Firebase/Supabase)

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Required Software](#2-required-software)
3. [API Keys & External Services](#3-api-keys--external-services)
4. [Infrastructure Services (Docker)](#4-infrastructure-services-docker)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Installation Checklist](#6-installation-checklist)
7. [Verification Steps](#7-verification-steps)

---

## 1. System Requirements

### Hardware (Development)

| Resource   | Minimum        | Recommended     |
|------------|----------------|-----------------|
| **CPU**    | 4 cores        | 8+ cores        |
| **RAM**    | 8 GB           | 16 GB           |
| **Disk**   | 20 GB free     | 50 GB SSD       |
| **OS**     | Windows 10/11, macOS 12+, Ubuntu 20.04+ | Same |

### Hardware (Production - VPS/Cloud)

| Resource   | Minimum        | Recommended     |
|------------|----------------|-----------------|
| **CPU**    | 2 vCPUs        | 4 vCPUs         |
| **RAM**    | 4 GB           | 8 GB            |
| **Disk**   | 40 GB SSD      | 100 GB SSD      |
| **Network**| 1 Gbps         | 1 Gbps          |

---

## 2. Required Software

### 2.1 Core Runtime & Package Manager

| Software        | Version    | Purpose                        | Install Link |
|-----------------|------------|--------------------------------|--------------|
| **Node.js**     | 20 LTS+    | JavaScript runtime             | https://nodejs.org/ |
| **pnpm**        | 9.x+       | Fast package manager (monorepo)| `npm install -g pnpm` |
| **TypeScript**  | 5.x+       | Type-safe development          | Installed via `package.json` |

```bash
# Verify installations
node --version   # v20.x.x or higher
pnpm --version   # 9.x.x
npx tsc --version # 5.x.x
```

### 2.2 Containerization

| Software           | Version  | Purpose                                | Install Link |
|--------------------|----------|----------------------------------------|--------------|
| **Docker Desktop** | 4.x+     | Container runtime (PostgreSQL, Redis, MinIO) | https://www.docker.com/products/docker-desktop/ |
| **Docker Compose** | 2.x+     | Multi-container orchestration          | Bundled with Docker Desktop |

```bash
docker --version           # Docker version 24.x+
docker compose version     # Docker Compose version v2.x+
```

### 2.3 Database Tools (Optional but Recommended)

| Software            | Purpose                         | Install Link |
|---------------------|---------------------------------|--------------|
| **pgAdmin 4**       | PostgreSQL GUI management       | https://www.pgadmin.org/ |
| **DBeaver**         | Universal database client       | https://dbeaver.io/ |
| **Redis Insight**   | Redis GUI client                | https://redis.io/insight/ |
| **Prisma Studio**   | Visual ORM database browser     | `pnpm prisma studio` (built-in) |

### 2.4 Build & Dev Tools

| Software       | Version | Purpose                          | Install Link |
|----------------|---------|----------------------------------|--------------|
| **Git**        | 2.x+    | Version control                  | https://git-scm.com/ |
| **VS Code**    | Latest  | Code editor (recommended)        | https://code.visualstudio.com/ |
| **Turborepo**  | Latest  | Monorepo build system            | `pnpm add -g turbo` |

### 2.5 LaTeX Service (PDF Generation)

| Software      | Purpose                      | Notes |
|---------------|------------------------------|-------|
| **tectonic**  | LaTeX → PDF compilation      | Required only if running LaTeX service **outside** Docker |
| **Docker**    | Runs LaTeX service container | Recommended approach (no local tectonic needed) |

```bash
# Option A: Run LaTeX service via Docker (recommended)
cd services/resume-latex-service
npm run docker:build
npm run docker:run   # Runs on port 8080

# Option B: Install tectonic locally (if not using Docker)
# Windows: choco install tectonic
# macOS:   brew install tectonic
# Linux:   cargo install tectonic
tectonic --version
```

---

## 3. API Keys & External Services

### 3.1 AI Providers (Required — at least one)

The app uses a multi-provider fallback chain: **Groq → Gemini → OpenRouter**.

| Provider       | Key Format        | Free Tier                    | Get Key |
|----------------|-------------------|------------------------------|---------|
| **Groq**       | `gsk_xxx...`      | 14,400 requests/day          | https://console.groq.com/keys |
| **Google Gemini** | `AIzaSy...`    | 1,500 requests/day           | https://aistudio.google.com/apikey |
| **OpenRouter** | `sk-or-xxx...`    | Free models (Llama, Mistral) | https://openrouter.ai/keys |

> **Minimum:** You need **at least Groq API key** to run the app. Gemini and OpenRouter are fallbacks.

**How to obtain:**

1. **Groq** — Sign up at https://console.groq.com → Dashboard → API Keys → Create
2. **Google Gemini** — Go to https://aistudio.google.com → Get API Key → Create in new project
3. **OpenRouter** — Sign up at https://openrouter.ai → Keys → Create Key

### 3.2 Payment Gateway (Required for subscriptions)

| Service       | Keys Needed                              | Get Keys |
|---------------|------------------------------------------|----------|
| **Razorpay**  | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | https://dashboard.razorpay.com/ |

**Setup steps:**
1. Create Razorpay account → https://dashboard.razorpay.com/
2. Go to **Settings → API Keys → Generate Key**
3. Go to **Settings → Webhooks → Add New Webhook**
   - URL: `https://yourdomain.com/api/razorpay/webhook`
   - Events: `payment.captured`, `subscription.activated`, `subscription.completed`
   - Copy the webhook secret

### 3.3 OAuth Providers (Required for social login)

| Provider     | Keys Needed                                    | Console |
|--------------|------------------------------------------------|---------|
| **Google**   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`     | https://console.cloud.google.com/apis/credentials |
| **GitHub**   | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`     | https://github.com/settings/developers |

**Google OAuth Setup:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:9002/api/auth/callback/google`
4. Copy Client ID and Client Secret

**GitHub OAuth Setup:**
1. Go to GitHub Settings → Developer Settings → OAuth Apps → New
2. Set callback URL: `http://localhost:9002/api/auth/callback/github`
3. Copy Client ID and Client Secret

### 3.4 Email Service (Required for notifications)

Choose **one** of the following:

| Service        | Key Format            | Free Tier             | Get Key |
|----------------|-----------------------|-----------------------|---------|
| **Resend**     | `re_xxx...`           | 3,000 emails/month    | https://resend.com/api-keys |
| **SendGrid**   | `SG.xxx...`           | 100 emails/day        | https://app.sendgrid.com/settings/api_keys |
| **SMTP (Gmail)** | Gmail App Password  | 500 emails/day        | https://myaccount.google.com/apppasswords |

**Resend Setup (Recommended):**
1. Sign up at https://resend.com
2. Add and verify your domain
3. Go to API Keys → Create API Key
4. Set `RESEND_API_KEY` in `.env`

**Gmail SMTP Setup (Quick start):**
1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use credentials in `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

### 3.5 WhatsApp & SMS (Optional — for OTP)

| Service           | Purpose                  | Get Key |
|-------------------|--------------------------|---------|
| **Twilio**        | WhatsApp + SMS OTP       | https://console.twilio.com/ |
| **Gupshup**       | WhatsApp Business API    | https://www.gupshup.io/ |
| **MSG91**         | SMS fallback (India)     | https://msg91.com/ |
| **Meta WhatsApp** | Direct WhatsApp Business | https://developers.facebook.com/ |

> **Note:** WhatsApp OTP is optional. Email OTP works as a fallback for verification.

**Twilio Setup:**
1. Sign up at https://console.twilio.com
2. Get Account SID and Auth Token from Dashboard
3. Enable WhatsApp Sandbox (for testing) or request a WhatsApp sender
4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`

### 3.6 Monitoring & Analytics (Optional)

| Service              | Purpose              | Free Tier      | Link |
|----------------------|----------------------|----------------|------|
| **Sentry**           | Error tracking       | 5K events/mo   | https://sentry.io/ |
| **Vercel Analytics** | Web analytics        | Included       | Already integrated |
| **LogRocket**        | Session replay       | 1K sessions/mo | https://logrocket.com/ |

---

## 4. Infrastructure Services (Docker)

The following services run as Docker containers and do **not** require external accounts:

### 4.1 PostgreSQL 16

| Property       | Value                                    |
|----------------|------------------------------------------|
| **Image**      | `postgres:16-alpine`                     |
| **Port**       | `5432`                                   |
| **Purpose**    | Primary database (users, subscriptions, analyses, sessions) |
| **Data**       | Persisted via Docker volume `postgres_data` |

### 4.2 Redis 7

| Property       | Value                                    |
|----------------|------------------------------------------|
| **Image**      | `redis:7-alpine`                         |
| **Port**       | `6379`                                   |
| **Purpose**    | Sessions, rate limiting, caching, job queue, pub/sub |
| **Data**       | Persisted via Docker volume `redis_data` |

### 4.3 MinIO (S3-Compatible Storage)

| Property       | Value                                    |
|----------------|------------------------------------------|
| **Image**      | `minio/minio:latest`                     |
| **Ports**      | `9000` (S3 API), `9001` (Console UI)     |
| **Purpose**    | Resume PDF storage, profile photos, exports |
| **Data**       | Persisted via Docker volume `minio_data` |
| **Console**    | http://localhost:9001 (login with MINIO credentials) |

### 4.4 LaTeX Service

| Property       | Value                                    |
|----------------|------------------------------------------|
| **Image**      | Custom (built from `services/resume-latex-service/Dockerfile`) |
| **Port**       | `8080`                                   |
| **Purpose**    | LaTeX → PDF compilation for resume exports |
| **Health**     | http://localhost:8080/healthz             |

### Starting All Infrastructure

```bash
# Start all services
cd infrastructure/docker
docker compose up -d

# Verify everything is running
docker compose ps

# Expected output:
# resumebuddy-db       running (postgres:5432)
# resumebuddy-redis    running (redis:6379)
# resumebuddy-storage  running (minio:9000/9001)
```

---

## 5. Environment Variables Reference

Create a `.env` file in the project root with the following variables:

```env
# ═══════════════════════════════════════════════
# DATABASE (PostgreSQL via Docker)
# ═══════════════════════════════════════════════
DB_USER=resumebuddy
DB_PASSWORD=<your_secure_password>
DB_NAME=resumebuddy
DATABASE_URL=postgresql://resumebuddy:<your_secure_password>@localhost:5432/resumebuddy

# ═══════════════════════════════════════════════
# CACHE & SESSIONS (Redis via Docker)
# ═══════════════════════════════════════════════
REDIS_PASSWORD=<your_redis_password>
REDIS_URL=redis://:<your_redis_password>@localhost:6379

# ═══════════════════════════════════════════════
# FILE STORAGE (MinIO via Docker)
# ═══════════════════════════════════════════════
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<your_minio_secret>
MINIO_BUCKET=resumebuddy

# ═══════════════════════════════════════════════
# AUTHENTICATION (Custom JWT)
# ═══════════════════════════════════════════════
JWT_SECRET=<min_32_char_random_string>
JWT_REFRESH_SECRET=<min_32_char_random_string>
SESSION_COOKIE_NAME=rb_session
SESSION_TTL=604800

# ═══════════════════════════════════════════════
# OAUTH PROVIDERS
# ═══════════════════════════════════════════════
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GITHUB_CLIENT_ID=<your_github_client_id>
GITHUB_CLIENT_SECRET=<your_github_client_secret>

# ═══════════════════════════════════════════════
# AI PROVIDERS (at least Groq required)
# ═══════════════════════════════════════════════
GROQ_API_KEY=gsk_<your_groq_key>
GOOGLE_API_KEY=<your_gemini_key>
OPENROUTER_API_KEY=sk-or-<your_openrouter_key>

# ═══════════════════════════════════════════════
# EMAIL SERVICE (choose one)
# ═══════════════════════════════════════════════
# Option A: Resend
RESEND_API_KEY=re_<your_resend_key>
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=ResumeBuddy

# Option B: SMTP / Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>@gmail.com
SMTP_PASSWORD=<your_app_password>

# ═══════════════════════════════════════════════
# WHATSAPP & SMS (Optional)
# ═══════════════════════════════════════════════
TWILIO_ACCOUNT_SID=AC<your_sid>
TWILIO_AUTH_TOKEN=<your_auth_token>
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

SMS_PROVIDER=twilio
# MSG91_AUTH_KEY=<your_msg91_key>
# MSG91_SENDER_ID=RBUDDY

# ═══════════════════════════════════════════════
# PAYMENTS (Razorpay)
# ═══════════════════════════════════════════════
RAZORPAY_KEY_ID=rzp_<your_key_id>
RAZORPAY_KEY_SECRET=<your_key_secret>
RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>

# ═══════════════════════════════════════════════
# SERVICES
# ═══════════════════════════════════════════════
LATEX_SERVICE_URL=http://localhost:8080
WEBSOCKET_URL=ws://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:9002

# ═══════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════
NODE_ENV=development

# ═══════════════════════════════════════════════
# MONITORING (Optional)
# ═══════════════════════════════════════════════
# SENTRY_DSN=https://<key>@sentry.io/<project>

# ═══════════════════════════════════════════════
# PRODUCTION ONLY
# ═══════════════════════════════════════════════
# ACME_EMAIL=admin@yourdomain.com
```

---

## 6. Installation Checklist

Use this checklist to verify all prerequisites are in place before starting development.

### Software

- [ ] Node.js 20 LTS installed (`node --version`)
- [ ] pnpm 9+ installed (`pnpm --version`)
- [ ] Docker Desktop installed and running (`docker --version`)
- [ ] Docker Compose v2 available (`docker compose version`)
- [ ] Git installed (`git --version`)
- [ ] VS Code (or preferred editor) installed

### API Keys Obtained

- [ ] **Groq** API key (primary AI provider)
- [ ] **Google Gemini** API key (AI fallback)
- [ ] **OpenRouter** API key (AI last resort)
- [ ] **Razorpay** Key ID + Secret + Webhook Secret
- [ ] **Google OAuth** Client ID + Secret
- [ ] **GitHub OAuth** Client ID + Secret (optional)
- [ ] **Email service** key (Resend / SendGrid / Gmail SMTP)
- [ ] **Twilio** credentials (optional, for WhatsApp/SMS OTP)

### Infrastructure

- [ ] PostgreSQL container running on port `5432`
- [ ] Redis container running on port `6379`
- [ ] MinIO container running on ports `9000` / `9001`
- [ ] LaTeX service running on port `8080`
- [ ] `.env` file created with all required variables

### Database

- [ ] Prisma schema defined (`packages/database/prisma/schema.prisma`)
- [ ] Prisma migration applied (`pnpm prisma migrate dev`)
- [ ] Prisma client generated (`pnpm prisma generate`)

---

## 7. Verification Steps

Run these commands after setup to confirm everything works:

```bash
# 1. Check Docker services
docker compose ps
# All containers should show "running" / "healthy"

# 2. Test PostgreSQL connection
docker exec resumebuddy-db psql -U resumebuddy -c "SELECT 1;"
# Expected: 1

# 3. Test Redis connection
docker exec resumebuddy-redis redis-cli -a <your_redis_password> PING
# Expected: PONG

# 4. Test MinIO
curl http://localhost:9000/minio/health/live
# Expected: HTTP 200

# 5. Test LaTeX service
curl http://localhost:8080/healthz
# Expected: {"status":"ok"}

# 6. Install dependencies
pnpm install

# 7. Generate Prisma client
cd packages/database && pnpm prisma generate

# 8. Run database migration
pnpm prisma migrate dev --name init

# 9. Start the app
cd apps/web && pnpm dev
# App should be running at http://localhost:9002

# 10. Smoke test AI
curl -X POST http://localhost:9002/api/health
# Expected: HTTP 200
```

### Quick Health Check Script

```bash
#!/bin/bash
echo "=== ResumeBuddy Prerequisites Check ==="

echo -n "Node.js: "; node --version 2>/dev/null || echo "NOT INSTALLED"
echo -n "pnpm: "; pnpm --version 2>/dev/null || echo "NOT INSTALLED"
echo -n "Docker: "; docker --version 2>/dev/null || echo "NOT INSTALLED"
echo -n "Git: "; git --version 2>/dev/null || echo "NOT INSTALLED"

echo ""
echo "=== Docker Services ==="
docker compose ps 2>/dev/null || echo "Docker Compose not running"

echo ""
echo "=== Environment File ==="
[ -f .env ] && echo ".env exists" || echo ".env MISSING"

echo ""
echo "=== Required API Keys ==="
[ -n "$GROQ_API_KEY" ] && echo "GROQ_API_KEY: SET" || echo "GROQ_API_KEY: MISSING"
[ -n "$RAZORPAY_KEY_ID" ] && echo "RAZORPAY_KEY_ID: SET" || echo "RAZORPAY_KEY_ID: MISSING"
[ -n "$JWT_SECRET" ] && echo "JWT_SECRET: SET" || echo "JWT_SECRET: MISSING"

echo ""
echo "=== Check Complete ==="
```

---

## Cost Summary (Monthly)

### Development (Free/Minimal)

| Service              | Cost       | Notes                     |
|----------------------|------------|---------------------------|
| Groq API             | Free       | 14,400 requests/day       |
| Gemini API           | Free       | 1,500 requests/day        |
| OpenRouter           | Free       | Free models available     |
| Docker (local)       | Free       | Runs on your machine      |
| Resend Email         | Free       | 3,000 emails/month        |
| **Total (Dev)**      | **$0**     |                           |

### Production (Estimated)

| Service              | Cost/Month | Notes                     |
|----------------------|------------|---------------------------|
| VPS (4 vCPU, 8GB)   | $24-48     | DigitalOcean / Hetzner    |
| Domain + SSL         | ~$1        | Let's Encrypt (free SSL)  |
| Groq API             | Free       | May need paid tier at scale |
| Email (Resend)       | $0-20      | Based on volume           |
| Twilio WhatsApp/SMS  | $5-20      | Based on OTP volume       |
| Monitoring (Sentry)  | $0-26      | Free tier usually enough  |
| **Total (Prod)**     | **$30-115** |                          |

---

*This document should be updated whenever new services or dependencies are added to the project.*
