# 📊 Resume Buddy — Complete Diagrams

> All diagrams for the Resume Buddy AI SaaS Application, rendered using Mermaid.

---

## Table of Contents

| # | Category | Diagram |
|---|----------|---------|
| 1 | 🏗️ System & Architecture | [System Architecture](#1-system-architecture-diagram) |
| 2 | 🏗️ System & Architecture | [Cloud Deployment](#2-cloud-deployment-diagram) |
| 3 | 🏗️ System & Architecture | [Microservices / API Architecture](#3-microservices--api-architecture-diagram) |
| 4 | 🔁 Process & Flow | [User Workflow](#4-user-workflow-diagram) |
| 5 | 🔁 Process & Flow | [Resume Analysis Flow](#5-resume-analysis-flow-diagram) |
| 6 | 🔁 Process & Flow | [Data Flow Diagram (DFD – Level 1)](#6-data-flow-diagram-dfd--level-1) |
| 7 | 🧩 Software Engineering | [Use Case Diagram](#7-use-case-diagram) |
| 8 | 🧩 Software Engineering | [Entity Relationship (ER) Diagram](#8-entity-relationship-er-diagram) |
| 9 | 🧩 Software Engineering | [Sequence Diagram — Resume Analysis](#9-sequence-diagram--resume-analysis) |
| 10 | 🧠 AI / ML | [AI Resume Analysis Pipeline](#10-ai-resume-analysis-pipeline-diagram) |
| 11 | 🧠 AI / ML | [ATS Scoring & Keyword Matching](#11-ats-scoring--keyword-matching-diagram) |
| 12 | 🧠 AI / ML | [Interview Question Generation Flow](#12-interview-question-generation-flow) |
| 13 | 🎨 Product & UX | [User Flow (Landing → Dashboard → Features)](#13-user-flow-diagram) |
| 14 | 🎨 Product & UX | [Dashboard Navigation](#14-dashboard-navigation-diagram) |
| 15 | 🎨 Product & UX | [Resume Builder Screen Flow](#15-resume-builder-screen-flow) |
| 16 | 💼 Business / SaaS | [Subscription & Billing Flow](#16-subscription--billing-flow-diagram) |
| 17 | 💼 Business / SaaS | [Admin Panel Architecture](#17-admin-panel-architecture-diagram) |

---

## 🏗️ System & Architecture

### 1. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["🌐 Web Browser"]
        PWA["📱 PWA / Mobile"]
    end

    subgraph "CDN & Edge"
        Vercel["▲ Vercel Edge Network"]
        Analytics["📈 Vercel Analytics"]
        SpeedInsights["⚡ Speed Insights"]
    end

    subgraph "Application Layer — Next.js 16"
        Middleware["🛡️ Middleware<br/>(Auth, Rate Limit, CORS)"]
        SSR["🔄 SSR / RSC<br/>React Server Components"]
        APIRoutes["🔌 API Routes<br/>/api/*"]
        ServerActions["⚙️ Server Actions<br/>actions.ts"]
    end

    subgraph "AI Engine"
        Genkit["🤖 Genkit AI Framework"]
        SmartRouter["🧠 Smart Router<br/>(Provider Selection)"]
        Gemini["💎 Google Gemini"]
        Groq["⚡ Groq LLM"]
        OpenRouter["🌐 OpenRouter"]
    end

    subgraph "Data Layer"
        Prisma["🔧 Prisma ORM"]
        PostgreSQL[("🐘 PostgreSQL")]
        Redis[("🔴 Redis Cache")]
    end

    subgraph "Storage & Services"
        MinIO["📦 MinIO / S3<br/>Object Storage"]
        BullMQ["📋 BullMQ<br/>Job Queue"]
        LaTeX["📝 LaTeX Service<br/>(Docker)"]
        WebSocket["🔗 WebSocket Server"]
    end

    subgraph "External Services"
        Razorpay["💳 Razorpay<br/>Payments"]
        Resend["📧 Resend<br/>Email"]
        Supabase["🔐 Supabase Auth"]
    end

    Browser --> Vercel
    PWA --> Vercel
    Vercel --> Middleware
    Vercel --> Analytics
    Vercel --> SpeedInsights
    Middleware --> SSR
    Middleware --> APIRoutes
    SSR --> ServerActions
    APIRoutes --> Genkit
    ServerActions --> Genkit
    ServerActions --> Prisma
    APIRoutes --> Prisma
    Genkit --> SmartRouter
    SmartRouter --> Gemini
    SmartRouter --> Groq
    SmartRouter --> OpenRouter
    Prisma --> PostgreSQL
    APIRoutes --> Redis
    ServerActions --> Redis
    APIRoutes --> MinIO
    ServerActions --> BullMQ
    BullMQ --> LaTeX
    APIRoutes --> WebSocket
    APIRoutes --> Razorpay
    ServerActions --> Resend
    APIRoutes --> Supabase

    style Browser fill:#4F46E5,stroke:#3730A3,color:#fff
    style PWA fill:#4F46E5,stroke:#3730A3,color:#fff
    style Vercel fill:#000,stroke:#333,color:#fff
    style Genkit fill:#10B981,stroke:#047857,color:#fff
    style SmartRouter fill:#059669,stroke:#047857,color:#fff
    style Gemini fill:#4285F4,stroke:#1A73E8,color:#fff
    style Groq fill:#F97316,stroke:#EA580C,color:#fff
    style OpenRouter fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style PostgreSQL fill:#336791,stroke:#2D5F8A,color:#fff
    style Redis fill:#DC2626,stroke:#B91C1C,color:#fff
    style MinIO fill:#C72C48,stroke:#A12340,color:#fff
    style Razorpay fill:#072654,stroke:#051D40,color:#fff
```

---

### 2. Cloud Deployment Diagram

```mermaid
graph TB
    subgraph "Vercel Cloud"
        direction TB
        Edge["Edge Functions<br/>(Middleware)"]
        Serverless["Serverless Functions<br/>(API Routes)"]
        Static["Static Assets<br/>(Next.js Build)"]
        CDN["Vercel CDN<br/>(Global Cache)"]
    end

    subgraph "Container / Docker Infrastructure"
        direction TB
        DockerCompose["🐳 Docker Compose"]
        PGContainer["PostgreSQL Container<br/>Port: 5432"]
        RedisContainer["Redis Container<br/>Port: 6379"]
        MinIOContainer["MinIO Container<br/>Port: 9000 / 9001"]
        LaTeXContainer["LaTeX Service Container<br/>Port: 3001"]
    end

    subgraph "Managed Services"
        SupabaseCloud["Supabase<br/>(Auth + Fallback DB)"]
        RazorpayAPI["Razorpay API<br/>(Payments)"]
        ResendAPI["Resend API<br/>(Transactional Email)"]
        GoogleAI["Google AI Platform<br/>(Gemini API)"]
        GroqCloud["Groq Cloud<br/>(LLM Inference)"]
    end

    subgraph "CI / CD Pipeline"
        GitHub["GitHub Repository"]
        Actions["GitHub Actions"]
        Preview["Preview Deployments"]
        Production["Production Deploy"]
    end

    subgraph "Monitoring"
        VercelAnalytics["Vercel Analytics"]
        Lighthouse["Lighthouse CI"]
        HealthCheck["/api/health Endpoint"]
    end

    GitHub --> Actions
    Actions --> Preview
    Actions --> Production
    Production --> Edge
    Production --> Serverless
    Production --> Static
    Static --> CDN

    Serverless --> PGContainer
    Serverless --> RedisContainer
    Serverless --> MinIOContainer
    Serverless --> LaTeXContainer
    Serverless --> SupabaseCloud
    Serverless --> RazorpayAPI
    Serverless --> ResendAPI
    Serverless --> GoogleAI
    Serverless --> GroqCloud
    DockerCompose --> PGContainer
    DockerCompose --> RedisContainer
    DockerCompose --> MinIOContainer
    DockerCompose --> LaTeXContainer

    Serverless --> HealthCheck
    VercelAnalytics --> Serverless
    Lighthouse --> Static

    style Edge fill:#000,stroke:#333,color:#fff
    style Serverless fill:#000,stroke:#333,color:#fff
    style Static fill:#000,stroke:#333,color:#fff
    style CDN fill:#000,stroke:#333,color:#fff
    style DockerCompose fill:#2496ED,stroke:#1D7AC2,color:#fff
    style PGContainer fill:#336791,stroke:#2D5F8A,color:#fff
    style RedisContainer fill:#DC2626,stroke:#B91C1C,color:#fff
    style MinIOContainer fill:#C72C48,stroke:#A12340,color:#fff
    style LaTeXContainer fill:#008080,stroke:#006666,color:#fff
    style GitHub fill:#181717,stroke:#333,color:#fff
```

---

### 3. Microservices / API Architecture Diagram

```mermaid
graph LR
    subgraph "API Gateway (Next.js API Routes)"
        direction TB
        MW["Middleware Stack"]
        RateLimit["Rate Limiter"]
        AuthGuard["Auth Guard (JWT)"]
    end

    subgraph "Auth Service (/api/auth/*)"
        Login["/login"]
        Signup["/signup"]
        Logout["/logout"]
        Refresh["/refresh"]
        Verify["/verify-email"]
        Google["/google"]
        ForgotPW["/forgot-password"]
        ResetPW["/reset-password"]
    end

    subgraph "Resume Service (/api/resumes/*)"
        Upload["/upload"]
        Parse["/parse"]
        List["/list"]
        Export["/export"]
        Library["/library"]
    end

    subgraph "AI Service (Server Actions)"
        Analyze["analyzeResumeContent"]
        Improve["suggestImprovements"]
        CoverLetter["generateCoverLetter"]
        QA["generateResumeQA"]
        InterviewGen["generateInterviewQuestions"]
        DSA["generateDSAQuestions"]
        ParseResume["parseResumeIntelligently"]
    end

    subgraph "Admin Service (/api/admin/*)"
        Cleanup["/cleanup"]
        UserMgmt["User Management"]
    end

    subgraph "Supporting Services"
        Webhooks["/api/webhooks/razorpay"]
        Health["/api/health"]
        Metrics["/api/metrics"]
        Notifications["/api/notifications"]
    end

    MW --> RateLimit --> AuthGuard
    AuthGuard --> Login & Signup & Logout & Refresh
    AuthGuard --> Upload & Parse & List & Export
    AuthGuard --> Analyze & Improve & CoverLetter
    AuthGuard --> Cleanup & UserMgmt
    AuthGuard --> Webhooks & Health & Metrics

    style MW fill:#F59E0B,stroke:#D97706,color:#000
    style RateLimit fill:#EF4444,stroke:#DC2626,color:#fff
    style AuthGuard fill:#10B981,stroke:#059669,color:#fff
```

---

## 🔁 Process & Flow

### 4. User Workflow Diagram

```mermaid
graph TD
    Start(("🚀 Start")) --> Landing["Landing Page"]
    Landing --> SignUp["Sign Up / Login"]
    SignUp --> Dashboard["📊 Dashboard"]

    Dashboard --> Upload["📤 Upload Resume<br/>(PDF / DOCX / Text)"]
    Dashboard --> CreateNew["✏️ Create New Resume"]
    Dashboard --> Library["📚 Resume Library"]
    Dashboard --> Interview["🎤 Mock Interview"]
    Dashboard --> Profile["👤 Profile"]

    Upload --> ParseResume["🔍 AI Parse Resume"]
    ParseResume --> Analysis["📈 Resume Analysis<br/>(ATS Score, Gaps, Strengths)"]

    Analysis --> Improve["💡 Get Improvements"]
    Analysis --> CoverLetter["💌 Generate Cover Letter"]
    Analysis --> QA["❓ Q&A with Resume"]
    Analysis --> InterviewPrep["🎯 Interview Prep"]
    Analysis --> ExportResume["📥 Export Resume<br/>(LaTeX / PDF / DOCX)"]

    Improve --> ApplyChanges["✅ Apply Suggestions"]
    ApplyChanges --> Analysis

    InterviewPrep --> MockInterview["🎙️ AI Mock Interview"]
    MockInterview --> Feedback["📊 Interview Feedback"]

    CreateNew --> TemplateSelect["🎨 Choose Template"]
    TemplateSelect --> FillDetails["📝 Fill Resume Sections"]
    FillDetails --> Preview["👁️ Live Preview"]
    Preview --> ExportResume

    Library --> SelectResume["Select a Resume"]
    SelectResume --> Analysis

    style Start fill:#10B981,stroke:#059669,color:#fff
    style Dashboard fill:#4F46E5,stroke:#3730A3,color:#fff
    style Analysis fill:#F59E0B,stroke:#D97706,color:#000
    style MockInterview fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style ExportResume fill:#EF4444,stroke:#DC2626,color:#fff
```

---

### 5. Resume Analysis Flow Diagram

```mermaid
graph TD
    Input["📄 User Input<br/>(Resume + Job Description)"] --> Validate["✅ Validate Input<br/>& Check Limits"]
    Validate -->|Invalid| Error["❌ Error Response"]
    Validate -->|Valid| Cache{"🔍 Check<br/>Response Cache"}
    Cache -->|Hit| CachedResult["⚡ Return Cached Result"]
    Cache -->|Miss| Dedup{"🔄 Deduplicate<br/>Request?"}
    Dedup -->|Duplicate| Wait["⏳ Wait for Original"]
    Dedup -->|New| Queue["📋 Add to Request Queue"]
    Queue --> RateCheck{"🚦 Rate Limit<br/>Check"}
    RateCheck -->|Exceeded| RateError["⛔ 429 Too Many Requests"]
    RateCheck -->|OK| SmartRoute["🧠 Smart Router<br/>(Select AI Provider)"]

    SmartRoute --> Gemini["💎 Gemini"]
    SmartRoute --> Groq["⚡ Groq"]
    SmartRoute --> OpenRouter["🌐 OpenRouter"]

    Gemini --> AIProcess["🤖 AI Analysis"]
    Groq --> AIProcess
    OpenRouter --> AIProcess

    AIProcess --> ParseOutput["📊 Parse & Validate<br/>AI Response"]
    ParseOutput --> ATSScore["🎯 Calculate ATS Score"]
    ATSScore --> StoreResult["💾 Store in Database<br/>+ Cache Result"]
    StoreResult --> LogUsage["📝 Log API Call<br/>& Usage Record"]
    LogUsage --> Response["✅ Return Analysis<br/>to Client"]

    style Input fill:#4F46E5,stroke:#3730A3,color:#fff
    style SmartRoute fill:#10B981,stroke:#059669,color:#fff
    style AIProcess fill:#F59E0B,stroke:#D97706,color:#000
    style ATSScore fill:#EF4444,stroke:#DC2626,color:#fff
    style Response fill:#10B981,stroke:#059669,color:#fff
```

---

### 6. Data Flow Diagram (DFD – Level 1)

```mermaid
graph LR
    User(("👤 User"))
    Admin(("🛡️ Admin"))

    subgraph "Resume Buddy System"
        P1["1.0<br/>Authentication<br/>& Authorization"]
        P2["2.0<br/>Resume<br/>Management"]
        P3["3.0<br/>AI Analysis<br/>Engine"]
        P4["4.0<br/>Interview<br/>Preparation"]
        P5["5.0<br/>Subscription<br/>& Billing"]
        P6["6.0<br/>Admin<br/>Dashboard"]
        P7["7.0<br/>File Storage<br/>& Export"]
    end

    DB_Users[("Users DB")]
    DB_Resumes[("Resumes DB")]
    DB_Interviews[("Interviews DB")]
    DB_Payments[("Payments DB")]
    FileStore[("Object Storage<br/>MinIO / S3")]
    AIProviders(("AI Providers<br/>Gemini / Groq"))
    PaymentGW(("Razorpay<br/>Gateway"))

    User -->|"Credentials"| P1
    P1 -->|"JWT Token"| User
    P1 <-->|"User Records"| DB_Users

    User -->|"Resume File"| P2
    P2 -->|"Parsed Data"| User
    P2 <-->|"Resume Data"| DB_Resumes
    P2 -->|"Store File"| FileStore

    User -->|"Analyze Request"| P3
    P3 -->|"Analysis Report"| User
    P3 <-->|"AI Prompts / Responses"| AIProviders
    P3 -->|"Save Analysis"| DB_Resumes

    User -->|"Practice Request"| P4
    P4 -->|"Questions + Feedback"| User
    P4 <-->|"Generate Questions"| AIProviders
    P4 <-->|"Session Data"| DB_Interviews

    User -->|"Payment Info"| P5
    P5 -->|"Subscription Status"| User
    P5 <-->|"Process Payment"| PaymentGW
    P5 <-->|"Payment Records"| DB_Payments

    Admin -->|"Admin Commands"| P6
    P6 -->|"Reports & Logs"| Admin
    P6 <-->|"All Data"| DB_Users

    P2 -->|"Export Request"| P7
    P7 -->|"Generated File"| User
    P7 <-->|"File I/O"| FileStore

    style P1 fill:#4F46E5,stroke:#3730A3,color:#fff
    style P2 fill:#10B981,stroke:#059669,color:#fff
    style P3 fill:#F59E0B,stroke:#D97706,color:#000
    style P4 fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style P5 fill:#EF4444,stroke:#DC2626,color:#fff
    style P6 fill:#6B7280,stroke:#4B5563,color:#fff
    style P7 fill:#06B6D4,stroke:#0891B2,color:#fff
```

---

## 🧩 Software Engineering

### 7. Use Case Diagram

```mermaid
graph TB
    subgraph Actors
        User(("👤 User"))
        Admin(("🛡️ Admin"))
        AI(("🤖 AI Engine"))
        Payment(("💳 Payment GW"))
    end

    subgraph "Authentication"
        UC1["Sign Up (Email/Google)"]
        UC2["Log In / Log Out"]
        UC3["Reset Password"]
        UC4["Verify Email"]
    end

    subgraph "Resume Management"
        UC5["Upload Resume (PDF/DOCX)"]
        UC6["Create Resume from Scratch"]
        UC7["View Resume Library"]
        UC8["Export Resume (PDF/DOCX/LaTeX)"]
        UC9["Delete Resume"]
    end

    subgraph "AI Analysis"
        UC10["Analyze Resume"]
        UC11["Get ATS Score"]
        UC12["Get Improvement Suggestions"]
        UC13["Generate Cover Letter"]
        UC14["Q&A with Resume"]
    end

    subgraph "Interview Prep"
        UC15["Generate Interview Questions"]
        UC16["Practice Mock Interview"]
        UC17["Get Answer Feedback"]
        UC18["Generate DSA Questions"]
    end

    subgraph "Billing"
        UC19["View Pricing Plans"]
        UC20["Subscribe to Pro Plan"]
        UC21["Manage Subscription"]
    end

    subgraph "Administration"
        UC22["View User Analytics"]
        UC23["Manage Users"]
        UC24["View API Logs"]
        UC25["Configure Subscription Pricing"]
        UC26["Database Cleanup"]
    end

    User --> UC1 & UC2 & UC3 & UC4
    User --> UC5 & UC6 & UC7 & UC8 & UC9
    User --> UC10 & UC11 & UC12 & UC13 & UC14
    User --> UC15 & UC16 & UC17 & UC18
    User --> UC19 & UC20 & UC21

    Admin --> UC22 & UC23 & UC24 & UC25 & UC26

    UC10 -.->|"<<uses>>"| AI
    UC11 -.->|"<<uses>>"| AI
    UC12 -.->|"<<uses>>"| AI
    UC13 -.->|"<<uses>>"| AI
    UC14 -.->|"<<uses>>"| AI
    UC15 -.->|"<<uses>>"| AI
    UC16 -.->|"<<uses>>"| AI
    UC17 -.->|"<<uses>>"| AI
    UC18 -.->|"<<uses>>"| AI

    UC20 -.->|"<<uses>>"| Payment
    UC21 -.->|"<<uses>>"| Payment

    style User fill:#4F46E5,stroke:#3730A3,color:#fff
    style Admin fill:#EF4444,stroke:#DC2626,color:#fff
    style AI fill:#10B981,stroke:#059669,color:#fff
    style Payment fill:#F59E0B,stroke:#D97706,color:#000
```

---

### 8. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User {
        string id PK "cuid - Firebase UID"
        string email UK "unique"
        string name
        string passwordHash
        string phone UK
        string avatar
        enum role "USER | ADMIN"
        enum status "ACTIVE | SUSPENDED | DELETED"
        boolean emailVerified
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    Account {
        uuid id PK
        string userId FK
        string provider "credentials | google | github"
        string providerAccountId
        string accessToken
        string refreshToken
        datetime expiresAt
    }

    Session {
        uuid id PK
        string sessionId UK
        string userId FK
        string userAgent
        string ipAddress
        datetime expiresAt
        datetime lastActivityAt
    }

    RefreshToken {
        uuid id PK
        string token UK
        string userId FK
        datetime expiresAt
        boolean revoked
        string replacedByToken
    }

    VerificationToken {
        string identifier
        string token
        enum type "EMAIL | PHONE | PASSWORD_RESET"
        datetime expires
    }

    Subscription {
        uuid id PK
        string userId FK_UK "unique"
        enum tier "FREE | PRO"
        enum status "ACTIVE | EXPIRED | CANCELLED | PAST_DUE"
        string razorpaySubscriptionId
        string razorpayCustomerId
        datetime currentPeriodStart
        datetime currentPeriodEnd
    }

    SubscriptionConfig {
        int id PK "singleton row"
        int priceINR
        int pricePaise
        int testPriceINR
        boolean isTestMode
        int durationDays
        string currency
    }

    Payment {
        uuid id PK
        string userId FK
        decimal amount
        string currency
        enum status "PENDING | COMPLETED | FAILED | REFUNDED"
        string razorpayPaymentId UK
        string razorpayOrderId
        string planType
        json metadata
    }

    UsageRecord {
        uuid id PK
        string userId FK
        string feature
        int count
        date date
    }

    ResumeData {
        uuid id PK
        string userId FK
        string title
        text resumeText
        text jobDescription
        string jobRole
        json parsedData
        json analysis
        json improvements
        json qaHistory
        text coverLetter
        boolean isActive
    }

    Interview {
        uuid id PK
        string userId FK
        uuid resumeDataId FK
        enum type "TECHNICAL | BEHAVIORAL | SYSTEM_DESIGN | HR | DSA"
        enum difficulty "EASY | MEDIUM | HARD"
        string role
        json questions
        json answers
        json feedback
        int score
        enum status "NOT_STARTED | IN_PROGRESS | COMPLETED"
    }

    StoredFile {
        uuid id PK
        string userId FK
        uuid resumeDataId FK
        string filename
        string originalName
        string mimeType
        int size
        string bucket
        string objectKey
    }

    GeneratedResume {
        uuid id PK
        string userId FK
        uuid resumeDataId FK
        string templateId
        enum format "LATEX | PDF | DOCX"
        text latexSource
        uuid fileId FK
        enum status "DRAFT | GENERATING | COMPLETED | FAILED"
    }

    AdminAction {
        uuid id PK
        string adminId
        string action
        string targetId
        json details
    }

    ApiCallLog {
        uuid id PK
        string userId
        string provider
        string operation
        int tokensUsed
        int latencyMs
        boolean success
    }

    UserActivity {
        uuid id PK
        string userId
        string action
        json details
        string ipAddress
    }

    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o{ RefreshToken : "has"
    User ||--o| Subscription : "has"
    User ||--o{ Payment : "makes"
    User ||--o{ UsageRecord : "tracks"
    User ||--o{ ResumeData : "owns"
    User ||--o{ Interview : "takes"
    User ||--o{ StoredFile : "uploads"
    User ||--o{ GeneratedResume : "generates"
    ResumeData ||--o{ Interview : "linked to"
    ResumeData ||--o{ StoredFile : "has files"
    ResumeData ||--o{ GeneratedResume : "produces"
    StoredFile ||--o{ GeneratedResume : "stores output"
```

---

### 9. Sequence Diagram — Resume Analysis

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant MW as Middleware
    participant SA as Server Action
    participant Cache as Redis Cache
    participant Router as Smart Router
    participant AI as AI Provider
    participant DB as PostgreSQL
    participant Usage as Usage Tracker

    User->>UI: Upload Resume + Job Description
    UI->>MW: POST /analyze (with JWT)
    MW->>MW: Validate JWT & Rate Limit
    MW->>SA: Forward Request

    SA->>Cache: Check Response Cache
    alt Cache Hit
        Cache-->>SA: Cached Analysis
        SA-->>UI: Return Cached Result
    else Cache Miss
        SA->>SA: Validate & Sanitize Input
        SA->>Router: Route AI Request
        Router->>Router: Select Best Provider<br/>(latency, cost, availability)

        alt Gemini Selected
            Router->>AI: Send to Gemini API
        else Groq Selected
            Router->>AI: Send to Groq API
        else OpenRouter Selected
            Router->>AI: Send to OpenRouter API
        end

        AI-->>Router: Raw AI Response
        Router-->>SA: Parsed Analysis

        SA->>SA: Calculate ATS Score
        SA->>SA: Extract Keywords & Gaps

        par Save Results
            SA->>DB: Update ResumeData.analysis
            SA->>Cache: Cache Response (TTL)
            SA->>Usage: Log UsageRecord + ApiCallLog
        end

        SA-->>UI: Analysis Result
    end

    UI-->>User: Display ATS Score,<br/>Strengths, Gaps, Suggestions
```

---

## 🧠 AI / ML

### 10. AI Resume Analysis Pipeline Diagram

```mermaid
graph TD
    subgraph "Input Stage"
        ResumeFile["📄 Resume File<br/>(PDF / DOCX / Text)"]
        JobDesc["📋 Job Description<br/>(Text / URL)"]
    end

    subgraph "Parsing Stage"
        FileParser["📂 File Parser<br/>(pdf-parse / mammoth)"]
        ResumeParser["🔍 Resume Parser<br/>(42K LOC — Regex + Heuristics)"]
        JDParser["📝 JD Structurer<br/>(structure-job-description)"]
    end

    subgraph "AI Processing — Genkit Flows"
        ParseIntelligent["🧠 parse-resume-intelligently<br/>(Extract Structured Data)"]
        AnalyzeContent["📊 analyze-resume-content<br/>(Gap Analysis + Scoring)"]
        SuggestImprovements["💡 suggest-resume-improvements<br/>(Actionable Suggestions)"]
    end

    subgraph "Smart Router"
        ProviderSelect["🔀 Provider Selection"]
        Gemini["💎 Gemini 2.0 Flash"]
        Groq["⚡ Groq (Llama 3)"]
        OpenRouter["🌐 OpenRouter<br/>(Multi-Model)"]
        Fallback["🔄 Retry + Fallback<br/>Handler"]
    end

    subgraph "Post-Processing"
        ATSCalc["🎯 ATS Score Calculator"]
        KeywordMatch["🔑 Keyword Matcher"]
        Validator["✅ Resume Validator<br/>(17K LOC — Rule Engine)"]
        Optimizer["⚙️ Content Optimizer"]
    end

    subgraph "Output Stage"
        AnalysisReport["📊 Analysis Report"]
        ImprovementList["💡 Improvement List"]
        ATSReport["🎯 ATS Score Report"]
        CoverLetter["💌 Cover Letter"]
    end

    ResumeFile --> FileParser --> ResumeParser
    JobDesc --> JDParser
    ResumeParser --> ParseIntelligent
    JDParser --> AnalyzeContent
    ParseIntelligent --> AnalyzeContent
    AnalyzeContent --> SuggestImprovements

    ParseIntelligent --> ProviderSelect
    AnalyzeContent --> ProviderSelect
    SuggestImprovements --> ProviderSelect
    ProviderSelect --> Gemini & Groq & OpenRouter
    Gemini --> Fallback
    Groq --> Fallback
    OpenRouter --> Fallback

    Fallback --> ATSCalc
    Fallback --> KeywordMatch
    Fallback --> Validator
    Fallback --> Optimizer

    ATSCalc --> ATSReport
    KeywordMatch --> AnalysisReport
    Validator --> AnalysisReport
    Optimizer --> ImprovementList
    SuggestImprovements --> CoverLetter

    style ParseIntelligent fill:#10B981,stroke:#059669,color:#fff
    style AnalyzeContent fill:#F59E0B,stroke:#D97706,color:#000
    style SuggestImprovements fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style ATSCalc fill:#EF4444,stroke:#DC2626,color:#fff
```

---

### 11. ATS Scoring & Keyword Matching Diagram

```mermaid
graph TD
    subgraph "Inputs"
        Resume["📄 Parsed Resume<br/>(Structured JSON)"]
        JD["📋 Structured Job Description<br/>(Extracted Requirements)"]
    end

    subgraph "Keyword Extraction"
        ExtractResumeKW["Extract Resume Keywords<br/>(Skills, Tools, Technologies)"]
        ExtractJDKW["Extract JD Keywords<br/>(Required + Preferred Skills)"]
        NormalizeKW["Normalize & Stem<br/>(Lowercase, Synonyms)"]
    end

    subgraph "Matching Engine"
        ExactMatch["✅ Exact Match<br/>(Direct keyword hits)"]
        FuzzyMatch["🔍 Fuzzy Match<br/>(Similar terms, abbreviations)"]
        CategoryMatch["📂 Category Match<br/>(Skill groups alignment)"]
        ExperienceMatch["📅 Experience Match<br/>(Years vs. Required)"]
    end

    subgraph "Scoring Components"
        KeywordScore["🔑 Keyword Score<br/>(0-100)"]
        FormatScore["📐 Format Score<br/>(0-100)"]
        SectionScore["📋 Section Completeness<br/>(0-100)"]
        ReadabilityScore["📖 Readability Score<br/>(0-100)"]
        ImpactScore["💪 Impact / Action Verbs<br/>(0-100)"]
    end

    subgraph "ATS Result"
        WeightedCalc["⚖️ Weighted Average<br/>Calculation"]
        FinalScore["🎯 Final ATS Score<br/>(0-100)"]
        MissingKW["❌ Missing Keywords"]
        MatchedKW["✅ Matched Keywords"]
        Recommendations["💡 Score Improvement<br/>Recommendations"]
    end

    Resume --> ExtractResumeKW
    JD --> ExtractJDKW
    ExtractResumeKW --> NormalizeKW
    ExtractJDKW --> NormalizeKW

    NormalizeKW --> ExactMatch
    NormalizeKW --> FuzzyMatch
    NormalizeKW --> CategoryMatch
    NormalizeKW --> ExperienceMatch

    ExactMatch --> KeywordScore
    FuzzyMatch --> KeywordScore
    CategoryMatch --> KeywordScore
    ExperienceMatch --> KeywordScore

    Resume --> FormatScore
    Resume --> SectionScore
    Resume --> ReadabilityScore
    Resume --> ImpactScore

    KeywordScore --> WeightedCalc
    FormatScore --> WeightedCalc
    SectionScore --> WeightedCalc
    ReadabilityScore --> WeightedCalc
    ImpactScore --> WeightedCalc

    WeightedCalc --> FinalScore
    KeywordScore --> MissingKW
    KeywordScore --> MatchedKW
    FinalScore --> Recommendations

    style FinalScore fill:#10B981,stroke:#059669,color:#fff
    style KeywordScore fill:#F59E0B,stroke:#D97706,color:#000
    style MissingKW fill:#EF4444,stroke:#DC2626,color:#fff
    style MatchedKW fill:#10B981,stroke:#059669,color:#fff
```

---

### 12. Interview Question Generation Flow

```mermaid
graph TD
    subgraph "User Input"
        ResumeData["📄 Resume Data"]
        InterviewType["🎯 Interview Type<br/>(Technical / Behavioral /<br/>System Design / HR / DSA)"]
        Difficulty["📊 Difficulty Level<br/>(Easy / Medium / Hard)"]
        Role["💼 Target Role"]
        Company["🏢 Target Company"]
    end

    subgraph "Genkit AI Flows"
        GenSession["generate-interview-session<br/>(Create Full Session)"]
        GenQuestions["generate-interview-questions<br/>(Type-Specific Questions)"]
        GenDSA["generate-dsa-questions<br/>(Coding Problems)"]
        GenFollowUp["generate-follow-up-question<br/>(Contextual Follow-Ups)"]
    end

    subgraph "Question Processing"
        ContextBuilder["🧩 Build Context<br/>(Resume + Role + Company)"]
        PromptOptimizer["⚙️ Prompt Optimizer<br/>(Token Optimization)"]
        AIRouter["🧠 Smart Router<br/>(Select Provider)"]
    end

    subgraph "Interview Session"
        QuestionBank["📋 Question Bank<br/>(5-15 Questions)"]
        PracticeMode["🎙️ Practice Mode<br/>(One at a Time)"]
        AnswerInput["✍️ User Answers<br/>(Text / Code)"]
    end

    subgraph "Evaluation"
        EvalAnswer["evaluate-interview-answer<br/>(Score + Feedback)"]
        EvalCode["evaluate-code-solution<br/>(for DSA)"]
        ScoreCard["📊 Score Card<br/>(Per Question)"]
        OverallFeedback["🏆 Overall Feedback<br/>& Recommendations"]
    end

    subgraph "Storage"
        SaveInterview["💾 Save to Interview Table"]
        UpdateUsage["📈 Update UsageRecord"]
    end

    ResumeData --> ContextBuilder
    InterviewType --> ContextBuilder
    Difficulty --> ContextBuilder
    Role --> ContextBuilder
    Company --> ContextBuilder

    ContextBuilder --> PromptOptimizer --> AIRouter

    AIRouter --> GenSession
    AIRouter --> GenQuestions
    AIRouter --> GenDSA

    GenSession --> QuestionBank
    GenQuestions --> QuestionBank
    GenDSA --> QuestionBank

    QuestionBank --> PracticeMode
    PracticeMode --> AnswerInput

    AnswerInput --> EvalAnswer
    AnswerInput --> EvalCode
    EvalAnswer --> ScoreCard
    EvalCode --> ScoreCard

    PracticeMode --> GenFollowUp
    GenFollowUp --> PracticeMode

    ScoreCard --> OverallFeedback
    OverallFeedback --> SaveInterview
    SaveInterview --> UpdateUsage

    style GenSession fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style GenQuestions fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style GenDSA fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style EvalAnswer fill:#10B981,stroke:#059669,color:#fff
    style EvalCode fill:#10B981,stroke:#059669,color:#fff
    style OverallFeedback fill:#F59E0B,stroke:#D97706,color:#000
```

---

## 🎨 Product & UX

### 13. User Flow Diagram

```mermaid
graph TD
    Landing["🏠 Landing Page<br/>(Hero + Features + Pricing)"]

    Landing -->|"CTA: Get Started"| SignUp["📝 Sign Up Page"]
    Landing -->|"Already have account"| Login["🔐 Login Page"]
    Landing -->|"View Plans"| Pricing["💰 Pricing Page"]

    SignUp -->|"Email/Password"| VerifyEmail["📧 Verify Email"]
    SignUp -->|"Google OAuth"| Dashboard
    Login -->|"Success"| Dashboard
    VerifyEmail -->|"Verified"| Dashboard

    Dashboard["📊 Dashboard"]

    Dashboard -->|"Upload"| UploadResume["📤 Upload Resume"]
    Dashboard -->|"Create"| CreateResume["✏️ Create Resume"]
    Dashboard -->|"Library"| ResumeLibrary["📚 Resume Library"]
    Dashboard -->|"Interview"| InterviewHub["🎤 Interview Hub"]
    Dashboard -->|"Profile"| Profile["👤 Profile"]

    UploadResume --> AnalysisView["📈 Analysis View"]

    AnalysisView --> ATSScore["🎯 ATS Score Tab"]
    AnalysisView --> Improvements["💡 Improvements Tab"]
    AnalysisView --> CoverLetter["💌 Cover Letter Tab"]
    AnalysisView --> QAChat["❓ Q&A Chat Tab"]
    AnalysisView --> ExportView["📥 Export Tab"]

    CreateResume --> TemplateGallery["🎨 Template Gallery"]
    TemplateGallery --> ResumeEditor["✏️ Resume Editor"]
    ResumeEditor --> LivePreview["👁️ Live Preview"]
    LivePreview --> ExportView

    InterviewHub --> SelectType["Choose Interview Type"]
    SelectType --> MockSession["🎙️ Mock Session"]
    MockSession --> Results["📊 Results & Feedback"]

    Profile --> EditProfile["Edit Profile"]
    Profile --> ManageSub["Manage Subscription"]
    ManageSub --> Pricing

    Pricing -->|"Subscribe"| PaymentFlow["💳 Razorpay Checkout"]
    PaymentFlow -->|"Success"| Dashboard

    style Landing fill:#4F46E5,stroke:#3730A3,color:#fff
    style Dashboard fill:#10B981,stroke:#059669,color:#fff
    style AnalysisView fill:#F59E0B,stroke:#D97706,color:#000
    style ExportView fill:#EF4444,stroke:#DC2626,color:#fff
    style PaymentFlow fill:#8B5CF6,stroke:#7C3AED,color:#fff
```

---

### 14. Dashboard Navigation Diagram

```mermaid
graph LR
    subgraph "Top Navigation Bar"
        Logo["🎯 Resume Buddy Logo"]
        NavLinks["Dashboard | Library | Interview | Pricing"]
        UserMenu["👤 Avatar Dropdown"]
    end

    subgraph "Dashboard Home (/dashboard)"
        Welcome["👋 Welcome Banner"]
        Stats["📊 Usage Stats Cards<br/>(Analyses | Interviews | Resumes)"]
        QuickActions["⚡ Quick Actions<br/>(Upload | Create | Practice)"]
        RecentResumes["📄 Recent Resumes"]
        TierBadge["🏷️ Subscription Tier Badge"]
    end

    subgraph "Feature Pages"
        Analysis["/analysis<br/>📈 Resume Analysis"]
        Improvement["/improvement<br/>💡 Improvements"]
        CoverLetter["/cover-letter<br/>💌 Cover Letter"]
        Interview["/interview<br/>🎤 Mock Interview"]
        QA["/qa<br/>❓ Q&A"]
        CreateResume["/create-resume<br/>✏️ Resume Builder"]
        Library["/resume-library<br/>📚 Resume Library"]
    end

    subgraph "Account Pages"
        Profile["/profile<br/>👤 Profile Settings"]
        Billing["/billing<br/>💳 Billing & Plans"]
        Admin["/admin<br/>🛡️ Admin Panel"]
    end

    Logo --> Welcome
    NavLinks --> Analysis & Interview & Library
    UserMenu --> Profile & Billing & Admin

    QuickActions --> Analysis
    QuickActions --> CreateResume
    QuickActions --> Interview
    RecentResumes --> Analysis

    Analysis --> Improvement
    Analysis --> CoverLetter
    Analysis --> QA

    style Welcome fill:#4F46E5,stroke:#3730A3,color:#fff
    style Stats fill:#10B981,stroke:#059669,color:#fff
    style QuickActions fill:#F59E0B,stroke:#D97706,color:#000
```

---

### 15. Resume Builder Screen Flow

```mermaid
graph TD
    Entry["✏️ Create Resume<br/>(Entry Point)"]

    Entry --> Templates["🎨 Template Selection<br/>(Grid of Templates)"]
    Templates --> Editor["📝 Resume Editor"]

    subgraph "Editor Layout"
        direction LR
        Sidebar["📋 Section Navigator<br/>(Accordion Sidebar)"]
        MainForm["📝 Form Area<br/>(Active Section)"]
        Preview["👁️ Live Preview<br/>(Real-time Render)"]
    end

    Editor --> Sidebar & MainForm & Preview

    subgraph "Editable Sections"
        S1["👤 Personal Information"]
        S2["📝 Professional Summary"]
        S3["💼 Work Experience"]
        S4["🎓 Education"]
        S5["🛠️ Skills"]
        S6["📁 Projects"]
        S7["🏆 Certifications"]
        S8["🌐 Languages"]
        S9["📚 Publications"]
    end

    Sidebar --> S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9

    subgraph "Editor Features"
        DnD["🔀 Drag & Drop<br/>(Reorder Sections)"]
        AutoSave["💾 Auto-Save"]
        AIAssist["🤖 AI Writing Assist"]
    end

    MainForm --> DnD & AutoSave & AIAssist

    subgraph "Export Options"
        ExportPDF["📄 Export as PDF"]
        ExportDOCX["📝 Export as DOCX"]
        ExportLaTeX["📐 Export as LaTeX"]
    end

    Preview --> ExportPDF & ExportDOCX & ExportLaTeX

    subgraph "LaTeX Export Pipeline"
        SelectTemplate["Select LaTeX Template"]
        CompileLaTeX["🔧 LaTeX Service<br/>(Docker Compilation)"]
        DownloadPDF["📥 Download PDF"]
    end

    ExportLaTeX --> SelectTemplate --> CompileLaTeX --> DownloadPDF

    style Entry fill:#4F46E5,stroke:#3730A3,color:#fff
    style Templates fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style Preview fill:#10B981,stroke:#059669,color:#fff
    style AIAssist fill:#F59E0B,stroke:#D97706,color:#000
```

---

## 💼 Business / SaaS

### 16. Subscription & Billing Flow Diagram

```mermaid
graph TD
    subgraph "User Journey"
        FreeUser["👤 Free Tier User"]
        ViewPricing["💰 View Pricing Page"]
        SelectPlan["📦 Select Pro Plan"]
    end

    subgraph "Payment Flow"
        CreateOrder["📋 Create Razorpay Order<br/>(Server Action)"]
        Checkout["💳 Razorpay Checkout<br/>(Client-Side Modal)"]
        PaymentProcess["⚙️ Payment Processing"]
    end

    subgraph "Verification"
        Webhook["🔔 Razorpay Webhook<br/>(/api/webhooks/razorpay)"]
        VerifySignature["🔐 Verify Payment<br/>Signature (HMAC)"]
    end

    subgraph "Subscription Management"
        ActivateSub["✅ Activate Subscription"]
        UpdateDB["💾 Update Subscription<br/>& Payment Records"]
        SendEmail["📧 Send Confirmation<br/>(Resend Email)"]
    end

    subgraph "Ongoing Management"
        CheckAccess["🔍 Check Feature Access<br/>(Middleware + access-control.ts)"]
        UsageTracking["📊 Track Feature Usage<br/>(UsageRecord)"]
        RenewOrExpire{"📅 Period End?"}
        Renew["🔄 Auto-Renew"]
        Expire["⏰ Expire Subscription"]
        Cancel["❌ User Cancels"]
    end

    subgraph "Admin Controls"
        AdminConfig["🛡️ Admin: Configure Pricing<br/>(SubscriptionConfig model)"]
        TestMode["🧪 Toggle Test Mode"]
        ViewPayments["📊 View Payment Reports"]
    end

    FreeUser --> ViewPricing --> SelectPlan
    SelectPlan --> CreateOrder
    CreateOrder --> Checkout
    Checkout -->|"Success"| PaymentProcess
    Checkout -->|"Failed"| ViewPricing

    PaymentProcess --> Webhook
    Webhook --> VerifySignature
    VerifySignature -->|"Valid"| ActivateSub
    VerifySignature -->|"Invalid"| PaymentFailed["❌ Payment Failed"]

    ActivateSub --> UpdateDB
    UpdateDB --> SendEmail

    ActivateSub --> CheckAccess
    CheckAccess --> UsageTracking
    UsageTracking --> RenewOrExpire
    RenewOrExpire -->|"Renew"| Renew --> ActivateSub
    RenewOrExpire -->|"Expired"| Expire --> FreeUser
    CheckAccess --> Cancel --> Expire

    AdminConfig --> TestMode
    AdminConfig --> ViewPayments

    style FreeUser fill:#6B7280,stroke:#4B5563,color:#fff
    style Checkout fill:#072654,stroke:#051D40,color:#fff
    style ActivateSub fill:#10B981,stroke:#059669,color:#fff
    style Expire fill:#EF4444,stroke:#DC2626,color:#fff
    style AdminConfig fill:#F59E0B,stroke:#D97706,color:#000
```

---

### 17. Admin Panel Architecture Diagram

```mermaid
graph TB
    subgraph "Admin Access Control"
        AdminLogin["🔐 Admin Login<br/>(Role: ADMIN)"]
        RBACCheck["🛡️ RBAC Middleware<br/>(access-control.ts)"]
    end

    subgraph "Admin Dashboard (/admin)"
        direction TB
        Overview["📊 System Overview"]
        UserStats["👥 User Statistics"]
        RevenueStats["💰 Revenue Dashboard"]
        APIHealth["🔗 API Health Monitor"]
    end

    subgraph "User Management"
        UserList["📋 User List<br/>(Search, Filter, Sort)"]
        UserDetail["👤 User Detail View"]
        SuspendUser["⛔ Suspend / Activate User"]
        DeleteUser["🗑️ Delete User"]
    end

    subgraph "Subscription Config"
        PricingConfig["💰 Set Pricing<br/>(INR, Test Mode)"]
        PlanDuration["📅 Set Plan Duration"]
        TestModeToggle["🧪 Test Mode Toggle"]
    end

    subgraph "Analytics & Logs"
        APILogs["📝 API Call Logs<br/>(ApiCallLog model)"]
        UserActivity["📊 User Activity<br/>(UserActivity model)"]
        AdminActions["🛡️ Admin Audit Trail<br/>(AdminAction model)"]
        UsageReports["📈 Feature Usage<br/>(UsageRecord)"]
    end

    subgraph "System Operations"
        DBCleanup["🧹 Database Cleanup<br/>(/api/admin/cleanup)"]
        EmergencyCleanup["🚨 Emergency Cleanup<br/>(retention: 3 days)"]
        HealthEndpoint["❤️ Health Check<br/>(/api/health)"]
        Metrics["📊 System Metrics<br/>(/api/metrics)"]
    end

    AdminLogin --> RBACCheck
    RBACCheck --> Overview & UserStats & RevenueStats & APIHealth

    Overview --> UserList
    UserList --> UserDetail
    UserDetail --> SuspendUser & DeleteUser

    Overview --> PricingConfig
    PricingConfig --> PlanDuration & TestModeToggle

    Overview --> APILogs & UserActivity & AdminActions & UsageReports
    Overview --> DBCleanup & EmergencyCleanup & HealthEndpoint & Metrics

    style AdminLogin fill:#EF4444,stroke:#DC2626,color:#fff
    style RBACCheck fill:#F59E0B,stroke:#D97706,color:#000
    style Overview fill:#4F46E5,stroke:#3730A3,color:#fff
    style DBCleanup fill:#6B7280,stroke:#4B5563,color:#fff
    style EmergencyCleanup fill:#DC2626,stroke:#B91C1C,color:#fff
```

---

## 🏆 Minimum Set Summary

If you need only the **6 most essential diagrams**, refer to:

| # | Diagram | Section |
|---|---------|---------|
| 1 | **System Architecture** | [§1](#1-system-architecture-diagram) |
| 2 | **User Workflow** | [§4](#4-user-workflow-diagram) |
| 3 | **Data Flow Diagram** | [§6](#6-data-flow-diagram-dfd--level-1) |
| 4 | **Use Case Diagram** | [§7](#7-use-case-diagram) |
| 5 | **ER Diagram** | [§8](#8-entity-relationship-er-diagram) |
| 6 | **AI Pipeline** | [§10](#10-ai-resume-analysis-pipeline-diagram) |

---

> **Generated**: February 2026 · Based on Resume Buddy v3 source code analysis
