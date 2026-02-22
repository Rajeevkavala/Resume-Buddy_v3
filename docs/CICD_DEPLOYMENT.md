# ResumeBuddy — CI/CD & Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub (source of truth)                │
│  push/PR → GitHub Actions CI → deploy on merge to main      │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
        ┌──────▼──────┐           ┌───────▼───────┐
        │   VERCEL    │           │ DIGITALOCEAN  │
        │  (2 projects)│           │  (1 Droplet)  │
        │             │           │               │
        │ • Next.js   │  HTTP/S3  │ • LaTeX svc   │
        │   App       │◄─────────►│   (Docker)    │
        │ • WebSocket │           │ • MinIO        │
        │   Service   │           │   (Docker)    │
        └──────┬──────┘           └───────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌──────▼──────┐
│  SUPABASE   │ │   UPSTASH   │
│ PostgreSQL  │ │    Redis    │
│  (PgBouncer │ │   (TLS,     │
│   pooler)   │ │   global)   │
└─────────────┘ └─────────────┘
```

## Services & Responsibilities

| Service | Platform | Purpose |
|---------|----------|---------|
| Next.js App | Vercel | Main web app (SSR + API routes) |
| WebSocket Service | Vercel (separate project) | Real-time interview & notifications |
| LaTeX Service | DigitalOcean Droplet | PDF compilation (tectonic) |
| MinIO | DigitalOcean Droplet | S3-compatible object storage |
| PostgreSQL | Supabase | Primary database |
| Redis | Upstash | Sessions, caching, pub/sub |

---

## Step 1 — Supabase (PostgreSQL)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region closest to your Vercel deployment (US East → `iad1`)
3. Save the database password (you'll need it)

### 1.2 Get Connection Strings
Navigate to: **Project Settings → Database → Connection string**

```
# Transaction pooler (port 6543) — used at RUNTIME by Vercel serverless
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (port 5432) — used by Prisma MIGRATIONS only
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

> **Why two URLs?** Vercel serverless functions open/close connections rapidly. PgBouncer (Transaction mode, port 6543) pools them efficiently. Prisma migrations require a persistent connection, so they use `DIRECT_URL`.

### 1.3 Run Initial Migration
```bash
# Locally, with production .env
DATABASE_URL="..." DIRECT_URL="..." npm run db:migrate:prod
```

---

## Step 2 — Upstash (Redis)

