# ResumeBuddy - Comprehensive Feature Enhancement Plan

> **Document Version:** 1.0  
> **Date:** January 31, 2026  
> **Status:** Planning Phase  
> **Priority System:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Application State](#current-application-state)
3. [Feature Enhancements](#feature-enhancements)
   - [AI & Analysis Features](#ai--analysis-features)
   - [User Experience Features](#user-experience-features)
   - [Subscription & Monetization](#subscription--monetization)
   - [Resume Creation & Export](#resume-creation--export)
   - [Collaboration & Social Features](#collaboration--social-features)
   - [Analytics & Insights](#analytics--insights)
   - [Admin & Management](#admin--management)
4. [Technical Enhancements](#technical-enhancements)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Success Metrics](#success-metrics)

---

## Executive Summary

ResumeBuddy is a Next.js 16 + React 19 SaaS application providing AI-powered resume analysis with multi-provider AI support (Groq → Gemini → OpenRouter), Firebase Auth + Firestore, and tiered subscriptions (Free/Pro via Razorpay). This document outlines a comprehensive plan to enhance existing features and introduce new capabilities to increase user value, engagement, and revenue.

### Key Enhancement Areas:
- **AI Features:** 15 new AI-powered capabilities
- **UX Improvements:** 12 user experience enhancements
- **Monetization:** 8 new revenue opportunities
- **Analytics:** 6 advanced analytics features
- **Technical:** 10 infrastructure improvements

---

## Current Application State

### ✅ Existing Features

#### AI Flows (6 flows)
1. **Resume Analysis** - ATS scoring, keyword analysis, quality metrics
2. **Resume Improvements** - AI-generated enhancement suggestions
3. **Q&A Generation** - Interview preparation questions (Pro)
4. **Interview Questions** - Tailored interview prep (Pro)
5. **Cover Letter Generation** - AI-powered cover letters
6. **Resume Parsing** - Intelligent resume data extraction
7. **Job Description Structuring** - JD parsing and analysis

#### User Features
- Resume upload (PDF, DOCX, TXT)
- Job description input (manual + URL scraping)
- Role-based presets (14+ job roles)
- LaTeX PDF export (7 templates: FAANG, Jake, etc.)
- User profile management
- Dashboard analytics

#### Infrastructure
- Multi-provider AI with smart routing
- Rate limiting (Free: 2 credits/day, Pro: 10 credits/day)
- Response caching (40-60% reduction)
- Subscription management (Razorpay)
- Admin dashboard with usage analytics
- Firebase Auth + Firestore

### 🎯 Current Limitations & Pain Points

1. **Limited AI Features** - Only 7 AI flows, competitors have 20+
2. **No Collaboration** - Single-user only, no team features
3. **Basic Analytics** - Limited insights into resume performance
4. **Static Templates** - Cannot customize LaTeX templates
5. **No Version Control** - Cannot track resume changes
6. **Limited Export Options** - Only LaTeX PDF, no DOCX/HTML
7. **No A/B Testing** - Cannot test different resume versions
8. **Missing Job Tracking** - No application status tracking
9. **No Learning Resources** - No tutorials or guidance
10. **Limited Mobile Experience** - Not optimized for mobile editing

---

## Feature Enhancements

### 1. AI & Analysis Features

#### 🔴 1.1 Resume Gap Analysis & Career Path Suggestions
**Priority:** Critical | **Complexity:** Medium | **Impact:** High

**Description:**
AI analyzes career progression and identifies skill/experience gaps for target roles, providing actionable roadmap.

**Features:**
- Skill gap identification with severity levels
- Timeline to role-readiness estimation
- Course/certification recommendations
- Industry-specific career paths
- Salary progression predictions

**Implementation:**
```typescript
// src/ai/flows/analyze-career-gap.ts
export const AnalyzeCareerGapInputSchema = z.object({
  resumeText: z.string(),
  targetRole: z.string(),
  targetLevel: z.enum(['Entry', 'Mid', 'Senior', 'Executive']),
  industry: z.string(),
});

export const AnalyzeCareerGapOutputSchema = z.object({
  skillGaps: z.array(z.object({
    skill: z.string(),
    currentLevel: z.number(), // 0-100
    requiredLevel: z.number(),
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
    estimatedTimeToAcquire: z.string(), // "3-6 months"
    resources: z.array(z.object({
      type: z.enum(['Course', 'Certification', 'Project', 'Book']),
      name: z.string(),
      provider: z.string(),
      url: z.string(),
      cost: z.string(),
    })),
  })),
  careerPath: z.object({
    currentStage: z.string(),
    nextSteps: z.array(z.string()),
    timeToTarget: z.string(),
    milestones: z.array(z.object({
      title: z.string(),
      timeframe: z.string(),
      requirements: z.array(z.string()),
    })),
  }),
  salaryProjection: z.object({
    currentEstimate: z.string(),
    targetEstimate: z.string(),
    growthPotential: z.string(),
  }),
});
```

**Server Action:**
```typescript
// src/app/actions.ts
export async function runCareerGapAnalysisAction(input: AnalyzeCareerGapInput & { userId: string }) {
  await assertFeatureAllowed(input.userId, 'career-gap-analysis'); // Pro feature
  await enforceRateLimitAsync(input.userId, 'career-gap-analysis');
  
  const analysis = await analyzeCareerGap(input);
  await saveToDb(input.userId, { careerGapAnalysis: analysis });
  return analysis;
}
```

**UI Component:**
```tsx
// src/components/career-gap-tab.tsx
- Visual skill gap chart (radar/bar chart)
- Timeline visualization for career path
- Resource cards with links to courses
- Milestone checklist
- Export to PDF roadmap
```

**Monetization:**
- Free: View basic skill gaps only
- Pro: Full analysis + resources + career path + salary insights

---

#### 🟠 1.2 Resume Keyword Optimizer with Real-Time Suggestions
**Priority:** High | **Complexity:** Low | **Impact:** High

**Description:**
Real-time keyword suggestions while editing resume to improve ATS compatibility.

**Features:**
- Live keyword density tracking
- ATS-friendly synonym suggestions
- Industry-specific keyword database
- Competitive keyword analysis
- Auto-highlight missing critical keywords

**Implementation:**
```typescript
// src/hooks/use-keyword-suggestions.ts
export function useKeywordSuggestions(
  resumeText: string,
  jobDescription: string,
  options?: { debounceMs?: number }
) {
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const debouncedAnalyze = useDebouncedCallback(async () => {
    setIsAnalyzing(true);
    const result = await analyzeKeywordsRealtime({ resumeText, jobDescription });
    setSuggestions(result.suggestions);
    setIsAnalyzing(false);
  }, options?.debounceMs || 1000);
  
  useEffect(() => {
    if (resumeText && jobDescription) {
      debouncedAnalyze();
    }
  }, [resumeText, jobDescription]);
  
  return { suggestions, isAnalyzing };
}
```

**UI Component:**
```tsx
// src/components/keyword-optimizer-panel.tsx
- Floating panel with keyword suggestions
- Click-to-insert functionality
- Keyword density meter
- ATS score live preview
- Color-coded priority indicators
```

**Smart Router Config:**
```typescript
// Use fast model for real-time suggestions
'keyword-suggestions': { 
  primary: 'groq-llama-8b', 
  fallback: 'groq-llama-70b', 
  lastResort: 'gemini' 
}
```

---

#### 🟠 1.3 Multi-Resume Comparison & Benchmarking
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Description:**
Compare multiple versions of resume or benchmark against industry standards.

**Features:**
- Side-by-side resume comparison
- Diff highlighting (added/removed content)
- Score comparison across metrics
- Industry benchmark data
- Best practices recommendations

**Implementation:**
```typescript
// src/ai/flows/compare-resumes.ts
export const CompareResumesInputSchema = z.object({
  resumes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    text: z.string(),
  })).min(2).max(5),
  jobDescription: z.string().optional(),
  compareAgainstIndustry: z.boolean().default(false),
});

export const CompareResumesOutputSchema = z.object({
  comparison: z.array(z.object({
    resumeId: z.string(),
    resumeName: z.string(),
    scores: z.object({
      atsScore: z.number(),
      contentCoverage: z.number(),
      readability: z.number(),
      keywordDensity: z.number(),
    }),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    rank: z.number(), // 1 = best
  })),
  recommendations: z.object({
    bestVersion: z.string(),
    suggestedImprovements: z.array(z.string()),
    mergeStrategy: z.string(), // How to combine best parts
  }),
  industryBenchmark: z.object({
    avgAtsScore: z.number(),
    avgWordCount: z.number(),
    commonKeywords: z.array(z.string()),
    percentileRank: z.number(),
  }).optional(),
});
```

**UI Component:**
```tsx
// src/app/compare/page.tsx
- Upload/select multiple resumes
- Comparison table with metrics
- Visual diff view
- Chart comparing scores
- Download comparison report
```

---

#### 🟡 1.4 Video Resume Analysis & Script Generation
**Priority:** Medium | **Complexity:** High | **Impact:** Medium

**Description:**
Generate video resume scripts and analyze existing video resumes.

**Features:**
- Video resume script generation
- Timing recommendations (30s, 60s, 90s versions)
- Tone and pacing suggestions
- Video resume best practices
- Teleprompter view

**Implementation:**
```typescript
// src/ai/flows/generate-video-script.ts
export const GenerateVideoScriptOutputSchema = z.object({
  scripts: z.object({
    '30s': z.string(),
    '60s': z.string(),
    '90s': z.string(),
  }),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    duration: z.string(),
    tips: z.array(z.string()),
  })),
  deliveryTips: z.array(z.string()),
  teleprompterFormat: z.string(),
});
```

---

#### 🟡 1.5 LinkedIn Profile Optimizer
**Priority:** Medium | **Complexity:** Medium | **Impact:** High

**Description:**
Analyze and optimize LinkedIn profiles based on resume and target role.

**Features:**
- Headline suggestions
- About section optimization
- Skill endorsement strategy
- Experience bullet improvements
- LinkedIn SEO keywords

**Implementation:**
```typescript
// src/ai/flows/optimize-linkedin.ts
export const OptimizeLinkedInOutputSchema = z.object({
  headline: z.object({
    current: z.string(),
    suggestions: z.array(z.object({
      text: z.string(),
      rationale: z.string(),
      seoScore: z.number(),
    })),
  }),
  aboutSection: z.object({
    optimized: z.string(),
    keywordDensity: z.number(),
    readabilityScore: z.number(),
  }),
  skills: z.object({
    recommended: z.array(z.string()),
    toRemove: z.array(z.string()),
    endorsementPriority: z.array(z.string()),
  }),
  experienceBullets: z.array(z.object({
    original: z.string(),
    improved: z.string(),
    improvements: z.array(z.string()),
  })),
});
```

---

#### 🟢 1.6 Salary Negotiation Insights
**Priority:** Low | **Complexity:** Medium | **Impact:** Medium

**Description:**
Provide salary ranges, negotiation strategies, and market data.

**Features:**
- Salary range estimation by role/location
- Negotiation talking points
- Benefits package analysis
- Market trend data
- Counter-offer templates

**Implementation:**
```typescript
// Integration with salary APIs (Glassdoor, PayScale)
// AI analysis of resume to determine market value
```

---

#### 🟠 1.7 Resume Translation & Localization
**Priority:** High | **Complexity:** High | **Impact:** High

**Description:**
Translate resumes to multiple languages with cultural localization.

**Features:**
- Multi-language support (10+ languages)
- Cultural format adaptation (US vs EU vs Asia)
- Localized templates
- Currency/date format conversion
- Industry terminology localization

**Implementation:**
```typescript
// src/ai/flows/translate-resume.ts
export const TranslateResumeInputSchema = z.object({
  resumeText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  targetMarket: z.enum(['US', 'EU', 'UK', 'Asia', 'LatAm']),
  localizeFormat: z.boolean().default(true),
});

export const TranslateResumeOutputSchema = z.object({
  translatedText: z.string(),
  culturalAdaptations: z.array(z.object({
    section: z.string(),
    change: z.string(),
    rationale: z.string(),
  })),
  formatChanges: z.object({
    dateFormat: z.string(),
    phoneFormat: z.string(),
    addressFormat: z.string(),
  }),
  terminology: z.array(z.object({
    original: z.string(),
    translated: z.string(),
    context: z.string(),
  })),
});
```

---

#### 🟡 1.8 Portfolio/Project Recommendations
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Suggest portfolio projects to strengthen resume for target role.

**Features:**
- Project ideas based on skill gaps
- Technology stack recommendations
- Estimated time to complete
- GitHub repository templates
- Step-by-step project guides

---

#### 🟡 1.9 Resume Readability & Accessibility Checker
**Priority:** Medium | **Complexity:** Low | **Impact:** Low

**Description:**
Ensure resume is readable and accessible to all audiences.

**Features:**
- Flesch-Kincaid readability score
- ADA compliance checking
- Font size/contrast recommendations
- Screen reader compatibility
- Plain language suggestions

---

#### 🔴 1.10 Smart Resume Tailoring Engine
**Priority:** Critical | **Complexity:** High | **Impact:** High

**Description:**
Automatically tailor resume to specific job postings with one click.

**Features:**
- Auto-detect relevant experience
- Reorder sections by relevance
- Highlight matching skills
- Generate custom summary
- Suggest bullet point modifications

**Implementation:**
```typescript
// src/ai/flows/tailor-resume.ts
export const TailorResumeInputSchema = z.object({
  resumeData: z.object({
    // Structured resume data
    summary: z.string(),
    experience: z.array(z.any()),
    skills: z.array(z.string()),
    education: z.array(z.any()),
  }),
  jobDescription: z.string(),
  targetRole: z.string(),
  aggressiveness: z.enum(['conservative', 'moderate', 'aggressive']),
});

export const TailorResumeOutputSchema = z.object({
  tailoredResume: z.object({
    // Modified resume data
  }),
  changes: z.array(z.object({
    section: z.string(),
    type: z.enum(['added', 'removed', 'modified', 'reordered']),
    before: z.string(),
    after: z.string(),
    rationale: z.string(),
  })),
  matchScore: z.number(),
  tailoringReport: z.object({
    relevanceBoost: z.string(),
    keywordAlignment: z.string(),
    sectionOptimization: z.string(),
  }),
});
```

---

### 2. User Experience Features

#### 🔴 2.1 Resume Version Control & History
**Priority:** Critical | **Complexity:** Medium | **Impact:** High

**Description:**
Track all resume changes with Git-like version control.

**Features:**
- Automatic version snapshots
- Version comparison (diff view)
- Restore previous versions
- Branch/fork resume versions
- Version tags (e.g., "Software Engineer V3")
- Change history timeline

**Implementation:**
```typescript
// src/lib/firestore-versioning.ts
export interface ResumeVersion {
  id: string;
  userId: string;
  resumeId: string;
  version: number;
  timestamp: Timestamp;
  resumeData: any;
  metadata: {
    name: string;
    description?: string;
    tags: string[];
    parentVersion?: string;
  };
  changes: {
    sections: string[];
    wordCountDiff: number;
    majorChanges: string[];
  };
}

export async function saveResumeVersion(
  userId: string,
  resumeId: string,
  resumeData: any,
  metadata?: Partial<ResumeVersion['metadata']>
): Promise<string> {
  // Auto-increment version number
  // Save to versions/{userId}/resumes/{resumeId}/versions/{versionId}
}

export async function getVersionHistory(
  userId: string,
  resumeId: string
): Promise<ResumeVersion[]> {
  // Return all versions sorted by timestamp
}

export async function compareVersions(
  version1: string,
  version2: string
): Promise<VersionDiff> {
  // Generate diff between two versions
}
```

**UI Component:**
```tsx
// src/components/version-history-panel.tsx
- Timeline view of all versions
- Diff viewer with highlighting
- One-click restore
- Version branching UI
- Export version as separate resume
```

**Firestore Structure:**
```
users/{uid}/
  resumes/{resumeId}/
    current: { ... } // Current version
    versions/{versionId}/
      data: { ... }
      metadata: { ... }
      timestamp: ...
```

---

#### 🟠 2.2 Drag-and-Drop Resume Builder
**Priority:** High | **Complexity:** High | **Impact:** High

**Description:**
Visual resume builder with drag-and-drop section management.

**Features:**
- Drag sections to reorder
- Add/remove sections easily
- Pre-filled templates
- Real-time preview
- Mobile-responsive builder

**Implementation:**
```tsx
// src/components/resume-builder/index.tsx
import { DndContext, closestCenter, PointerSensor, useSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';

export function ResumeBuilder() {
  const [sections, setSections] = useState<ResumeSection[]>([
    { id: 'summary', type: 'summary', data: {} },
    { id: 'experience', type: 'experience', data: [] },
    { id: 'education', type: 'education', data: [] },
    { id: 'skills', type: 'skills', data: [] },
  ]);
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <SortableSection key={section.id} section={section} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

#### 🟠 2.3 Resume Templates Marketplace
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Description:**
User-generated and premium resume templates marketplace.

**Features:**
- Browse template library (50+ templates)
- Filter by industry/role/design
- Template preview with sample data
- User ratings and reviews
- Premium templates (Pro only)
- Template customization

**Implementation:**
```typescript
// src/lib/types/template.ts
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'modern' | 'minimal' | 'executive';
  industry: string[];
  isPremium: boolean;
  price?: number;
  previewUrl: string;
  thumbnailUrl: string;
  author: {
    id: string;
    name: string;
    verified: boolean;
  };
  stats: {
    downloads: number;
    rating: number;
    reviews: number;
  };
  tags: string[];
  latexSource: string;
  customizationOptions: TemplateCustomization[];
}

export interface TemplateCustomization {
  id: string;
  label: string;
  type: 'color' | 'font' | 'spacing' | 'layout';
  options: any[];
  default: any;
}
```

**Pages:**
```tsx
// src/app/templates/page.tsx - Template marketplace
// src/app/templates/[id]/page.tsx - Template detail
// src/app/templates/create/page.tsx - Create custom template (Pro)
```

---

#### 🟡 2.4 Dark Mode & Theme Customization
**Priority:** Medium | **Complexity:** Low | **Impact:** Medium

**Description:**
Full dark mode support and customizable color themes.

**Features:**
- System preference detection
- Manual toggle
- Multiple color schemes (8+ themes)
- Custom theme builder (Pro)
- Theme preview
- Export theme settings

**Implementation:**
```tsx
// Already has next-themes, enhance with:
// src/components/theme-customizer.tsx
- Color picker for primary/accent
- Font family selector
- Spacing scale adjuster
- Save custom themes
- Share theme codes
```

---

#### 🟠 2.5 Mobile App (Progressive Web App)
**Priority:** High | **Complexity:** High | **Impact:** High

**Description:**
Full-featured PWA with offline support and native app feel.

**Features:**
- Install as app (iOS/Android)
- Offline mode with service workers
- Push notifications
- Mobile-optimized UI
- Camera resume upload
- Mobile PDF preview

**Implementation:**
```javascript
// public/sw.js - Already exists, enhance:
- Cache strategies for offline editing
- Background sync for resume saves
- Push notification support

// src/app/manifest.ts - Already exists, enhance:
- Add screenshots
- Add shortcuts
- Add share target
```

**New Features:**
```tsx
// src/components/mobile/camera-upload.tsx
- Use device camera to capture resume
- OCR text extraction
- Image preprocessing

// src/hooks/use-offline-status.ts
- Detect online/offline state
- Queue actions when offline
- Sync when back online
```

---

#### 🟡 2.6 Resume Templates Preview with AI-Generated Samples
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Preview templates with AI-generated realistic sample data.

**Features:**
- Generate sample resume data for any role
- Preview template with your data
- Side-by-side comparison
- Responsive preview (desktop/mobile)

---

#### 🟢 2.7 Onboarding Tutorial & Interactive Guide
**Priority:** Low | **Complexity:** Low | **Impact:** Low

**Description:**
Interactive walkthrough for new users.

**Features:**
- Step-by-step tutorial
- Interactive tooltips
- Progress tracking
- Skip option
- Video tutorials
- Help center integration

**Implementation:**
```tsx
// Use react-joyride or driver.js
import { Joyride, Step } from 'react-joyride';

const steps: Step[] = [
  {
    target: '.resume-upload',
    content: 'Start by uploading your resume...',
  },
  {
    target: '.job-description-input',
    content: 'Paste the job description you\'re applying for...',
  },
  // ... more steps
];
```

---

#### 🟠 2.8 Keyboard Shortcuts & Power User Features
**Priority:** High | **Complexity:** Low | **Impact:** Medium

**Description:**
Comprehensive keyboard shortcuts for efficiency.

**Features:**
- Keyboard shortcut panel (Cmd/Ctrl + K)
- Quick actions (analyze, export, save)
- Navigation shortcuts
- Custom shortcut mapping
- Vim mode for text editing

**Implementation:**
```tsx
// src/hooks/use-keyboard-shortcuts.ts
import { useHotkeys } from 'react-hotkeys-hook';

export function useAppShortcuts() {
  useHotkeys('ctrl+k,cmd+k', () => openCommandPalette());
  useHotkeys('ctrl+s,cmd+s', () => saveResume());
  useHotkeys('ctrl+e,cmd+e', () => exportResume());
  useHotkeys('ctrl+a,cmd+a', () => analyzeResume());
  // ... more shortcuts
}
```

---

#### 🟡 2.9 Smart Search & Command Palette
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Spotlight-like command palette for quick navigation.

**Features:**
- Fuzzy search across all features
- Recent actions
- Quick navigation
- Action suggestions
- Keyboard-driven

**Implementation:**
```tsx
// src/components/command-palette.tsx
import { Command } from 'cmdk';

export function CommandPalette() {
  return (
    <Command.Dialog>
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => analyzeResume()}>
            Analyze Resume
          </Command.Item>
          <Command.Item onSelect={() => exportPDF()}>
            Export as PDF
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Pages">
          <Command.Item onSelect={() => navigate('/dashboard')}>
            Dashboard
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

---

#### 🔴 2.10 Smart Auto-Save & Conflict Resolution
**Priority:** Critical | **Complexity:** Medium | **Impact:** High

**Description:**
Auto-save with conflict detection for multi-device editing.

**Features:**
- Auto-save every 30 seconds
- Visual save status indicator
- Conflict detection (multiple devices)
- Merge conflict resolution UI
- Manual save option
- Save history

**Implementation:**
```typescript
// src/hooks/use-auto-save.ts
export function useAutoSave(
  data: any,
  saveFunction: (data: any) => Promise<void>,
  options?: { interval?: number; onConflict?: () => void }
) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const debouncedSave = useDebouncedCallback(async () => {
    setIsSaving(true);
    try {
      await saveFunction(data);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      if (error.code === 'conflict') {
        options?.onConflict?.();
      }
    } finally {
      setIsSaving(false);
    }
  }, options?.interval || 30000);
  
  useEffect(() => {
    setHasUnsavedChanges(true);
    debouncedSave();
  }, [data]);
  
  return { lastSaved, isSaving, hasUnsavedChanges };
}
```

---

### 3. Subscription & Monetization

#### 🔴 3.1 Team Plans & Workspace Collaboration
**Priority:** Critical | **Complexity:** High | **Impact:** High

**Description:**
Multi-user workspaces for teams, recruiters, and career counselors.

**Features:**
- Team workspaces (5, 10, 50, unlimited users)
- Role-based access (Admin, Editor, Viewer)
- Shared resume library
- Team analytics dashboard
- Centralized billing
- Bulk user management

**Pricing Tiers:**
```typescript
export const TEAM_PLANS = [
  {
    id: 'team-starter',
    name: 'Team Starter',
    tier: 'team',
    seats: 5,
    pricePerSeat: 15, // $15/seat/month
    features: [
      'All Pro features per user',
      'Shared workspace',
      'Team analytics',
      'Priority support',
    ],
  },
  {
    id: 'team-growth',
    name: 'Team Growth',
    tier: 'team',
    seats: 10,
    pricePerSeat: 12,
    features: [
      'All Starter features',
      'Custom templates',
      'API access',
      'SSO (Google, Microsoft)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    seats: -1, // Unlimited
    pricePerSeat: 'custom',
    features: [
      'All Growth features',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment',
    ],
  },
];
```

**Implementation:**
```typescript
// src/lib/types/workspace.ts
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  plan: 'team-starter' | 'team-growth' | 'enterprise';
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  billing: {
    seats: number;
    pricePerSeat: number;
    nextBillingDate: Date;
    totalAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
}

// src/lib/workspace-service.ts
export async function createWorkspace(
  ownerId: string,
  name: string,
  plan: string
): Promise<Workspace> {
  // Create workspace in Firestore
  // Initialize billing subscription
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: WorkspaceMember['role']
): Promise<void> {
  // Send invitation email
  // Create pending invitation document
}

export async function checkWorkspaceAccess(
  userId: string,
  workspaceId: string,
  requiredRole?: WorkspaceMember['role']
): Promise<boolean> {
  // Check if user is member and has required role
}
```

**Firestore Structure:**
```
workspaces/{workspaceId}/
  data: { name, ownerId, plan, ... }
  members/{userId}: { role, joinedAt, ... }
  resumes/{resumeId}: { ... }
  analytics/: { ... }
  invitations/{email}: { role, invitedBy, expiresAt }
```

---

#### 🟠 3.2 Pay-Per-Use Credits System
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Description:**
Alternative to subscription - buy AI credits as needed.

**Features:**
- Buy credit packs (10, 50, 100, 500 credits)
- No expiration on credits
- Credit usage tracking
- Auto-top-up option
- Gift credits to friends

**Pricing:**
```typescript
export const CREDIT_PACKS = [
  { credits: 10, price: 5, savings: 0 },
  { credits: 50, price: 20, savings: 15 }, // $0.40/credit vs $0.50
  { credits: 100, price: 35, savings: 30 },
  { credits: 500, price: 150, savings: 40 },
];
```

**Implementation:**
```typescript
// src/lib/credits-service.ts
export async function purchaseCredits(
  userId: string,
  packId: string
): Promise<{ success: boolean; newBalance: number }> {
  // Process payment via Razorpay/Stripe
  // Add credits to user balance
  // Log transaction
}

export async function deductCredits(
  userId: string,
  amount: number,
  operation: string
): Promise<{ success: boolean; remaining: number }> {
  // Check balance
  // Deduct credits
  // Log usage
}

export async function getCreditBalance(userId: string): Promise<number> {
  // Return current balance
}
```

---

#### 🟡 3.3 Referral Program & Affiliate Marketing
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Reward users for referrals, create affiliate program.

**Features:**
- Unique referral links
- 20% off for referrer & referee
- Referral dashboard
- Payout tracking (affiliates)
- Multi-tier rewards

**Implementation:**
```typescript
// src/lib/referral-service.ts
export interface ReferralData {
  userId: string;
  referralCode: string;
  referrals: {
    email: string;
    status: 'pending' | 'signed-up' | 'converted';
    date: Date;
    reward: number;
  }[];
  totalEarned: number;
}

export async function generateReferralCode(userId: string): Promise<string> {
  // Generate unique code
  // Save to database
}

export async function trackReferral(
  referralCode: string,
  email: string
): Promise<void> {
  // Track signup from referral
  // Apply discount to new user
}

export async function processReferralReward(
  userId: string,
  referredUserId: string
): Promise<void> {
  // When referred user subscribes
  // Grant reward to referrer (credits/discount)
}
```

---

#### 🟡 3.4 White-Label Solution for Career Services
**Priority:** Medium | **Complexity:** High | **Impact:** High

**Description:**
Sell white-labeled version to universities, career coaches, recruiters.

**Features:**
- Custom branding (logo, colors, domain)
- Custom pricing tiers
- Admin portal for clients
- API access
- Embedded widgets
- Custom templates

**Pricing:**
- Setup fee: $5,000
- Monthly: $500/month (up to 100 users)
- Enterprise: Custom pricing

---

#### 🟠 3.5 Annual Plans with Discount
**Priority:** High | **Complexity:** Low | **Impact:** Medium

**Description:**
Offer annual subscriptions at 20% discount.

**Implementation:**
```typescript
export const PRICING_PLANS = [
  {
    id: 'pro-monthly',
    tier: 'pro',
    interval: 'month',
    priceINR: 49900, // ₹499/month
    priceUSD: 999, // $9.99/month
  },
  {
    id: 'pro-annual',
    tier: 'pro',
    interval: 'year',
    priceINR: 479900, // ₹4799/year (₹399/month, 20% off)
    priceUSD: 9590, // $95.90/year ($7.99/month, 20% off)
    highlighted: true,
  },
];
```

---

#### 🟢 3.6 Student & Non-Profit Discounts
**Priority:** Low | **Complexity:** Low | **Impact:** Low

**Description:**
50% discount for students and non-profits.

**Implementation:**
```typescript
export async function verifyStudent(email: string): Promise<boolean> {
  // Check .edu domain
  // Or integrate with SheerID, UNiDAYS
}

export async function applyDiscount(
  userId: string,
  discountType: 'student' | 'non-profit'
): Promise<void> {
  // Apply 50% discount to subscription
  // Set expiration (annual renewal with verification)
}
```

---

#### 🟡 3.7 Premium Resume Reviews by Experts
**Priority:** Medium | **Complexity:** High | **Impact:** Medium

**Description:**
Paid service for professional resume review by industry experts.

**Features:**
- 1-on-1 review sessions
- Video call option
- Written feedback report
- Unlimited revisions
- Industry-specific experts
- 48-hour turnaround

**Pricing:**
- Basic Review: $49 (written feedback)
- Premium Review: $99 (30-min call + written)
- Executive Review: $199 (60-min call + complete overhaul)

**Implementation:**
```typescript
// Marketplace for verified resume reviewers
// Booking system (Calendly integration)
// Payment processing
// Review delivery system
```

---

#### 🟡 3.8 Job Application Tracking Add-on
**Priority:** Medium | **Complexity:** High | **Impact:** High

**Description:**
Premium add-on for tracking job applications.

**Features:**
- Track all applications
- Status updates (applied, interview, offer, rejected)
- Follow-up reminders
- Success rate analytics
- Integration with job boards
- Email parsing for auto-updates

**Pricing:**
- Free: Track 10 applications
- Pro: Unlimited tracking (included)
- Enterprise: Advanced analytics + team tracking

---

### 4. Resume Creation & Export

#### 🔴 4.1 DOCX Export with Formatting Preservation
**Priority:** Critical | **Complexity:** Medium | **Impact:** High

**Description:**
Export to Microsoft Word with full formatting.

**Implementation:**
```typescript
// Already has docx library, enhance:
export async function exportDocxAdvanced(
  resumeData: any,
  template: 'professional' | 'modern' | 'creative'
): Promise<Blob> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Generate formatted sections
      ],
    }],
    styles: {
      // Custom styles matching template
    },
  });
  
  return await Packer.toBlob(doc);
}
```

---

#### 🟠 4.2 HTML/Web Resume Export
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Description:**
Export as standalone HTML page with hosting option.

**Features:**
- Responsive HTML template
- Custom domain support
- SEO optimization
- Analytics integration
- Password protection option
- PDF print stylesheet

**Implementation:**
```typescript
// src/lib/html-export.ts
export async function generateHTMLResume(
  resumeData: any,
  template: string,
  options?: {
    customDomain?: string;
    enableAnalytics?: boolean;
    passwordProtect?: string;
  }
): Promise<{ html: string; css: string; js: string }> {
  // Generate standalone HTML page
  // Include inline CSS
  // Add print stylesheet
  // Optional: deploy to Vercel/Netlify
}
```

**Hosting Service:**
```
{username}.resumebuddy.app
- Free subdomain for Pro users
- Custom domain: $5/month
```

---

#### 🟠 4.3 Custom LaTeX Template Editor
**Priority:** High | **Complexity:** High | **Impact:** Medium

**Description:**
Visual editor for creating custom LaTeX templates.

**Features:**
- Live preview while editing
- LaTeX syntax highlighting
- Template variables system
- Color/font customization
- Section layout designer
- Save custom templates
- Share templates (marketplace)

**Implementation:**
```tsx
// src/app/templates/create/page.tsx
import CodeMirror from '@uiw/react-codemirror';
import { latex } from '@codemirror/lang-latex';

export function LatexTemplateEditor() {
  const [latexSource, setLatexSource] = useState('');
  const [preview, setPreview] = useState('');
  
  const updatePreview = useDebouncedCallback(async () => {
    const result = await compileLatex(latexSource);
    setPreview(result.pdfUrl);
  }, 1000);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <CodeMirror
        value={latexSource}
        height="100vh"
        extensions={[latex()]}
        onChange={(value) => {
          setLatexSource(value);
          updatePreview();
        }}
      />
      <iframe src={preview} className="w-full h-screen" />
    </div>
  );
}
```

---

#### 🟡 4.4 Canva-Style Visual Resume Builder
**Priority:** Medium | **Complexity:** Very High | **Impact:** High

**Description:**
Drag-and-drop visual editor like Canva for creative resumes.

**Features:**
- Visual element library
- Drag-and-drop positioning
- Custom shapes and icons
- Color palette generator
- Font pairing suggestions
- Export to PDF/PNG

**Tech Stack:**
- fabric.js or Konva.js for canvas
- React DnD for drag-and-drop
- html2canvas for export

---

#### 🟡 4.5 Batch Export for Multiple Resumes
**Priority:** Medium | **Complexity:** Low | **Impact:** Low

**Description:**
Export multiple resume versions at once.

**Features:**
- Select multiple resumes
- Choose export format per resume
- ZIP download
- Custom naming convention
- Bulk template application

---

#### 🟢 4.6 QR Code Integration
**Priority:** Low | **Complexity:** Low | **Impact:** Low

**Description:**
Add QR codes linking to portfolio, LinkedIn, or web resume.

**Implementation:**
```typescript
import QRCode from 'qrcode';

export async function generateQRCode(url: string): Promise<string> {
  return await QRCode.toDataURL(url);
}

// Add to LaTeX templates
// Add to HTML exports
```

---

### 5. Collaboration & Social Features

#### 🟠 5.1 Peer Resume Review Marketplace
**Priority:** High | **Complexity:** High | **Impact:** Medium

**Description:**
Platform for users to review each other's resumes.

**Features:**
- Submit resume for review
- Earn credits by reviewing others
- Rating system
- Anonymized reviews option
- Expert badge system
- Review quality scoring

**Implementation:**
```typescript
// src/lib/peer-review.ts
export interface ReviewRequest {
  id: string;
  userId: string;
  resumeId: string;
  status: 'pending' | 'in-review' | 'completed';
  priority: 'normal' | 'urgent';
  credits: number; // Credits offered for review
  requirements: {
    industry?: string;
    level?: string;
    reviewType: 'quick' | 'detailed';
  };
  createdAt: Date;
}

export interface ReviewSubmission {
  id: string;
  requestId: string;
  reviewerId: string;
  rating: number; // 1-5 stars
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    overallComment: string;
  };
  creditsEarned: number;
  submittedAt: Date;
}
```

---

#### 🟡 5.2 Public Resume Gallery
**Priority:** Medium | **Complexity:** Medium | **Impact:** Low

**Description:**
Showcase best resumes (with user permission) for inspiration.

**Features:**
- Curated gallery
- Filter by industry/role
- Upvote/favorite
- Download inspiration
- Success stories

---

#### 🟡 5.3 Resume Sharing & Collaboration
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Share resume for feedback from friends/mentors.

**Features:**
- Generate shareable link
- Comment on specific sections
- Suggest edits
- Real-time collaboration
- Permission levels (view/comment/edit)

**Implementation:**
```typescript
// Similar to Google Docs comments
export interface ResumeShare {
  id: string;
  resumeId: string;
  ownerId: string;
  sharedWith: {
    email: string;
    permission: 'view' | 'comment' | 'edit';
    invitedAt: Date;
  }[];
  publicLink?: string;
  expiresAt?: Date;
}

export interface Comment {
  id: string;
  resumeId: string;
  userId: string;
  section: string; // Which resume section
  position: { line: number; character: number };
  text: string;
  resolved: boolean;
  replies: Comment[];
  createdAt: Date;
}
```

---

#### 🟢 5.4 Success Stories & Testimonials
**Priority:** Low | **Complexity:** Low | **Impact:** Low

**Description:**
Users share job success stories after using ResumeBuddy.

**Features:**
- Submit success story
- Before/after resume comparison
- Interview tips shared
- Company tags
- Featured stories on landing page

---

### 6. Analytics & Insights

#### 🔴 6.1 Resume Performance Dashboard
**Priority:** Critical | **Complexity:** Medium | **Impact:** High

**Description:**
Comprehensive analytics on resume performance over time.

**Features:**
- ATS score trends
- Keyword optimization progress
- Version performance comparison
- Industry benchmarking
- Personalized improvement recommendations

**Implementation:**
```tsx
// src/app/analytics/page.tsx
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <StatsGrid>
        <StatCard
          title="Current ATS Score"
          value={85}
          trend="+12%"
          chart={<MiniLineChart data={atsHistory} />}
        />
        <StatCard
          title="Keyword Match"
          value="78%"
          trend="+5%"
        />
      </StatsGrid>
      
      <Card>
        <CardHeader>
          <CardTitle>Score History</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={scoreHistory} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Industry Benchmark</CardTitle>
        </CardHeader>
        <CardContent>
          <RadarChart
            data={{
              current: userScores,
              average: industryAverage,
              top10: top10Average,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

#### 🟠 6.2 A/B Testing for Resume Versions
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Description:**
Track which resume version performs better.

**Features:**
- Create A/B test campaigns
- Track application outcomes
- Statistical significance testing
- Winner recommendation
- Test history

**Implementation:**
```typescript
// src/lib/ab-testing.ts
export interface ABTest {
  id: string;
  userId: string;
  name: string;
  variantA: {
    resumeId: string;
    name: string;
  };
  variantB: {
    resumeId: string;
    name: string;
  };
  metrics: {
    variantA: TestMetrics;
    variantB: TestMetrics;
  };
  winner?: 'A' | 'B' | null;
  status: 'active' | 'completed';
  createdAt: Date;
}

export interface TestMetrics {
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
}

export function calculateWinner(
  testData: ABTest
): { winner: 'A' | 'B' | null; confidence: number } {
  // Statistical analysis (chi-square test)
}
```

---

#### 🟡 6.3 Job Application Tracker Integration
**Priority:** Medium | **Complexity:** High | **Impact:** High

**Description:**
Track applications and correlate with resume versions.

**Features:**
- Log applications
- Track status updates
- Resume version used
- Response time tracking
- Success rate by industry
- Follow-up reminders

**Implementation:**
```typescript
// src/lib/job-tracking.ts
export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  resumeVersionId: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted';
  appliedDate: Date;
  source: string; // LinkedIn, Indeed, etc.
  jobUrl?: string;
  notes: string;
  followUpDate?: Date;
  interviews: Interview[];
  timeline: StatusChange[];
}

export interface Interview {
  date: Date;
  type: 'phone' | 'video' | 'onsite' | 'technical';
  duration: number;
  interviewer?: string;
  notes: string;
  questionsAsked: string[];
}
```

**UI Components:**
```tsx
// src/components/job-tracker/
- kanban-board.tsx - Drag cards between status columns
- application-form.tsx - Quick add application
- calendar-view.tsx - Interview schedule
- analytics-dashboard.tsx - Success metrics
```

---

#### 🟡 6.4 Heatmap of Resume Readability
**Priority:** Medium | **Complexity:** Medium | **Impact:** Low

**Description:**
Visual heatmap showing which resume sections get most attention.

**Features:**
- Eye-tracking simulation
- F-pattern analysis
- Attention score per section
- Optimization suggestions

**Implementation:**
```typescript
// Use AI to simulate recruiter attention patterns
// Generate heatmap overlay on resume PDF
```

---

#### 🟢 6.5 Export Analytics
**Priority:** Low | **Complexity:** Low | **Impact:** Low

**Description:**
Track how many times resume is downloaded/shared.

**Features:**
- Download counter
- Share link analytics
- Geographic data
- Device types
- Time-based trends

---

#### 🟡 6.6 Skill Trend Analysis
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Track trending skills in job market over time.

**Features:**
- Skills trending up/down
- Industry-specific trends
- Emerging technologies
- Skill demand forecasting
- Personalized skill recommendations

**Implementation:**
```typescript
// Scrape job boards for skill frequency
// Track keyword mentions over time
// Use Google Trends API
// Provide monthly trend reports
```

---

### 7. Admin & Management

#### 🔴 7.1 Enhanced Admin Dashboard
**Priority:** Critical | **Complexity:** Medium | **Impact:** High

**Current State:** Basic admin dashboard exists
**Enhancements:**
- Real-time user activity monitoring
- Revenue analytics with charts
- User cohort analysis
- Churn prediction
- Custom reports builder
- Email campaign management

**Implementation:**
```tsx
// src/app/admin/revenue/page.tsx
- MRR (Monthly Recurring Revenue) tracking
- Churn rate calculation
- LTV (Lifetime Value) analysis
- Revenue by plan comparison
- Forecast modeling

// src/app/admin/users/cohorts/page.tsx
- Cohort retention analysis
- User segmentation
- Engagement scoring
- At-risk user identification
```

---

#### 🟠 7.2 Content Moderation System
**Priority:** High | **Complexity:** Medium | **Impact:** Medium

**Description:**
Moderate user-generated content (templates, reviews, comments).

**Features:**
- Automated content flagging (AI)
- Manual review queue
- User reporting system
- Ban/suspend users
- Content guidelines enforcement

---

#### 🟡 7.3 Customer Support Integration
**Priority:** Medium | **Complexity:** Low | **Impact:** Medium

**Description:**
Integrated support ticketing system.

**Implementation:**
- Intercom / Zendesk integration
- In-app chat widget
- Ticket priority system
- Knowledge base
- Automated responses for common issues

---

#### 🟢 7.4 Bulk Operations for Admin
**Priority:** Low | **Complexity:** Low | **Impact:** Low

**Description:**
Batch operations on users/subscriptions.

**Features:**
- Bulk user export
- Bulk credit grants
- Bulk subscription updates
- Bulk notifications

---

## Technical Enhancements

### 🔴 T1. API Rate Limiting by IP
**Priority:** Critical | **Complexity:** Low | **Impact:** High

**Description:**
Prevent abuse with IP-based rate limiting.

**Implementation:**
```typescript
// src/lib/ip-rate-limiter.ts
import { LRUCache } from 'lru-cache';

const ipLimitCache = new LRUCache<string, number>({
  max: 10000,
  ttl: 1000 * 60 * 60, // 1 hour
});

export async function checkIPRateLimit(
  req: Request
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  const key = `ip:${ip}`;
  const count = ipLimitCache.get(key) || 0;
  
  const LIMIT = 100; // 100 requests per hour per IP
  
  if (count >= LIMIT) {
    return { allowed: false, retryAfter: 3600 };
  }
  
  ipLimitCache.set(key, count + 1);
  return { allowed: true };
}

// Middleware
export async function ipRateLimitMiddleware(req: Request) {
  const result = await checkIPRateLimit(req);
  if (!result.allowed) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': result.retryAfter.toString() },
    });
  }
}
```

---

### 🟠 T2. Redis Caching Layer
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Description:**
Add Redis for distributed caching (scale beyond LRU).

**Benefits:**
- Shared cache across server instances
- Better cache hit rates
- Persistent caching
- Session storage

**Implementation:**
```typescript
// src/lib/redis-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached as T | null;
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = 3600
): Promise<void> {
  await redis.set(key, value, { ex: ttl });
}

// Migration from LRU cache to Redis
// Keep LRU as fallback for local development
```

---

### 🟠 T3. Webhook System for Integrations
**Priority:** High | **Complexity:** Medium | **Impact:** Medium

**Description:**
Allow third-party integrations via webhooks.

**Events:**
- `resume.created`
- `resume.updated`
- `resume.analyzed`
- `subscription.created`
- `subscription.updated`
- `user.registered`

**Implementation:**
```typescript
// src/lib/webhooks.ts
export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
}

export async function triggerWebhook(
  event: WebhookEvent,
  payload: any
): Promise<void> {
  const endpoints = await getWebhooksByEvent(event);
  
  for (const endpoint of endpoints) {
    const signature = createHMAC(endpoint.secret, payload);
    
    await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ResumeBuddy-Signature': signature,
        'X-ResumeBuddy-Event': event,
      },
      body: JSON.stringify(payload),
    });
  }
}
```

---

### 🟡 T4. GraphQL API (Alternative to REST)
**Priority:** Medium | **Complexity:** High | **Impact:** Medium

**Description:**
Provide GraphQL API for flexible data fetching.

**Implementation:**
```typescript
// src/app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

const typeDefs = `
  type Resume {
    id: ID!
    userId: String!
    text: String!
    analysis: Analysis
    createdAt: String!
  }
  
  type Analysis {
    atsScore: Int!
    keywords: [String!]!
    suggestions: [String!]!
  }
  
  type Query {
    resume(id: ID!): Resume
    resumes(userId: String!): [Resume!]!
    analysis(resumeId: ID!): Analysis
  }
  
  type Mutation {
    createResume(userId: String!, text: String!): Resume!
    analyzeResume(resumeId: ID!): Analysis!
  }
`;

const resolvers = {
  Query: {
    resume: async (_, { id }) => getResumeById(id),
    resumes: async (_, { userId }) => getResumesByUser(userId),
  },
  Mutation: {
    createResume: async (_, { userId, text }) => createResume(userId, text),
    analyzeResume: async (_, { resumeId }) => analyzeResume(resumeId),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
export const GET = startServerAndCreateNextHandler(server);
export const POST = startServerAndCreateNextHandler(server);
```

---

### 🟡 T5. Background Job Queue (Bull/BullMQ)
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Process heavy tasks asynchronously.

**Use Cases:**
- PDF generation
- AI analysis for large batches
- Email sending
- Report generation

**Implementation:**
```typescript
// src/lib/queue.ts
import { Queue, Worker } from 'bullmq';

const resumeQueue = new Queue('resume-processing', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
});

export async function queueResumeAnalysis(resumeId: string, userId: string) {
  await resumeQueue.add('analyze', { resumeId, userId });
}

// Worker
const worker = new Worker('resume-processing', async (job) => {
  if (job.name === 'analyze') {
    const { resumeId, userId } = job.data;
    await analyzeResumeBackground(resumeId, userId);
  }
});
```

---

### 🟢 T6. Database Migration to PostgreSQL (Optional)
**Priority:** Low | **Complexity:** Very High | **Impact:** Medium

**Rationale:**
- Complex queries easier with SQL
- Better for analytics
- Relational data modeling

**Migration Path:**
1. Set up Supabase PostgreSQL
2. Create schema matching Firestore structure
3. Write migration scripts
4. Dual-write during transition
5. Switch read traffic gradually
6. Deprecate Firestore

**Complexity:** Not recommended unless scaling issues arise

---

### 🟠 T7. Monitoring & Observability
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Tools:**
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog/New Relic**: APM
- **Vercel Analytics**: Already integrated

**Implementation:**
```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});

