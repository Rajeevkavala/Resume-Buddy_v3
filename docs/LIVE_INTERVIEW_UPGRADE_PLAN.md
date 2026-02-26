# Live Interview — Complete Upgrade & Bug Fix Plan

> **Scope**: End-to-end analysis, critical bug fixes, and next-level upgrade of the Live Interview feature using **Sarvam AI exclusively** (STT, TTS, LLM).
>
> **Date**: February 24, 2026  
> **Current State**: V2 hook (`use-live-interview.ts`) with hybrid Browser WebSpeech STT + Browser/Sarvam TTS  
> **Target State**: V3 — Full Sarvam AI pipeline (STT + TTS + LLM), real-time conversations, session persistence, and production-grade reliability

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Critical Bugs Identified](#2-critical-bugs-identified)
3. [Crucial Issues & Design Gaps](#3-crucial-issues--design-gaps)
4. [Upgrade Plan — Sarvam AI Only](#4-upgrade-plan--sarvam-ai-only)
5. [Phase 1: Critical Bug Fixes](#5-phase-1-critical-bug-fixes)
6. [Phase 2: Sarvam-Only STT Migration](#6-phase-2-sarvam-only-stt-migration)
7. [Phase 3: Sarvam-Only TTS (Remove Browser TTS)](#7-phase-3-sarvam-only-tts-remove-browser-tts)
8. [Phase 4: Sarvam LLM Integration](#8-phase-4-sarvam-llm-integration)
9. [Phase 5: Real-Time Streaming & WebSocket Upgrade](#9-phase-5-real-time-streaming--websocket-upgrade)
10. [Phase 6: Session Persistence & History](#10-phase-6-session-persistence--history)
11. [Phase 7: Advanced Features](#11-phase-7-advanced-features)
12. [Phase 8: UI/UX Enhancements](#12-phase-8-uiux-enhancements)
13. [File-by-File Change Map](#13-file-by-file-change-map)
14. [Environment & Configuration Changes](#14-environment--configuration-changes)
15. [Testing Strategy](#15-testing-strategy)
16. [Rollout Plan](#16-rollout-plan)

---

## 1. Current Architecture Analysis

### 1.1 File Inventory

| Layer | File | Lines | Purpose |
|-------|------|-------|---------|
| **Hook V1 (backup)** | `src/hooks/use-live-interview.v1.bak.ts` | 682 | Original Sarvam STT + TTS pipeline (deprecated) |
| **Hook V2 (active)** | `src/hooks/use-live-interview.ts` | ~570 | Browser WebSpeech STT + Browser/Sarvam TTS hybrid |
| **Sarvam Provider** | `src/ai/providers/sarvam.ts` | ~420 | STT (Saarika), TTS (Bulbul v2/v3), LLM (Sarvam-M) |
| **Sarvam Recorder** | `src/lib/speech/sarvam-recorder.ts` | 479 | MediaRecorder → base64 → `/api/live-interview/stt` |
| **Sarvam Player** | `src/lib/speech/sarvam-player.ts` | 326 | Base64 WAV → AudioContext playback with queue |
| **API: Start** | `src/app/api/live-interview/start/route.ts` | ~145 | Session init, first question gen, TTS greeting |
| **API: Respond** | `src/app/api/live-interview/respond/route.ts` | ~155 | AI conversation turn, score/action, TTS |
| **API: Evaluate** | `src/app/api/live-interview/evaluate/route.ts` | ~100 | Final session evaluation with scoring |
| **API: STT** | `src/app/api/live-interview/stt/route.ts` | ~90 | Server-side Sarvam STT proxy |
| **API: TTS** | `src/app/api/live-interview/tts/route.ts` | ~70 | Server-side Sarvam TTS proxy |
| **Room Component** | `src/components/live-interview/live-interview-room.tsx` | ~200 | Phase-based rendering orchestrator |
| **Config Panel** | `src/components/live-interview/live-config-panel.tsx` | 375 | Interview setup (type, difficulty, voice settings) |
| **Controls** | `src/components/live-interview/live-controls.tsx` | ~200 | Mic toggle, text input, end session |
| **Transcript** | `src/components/live-interview/live-transcript.tsx` | ~170 | Chat-style conversation display |
| **Visualizer** | `src/components/live-interview/live-audio-visualizer.tsx` | ~160 | Animated orb + waveform canvas |
| **Code Editor** | `src/components/live-interview/live-code-editor.tsx` | 214 | DSA code editing panel |
| **Evaluation** | `src/components/live-interview/live-evaluation-view.tsx` | 262 | Results display (scores, feedback) |
| **Smart Router** | `src/ai/smart-router.ts` | 598 | Model routing (includes `live-interview-respond`) |
| **Interview Service** | `src/lib/interview-service.ts` | 239 | Prisma/PostgreSQL persistence |
| **Interview Types** | `src/lib/types/interview.ts` | 224 | Shared type definitions |

### 1.2 Current Data Flow

```
┌─────────────────── V2 PIPELINE (Current) ───────────────────┐
│                                                              │
│  User speaks                                                 │
│    → Browser WebSpeech API (SpeechRecognition)               │
│    → Interim + Final transcript (client-side, zero latency)  │
│    → 4s silence auto-submit OR manual stop                   │
│                                                              │
│  Transcript text                                             │
│    → POST /api/live-interview/respond                        │
│    → smartGenerate('live-interview-respond')                  │
│       → Groq llama-3.1-8b-instant (primary)                 │
│       → Groq llama-3.3-70b-versatile (fallback)             │
│       → Gemini 1.5 Flash (last resort)                      │
│    → JSON { response, action, score, feedback }              │
│                                                              │
│  AI response text                                            │
│    → Browser speechSynthesis (default, instant)              │
│    → OR Sarvam TTS bulbul:v3 (opt-in, HD quality)           │
│    → Audio plays → transition to 'listening'                  │
│                                                              │
│  Session end                                                 │
│    → POST /api/live-interview/evaluate                       │
│    → Full transcript → comprehensive evaluation JSON         │
│    → Display LiveEvaluationView                              │
│                                                              │
│  ⚠ NO session persistence to database                       │
│  ⚠ NO WebSocket integration                                 │
│  ⚠ V1 Sarvam STT recorder is unused (orphaned code)        │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Sarvam AI Capabilities Available

| Service | API | Model | Limits | Status |
|---------|-----|-------|--------|--------|
| **STT** | `/speech-to-text` | `saarika:v2.5` | multipart/form-data file upload | ✅ Implemented but unused in V2 |
| **STT** | `/speech-to-text` | `saaras:v3` | transcribe/translate/verbatim modes | ⚠ Defined but not used |
| **STT Translate** | `/speech-to-text-translate` | `saaras:v2.5` | Auto-translate to English | ⚠ Defined but not used |
| **TTS** | `/text-to-speech` | `bulbul:v3` | 2500 chars, 39 speakers, temperature | ✅ Optional in V2 |
| **TTS** | `/text-to-speech` | `bulbul:v2` | 1500 chars, 7 speakers, pitch/loudness | ✅ Available |
| **LLM** | `/v1/chat/completions` | `sarvam-m` | OpenAI-compatible, JSON mode | ⚠ Implemented but never called |

---

## 2. Critical Bugs Identified

### BUG-001: Stale Closure in `evaluateSession` (V1 hook — affects V2 via same pattern)

**File**: `src/hooks/use-live-interview.v1.bak.ts:505-540`  
**Severity**: 🔴 Critical  
**Description**: `evaluateSession` is called from within `submitTranscript`'s closure, but it captures stale `state.messages` at the time of the closure creation. By the time evaluation is triggered (after the last AI response), the messages array is missing the final AI message because `setState` hasn't flushed yet.

```typescript
// BUG: evaluateSession captures messages from when submitTranscript was defined
// The AI response message was just setState'd but not yet in state
const afterSpeak = () => {
  if (isComplete) {
    evaluateSession(); // Uses stale state.messages!
  }
};
```

**Impact**: Evaluation always misses the last AI response and last user answer.

**Fix**: Use `stateRef.current.messages` pattern (V2 partially does this but still has the same issue in `doEvaluate`).

---

### BUG-002: `doEvaluate` in V2 Reads Stale Messages

**File**: `src/hooks/use-live-interview.ts:260-295`  
**Severity**: 🔴 Critical  
**Description**: `doEvaluate` reads `stateRef.current` which should be fresh, BUT it's called from `afterSpeak` inside `submitAnswer` which runs asynchronously after `setState`. The `stateRef` is updated synchronously, but the actual state update (with the new AI message) happens in a `setState` call just before `afterSpeak` is defined. Due to React's batching, `stateRef.current.messages` may not include the messages that were just set.

```typescript
// Line 254: setState adds aiMsg to messages
setState(prev => ({
  ...prev,
  phase: 'speaking',
  messages: [...updatedMessages, aiMsg], // aiMsg added here
  ...
}));

// But stateRef.current is updated via useEffect-like sync:
// const stateRef = useRef(state);
// stateRef.current = state;
// This runs AFTER render, not immediately after setState

const afterSpeak = () => {
  if (isComplete) {
    doEvaluate(); // stateRef.current.messages may be stale!
  }
};
```

**Impact**: Evaluation transcript may be incomplete (missing final exchange).

**Fix**: Pass the complete messages array directly to `doEvaluate` as a parameter instead of reading from ref.

---

### BUG-003: WebSpeech API `continuous` Mode Race Condition

**File**: `src/hooks/use-live-interview.ts:350-375`  
**Severity**: 🔴 Critical  
**Description**: `recognition.continuous = true` combined with `recognition.onend` submitting the answer creates a race condition. In Chrome, the `onend` event fires when the recognition stops, but sometimes Chrome auto-restarts `continuous` recognition before `onend` fires. The user's accumulated text may be submitted prematurely or duplicated.

```typescript
recognition.onend = () => {
  // This fires when recognition stops, but in continuous mode,
  // Chrome may auto-restart before this fires, causing text duplication
  const text = accumulatedRef.current.trim();
  if (text.length > 0) {
    submitAnswer(text); // May submit partial text
  }
};
```

**Impact**: Duplicate or partial answer submissions; user hears AI respond to incomplete answers.

**Fix**: Add a `submittedRef` guard flag, or debounce the onend handler.

---

### BUG-004: Auto-Start Listening Creates Infinite Loop on Error

**File**: `src/hooks/use-live-interview.ts:390-395`  
**Severity**: 🟡 High  
**Description**: The `useEffect` that auto-starts listening when phase becomes `'listening'` runs every time `startListening` changes or `state.phase` changes. If `startListening` fails (e.g., mic busy, browser not supported), the phase stays at `'listening'` and the effect retriggers every 400ms forever.

```typescript
useEffect(() => {
  if (state.phase === 'listening' && !state.isMicActive) {
    const t = setTimeout(() => startListening(), 400);
    return () => clearTimeout(t);
  }
}, [state.phase, state.isMicActive, startListening]);
// If startListening fails silently, isMicActive stays false, phase stays 'listening'
// → effect retriggers → infinite loop
```

**Impact**: CPU spike, toast spam, potential tab crash.

**Fix**: Add a retry counter ref; after 3 failed attempts, transition to a `'mic-error'` state or show text-only mode.

---

### BUG-005: No Auth/Rate-Limiting on Live Interview API Routes

**File**: All `src/app/api/live-interview/*/route.ts`  
**Severity**: 🔴 Critical (Security)  
**Description**: None of the 5 API routes (`start`, `respond`, `evaluate`, `stt`, `tts`) have:
- Session/JWT authentication checks
- Rate limiting (`enforceRateLimitAsync`)
- Subscription tier checks (`assertFeatureAllowed`)
- User ID validation (the `userId` comes from the request body, trivially spoofable)

```typescript
// /api/live-interview/start/route.ts — NO auth check
export async function POST(req: NextRequest) {
  const body: StartRequest = await req.json();
  // body.userId is trusted without verification!
  // No session cookie check, no rate limit
}
```

**Impact**: Anyone can make unlimited API calls (Sarvam AI + Groq costs), impersonate users, abuse the system.

**Fix**: Add middleware-style auth extraction from session cookie, rate limiting per user, and tier-based access control.

---

### BUG-006: Session Not Persisted to Database

**File**: `src/hooks/use-live-interview.ts` (entire hook)  
**Severity**: 🟡 High  
**Description**: The live interview session exists only in React state. If the user refreshes the page, navigates away, or closes the tab, the entire interview (conversation, evaluation) is lost. The `sessionId` is a simple string (`live_${userId}_${Date.now()}`) never written to PostgreSQL.

The `interview-service.ts` has full CRUD for sessions/questions/answers via Prisma, but the live interview feature doesn't use it at all.

**Impact**: Users lose interview history; no analytics possible; evaluation results disappear.

**Fix**: Persist session on start, save each turn incrementally, save evaluation on completion.

---

### BUG-007: `score` Field Mismatch (0-100 vs 0-10 Display)

**File**: `src/components/live-interview/live-transcript.tsx:127`  
**Severity**: 🟡 Medium  
**Description**: The API returns `score: 0-100` but the transcript displays it as `{msg.score}/10`:

```tsx
{msg.score != null && (
  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
    {msg.score}/10  {/* BUG: score is 0-100 from API */}
  </Badge>
)}
```

**Impact**: Score "85" would display as "85/10" — confusing and incorrect.

**Fix**: Either normalize to 0-10 (`Math.round(score / 10)`) or display as `/100`.

---

### BUG-008: `elapsedTime` Never Updates During Interview

**File**: `src/components/live-interview/live-interview-room.tsx:57-62`  
**Severity**: 🟡 Medium  
**Description**: `elapsedTime` is computed via `useMemo` with deps `[live.startedAt, live.phase]`. It only recalculates when the phase changes (e.g., listening→thinking→speaking). During long listening or speaking phases, the timer appears frozen.

```typescript
const elapsedTime = useMemo(() => {
  if (!live.startedAt) return '00:00';
  const now = Date.now();
  const diff = now - live.startedAt;
  // Only recalculates on phase change, not every second!
}, [live.startedAt, live.phase]);
```

**Impact**: Timer shows stale values; appears broken to users.

**Fix**: Use `useEffect` + `setInterval` (1s) to update a `Date.now()` state value.

---

### BUG-009: Sarvam Recorder Singleton Config Immutability

**File**: `src/lib/speech/sarvam-recorder.ts:467-474`  
**Severity**: 🟡 Medium  
**Description**: `getSarvamRecorder(config?)` creates a singleton. If called first with `{ silenceTimeout: 2500 }` and later with `{ silenceTimeout: 5000 }`, the second config is silently ignored. The V1 hook calls it once with fixed config. But if a user changes settings between sessions, the old config persists.

**Fix**: Either accept config per `start()` call, or expose `resetSarvamRecorder()` (already exists but never called).

---

### BUG-010: Browser TTS Voice Selection is Fragile

**File**: `src/hooks/use-live-interview.ts:130-140`  
**Severity**: 🟡 Medium  
**Description**: `browserSpeak()` tries to find a preferred voice by name (`Google US English`, `Microsoft David`, `Samantha`). On many browsers, voices load asynchronously (`speechSynthesis.getVoices()` returns `[]` initially). The code doesn't wait for `voiceschanged` event, so the first TTS attempt often uses the wrong voice or no voice.

```typescript
const voices = window.speechSynthesis.getVoices(); // May return [] on first call!
const preferred = voices.find(v => v.name.includes('Google US English') || ...);
```

**Impact**: First greeting plays in wrong accent/language or silently fails.

**Fix**: Remove Browser TTS entirely (Sarvam-only upgrade), or add a `voiceschanged` event listener with promise.

---

## 3. Crucial Issues & Design Gaps

### GAP-001: Hybrid STT Architecture (Browser + Sarvam) Creates Inconsistency

- V2 uses **Browser WebSpeech API** for STT (zero latency but unreliable across browsers)
- V1 used **Sarvam STT** (server-round-trip but consistent quality)
- The `sarvam-recorder.ts` (479 lines) is completely unused in V2 — dead code
- WebSpeech API is **not available** in Firefox for Android, Safari < 14.1, or any non-Chromium browser

### GAP-002: No Streaming/WebSocket for Real-Time Feel

- All AI responses are request/response (HTTP POST → wait → complete JSON)
- The WebSocket server (`apps/websocket/`) has interview room support (`interview:join`, `interview:leave`) but it's never used by the live interview feature
- Average response time: 2-5s for LLM + 1-3s for TTS = 3-8s silence gap per turn

### GAP-003: No Session Persistence or History

- Sessions are ephemeral (React state only)
- No way to review past live interviews
- No analytics/progress tracking
- `interview-service.ts` is fully implemented but never called from live interview

### GAP-004: Single-Turn Conversation (No True Back-and-Forth)

- AI can only do: follow-up → feedback → hint → next-question
- No multi-turn probing within a single question (e.g., "Can you elaborate?", "What about edge cases?")
- No ability for AI to interrupt or redirect when user is off-track

### GAP-005: No Sarvam LLM Usage

- `sarvam.ts` has a fully implemented `generateWithSarvam()` function
- It's never called — all LLM calls go through `smartGenerate()` → Groq/Gemini/OpenRouter
- Sarvam-M (their LLM) could provide better Indian English understanding and lower-latency responses for the interview pipeline

### GAP-006: No Audio Streaming (Full Audio Must Complete Before Playback)

- TTS generates complete audio, base64-encodes it, sends it in JSON response
- For long AI responses (2500+ chars), multiple TTS chunks are generated sequentially
- User waits for ALL audio to generate before hearing anything

### GAP-007: No Interruption Handling

- If user wants to interrupt AI while it's speaking, there's no graceful handling
- The "Skip" button stops audio but doesn't signal to the AI that the user interrupted
- No barge-in mechanism

### GAP-008: DSA Code Editor is a Plain Textarea

- No syntax highlighting
- No auto-indentation
- No bracket matching
- No code execution/validation
- Much worse than interview competitors (LeetCode, HackerRank)

---

## 4. Upgrade Plan — Sarvam AI Only

### 4.1 Target Architecture (V3)

```
┌─────────────────── V3 PIPELINE (Target) ────────────────────┐
│                                                              │
│  ┌──────────── Full Sarvam AI Pipeline ──────────────┐      │
│  │                                                    │      │
│  │  User speaks into mic                              │      │
│  │    → MediaRecorder captures audio chunks           │      │
│  │    → Send to /api/live-interview/stt               │      │
│  │    → Sarvam STT (saaras:v3) transcribes            │      │
│  │    → Stream interim results via WebSocket          │      │
│  │                                                    │      │
│  │  Complete transcript                               │      │
│  │    → /api/live-interview/respond                   │      │
│  │    → Sarvam-M LLM (primary)                       │      │
│  │       → Groq (fallback for speed)                  │      │
│  │    → JSON { response, action, score, feedback }    │      │
│  │                                                    │      │
│  │  AI response text                                  │      │
│  │    → Sarvam TTS bulbul:v3                          │      │
│  │    → Stream audio chunks via WebSocket             │      │
│  │    → Client plays with SarvamAudioPlayer           │      │
│  │                                                    │      │
│  │  Session lifecycle                                 │      │
│  │    → Persist to PostgreSQL via interview-service   │      │
│  │    → Track usage for subscription/rate limiting    │      │
│  │    → WebSocket for real-time status updates        │      │
│  │                                                    │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  Enhancements:                                               │
│  • Interruption support (barge-in)                           │
│  • Multi-turn deep probing per question                      │
│  • Streaming TTS (play while generating)                     │
│  • Session persistence & history                             │
│  • Improved code editor (Monaco/CodeMirror)                  │
│  • Real-time typing indicator via WebSocket                  │
│  • Multi-language support (Sarvam supports 11 Indian langs)  │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Sarvam AI API Usage Plan

| Feature | Sarvam API | Model | Usage |
|---------|-----------|-------|-------|
| **Speech-to-Text** | `/speech-to-text` | `saaras:v3` | Primary STT for all voice input |
| **STT Translate** | `/speech-to-text-translate` | `saaras:v2.5` | Hindi/regional language interviews → English |
| **Text-to-Speech** | `/text-to-speech` | `bulbul:v3` | All AI voice output (39 speakers) |
| **LLM** | `/v1/chat/completions` | `sarvam-m` | Primary for interview conversation |
| **Fallback LLM** | Groq via `smartGenerate` | `llama-3.1-8b` | Only when Sarvam-M is down |

---

## 5. Phase 1: Critical Bug Fixes

> **Priority**: Do these FIRST before any feature work.  
> **Estimated effort**: 2-3 days

### Fix 1.1: Add Authentication & Rate Limiting to All API Routes

**Files to modify**:
- `src/app/api/live-interview/start/route.ts`
- `src/app/api/live-interview/respond/route.ts`
- `src/app/api/live-interview/evaluate/route.ts`
- `src/app/api/live-interview/stt/route.ts`
- `src/app/api/live-interview/tts/route.ts`

**Changes**:
```typescript
// Add to EVERY route handler at the top:
import { getSessionFromRequest } from '@/lib/auth';
import { enforceRateLimitAsync } from '@/lib/rate-limiter';
import { assertFeatureAllowed } from '@/lib/subscription-service';

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const session = await getSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit
  try {
    await enforceRateLimitAsync(session.userId, 'live-interview');
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429 });
  }

  // 3. Tier check
  try {
    await assertFeatureAllowed(session.userId, 'live-interview');
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  // 4. Use session.userId instead of body.userId
  const userId = session.userId;
  // ... rest of handler
}
```

**New rate limit config** (`src/lib/rate-limiter.ts`):
```typescript
'live-interview': { windowMs: 60000, maxRequests: 10 },
'live-interview-stt': { windowMs: 60000, maxRequests: 30 },
'live-interview-tts': { windowMs: 60000, maxRequests: 30 },
```

---

### Fix 1.2: Fix Stale Messages in Evaluation

**File**: `src/hooks/use-live-interview.ts`

**Change `doEvaluate` to accept messages parameter**:
```typescript
const doEvaluate = useCallback(async (finalMessages?: LiveMessage[]) => {
  const s = stateRef.current;
  const messagesToEvaluate = finalMessages || s.messages;
  
  setState(p => ({ ...p, phase: 'evaluating', isLoading: true }));

  try {
    const response = await fetch('/api/live-interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: s.sessionId,
        interviewType: s.config?.type,
        difficulty: s.config?.difficulty,
        conversationHistory: messagesToEvaluate.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        totalDurationMs: s.startedAt ? Date.now() - s.startedAt : 0,
        questionsAsked: s.questionIndex + 1,
      }),
    });
    // ...
```

**Update `afterSpeak` in `submitAnswer`** to pass complete messages:
```typescript
const afterSpeak = () => {
  if (isComplete) {
    doEvaluate([...updatedMessages, aiMsg]); // Pass complete messages
  } else {
    // ...
  }
};
```

---

### Fix 1.3: Fix WebSpeech Race Condition

**File**: `src/hooks/use-live-interview.ts`

**Add submission guard**:
```typescript
const submittedRef = useRef(false);

// In startListening:
submittedRef.current = false;

// In recognition.onend:
recognition.onend = () => {
  if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  setState(s => ({ ...s, isMicActive: false, audioLevel: 0, interimText: '' }));
  const text = accumulatedRef.current.trim();
  if (text.length > 0 && !submittedRef.current) {
    submittedRef.current = true;
    submitAnswer(text);
  }
};
```

---

### Fix 1.4: Fix Auto-Start Infinite Loop

**File**: `src/hooks/use-live-interview.ts`

**Add retry counter**:
```typescript
const listenRetryRef = useRef(0);
const MAX_LISTEN_RETRIES = 3;

useEffect(() => {
  if (state.phase === 'listening' && !state.isMicActive) {
    if (listenRetryRef.current >= MAX_LISTEN_RETRIES) {
      toast.error('Microphone unavailable', {
        description: 'Switching to text-only mode.',
      });
      return; // Stop retrying
    }
    const t = setTimeout(() => {
      listenRetryRef.current++;
      startListening();
    }, 400);
    return () => clearTimeout(t);
  }
  // Reset counter on successful activation
  if (state.isMicActive) {
    listenRetryRef.current = 0;
  }
}, [state.phase, state.isMicActive, startListening]);
```

---

### Fix 1.5: Fix Score Display

**File**: `src/components/live-interview/live-transcript.tsx:127`

```tsx
// Change from:
{msg.score}/10

// To:
{msg.score}/100
```

---

### Fix 1.6: Fix Elapsed Timer

**File**: `src/components/live-interview/live-interview-room.tsx`

**Replace `useMemo` with live timer**:
```typescript
const [now, setNow] = useState(Date.now());

useEffect(() => {
  if (!live.startedAt || live.phase === 'setup' || live.phase === 'completed') return;
  const interval = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(interval);
}, [live.startedAt, live.phase]);

const elapsedTime = useMemo(() => {
  if (!live.startedAt) return '00:00';
  const diff = now - live.startedAt;
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}, [live.startedAt, now]);
```

---

## 6. Phase 2: Sarvam-Only STT Migration

> **Estimated effort**: 3-4 days  
> **Goal**: Replace Browser WebSpeech API with Sarvam STT exclusively

### 6.1 Why Replace Browser WebSpeech API

| Issue | WebSpeech API | Sarvam STT |
|-------|--------------|------------|
| Browser support | Chrome/Edge only | Any browser (server-side) |
| Accuracy (Indian English) | Poor | Optimized for Indian accents |
| Multi-language | English only | 11 Indian languages |
| Reliability | Flaky (random stops) | Consistent (API-grade) |
| Privacy | Audio sent to Google | Audio sent to Sarvam (controlled) |
| Interim results | ✅ Yes (browser-native) | ❌ Must implement streaming |

### 6.2 New STT Architecture

```
┌─────────── Streaming STT Pipeline ───────────────────┐
│                                                       │
│  MediaRecorder (250ms chunks)                         │
│    → Send each chunk via WebSocket                    │
│    → Server buffers chunks                            │
│    → Every ~1-2s, send accumulated audio to Sarvam    │
│    → Sarvam STT → transcript                          │
│    → Push interim transcript back via WebSocket        │
│    → Client displays in real-time                      │
│                                                       │
│  On silence detection (client-side VAD):              │
│    → Send final accumulated audio to Sarvam           │
│    → Get confirmed transcript                          │
│    → Submit to LLM pipeline                            │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 6.3 Changes Required

#### New: `src/lib/speech/sarvam-streaming-recorder.ts`

A new recorder that:
1. Uses `MediaRecorder` to capture audio (same as `sarvam-recorder.ts`)
2. Sends audio chunks to WebSocket server instead of accumulating all audio
3. Receives interim transcripts from WebSocket
4. Has client-side VAD (Voice Activity Detection) for silence detection
5. On silence → sends "finalize" signal → gets final transcript

```typescript
export class SarvamStreamingRecorder {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;

  async connect(sessionId: string): Promise<void> {
    this.ws = new WebSocket(`${WS_URL}/live-interview/${sessionId}/audio`);
    // Handle incoming interim transcripts
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'interim-transcript') {
        this.callbacks.onInterimTranscript?.(data.text);
      } else if (data.type === 'final-transcript') {
        this.callbacks.onFinalTranscript?.(data.text);
      }
    };
  }

  async startRecording(): Promise<void> {
    // MediaRecorder → capture chunks → send via WebSocket
    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        const base64 = await blobToBase64(event.data);
        this.ws.send(JSON.stringify({
          type: 'audio-chunk',
          data: base64,
          mimeType: this.mimeType,
          timestamp: Date.now(),
        }));
      }
    };
    this.mediaRecorder.start(500); // 500ms chunks for streaming
  }
}
```

#### Update: WebSocket Server (`apps/websocket/src/server.ts`)

Add new handlers for streaming audio:
```typescript
socket.on('live-interview:audio-chunk', async (data) => {
  // Buffer audio chunks
  // Every ~1.5s, send to Sarvam STT
  // Emit interim transcript back to client
});

socket.on('live-interview:audio-finalize', async (data) => {
  // Send all buffered audio to Sarvam STT
  // Emit final transcript to client
});
```

#### Update: Hook (`src/hooks/use-live-interview.ts`)

- Replace `getRecognition()` / WebSpeech API with `SarvamStreamingRecorder`
- Remove `browserSpeak()` function entirely
- All STT goes through Sarvam

### 6.4 Fallback Strategy

If WebSocket connection fails or Sarvam STT is unavailable:
1. Fall back to existing `SarvamAudioRecorder` (record → send complete audio → get transcript)
2. Display "Using fallback mode — slight delay expected" indicator
3. Keep the full-audio STT path as a degradation path

---

## 7. Phase 3: Sarvam-Only TTS (Remove Browser TTS)

> **Estimated effort**: 2 days  
> **Goal**: All AI voice output through Sarvam TTS exclusively

### 7.1 Changes

1. **Remove** `browserSpeak()` and `stopBrowserSpeak()` from `use-live-interview.ts`
2. **Remove** the TTS toggle from `live-config-panel.tsx` (no "Browser TTS vs Sarvam TTS" choice)
3. **Always** use Sarvam TTS `bulbul:v3` for AI voice output
4. **Implement** chunked streaming TTS:

#### New: Streaming TTS Pipeline

```typescript
// In /api/live-interview/respond route:
// Instead of generating all TTS audio at once:
// 1. Return text response immediately
// 2. Generate TTS chunks in parallel
// 3. Stream audio chunks via WebSocket

// Step 1: Return response JSON immediately
response.json({ response, action, score, feedback });

// Step 2: Background TTS generation + streaming
(async () => {
  const sentences = splitIntoSentences(response);
  for (const sentence of sentences) {
    const ttsResult = await sarvamTTS(sentence, { speaker, model: 'bulbul:v3' });
    // Push via WebSocket
    io.to(`interview:${sessionId}`).emit('tts-chunk', {
      audio: ttsResult.audios[0],
      index: i,
      isLast: i === sentences.length - 1,
    });
  }
})();
```

#### Update: Player to Support Streaming

```typescript
// SarvamAudioPlayer already has enqueue() method
// Client WebSocket handler:
socket.on('tts-chunk', (data) => {
  player.enqueue(data.audio);
  if (data.isLast) {
    // Mark end of speech
  }
});
```

### 7.2 Config Panel Simplification

**Remove from `live-config-panel.tsx`**:
- `useSarvamTTS` state and toggle
- "Browser TTS" vs "Sarvam AI" selection grid

**Keep**:
- `enableAudio` toggle (voice on/off)
- Speaker selection (always Sarvam voices)

**Remove from `LiveConfig` type**:
- `useSarvamTTS` field (always true now)

---

## 8. Phase 4: Sarvam LLM Integration

> **Estimated effort**: 3 days  
> **Goal**: Use Sarvam-M as primary LLM for interview conversations

### 8.1 Smart Router Update

**File**: `src/ai/smart-router.ts`

Add Sarvam-M as a model option:
```typescript
// New model config
'sarvam-m': {
  provider: 'sarvam',
  model: 'sarvam-m',
  tokensPerSecond: 300, // Estimate — benchmark needed
  costPer1MInput: 0.10,
  costPer1MOutput: 0.15,
  maxTokens: 8192,
},

// Update feature routing
'live-interview-respond': {
  primary: 'sarvam-m',        // Sarvam LLM — optimized for Indian English
  fallback: 'groq-llama-8b',  // Fast fallback
  lastResort: 'gemini',
  reason: 'Sarvam-M has best Indian English understanding for interview context',
},
```

### 8.2 New Feature: `live-interview-start` in Smart Router

Currently the start route uses `'interview-session'` feature. Add a dedicated feature:

```typescript
'live-interview-start': {
  primary: 'sarvam-m',
  fallback: 'groq-llama-70b',
  lastResort: 'gemini',
  reason: 'Interview opening benefits from Sarvam quality',
},

'live-interview-evaluate': {
  primary: 'sarvam-m',
  fallback: 'groq-llama-70b',
  lastResort: 'gemini',
  reason: 'Evaluation needs thorough analysis — Sarvam-M handles well',
},
```

### 8.3 Provider Integration

**File**: `src/ai/multi-provider.ts`

Add Sarvam as a provider in the multi-provider chain:
```typescript
import { generateWithSarvam, isSarvamAvailable } from '@/ai/providers/sarvam';

// Add to providers array:
{
  name: 'sarvam',
  generate: async (opts) => {
    const content = await generateWithSarvam({
      prompt: opts.prompt,
      systemPrompt: opts.systemPrompt,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      jsonMode: opts.jsonMode,
    });
    return { content, provider: 'sarvam', model: 'sarvam-m' };
  },
  isAvailable: isSarvamAvailable,
},
```

---

## 9. Phase 5: Real-Time Streaming & WebSocket Upgrade

> **Estimated effort**: 4-5 days  
> **Goal**: True real-time experience using WebSocket for all live interview communication

### 9.1 WebSocket Events Schema

```typescript
// Client → Server
interface ClientToServer {
  'live:start': (config: LiveConfig) => void;
  'live:audio-chunk': (data: { audio: string; mimeType: string; timestamp: number }) => void;
  'live:audio-finalize': () => void;
  'live:text-answer': (text: string) => void;
  'live:code-submit': (code: string) => void;
  'live:interrupt': () => void; // User interrupts AI speech
  'live:end': () => void;
}

// Server → Client
interface ServerToClient {
  'live:session-started': (data: { sessionId: string; greeting: string; firstQuestion: string }) => void;
  'live:interim-transcript': (text: string) => void;
  'live:final-transcript': (text: string) => void;
  'live:ai-thinking': () => void;
  'live:ai-response': (data: { response: string; action: string; score: number | null }) => void;
  'live:tts-chunk': (data: { audio: string; index: number; isLast: boolean }) => void;
  'live:evaluation': (evaluation: LiveEvaluation) => void;
  'live:error': (error: string) => void;
  'live:phase-change': (phase: LivePhase) => void;
}
```

### 9.2 WebSocket Server Implementation

**New file**: `apps/websocket/src/handlers/live-interview.ts`

```typescript
export function registerLiveInterviewHandlers(io: Server, socket: Socket) {
  let audioBuffer: Buffer[] = [];
  let sttTimer: NodeJS.Timeout | null = null;

  socket.on('live:audio-chunk', async (data) => {
    audioBuffer.push(Buffer.from(data.audio, 'base64'));

    // Every 1.5s, send accumulated audio to Sarvam STT for interim
    if (!sttTimer) {
      sttTimer = setInterval(async () => {
        if (audioBuffer.length === 0) return;
        const combined = Buffer.concat(audioBuffer);
        try {
          const result = await sarvamSTT(combined, { model: 'saaras:v3' });
          socket.emit('live:interim-transcript', result.transcript);
        } catch (e) {
          // Ignore interim errors
        }
      }, 1500);
    }
  });

  socket.on('live:audio-finalize', async () => {
    if (sttTimer) { clearInterval(sttTimer); sttTimer = null; }
    const combined = Buffer.concat(audioBuffer);
    audioBuffer = [];

    const result = await sarvamSTT(combined, { model: 'saaras:v3' });
    socket.emit('live:final-transcript', result.transcript);

    // Trigger AI response
    // ...
  });
}
```

### 9.3 Interruption Support

When user sends `live:interrupt`:
1. Server cancels any in-progress TTS generation
2. Server cancels current AI generation (if streaming)
3. Client stops audio playback
4. Client transitions to `'listening'` phase
5. Server notes the interruption in conversation context

---

## 10. Phase 6: Session Persistence & History

> **Estimated effort**: 3 days  
> **Goal**: Save all live interview sessions to PostgreSQL for history and analytics

### 10.1 Database Schema Update

**File**: `packages/database/prisma/schema.prisma`

```prisma
model LiveInterview {
  id            String   @id @default(cuid())
  userId        String
  type          InterviewType
  difficulty    Difficulty
  status        InterviewStatus @default(IN_PROGRESS)
  config        Json     // LiveConfig snapshot
  conversation  Json     // Array of LiveMessage
  evaluation    Json?    // LiveEvaluation (null until complete)
  score         Int?     // Overall score 0-100
  questionsAsked Int     @default(0)
  totalDurationMs Int    @default(0)
  speaker       String?  // Sarvam speaker used
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
}
```

### 10.2 Service Layer

**New file**: `src/lib/live-interview-service.ts`

```typescript
export async function createLiveSession(userId: string, config: LiveConfig): Promise<string>;
export async function appendMessage(sessionId: string, message: LiveMessage): Promise<void>;
export async function updateSessionPhase(sessionId: string, phase: LivePhase): Promise<void>;
export async function saveLiveEvaluation(sessionId: string, evaluation: LiveEvaluation): Promise<void>;
export async function getUserLiveInterviews(userId: string, limit?: number): Promise<LiveInterview[]>;
export async function getLiveInterview(sessionId: string): Promise<LiveInterview | null>;
```

### 10.3 Hook Integration

In `use-live-interview.ts`, add persistence calls at key moments:
- `startSession` → `createLiveSession()`
- `submitAnswer` → `appendMessage()` for both user & AI messages
- `doEvaluate` → `saveLiveEvaluation()`
- Phase transitions → `updateSessionPhase()`

### 10.4 Interview History UI

**New component**: `src/components/live-interview/live-interview-history.tsx`

- Display past live interviews in a list
- Show date, type, difficulty, score, duration
- Click to view full transcript and evaluation
- Filter by type, difficulty, date range

---

## 11. Phase 7: Advanced Features

> **Estimated effort**: 5-7 days

### 11.1 Multi-Language Interview Support

Leverage Sarvam's multi-language STT/TTS:

```typescript
export interface LiveConfig {
  // ... existing fields
  language?: SarvamTTSLanguage; // 'en-IN' | 'hi-IN' | 'ta-IN' | etc.
}
```

- STT: Use `saaras:v3` with appropriate `language_code`
- TTS: Use `bulbul:v3` with `target_language_code`
- LLM: Generate responses in the selected language
- Add language selector to config panel

### 11.2 Smart Follow-Up System

Enhance the AI's conversation intelligence:

```typescript
// New prompt engineering for multi-turn probing
const PROBING_STRATEGIES = {
  'shallow-answer': 'Ask for specific examples or deeper explanation',
  'off-topic': 'Gently redirect back to the question',
  'strong-answer': 'Challenge with edge case or optimization follow-up',
  'stuck': 'Provide a guiding hint without giving the answer',
  'code-issue': 'Point to the specific bug or inefficiency',
};
```

### 11.3 Real-Time Code Execution (DSA)

**New service**: `/api/live-interview/execute-code`

```typescript
// Use a sandboxed code execution service
export async function POST(req: NextRequest) {
  const { code, language, testCases } = await req.json();
  // Execute in sandboxed environment
  // Return stdout, stderr, execution time, test results
}
```

Options for sandboxed execution:
- Piston API (open-source code execution engine)
- Judge0 API
- Docker-based sandboxed execution

### 11.4 AI Personality Profiles

Different interviewer personas:

```typescript
const INTERVIEWER_PERSONAS = {
  'friendly': {
    speaker: 'priya',
    systemPromptModifier: 'Be warm, encouraging, and supportive.',
    pace: 0.95,
  },
  'tough': {
    speaker: 'rahul',
    systemPromptModifier: 'Be rigorous, ask hard follow-ups, push for excellence.',
    pace: 1.1,
  },
  'google': {
    speaker: 'shubh',
    systemPromptModifier: 'Interview like a Google L5 engineer. Focus on scale and correctness.',
    pace: 1.0,
  },
  'startup': {
    speaker: 'amit',
    systemPromptModifier: 'Fast-paced startup CTO style. Value practical thinking over perfect theory.',
    pace: 1.15,
  },
};
```

### 11.5 Interview Preparation Mode

Pre-interview warm-up:
- 5-minute guided breathing/relaxation (Sarvam TTS)
- Quick practice question (easy difficulty)
- Mic/audio check
- Tips for the selected interview type

---

## 12. Phase 8: UI/UX Enhancements

> **Estimated effort**: 4-5 days

### 12.1 Code Editor Upgrade

Replace the plain `<textarea>` with a proper code editor:

**Option A: CodeMirror 6** (recommended — lightweight, ~50KB)
```bash
pnpm add @codemirror/state @codemirror/view @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-java @codemirror/lang-cpp @codemirror/theme-one-dark
```

**Option B: Monaco Editor** (heavier — ~2MB, but familiar from VS Code)

Features to add:
- Syntax highlighting
- Auto-indentation
- Bracket matching
- Line numbers
- Code folding
- Run button with output panel

### 12.2 Enhanced Audio Visualizer

Replace canvas-based waveform with 3D/WebGL or improved SVG:

- Smooth sphere morphing based on audio level (like Apple Siri)
- Color transitions between phases (green=listening, blue=AI, amber=processing)
- Particle effects during high audio levels

### 12.3 Conversation UI Improvements

- **Typing indicator**: Animated dots while AI is generating
- **Audio playback indicators**: Show which message is currently being spoken
- **Message reactions**: User can flag "good question" or "too hard"
- **Transcript export**: Download full conversation as PDF/TXT
- **Timestamp relative**: "2 min ago" instead of "14:32"

### 12.4 Better Mobile Experience

Current live interview UI is desktop-focused. Add:
- Full-screen mode on mobile
- Larger touch targets for mic button
- Swipe to show/hide code editor (DSA)
- Reduced visualizer complexity for performance
- PWA offline support for evaluation review

### 12.5 Keyboard Shortcuts

```typescript
const SHORTCUTS = {
  'Space': 'Toggle mic (when in listening mode)',
  'Enter': 'Submit text answer',
  'Escape': 'Stop AI speech / cancel recording',
  'Ctrl+Enter': 'Submit code (DSA mode)',
  'Ctrl+H': 'Show/hide hints',
  'Ctrl+E': 'End interview',
};
```

---

## 13. File-by-File Change Map

### Modified Files

| File | Changes | Phase |
|------|---------|-------|
| `src/hooks/use-live-interview.ts` | Remove WebSpeech/Browser TTS; add Sarvam STT streaming; fix stale closures; add persistence calls; add interruption support | P1-P6 |
| `src/ai/providers/sarvam.ts` | Add streaming STT support; optimize TTS chunking | P2-P3 |
| `src/ai/smart-router.ts` | Add `sarvam-m` model config; update routing for `live-interview-*` features | P4 |
| `src/ai/multi-provider.ts` | Add Sarvam as a provider in the fallback chain | P4 |
| `src/ai/index.ts` | Export new Sarvam features | P4 |
| `src/lib/speech/sarvam-recorder.ts` | Refactor for streaming; remove singleton pattern | P2 |
| `src/lib/speech/sarvam-player.ts` | Add WebSocket streaming support; optimize audio queue | P3, P5 |
| `src/lib/rate-limiter.ts` | Add `live-interview`, `live-interview-stt`, `live-interview-tts` configs | P1 |
| `src/lib/types/interview.ts` | Add `LiveInterviewSession`, `LiveInterviewConfig` types | P6 |
| `src/app/api/live-interview/start/route.ts` | Add auth, rate limit, session persistence, Sarvam LLM | P1, P4, P6 |
| `src/app/api/live-interview/respond/route.ts` | Add auth, rate limit, Sarvam LLM, streaming TTS | P1, P4, P5 |
| `src/app/api/live-interview/evaluate/route.ts` | Add auth, rate limit, Sarvam LLM, persistence | P1, P4, P6 |
| `src/app/api/live-interview/stt/route.ts` | Add auth, rate limit; upgrade to `saaras:v3` | P1, P2 |
| `src/app/api/live-interview/tts/route.ts` | Add auth, rate limit; streaming support | P1, P3 |
| `src/components/live-interview/live-interview-room.tsx` | Fix timer; add history link; keyboard shortcuts | P1, P8 |
| `src/components/live-interview/live-config-panel.tsx` | Remove Browser TTS toggle; add language selector; add persona selector | P3, P7 |
| `src/components/live-interview/live-controls.tsx` | Add interruption button; keyboard shortcuts; mobile optimization | P5, P8 |
| `src/components/live-interview/live-transcript.tsx` | Fix score display; add typing indicator; add audio playback indicator | P1, P8 |
| `src/components/live-interview/live-audio-visualizer.tsx` | Enhance with better animations | P8 |
| `src/components/live-interview/live-code-editor.tsx` | Upgrade to CodeMirror; add code execution | P7, P8 |
| `src/components/live-interview/live-evaluation-view.tsx` | Add share/export; comparison with previous sessions | P6, P8 |
| `src/components/live-interview/index.ts` | Export new components | All |
| `apps/websocket/src/server.ts` | Add live interview WebSocket handlers | P5 |
| `packages/database/prisma/schema.prisma` | Add `LiveInterview` model | P6 |
| `src/lib/interview-service.ts` | Add live interview CRUD functions | P6 |

### New Files

| File | Purpose | Phase |
|------|---------|-------|
| `src/lib/speech/sarvam-streaming-recorder.ts` | WebSocket-based streaming audio recorder | P2 |
| `src/lib/live-interview-service.ts` | PostgreSQL persistence for live interviews | P6 |
| `src/app/api/live-interview/execute-code/route.ts` | Sandboxed code execution for DSA | P7 |
| `src/components/live-interview/live-interview-history.tsx` | Past sessions list with replay | P6 |
| `src/components/live-interview/live-preparation-mode.tsx` | Pre-interview warm-up component | P7 |
| `src/components/live-interview/live-language-selector.tsx` | Multi-language selection | P7 |
| `apps/websocket/src/handlers/live-interview.ts` | WebSocket handler module | P5 |

### Files to Delete

| File | Reason |
|------|--------|
| `src/hooks/use-live-interview.v1.bak.ts` | Backup of V1 — no longer needed after V3 is stable |
| `src/lib/firestore-interview.ts.bak` | Dead code (Firestore legacy) |

---

## 14. Environment & Configuration Changes

### New Environment Variables

```env
# Sarvam AI (already exists — verify it's set)
SARVAM_API_KEY=your-sarvam-api-key

# WebSocket URL for live interview streaming (already exists)
WEBSOCKET_URL=http://localhost:3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# Optional: Code execution service
CODE_EXECUTION_URL=http://localhost:2358  # Piston API
```

### Subscription Tier Updates

**File**: `src/lib/types/subscription.ts`

```typescript
// Add live interview to TIER_LIMITS
TIER_LIMITS: {
  FREE: {
    // ... existing limits
    liveInterviewsPerDay: 1,        // 1 free live interview/day
    liveInterviewQuestions: 3,       // Max 3 questions in free tier
  },
  PRO: {
    // ... existing limits
    liveInterviewsPerDay: 10,       // 10 live interviews/day
    liveInterviewQuestions: 15,      // Up to 15 questions
  },
}
```

### Rate Limit Configuration

```typescript
// src/lib/rate-limiter.ts
rateLimitConfigs: {
  // ... existing configs
  'live-interview': { windowMs: 86400000, maxRequests: 10 },     // 10/day (session starts)
  'live-interview-stt': { windowMs: 60000, maxRequests: 30 },    // 30/min (audio chunks)
  'live-interview-tts': { windowMs: 60000, maxRequests: 20 },    // 20/min (TTS requests)
  'live-interview-respond': { windowMs: 60000, maxRequests: 15 }, // 15/min (AI turns)
}
```

---

## 15. Testing Strategy

### Unit Tests

```typescript
// tests/live-interview/
describe('Sarvam STT Integration', () => {
  it('should transcribe audio buffer correctly');
  it('should handle empty audio gracefully');
  it('should respect language_code parameter');
  it('should fall back on STT failure');
});

describe('Sarvam TTS Integration', () => {
  it('should generate audio for short text');
  it('should chunk long text correctly');
  it('should validate speaker against model');
  it('should handle 2500 char limit for v3');
});

describe('Live Interview API Routes', () => {
  it('should reject unauthenticated requests');
  it('should enforce rate limits');
  it('should check subscription tier');
  it('should generate valid session ID');
  it('should return proper JSON response format');
});

describe('Session Persistence', () => {
  it('should create session in PostgreSQL');
  it('should append messages incrementally');
  it('should save evaluation on completion');
  it('should retrieve user interview history');
});
```

### Integration Tests

```typescript
describe('Live Interview E2E Flow', () => {
  it('should complete a full behavioral interview');
  it('should handle DSA interview with code submission');
  it('should persist session and retrieve history');
  it('should handle mid-session page refresh (reconnect)');
  it('should handle Sarvam API failures gracefully');
});
```

### Performance Tests

```typescript
describe('Latency Benchmarks', () => {
  it('STT round-trip should be < 2s for 10s audio');
  it('LLM response should be < 3s');
  it('TTS generation should be < 2s for 200-word response');
  it('Total turn latency should be < 7s (STT + LLM + TTS)');
});
```

### Manual Testing Checklist

- [ ] Mic permission request works on Chrome, Edge, Firefox, Safari
- [ ] Audio recording produces valid base64
- [ ] Sarvam STT returns accurate transcript for Indian English
- [ ] Sarvam TTS produces clear, natural voice
- [ ] Interview flows through all phases without hanging
- [ ] Evaluation generates meaningful feedback
- [ ] Session is saved to database and appears in history
- [ ] Rate limiting blocks excessive usage
- [ ] Free tier limits are enforced
- [ ] WebSocket reconnects on network interruption
- [ ] Mobile browser works correctly
- [ ] DSA code editor is usable and code submits correctly

---

## 16. Rollout Plan

### Week 1: Critical Fixes (Phase 1)
- Day 1-2: Auth + rate limiting on all API routes
- Day 2-3: Fix bugs (stale evaluation, race conditions, timer, score display)
- Day 3: QA and regression testing

### Week 2: Sarvam-Only Migration (Phases 2-3)
- Day 1-2: Implement Sarvam streaming STT recorder
- Day 3: Remove Browser TTS, make Sarvam TTS the default
- Day 4: Update config panel, remove hybrid toggles

### Week 3: Sarvam LLM + WebSocket (Phases 4-5)
- Day 1-2: Integrate Sarvam-M LLM into smart router
- Day 3-4: WebSocket streaming for STT/TTS
- Day 5: Interruption handling

### Week 4: Persistence + Advanced Features (Phases 6-7)
- Day 1-2: Database schema, persistence service, session history
- Day 3-4: Multi-language support, AI personas
- Day 5: Code editor upgrade (CodeMirror)

### Week 5: UI Polish + Testing (Phase 8)
- Day 1-2: UI/UX enhancements (visualizer, mobile, shortcuts)
- Day 3-4: Comprehensive testing (unit, integration, E2E)
- Day 5: Documentation, deployment, monitoring setup

---

## Summary of Impact

| Metric | Current (V2) | Target (V3) | Improvement |
|--------|-------------|-------------|-------------|
| **Browser Support** | Chrome/Edge only (WebSpeech) | All modern browsers (Sarvam) | +Firefox, Safari, mobile |
| **STT Accuracy (Indian English)** | ~70% (Google WebSpeech) | ~90%+ (Sarvam Saaras) | +20% accuracy |
| **TTS Quality** | Robotic (Browser) or HD (opt-in Sarvam) | Always HD (Sarvam Bulbul v3) | Consistent quality |
| **Turn Latency** | 3-8s (LLM + full TTS gen) | 2-5s (streaming TTS) | -30% latency |
| **Languages** | English only | 11 Indian languages | +10 languages |
| **Session Persistence** | None (lost on refresh) | Full PostgreSQL persistence | ∞ improvement |
| **Security** | No auth on APIs | Full auth + rate limit + tier | Production-ready |
| **Code Editor** | Plain textarea | CodeMirror with syntax highlighting | Professional quality |
| **Interruption** | None | Full barge-in support | Natural conversation |

---

*This document serves as the complete upgrade specification. Each phase can be implemented independently and deployed incrementally.*
