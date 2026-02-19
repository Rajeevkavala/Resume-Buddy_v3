# ResumeBuddy — Top 10 Feature Enhancement Plan

_Created: 2026-02-19 | Status: Planning_

> **Goal**: Implement the 10 highest-impact features to establish competitive advantage against Teal, Jobscan, Resume.io, Rezi, and Kickresume — while leveraging ResumeBuddy's existing AI infrastructure as a force multiplier.

---

## Current Competitive Standing

| Category | Score | Notes |
|----------|-------|-------|
| AI Features | 7/10 | 12 flows, smart routing, multi-provider — **strongest asset** |
| Resume Building | 7/10 | 9 LaTeX templates, DOCX/PDF export, AI auto-fill |
| Interview Prep | 9/10 | Full mock interviews, DSA coding (Monaco), evaluation — **best-in-class** |
| Auth & Security | 9/10 | JWT+Session, OAuth, OTP, CSP, privacy guard |
| Infrastructure | 7/10 | Turborepo, Redis, MinIO, Docker, queues |
| UX/Design | 7/10 | Dark mode, shadcn/ui, animations, PWA |
| Competitive Parity | 5/10 | **Missing table-stakes features** (job tracker, auto-tailor, Chrome ext.) |

### Key Insight
ResumeBuddy's AI backbone (12 flows, 3-tier routing, 40-60% cost optimization) is a differentiated asset. The top-10 features below exploit this existing infrastructure to maximize ROI per feature.

---

## Top 10 Features — Ranked by Competitive Impact

### Feature #1: AI Auto-Tailor Resume to Job Description
**Priority**: 🔴 Critical | **Effort**: ~5-7 days | **Impact**: Very High

#### What It Is
One-click AI rewriting that automatically tailors a resume to match a specific job description — rewriting bullet points, injecting missing keywords, reordering sections, and quantifying impact statements. Saves the tailored version as a new variant linked to the job.

#### Why It Matters
- **Teal, Rezi, Jobscan** all offer this — it's the #1 reason users pay for resume tools.
- Current ResumeBuddy gap: analysis shows what's wrong, but the user must manually fix it.
- Converts a passive analysis into an **actionable, one-click outcome**.

#### Technical Approach
```
New AI Flow: src/ai/flows/auto-tailor-resume.ts
├── Input: resumeData (structured) + jobDescription + analysisResult (optional)
├── AI: smartGenerate({ feature: 'auto-tailor', ... })
│   └── Prompt: "Rewrite these bullet points to match JD keywords..."
├── Output: tailoredResumeData (same schema, rewritten content)
└── Persistence: New GeneratedResume row linked to original + JD
```

**Implementation Steps**:
1. Create `src/ai/flows/auto-tailor-resume.ts` — new AI flow with Zod schemas
2. Register `auto-tailor` in `smart-router.ts` (primary: `groq-llama-70b`, fallback chain)
3. Add `runAutoTailorAction()` to `src/app/actions.ts` with rate limiting
4. Add "Tailor to Job" button on `/analysis` page + `/dashboard` improvements tab
5. Create diff-view component showing original vs. tailored resume side-by-side
6. Save tailored variant to `GeneratedResume` with `sourceJobDescription` field
7. Add tier gating: Pro-only feature

#### Success Metrics
- Tailored resume ATS score > original score by ≥15 points in 80%+ of cases
- < 8 second generation time (use `groq-llama-70b` primary)
- User retention +25% (hypothesis: users who tailor come back for every application)

---

### Feature #2: Job Application Tracker
**Priority**: 🔴 Critical | **Effort**: ~5-6 days | **Impact**: Very High

#### What It Is
A Kanban-style job application tracker where users manage their entire job search — from "Saved" → "Applied" → "Interview" → "Offer" → "Rejected". Each application links to the resume variant + cover letter used, with AI-powered follow-up reminders.

