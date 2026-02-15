# ResumeBuddy 2.0 - Feature Implementation Plan

> **Last Updated:** February 2026
> **Total Features:** 42 (across 7 categories)
> **Estimated Timeline:** 8 months (4 phases)
> **Priority Legend:** :red_circle: Critical | :orange_circle: High | :yellow_circle: Medium | :green_circle: Low

---

## Table of Contents

- [Current Features (v1)](#current-features-v1)
- [Feature 1 — Career Gap Analysis & Path Suggestions](#feature-1--career-gap-analysis--path-suggestions)
- [Feature 2 — Real-Time Keyword Optimizer](#feature-2--real-time-keyword-optimizer)
- [Feature 3 — Multi-Resume Comparison & Benchmarking](#feature-3--multi-resume-comparison--benchmarking)
- [Feature 4 — Smart Resume Tailoring Engine](#feature-4--smart-resume-tailoring-engine)
- [Feature 5 — Resume Translation & Localization](#feature-5--resume-translation--localization)
- [Feature 6 — LinkedIn Profile Optimizer](#feature-6--linkedin-profile-optimizer)
- [Feature 7 — Video Resume Script Generator](#feature-7--video-resume-script-generator)
- [Feature 8 — Salary Negotiation Insights](#feature-8--salary-negotiation-insights)
- [Feature 9 — Portfolio/Project Recommendations](#feature-9--portfolioproject-recommendations)
- [Feature 10 — Resume Readability & Accessibility Checker](#feature-10--resume-readability--accessibility-checker)
- [Feature 11 — Resume Version Control & History](#feature-11--resume-version-control--history)
- [Feature 12 — Smart Auto-Save & Conflict Resolution](#feature-12--smart-auto-save--conflict-resolution)
- [Feature 13 — Drag-and-Drop Resume Builder](#feature-13--drag-and-drop-resume-builder)
- [Feature 14 — Resume Templates Marketplace](#feature-14--resume-templates-marketplace)
- [Feature 15 — Dark Mode & Theme Customization](#feature-15--dark-mode--theme-customization)
- [Feature 16 — Progressive Web App (PWA)](#feature-16--progressive-web-app-pwa)
- [Feature 17 — Keyboard Shortcuts & Power User Features](#feature-17--keyboard-shortcuts--power-user-features)
- [Feature 18 — Smart Search & Command Palette](#feature-18--smart-search--command-palette)
- [Feature 19 — Onboarding Tutorial & Interactive Guide](#feature-19--onboarding-tutorial--interactive-guide)
- [Feature 20 — Team Plans & Workspace Collaboration](#feature-20--team-plans--workspace-collaboration)
- [Feature 21 — Pay-Per-Use Credits System](#feature-21--pay-per-use-credits-system)
- [Feature 22 — Referral Program & Affiliate Marketing](#feature-22--referral-program--affiliate-marketing)
- [Feature 23 — Annual Plans with Discount](#feature-23--annual-plans-with-discount)
- [Feature 24 — Student & Non-Profit Discounts](#feature-24--student--non-profit-discounts)
- [Feature 25 — Premium Resume Reviews by Experts](#feature-25--premium-resume-reviews-by-experts)
- [Feature 26 — White-Label Solution for Career Services](#feature-26--white-label-solution-for-career-services)
- [Feature 27 — Job Application Tracking](#feature-27--job-application-tracking)
- [Feature 28 — DOCX Export](#feature-28--docx-export)
- [Feature 29 — HTML/Web Resume Export](#feature-29--htmlweb-resume-export)
- [Feature 30 — Custom LaTeX Template Editor](#feature-30--custom-latex-template-editor)
- [Feature 31 — Batch Export](#feature-31--batch-export)
- [Feature 32 — QR Code Integration](#feature-32--qr-code-integration)
- [Feature 33 — Peer Resume Review Marketplace](#feature-33--peer-resume-review-marketplace)
- [Feature 34 — Resume Sharing & Collaboration](#feature-34--resume-sharing--collaboration)
- [Feature 35 — Resume Performance Dashboard](#feature-35--resume-performance-dashboard)
- [Feature 36 — A/B Testing for Resume Versions](#feature-36--ab-testing-for-resume-versions)
- [Feature 37 — Job Application Tracker Analytics](#feature-37--job-application-tracker-analytics)
- [Feature 38 — Skill Trend Analysis](#feature-38--skill-trend-analysis)
- [Feature 39 — Enhanced Admin Dashboard](#feature-39--enhanced-admin-dashboard)
- [Feature 40 — IP-Based Rate Limiting](#feature-40--ip-based-rate-limiting)
- [Feature 41 — E2E Testing Suite](#feature-41--e2e-testing-suite)
- [Feature 42 — Security Enhancements (CAPTCHA, 2FA, CSP)](#feature-42--security-enhancements-captcha-2fa-csp)
- [Implementation Roadmap](#implementation-roadmap)

---

## Current Features (v1)

These features already exist and are fully functional:

| # | Feature | Status | AI Flow File |
|---|---------|--------|-------------|
| — | Resume Analysis (ATS scoring, keywords) | :white_check_mark: Done | `analyze-resume-content.ts` |
| — | Resume Improvements (AI suggestions) | :white_check_mark: Done | `suggest-resume-improvements.ts` |
| — | Q&A Generation (topic-based) | :white_check_mark: Done | `generate-resume-qa.ts` |
| — | Interview Questions (role-based) | :white_check_mark: Done | `generate-interview-questions.ts` |
| — | Cover Letter Generation | :white_check_mark: Done | `generate-cover-letter.ts` |
| — | Resume Parsing (structured extraction) | :white_check_mark: Done | `parse-resume-intelligently.ts` |
| — | Job Description Structuring | :white_check_mark: Done | `structure-job-description.ts` |
| — | LaTeX PDF Export (7 templates) | :white_check_mark: Done | Server action in `actions.ts` |
| — | Multi-provider AI (Groq → Gemini → OpenRouter) | :white_check_mark: Done | `smart-router.ts` |
| — | Tier-based subscriptions (Free / Pro) | :white_check_mark: Done | `subscription-service.ts` |
| — | Rate limiting (tier-aware) | :white_check_mark: Done | `rate-limiter.ts` |
| — | Admin dashboard | :white_check_mark: Done | `src/app/admin/` |

---

## AI & Analysis Features (Features 1–10)

---

### Feature 1 — Career Gap Analysis & Path Suggestions

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Free (basic gaps) / Pro (full analysis + resources + salary) |
| **AI Model** | `groq-llama-70b` (primary) |
| **New Files** | `src/ai/flows/analyze-career-gap.ts`, `src/components/career-gap-tab.tsx` |

**What it does:**
AI analyzes career progression and identifies skill/experience gaps for a target role. Provides an actionable roadmap with courses, certifications, timeline, and salary projections.

**Key outputs:**
- Skill gaps with severity levels (Critical / High / Medium / Low)
- Timeline to role-readiness estimation
- Course/certification recommendations with providers & costs
- Milestone-based career path
- Salary progression predictions (current → target)

**Dependencies:** None (standalone AI flow)

---

### Feature 2 — Real-Time Keyword Optimizer

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Low |
| **Impact** | High |
| **Tier** | Free (limited) / Pro (full) |
| **AI Model** | `groq-llama-8b` (fast, for real-time) |
| **New Files** | `src/hooks/use-keyword-suggestions.ts`, `src/components/keyword-optimizer-panel.tsx` |

**What it does:**
Live keyword density tracking and ATS-friendly synonym suggestions while the user edits their resume. Debounced analysis (1s) provides instant feedback.

**Key outputs:**
- Missing critical keywords highlighted
- ATS-friendly synonym suggestions
- Keyword density meter
- Industry-specific keyword database
- Click-to-insert functionality

**Dependencies:** None

---

### Feature 3 — Multi-Resume Comparison & Benchmarking

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Pro only |
| **AI Model** | `groq-llama-70b` |
| **New Files** | `src/ai/flows/compare-resumes.ts`, `src/app/compare/page.tsx` |

**What it does:**
Compare 2–5 resume versions side-by-side or benchmark against industry standards. Ranks versions and suggests how to merge the best parts.

**Key outputs:**
- Score comparison across ATS, content coverage, readability, keywords
- Diff highlighting (added/removed content)
- Best version recommendation
- Merge strategy suggestion
- Industry benchmark percentile rank

**Dependencies:** Feature 11 (version control) enhances this

---

### Feature 4 — Smart Resume Tailoring Engine

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | Pro only |
| **AI Model** | `groq-llama-70b` |
| **New Files** | `src/ai/flows/tailor-resume.ts`, `src/components/tailor-resume-panel.tsx` |

**What it does:**
One-click auto-tailor resume to a specific job posting. Reorders sections, highlights matching skills, generates a custom summary, and modifies bullet points for relevance.

**Key outputs:**
- Tailored resume data (modified sections)
- Change log (what was added/removed/modified/reordered with rationale)
- Match score (before vs. after)
- Relevance boost report
- Three aggressiveness levels: conservative, moderate, aggressive

**Dependencies:** Resume parsing (existing)

---

### Feature 5 — Resume Translation & Localization

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | Pro only |
| **AI Model** | `groq-llama-70b` |
| **New Files** | `src/ai/flows/translate-resume.ts`, `src/components/translation-panel.tsx` |

**What it does:**
Translate resumes to 10+ languages with cultural format adaptation (US vs EU vs Asia vs LatAm). Handles date formats, phone formats, industry terminology, and cultural norms.

**Key outputs:**
- Full translated resume text
- Cultural adaptations list with rationale
- Format changes (date, phone, address)
- Industry terminology mapping
- Target markets: US, EU, UK, Asia, LatAm

**Dependencies:** None

---

### Feature 6 — LinkedIn Profile Optimizer

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Pro only |
| **AI Model** | `groq-llama-70b` |
| **New Files** | `src/ai/flows/optimize-linkedin.ts`, `src/components/linkedin-optimizer-tab.tsx` |

**What it does:**
Analyze and optimize LinkedIn profiles based on resume and target role. Provides headline suggestions, about section rewrites, skill endorsement strategy, and experience bullet improvements.

**Key outputs:**
- Headline suggestions with SEO scores
- Optimized About section with keyword density
- Skills: recommended additions, removals, and endorsement priority
- Experience bullet rewrites with improvement explanations

**Dependencies:** None

---

### Feature 7 — Video Resume Script Generator

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | High |
| **Impact** | Medium |
| **Tier** | Pro only |
| **AI Model** | `groq-llama-70b` |
| **New Files** | `src/ai/flows/generate-video-script.ts`, `src/components/video-script-tab.tsx` |

**What it does:**
Generate video resume scripts in 30s, 60s, and 90s versions. Includes section-by-section breakdown with timing, delivery tips, and a teleprompter-formatted view.

**Key outputs:**
- Three script versions (30s / 60s / 90s)
- Section breakdown with duration and tips
- Delivery/presentation guidance
- Teleprompter-formatted output

**Dependencies:** None

---

### Feature 8 — Salary Negotiation Insights

| Property | Detail |
|----------|--------|
| **Priority** | :green_circle: Low |
| **Complexity** | Medium |
| **Impact** | Medium |
| **Tier** | Pro only |
| **New Files** | `src/ai/flows/salary-insights.ts`, `src/components/salary-insights-tab.tsx` |

**What it does:**
Salary range estimation by role/location, negotiation strategies, benefits analysis, market trends, and counter-offer templates.

**Dependencies:** External salary data APIs (Glassdoor, PayScale) optional

---

### Feature 9 — Portfolio/Project Recommendations

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Medium |
| **Impact** | Medium |
| **Tier** | Pro only |
| **New Files** | `src/ai/flows/recommend-projects.ts`, `src/components/project-recommendations-tab.tsx` |

**What it does:**
Suggest portfolio projects to strengthen resume for a target role. Includes tech stack recommendations, estimated completion time, and step-by-step guides.

**Dependencies:** Feature 1 (career gap analysis) feeds into this

---

### Feature 10 — Resume Readability & Accessibility Checker

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Low |
| **Impact** | Low |
| **Tier** | Free |
| **New Files** | `src/ai/flows/check-readability.ts`, `src/components/readability-panel.tsx` |

**What it does:**
Flesch-Kincaid readability scoring, ADA compliance checks, font/contrast recommendations, screen reader compatibility, and plain language suggestions.

**Dependencies:** None

---

## User Experience Features (Features 11–19)

---

### Feature 11 — Resume Version Control & History

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Free (5 versions) / Pro (unlimited) |
| **New Files** | `src/lib/resume-versioning.ts`, `src/components/version-history-panel.tsx` |

**What it does:**
Git-like version control for resumes. Auto-saves snapshots, supports diff view between versions, restore previous versions, branch/fork, and version tagging.

**Key capabilities:**
- Automatic version snapshots on save
- Side-by-side diff view with highlighting
- One-click restore to any version
- Version branching/forking
- Custom tags (e.g., "Software Engineer V3")
- Change history timeline visualization

**Dependencies:** Database (PostgreSQL) for version storage

---

### Feature 12 — Smart Auto-Save & Conflict Resolution

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | All |
| **New Files** | `src/hooks/use-auto-save.ts`, `src/components/save-status-indicator.tsx` |

**What it does:**
Auto-saves every 30 seconds with visual status indicator. Detects conflicts from multi-device editing and presents merge resolution UI.

**Key capabilities:**
- Auto-save every 30 seconds (debounced)
- Visual save status (saved / saving / unsaved / conflict)
- Conflict detection across multiple devices
- Merge conflict resolution UI
- Manual save trigger
- Save history log

**Dependencies:** WebSocket server (for real-time conflict detection)

---

### Feature 13 — Drag-and-Drop Resume Builder

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | All |
| **New Files** | `src/components/resume-builder/index.tsx`, `src/components/resume-builder/sortable-section.tsx` |
| **Library** | `@dnd-kit/core`, `@dnd-kit/sortable` |

**What it does:**
Visual resume builder with drag-and-drop section reordering, add/remove sections, pre-filled templates, and real-time preview.

**Dependencies:** None (can use existing `@hello-pangea/dnd` already in dependencies)

---

### Feature 14 — Resume Templates Marketplace

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Free (basic) / Pro (premium templates) |
| **New Files** | `src/app/templates/page.tsx`, `src/app/templates/[id]/page.tsx`, `src/lib/types/template.ts` |

**What it does:**
Browse 50+ templates filtered by industry/role/design. Includes user ratings, reviews, premium templates for Pro users, and template customization.

**Key capabilities:**
- Template library with search/filter
- Preview with sample or user data
- User ratings and reviews
- Premium templates (Pro-only)
- Template customization (colors, fonts, spacing)

**Dependencies:** LaTeX service (for template compilation)

---

### Feature 15 — Dark Mode & Theme Customization

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Low |
| **Impact** | Medium |
| **Tier** | Free (dark mode) / Pro (custom themes) |
| **New Files** | `src/components/theme-customizer.tsx` |
| **Library** | `next-themes` (already installed) |

**What it does:**
Full dark mode with system preference detection, 8+ color schemes, and a custom theme builder for Pro users.

**Dependencies:** None (next-themes already in project)

---

### Feature 16 — Progressive Web App (PWA)

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | All |
| **New Files** | `src/components/mobile/camera-upload.tsx`, `src/hooks/use-offline-status.ts` |

**What it does:**
Full-featured PWA with install-as-app support (iOS/Android), offline mode with service workers, push notifications, camera resume upload, and mobile-optimized UI.

**Key capabilities:**
- Installable on mobile (already has manifest.ts & sw.js)
- Offline editing with background sync
- Push notifications
- Camera-based resume upload with OCR
- Mobile-optimized responsive UI

**Dependencies:** Service worker (exists), WebSocket (for push)

---

### Feature 17 — Keyboard Shortcuts & Power User Features

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Low |
| **Impact** | Medium |
| **Tier** | All |
| **New Files** | `src/hooks/use-keyboard-shortcuts.ts`, `src/components/shortcut-help-dialog.tsx` |
| **Library** | `react-hotkeys-hook` |

**What it does:**
Comprehensive keyboard shortcuts for all major actions: analyze (Ctrl+A), export (Ctrl+E), save (Ctrl+S), command palette (Ctrl+K), navigation shortcuts, and custom mapping.

**Dependencies:** Feature 18 (command palette) for Ctrl+K

---

### Feature 18 — Smart Search & Command Palette

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Medium |
| **Impact** | Medium |
| **Tier** | All |
| **New Files** | `src/components/command-palette.tsx` |
| **Library** | `cmdk` |

**What it does:**
Spotlight/VS Code-like command palette with fuzzy search across all features, recent actions, quick navigation, and action suggestions.

**Dependencies:** Feature 17 (Ctrl+K shortcut)

---

### Feature 19 — Onboarding Tutorial & Interactive Guide

| Property | Detail |
|----------|--------|
| **Priority** | :green_circle: Low |
| **Complexity** | Low |
| **Impact** | Low |
| **Tier** | All |
| **New Files** | `src/components/onboarding-tour.tsx`, `src/hooks/use-onboarding.ts` |
| **Library** | `react-joyride` or `driver.js` |

**What it does:**
Interactive step-by-step walkthrough for new users highlighting key features: upload resume, paste JD, run analysis, export PDF. Includes progress tracking and video tutorials.

**Dependencies:** None

---

## Subscription & Monetization Features (Features 20–27)

---

### Feature 20 — Team Plans & Workspace Collaboration

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | Team Starter / Team Growth / Enterprise |
| **New Files** | `src/lib/types/workspace.ts`, `src/lib/workspace-service.ts`, `src/app/team/` |

**What it does:**
Multi-user workspaces for teams, recruiters, and career counselors. Role-based access (Admin, Editor, Viewer), shared resume library, team analytics, centralized billing, and bulk user management.

**Pricing:**
| Plan | Seats | Price/Seat/Month |
|------|-------|------------------|
| Team Starter | 5 | $15 |
| Team Growth | 10 | $12 |
| Enterprise | Unlimited | Custom |

**Dependencies:** Authentication system, PostgreSQL

---

### Feature 21 — Pay-Per-Use Credits System

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | All (alternative to subscription) |
| **New Files** | `src/lib/credits-service.ts`, `src/app/billing/credits/page.tsx` |

**What it does:**
Buy AI credit packs (10, 50, 100, 500) with no expiration. Includes usage tracking, auto-top-up option, and gift credits functionality.

**Pricing:**
| Pack | Credits | Price | Per Credit |
|------|---------|-------|------------|
| Starter | 10 | $5 | $0.50 |
| Popular | 50 | $20 | $0.40 |
| Value | 100 | $35 | $0.35 |
| Bulk | 500 | $150 | $0.30 |

**Dependencies:** Razorpay integration (existing)

---

### Feature 22 — Referral Program & Affiliate Marketing

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Medium |
| **Impact** | Medium |
| **Tier** | All |
| **New Files** | `src/lib/referral-service.ts`, `src/app/referral/page.tsx` |

**What it does:**
Unique referral links, 20% off for both referrer & referee, referral dashboard, payout tracking for affiliates, and multi-tier rewards.

**Dependencies:** Subscription/credits system

---

### Feature 23 — Annual Plans with Discount

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Low |
| **Impact** | Medium |
| **Tier** | Pro |
| **Files Modified** | `src/lib/types/subscription.ts`, `src/app/pricing/page.tsx` |

**What it does:**
20% discount for annual subscriptions.

| Plan | Monthly | Annual (per month) | Savings |
|------|---------|-------------------|---------|
| Pro (INR) | ₹499/mo | ₹399/mo (₹4,799/yr) | 20% |
| Pro (USD) | $9.99/mo | $7.99/mo ($95.90/yr) | 20% |

**Dependencies:** Razorpay recurring payments

---

### Feature 24 — Student & Non-Profit Discounts

| Property | Detail |
|----------|--------|
| **Priority** | :green_circle: Low |
| **Complexity** | Low |
| **Impact** | Low |
| **Tier** | Pro (discounted) |
| **New Files** | `src/lib/student-verification.ts` |

**What it does:**
50% discount for verified students (.edu email or SheerID/UNiDAYS verification) and non-profit organizations.

**Dependencies:** Email verification, optional student verification API

---

### Feature 25 — Premium Resume Reviews by Experts

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | High |
| **Impact** | Medium |
| **Tier** | Paid add-on |
| **New Files** | `src/app/expert-review/page.tsx`, `src/lib/expert-review-service.ts` |

**What it does:**
Paid 1-on-1 resume reviews by industry experts. Options: Basic ($49, written feedback), Premium ($99, 30-min call + written), Executive ($199, 60-min call + overhaul). Integrated booking (Calendly) and review delivery.

**Dependencies:** Expert onboarding, Calendly integration, payment processing

---

### Feature 26 — White-Label Solution for Career Services

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | Enterprise |
| **New Files** | `src/lib/white-label/`, `src/app/admin/white-label/` |

**What it does:**
Sell white-labeled version to universities, career coaches, and recruiters. Custom branding (logo, colors, domain), custom pricing tiers, admin portal, API access, and embedded widgets. Setup fee: $5,000 + $500/month.

**Dependencies:** Multi-tenant architecture, Team Plans (Feature 20)

---

### Feature 27 — Job Application Tracking

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | Free (10 apps) / Pro (unlimited) |
| **New Files** | `src/lib/job-tracking.ts`, `src/app/jobs/page.tsx`, `src/components/job-tracker/` |

**What it does:**
Track all job applications with Kanban board (Applied → Screening → Interview → Offer → Rejected/Accepted). Follow-up reminders, success rate analytics, and integration with job boards.

**UI components:**
- Kanban board (drag between columns)
- Quick-add application form
- Calendar view for interviews
- Analytics dashboard with success metrics

**Dependencies:** Database, notifications (for reminders)

---

## Resume Creation & Export Features (Features 28–32)

---

### Feature 28 — DOCX Export

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Free (basic) / Pro (formatted) |
| **New Files** | `src/lib/docx-export.ts` |
| **Library** | `docx` (already installed) |

**What it does:**
Export resume to Microsoft Word (.docx) with full formatting preservation. Multiple template styles (professional, modern, creative).

**Dependencies:** None (docx library already in package.json)

---

### Feature 29 — HTML/Web Resume Export

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Pro only |
| **New Files** | `src/lib/html-export.ts`, `src/app/web-resume/[username]/page.tsx` |

**What it does:**
Export as standalone responsive HTML page. Optional hosting at `{username}.resumebuddy.app`. Includes SEO optimization, analytics, password protection, and print stylesheet.

**Hosting pricing:** Free subdomain for Pro users, custom domain: $5/month

**Dependencies:** Deployment infrastructure for hosted resumes

---

### Feature 30 — Custom LaTeX Template Editor

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | High |
| **Impact** | Medium |
| **Tier** | Pro only |
| **New Files** | `src/app/templates/create/page.tsx` |
| **Library** | `@uiw/react-codemirror`, `@codemirror/lang-latex` |

**What it does:**
Visual editor for creating custom LaTeX templates with live preview, syntax highlighting, template variables, color/font customization, and marketplace publishing.

**Dependencies:** LaTeX service (existing), Template Marketplace (Feature 14)

---

### Feature 31 — Batch Export

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Low |
| **Impact** | Low |
| **Tier** | Pro only |
| **New Files** | `src/lib/batch-export.ts`, `src/components/batch-export-dialog.tsx` |

**What it does:**
Export multiple resume versions at once as a ZIP download. Choose format per resume, custom naming conventions, bulk template application.

**Dependencies:** Feature 11 (version control)

---

### Feature 32 — QR Code Integration

| Property | Detail |
|----------|--------|
| **Priority** | :green_circle: Low |
| **Complexity** | Low |
| **Impact** | Low |
| **Tier** | All |
| **New Files** | `src/lib/qr-code.ts` |
| **Library** | `qrcode` |

**What it does:**
Add QR codes linking to portfolio, LinkedIn, or web resume. Embeddable in LaTeX and HTML exports.

**Dependencies:** None

---

## Collaboration & Social Features (Features 33–34)

---

### Feature 33 — Peer Resume Review Marketplace

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | High |
| **Impact** | Medium |
| **Tier** | All (earn credits by reviewing) |
| **New Files** | `src/lib/peer-review.ts`, `src/app/reviews/page.tsx` |

**What it does:**
Platform where users review each other's resumes and earn credits. Includes rating system, anonymized reviews, expert badges, and review quality scoring.

**Dependencies:** Credits system (Feature 21)

---

### Feature 34 — Resume Sharing & Collaboration

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Medium |
| **Impact** | Medium |
| **Tier** | Free (view link) / Pro (comment + edit) |
| **New Files** | `src/lib/resume-sharing.ts`, `src/components/share-dialog.tsx`, `src/components/comment-system.tsx` |

**What it does:**
Google Docs-style sharing: generate shareable links, comment on specific sections, suggest edits, real-time collaboration, and permission levels (view/comment/edit).

**Dependencies:** WebSocket server (for real-time), Auth system

---

## Analytics & Insights Features (Features 35–38)

---

### Feature 35 — Resume Performance Dashboard

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Free (basic) / Pro (full) |
| **New Files** | `src/app/analytics/page.tsx`, `src/components/analytics/` |

**What it does:**
Comprehensive analytics: ATS score trends over time, keyword optimization progress, version performance comparison, industry benchmarking (radar chart), and personalized improvement recommendations.

**Dependencies:** Feature 11 (version history for trends), recharts (already installed)

---

### Feature 36 — A/B Testing for Resume Versions

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Pro only |
| **New Files** | `src/lib/ab-testing.ts`, `src/app/ab-test/page.tsx` |

**What it does:**
Track which resume version performs better in job applications. Create test campaigns, track outcomes (applications → responses → interviews → offers), statistical significance testing, and winner recommendation.

**Dependencies:** Feature 27 (job application tracking)

---

### Feature 37 — Job Application Tracker Analytics

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | High |
| **Impact** | High |
| **Tier** | Pro only |
| **New Files** | `src/components/job-tracker/analytics-dashboard.tsx` |

**What it does:**
Correlate resume versions with application outcomes. Success rate by industry, response time tracking, follow-up effectiveness, and interview-to-offer conversion rates.

**Dependencies:** Feature 27 (job tracking), Feature 36 (A/B testing)

---

### Feature 38 — Skill Trend Analysis

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Medium |
| **Impact** | Medium |
| **Tier** | Pro only |
| **New Files** | `src/ai/flows/analyze-skill-trends.ts`, `src/components/skill-trends-panel.tsx` |

**What it does:**
Track trending skills in the job market: skills trending up/down, industry-specific trends, emerging technologies, demand forecasting, and personalized skill recommendations.

**Dependencies:** External data (job board scraping, Google Trends API — optional)

---

## Admin & Infrastructure Features (Features 39–42)

---

### Feature 39 — Enhanced Admin Dashboard

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Admin only |
| **New Files** | `src/app/admin/revenue/page.tsx`, `src/app/admin/users/cohorts/page.tsx` |

**What it does:**
Real-time user activity monitoring, revenue analytics (MRR, churn, LTV, ARPU), user cohort analysis, churn prediction, custom report builder, and email campaign management.

**Dependencies:** Database, recharts (existing)

---

### Feature 40 — IP-Based Rate Limiting

| Property | Detail |
|----------|--------|
| **Priority** | :red_circle: Critical |
| **Complexity** | Low |
| **Impact** | High |
| **Tier** | Infrastructure |
| **New Files** | `src/lib/ip-rate-limiter.ts` |

**What it does:**
Prevent abuse with IP-based rate limiting (100 requests/hour/IP). Uses LRU cache or Redis for distributed tracking. Returns 429 with `Retry-After` header when exceeded.

**Dependencies:** Redis (for distributed mode)

---

### Feature 41 — E2E Testing Suite

| Property | Detail |
|----------|--------|
| **Priority** | :yellow_circle: Medium |
| **Complexity** | Medium |
| **Impact** | Medium |
| **Tier** | Infrastructure |
| **New Files** | `e2e/`, `playwright.config.ts` |
| **Library** | `@playwright/test` |

**What it does:**
Comprehensive end-to-end testing: user registration/login, resume upload + analysis, export functionality, payment flows, and admin operations.

**Dependencies:** None

---

### Feature 42 — Security Enhancements (CAPTCHA, 2FA, CSP)

| Property | Detail |
|----------|--------|
| **Priority** | :orange_circle: High |
| **Complexity** | Medium |
| **Impact** | High |
| **Tier** | Infrastructure |
| **New Files** | `src/lib/security.ts`, `src/lib/turnstile.ts`, `src/components/two-factor-setup.tsx` |

**What it does:**
- **CAPTCHA:** Cloudflare Turnstile on signup/login
- **2FA:** TOTP via authenticator app (QR code setup)
- **Session management:** Active sessions list, remote logout
- **CSRF protection:** Token-based
- **CSP headers:** Content Security Policy enforcement

**Dependencies:** Auth system

---

## Implementation Roadmap

### Phase 1 — Foundation (Months 1–2)

> Focus: Core improvements and highest-impact features

| Week | Features | Priority |
|------|----------|----------|
| 1–2 | Feature 11 (Version Control), Feature 12 (Auto-Save), Feature 40 (IP Rate Limiting) | :red_circle: Critical |
| 3–4 | Feature 1 (Career Gap), Feature 4 (Smart Tailoring), Feature 2 (Keyword Optimizer) | :red_circle: + :orange_circle: |
| 5–6 | Feature 35 (Performance Dashboard), Feature 28 (DOCX Export), Feature 29 (HTML Export) | :red_circle: + :orange_circle: |
| 7–8 | Feature 20 (Team Plans), Feature 23 (Annual Plans), Feature 42 (Security) | :red_circle: + :orange_circle: |

### Phase 2 — Monetization (Months 3–4)

> Focus: Revenue generation and subscription features

| Week | Features | Priority |
|------|----------|----------|
| 9–10 | Feature 21 (Credits System), Feature 14 (Template Marketplace), Feature 22 (Referrals) | :orange_circle: |
| 11–12 | Feature 3 (Resume Comparison), Feature 36 (A/B Testing), Feature 27 (Job Tracker) | :orange_circle: + :yellow_circle: |
| 13–14 | Feature 13 (Drag-and-Drop Builder), Feature 30 (LaTeX Editor) | :orange_circle: |
| 15–16 | Feature 25 (Premium Reviews), Feature 26 (White-Label) | :yellow_circle: |

### Phase 3 — Advanced Features (Months 5–6)

> Focus: AI capabilities and collaboration

| Week | Features | Priority |
|------|----------|----------|
| 17–18 | Feature 6 (LinkedIn Optimizer), Feature 7 (Video Script), Feature 5 (Translation) | :yellow_circle: + :orange_circle: |
| 19–20 | Feature 16 (PWA), Feature 18 (Command Palette), Feature 17 (Shortcuts) | :orange_circle: + :yellow_circle: |
| 21–22 | Feature 33 (Peer Review), Feature 34 (Sharing/Collaboration) | :orange_circle: + :yellow_circle: |
| 23–24 | Feature 39 (Admin Dashboard), Feature 41 (E2E Testing) | :red_circle: + :yellow_circle: |

### Phase 4 — Scale & Optimize (Months 7–8)

> Focus: Infrastructure, polish, and remaining features

| Week | Features | Priority |
|------|----------|----------|
| 25–26 | Feature 38 (Skill Trends), Feature 37 (Job Tracker Analytics), Feature 9 (Project Recs) | :yellow_circle: |
| 27–28 | Feature 15 (Dark Mode), Feature 10 (Readability), Feature 32 (QR Codes) | :yellow_circle: + :green_circle: |
| 29–30 | Feature 24 (Student Discounts), Feature 19 (Onboarding), Feature 31 (Batch Export) | :green_circle: |
| 31–32 | Feature 8 (Salary Insights), polish, bug fixes, documentation | :green_circle: |

---

## Feature Summary Matrix

| # | Feature | Priority | Complexity | Tier | Phase |
|---|---------|----------|------------|------|-------|
| 1 | Career Gap Analysis | :red_circle: Critical | Medium | Free/Pro | 1 |
| 2 | Real-Time Keyword Optimizer | :orange_circle: High | Low | Free/Pro | 1 |
| 3 | Multi-Resume Comparison | :orange_circle: High | Medium | Pro | 2 |
| 4 | Smart Resume Tailoring | :red_circle: Critical | High | Pro | 1 |
| 5 | Resume Translation | :orange_circle: High | High | Pro | 3 |
| 6 | LinkedIn Optimizer | :yellow_circle: Medium | Medium | Pro | 3 |
| 7 | Video Resume Script | :yellow_circle: Medium | High | Pro | 3 |
| 8 | Salary Negotiation | :green_circle: Low | Medium | Pro | 4 |
| 9 | Portfolio Recommendations | :yellow_circle: Medium | Medium | Pro | 4 |
| 10 | Readability Checker | :yellow_circle: Medium | Low | Free | 4 |
| 11 | Version Control | :red_circle: Critical | Medium | Free/Pro | 1 |
| 12 | Smart Auto-Save | :red_circle: Critical | Medium | All | 1 |
| 13 | Drag-and-Drop Builder | :orange_circle: High | High | All | 2 |
| 14 | Templates Marketplace | :orange_circle: High | Medium | Free/Pro | 2 |
| 15 | Dark Mode & Themes | :yellow_circle: Medium | Low | Free/Pro | 4 |
| 16 | PWA Enhancement | :orange_circle: High | High | All | 3 |
| 17 | Keyboard Shortcuts | :orange_circle: High | Low | All | 3 |
| 18 | Command Palette | :yellow_circle: Medium | Medium | All | 3 |
| 19 | Onboarding Tutorial | :green_circle: Low | Low | All | 4 |
| 20 | Team Plans | :red_circle: Critical | High | Team/Enterprise | 1 |
| 21 | Pay-Per-Use Credits | :orange_circle: High | Medium | All | 2 |
| 22 | Referral Program | :yellow_circle: Medium | Medium | All | 2 |
| 23 | Annual Plans | :orange_circle: High | Low | Pro | 1 |
| 24 | Student Discounts | :green_circle: Low | Low | Pro | 4 |
| 25 | Premium Expert Reviews | :yellow_circle: Medium | High | Add-on | 2 |
| 26 | White-Label Solution | :yellow_circle: Medium | High | Enterprise | 2 |
| 27 | Job Application Tracking | :yellow_circle: Medium | High | Free/Pro | 2 |
| 28 | DOCX Export | :red_circle: Critical | Medium | Free/Pro | 1 |
| 29 | HTML/Web Resume Export | :orange_circle: High | Medium | Pro | 1 |
| 30 | LaTeX Template Editor | :orange_circle: High | High | Pro | 2 |
| 31 | Batch Export | :yellow_circle: Medium | Low | Pro | 4 |
| 32 | QR Code Integration | :green_circle: Low | Low | All | 4 |
| 33 | Peer Review Marketplace | :orange_circle: High | High | All | 3 |
| 34 | Resume Sharing | :yellow_circle: Medium | Medium | Free/Pro | 3 |
| 35 | Performance Dashboard | :red_circle: Critical | Medium | Free/Pro | 1 |
| 36 | A/B Testing for Resumes | :orange_circle: High | Medium | Pro | 2 |
| 37 | Job Tracker Analytics | :yellow_circle: Medium | High | Pro | 4 |
| 38 | Skill Trend Analysis | :yellow_circle: Medium | Medium | Pro | 4 |
| 39 | Enhanced Admin Dashboard | :red_circle: Critical | Medium | Admin | 3 |
| 40 | IP-Based Rate Limiting | :red_circle: Critical | Low | Infra | 1 |
| 41 | E2E Testing Suite | :yellow_circle: Medium | Medium | Infra | 3 |
| 42 | Security (CAPTCHA, 2FA, CSP) | :orange_circle: High | Medium | Infra | 1 |

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Features** | 42 |
| :red_circle: **Critical** | 10 |
| :orange_circle: **High** | 15 |
| :yellow_circle: **Medium** | 12 |
| :green_circle: **Low** | 5 |
| **New AI Flows** | 10 |
| **New Pages/Routes** | 12 |
| **New Libraries Needed** | ~6 |
| **Estimated Timeline** | 8 months (4 phases) |

---

*This document should be updated as features are completed or re-prioritized.*