export function trackEvent(eventName: string, data?: any) {
  // Custom event tracking
  Sentry.captureMessage(eventName, {
    level: 'info',
    extra: data,
  });
}
```

---

### 🟡 T8. E2E Testing Suite
**Priority:** Medium | **Complexity:** Medium | **Impact:** Medium

**Description:**
Comprehensive testing with Playwright/Cypress.

**Test Coverage:**
- User registration/login
- Resume upload and analysis
- Export functionality
- Payment flows
- Admin operations

**Implementation:**
```typescript
// e2e/resume-analysis.spec.ts
import { test, expect } from '@playwright/test';

test('complete resume analysis flow', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Upload resume
  await page.setInputFiles('[data-testid="resume-upload"]', 'test-resume.pdf');
  
  // Add job description
  await page.fill('[data-testid="job-description"]', 'Software Engineer...');
  
  // Run analysis
  await page.click('[data-testid="analyze-button"]');
  
  // Wait for results
  await expect(page.locator('[data-testid="ats-score"]')).toBeVisible();
  
  // Verify score is displayed
  const score = await page.textContent('[data-testid="ats-score"]');
  expect(parseInt(score)).toBeGreaterThan(0);
});
```

---

### 🟢 T9. CDN for Static Assets
**Priority:** Low | **Complexity:** Low | **Impact:** Low

**Description:**
Use CDN for faster asset delivery globally.

**Implementation:**
- Already using Vercel CDN
- Consider Cloudflare for additional regions
- Optimize image delivery with Cloudinary/imgix

---

### 🟠 T10. Security Enhancements
**Priority:** High | **Complexity:** Medium | **Impact:** High

**Features:**
- CAPTCHA on signup/login (Cloudflare Turnstile)
- 2FA (TOTP via Firebase)
- Session management improvements
- CSRF protection
- Content Security Policy (CSP)
- Regular security audits

**Implementation:**
```typescript
// src/lib/security.ts
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function verifyCaptcha(token: string): Promise<boolean> {
  const result = await verifyTurnstileToken(token);
  return result.success;
}

