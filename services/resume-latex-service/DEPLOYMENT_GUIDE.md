# Resume LaTeX Service - DigitalOcean Deployment Guide

A complete step-by-step guide to deploy the Resume LaTeX Service on DigitalOcean from scratch.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: App Platform (Recommended)](#option-1-app-platform-recommended)
- [Option 2: Droplet with Docker](#option-2-droplet-with-docker)
- [Option 3: Container Registry + App Platform](#option-3-container-registry--app-platform)
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

## Option 1: App Platform (Recommended)

DigitalOcean App Platform is the easiest way to deploy - similar to Heroku/Vercel. It automatically builds from your Dockerfile.

### Step 1: Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
cd d:\3-1 AD\Resume_Buddy
git add services/resume-latex-service
git commit -m "Add LaTeX service for deployment"
git push origin main
```

### Step 2: Create App via Console (GUI Method)

1. Go to [https://cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **GitHub** as source
4. Authorize DigitalOcean to access your GitHub account
5. Select repository: `Resume-Buddy_v2`
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
      repo: Rajeevkavala/Resume-Buddy_v2
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

## Option 2: Droplet with Docker

For more control and potentially lower costs at scale.

### Step 1: Create a Droplet

```bash
# List available sizes
doctl compute size list

# Create droplet (Ubuntu 22.04, Basic $6/mo)
doctl compute droplet create latex-service \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --wait
```

**Or via Console:**

1. Go to [https://cloud.digitalocean.com/droplets/new](https://cloud.digitalocean.com/droplets/new)
2. Choose **Ubuntu 22.04 LTS x64**
3. Select **Basic** → **Regular** → **$6/mo** (1 GB RAM, 1 vCPU)
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

**Option A: Build on Droplet**

```bash
# Clone repository
git clone https://github.com/Rajeevkavala/Resume-Buddy_v2.git
cd Resume-Buddy_v2/services/resume-latex-service

# Build Docker image
docker build -t resume-latex-service .

# Run container
docker run -d \
  --name latex-service \
  --restart unless-stopped \
  -p 8080:8080 \
  -e NODE_ENV=production \
  resume-latex-service
```

**Option B: Pull from Container Registry (see Option 3 first)**

```bash
# Login to DO registry
doctl registry login

# Pull and run
docker pull registry.digitalocean.com/your-registry/latex-service:latest
docker run -d \
  --name latex-service \
  --restart unless-stopped \
  -p 8080:8080 \
  registry.digitalocean.com/your-registry/latex-service:latest
```

### Step 5: Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
apt install nginx -y

# Create config
cat > /etc/nginx/sites-available/latex-service << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/latex-service /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

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
ufw enable

# Verify
ufw status
```

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
cd "D:\3-1 AD\Resume_Buddy\services\resume-latex-service"

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
```

### 2. Redeploy Main App

If using Firebase App Hosting, update the environment:

```bash
# Add to apphosting.yaml
env:
  - variable: LATEX_SERVICE_URL
    value: https://resume-latex-service-xxxxx.ondigitalocean.app
```

### 3. Test Integration

```bash
# In your main app directory
npm run dev

# Navigate to dashboard and test PDF export
```

---

## Monitoring & Logs

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
```

### Setup Alerts

1. Go to [https://cloud.digitalocean.com/monitoring](https://cloud.digitalocean.com/monitoring)
2. Click **Create Alert Policy**
3. Recommended alerts:
   - **CPU** > 80% for 5 minutes
   - **Memory** > 80% for 5 minutes
   - **Droplet offline** (for Droplet deployment)

---

## Cost Optimization

### Pricing Comparison

| Option | Monthly Cost | Notes |
|--------|-------------|-------|
| App Platform Basic-XXS | $4/mo | Sleeps after inactivity (free tier available) |
| App Platform Basic | $5/mo | Always on |
| Droplet (1GB) | $6/mo | More control, fixed cost |
| Container Registry Starter | $5/mo | 500MB storage |

### Cost-Saving Tips

1. **Use Basic-XXS** for low traffic - it sleeps after inactivity but wakes on request
2. **No registry needed** if deploying directly from GitHub to App Platform
3. **Reserved IPs** are free when attached to a Droplet
4. **Snapshots** for backups instead of expensive backup plans

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
- Upgrade to larger instance (1GB+ RAM)
- For Droplet: `docker run -m 512m ...` to set limits

#### 4. Slow First Request

**Symptom**: First request takes 30-60 seconds

**Cause**: tectonic downloads LaTeX packages on first compilation

**Fix**: 
- This is expected behavior on cold start
- For Droplet: pre-warm with a health check cron job

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
