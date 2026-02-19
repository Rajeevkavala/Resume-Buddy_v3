# ResumeBuddy — Currently Implemented Features

_Last updated: 2026-02-18_

This document summarizes features that are **implemented in code** in the current repository state.

---

## 1) End-User Product Features

### 1.1 Authentication & Account

Implemented authentication capabilities:

- Email/password registration with password-strength validation.
- Email/password login.
- Google OAuth login + callback flow.
- OTP send/verify flows for:
  - Email
  - SMS
  - WhatsApp
- Session-based auth with secure cookies (`rb_session`, refresh token flow).
- Refresh token rotation.
- Logout endpoint and session invalidation.
- Email verification flow (send OTP + verify OTP).
- Password management:
  - Change password (authenticated user)
  - Password reset (OTP-based)
- Email change flow (requires password re-auth for credential accounts).
- Profile update and profile-photo upload/delete.

### 1.2 Dashboard & Input Collection

Implemented dashboard capabilities:

- Resume file upload + text extraction for:
  - PDF
  - DOCX
  - TXT
- Manual resume text editing.
- Job context input:
  - Job description text input
  - Role selection
  - Job URL input
- Save and clear user working data.
- First-time welcome modal and guided steps.

### 1.3 Job Description Intelligence

Implemented job-context enhancements:

- Job URL scraping with protections:
  - URL validation
  - Protocol restrictions (HTTP/HTTPS)
  - Internal/private network blocking (SSRF controls)
- Site-specific extraction support (e.g., LinkedIn/Indeed/Glassdoor patterns) plus generic fallbacks.
- AI structuring of extracted job content into normalized job data.
- Non-AI enhancement action to enrich job descriptions with role-specific and generic sections.

### 1.4 AI Resume Analysis

Implemented analysis workflow:

- Full resume analysis action with Zod validation.
- ATS-oriented structured analysis output rendering.
- Rate limiting and timeout protection for AI calls.
- Automatic use of role presets when JD is missing/short.
- Persistence of results to storage/DB.

### 1.5 AI Resume Improvements

Implemented improvement workflow:

- AI resume improvement generation.
- Optional use of prior analysis context.
- Storage of generated improved resume text.
- Improved resume artifact persistence (stored file metadata + object storage linkage).
- Export options from improvement page:
  - DOCX export (server-side action)
  - PDF export (client-side jsPDF rendering)

### 1.6 Resume Q&A and Interview Preparation

Implemented Q&A/interview capabilities:

- Resume Q&A generation by topic and question count.
- Interview quiz generation with:
  - Interview type
  - Difficulty
  - Question count
- AI interview session mode with phases and persistence:
  - Session creation
  - Question persistence
  - Answer persistence
  - Session updates
- Specialized interview tooling:
  - DSA question generation
  - Answer evaluation
  - Code-solution evaluation
  - Follow-up question generation

### 1.7 Cover Letter Generator

Implemented cover-letter capabilities:

- AI cover letter generation from resume + JD context.
- Optional company/hiring-manager personalization.
- Tone controls (`professional`, `enthusiastic`, `confident`, `conversational`).
- Persistence of generated cover letters.

### 1.8 Resume Builder / Create Resume

Implemented resume builder capabilities:

- Multi-step resume editing UI.
- Resume data parsing from uploaded resume text.
- AI fill-from-improvements workflow:
  - Structured data apply path (preferred)
  - Intelligent parse fallback from improved text
- Template selection support.
- PDF export via LaTeX compile service using structured resume data.
- Draft auto-save/restore behavior on builder state.

### 1.9 Resume Library

Implemented resume-library capabilities:

- Resume list with pagination, filter, and search.
- Grid/list views.
- Resume upload from library UI.
- Resume metadata editing.
- Archive/unarchive operations.
- Soft delete and hard delete flows.
- Original/improved/generated file linking + download support.

### 1.10 Billing & Pricing (Razorpay)

Implemented billing capabilities:

- Dynamic price retrieval from admin-configurable settings.
- Pro order creation for Razorpay checkout.
- Payment signature verification and subscription activation.
- Pro status checks and expiry-aware behavior.
- Billing page usage + plan visualization.
- Public pricing page with checkout integration.

---

## 2) Subscription, Limits, and Gating

### 2.1 Tier Model

Implemented tiers:

- `free`
- `pro`

### 2.2 Limit/Gating Logic

Implemented tier-aware controls include:

- Feature access control (`assertFeatureAllowed`).
- Daily AI usage and operation-level rate limiting.
- Export limit enforcement:
  - Free: limited daily exports
  - Pro: unlimited exports
- Subscription-status retrieval for frontend context.

### 2.3 Pro-Only Features (enforced in code)

Implemented Pro gating for:

- Q&A generation
- Interview question/session features

---

## 3) Admin Features

Implemented admin panel modules:

### 3.1 Admin Dashboard

- User stats (total/active/blocked/admin).
- Usage stats and historical charts.
- Subscription stats integration.

