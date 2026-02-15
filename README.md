# ResumeBuddy: AI-Powered Resume Analyzer

ResumeBuddy is a Next.js application that leverages AI to help you analyze and improve your resume based on a target job description. It provides an ATS score, identifies skill gaps, suggests improvements, and generates interview questions, all while securely storing your data in Firebase Firestore.

## Features

- **Resume Upload**: Upload your resume in PDF, DOCX, or TXT format.
- **Job Description Input**: Paste a job description to analyze your resume against.
- **AI-Powered Analysis**: Get an ATS score, keyword analysis, and content coverage percentage.
- **Resume Improvement**: Receive AI-generated suggestions to enhance your resume's content.
- **Q&A Generation**: Generate potential questions and answers based on your resume.
- **Interview Prep**: Get tailored interview questions based on the role and your resume.
- **Secure Authentication**: User authentication with Firebase (Email/Password & Google).
- **Persistent Data**: All user data and analysis results are stored in Cloud Firestore.

## Project Setup

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

- **Node.js**: Version 18.x or later. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: Should be installed automatically with Node.js.

### 2. Clone the Repository

Clone this repository to your local machine using your preferred method (HTTPS or SSH).

```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 3. Install Dependencies

Install all the required packages using npm.

```bash
npm install
```

### 4. Set Up Environment Variables

You need to connect the application to your own Firebase project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  In your project settings, add a new Web App.
3.  Firebase will provide you with a `firebaseConfig` object.
4.  Create a new file named `.env` in the root of your project.
5.  Copy the configuration values into your `.env` file, following the format below:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# AI Provider Configuration (Multi-Provider System)
# Primary: Groq (14,400 requests/day free) - https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Backup: Google Gemini (1,500 requests/day free) - https://aistudio.google.com/apikey
GOOGLE_API_KEY=your_gemini_api_key

# Tertiary: OpenRouter (Free Llama/Mistral models) - https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
```

6.  In the Firebase Console, go to **Authentication** > **Sign-in method** and enable **Email/Password** and **Google** as sign-in providers.
7.  Go to **Firestore Database** and create a database in production mode.

### 5. Running the Project

Once the setup is complete, you can run the development server.

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

## AI Provider System

ResumeBuddy uses a multi-provider AI system with automatic fallback for maximum reliability:

| Provider | Priority | Free Tier | Use Case |
|----------|----------|-----------|----------|
| **Groq** | Primary | 14,400 req/day | Fastest inference, Llama 3.1 70B |
| **Gemini** | Backup | 1,500 req/day | Google's reliable fallback |
| **OpenRouter** | Tertiary | Varies | Free Llama/Mistral models |

**Combined Free Tier Capacity: ~16,900 requests/day**

The system automatically:
- Falls back to the next provider if one fails or hits rate limits
- Caches responses to reduce API calls (1 hour TTL)
- Tracks daily usage per provider
- Logs provider status for monitoring

### API Optimization Features

ResumeBuddy includes comprehensive optimization to minimize API costs and support 500+ concurrent users:

| Strategy | Reduction | Description |
|----------|-----------|-------------|
| **Response Caching** | 40-60% | LRU cache with 1hr TTL |
| **Request Deduplication** | 10-20% | Prevents concurrent duplicate requests |
| **Prompt Compression** | 20-30% tokens | Removes unnecessary whitespace |
| **User-Level Caching** | 30-40% | Caches per-user analysis results |
| **Rate Limiting** | N/A | Operation-specific user limits |
| **Global Rate Limiting** | N/A | Provider-level limit tracking |
| **Retry with Backoff** | N/A | Handles transient failures |
| **Usage Analytics** | N/A | Tracks usage for monitoring |

### Optimization Files

```
src/lib/
├── response-cache.ts        # LRU response caching
├── request-deduplicator.ts  # Concurrent request deduplication
├── user-cache.ts            # Per-user analysis caching
├── prompt-optimizer.ts      # Prompt compression utilities
├── rate-limiter.ts          # User rate limiting
├── global-rate-limiter.ts   # Provider rate limiting
├── retry-handler.ts         # Exponential backoff retries
└── usage-analytics.ts       # Usage tracking & alerts
```

### Supported AI Features:
- Resume content analysis & ATS scoring
- Interview question generation
- Resume Q&A generation
- Intelligent resume parsing
- Job description structuring
- Resume improvement suggestions

### Using the Debounced AI Hook

For real-time analysis while typing:

```tsx
import { useDebouncedAI } from '@/hooks/use-debounced-ai';

function ResumeEditor() {
  const { execute, result, isLoading } = useDebouncedAI(
    async (text: string) => await analyzeResume(text),
    { delay: 2000 }
  );

  return (
    <textarea onChange={(e) => execute(e.target.value)} />
  );
}
```