#### Why It Matters
- **Table-stakes for Teal** (it's their core product) — they have 850K+ users because of this.
- Transforms ResumeBuddy from a "use once per resume" tool into a **daily-use job search hub**.
- Dramatically increases **DAU/MAU ratio** and session duration.

#### Technical Approach
```
Database: New Prisma models
├── JobApplication { id, userId, company, role, url, status, salary, notes, ... }
├── ApplicationTimeline { id, applicationId, status, timestamp, notes }
└── Relations: JobApplication → GeneratedResume, CoverLetter

UI: src/app/job-tracker/page.tsx
├── Kanban board (drag-drop columns: Saved → Applied → Interview → Offer → Rejected)
├── Application detail drawer (company, role, resume used, cover letter, timeline)
├── AI follow-up suggestions ("It's been 7 days since applying, draft a follow-up?")
└── Stats dashboard (applications/week, response rate, pipeline visualization)
```

**Implementation Steps**:
1. Add `JobApplication` + `ApplicationTimeline` models to Prisma schema
2. Run migration: `npm run db:migrate`
3. Create CRUD server actions in `src/app/actions.ts`
4. Build Kanban board UI with `@dnd-kit` (already have drag-drop patterns from section-order-manager)
5. Create application detail drawer with linked resume/cover letter
6. Add AI follow-up email generator (reuse cover-letter flow structure)
7. Add `/job-tracker` route with middleware protection
8. Free tier: 10 active applications; Pro: unlimited

#### Success Metrics
- Average tracked applications per active user > 5
- DAU increase +40% (tracker drives daily engagement)
- Session duration +60% (users spend time managing pipeline)

---

### Feature #3: Real ATS Parser Simulation
**Priority**: 🔴 Critical | **Effort**: ~4-5 days | **Impact**: High

#### What It Is
Simulate how real ATS systems (Workday, Greenhouse, Lever, Taleo) parse resumes — showing exactly which fields get extracted, which get lost, and formatting issues that cause parsing failures. Goes beyond keyword matching to actual structural analysis.

#### Why It Matters
- **Jobscan's core differentiator** — they charge $50/mo for this.
- Current ResumeBuddy ATS score is AI-based estimation; real ATS simulation is deterministic and trustworthy.
- Users get **specific, fixable problems** (e.g., "Workday cannot parse your two-column layout").

#### Technical Approach
```
New Module: src/lib/ats-simulation/
├── parsers/
│   ├── workday-parser.ts    # Simulate Workday resume parsing rules
│   ├── greenhouse-parser.ts # Simulate Greenhouse parsing
│   ├── lever-parser.ts      # Simulate Lever parsing
│   └── generic-parser.ts    # Common ATS patterns
├── rules/
│   ├── format-rules.ts      # Font, column, header detection issues
│   ├── contact-rules.ts     # Phone, email, LinkedIn extraction
│   └── section-rules.ts     # Education, experience section parsing
├── simulator.ts             # Orchestrator: run resume through N parsers
└── types.ts                 # ATSResult, ParsedField, ParseIssue

Output: {
  overallParseability: 85,
  parserResults: [
    { parser: "Workday", score: 90, extractedFields: {...}, issues: [...] },
    { parser: "Greenhouse", score: 75, extractedFields: {...}, issues: [...] }
  ],
  criticalIssues: ["Two-column layout breaks Workday parsing"],
  recommendations: ["Use single-column layout", "Move name to top-left"]
}
```

**Implementation Steps**:
1. Research and codify top 4 ATS parsing rules (Workday, Greenhouse, Lever, generic)
2. Build rule engine in `src/lib/ats-simulation/` — deterministic, no AI needed
3. Create AI flow for contextual recommendations from parse results
4. Build ATS simulation UI tab on `/analysis` page (parsed fields view, issues list)
5. Add "ATS Compatibility" badge to resume library cards
6. Free tier: 1 parser (generic); Pro: all 4 parsers

#### Success Metrics
- Simulation accuracy > 85% vs. real ATS parsing (validate with test resumes)
- Issue detection rate: find ≥ 3 fixable issues per resume on average
- Pro conversion: users who see ATS simulation convert to Pro at 2× rate

---

### Feature #4: Inline AI Bullet Point Rewriter
**Priority**: 🟠 High | **Effort**: ~3-4 days | **Impact**: High

#### What It Is
Click any resume bullet point to get instant AI rewrites — "Make it more quantitative", "Add metrics", "Shorten to one line", "Use stronger action verbs", "Tailor to [JD keyword]". Inline editing with real-time suggestions, no page navigation needed.

#### Why It Matters
- **Rezi and Resume.io** offer inline AI rewriting — most requested feature in resume tools.
- Current ResumeBuddy shows improvement suggestions as a separate page. Users must manually copy/paste.
- Inline rewriting has the **lowest friction** of any AI feature — drives habitual use.

#### Technical Approach
```
New AI Flow: src/ai/flows/rewrite-bullet-point.ts
├── Input: { originalBullet, context: { section, role, jdKeywords }, style: 'quantify'|'shorten'|'strengthen'|'tailor' }
├── AI: smartGenerate({ feature: 'rewrite-bullet', ... })
│   └── Uses groq-llama-8b (fast tier — needs < 1 sec response)
├── Output: { variants: [string, string, string] } // 3 rewrite options
└── UI: Floating popover on bullet hover/click with variant selector

Component: src/components/inline-rewriter.tsx
├── Trigger: Click/hover on any editable bullet in resume builder
├── Popover: 3 AI variants + style selector dropdown
├── Apply: One-click replace in resume builder state
└── Undo: Built-in undo for previous bullet text
```

**Implementation Steps**:
1. Create `src/ai/flows/rewrite-bullet-point.ts` with fast model routing
2. Register `rewrite-bullet` in smart-router (`groq-llama-8b` primary for speed)
3. Add `rewriteBulletAction()` to server actions
4. Build `<InlineRewriter>` popover component
5. Integrate into resume builder's experience/education/project sections
6. Add keyboard shortcut: `Ctrl+Shift+R` to trigger on selected bullet
7. Free tier: 3 rewrites/day; Pro: unlimited

#### Success Metrics
- Rewrite latency < 1.5 seconds (8B model, low token count)
- Acceptance rate > 40% (user picks an AI variant)
- Resume builder session duration +35%

---

### Feature #5: Chrome Extension — Job Page Auto-Capture
**Priority**: 🟠 High | **Effort**: ~5-6 days | **Impact**: High

#### What It Is
A Chrome extension that detects when users are on job listing pages (LinkedIn, Indeed, Glassdoor, company career sites) and offers one-click capture — extracting job details, saving to the job tracker, and optionally auto-tailoring a resume.

#### Why It Matters
- **Teal's Chrome extension has 500K+ installs** — it's their primary acquisition channel.
- Captures users at the **moment of intent** (browsing jobs) rather than requiring them to visit ResumeBuddy first.
- Bridges the gap between "finding a job" and "preparing for it".

#### Technical Approach
```
New Package: packages/chrome-extension/
├── manifest.json (Manifest V3)
├── content-scripts/
│   ├── linkedin-detector.ts    # Detect LinkedIn job pages
│   ├── indeed-detector.ts      # Detect Indeed job pages
│   ├── glassdoor-detector.ts   # Detect Glassdoor job pages
│   └── generic-detector.ts     # Generic job listing heuristics
├── popup/
│   ├── popup.html              # Extension popup UI
│   └── popup.ts                # Save job, tailor resume, open tracker
├── background/
│   └── service-worker.ts       # API communication with ResumeBuddy
└── api-client/
    └── resumebuddy-api.ts      # Authenticated API calls to main app

API: New endpoint /api/extension/capture-job
├── POST: { url, title, company, description, source, extractedData }
├── Auth: Session token passed from extension
└── Action: Create JobApplication + optionally trigger auto-tailor
```

**Implementation Steps**:
1. Create `packages/chrome-extension/` with Manifest V3 boilerplate
2. Build content scripts for LinkedIn, Indeed, Glassdoor, generic job detection
3. Create popup UI with React (lightweight, reuse Tailwind tokens)
4. Add `/api/extension/capture-job` API route
5. Implement auth handshake (user logs in once, extension stores session)
6. Connect to Job Application Tracker (Feature #2)
7. Add "Quick Tailor" button in popup that triggers Feature #1
8. Publish to Chrome Web Store

#### Success Metrics
- Extension installs > 1,000 in first month
- Jobs captured per active extension user > 3/week
- Funnel: 30% of extension users become daily app users

---

### Feature #6: Resume Score History & Progress Dashboard
**Priority**: 🟠 High | **Effort**: ~3-4 days | **Impact**: Medium-High

#### What It Is
A visual dashboard showing how a user's resume score evolves over time — tracking ATS score, keyword match rate, and section completeness across every analysis run. Gamified progress with milestones (badges) and improvement streaks.

#### Why It Matters
- **No competitor does this well** — first-mover advantage opportunity.
- Creates a **habit loop**: analyze → improve → see score increase → repeat.
- Gamification drives **retention** — users with progress tracking retain 3× longer (industry data).

#### Technical Approach
```
Database: New/Updated models
├── ScoreHistory { id, userId, resumeId, atsScore, keywordScore, formatScore, timestamp, metadata }
└── UserAchievement { id, userId, badge, unlockedAt, metadata }

UI: src/app/progress/page.tsx
├── Score timeline chart (line chart with annotations for each analysis)
├── Category breakdown over time (ATS, Keywords, Format, Impact)
├── Milestone badges: "First Analysis", "Score 80+", "5 Resumes Tailored", "Interview Ready"
├── Weekly streak tracker
└── Improvement suggestions based on score trends

Component: src/components/score-history-chart.tsx
└── Uses recharts (already in package.json) or similar charting library
```

**Implementation Steps**:
1. Add `ScoreHistory` + `UserAchievement` models to Prisma schema
2. Modify `runAnalysisAction()` to persist score snapshot after each analysis
3. Create server actions for fetching score history & achievements
4. Build score timeline chart component with Recharts
5. Create badge/milestone system (10 badges: "First Analysis" → "Resume Master")
6. Add `/progress` route and sidebar navigation link
7. Add mini score trend widget to dashboard homepage
8. All tiers: score history for last 10 analyses (Free), unlimited (Pro)

#### Success Metrics
- Users who view progress dashboard retain 2.5× longer
- Average analyses per user increase from 2.1 to 4.5
- Badge unlock notifications drive 15% re-engagement rate

---

### Feature #7: Multi-Format Resume Import (LinkedIn, PDF OCR, JSON Resume)
**Priority**: 🟠 High | **Effort**: ~4-5 days | **Impact**: Medium-High

#### What It Is
Import resumes from multiple sources: paste a LinkedIn profile URL to auto-extract, upload scanned PDFs (OCR), import from JSON Resume standard, or import from other platforms (Overleaf LaTeX, Google Docs link). Dramatically lowers the barrier to entry.

#### Why It Matters
- **LinkedIn import is the #1 onboarding differentiator** — Teal and Resume.io use it as their primary signup flow.
- Many users have resumes as scanned PDFs (university career centers) — OCR unlocks this audience.
- Reduces time-to-first-value from ~5 minutes (manual paste) to < 30 seconds.

#### Technical Approach
```
New Module: src/lib/importers/
├── linkedin-importer.ts       # LinkedIn public profile scraping (with rate limits)
├── ocr-importer.ts            # PDF OCR via Tesseract.js or cloud OCR
├── json-resume-importer.ts    # JSON Resume standard (jsonresume.org)
├── google-docs-importer.ts    # Google Docs export link handling
└── importer-orchestrator.ts   # Unified import interface

New AI Flow: src/ai/flows/normalize-imported-resume.ts
├── Input: Raw imported data (varying structures)
├── AI: Normalize to ResumeBuddy's resumeData schema
└── Output: Structured resumeData ready for builder
```

**Implementation Steps**:
1. Build LinkedIn public profile parser (server-side, respecting robots.txt)
2. Integrate Tesseract.js or cloud OCR for scanned PDF handling
3. Create JSON Resume standard importer
4. Build unified importer UI on dashboard: "Import from..." dropdown
5. Create normalization AI flow for inconsistent import data
6. Add import source tracking to `ResumeData` model
7. Free tier: manual upload only; Pro: all import sources

#### Success Metrics
- Time-to-first-value < 60 seconds for LinkedIn import users
- Import completion rate > 75% (start import → have usable resume)
- +30% new user activation rate

---

### Feature #8: AI Cover Letter Templates & Multi-Style Generator
**Priority**: 🟡 Medium | **Effort**: ~3-4 days | **Impact**: Medium

#### What It Is
Expand the cover letter feature from a single-flow generator to a multi-template system with 6+ styles (formal corporate, startup-friendly, creative, career-changer, internal transfer, networking intro). Each template has a distinct structure, tone, and AI prompt strategy. Add A/B variant generation.

#### Why It Matters
- Current cover letter is a single template — competitors offer 5-10+ styles.
- Cover letters are the **#2 most-used AI feature** after resume analysis (industry data).
- "Generate two variants and compare" is a high-value workflow users request.

#### Technical Approach
```
Updated AI Flow: src/ai/flows/generate-cover-letter.ts
├── Input: + templateStyle: 'corporate'|'startup'|'creative'|'career-change'|'internal'|'networking'
├── Each style has distinct: system prompt, structure rules, tone guidelines
├── A/B mode: Generate 2 variants simultaneously for comparison
└── Output: { coverLetter, style, variant: 'A'|'B' }

New UI: src/components/cover-letter/
├── template-selector.tsx     # Visual template picker with previews
├── variant-comparison.tsx    # Side-by-side A/B comparison view
├── cover-letter-editor.tsx   # Rich text editing of generated letter
└── cover-letter-export.tsx   # PDF/DOCX export with formatting
```

**Implementation Steps**:
1. Design 6 cover letter templates with distinct prompt strategies
2. Update `generate-cover-letter.ts` to accept `templateStyle` parameter
3. Add A/B variant generation (two parallel AI calls)
4. Build template selector UI with visual previews
5. Create side-by-side variant comparison component
6. Add rich text editor for post-generation editing
7. Add PDF export with template-specific formatting
8. Free tier: 1 template (corporate); Pro: all templates + A/B

#### Success Metrics
- Cover letter generation usage +60%
- A/B comparison feature used in 35% of generations
- Cover letter satisfaction rating > 4.2/5

---

### Feature #9: Real-Time Collaborative Resume Review
**Priority**: 🟡 Medium | **Effort**: ~6-7 days | **Impact**: Medium

#### What It Is
Share a resume with a mentor, career coach, or friend for real-time collaborative review. Reviewers can leave inline comments, suggest edits, and approve sections. Think "Google Docs commenting" for resumes, with AI-powered review assistance.

#### Why It Matters
- **No resume tool does this well** — massive differentiation opportunity.
- Career coaching is a $15B industry — enabling coach-client workflows creates a new market.
- Social features drive **viral growth** (reviewer → "I want this tool too").

#### Technical Approach
```
Database: New models
├── ResumeShare { id, resumeId, ownerId, shareToken, permissions, expiresAt }
├── ReviewComment { id, shareId, reviewerId, section, lineRef, comment, status, createdAt }
└── ReviewSuggestion { id, commentId, originalText, suggestedText, accepted }

WebSocket: Implement real-time in apps/websocket/ (currently placeholder)
├── Room per shared resume
├── Events: comment-added, suggestion-made, suggestion-accepted, cursor-position
└── Presence: Show who is viewing/editing

UI: src/app/review/[shareToken]/page.tsx
├── Read-only annotated resume view for reviewers
├── Inline comment threads (click section to add comment)
├── AI review assistant: "AI, review this bullet's impact level"
└── Owner dashboard: See all comments, accept/reject suggestions
```

**Implementation Steps**:
1. Add `ResumeShare`, `ReviewComment`, `ReviewSuggestion` models to Prisma schema
2. **Implement WebSocket server** in `apps/websocket/src/server.ts` (Socket.io)
3. Create share link generation + permission management actions
4. Build reviewer-facing annotated resume view
5. Create inline commenting system with thread support
6. Add AI review assistant (reuse analysis flow for section-level feedback)
7. Build owner notification + comment management dashboard
8. Free tier: 1 active share link; Pro: unlimited + AI review assistant

#### Success Metrics
- 20% of Pro users share at least one resume for review
- Average comments per shared resume > 3
- Viral coefficient: 15% of reviewers sign up

---

### Feature #10: Stripe Integration for Global Payments
**Priority**: 🟡 Medium | **Effort**: ~4-5 days | **Impact**: Medium

#### What It Is
Add Stripe as a secondary payment provider alongside Razorpay — enabling global payments in USD, EUR, GBP, and 40+ currencies. Auto-detect user region to show appropriate payment provider and pricing.

#### Why It Matters
- Current Razorpay-only setup **limits market to India** (INR payments).
- Global resume tool market is 10× larger: US, UK, EU, SEA, Middle East.
- Stripe is **required** for US/EU market entry — where willingness-to-pay is highest.

#### Technical Approach
```
Updated Module: src/lib/types/subscription.ts
├── PaymentProvider: 'razorpay' | 'stripe'   (already typed!)
├── SubscriptionDoc already has stripe fields  (stripeCustomerId, etc.)
└── PRICING_PLANS: Add USD/EUR/GBP pricing tiers

New Files:
├── src/app/api/webhooks/stripe/route.ts          # Stripe webhook handler
├── src/app/api/payments/stripe/create-checkout/route.ts  # Create Stripe Checkout session
├── src/lib/stripe.ts                              # Stripe client + helpers

Region Detection: src/lib/payment-routing.ts
├── Detect user region from IP/locale
├── India → Razorpay (INR)
├── US/EU/UK/Rest → Stripe (USD/EUR/GBP)
└── Manual override toggle on pricing page
```

**Implementation Steps**:
1. Install `stripe` package + configure environment variables
2. Create `src/lib/stripe.ts` with Stripe client initialization
3. Build Stripe Checkout session creation endpoint
4. Build Stripe webhook handler (payment_intent.succeeded, customer.subscription events)
5. Add region detection + payment provider routing logic
6. Update pricing page with multi-currency display + provider toggle
7. Update `PaymentRecord` and `Subscription` handling for Stripe events
8. Add multi-currency pricing to `PRICING_PLANS`
9. Test with Stripe test mode + deploy

#### Success Metrics
- International signups > 25% of total within 3 months
- Payment success rate > 95% (Stripe's standard)
- Revenue per user +40% (US/EU users pay more)

---

## Implementation Roadmap

### Phase 1: Core Competitive Features (Weeks 1-3)
| # | Feature | Days | Dependencies |
|---|---------|------|-------------|
| 1 | AI Auto-Tailor Resume to JD | 5-7 | None |
| 4 | Inline AI Bullet Point Rewriter | 3-4 | None |
| 6 | Resume Score History & Progress | 3-4 | None |

**Phase 1 Outcome**: Dramatically improved AI feature depth — users who analyze also auto-fix.

### Phase 2: Engagement & Retention (Weeks 3-5)
| # | Feature | Days | Dependencies |
|---|---------|------|-------------|
| 2 | Job Application Tracker | 5-6 | None |
| 3 | Real ATS Parser Simulation | 4-5 | None |
| 8 | Cover Letter Templates & Multi-Style | 3-4 | None |

**Phase 2 Outcome**: Daily-use engagement features — job tracker + ATS simulation keep users coming back.

### Phase 3: Growth & Expansion (Weeks 5-8)
| # | Feature | Days | Dependencies |
|---|---------|------|-------------|
| 5 | Chrome Extension | 5-6 | Feature #2 (Job Tracker) |
| 7 | Multi-Format Import (LinkedIn, OCR) | 4-5 | None |
| 10 | Stripe Global Payments | 4-5 | None |

**Phase 3 Outcome**: New acquisition channels (Chrome extension, LinkedIn import) + global monetization.

### Phase 4: Differentiation (Weeks 8-10)
| # | Feature | Days | Dependencies |
|---|---------|------|-------------|
| 9 | Collaborative Resume Review | 6-7 | WebSocket implementation |

**Phase 4 Outcome**: Unique social feature no competitor offers — drives viral growth.

---

## Effort Summary

| Metric | Value |
|--------|-------|
| **Total estimated effort** | 43-53 developer days |
| **New AI flows required** | 3 (auto-tailor, rewrite-bullet, normalize-import) |
| **New Prisma models** | 5 (JobApplication, ApplicationTimeline, ScoreHistory, UserAchievement, ReviewComment + related) |
| **New app routes** | 3 (/job-tracker, /progress, /review/[token]) |
| **New packages** | 1 (chrome-extension) |
| **Infrastructure changes** | WebSocket implementation, Stripe integration |

---

## Competitive Impact Matrix

| Feature | vs. Teal | vs. Jobscan | vs. Resume.io | vs. Rezi | Unique? |
|---------|----------|-------------|---------------|----------|---------|
| #1 Auto-Tailor | Parity | Parity | Advantage | Parity | No, but AI quality differentiates |
| #2 Job Tracker | Parity | Parity | Advantage | Advantage | No, but AI integration is unique |
| #3 ATS Simulation | Advantage | Parity | Advantage | Parity | Multi-ATS simulation is rare |
| #4 Inline Rewriter | Parity | Advantage | Parity | Parity | No, but speed (Groq 8B) differentiates |
| #5 Chrome Extension | Parity | Parity | Advantage | Parity | No, but tracker integration is unique |
| #6 Score History | Advantage | Advantage | Advantage | Advantage | **Yes — no competitor does this well** |
| #7 Multi-Import | Parity | Parity | Parity | Advantage | OCR + JSON Resume is unique combo |
| #8 Cover Letter 2.0 | Advantage | Advantage | Parity | Advantage | A/B variant comparison is unique |
| #9 Collaborative Review | **Advantage** | **Advantage** | **Advantage** | **Advantage** | **Yes — no competitor offers this** |
| #10 Stripe (Global) | Parity | Parity | Parity | Parity | Required for market expansion |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| AI auto-tailor produces low-quality rewrites | Use `groq-llama-70b` (powerful tier), validate output ATS score > input |
| Job tracker scope creep (CRM-like) | MVP: 5 columns, no automations. Iterate based on usage data |
| ATS simulation rules become outdated | Versioned rule engine, monthly review against real ATS updates |
| Chrome extension review rejection | Follow Manifest V3 strictly, minimal permissions, privacy-first design |
| WebSocket implementation complexity | Start with polling fallback, upgrade to WebSocket incrementally |
| Stripe compliance requirements | Use Stripe Checkout (hosted) to offload PCI compliance |

---

## Success Definition

After implementing all 10 features, ResumeBuddy should achieve:

1. **Competitive parity** with Teal on job tracking + resume management
2. **Competitive parity** with Jobscan on ATS simulation + keyword optimization
3. **Clear superiority** on AI features (12 → 15 flows, inline rewriting, auto-tailor)
4. **Unique differentiation** on collaborative review and score gamification
5. **Global monetization** via Stripe (exit India-only limitation)
6. **10× daily engagement** via job tracker + Chrome extension + progress dashboard

> _"ResumeBuddy: The AI-powered job search companion that doesn't just analyze your resume — it fixes it, tracks your applications, and helps you land the job."_
