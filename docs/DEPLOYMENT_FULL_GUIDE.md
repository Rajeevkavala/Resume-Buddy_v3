# ResumeBuddy Deployment Guide (Beginner Friendly, Free-Tier First)

This is a complete **from-scratch** deployment roadmap for beginners.

It is designed around your requested architecture:
- **Next.js app** on **Vercel**
- **WebSocket feature** with Vercel-compatible approach (explained below)
- **PostgreSQL** and **Redis** on free tiers
- **LaTeX service + MinIO** on **DigitalOcean**
- **Automation** so pushing to GitHub updates production

---

## Important Reality Check (Read First)

### Can this be 100% free forever?
- **No**, not with DigitalOcean long-term.
- DigitalOcean usually gives **free credits** for a trial period. During that time, your setup can be effectively free.
- After credits end, DigitalOcean resources are paid.

### Why WebSockets on Vercel needs a note
Vercel is great for Next.js, but persistent server WebSocket connections are not ideal on serverless functions.

So for “Next + WebSocket on Vercel”, use one of these patterns:
1. **Recommended**: Keep Next.js on Vercel + use a hosted realtime provider (Pusher/Ably free tier).
2. Run your own WebSocket server on DigitalOcean.

This guide gives options for both.

---

## Table of Contents

- [Architecture You Will Build](#architecture-you-will-build)
- [What Accounts You Need](#what-accounts-you-need)
- [Option 1 (Recommended): Vercel + Supabase + Upstash + DigitalOcean](#option-1-recommended-vercel--supabase--upstash--digitalocean)
- [Option 2: Same as Option 1 + Managed Realtime (Best with Vercel)](#option-2-same-as-option-1--managed-realtime-best-with-vercel)
- [Option 3: Same as Option 1 + Self-Hosted WebSocket on DigitalOcean](#option-3-same-as-option-1--self-hosted-websocket-on-digitalocean)
- [Full Automation (Git Push -> Live)](#full-automation-git-push---live)
- [Beginner Troubleshooting](#beginner-troubleshooting)
- [Go-Live Checklist](#go-live-checklist)

---

## Architecture You Will Build

```text
User Browser
   |
   v
Vercel (Next.js app)
   |-- DATABASE_URL -> Supabase PostgreSQL (free tier)
   |-- REDIS_URL -> Upstash Redis (free tier)
   |-- LATEX_SERVICE_URL -> DigitalOcean Droplet (LaTeX service)
   |-- MINIO_ENDPOINT -> DigitalOcean Droplet (MinIO)
   |
   +-- Realtime:
       Option 2: Pusher/Ably free tier
       OR
       Option 3: DigitalOcean-hosted websocket service
```

---

## What Accounts You Need

Create these accounts first:
1. GitHub
2. Vercel
3. Supabase
4. Upstash
5. DigitalOcean

Also install locally:
- Git
- Node.js 20+
- Docker Desktop (optional but useful)
- VS Code

---

## Option 1 (Recommended): Vercel + Supabase + Upstash + DigitalOcean

Best for beginners and lowest operational complexity.

## Step 1: Prepare repository on GitHub

From project root:

```bash
git status
git add .
git commit -m "prepare deployment"
git push origin main
```

If this is your first push, create the GitHub repo first.

---

## Step 2: Deploy Next.js on Vercel

1. Open https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repo (`Resume-Buddy_v3`)
4. Framework should auto-detect as Next.js
5. Deploy once (even before env vars)

You will get a URL like:
`https://your-app.vercel.app`

---

## Step 3: Create PostgreSQL (Supabase free tier)

1. Open https://supabase.com
2. Create a new project
3. Go to **Settings -> Database**
4. Copy connection strings

Use:
- **Pooled URL** for app runtime in Vercel
- **Direct URL** for migrations from local machine if needed

Set in Vercel later as `DATABASE_URL`.

---

## Step 4: Create Redis (Upstash free tier)

1. Open https://upstash.com
2. Create Redis database
3. Open your Redis DB -> **Details / Connect**
4. Copy full `REDIS_URL`

It looks like:
`rediss://default:<password>@<host>.upstash.io:6379`

Use this full URL in Vercel as `REDIS_URL`.

---

## Step 5: Create DigitalOcean Droplet for LaTeX + MinIO

1. Open https://cloud.digitalocean.com
2. Create Droplet:
   - Ubuntu 22.04 LTS
   - Size: start with **1 vCPU / 2GB RAM**
   - Region: close to your users
3. Attach SSH key if available (recommended)
4. Create droplet

Note the public IP as `YOUR_DROPLET_IP`.

---

## Step 6: Secure server and install Docker

SSH into droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

Install Docker and Compose:

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin git ufw
```

Basic firewall:

```bash
ufw allow OpenSSH
ufw allow 8080/tcp   # LaTeX API
ufw allow 9000/tcp   # MinIO API
ufw allow 9001/tcp   # MinIO Console (later restrict to your IP)
ufw enable
ufw status
```

---

## Step 7: Run LaTeX + MinIO on Droplet

Clone repo on server:

```bash
cd /opt
git clone https://github.com/Rajeevkavala/Resume-Buddy_v3.git
```

Create compose file:

```bash
mkdir -p /opt/resumebuddy
cd /opt/resumebuddy
```

Create `/opt/resumebuddy/docker-compose.yml`:

```yaml
services:
  latex:
    build: /opt/Resume-Buddy_v3/services/resume-latex-service
    container_name: latex-service
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 8080
    ports:
      - "8080:8080"
    mem_limit: 1536m

  minio:
    image: minio/minio:latest
    container_name: resumebuddy-minio
    command: server /data --console-address ":9001"
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: CHANGE_THIS_STRONG_PASSWORD
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

Start services:

```bash
docker compose up -d
```

Create MinIO bucket:

```bash
docker run --rm --network host minio/mc sh -c "\
mc alias set rb http://127.0.0.1:9000 minioadmin CHANGE_THIS_STRONG_PASSWORD && \
mc mb rb/resumebuddy --ignore-existing"
```

Health checks:

```bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:9000/minio/health/live
```

---

## Step 8: Configure Vercel environment variables

In Vercel -> Project -> Settings -> Environment Variables, add:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

DATABASE_URL=postgresql://...
REDIS_URL=rediss://default:...@...upstash.io:6379

JWT_SECRET=your_32_plus_char_secret
JWT_REFRESH_SECRET=your_other_32_plus_char_secret
SESSION_COOKIE_NAME=rb_session
SESSION_TTL=604800

GROQ_API_KEY=...
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=...

LATEX_SERVICE_URL=http://YOUR_DROPLET_IP:8080
MINIO_ENDPOINT=http://YOUR_DROPLET_IP:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=CHANGE_THIS_STRONG_PASSWORD
MINIO_BUCKET=resumebuddy
```

If using OAuth:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## Step 9: Database migration and generate Prisma client

From local machine:

```bash
npm install
npm run db:generate
npm run db:migrate
```

If migrate fails with pooled URL, use direct Supabase URL temporarily for migration.

---

## Step 10: Validate full flow

1. Open Vercel app URL
2. Sign up / login
3. Trigger resume upload/export
4. Check Droplet logs:

```bash
docker logs -f latex-service
```

5. Open MinIO console:
`http://YOUR_DROPLET_IP:9001`

---

## Option 2: Same as Option 1 + Managed Realtime (Best with Vercel)

Use this if you want WebSocket-like realtime but keep app on Vercel.

Recommended providers:
- Pusher (free tier)
- Ably (free tier)

Why this option:
- No separate websocket server to maintain
- Works well with Vercel
- Easier for beginners

Steps:
1. Complete Option 1 first
2. Create Pusher/Ably app
3. Add provider keys to Vercel env
4. Update frontend and backend realtime integration to provider SDK
5. Redeploy

---

## Option 3: Same as Option 1 + Self-Hosted WebSocket on DigitalOcean

Use this if you want your own websocket server.

High-level:
1. Keep Next.js on Vercel
2. Deploy websocket server on DigitalOcean (second service/container)
3. Set `WEBSOCKET_URL=ws://your-websocket-domain-or-ip`
4. Point frontend to websocket URL

Note:
- This is more complex than Option 2
- For beginners, Option 2 is safer

---

## Full Automation (Git Push -> Live)

You need automation for two places:
1. **Vercel app deploy**
2. **DigitalOcean LaTeX/MinIO update flow**

### A) Vercel automation (easy)

When repo is connected to Vercel:
- Every push to `main` auto-deploys
- No extra CI required

Optional checks before deploy:
- Add GitHub Actions test workflow
- Let Vercel deploy only if checks pass

### B) DigitalOcean automation for LaTeX

MinIO data should persist and usually does not redeploy often.
LaTeX service should auto-update on push.

Recommended automation using GitHub Actions + SSH deploy:

Create `.github/workflows/deploy-latex-droplet.yml`:

```yaml
name: Deploy LaTeX to Droplet

on:
  push:
    branches: [main]
    paths:
      - 'services/resume-latex-service/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH deploy on droplet
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            cd /opt/Resume-Buddy_v3
            git pull origin main
            cd /opt/resumebuddy
            docker compose build latex
            docker compose up -d latex
            docker image prune -f
```

Add GitHub repo secrets:
- `DROPLET_HOST` -> droplet IP
- `DROPLET_USER` -> usually `root`
- `DROPLET_SSH_KEY` -> private key content

This gives auto-update for LaTeX when code changes.

### C) MinIO automation notes

MinIO is stateful storage, so you usually:
- Deploy once
- Keep volume persistent
- Do not rebuild every push

If you still want auto-update for MinIO image:
- Add Watchtower container (optional)
- Or periodic manual update

---

## Beginner Troubleshooting

## Problem: Vercel deploy succeeds but app fails
- Check Vercel logs for missing env vars
- Ensure `DATABASE_URL` and `REDIS_URL` are set in Production scope

## Problem: Login/session issues
- Verify `REDIS_URL` is `rediss://...` from Upstash
- Ensure JWT secrets are present

## Problem: LaTeX export fails
- Check `LATEX_SERVICE_URL` points to reachable droplet
- From droplet run: `curl http://127.0.0.1:8080/healthz`
- Check container logs: `docker logs latex-service`

## Problem: MinIO upload fails
- Verify env values for `MINIO_ENDPOINT`, keys, bucket
- Ensure bucket `resumebuddy` exists
- Confirm port `9000` is open from app side

## Problem: WebSocket not stable on Vercel
- Use Option 2 (Pusher/Ably) or Option 3 websocket server on Droplet

---

## Go-Live Checklist

### Accounts + infra
- [ ] Vercel connected to GitHub repo
- [ ] Supabase DB created
- [ ] Upstash Redis created
- [ ] DigitalOcean Droplet created
- [ ] LaTeX + MinIO containers running

### Environment
- [ ] All production env vars set in Vercel
- [ ] `LATEX_SERVICE_URL` points to droplet
- [ ] `MINIO_*` values are correct

### Automation
- [ ] Push to `main` triggers Vercel deploy
- [ ] GitHub Action deploys LaTeX service to droplet

### Validation
- [ ] Signup/login works
- [ ] Resume upload works
- [ ] PDF generation works
- [ ] Realtime feature works (Option 2 or 3)

---

## Cost Snapshot (Free-Tier Focus)

During trial/credits period:
- Vercel: free tier
- Supabase: free tier
- Upstash: free tier
- DigitalOcean: free via credits (temporary)

After credits:
- Droplet cost starts (typically ~$6 to $12+ depending on size)

---

## Final Recommendation for You

For your exact goal and beginner experience:
1. Start with **Option 1** first (core deploy)
2. Add **Option 2** for realtime (easier than self-hosted websocket)
3. Keep **Option 3** only if you specifically need your own websocket server

This gives the fastest path to a live product with auto deployment on Git push.