### 3.2 User Management

- User listing/search/filter.
- Reset usage.
- Delete user (including bulk flows).
- Upgrade selected users to Pro.

### 3.3 Subscription Management

- View all users with subscription state.
- Upgrade/downgrade/extend Pro access.
- Bulk subscription operations.
- Recent payment visibility and conversion-related metrics.

### 3.4 Transactions

- Razorpay transaction dashboard.
- Transaction detail retrieval.
- Filtering, charting, and export-oriented UI actions.

### 3.5 Settings

- Admin-configurable pricing (live/test).
- Duration and mode controls.
- Toggle test mode.

### 3.6 Logs & API Usage

- Admin action logs with filtering/search.
- API usage analytics views (daily/monthly/total trends).
- Cleanup actions for old usage logs.

### 3.7 Admin APIs

- Admin init endpoint.
- Admin cleanup endpoint with multiple cleanup modes.

---

## 4) Public/Platform APIs and Operational Endpoints

Implemented API groups:

- Auth API (`/api/auth/*`)
- Resume API (`/api/resumes/*`)
- Webhook API (`/api/webhooks/razorpay`)
- Notification queue API (`/api/notifications/send`)
- Rate-limit status API (`/api/rate-limit/status`)
- Health API (`/api/health`)
- Metrics API (`/api/metrics`)

Operational capabilities:

- Health checks for DB/Redis/Storage/LaTeX service.
- Metrics endpoint with runtime + infra status details.

---

## 5) AI Platform Features (Backend)

Implemented AI platform capabilities:

- Multi-provider strategy:
  - Groq primary
  - Gemini fallback
  - OpenRouter tertiary path (in orchestration layer)
- Smart router with feature-based model selection.
- Feature-specific token limits and output token budgeting.
- Retry + fallback behavior.
- Prompt optimization helpers.
- Response cache utilities.
- Request deduplication support.
- Usage tracking hooks.

Implemented AI feature categories in router/actions:

- Resume analysis
- Resume improvement
- Resume QA
- Interview questions
- Interview session generation
- DSA question generation
- Answer/code evaluation
- Follow-up question generation
- Cover letter generation
- Job description structuring
- Intelligent resume parsing

---

## 6) LaTeX Resume Export Service Integration

Implemented app-side integration:

- Compile from structured `resumeData`.
- Compile from raw `resumeText`.
- Template-based export.
- 120s timeout handling + error parsing.
- Export-limit enforcement before compile.

Implemented service-side capabilities (in service repo folder):

- Queue-based compile concurrency control.
- PDF/Latex caching behavior.
- Health/readiness/metrics endpoints.

---

## 7) Security and Access Controls

Implemented security controls include:

- Route protection via middleware (`public`, `protected`, `admin` route classes).
- Security headers in middleware (CSP, frame/content protections).
- Auth cookie checks for protected routes.
- Admin checks for privileged server actions.
- Input validation with Zod on critical APIs/actions.
- URL extraction safeguards against SSRF patterns.

---

## 8) Storage and Data Management

Implemented storage/data capabilities:

- Resume and generated file metadata storage via Prisma models.
- Object storage operations (upload/download/delete + presigned URLs).
- Resume lifecycle operations (create/read/update/archive/delete).
- User profile data persistence.

---

## 9) Implemented vs Placeholder Notes

### Confirmed implemented

- Main web app user flows (dashboard, analysis, improvements, Q&A, interview, cover letter, builder, billing, profile, resume library).
- Full auth API surface with multiple login methods.
- Razorpay purchase + webhook handling.
- Admin suite pages and actions.
- LaTeX export integration.

### Confirmed placeholder / not fully implemented

- `apps/websocket/src/server.ts` is currently a placeholder (logs a message; no real socket server behavior yet).

---

## 10) Quick Feature Checklist

### Core User Workflow

- [x] Upload and parse resume
- [x] Add job context (role/JD/URL)
- [x] Run analysis
- [x] Generate improvements
- [x] Generate Q&A
- [x] Practice interview (quiz + session)
- [x] Generate cover letter
- [x] Build/export polished resume
- [x] Manage saved resumes

### SaaS & Platform

- [x] Auth + sessions + profile
- [x] Tiered subscription model
- [x] Razorpay billing + webhook
- [x] Rate limiting + quotas
- [x] Admin management dashboards
- [x] Health/metrics endpoints
- [x] LaTeX export service integration

---

## 11) Source Areas Used for Verification

Feature inventory in this doc is verified primarily from:

- `src/app/actions.ts`
- `src/app/actions/payment-actions.ts`
- `src/app/actions/admin*.ts`
- `src/app/api/**/route.ts`
- `src/app/**/page.tsx` (user + admin pages)
- `src/ai/*` (router/features)
- `src/lib/types/subscription.ts`
- `middleware.ts`
- `services/resume-latex-service/README.md`

If you want, I can generate a second version as a **feature matrix table** (Feature → Route/Page → API/Action → Tier → Status) for product tracking.