# ResumeBuddy Development Guide

Complete guide to run ResumeBuddy locally for development. This covers the frontend (Next.js), backend services, databases, and LaTeX export service.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Service Architecture](#service-architecture)
- [Common Commands](#common-commands)
- [Database Management](#database-management)
- [Authentication System](#authentication-system)
- [AI/Genkit Development](#aigenkit-development)
- [LaTeX Service](#latex-service)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Rajeevkavala/Resume-Buddy_v3.git
cd Resume-Buddy_v3

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.template .env
# Edit .env with your API keys

# 4. Start infrastructure (Docker required)
npm run infra:up

# 5. Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# 6. Run the app
npm run dev
```

Application will be available at: **http://localhost:9002**

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Install Link |
|----------|---------|---------|--------------|
| **Node.js** | 18.x+ | Runtime | [nodejs.org](https://nodejs.org/) |
| **pnpm** or **npm** | 8.x+ | Package manager | Comes with Node.js |
| **Docker Desktop** | Latest | Infrastructure services (PostgreSQL, Redis, MinIO) | [docker.com](https://docs.docker.com/desktop/) |
| **Git** | 2.x+ | Version control | [git-scm.com](https://git-scm.com/) |

### Required Accounts & API Keys

| Service | Purpose | Free Tier | Get Key |
|---------|---------|-----------|---------|
| **Groq** | Primary AI provider | 14,400 req/day | [Groq Console](https://console.groq.com/) |
| **Google AI** | Backup AI provider | 1,500 req/day | [AI Studio](https://aistudio.google.com/apikey) |
| **OpenRouter** | Tertiary AI provider | Varies | [OpenRouter](https://openrouter.ai/keys) |
| **Resend** (optional) | Email OTP | 3,000 emails/mo | [Resend](https://resend.com/) |
| **Twilio** (optional) | SMS/WhatsApp OTP | Trial credits | [Twilio](https://www.twilio.com/) |

---

## Environment Setup

### 1. Create `.env` File

Create a `.env` file in the project root with the following variables:

```env
# ============================================
# Database (PostgreSQL 16)
# ============================================
DB_USER=resumebuddy
DB_PASSWORD=resumebuddy_dev_2024
DB_NAME=resumebuddy
DATABASE_URL=postgresql://resumebuddy:resumebuddy_dev_2024@localhost:5432/resumebuddy

# ============================================
# Redis 7 (Cache + Sessions)
# ============================================
REDIS_PASSWORD=redis_dev_2024
REDIS_URL=redis://:redis_dev_2024@localhost:6379

# ============================================
# MinIO Storage (S3-Compatible)
# ============================================
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minio_dev_secret_2024
MINIO_BUCKET=resumebuddy

# ============================================
# Authentication (JWT-based)
# ============================================
JWT_SECRET=dev_jwt_secret_change_in_production_32chars
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_prod_32c
SESSION_COOKIE_NAME=rb_session
SESSION_TTL=604800

# ============================================
# OAuth Providers (Optional)
# ============================================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ============================================
# Email Service (for OTP & notifications)
# ============================================
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=ResumeBuddy
# Alternative: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# ============================================
# SMS/WhatsApp OTP (Optional)
# ============================================
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+14155238886
SMS_PROVIDER=twilio

# ============================================
# AI Providers (Server-side) - Fallback Order
# ============================================
# Primary: Groq (fastest, 14,400/day free)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Backup: Google Gemini (1,500/day free)
GOOGLE_API_KEY=your_gemini_api_key

# Tertiary: OpenRouter (free Llama/Mistral models)
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx

# ============================================
# Services
# ============================================
LATEX_SERVICE_URL=http://localhost:8080
WEBSOCKET_URL=ws://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development

# ============================================
# Payment (Razorpay)
# ============================================
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
RAZORPAY_PLAN_ID=plan_xxx

# ============================================
# Admin
# ============================================
ADMIN_EMAILS=admin@example.com
```

### 2. OAuth Setup (Optional)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID (Web Application)
5. Add authorized redirect URI: `http://localhost:9002/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

#### GitHub OAuth
1. Go to GitHub → Settings → Developer Settings → OAuth Apps
2. Create New OAuth App
3. Set Authorization callback URL: `http://localhost:9002/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`

---

## Running the Application

### Option 1: Full Stack (Recommended)

This is the recommended setup for local development.

```bash
# Terminal 1: Start infrastructure services (PostgreSQL, Redis, MinIO)
npm run infra:up

# Check services are running
npm run infra:ps

# Terminal 2: Generate Prisma client & run migrations
npm run db:generate
npm run db:migrate

# Terminal 3: Start Next.js app
npm run dev
```

**Services started:**
- **PostgreSQL** → localhost:5432 (User data, subscriptions, resumes)
- **Redis** → localhost:6379 (Sessions, caching, rate limiting)
- **MinIO** → localhost:9000 (API), localhost:9001 (Console) (File storage)
- **Next.js** → localhost:9002 (Main application)

### Option 2: With LaTeX Export Service

For resume PDF export functionality:

```bash
# Terminal 1: Infrastructure
npm run infra:up

# Terminal 2: Database setup
npm run db:generate && npm run db:migrate

# Terminal 3: LaTeX service (Docker required)
cd services/resume-latex-service
npm run docker:build
npm run docker:run

# Terminal 4: Next.js app
npm run dev
```

### Option 3: Full Docker Stack (Production-like)

```bash
# Start all services including web app
cd infrastructure/docker
docker compose up -d

# View logs
docker compose logs -f web
```

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js App (localhost:9002)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │  React UI   │  │Server Actions│  │  AI Smart Router     │    │
│  │ (shadcn/ui) │  │  + API Routes│  │ Groq→Gemini→OpenRouter│   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘    │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                 Authentication Layer                       │  │
│  │  JWT Tokens + Redis Sessions + OAuth (Google/GitHub)       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────┐    ┌───────────────┐    ┌──────────────────┐
│ PostgreSQL  │    │     Redis     │    │  AI Providers    │
│ Users, Data │    │Sessions, Cache│    │  (external APIs) │
│   :5432     │    │    :6379      │    │                  │
└─────────────┘    └───────────────┘    └──────────────────┘
         │
         ├────────────────┬────────────────┐
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    MinIO    │   │ LaTeX Svc   │   │  WebSocket  │
│  (Storage)  │   │   (PDF)     │   │  (optional) │
│   :9000     │   │   :8080     │   │   :3001     │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## Common Commands

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (port 9002) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

### Infrastructure (Docker)

| Command | Description |
|---------|-------------|
| `npm run infra:up` | Start PostgreSQL, Redis, MinIO |
| `npm run infra:down` | Stop all infrastructure services |
| `npm run infra:ps` | Check service status |
| `npm run infra:logs` | View container logs |
| `npm run infra:reset` | Reset all data (destructive!) |
| `npm run infra:setup` | Run full setup script (Windows PowerShell) |

### Database (Prisma)

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio GUI (localhost:5555) |

### Testing

| Command | Description |
|---------|-------------|
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:auth` | Run auth tests only |
| `npm run test:api` | Run API tests only |
| `npm run test:e2e` | Run end-to-end tests |

### AI Development

| Command | Description |
|---------|-------------|
| `npm run genkit:dev` | Start Genkit UI at localhost:4000 |
| `npm run genkit:watch` | Genkit with hot reload |
| `npm run tokens:estimate` | Estimate token usage for prompts |

### LaTeX Service

| Command | Description |
|---------|-------------|
| `npm run latex:smoke` | Test LaTeX compilation |
| `cd services/resume-latex-service && npm run dev` | Run LaTeX service locally |
| `cd services/resume-latex-service && npm run docker:build` | Build Docker image |
| `cd services/resume-latex-service && npm run docker:run` | Run in Docker |

---

## Database Management

### PostgreSQL (via Docker)

```bash
# Connect to PostgreSQL CLI
docker exec -it resumebuddy-db psql -U resumebuddy -d resumebuddy

# Common SQL commands
\dt                    # List tables
\d tablename           # Describe table
SELECT * FROM users;   # Query data
\q                     # Quit
```

### Prisma Studio (GUI)

```bash
npm run db:studio
# Opens at http://localhost:5555
```

### Redis (via Docker)

```bash
# Connect to Redis CLI
docker exec -it resumebuddy-redis redis-cli -a redis_dev_2024

# Common commands
KEYS *               # List all keys
GET keyname          # Get value
DEL keyname          # Delete key
FLUSHALL             # Clear all (destructive!)
```

### MinIO Console

Access MinIO web UI: **http://localhost:9001**
- Username: `minioadmin`
- Password: `minio_dev_secret_2024` (from .env)

---

## Authentication System

ResumeBuddy uses a **JWT-based authentication system** with PostgreSQL and Redis.

### Authentication Methods

| Method | Description | Endpoint |
|--------|-------------|----------|
| **Email/Password** | Traditional login | `POST /api/auth/login` |
| **Registration** | Create new account | `POST /api/auth/register` |
| **Google OAuth** | Sign in with Google | `GET /api/auth/google` |
| **GitHub OAuth** | Sign in with GitHub | `GET /api/auth/callback/github` |
| **OTP** | Email/SMS/WhatsApp verification | `POST /api/auth/otp/*` |

### Token Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Login   │─────▶│  Server  │─────▶│  Redis   │
│  Request │      │  Verify  │      │  Session │
└──────────┘      └──────────┘      └──────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  JWT Tokens      │
              │  - Access (15m)  │
              │  - Refresh (7d)  │
              └──────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  HTTP-Only       │
              │  Cookies         │
              │  (rb_session)    │
              └──────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| JWT Utils | `packages/auth/src/jwt.ts` | Token generation/verification |
| Session Manager | `packages/auth/src/session.ts` | Redis session storage |
| Password Utils | `packages/auth/src/password.ts` | Password hashing (bcrypt) |
| OAuth | `packages/auth/src/oauth/` | Google, GitHub integration |
| OTP | `packages/auth/src/otp/` | Email, SMS, WhatsApp verification |

### API Endpoints

```bash
# Login
curl -X POST http://localhost:9002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get current session
curl http://localhost:9002/api/auth/session \
  -H "Cookie: rb_session=xxx"

# Logout
curl -X POST http://localhost:9002/api/auth/logout \
  -H "Cookie: rb_session=xxx"

# Refresh token
curl -X POST http://localhost:9002/api/auth/refresh \
  -H "Cookie: rb_session=xxx"
```

### Session Cookie

The `rb_session` cookie is:
- **HTTP-Only**: Not accessible via JavaScript (security)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: `Lax` for CSRF protection
- **Expiry**: 7 days (configurable via `SESSION_TTL`)

---

## AI/Genkit Development

### Testing AI Flows

Start the Genkit developer UI:

```bash
npm run genkit:dev
# Open http://localhost:4000
```

This provides:
- Interactive flow testing
- Input/output inspection
- Trace visualization
- Performance metrics

### AI Provider Fallback Order

1. **Groq** (Primary) - Fastest, 14,400 req/day free
2. **Gemini** (Backup) - Google's reliable fallback
3. **OpenRouter** (Tertiary) - Free Llama/Mistral models

The system automatically falls back if a provider fails or hits rate limits.

### Smart Model Routing

Different AI features use different models optimized for the task:

| Feature | Primary Model | Token Limit |
|---------|--------------|-------------|
| `resume-qa` | groq-llama-8b | 3,000 |
| `resume-analysis` | groq-llama-70b | 6,000 |
| `interview-questions` | groq-llama-70b | 4,000 |
| `resume-improvement` | groq-llama-70b | 8,000 |
| `cover-letter` | groq-llama-70b | 5,000 |

---

## LaTeX Service

The LaTeX service compiles resumes to professional PDF format.

### Local Development (Docker - Recommended)

```bash
cd services/resume-latex-service

# Build image
npm run docker:build

# Run container
npm run docker:run
# Service available at http://localhost:8080
```

### Health Check

```bash
curl http://localhost:8080/healthz
# Expected: {"status":"ok"}
```

### Test Compilation

```bash
curl -X POST http://localhost:8080/v1/resume/latex/compile \
  -H "Content-Type: application/json" \
  -d '{
    "source": "resumeText",
    "templateId": "professional",
    "resumeText": "John Doe\nSoftware Engineer\n\n- Built scalable APIs",
    "options": {"engine": "tectonic", "return": ["latex", "pdf"]}
  }'
```

### Available Templates

- `professional` - Clean, traditional format
- `faang` - Optimized for tech companies
- `jake` - Classic Jake's Resume
- `deedy` - Deedy CV style
- `modern` - Contemporary design
- `minimal` - Minimalist layout
- `tech` - Tech-focused format

---

## Testing

### Run All Tests

```bash
npm run test
```

### Run Specific Test Suites

```bash
# Authentication tests
npm run test:auth

# API tests
npm run test:api

# Business logic tests
npm run test:business

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:perf
```

### Coverage Report

```bash
npm run test:coverage
# Report generated in coverage/ directory
```

---

## Troubleshooting

### Port Already in Use

```bash
# Windows - Find process using port 9002
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :9002
kill -9 <PID>
```

### Docker Services Not Starting

```bash
# Check Docker is running
docker info

# View logs
npm run infra:logs

# Reset everything
npm run infra:reset
```

### Authentication Errors

1. **Session not persisting**: Check `rb_session` cookie in browser DevTools
2. **Invalid credentials**: Verify user exists in PostgreSQL (`prisma studio`)
3. **OAuth errors**: Check OAuth callback URLs match your `.env` config
4. **Token expired**: The access token expires in 15 minutes; refresh is automatic

```bash
# Debug: Check Redis session
docker exec -it resumebuddy-redis redis-cli -a redis_dev_2024
KEYS session:*

# Debug: Check user in database
npm run db:studio
# Navigate to User table
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker exec -it resumebuddy-db pg_isready -U resumebuddy

# Reset database (destructive!)
npm run infra:reset
npm run db:migrate

# View migration status
cd packages/database && npx prisma migrate status
```

### AI Provider Errors

1. **Rate Limit**: Wait or add backup provider keys
2. **Invalid Key**: Verify API keys in `.env`
3. **Timeout**: Check internet connection

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clean install
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### LaTeX Service Issues

```bash
# Check if service is running
curl http://localhost:8080/healthz

# View logs
docker logs resumebuddy-latex

# Rebuild image
cd services/resume-latex-service
npm run docker:build
```

---

## VS Code Recommended Extensions

- **ESLint** - Linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS classes
- **Prisma** - Database schema
- **Docker** - Container management
- **Thunder Client** - API testing

---

## Additional Resources

- [Deployment Guide](./DEPLOYMENT_FULL_GUIDE.md)
- [Project Architecture](./ARCHITECTURE_TRANSFORMATION.md)
- [LaTeX Service README](../services/resume-latex-service/README.md)
- [Database Schema](../packages/database/prisma/schema.prisma)
- [Auth Package](../packages/auth/src/index.ts)
