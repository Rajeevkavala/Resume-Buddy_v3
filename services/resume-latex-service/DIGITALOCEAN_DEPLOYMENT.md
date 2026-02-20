# Resume LaTeX Service - DigitalOcean Deployment Guide

A complete step-by-step guide to deploy the Resume LaTeX Service on DigitalOcean, optimized for **500 concurrent users** with cost-effective configurations.

This guide is updated for **Resume-Buddy_v3** and includes optional co-hosting of **MinIO** on the same Droplet (recommended for the current architecture).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Performance Architecture](#performance-architecture)
- [Option 1: App Platform (Recommended for <100 users)](#option-1-app-platform-recommended)
- [Option 2: Droplet with Docker (Recommended for 500 users)](#option-2-droplet-with-docker)
- [Option 3: Container Registry + App Platform](#option-3-container-registry--app-platform)
- [Co-host MinIO on DigitalOcean Droplet (Recommended for ResumeBuddy v3)](#co-host-minio-on-digitalocean-droplet-recommended-for-resumebuddy-v3)
- [Scaling for 500 Users](#scaling-for-500-users)
- [Domain & SSL Configuration](#domain--ssl-configuration)
- [Integration with Main App](#integration-with-main-app)
- [Monitoring & Logs](#monitoring--logs)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Create DigitalOcean Account

1. Go to [https://cloud.digitalocean.com/registrations/new](https://cloud.digitalocean.com/registrations/new)
2. Sign up with email or GitHub/Google
3. Add a payment method (credit card or PayPal)
4. (Optional) Use referral code for $200 free credit for 60 days

### 2. Install DigitalOcean CLI (doctl)

**Windows (PowerShell - Run as Administrator):**

```powershell
# Option A: Using Scoop
scoop install doctl

# Option B: Using Chocolatey
choco install doctl

# Option C: Manual download
# Download from: https://github.com/digitalocean/doctl/releases
# Extract and add to PATH
```

**macOS:**

```bash
brew install doctl
```

**Linux:**

```bash
# Download latest release
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.101.0/doctl-1.101.0-linux-amd64.tar.gz
tar xf doctl-1.101.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

### 3. Authenticate doctl

```bash
# Generate API token at: https://cloud.digitalocean.com/account/api/tokens
# Click "Generate New Token" with Read + Write scope

doctl auth init
# Paste your API token when prompted

# Verify authentication
doctl account get
```

### 4. Install Docker Locally

Required for building images. Download from [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

---

## Performance Architecture

The service is optimized for handling **500 concurrent users** with:

### Built-in Optimizations

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Request Queue** | Max 3 concurrent tectonic processes, 50 queued | Prevents OOM crashes |
| **PDF Cache** | LRU cache with 1hr TTL, 100 entries | 60-80% cache hit rate |
| **Pre-warmed Tectonic** | LaTeX packages downloaded at build time | No cold-start delay |
| **Non-root User** | Container runs as `latex` user | Security hardening |
| **Health Checks** | `/healthz`, `/readyz`, `/metrics` endpoints | Load balancer integration |
| **Graceful Shutdown** | Handles SIGTERM properly | Zero-downtime deploys |

### Capacity Planning for 500 Users

Assuming:
- Peak: 10% of users (50) request PDFs simultaneously
- Average compilation time: 5-15 seconds
- Cache hit rate: 60%

| Metric | Single Instance | 2 Instances (HA) |
|--------|-----------------|------------------|
| Concurrent compilations | 3 | 6 |
| Queue capacity | 50 | 100 |
| Throughput | ~12-20 PDFs/min | ~24-40 PDFs/min |
| Max wait time | ~30s | ~15s |
| Monthly cost | $6-12 | $12-24 |

---

## Option 1: App Platform (Recommended for <100 users)

DigitalOcean App Platform is the easiest way to deploy - similar to Heroku/Vercel. It automatically builds from your Dockerfile.

> **Note**: For 500 users, consider [Option 2 (Droplet)](#option-2-droplet-with-docker) for better cost efficiency.

### Step 1: Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
cd d:\Resume_Buddy_v3
git add services/resume-latex-service
git commit -m "Add LaTeX service for deployment"
git push origin main
```

### Step 2: Create App via Console (GUI Method)

1. Go to [https://cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **GitHub** as source
4. Authorize DigitalOcean to access your GitHub account
5. Select repository: `Resume-Buddy_v3`
6. Select branch: `main`
7. Set **Source Directory**: `services/resume-latex-service`
8. Click **Next**

**Configure Resources:**

| Setting | Value |
|---------|-------|
| Type | Web Service |
| Instance Size | Basic ($5/mo) or Basic-XXS ($4/mo) |
| Instance Count | 1 |
| HTTP Port | 8080 |

**Environment Variables:**

```
NODE_ENV=production
PORT=8080
```

9. Click **Next** → Review → **Create Resources**

### Step 3: Create App via CLI (Alternative)

Create `app.yaml` in `services/resume-latex-service/`:

```yaml
name: resume-latex-service
region: nyc
services:
  - name: latex-service
    github:
      repo: Rajeevkavala/Resume-Buddy_v3
      branch: main
      deploy_on_push: true
    source_dir: services/resume-latex-service
    dockerfile_path: Dockerfile
    http_port: 8080
    instance_size_slug: basic-xxs
    instance_count: 1
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
    health_check:
      http_path: /healthz
      initial_delay_seconds: 60
      period_seconds: 30
      timeout_seconds: 10
      success_threshold: 1
      failure_threshold: 3
    routes:
      - path: /
```

Deploy:

```bash
cd services/resume-latex-service
doctl apps create --spec app.yaml
```

### Step 4: Get Your App URL

```bash
# List apps
doctl apps list

# Get app details (replace APP_ID)
doctl apps get <APP_ID>
```

Your service URL will be: `https://resume-latex-service-xxxxx.ondigitalocean.app`

### Step 5: Test Deployment

```bash
# Health check
curl https://resume-latex-service-xxxxx.ondigitalocean.app/healthz

# Test compilation
curl -X POST https://resume-latex-service-xxxxx.ondigitalocean.app/v1/resume/latex/compile \
  -H "Content-Type: application/json" \
  -d '{
    "source": "resumeText",
    "templateId": "professional",
    "resumeText": "John Doe\n\nSoftware Engineer\n\n- Built scalable systems",
    "options": {
      "engine": "tectonic",
      "return": ["latex", "pdf"]
    }
  }'
```

---

## Option 2: Droplet with Docker (Recommended for 500 users)

For 500 users, a Droplet provides the best cost-to-performance ratio with full control.

### Recommended Configuration for 500 Users

| Component | Specification | Cost |
|-----------|---------------|------|
| Droplet | 2 GB RAM, 1 vCPU (s-1vcpu-2gb) | $12/mo |
| Or: | 2 GB RAM, 2 vCPUs (s-2vcpu-2gb) | $18/mo |
| Reserved IP | Static IP | Free |
| Monitoring | Built-in | Free |
| **Total** | | **$12-18/mo** |

### Step 1: Create a Droplet

```bash
# List available sizes
doctl compute size list

# Create droplet - 2GB RAM for 500 users (recommended)
doctl compute droplet create latex-service \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-2gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --wait

# Alternative: 2 vCPUs for higher throughput
doctl compute droplet create latex-service \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --wait
```

**Or via Console:**

1. Go to [https://cloud.digitalocean.com/droplets/new](https://cloud.digitalocean.com/droplets/new)
2. Choose **Ubuntu 22.04 LTS x64**
3. Select **Basic** → **Regular** → **$12/mo** (2 GB RAM, 1 vCPU) or **$18/mo** (2 GB RAM, 2 vCPUs)
4. Choose datacenter (e.g., NYC1)
5. Add SSH key (or use password)
6. Click **Create Droplet**

### Step 2: SSH into Droplet

```bash
# Get droplet IP
doctl compute droplet list

# SSH in
ssh root@YOUR_DROPLET_IP
```

### Step 3: Install Docker on Droplet

```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
```

### Step 4: Deploy the Service

**Option A: Build on Droplet (Simplest)**

```bash
# Clone repository
git clone https://github.com/Rajeevkavala/Resume-Buddy_v3.git
cd Resume-Buddy_v3/services/resume-latex-service

# Build Docker image
docker build -t resume-latex-service .

# Run container with optimized settings for 500 users
docker run -d \
  --name latex-service \
  --restart unless-stopped \
  -p 8080:8080 \
  -m 1536m \
  --memory-reservation=1024m \
  --cpus=0.9 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=warn \
  resume-latex-service
```

**Option B: Pull from Container Registry (see Option 3 first)**

```bash
# Login to DO registry
doctl registry login

# Pull and run with optimized settings
docker pull registry.digitalocean.com/your-registry/latex-service:latest
docker run -d \
  --name latex-service \
  --restart unless-stopped \
  -p 8080:8080 \
  -m 1536m \
  --memory-reservation=1024m \
  -e NODE_ENV=production \
  registry.digitalocean.com/your-registry/latex-service:latest
```

### Step 4.1: (Recommended for v3) Run LaTeX + MinIO with Docker Compose

If you want both LaTeX and MinIO on the same Droplet:

```bash
mkdir -p /opt/resumebuddy && cd /opt/resumebuddy

cat > docker-compose.yml << 'EOF'
services:
  latex:
    build: /root/Resume-Buddy_v3/services/resume-latex-service
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
      MINIO_ROOT_PASSWORD: REPLACE_WITH_STRONG_PASSWORD
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  minio_data:
EOF

docker compose up -d
```

Create default MinIO bucket (`resumebuddy`):

```bash
docker run --rm --network host minio/mc sh -c "\
mc alias set rb http://127.0.0.1:9000 minioadmin REPLACE_WITH_STRONG_PASSWORD && \
mc mb rb/resumebuddy --ignore-existing"
```

### Step 5: Setup Nginx Reverse Proxy (Recommended for Production)

```bash
# Install Nginx
apt install nginx -y

# Create optimized config for 500 users
cat > /etc/nginx/sites-available/latex-service << 'EOF'
# Rate limiting zone - 10 requests/second per IP
limit_req_zone $binary_remote_addr zone=latex_limit:10m rate=10r/s;

# Connection limiting - max 20 connections per IP
limit_conn_zone $binary_remote_addr zone=latex_conn:10m;

upstream latex_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Gzip compression for responses
    gzip on;
    gzip_types application/json text/plain;
    gzip_min_length 1000;

    # Connection limits
    limit_conn latex_conn 20;
    
    location / {
        # Rate limiting with burst
        limit_req zone=latex_limit burst=20 nodelay;
        
        proxy_pass http://latex_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for PDF compilation
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        proxy_connect_timeout 10s;
        
        # Buffering for large PDF responses
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 8 32k;
        
        # Client body size (for resume data)
        client_max_body_size 2m;
    }

    # Health check endpoint - no rate limiting
    location /healthz {
        proxy_pass http://latex_backend;
        access_log off;
    }

    # Metrics endpoint - restrict to localhost
    location /metrics {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://latex_backend;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/latex-service /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx
```

### Step 6: Setup SSL with Certbot (If Using Domain)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is enabled by default
```

### Step 7: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'

# If exposing backend ports directly (no reverse proxy), allow these:
ufw allow 8080/tcp   # LaTeX API
ufw allow 9000/tcp   # MinIO S3 API
ufw allow 9001/tcp   # MinIO Console (restrict to your IP where possible)

ufw enable

# Verify
ufw status
```

---

## Co-host MinIO on DigitalOcean Droplet (Recommended for ResumeBuddy v3)

Use this when your main app is on Vercel/Supabase/Upstash and you want DigitalOcean only for LaTeX + object storage.

### Why this matches v3

- `LATEX_SERVICE_URL` points to Droplet LaTeX service.
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` point to Droplet MinIO.
- Keeps infrastructure simple and cost-effective.

### Minimum environment values in main app

```env
LATEX_SERVICE_URL=http://YOUR_DROPLET_IP:8080

MINIO_ENDPOINT=http://YOUR_DROPLET_IP:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=REPLACE_WITH_STRONG_PASSWORD
MINIO_BUCKET=resumebuddy
```

Optional hardening:
- Put Nginx/Caddy in front and use HTTPS.
- Restrict MinIO Console (`9001`) to your own IP.

---

## Option 3: Container Registry + App Platform

Best for CI/CD workflows - push to registry, deploy to App Platform.

### Step 1: Create Container Registry

```bash
# Create registry (Starter tier: $5/mo, 500MB)
doctl registry create resume-services --subscription-tier starter

# Or via Console: https://cloud.digitalocean.com/registry
```

### Step 2: Authenticate Docker with Registry

```bash
doctl registry login
```

### Step 3: Build and Push Image

```powershell
# On your local machine (Windows)
cd "D:\Resume_Buddy_v3\services\resume-latex-service"

# Build for linux/amd64 (required for DO)
docker build --platform linux/amd64 -t registry.digitalocean.com/resume-services/latex-service:latest .

# Push to registry
docker push registry.digitalocean.com/resume-services/latex-service:latest
```

### Step 4: Deploy to App Platform from Registry

Create `app-registry.yaml`:

```yaml
name: resume-latex-service
region: nyc
services:
  - name: latex-service
    image:
      registry_type: DOCR
      registry: resume-services
      repository: latex-service
      tag: latest
    http_port: 8080
    instance_size_slug: basic-xxs
    instance_count: 1
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
    health_check:
      http_path: /healthz
      initial_delay_seconds: 60
      period_seconds: 30
    routes:
      - path: /
```

Deploy:

```bash
doctl apps create --spec app-registry.yaml
```

### Step 5: Setup Auto-Deploy on Push

Add GitHub Action (`.github/workflows/deploy-latex.yml`):

```yaml
name: Deploy LaTeX Service

on:
  push:
    branches: [main]
    paths:
      - 'services/resume-latex-service/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Login to DO Container Registry
        run: doctl registry login

      - name: Build and Push
        run: |
          cd services/resume-latex-service
          docker build --platform linux/amd64 -t registry.digitalocean.com/resume-services/latex-service:${{ github.sha }} .
          docker tag registry.digitalocean.com/resume-services/latex-service:${{ github.sha }} registry.digitalocean.com/resume-services/latex-service:latest
          docker push registry.digitalocean.com/resume-services/latex-service:${{ github.sha }}
          docker push registry.digitalocean.com/resume-services/latex-service:latest

      - name: Deploy to App Platform
        run: |
          doctl apps create-deployment ${{ secrets.DO_APP_ID }}
```

Add secrets to GitHub:
- `DIGITALOCEAN_ACCESS_TOKEN`: Your DO API token
- `DO_APP_ID`: Your App Platform app ID (from `doctl apps list`)

---

## Scaling for 500 Users

### Single Instance (Cost-Effective)

For most use cases with 500 users, a **single 2GB Droplet** is sufficient:

```bash
# Verify service can handle load
curl http://YOUR_IP:8080/metrics
```

Expected output:
```json
{
  "queue": {
    "active": 0,
    "queued": 0,
    "totalProcessed": 150,
    "maxConcurrent": 3,
    "maxQueueSize": 50
  },
  "cache": {
    "size": 45,
    "maxSize": 100,
    "hitRate": "67.2%"
  },
  "memory": {
    "heapUsed": "85MB",
    "rss": "180MB"
  }
}
```

### High Availability (2 Instances + Load Balancer)

For production workloads requiring HA:

```bash
# Create 2 droplets
doctl compute droplet create latex-1 latex-2 \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-2gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --wait

# Create load balancer
doctl compute load-balancer create \
  --name latex-lb \
  --region nyc1 \
  --forwarding-rules "entry_protocol:http,entry_port:80,target_protocol:http,target_port:8080" \
  --health-check "protocol:http,port:8080,path:/healthz,check_interval_seconds:10,response_timeout_seconds:5,healthy_threshold:3,unhealthy_threshold:3" \
  --droplet-ids $(doctl compute droplet list --format ID --no-header | tr '\n' ',' | sed 's/,$//')
```

**Cost for HA Setup:**
| Component | Cost |
|-----------|------|
| 2x Droplets (2GB) | $24/mo |
| Load Balancer | $12/mo |
| **Total** | **$36/mo** |

### Auto-Scaling with Docker Swarm (Advanced)

For dynamic scaling based on demand:

```bash
# Initialize swarm on primary droplet
docker swarm init --advertise-addr YOUR_DROPLET_IP

# Deploy as service with auto-scaling
docker service create \
  --name latex-service \
  --replicas 2 \
  --limit-memory 1g \
  --reserve-memory 512m \
  --publish 8080:8080 \
  --update-parallelism 1 \
  --update-delay 30s \
  --health-cmd "curl -f http://localhost:8080/healthz || exit 1" \
  --health-interval 30s \
  resume-latex-service

# Scale up during peak hours
docker service scale latex-service=3

# Scale down during off-hours
docker service scale latex-service=1
```

---

## Domain & SSL Configuration

### Option A: Use DigitalOcean Domain

```bash
# Add domain to DO
doctl compute domain create yourdomain.com

# Point to App Platform
# In App Platform Console → Settings → Domains → Add Domain
```

### Option B: External Domain (Namecheap, GoDaddy, etc.)

1. In your registrar's DNS settings, add a CNAME record:
   - **Host**: `latex` (or subdomain you want)
   - **Value**: `resume-latex-service-xxxxx.ondigitalocean.app`
   - **TTL**: 300

2. In App Platform Console:
   - Go to **Settings** → **Domains**
   - Click **Add Domain**
   - Enter: `latex.yourdomain.com`
   - SSL is automatic!

### For Droplet Deployment

Point A record to Droplet IP, then use Certbot (see Step 6 in Option 2).

---

## Integration with Main App

### 1. Set Environment Variable

After deployment, update your main ResumeBuddy app's `.env`:

```bash
# For App Platform
LATEX_SERVICE_URL=https://resume-latex-service-xxxxx.ondigitalocean.app

# For Droplet with domain
LATEX_SERVICE_URL=https://latex.yourdomain.com

# For Droplet without domain
LATEX_SERVICE_URL=http://YOUR_DROPLET_IP:8080

# If MinIO is on same Droplet
MINIO_ENDPOINT=http://YOUR_DROPLET_IP:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=REPLACE_WITH_STRONG_PASSWORD
MINIO_BUCKET=resumebuddy
```

### 2. Redeploy Main App

If using Vercel (recommended for this repo), set these in Project Settings → Environment Variables and redeploy.

If using another platform, set the same environment variables there and redeploy.

```bash
# Example (local verification only)
npm run dev
```

### 3. Test Integration

```bash
# In your main app directory
npm run dev

# Navigate to dashboard and test PDF export
```

---

## Monitoring & Logs

### Built-in Endpoints

The service exposes three monitoring endpoints:

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/healthz` | Basic health check | Load balancer health probe |
| `/readyz` | Readiness check | Kubernetes/orchestration |
| `/metrics` | Detailed metrics | Monitoring dashboards |

### Example Metrics Response

```bash
curl http://YOUR_IP:8080/metrics
```

```json
{
  "queue": {
    "active": 2,
    "queued": 5,
    "totalProcessed": 1250,
    "totalRejected": 3,
    "totalTimedOut": 1,
    "maxConcurrent": 3,
    "maxQueueSize": 50
  },
  "cache": {
    "size": 78,
    "maxSize": 100,
    "hits": 890,
    "misses": 360,
    "hitRate": "71.2%"
  },
  "memory": {
    "heapUsed": "95MB",
    "heapTotal": "150MB",
    "rss": "210MB"
  },
  "uptime": "86400s"
}
```

### App Platform Logs

```bash
# Stream logs
doctl apps logs <APP_ID> --follow

# Get recent logs
doctl apps logs <APP_ID> --type run
```

Via Console: **Apps** → **Your App** → **Runtime Logs**

### Droplet Logs

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# View Docker logs
docker logs -f latex-service

# View last 100 lines
docker logs --tail 100 latex-service

# Check container stats
docker stats latex-service
```

### Setup Alerts

1. Go to [https://cloud.digitalocean.com/monitoring](https://cloud.digitalocean.com/monitoring)
2. Click **Create Alert Policy**
3. Recommended alerts for 500 users:

| Alert | Threshold | Action |
|-------|-----------|--------|
| CPU > 80% | 5 minutes | Consider scaling up |
| Memory > 85% | 5 minutes | Restart or upgrade |
| Disk > 80% | - | Clean old images |
| Droplet offline | - | Investigate immediately |

### Custom Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Run via cron every 5 minutes

METRICS=$(curl -s http://localhost:8080/metrics)
QUEUE_SIZE=$(echo $METRICS | jq '.queue.queued')
CACHE_HIT=$(echo $METRICS | jq -r '.cache.hitRate')
MEMORY=$(echo $METRICS | jq -r '.memory.rss')

# Alert if queue is backing up
if [ "$QUEUE_SIZE" -gt 30 ]; then
  echo "WARNING: Queue size is $QUEUE_SIZE" | mail -s "LaTeX Service Alert" your@email.com
fi

# Log for analysis
echo "$(date): queue=$QUEUE_SIZE cache=$CACHE_HIT mem=$MEMORY" >> /var/log/latex-service.log
```

---

## Cost Optimization

### Pricing Comparison for 500 Users

| Option | Monthly Cost | Pros | Cons |
|--------|-------------|------|------|
| **Droplet 2GB (Recommended)** | $12/mo | Full control, best $/performance | Manual updates |
| Droplet 2GB + 2vCPU | $18/mo | Higher throughput | Overkill for most |
| App Platform Basic | $5/mo | Easy deploy | May need more RAM |
| App Platform Professional | $12/mo | Auto-scaling | Higher min cost |
| 2x Droplets + LB (HA) | $36/mo | High availability | Complex setup |

### Cost-Saving Strategies

#### 1. Use Built-in Caching (Already Included)

The service caches compiled PDFs with 60-80% hit rate, reducing compute by 3x:

```typescript
// Automatic - no configuration needed
// Cache stats at /metrics endpoint
```

#### 2. Reserved Droplet Pricing

Commit to 1 or 3 years for significant savings:

| Plan | Monthly | Savings |
|------|---------|---------|
| On-demand (2GB) | $12/mo | - |
| 1-year reserved | $10/mo | 17% |
| 3-year reserved | $7/mo | 42% |

#### 3. Off-Peak Scaling (For HA Setup)

```bash
# Cron job to scale down at night (save ~$6/mo)
# Add to crontab on primary droplet

# Scale to 1 instance at 11 PM
0 23 * * * docker service scale latex-service=1

# Scale to 2 instances at 7 AM  
0 7 * * * docker service scale latex-service=2
```

#### 4. Snapshots Instead of Backups

```bash
# Create weekly snapshot (much cheaper than backup plan)
doctl compute droplet-action snapshot latex-service --snapshot-name "latex-$(date +%Y%m%d)"

# Automate with cron
0 3 * * 0 doctl compute droplet-action snapshot YOUR_DROPLET_ID --snapshot-name "latex-$(date +%Y%m%d)"
```

Snapshot cost: $0.06/GB/month vs Backup: $2.40/month (20% of droplet)

#### 5. Use Monitoring Alerts to Right-Size

Set up alerts to determine if you need to scale:

```bash
# If CPU < 30% average, consider downgrading
# If memory < 50% average, consider downgrading
```

### Estimated Monthly Costs by User Count

| Users | Recommended Setup | Monthly Cost |
|-------|-------------------|--------------|
| 1-100 | App Platform Basic | $5 |
| 100-300 | Droplet 1GB | $6 |
| 300-500 | Droplet 2GB | $12 |
| 500-1000 | Droplet 2GB + 2vCPU | $18 |
| 1000+ | 2x Droplet + LB | $36+ |

### Free Tier

App Platform offers a **free tier** with:
- 3 static sites
- Limited build minutes
- Note: Not suitable for this Docker-based service

---

## Troubleshooting

### Common Issues

#### 1. Build Fails on App Platform

**Symptom**: "Build failed" error in deployment

**Check**: 
```bash
doctl apps logs <APP_ID> --type build
```

**Common fixes**:
- Ensure Dockerfile is in correct directory (`services/resume-latex-service/`)
- Check source_dir in app spec matches
- Verify Dockerfile syntax

#### 2. Container Crashes After Start

**Symptom**: "Container restarting" or health check fails

**Fix**:
- Increase `initial_delay_seconds` in health check (tectonic needs 60s+ first run)
- Check logs: `doctl apps logs <APP_ID> --type run`

#### 3. Out of Memory

**Symptom**: Container killed, OOMKilled in logs

**Fix**:
- Upgrade to 2GB RAM droplet (required for 500 users)
- Check memory usage: `curl http://localhost:8080/metrics`
- Reduce cache size if needed

#### 4. Slow First Request

**Symptom**: First request takes 30-60 seconds

**Cause**: tectonic downloads LaTeX packages on first compilation

**Fix**: 
- The Dockerfile now pre-warms tectonic cache during build
- If still slow, rebuild the image with `--no-cache`

#### 5. Connection Refused

**Symptom**: Can't reach service

**Check**:
```bash
# For Droplet
ssh root@YOUR_IP
docker ps  # Is container running?
curl localhost:8080/healthz  # Does it respond locally?
ufw status  # Is firewall blocking?
```

#### 6. Queue Full Errors (503)

**Symptom**: Service returns `{ "error": "QUEUE_ERROR", "code": "QUEUE_FULL" }`

**Cause**: Too many concurrent requests

**Fix**:
```bash
# Check queue stats
curl http://localhost:8080/metrics

# If queue is consistently full:
# 1. Scale horizontally (add more instances)
# 2. Or increase queue size (edit src/queue.ts)
# 3. Or upgrade to faster droplet
```

#### 7. Low Cache Hit Rate (<50%)

**Symptom**: Cache hit rate in `/metrics` is below 50%

**Cause**: Users are generating unique resumes each time

**Fix**:
- This is expected behavior for first-time users
- Hit rate improves as users iterate on same resume
- Consider increasing cache size if memory allows

### Useful Commands

```bash
# App Platform
doctl apps list
doctl apps get <APP_ID>
doctl apps logs <APP_ID> --follow
doctl apps create-deployment <APP_ID>  # Force redeploy

# Droplet
doctl compute droplet list
ssh root@YOUR_IP
docker ps -a
docker logs latex-service
docker restart latex-service

# Registry
doctl registry repository list-v2 resume-services
doctl registry garbage-collection start resume-services
```

---

## Quick Reference

### App Platform Deployment Commands

```bash
# Create app from spec
doctl apps create --spec app.yaml

# Update app
doctl apps update <APP_ID> --spec app.yaml

# Force deployment
doctl apps create-deployment <APP_ID>

# Delete app
doctl apps delete <APP_ID>
```

### Droplet Management

```bash
# Create droplet
doctl compute droplet create latex-service \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1

# SSH
ssh root@$(doctl compute droplet get latex-service --format PublicIPv4 --no-header)

# Destroy
doctl compute droplet delete latex-service
```

### Service URLs Format

| Deployment | URL Format |
|------------|------------|
| App Platform | `https://[app-name]-[random].ondigitalocean.app` |
| Droplet (no domain) | `http://[droplet-ip]:8080` |
| Droplet (with domain) | `https://[your-domain.com]` |

---

## Checklist

### Before Deployment

- [ ] DigitalOcean account created
- [ ] `doctl` installed and authenticated
- [ ] Docker installed locally
- [ ] Code pushed to GitHub

### Deployment

- [ ] App/Droplet created
- [ ] Service responding to `/healthz`
- [ ] Test compilation works
- [ ] Domain configured (optional)
- [ ] SSL working (automatic for App Platform)

### Integration

- [ ] `LATEX_SERVICE_URL` set in main app
- [ ] `MINIO_ENDPOINT` and `MINIO_*` set in main app (if MinIO on Droplet)
- [ ] Main app can call LaTeX service
- [ ] PDF export working from dashboard

### Monitoring

- [ ] Logs accessible
- [ ] Alerts configured
- [ ] Understand cost implications

---

## Support

- **DigitalOcean Documentation**: [https://docs.digitalocean.com](https://docs.digitalocean.com)
- **App Platform Docs**: [https://docs.digitalocean.com/products/app-platform](https://docs.digitalocean.com/products/app-platform)
- **Community Tutorials**: [https://www.digitalocean.com/community/tutorials](https://www.digitalocean.com/community/tutorials)
- **Support Ticket**: [https://cloud.digitalocean.com/support](https://cloud.digitalocean.com/support)