// 2FA
export async function enable2FA(userId: string): Promise<{ qrCode: string; secret: string }> {
  // Generate TOTP secret
  // Return QR code for authenticator app
}

export async function verify2FA(userId: string, token: string): Promise<boolean> {
  // Verify TOTP token
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
**Focus:** Core improvements and high-impact features

**Week 1-2:**
- 🔴 Resume Version Control (2.1)
- 🔴 Smart Auto-Save (2.10)
- 🔴 IP Rate Limiting (T1)

**Week 3-4:**
- 🔴 Resume Gap Analysis (1.1)
- 🔴 Smart Resume Tailoring (1.10)
- 🟠 Keyword Optimizer (1.2)

**Week 5-6:**
- 🔴 Resume Performance Dashboard (6.1)
- 🟠 DOCX Export (4.1)
- 🟠 HTML Export (4.2)

**Week 7-8:**
- 🔴 Team Plans (3.1)
- 🟠 Annual Plans (3.5)
- 🟠 Security Enhancements (T10)

### Phase 2: Monetization (Months 3-4)
**Focus:** Revenue generation and subscription features

**Week 9-10:**
- 🟠 Pay-Per-Use Credits (3.2)
- 🟠 Template Marketplace (2.3)
- 🟡 Referral Program (3.3)

**Week 11-12:**
- 🟠 Multi-Resume Comparison (1.3)
- 🟡 A/B Testing (6.2)
- 🟡 Job Tracker (6.3)

**Week 13-14:**
- 🟠 Drag-and-Drop Builder (2.2)
- 🟠 Custom LaTeX Editor (4.3)

**Week 15-16:**
- 🟡 Premium Reviews (3.7)
- 🟡 White-Label (3.4)

### Phase 3: Advanced Features (Months 5-6)
**Focus:** AI capabilities and collaboration

**Week 17-18:**
- 🟠 LinkedIn Optimizer (1.5)
- 🟡 Video Script Generation (1.4)
- 🟡 Translation (1.7)

**Week 19-20:**
- 🟠 PWA Enhancement (2.5)
- 🟡 Command Palette (2.9)
- 🟡 Keyboard Shortcuts (2.8)

**Week 21-22:**
- 🟠 Peer Review Marketplace (5.1)
- 🟡 Resume Sharing (5.3)

**Week 23-24:**
- 🟠 Monitoring (T7)
- 🟡 E2E Testing (T8)

### Phase 4: Scale & Optimize (Months 7-8)
**Focus:** Infrastructure and performance

**Week 25-26:**
- 🟠 Redis Caching (T2)
- 🟡 Background Jobs (T5)
- 🟠 Webhooks (T3)

**Week 27-28:**
- 🟡 GraphQL API (T4)
- 🟡 Content Moderation (7.2)

**Week 29-30:**
- 🟢 Student Discounts (3.6)
- 🟢 Onboarding Tutorial (2.7)

**Week 31-32:**
- Polish & bug fixes
- Performance optimization
- Documentation

---

## Success Metrics

### User Metrics
- **DAU/MAU Ratio:** Target 40%+ (engagement)
- **User Retention:** 60% after 30 days
- **Conversion Rate:** 5% free → Pro
- **NPS Score:** 50+

### Revenue Metrics
- **MRR Growth:** 20% month-over-month
- **Churn Rate:** < 5% monthly
- **Average Revenue Per User (ARPU):** $15/month
- **Customer Lifetime Value (LTV):** $180+

### Product Metrics
- **Time to First Value:** < 5 minutes (first analysis)
- **Feature Adoption:** 80% of Pro users using 3+ features
- **Export Rate:** 70% of users export resume
- **Error Rate:** < 0.1%

### Performance Metrics
- **Lighthouse Score:** 95+ (already achieved)
- **API Response Time:** P95 < 2s
- **Cache Hit Rate:** 60%+
- **Uptime:** 99.9%

---

## Prioritization Matrix

### Must-Have (Launch Blockers)
1. Resume Version Control (2.1)
2. Smart Auto-Save (2.10)
3. Resume Gap Analysis (1.1)
4. Smart Resume Tailoring (1.10)
5. Team Plans (3.1)
6. Resume Performance Dashboard (6.1)

### Should-Have (High Value)
1. DOCX Export (4.1)
2. HTML Export (4.2)
3. Keyword Optimizer (1.2)
4. Multi-Resume Comparison (1.3)
5. Template Marketplace (2.3)
6. Drag-and-Drop Builder (2.2)

### Could-Have (Nice to Have)
1. LinkedIn Optimizer (1.5)
2. Translation (1.7)
3. A/B Testing (6.2)
4. Peer Review (5.1)
5. Video Script (1.4)

### Won't-Have (Future Consideration)
1. Database Migration (T6)
2. Canva-Style Builder (4.4) - too complex for now

---

## Cost Estimates

### Development Costs (8 months)
- **Phase 1:** 2 developers × 2 months = $40,000
- **Phase 2:** 2 developers × 2 months = $40,000
- **Phase 3:** 3 developers × 2 months = $60,000
- **Phase 4:** 2 developers × 2 months = $40,000
- **Total:** $180,000

### Infrastructure Costs (monthly)
- **Current:** ~$50/month (Vercel, Firebase)
- **After Enhancement:** ~$300/month
  - Redis (Upstash): $20/month
  - Monitoring (Sentry): $50/month
  - Additional AI credits: $100/month
  - CDN/Storage: $30/month
  - Background jobs: $50/month
  - Misc: $50/month

### Expected ROI
- **Year 1 Revenue:** $150,000 (1,000 users × $12.50/month avg)
- **Year 2 Revenue:** $500,000 (3,000 users)
- **Break-even:** Month 14

---

## Risk Assessment

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI API limits exceeded | Medium | High | Multi-provider fallback already in place |
| Firebase scaling issues | Low | High | Plan migration to PostgreSQL if needed |
| Security breach | Low | Critical | Regular audits, 2FA, monitoring |
| Performance degradation | Medium | Medium | Load testing, caching, CDN |

### Business Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low conversion rate | Medium | High | A/B testing, improve onboarding |
| High churn | Medium | High | Feature engagement, customer success |
| Competitor launches similar | High | Medium | Faster iteration, unique features |
| Regulatory changes (AI) | Low | Medium | Monitor regulations, adapt quickly |

---

## Conclusion

This comprehensive enhancement plan provides a roadmap to transform ResumeBuddy from a basic resume analyzer to a full-featured career development platform. The phased approach ensures steady progress while managing risk and resources effectively.

### Key Takeaways:
1. **User Value First:** Focus on features that directly help users get jobs
2. **Revenue Growth:** Multiple monetization streams (subscriptions, credits, reviews)
3. **Technical Excellence:** Build scalable, maintainable infrastructure
4. **Data-Driven:** Track metrics and iterate based on user behavior

### Next Steps:
1. Review and prioritize features based on your business goals
2. Assemble development team
3. Set up project management (Jira, Linear, etc.)
4. Begin Phase 1 implementation
5. Establish feedback loops with early users

---

**Document Prepared By:** AI Assistant  
**For:** ResumeBuddy Platform Enhancement  
**Last Updated:** January 31, 2026  
**Version:** 1.0