### 2.1 Create Database
1. Go to [console.upstash.com](https://console.upstash.com) → Create Database
2. Select **Global** replication
3. Enable **TLS**

### 2.2 Get Credentials
```
REDIS_URL=rediss://:[password]@[endpoint].upstash.io:6380
REDIS_PASSWORD=[password]
```

> The `rediss://` scheme (double-s) means TLS. Upstash clusters use port `6380` for TLS.

---

## Step 3 — DigitalOcean Setup

### 3.1 Create Droplet
- **Image**: Ubuntu 24.04 LTS
- **Size**: `s-2vcpu-4gb` ($24/mo) — minimum for LaTeX + MinIO
- **Region**: Match your Vercel region (NYC for `iad1`)
- **Authentication**: SSH key (add your key)
- **Firewall**: Allow ports 22, 8080 (LaTeX), 9000-9001 (MinIO)

### 3.2 Bootstrap the Droplet
```bash
# SSH into your new droplet
ssh root@YOUR_DROPLET_IP

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/Rajeevkavala/Resume-Buddy_v3/main/infrastructure/digitalocean/setup-droplet.sh | bash
```

### 3.3 Create DigitalOcean Container Registry
```bash
# Install doctl locally
# macOS: brew install doctl
# Windows: winget install DigitalOcean.doctl

doctl auth init                           # authenticate
doctl registry create resumebuddy        # create registry
doctl registry login                     # authenticate docker
```

Note your registry name (e.g., `resumebuddy`) — set as `DO_REGISTRY_NAME` secret.

### 3.4 First MinIO Deployment
```bash
# On the droplet
cd /opt/resumebuddy

# Create env file
cat > .env.minio << EOF
MINIO_ROOT_USER=your-access-key
MINIO_ROOT_PASSWORD=your-secret-key
MINIO_BUCKET=resumebuddy
EOF

# Upload and start
scp infrastructure/digitalocean/minio-compose.yml root@YOUR_IP:/opt/resumebuddy/
docker compose -f minio-compose.yml --env-file .env.minio up -d

# Verify
curl http://localhost:9000/minio/health/live
```

---

## Step 4 — Vercel Setup

### 4.1 Next.js Project
```bash
npm install -g vercel

# Link to Vercel project (creates .vercel/project.json)
vercel link

# Note the output:
#   VERCEL_ORG_ID
#   VERCEL_PROJECT_ID
```

### 4.2 WebSocket Project (separate)
```bash
cd apps/websocket
vercel link    # creates a second Vercel project

# Note VERCEL_PROJECT_ID_WEBSOCKET
```

### 4.3 Generate Vercel Token
[vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token → Save as `VERCEL_TOKEN`

---

## Step 5 — GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

### Core Secrets (required)
| Secret Name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | Vercel personal token |
| `VERCEL_ORG_ID` | From `vercel link` output |
| `VERCEL_PROJECT_ID` | Next.js project ID |
| `VERCEL_PROJECT_ID_WEBSOCKET` | WebSocket project ID |
| `DATABASE_URL` | Supabase Transaction pooler URL |
| `DIRECT_URL` | Supabase direct connection URL |
| `REDIS_URL` | Upstash TLS URL (`rediss://...`) |
| `REDIS_PASSWORD` | Upstash password |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | e.g., `https://resume-buddy-v3.vercel.app` |

### DigitalOcean Secrets
| Secret Name | Value |
|-------------|-------|
| `DO_ACCESS_TOKEN` | DigitalOcean API token (read+write) |
| `DO_REGISTRY_NAME` | e.g., `resumebuddy` |
| `DO_DROPLET_IP` | Droplet public IP |
| `DO_SSH_USER` | Usually `root` |
| `DO_SSH_PRIVATE_KEY` | Contents of `~/.ssh/id_rsa` (or ed25519) |
| `LATEX_SERVICE_URL` | `http://DROPLET_IP:8080` |
| `MINIO_ENDPOINT` | Droplet IP or domain |
| `MINIO_PORT` | `9000` |
| `MINIO_ACCESS_KEY` | MinIO root user |
| `MINIO_SECRET_KEY` | MinIO root password |
| `MINIO_USE_SSL` | `false` (or `true` with Nginx proxy) |
| `MINIO_BUCKET` | `resumebuddy` |

### AI + Payments Secrets
| Secret Name | Value |
|-------------|-------|
| `GROQ_API_KEY` | Groq API key |
| `GOOGLE_API_KEY` | Google Gemini key |
| `OPENROUTER_API_KEY` | OpenRouter key |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/google/callback` |
| `RESEND_API_KEY` | Resend email API key |
| `FROM_EMAIL` | e.g., `noreply@yourdomain.com` |
| `WEBSOCKET_URL` | WebSocket Vercel project URL |

---

## Step 6 — First Deployment

### 6.1 Trigger Everything
```bash
# Push to main triggers all three workflows
git push origin main
```

### 6.2 Workflow Execution Order
```
push to main
    │
    ├─► ci.yml         (lint → typecheck → tests → build check) ~8m
    │
    ├─► deploy-digitalocean.yml  (build Docker → push → SSH deploy LaTeX) ~12m
    │
    └─► deploy-nextjs.yml
            │
            ├─► ci-gate (reuses ci.yml)
            ├─► migrate  (Prisma → Supabase)
            └─► deploy-nextjs → Vercel → smoke test
```

### 6.3 Initial MinIO Setup (one-time)
```bash
# Trigger MinIO setup via workflow_dispatch
gh workflow run deploy-digitalocean.yml -f deploy_minio=true
```

---

## CI/CD Workflow Summary

### `.github/workflows/ci.yml`
- Triggered: all pushes + PRs
- Jobs: lint, typecheck, unit tests (with test DB), build check, LaTeX Docker build

### `.github/workflows/deploy-nextjs.yml`
- Triggered: push to `main`
- Path filter: all files except `services/`, `apps/websocket/`
- Jobs: CI gate → Prisma migration → Vercel production deploy → smoke test

### `.github/workflows/deploy-websocket.yml`
- Triggered: push to `main` with changes in `apps/websocket/**`
- Jobs: build TypeScript → Vercel deploy (separate project)

### `.github/workflows/deploy-digitalocean.yml`
- Triggered: push to `main` with changes in `services/resume-latex-service/**`
- Jobs: Docker build → DO registry push → SSH deploy to droplet → smoke test

---

## Monitoring & Maintenance

### Check Deployment Status
```bash
# Vercel deployments
vercel ls

# DO LaTeX service
ssh root@YOUR_DROPLET_IP "docker ps && docker logs latex-service --tail 20"

# MinIO health
curl http://YOUR_DROPLET_IP:9000/minio/health/live

# LaTeX health
curl http://YOUR_DROPLET_IP:8080/healthz
curl http://YOUR_DROPLET_IP:8080/metrics
```

### Rollback
```bash
# Vercel (instant rollback)
vercel rollback [deployment-url]

# LaTeX service (pull previous tagged image)
ssh root@YOUR_DROPLET_IP << 'EOF'
  docker stop latex-service && docker rm latex-service
  docker run -d --name latex-service --restart unless-stopped \
    -p 8080:8080 -m 1536m \
    registry.digitalocean.com/resumebuddy/resume-latex-service:sha-PREVIOUS_SHA
EOF
```

### Database Migrations
```bash
# Production migration (CI/CD does this automatically)
DATABASE_URL="..." DIRECT_URL="..." npm run db:migrate:prod

# Prisma Studio (inspect production data — use carefully)
DATABASE_URL="..." npm run db:studio
```

---

## Cost Estimate (Production)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel (Next.js) | Hobby → Pro | $0 → $20 |
| Vercel (WebSocket) | Hobby | $0 |
| DigitalOcean Droplet | s-2vcpu-4gb | $24 |
| DO Container Registry | Starter | $0 (5GB free) |
| Supabase | Free → Pro | $0 → $25 |
| Upstash Redis | Free → Pay/req | $0 → ~$5 |
| **Total** | | **~$24–74/mo** |
