# ResumeBuddy Production Deployment Guide

Complete deployment guide for ResumeBuddy covering **free options** for startups/demos and **scalable paid options** for production workloads.

## Table of Contents

- [Deployment Architecture Overview](#deployment-architecture-overview)
- [Cost Comparison](#cost-comparison)
- [Part 1: Free Deployment Options](#part-1-free-deployment-options)
  - [Option A: Vercel + Supabase (Recommended Free)](#option-a-vercel--supabase-recommended-free)
  - [Option B: Railway (Full-Stack Free)](#option-b-railway-full-stack-free)
  - [Option C: Render + Supabase](#option-c-render--supabase)
- [Part 2: Scalable Paid Deployment](#part-2-scalable-paid-deployment)
  - [Option A: DigitalOcean (Recommended)](#option-a-digitalocean-recommended)
  - [Option B: AWS (Enterprise Scale)](#option-b-aws-enterprise-scale)
  - [Option C: Google Cloud Platform](#option-c-google-cloud-platform)
- [LaTeX Service Deployment](#latex-service-deployment)
- [CI/CD Pipeline Setup](#cicd-pipeline-setup)
- [Monitoring & Observability](#monitoring--observability)
- [Security Checklist](#security-checklist)
- [Backup & Disaster Recovery](#backup--disaster-recovery)

---

## Deployment Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐     ┌────────────────┐     ┌────────────────────┐   │
│  │   CDN/Edge     │────▶│   Load         │────▶│   Next.js App      │   │
│  │ (Cloudflare)   │     │   Balancer     │     │   (Node.js)        │   │
│  └────────────────┘     └────────────────┘     └────────────────────┘   │
│                                                         │                │
│         ┌───────────────────────────────────────────────┼────────┐      │
│         │                       │                       │        │      │
│         ▼                       ▼                       ▼        ▼      │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────┐   ┌──────────┐ │
│  │  JWT Auth   │    │   PostgreSQL     │    │  Redis  │   │ LaTeX    │ │
│  │  + Sessions │    │   (Primary DB)   │    │  Cache  │   │ Service  │ │
│  └─────────────┘    └──────────────────┘    └─────────┘   └──────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │       AI Providers           │
                    │  Groq → Gemini → OpenRouter  │
                    └──────────────────────────────┘
```

---

## Cost Comparison

| Option | Monthly Cost | Users Supported | Best For |
|--------|-------------|-----------------|----------|
| **Vercel + Supabase** | $0 | ~1,000 | Demos, MVPs, Small projects |
| **Railway** | $0-5 | ~500 | Full-stack prototypes |
| **Render + Supabase** | $0-7 | ~500 | Alternative free stack |
| **DigitalOcean** | $20-50 | 500-5,000 | Production, cost-effective |
| **AWS** | $50-200+ | 10,000+ | Enterprise, auto-scaling |
| **Google Cloud** | $50-150+ | 5,000+ | GCP ecosystem, Cloud Run |

---

# Part 1: Free Deployment Options

## Option A: Vercel + Supabase (Recommended Free)

**Best for**: Quick deployments, demos, small projects (PostgreSQL + free tier auth)
**Free limits**: 100GB bandwidth, 6,000 minutes build time/month

### Step 1: Prepare Repository

```bash
# Ensure your code is on GitHub
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Add Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Database (Use managed PostgreSQL like Neon, Supabase, or Railway)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis (Use Upstash for serverless Redis)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# Authentication
JWT_SECRET=your_production_jwt_secret_minimum_32_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_min_32_chars
SESSION_COOKIE_NAME=rb_session

# OAuth (Optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# AI Providers
GROQ_API_KEY=gsk_xxx
GOOGLE_API_KEY=xxx
OPENROUTER_API_KEY=sk-or-xxx

# LaTeX Service (deploy separately or use external)
LATEX_SERVICE_URL=https://your-latex-service.onrender.com

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### Step 4: Configure Custom Domain (Optional)

1. Go to Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Step 5: Deploy LaTeX Service on Render (Free)

```bash
# In services/resume-latex-service
# Create render.yaml
```

Create `services/resume-latex-service/render.yaml`:
```yaml
services:
  - type: web
    name: resumebuddy-latex
    env: docker
    dockerfilePath: ./Dockerfile
    region: oregon
    plan: free
    healthCheckPath: /healthz
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
```

Deploy:
1. Go to [render.com](https://render.com)
2. Connect GitHub
3. Select `services/resume-latex-service` directory
4. Choose **Docker** environment
5. Use Free plan

**Vercel Free Tier Limits**:
- 100GB bandwidth/month
- Serverless Function: 10s timeout (hobby)
- Edge Functions: unlimited
- 6,000 build minutes/month

---

## Option B: Railway (Full-Stack Free)

**Best for**: Full monorepo deployment with databases
**Free credits**: $5/month free (enough for small apps)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Deploy from GitHub

```bash
# Click "New Project" → "Deploy from GitHub repo"
# Select your repository
```

### Step 3: Add Services

In Railway dashboard, add:

**PostgreSQL**:
- Click **+ New** → **Database** → **PostgreSQL**
- Automatically sets `DATABASE_URL`

**Redis**:
- Click **+ New** → **Database** → **Redis**
- Automatically sets `REDIS_URL`

**Next.js App**:
- Click **+ New** → **GitHub Repo** → Select repo
- Set root directory: `/`

### Step 4: Configure Environment Variables

In Railway → Your Project → Variables:

```env
# Auto-configured by Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Authentication (required)
JWT_SECRET=your_production_jwt_secret_minimum_32_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_min_32_chars

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# AI Providers
GROQ_API_KEY=gsk_xxx
GOOGLE_API_KEY=xxx
OPENROUTER_API_KEY=sk-or-xxx

# App config
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
NODE_ENV=production
PORT=9002
```

### Step 5: Deploy LaTeX Service

Add another service:
- Click **+ New** → **GitHub Repo**
- Root directory: `services/resume-latex-service`
- Railway auto-detects Dockerfile

**Railway Free Limits**:
- $5 free credits/month
- ~500 hours of runtime
- 512MB RAM per service

---

## Option C: Render + Supabase

**Best for**: PostgreSQL-first applications
**Free tier**: Generous free tiers on both platforms

### Step 1: Set Up Supabase (Database + Auth)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database

```env
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repository
4. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Add Environment Variables

In Render → Environment:

```env
# Database
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Authentication
JWT_SECRET=your_production_jwt_secret_minimum_32_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_min_32_chars

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# AI Providers
GROQ_API_KEY=gsk_xxx
GOOGLE_API_KEY=xxx
OPENROUTER_API_KEY=sk-or-xxx

# App config
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NODE_ENV=production
```

### Step 4: Add Redis (Upstash - Free)

1. Go to [upstash.com](https://upstash.com)
2. Create Redis database (free tier: 10,000 commands/day)
3. Add to Render environment:

```env
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

**Render Free Limits**:
- 750 hours/month
- Spins down after 15 min inactivity
- 512MB RAM

---

# Part 2: Scalable Paid Deployment

## Option A: DigitalOcean (Recommended)

**Best for**: Cost-effective production, 500-5,000 users
**Starting cost**: ~$20/month

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalOcean                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐  │
│  │  App        │      │  Managed    │     │  Managed    │  │
│  │  Platform   │◀────▶│  PostgreSQL │     │  Redis      │  │
│  │  (Next.js)  │      │  $15/mo     │     │  $15/mo     │  │
│  └─────────────┘      └─────────────┘     └─────────────┘  │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐  │
│  │  Droplet    │      │  Spaces     │     │  Load       │  │
│  │  (LaTeX)    │      │  (Storage)  │     │  Balancer   │  │
│  │  $12/mo     │      │  $5/mo      │     │  $12/mo     │  │
│  └─────────────┘      └─────────────┘     └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         Total: ~$59/mo
```

### Step 1: Create DigitalOcean Account

1. Go to [digitalocean.com](https://cloud.digitalocean.com/registrations/new)
2. Sign up and add payment method
3. Use referral link for $200 free credit (60 days)

### Step 2: Install doctl CLI

```powershell
# Windows (PowerShell Admin)
choco install doctl

# Or download from:
# https://github.com/digitalocean/doctl/releases

# Authenticate
doctl auth init
```

### Step 3: Deploy Managed PostgreSQL

```bash
# Create database cluster
doctl databases create resumebuddy-db \
  --engine pg \
  --region nyc1 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1

# Get connection string
doctl databases connection resumebuddy-db --format Host,Port,User,Password,Database
```

### Step 4: Deploy Managed Redis

```bash
doctl databases create resumebuddy-redis \
  --engine redis \
  --region nyc1 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1
```

### Step 5: Deploy Next.js via App Platform

Create `app.yaml`:

```yaml
name: resumebuddy
region: nyc
services:
  - name: web
    github:
      repo: Rajeevkavala/Resume-Buddy_v3
      branch: main
      deploy_on_push: true
    dockerfile_path: infrastructure/docker/Dockerfile.web
    http_port: 9002
    instance_size_slug: professional-xs
    instance_count: 2
    health_check:
      http_path: /api/health
    envs:
      - key: DATABASE_URL
        value: ${resumebuddy-db.DATABASE_URL}
      - key: REDIS_URL  
        value: ${resumebuddy-redis.REDIS_URL}
      - key: GROQ_API_KEY
        type: SECRET
        value: YOUR_GROQ_KEY
      - key: GOOGLE_API_KEY
        type: SECRET
        value: YOUR_GOOGLE_KEY
      - key: NODE_ENV
        value: production

databases:
  - name: resumebuddy-db
    engine: PG
    production: true
  - name: resumebuddy-redis
    engine: REDIS
    production: true
```

Deploy:
```bash
doctl apps create --spec app.yaml
```

### Step 6: Deploy LaTeX Service on Droplet

```bash
# Create Droplet
doctl compute droplet create latex-service \
  --image docker-20-04 \
  --size s-1vcpu-2gb \
  --region nyc1

# SSH into droplet
doctl compute ssh latex-service

# On the droplet:
apt update && apt install -y docker.io docker-compose
git clone https://github.com/Rajeevkavala/Resume-Buddy_v3.git
cd Resume-Buddy_v3/services/resume-latex-service
docker build -t latex-service .
docker run -d --restart=always -p 8080:8080 -m 1536m latex-service
```

### Step 7: Configure Firewall

```bash
# Create firewall
doctl compute firewall create \
  --name latex-firewall \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0 protocol:tcp,ports:8080,address:0.0.0.0/0" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0"
```

### Step 8: Set Up Domain & SSL

1. Go to Networking → Domains
2. Add your domain
3. Point A record to your app
4. SSL is automatic with App Platform

**DigitalOcean Monthly Costs**:
| Service | Size | Cost |
|---------|------|------|
| App Platform | Professional XS x2 | $24 |
| PostgreSQL | 1 vCPU, 1GB | $15 |
| Redis | 1 vCPU, 1GB | $15 |
| Droplet (LaTeX) | 1 vCPU, 2GB | $12 |
| Spaces (optional) | 250GB | $5 |
| **Total** | | **~$71/mo** |

---

## Option B: AWS (Enterprise Scale)

**Best for**: Large scale, auto-scaling, enterprise requirements
**Starting cost**: ~$50-200/month

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                           AWS                                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐    ┌────────────┐    ┌────────────────────────────┐ │
│  │CloudFront│───▶│    ALB     │───▶│      ECS Fargate           │ │
│  │  (CDN)   │    │ (L7 LB)    │    │  ┌──────────────────────┐  │ │
│  └──────────┘    └────────────┘    │  │  Next.js Container   │  │ │
│                                     │  │  (Auto-scaling)      │  │ │
│                                     │  └──────────────────────┘  │ │
│                                     │  ┌──────────────────────┐  │ │
│                                     │  │  LaTeX Container     │  │ │
│                                     │  └──────────────────────┘  │ │
│                                     └────────────────────────────┘ │
│                                               │                    │
│         ┌─────────────────────────────────────┼────────────────┐  │
│         │                     │               │                │  │
│         ▼                     ▼               ▼                ▼  │
│  ┌─────────────┐    ┌─────────────┐   ┌─────────────┐  ┌────────┐│
│  │    RDS      │    │ElastiCache  │   │     S3      │  │Secrets ││
│  │ PostgreSQL  │    │   Redis     │   │  Storage    │  │Manager ││
│  └─────────────┘    └─────────────┘   └─────────────┘  └────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Step 1: Install AWS CLI

```powershell
# Windows
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Output (json)
```

### Step 2: Create VPC & Networking

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=resumebuddy-vpc}]'

# Note the VPC ID, then create subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

### Step 3: Create RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier resumebuddy-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username resumebuddy \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name resumebuddy-subnet-group \
  --backup-retention-period 7
```

### Step 4: Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id resumebuddy-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxx \
  --cache-subnet-group-name resumebuddy-cache-subnet
```

### Step 5: Create ECR Repository

```bash
# Create repository
aws ecr create-repository --repository-name resumebuddy-web
aws ecr create-repository --repository-name resumebuddy-latex

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t resumebuddy-web -f infrastructure/docker/Dockerfile.web .
docker tag resumebuddy-web:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/resumebuddy-web:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/resumebuddy-web:latest
```

### Step 6: Create ECS Cluster & Service

Create `ecs-task-definition.json`:

```json
{
  "family": "resumebuddy-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::xxx:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/resumebuddy-web:latest",
      "portMappings": [
        {
          "containerPort": 9002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:xxx"},
        {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:xxx"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/resumebuddy",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "web"
        }
      }
    }
  ]
}
```

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create cluster
aws ecs create-cluster --cluster-name resumebuddy-cluster

# Create service with ALB
aws ecs create-service \
  --cluster resumebuddy-cluster \
  --service-name resumebuddy-web \
  --task-definition resumebuddy-web \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:xxx,containerName=web,containerPort=9002"
```

### Step 7: Set Up Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/resumebuddy-cluster/resumebuddy-web \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name resumebuddy-cpu-scaling \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/resumebuddy-cluster/resumebuddy-web \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

**AWS Monthly Cost Estimate**:
| Service | Configuration | Cost |
|---------|--------------|------|
| ECS Fargate | 2 tasks (0.5 vCPU, 1GB) | ~$30 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache | cache.t3.micro | ~$15 |
| ALB | Standard | ~$20 |
| CloudFront | 100GB transfer | ~$10 |
| S3 | 50GB storage | ~$2 |
| **Total** | | **~$92/mo** |

---

## Option C: Google Cloud Platform

**Best for**: Google ecosystem, Cloud Run, Cloud SQL PostgreSQL
**Starting cost**: ~$50/month

### Quick Setup with Cloud Run

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com

# Create Cloud SQL PostgreSQL
gcloud sql instances create resumebuddy-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Deploy to Cloud Run
gcloud run deploy resumebuddy \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "GROQ_API_KEY=groq-api-key:latest,DATABASE_URL=db-url:latest"
```

---

## LaTeX Service Deployment

### Dedicated Deployment (All Platforms)

The LaTeX service should be deployed separately for better resource management.

#### Docker Image Build

```bash
cd services/resume-latex-service

# Build optimized production image
docker build -t resumebuddy-latex:latest .

# Tag for registry
docker tag resumebuddy-latex:latest YOUR_REGISTRY/resumebuddy-latex:latest

# Push to registry
docker push YOUR_REGISTRY/resumebuddy-latex:latest
```

#### Resource Requirements

| Scale | RAM | CPU | Concurrent Requests |
|-------|-----|-----|---------------------|
| Small (100 users) | 1GB | 1 vCPU | 3 |
| Medium (500 users) | 2GB | 2 vCPU | 6 |
| Large (1000+ users) | 4GB | 4 vCPU | 12 |

#### Health Check Configuration

```yaml
# All platforms should configure:
health_check:
  path: /healthz
  interval: 30s
  timeout: 10s
  healthy_threshold: 2
  unhealthy_threshold: 3
```

---

## CI/CD Pipeline Setup

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

      # For Vercel
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      # OR for DigitalOcean
      - name: Deploy to DigitalOcean
        uses: digitalocean/app_action@v1
        with:
          app_name: resumebuddy
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      # OR for AWS
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster resumebuddy-cluster --service resumebuddy-web --force-new-deployment
```

---

## Monitoring & Observability

### Recommended Stack

| Tool | Purpose | Free Tier |
|------|---------|-----------|
| **Sentry** | Error tracking | 5K errors/mo |
| **LogTail** | Log aggregation | 1GB/mo |
| **Uptime Robot** | Uptime monitoring | 50 monitors |
| **Vercel Analytics** | Performance | Built-in |

### Setup Sentry

```bash
npm install @sentry/nextjs

# Run setup wizard
npx @sentry/wizard@latest -i nextjs
```

### Health Check Endpoints

Ensure these are monitored:

| Endpoint | Service | Expected |
|----------|---------|----------|
| `/api/health` | Next.js | `{"status":"ok"}` |
| `/healthz` | LaTeX | `{"status":"ok"}` |
| `/readyz` | LaTeX | Queue status |
| `/metrics` | LaTeX | Prometheus metrics |

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets stored in environment variables (not code)
- [ ] JWT secrets are strong (32+ characters, cryptographically random)
- [ ] Database access restricted (connection pooling, SSL required)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### Post-Deployment

- [ ] SSL/TLS enabled (HTTPS only)
- [ ] Security headers configured
- [ ] Firewall rules set
- [ ] Backup schedule configured
- [ ] Monitoring alerts set up

### Security Headers (add to `next.config.js`)

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
];
```

---

## Backup & Disaster Recovery

### Database Backups

#### DigitalOcean Managed DB
- Automatic daily backups (7-day retention)
- Point-in-time recovery available

#### AWS RDS
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier resumebuddy-db \
  --db-snapshot-identifier resumebuddy-backup-$(date +%Y%m%d)
```

#### Supabase / PostgreSQL
- Enable automatic daily backups in Supabase Dashboard
- Use pg_dump for manual backups:

```bash
# Manual PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20241201.sql
```

### Recovery Procedures

1. **Database Corruption**: Restore from latest snapshot
2. **Service Outage**: Roll back to previous container version
3. **Complete Failure**: Redeploy from Git + restore database

---

## Summary Comparison

| Aspect | Free (Vercel) | Mid (DigitalOcean) | Enterprise (AWS) |
|--------|--------------|--------------------|--------------------|
| **Cost** | $0 | ~$70/mo | ~$100+/mo |
| **Users** | ~1,000 | ~5,000 | 10,000+ |
| **Auto-scaling** | Limited | Manual | Full auto |
| **Setup Time** | 10 min | 1 hour | 4+ hours |
| **Maintenance** | Minimal | Low | Medium |
| **Best For** | MVPs | Production | Enterprise |

---

## Quick Reference Commands

```bash
# Vercel
vercel --prod                          # Deploy to production
vercel logs                            # View logs
vercel env pull                        # Pull env vars

# DigitalOcean
doctl apps list                        # List apps
doctl apps logs APP_ID                 # View logs
doctl compute droplet list             # List droplets

# AWS
aws ecs list-services --cluster NAME   # List services
aws logs tail /ecs/resumebuddy         # View logs
aws ecs update-service --force-new-deployment  # Redeploy

# Docker
docker logs resumebuddy-latex          # View container logs
docker stats                           # Resource usage
docker system prune -a                 # Clean up
```

---

## Need Help?

- **Issues**: Open a GitHub issue
- **Documentation**: Check `/docs` folder
- **LaTeX Service**: See `services/resume-latex-service/README.md`
