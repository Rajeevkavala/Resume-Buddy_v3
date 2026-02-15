# ResumeBuddy 2.0 — Master Phased Implementation Plan

> **Version:** 1.0  
> **Created:** February 15, 2026  
> **Total Duration:** ~8 months (6 phases)  
> **Team:** 1–2 developers (solo-friendly)  
> **Current State:** Next.js 16 + Firebase Auth + Firestore + 7 AI flows + LaTeX PDF export  
> **Target State:** Self-hosted, 42+ features, multi-tier monetization, enterprise-ready

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Current Baseline](#current-baseline)
- [Phase Overview](#phase-overview)
- [Phase 1 — Stabilize & Harden (Weeks 1–4)](#phase-1--stabilize--harden-weeks-14)
- [Phase 2 — High-Impact AI Features (Weeks 5–8)](#phase-2--high-impact-ai-features-weeks-58)
- [Phase 3 — Export, Builder & UX (Weeks 9–14)](#phase-3--export-builder--ux-weeks-914)
- [Phase 4 — Monetization & Subscriptions (Weeks 15–20)](#phase-4--monetization--subscriptions-weeks-1520)
- [Phase 5 — Infrastructure Migration (Weeks 21–26)](#phase-5--infrastructure-migration-weeks-2126)
- [Phase 6 — Scale, Polish & Launch (Weeks 27–32)](#phase-6--scale-polish--launch-weeks-2732)
- [Dependency Graph](#dependency-graph)
- [Risk Register](#risk-register)
- [Success Metrics](#success-metrics)
- [Appendix: Feature Matrix](#appendix-feature-matrix)

---

## Executive Summary

This plan consolidates all feature, infrastructure, and architecture goals into **6 sequential phases**. Each phase has a clear objective, concrete deliverables, and measurable exit criteria. The ordering prioritizes:

1. **Stability first** — fix what exists, add security, testing
2. **User value next** — ship features users ask for (AI, exports)
3. **Revenue then** — monetization once there's something worth paying for
4. **Infrastructure last** — migrate off Firebase only after features are stable

```
Phase 1 ─ Stabilize & Harden ────────── Weeks 1–4   │ Foundation
Phase 2 ─ High-Impact AI Features ───── Weeks 5–8   │ Core Value
Phase 3 ─ Export, Builder & UX ──────── Weeks 9–14  │ User Experience
Phase 4 ─ Monetization & Subscriptions  Weeks 15–20 │ Revenue
Phase 5 ─ Infrastructure Migration ──── Weeks 21–26 │ Self-Hosted
Phase 6 ─ Scale, Polish & Launch ────── Weeks 27–32 │ Production
```

---

## Current Baseline

### ✅ What's Already Built

| Category | Details |
|----------|---------|
| **AI Flows** | 7 flows — analyze, improve, Q&A, interview, cover letter, parse, structure JD |
| **AI Infrastructure** | Smart router, multi-provider fallback (Groq → Gemini → OpenRouter), response caching |
| **Auth** | Firebase Auth (email/password, Google OAuth), cookie-based session |
| **Database** | Firestore (NoSQL), per-user document storage |
| **Subscriptions** | Free / Pro tiers via Razorpay (one-time payment) |
| **Export** | LaTeX PDF (7 templates: FAANG, Jake, Deedy, Professional, Modern, Minimal, Tech) |
| **Rate Limiting** | Tier-aware (Free: 5 AI/day, 2 exports/day · Pro: 10 AI/day, unlimited exports) |
| **Admin** | Basic admin dashboard with usage analytics |
| **Performance** | LRU caching (1hr TTL), request deduplication, prompt compression, 500+ concurrent user capacity |

### ❌ Current Gaps

| Gap | Impact |
|-----|--------|
| No version control for resumes | Users lose edits |
| No auto-save | Data loss risk |
| No DOCX/HTML export | Limits audience |
| Only 7 AI flows (competitors: 20+) | Feature gap |
| No E2E tests | Regression risk |
| No 2FA / CAPTCHA | Security risk |
| Firebase vendor lock-in | Cost & flexibility |
| No team / collaboration features | Missing B2B revenue |
| No dark mode | UX complaint |
| No job application tracking | Incomplete workflow |

---

## Phase Overview

| Phase | Focus | Duration | Features | Key Metric |
|-------|-------|----------|----------|------------|
| **1** | Stabilize & Harden | 4 weeks | 6 features | Zero regressions, security audit pass |
| **2** | High-Impact AI | 4 weeks | 6 features | +6 AI flows, 80% user satisfaction |
| **3** | Export, Builder & UX | 6 weeks | 8 features | DOCX export, drag-and-drop builder |
| **4** | Monetization | 6 weeks | 7 features | Payment system live, 5% conversion |
| **5** | Infrastructure Migration | 6 weeks | 5 workstreams | Zero Firebase dependencies |
| **6** | Scale, Polish & Launch | 6 weeks | 10 features | Production deployment, 99.9% uptime |

---

## Phase 1 — Stabilize & Harden (Weeks 1–4)

> **Objective:** Make the existing product rock-solid before adding new features.  
> **Theme:** "Fix the foundation before building higher."

### Why This Phase First
Every new feature compounds on a shaky base. Version control, auto-save, and security are non-negotiable for a production SaaS that handles personal career data.

### Week 1–2: Core Stability

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 1.1 | **Resume Version Control & History** | 🔴 Critical | Medium | `src/lib/version-control.ts`, `src/components/version-history-panel.tsx` | 16h |
| | — Save snapshots on every significant edit | | | | |
| | — View/restore any previous version | | | | |
| | — Diff view (added/removed content) | | | | |
| | — Max 50 versions per resume (auto-prune) | | | | |
| 1.2 | **Smart Auto-Save & Conflict Resolution** | 🔴 Critical | Medium | `src/hooks/use-auto-save.ts`, `src/lib/conflict-resolver.ts` | 12h |
| | — Debounced auto-save (3s idle) | | | | |
| | — Conflict detection for multi-tab editing | | | | |
| | — Visual save indicator in UI | | | | |
| | — Offline queue with sync-on-reconnect | | | | |

### Week 3–4: Security & Infrastructure

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 1.3 | **IP-Based Rate Limiting** | 🔴 Critical | Low | `src/lib/ip-rate-limiter.ts`, update `middleware.ts` | 8h |
| | — 100 requests/hour/IP (configurable) | | | | |
| | — LRU cache for IP tracking | | | | |
| | — 429 response with `Retry-After` header | | | | |
| | — Whitelist for known IPs (admin) | | | | |
| 1.4 | **Security Enhancements (CAPTCHA + 2FA + CSP)** | 🟠 High | Medium | `src/lib/security.ts`, `src/lib/turnstile.ts`, `src/components/two-factor-setup.tsx` | 20h |
| | — Cloudflare Turnstile on signup/login | | | | |
| | — TOTP 2FA via authenticator app (QR code setup) | | | | |
| | — Active session management + remote logout | | | | |
| | — CSRF token protection | | | | |
| | — Content Security Policy headers | | | | |
| 1.5 | **Error Monitoring & Logging** | 🟠 High | Low | `src/lib/error-tracking.ts` | 6h |
| | — Sentry integration for error tracking | | | | |
| | — Structured server-side logging | | | | |
| | — Client-side error boundaries with reporting | | | | |
| 1.6 | **E2E Testing Foundation** | 🟡 Medium | Medium | `e2e/`, `playwright.config.ts` | 16h |
| | — Playwright setup with CI integration | | | | |
| | — Auth flow tests (register → login → logout) | | | | |
| | — Resume upload + analysis happy path | | | | |
| | — Export flow test | | | | |
| | — Subscription upgrade flow test | | | | |

### Phase 1 Deliverables

```
src/lib/version-control.ts          # Resume version snapshots
src/hooks/use-auto-save.ts          # Debounced auto-save hook
src/lib/conflict-resolver.ts        # Multi-tab conflict detection
src/lib/ip-rate-limiter.ts          # IP-based rate limiting
src/lib/security.ts                 # CSRF, CSP, session management
src/lib/turnstile.ts                # Cloudflare Turnstile CAPTCHA
src/lib/error-tracking.ts           # Sentry + structured logging
src/components/version-history-panel.tsx
src/components/two-factor-setup.tsx
e2e/                                # Playwright test suite
playwright.config.ts
```

### Phase 1 Exit Criteria

- [ ] Resume versions saved and restorable (diff view working)
- [ ] Auto-save triggers within 3s of idle, visual indicator shown
- [ ] IP rate limiting active on all API routes
- [ ] Cloudflare Turnstile on signup/login forms
- [ ] 2FA setup flow functional (QR → verify → enable)
- [ ] CSP headers present on all responses
- [ ] Sentry capturing errors in dev environment
- [ ] 10+ E2E tests passing in CI
- [ ] Zero known security vulnerabilities

---

## Phase 2 — High-Impact AI Features (Weeks 5–8)

> **Objective:** Add the AI features users request most — career gaps, smart tailoring, keywords.  
> **Theme:** "Make the AI 3× more useful."

### Why This Phase Second
AI features are the core product differentiator. These 6 new flows nearly double the AI capability and directly address the top user requests.

### Week 5–6: Career Intelligence

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 2.1 | **Career Gap Analysis & Path Suggestions** | 🔴 Critical | Medium | `src/ai/flows/analyze-career-gap.ts`, `src/components/career-gap-tab.tsx` | 16h |
| | — Skill gap identification with severity levels | | | | |
| | — Timeline to role-readiness estimation | | | | |
| | — Course/certification recommendations | | | | |
| | — Salary progression predictions | | | | |
| | — Free: basic gaps · Pro: full analysis + resources | | | | |
| 2.2 | **Smart Resume Tailoring Engine** | 🔴 Critical | High | `src/ai/flows/tailor-resume.ts`, `src/components/tailor-resume-panel.tsx` | 20h |
| | — One-click tailor resume to specific JD | | | | |
| | — Reorders sections, highlights matching skills | | | | |
| | — Custom summary generation | | | | |
| | — 3 aggressiveness levels (conservative / moderate / aggressive) | | | | |
| | — Before vs. after match score | | | | |
| 2.3 | **Real-Time Keyword Optimizer** | 🟠 High | Low | `src/hooks/use-keyword-suggestions.ts`, `src/components/keyword-optimizer-panel.tsx` | 10h |
| | — Live keyword density tracking (1s debounce) | | | | |
| | — ATS-friendly synonym suggestions | | | | |
| | — Missing critical keywords highlighted | | | | |
| | — Click-to-insert functionality | | | | |

### Week 7–8: Advanced AI Capabilities

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 2.4 | **Resume Translation & Localization** | 🟠 High | High | `src/ai/flows/translate-resume.ts`, `src/components/translation-panel.tsx` | 18h |
| | — Translate to 10+ languages | | | | |
| | — Cultural format adaptation (US / EU / Asia / LatAm) | | | | |
| | — Date, phone, address format conversion | | | | |
| | — Industry terminology mapping | | | | |
| 2.5 | **Resume Readability & Accessibility Checker** | 🟡 Medium | Low | `src/ai/flows/check-readability.ts`, `src/components/readability-panel.tsx` | 8h |
| | — Flesch-Kincaid readability score | | | | |
| | — Sentence complexity analysis | | | | |
| | — ADA accessibility recommendations | | | | |
| | — Plain language suggestions | | | | |
| 2.6 | **Portfolio/Project Recommendations** | 🟡 Medium | Medium | `src/ai/flows/recommend-projects.ts`, `src/components/project-recommendations-tab.tsx` | 12h |
| | — Suggest projects to strengthen resume for target role | | | | |
| | — Tech stack recommendations per project | | | | |
| | — Estimated completion time | | | | |
| | — Step-by-step implementation guides | | | | |

### AI Integration Checklist (per flow)

For each new AI flow, complete ALL of these:

```
□ Create AI flow file in src/ai/flows/
□ Define Zod input/output schemas
□ Register feature in smart-router.ts (AIFeature type, FEATURE_MODEL_ROUTING, FEATURE_TOKEN_LIMITS, FEATURE_OUTPUT_TOKENS)
□ Add server action in src/app/actions.ts (with rate limiting + Zod validation)
□ Configure rate limit in src/lib/rate-limiter.ts
□ Set tier access in src/lib/types/subscription.ts
□ Build UI component
□ Add route/tab in app directory
□ Write E2E test
```

### Phase 2 Deliverables

```
src/ai/flows/
├── analyze-career-gap.ts        # Career gap analysis
├── tailor-resume.ts             # Smart resume tailoring
├── translate-resume.ts          # Translation & localization
├── check-readability.ts         # Readability checker
└── recommend-projects.ts        # Project recommendations

src/components/
├── career-gap-tab.tsx
├── tailor-resume-panel.tsx
├── keyword-optimizer-panel.tsx
├── translation-panel.tsx
├── readability-panel.tsx
└── project-recommendations-tab.tsx

src/hooks/
└── use-keyword-suggestions.ts   # Real-time keyword hook
```

### Phase 2 Exit Criteria

- [ ] 12 total AI flows operational (7 existing + 5 new)
- [ ] Real-time keyword optimizer running with < 200ms feedback
- [ ] Smart tailoring producing before/after match scores
- [ ] Career gap analysis generating actionable roadmaps
- [ ] Translation working for 10+ languages
- [ ] All new flows registered in smart router with proper model routing
- [ ] Rate limits configured for all new features
- [ ] Free/Pro tier gating enforced on new premium features

---

## Phase 3 — Export, Builder & UX (Weeks 9–14)

> **Objective:** Expand output formats, add visual resume builder, polish UX.  
> **Theme:** "Let users create, not just analyze."

### Why This Phase Third
Users need more ways to act on AI insights. DOCX export, a visual builder, and UX improvements turn analysis into action.

### Week 9–10: Export Expansion

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 3.1 | **DOCX Export** | 🔴 Critical | Medium | `src/lib/docx-generator.ts`, update `actions.ts` | 16h |
| | — Generate Word documents from resume data | | | | |
| | — Support all 7 template styles | | | | |
| | — Maintain formatting (headers, bullets, sections) | | | | |
| | — Library: `docx` (npm) | | | | |
| 3.2 | **HTML/Web Resume Export** | 🟠 High | Medium | `src/lib/html-generator.ts`, `src/app/resume/[id]/page.tsx` | 14h |
| | — Generate shareable web resume URL | | | | |
| | — Responsive HTML with print-friendly CSS | | | | |
| | — Custom subdomain or `/resume/[id]` path | | | | |
| | — OG meta tags for social sharing preview | | | | |
| 3.3 | **Batch Export** | 🟡 Medium | Low | `src/lib/batch-exporter.ts` | 8h |
| | — Export multiple resume versions at once | | | | |
| | — ZIP download with all formats | | | | |
| | — Progress indicator for long operations | | | | |

### Week 11–12: Visual Resume Builder

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 3.4 | **Drag-and-Drop Resume Builder** | 🟠 High | High | `src/components/resume-builder/`, `src/hooks/use-resume-builder.ts` | 30h |
| | — Visual section reordering (DnD) | | | | |
| | — Inline editing with formatting toolbar | | | | |
| | — Add/remove/reorder bullet points | | | | |
| | — Section templates (experience, education, skills, projects, etc.) | | | | |
| | — Real-time preview pane | | | | |
| | — Library: `@dnd-kit/core` | | | | |
| 3.5 | **Custom LaTeX Template Editor** | 🟠 High | High | `src/components/template-editor.tsx`, `src/lib/template-engine.ts` | 20h |
| | — Visual template customization (fonts, colors, spacing) | | | | |
| | — Live preview of changes | | | | |
| | — Save custom templates to user profile | | | | |
| | — Share templates (public gallery) | | | | |

### Week 13–14: UX & Quality of Life

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 3.6 | **Dark Mode & Theme Customization** | 🟡 Medium | Low | Update `globals.css`, `src/lib/theme-provider.tsx` | 10h |
| | — System/light/dark mode toggle | | | | |
| | — CSS custom properties for all colors | | | | |
| | — Persist preference in localStorage | | | | |
| 3.7 | **Keyboard Shortcuts & Power User Features** | 🟠 High | Low | `src/hooks/use-keyboard-shortcuts.ts`, `src/components/shortcuts-dialog.tsx` | 8h |
| | — Global shortcuts (Ctrl+S save, Ctrl+E export, Ctrl+K command palette) | | | | |
| | — Shortcut discovery dialog (`?` key) | | | | |
| | — Configurable keybindings | | | | |
| 3.8 | **Smart Search & Command Palette** | 🟡 Medium | Medium | `src/components/command-palette.tsx` | 12h |
| | — Spotlight-style command palette (Ctrl+K) | | | | |
| | — Search across resumes, analyses, features | | | | |
| | — Quick actions (new resume, run analysis, export) | | | | |
| | — Library: `cmdk` | | | | |

### Phase 3 Deliverables

```
src/lib/
├── docx-generator.ts            # DOCX export engine
├── html-generator.ts            # HTML resume generation
├── batch-exporter.ts            # Multi-format batch export
├── template-engine.ts           # Custom template system
└── theme-provider.tsx           # Dark mode + themes

src/components/
├── resume-builder/              # Drag-and-drop builder (folder)
│   ├── builder-canvas.tsx
│   ├── section-block.tsx
│   ├── formatting-toolbar.tsx
│   └── preview-pane.tsx
├── template-editor.tsx
├── command-palette.tsx
└── shortcuts-dialog.tsx

src/app/resume/[id]/page.tsx     # Public web resume route
```

### Phase 3 Exit Criteria

- [ ] DOCX export producing valid Word documents for all 7 templates
- [ ] HTML resume accessible via public URL with OG tags
- [ ] Batch export generates ZIP with selected formats
- [ ] Drag-and-drop builder supports reordering all section types
- [ ] Template editor saves custom templates to Firestore
- [ ] Dark mode toggle working, persistent across sessions
- [ ] Command palette opens with Ctrl+K, searches features/resumes
- [ ] All keyboard shortcuts documented in help dialog

---

## Phase 4 — Monetization & Subscriptions (Weeks 15–20)

> **Objective:** Build revenue infrastructure — credits, teams, plans, referrals.  
> **Theme:** "Turn value into revenue."

### Why This Phase Fourth
Features from Phases 2–3 give users a reason to pay. Now build the billing and collaboration infrastructure to capture that value.

### Week 15–16: Subscription Expansion

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 4.1 | **Team Plans & Workspace Collaboration** | 🔴 Critical | High | `src/lib/team-service.ts`, `src/app/team/`, `src/components/team-management.tsx` | 30h |
| | — Create teams with owner/admin/member roles | | | | |
| | — Shared resume workspace per team | | | | |
| | — Real-time collaboration (view, not edit) | | | | |
| | — Team-level usage analytics | | | | |
| | — Invite via email link | | | | |
| | — Per-seat pricing model | | | | |
| 4.2 | **Annual Plans with Discount** | 🟠 High | Low | Update `src/lib/types/subscription.ts`, Razorpay config | 8h |
| | — Annual billing option (20% discount) | | | | |
| | — Plan comparison UI | | | | |
| | — Upgrade/downgrade flow | | | | |
| | — Prorated billing | | | | |
| 4.3 | **Pay-Per-Use Credits System** | 🟠 High | Medium | `src/lib/credits-service.ts`, `src/components/credits-balance.tsx` | 16h |
| | — Buy credit packs (₹49 for 10 credits, ₹99 for 25, ₹199 for 60) | | | | |
| | — Credits consumed per AI operation | | | | |
| | — Balance display in header | | | | |
| | — Low-balance warning (< 3 credits) | | | | |
| | — Auto-refill option | | | | |

### Week 17–18: Growth Features

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 4.4 | **Referral Program & Affiliate Marketing** | 🟡 Medium | Medium | `src/lib/referral-service.ts`, `src/app/referrals/page.tsx` | 14h |
| | — Unique referral links per user | | | | |
| | — Reward: 3 free credits per successful referral | | | | |
| | — Referral dashboard (clicks, signups, conversions) | | | | |
| | — Social sharing buttons | | | | |
| 4.5 | **Resume Templates Marketplace** | 🟠 High | Medium | `src/app/templates/page.tsx`, `src/lib/template-store.ts` | 18h |
| | — Browse community templates | | | | |
| | — Premium templates (paid) | | | | |
| | — Template preview with sample data | | | | |
| | — One-click apply template to resume | | | | |
| | — Creator attribution | | | | |
| 4.6 | **Student & Non-Profit Discounts** | 🟢 Low | Low | Update subscription types, add verification flow | 6h |
| | — 50% discount with .edu email verification | | | | |
| | — Non-profit verification via manual review | | | | |

### Week 19–20: Analytics & Tracking

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 4.7 | **Resume Performance Dashboard** | 🔴 Critical | Medium | `src/components/performance-dashboard.tsx`, `src/lib/analytics-service.ts` | 20h |
| | — Score trends over time (line chart) | | | | |
| | — Feature usage heatmap | | | | |
| | — Improvement velocity tracking | | | | |
| | — Export analytics | | | | |
| | — Comparison with platform averages | | | | |

### Phase 4 Deliverables

```
src/lib/
├── team-service.ts              # Team CRUD, invites, roles
├── credits-service.ts           # Credits purchase, balance, consumption
├── referral-service.ts          # Referral links, tracking, rewards
├── template-store.ts            # Template marketplace logic
└── analytics-service.ts         # Performance tracking & charting

src/app/
├── team/                        # Team management pages
├── referrals/page.tsx           # Referral dashboard
└── templates/page.tsx           # Template marketplace

src/components/
├── team-management.tsx
├── credits-balance.tsx
├── performance-dashboard.tsx
└── plan-comparison.tsx
```

### Phase 4 Exit Criteria

- [ ] Team creation + invite + role management working
- [ ] Annual plan purchasable through Razorpay
- [ ] Credit packs available for purchase, balance displayed in UI
- [ ] Referral links generating and tracking conversions
- [ ] Template marketplace browsable with preview
- [ ] Performance dashboard charting score trends
- [ ] Revenue flowing through both subscription and credits channels

---

## Phase 5 — Infrastructure Migration (Weeks 21–26)

> **Objective:** Replace Firebase with self-hosted infrastructure (PostgreSQL, Redis, custom auth, MinIO).  
> **Theme:** "Own your stack."

### Why This Phase Fifth
The product is feature-complete and generating revenue. Now remove the vendor lock-in and reduce operational costs. This is high-risk work best done when the product is stable.

### Week 21–22: Infrastructure Setup & Custom Auth

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 5.1 | **Docker Infrastructure** | 🔴 Critical | Medium | `infrastructure/docker/`, `docker-compose.yml` | 12h |
| | — PostgreSQL 16 container | | | | |
| | — Redis 7 with persistence | | | | |
| | — MinIO (S3-compatible storage) | | | | |
| | — Traefik reverse proxy with SSL | | | | |
| | — One-command `docker-compose up` setup | | | | |
| 5.2 | **Custom Authentication System** | 🔴 Critical | High | `packages/auth/` (jwt, sessions, bcrypt, OAuth) | 24h |
| | — JWT access tokens (15min) + refresh tokens (7d) | | | | |
| | — Redis session management | | | | |
| | — bcrypt password hashing (12 rounds) | | | | |
| | — Google OAuth flow rebuild | | | | |
| | — Auth API routes (`/api/auth/login`, `register`, `logout`, `refresh`) | | | | |
| | — Rewrite `AuthContext` for custom tokens | | | | |
| | — Update `middleware.ts` for JWT verification | | | | |

### Week 23–24: Database Migration

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 5.3 | **PostgreSQL Schema & ORM** | 🔴 Critical | High | `packages/database/`, Prisma schema | 20h |
| | — Complete Prisma schema (User, Subscription, Analysis, Resume, etc.) | | | | |
| | — Initial migration + seed data | | | | |
| | — Type-safe Prisma client exports | | | | |
| | — Indexes on all query-heavy columns | | | | |
| 5.4 | **Firestore → PostgreSQL Data Migration** | 🔴 Critical | High | `scripts/migrate-firebase.ts` | 16h |
| | — Export all Firestore collections | | | | |
| | — Transform NoSQL documents to relational rows | | | | |
| | — Migrate users, subscriptions, analyses, resumes | | | | |
| | — Data integrity verification | | | | |
| | — Rollback script if migration fails | | | | |

### Week 25–26: Storage & Service Rewrites

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 5.5 | **MinIO File Storage** | 🟠 High | Medium | `packages/storage/`, presigned URL service | 14h |
| | — MinIO bucket configuration | | | | |
| | — Resume file uploads (PDF, DOCX) | | | | |
| | — Generated PDF auto-storage | | | | |
| | — Presigned URL generation (7d expiry) | | | | |
| | — Content-hash deduplication | | | | |
| 5.6 | **Redis Caching Layer** | 🟠 High | Medium | `packages/cache/` | 12h |
| | — Replace in-memory LRU with Redis | | | | |
| | — Session storage (replaces cookie-only approach) | | | | |
| | — Rate limiter backing store (distributed) | | | | |
| | — AI response caching (same TTL policy) | | | | |
| 5.7 | **Rewrite All Database Calls** | 🔴 Critical | High | Update `actions.ts`, `subscription-service.ts`, `firestore.ts` → delete | 20h |
| | — Replace all `firestore.ts` calls with Prisma queries | | | | |
| | — Update `subscription-service.ts` for PostgreSQL | | | | |
| | — Update `rate-limiter.ts` for Redis backing | | | | |
| | — Update all server actions in `actions.ts` | | | | |
| | — Delete `src/lib/firebase.ts` and `src/lib/firestore.ts` | | | | |

### Phase 5 Deliverables

```
infrastructure/
├── docker/
│   ├── docker-compose.yml          # Dev environment
│   └── docker-compose.prod.yml     # Production
├── scripts/
│   └── setup.sh                    # One-command setup
└── .env.template

packages/
├── auth/                           # Custom JWT auth
│   └── src/ (jwt.ts, session.ts, password.ts, oauth/)
├── database/                       # Prisma + PostgreSQL
│   └── prisma/schema.prisma
├── storage/                        # MinIO integration
└── cache/                          # Redis caching

scripts/
└── migrate-firebase.ts             # Firestore → PostgreSQL migration

DELETED:
├── src/lib/firebase.ts
└── src/lib/firestore.ts
```

### Phase 5 Exit Criteria

- [ ] `docker-compose up` starts entire self-hosted stack
- [ ] User registration/login working with custom JWT (no Firebase SDK)
- [ ] All data in PostgreSQL, verified integrity
- [ ] File uploads stored in MinIO with presigned URLs
- [ ] Rate limiting backed by Redis (distributed-ready)
- [ ] AI response caching in Redis (same 1hr TTL)
- [ ] Zero Firebase SDK imports in codebase
- [ ] All E2E tests passing against new infrastructure
- [ ] Rollback to Firebase possible within 1 hour if needed

---

## Phase 6 — Scale, Polish & Launch (Weeks 27–32)

> **Objective:** Add remaining features, optimize performance, and prepare for production launch.  
> **Theme:** "Ship it."

### Week 27–28: Advanced Features

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 6.1 | **LinkedIn Profile Optimizer** | 🟡 Medium | Medium | `src/ai/flows/optimize-linkedin.ts`, `src/components/linkedin-optimizer-tab.tsx` | 14h |
| 6.2 | **Video Resume Script Generator** | 🟡 Medium | High | `src/ai/flows/generate-video-script.ts`, `src/components/video-script-tab.tsx` | 14h |
| 6.3 | **Multi-Resume Comparison & Benchmarking** | 🟠 High | Medium | `src/ai/flows/compare-resumes.ts`, `src/app/compare/page.tsx` | 16h |
| 6.4 | **A/B Testing for Resume Versions** | 🟠 High | Medium | `src/lib/ab-testing.ts`, `src/components/ab-test-dashboard.tsx` | 14h |

### Week 29–30: Collaboration & Tracking

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 6.5 | **Job Application Tracking** | 🟡 Medium | High | `src/app/jobs/`, `src/lib/job-tracker.ts` | 20h |
| | — Add job applications (company, role, status, date) | | | | |
| | — Kanban board (Applied → Screening → Interview → Offer → Rejected) | | | | |
| | — Link resume version to each application | | | | |
| | — Reminder notifications | | | | |
| 6.6 | **Resume Sharing & Peer Review** | 🟡 Medium | Medium | `src/app/share/`, `src/components/peer-review.tsx` | 16h |
| | — Generate shareable review links | | | | |
| | — Inline commenting on resume sections | | | | |
| | — Anonymous feedback option | | | | |
| 6.7 | **QR Code Integration** | 🟢 Low | Low | `src/lib/qr-generator.ts` | 4h |

### Week 31–32: Polish & Production

| # | Task | Priority | Complexity | New Files | Est. Hours |
|---|------|----------|-----------|-----------|-----------|
| 6.8 | **Enhanced Admin Dashboard** | 🔴 Critical | Medium | Update `src/app/admin/` | 16h |
| | — Real-time user activity feed | | | | |
| | — Revenue analytics (MRR, churn, LTV) | | | | |
| | — Feature usage heatmap | | | | |
| | — System health monitoring | | | | |
| | — User management (ban, tier override, impersonate) | | | | |
| 6.9 | **Onboarding Tutorial & Interactive Guide** | 🟢 Low | Low | `src/components/onboarding-wizard.tsx` | 8h |
| | — Step-by-step first-use wizard | | | | |
| | — Feature discovery tooltips | | | | |
| | — Sample resume for instant demo | | | | |
| 6.10 | **PWA Enhancement** | 🟠 High | High | Update `sw.js`, `manifest.ts` | 12h |
| | — Offline resume viewing | | | | |
| | — Push notifications for job tracker reminders | | | | |
| | — Install prompt for mobile | | | | |
| 6.11 | **Performance Optimization & Load Testing** | 🔴 Critical | Medium | `scripts/load-test.ts` | 12h |
| | — Lighthouse audit (target: 95+) | | | | |
| | — Bundle size analysis & tree-shaking | | | | |
| | — Database query optimization | | | | |
| | — Load test: 500 concurrent users | | | | |
| 6.12 | **Production Deployment** | 🔴 Critical | Medium | `docker-compose.prod.yml`, CI/CD pipeline | 16h |
| | — Production Docker build | | | | |
| | — SSL certificates (Let's Encrypt) | | | | |
| | — Database backup automation (daily) | | | | |
| | — Monitoring & alerting (uptime, errors, latency) | | | | |
| | — DNS configuration | | | | |
| | — Final smoke test suite | | | | |

### Phase 6 Exit Criteria

- [ ] 17+ total AI flows operational
- [ ] Job tracker with Kanban board live
- [ ] Resume sharing links with comments working
- [ ] Admin dashboard showing revenue + usage analytics
- [ ] Onboarding wizard guiding new users
- [ ] PWA installable on mobile
- [ ] Lighthouse score ≥ 95
- [ ] Load test passing at 500 concurrent users
- [ ] Production deployed with HTTPS, monitoring, and backups
- [ ] All 42 features implemented or explicitly deferred with rationale

---

## Dependency Graph

```
Phase 1 (Stabilize)
  │
  ├──→ Phase 2 (AI Features)
  │      │
  │      ├──→ Phase 3 (Export & UX)
  │      │      │
  │      │      ├──→ Phase 4 (Monetization)
  │      │      │      │
  │      │      │      └──→ Phase 5 (Infrastructure Migration)
  │      │      │             │
  │      │      │             └──→ Phase 6 (Scale & Launch)
  │      │      │
  │      │      └── [3.4 Builder depends on 1.1 Version Control]
  │      │
  │      └── [2.6 Project Recs enhanced by 2.1 Career Gap]
  │
  └── [1.6 E2E Tests used to validate all subsequent phases]

Cross-Phase Dependencies:
  • Phase 3.1 (DOCX Export) → enables Phase 3.3 (Batch Export)
  • Phase 4.1 (Teams) → requires Phase 5.3 (PostgreSQL) for full implementation
  • Phase 4.5 (Template Marketplace) → enhanced by Phase 3.5 (Template Editor)
  • Phase 5.2 (Custom Auth) → blocks Phase 5.4 (Data Migration)
  • Phase 6.4 (A/B Testing) → requires Phase 1.1 (Version Control)
```

---

## Risk Register

| Risk | Phase | Probability | Impact | Mitigation |
|------|-------|-------------|--------|------------|
| Firebase migration causes data loss | 5 | Medium | 🔴 Critical | Run migration on copy first; keep Firebase read-only for 2 weeks |
| Custom auth has security vulnerabilities | 5 | Medium | 🔴 Critical | Security audit before switching; use well-tested JWT libraries |
| AI API rate limits exceeded | 2 | Medium | 🟠 High | Multi-provider fallback already in place; add OpenRouter capacity |
| DOCX formatting inconsistencies | 3 | High | 🟡 Medium | Extensive template testing; fallback to simpler formatting |
| Team features require complex permissions | 4 | Medium | 🟠 High | Start with simple owner/member roles; iterate |
| Scope creep delays phases | All | High | 🟠 High | Strict phase exit criteria; defer non-critical items |
| Solo developer burnout | All | Medium | 🟠 High | 2-week buffer between phases; realistic hour estimates |

### Fallback Plans

| Scenario | Fallback |
|----------|----------|
| Phase 5 migration fails | Stay on Firebase; optimize Firestore costs instead |
| Team features too complex | Ship as Pro feature with simple sharing only |
| DOCX quality insufficient | Focus on HTML export; defer DOCX to later |
| Credit system complicated | Stick with flat subscription tiers |
| MinIO too complex for solo dev | Use Cloudflare R2 (S3-compatible, simpler) |

---

## Success Metrics

### Per-Phase KPIs

| Phase | Key Metric | Target |
|-------|-----------|--------|
| 1 | E2E test coverage | 80%+ of critical paths |
| 2 | New AI flow adoption | 40% of active users try within 1 week |
| 3 | Export diversity | 50% of exports use non-LaTeX format |
| 4 | Conversion rate (Free → Paid) | ≥ 5% |
| 5 | Firebase dependency count | 0 |
| 6 | Production uptime | ≥ 99.9% |

### Overall Success Metrics

| Category | Metric | Target |
|----------|--------|--------|
| **Users** | DAU/MAU ratio | 40%+ |
| **Users** | 30-day retention | 60%+ |
| **Revenue** | MRR growth | 20% month-over-month |
| **Revenue** | Churn rate | < 5% monthly |
| **Product** | Time to first value | < 5 minutes |
| **Product** | Feature adoption (Pro) | 80% using 3+ features |
| **Performance** | Lighthouse score | 95+ |
| **Performance** | API P95 latency | < 2 seconds |
| **Performance** | Cache hit rate | 60%+ |
| **Reliability** | Uptime | 99.9% |

---

## Appendix: Feature Matrix

| # | Feature | Phase | Priority | Complexity | Tier |
|---|---------|-------|----------|------------|------|
| 1 | Resume Version Control | 1 | 🔴 Critical | Medium | Free/Pro |
| 2 | Smart Auto-Save | 1 | 🔴 Critical | Medium | All |
| 3 | IP-Based Rate Limiting | 1 | 🔴 Critical | Low | Infra |
| 4 | Security (CAPTCHA, 2FA, CSP) | 1 | 🟠 High | Medium | Infra |
| 5 | Error Monitoring | 1 | 🟠 High | Low | Infra |
| 6 | E2E Testing Foundation | 1 | 🟡 Medium | Medium | Infra |
| 7 | Career Gap Analysis | 2 | 🔴 Critical | Medium | Free/Pro |
| 8 | Smart Resume Tailoring | 2 | 🔴 Critical | High | Pro |
| 9 | Real-Time Keyword Optimizer | 2 | 🟠 High | Low | Free/Pro |
| 10 | Resume Translation | 2 | 🟠 High | High | Pro |
| 11 | Readability Checker | 2 | 🟡 Medium | Low | Free |
| 12 | Project Recommendations | 2 | 🟡 Medium | Medium | Pro |
| 13 | DOCX Export | 3 | 🔴 Critical | Medium | Free/Pro |
| 14 | HTML/Web Resume | 3 | 🟠 High | Medium | Pro |
| 15 | Batch Export | 3 | 🟡 Medium | Low | Pro |
| 16 | Drag-and-Drop Builder | 3 | 🟠 High | High | All |
| 17 | LaTeX Template Editor | 3 | 🟠 High | High | Pro |
| 18 | Dark Mode & Themes | 3 | 🟡 Medium | Low | All |
| 19 | Keyboard Shortcuts | 3 | 🟠 High | Low | All |
| 20 | Command Palette | 3 | 🟡 Medium | Medium | All |
| 21 | Team Plans | 4 | 🔴 Critical | High | Team |
| 22 | Annual Plans | 4 | 🟠 High | Low | Pro |
| 23 | Pay-Per-Use Credits | 4 | 🟠 High | Medium | All |
| 24 | Referral Program | 4 | 🟡 Medium | Medium | All |
| 25 | Template Marketplace | 4 | 🟠 High | Medium | Free/Pro |
| 26 | Student Discounts | 4 | 🟢 Low | Low | Pro |
| 27 | Performance Dashboard | 4 | 🔴 Critical | Medium | Free/Pro |
| 28 | LinkedIn Optimizer | 6 | 🟡 Medium | Medium | Pro |
| 29 | Video Script Generator | 6 | 🟡 Medium | High | Pro |
| 30 | Resume Comparison | 6 | 🟠 High | Medium | Pro |
| 31 | A/B Testing | 6 | 🟠 High | Medium | Pro |
| 32 | Job Application Tracker | 6 | 🟡 Medium | High | Free/Pro |
| 33 | Resume Sharing & Peer Review | 6 | 🟡 Medium | Medium | Free/Pro |
| 34 | QR Code Integration | 6 | 🟢 Low | Low | All |
| 35 | Enhanced Admin Dashboard | 6 | 🔴 Critical | Medium | Admin |
| 36 | Onboarding Tutorial | 6 | 🟢 Low | Low | All |
| 37 | PWA Enhancement | 6 | 🟠 High | High | All |
| 38 | Performance Optimization | 6 | 🔴 Critical | Medium | Infra |
| 39 | Production Deployment | 6 | 🔴 Critical | Medium | Infra |
| 40 | Docker Infrastructure | 5 | 🔴 Critical | Medium | Infra |
| 41 | Custom Auth System | 5 | 🔴 Critical | High | Infra |
| 42 | PostgreSQL Migration | 5 | 🔴 Critical | High | Infra |

---

## Quick Reference: Estimated Hours

| Phase | Estimated Hours | Calendar Weeks |
|-------|----------------|----------------|
| Phase 1 — Stabilize & Harden | ~78h | 4 weeks |
| Phase 2 — High-Impact AI | ~84h | 4 weeks |
| Phase 3 — Export, Builder & UX | ~118h | 6 weeks |
| Phase 4 — Monetization | ~112h | 6 weeks |
| Phase 5 — Infrastructure Migration | ~118h | 6 weeks |
| Phase 6 — Scale, Polish & Launch | ~162h | 6 weeks |
| **Total** | **~672h** | **32 weeks** |

> **Note:** Estimates assume 20 productive hours/week for a solo developer. With 2 developers, timeline can compress to ~20 weeks by parallelizing independent workstreams within each phase.

---

*This is a living document. Update phase statuses and exit criteria checkboxes as work progresses.*
