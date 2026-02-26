/**
 * POST /api/live-interview/respond
 * 
 * AI interviewer responds to user's answer in real-time.
 * Uses smart routing (Groq primary) for fast response generation.
 * Returns AI text response + optional TTS audio.
 */
import { NextRequest, NextResponse } from 'next/server';
import { smartGenerate } from '@/ai';
import { sarvamTTS, sarvamTTSLongText, isSarvamAvailable } from '@/ai/providers/sarvam';
import type { SarvamTTSSpeaker } from '@/ai/providers/sarvam';
import { getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';
import { enforceRateLimitAsync } from '@/lib/rate-limiter';
import { appendMessages } from '@/lib/live-interview-service';

interface LiveInterviewRequest {
  sessionId: string;
  interviewType: 'dsa' | 'behavioral' | 'technical' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  conversationHistory: Array<{
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: number;
  }>;
  currentQuestion: string;
  userAnswer: string;
  questionIndex: number;
  totalQuestions: number;
  codeLanguage?: string;
  codeContent?: string;
  generateAudio?: boolean;
  speaker?: string;
  currentQuestionStartedAt?: number;
  turnsOnCurrentQuestion?: number;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  'dsa': `You are a senior software engineer conducting a DSA/Coding interview. You are conversational, encouraging but rigorous. 
Ask follow-up questions about time/space complexity, edge cases, and optimizations.
Keep responses concise (2-4 sentences for follow-ups, more for explanations).
If the candidate is stuck, give a small hint. If they answered well, briefly acknowledge and probe deeper.
IMPORTANT: Respond naturally as if in a real voice conversation. Do NOT use markdown formatting, code blocks, or bullet points - speak in plain text.`,

  'behavioral': `You are a hiring manager conducting a behavioral interview. Use the STAR method framework.
Ask about Situation, Task, Action, Result. Probe for specific details and metrics.
Be warm but professional. Keep responses conversational (2-4 sentences).
If the answer is vague, ask for specific examples. If it's good, ask about what they learned.
IMPORTANT: Respond naturally as if in a real voice conversation. Do NOT use markdown formatting or bullet points.`,

  'technical': `You are a senior engineer conducting a technical interview about system knowledge, best practices, and architecture.
Ask about design patterns, tradeoffs, scalability, and real-world experience.
Keep responses conversational (2-4 sentences for follow-ups).
If the answer shows understanding, go deeper. If it's surface-level, ask "why" or "how".
IMPORTANT: Respond naturally as if in a real voice conversation. Do NOT use markdown formatting or bullet points.`,

  'system-design': `You are a principal engineer conducting a system design interview.
Guide the candidate through requirements gathering, high-level design, deep dives, and tradeoffs.
Ask about scale, database choices, caching, load balancing, and failure modes.
Keep responses conversational but structured (2-4 sentences).
IMPORTANT: Respond naturally as if in a real voice conversation. Do NOT use markdown formatting or bullet points.`,
};

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
    try {
      await enforceRateLimitAsync(session.userId, 'live-interview-respond');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }

    const body: LiveInterviewRequest = await req.json();
    const {
      interviewType,
      difficulty,
      conversationHistory,
      currentQuestion,
      userAnswer,
      questionIndex,
      totalQuestions,
      codeLanguage,
      codeContent,
      generateAudio = true,
      speaker = 'shubh',
      currentQuestionStartedAt,
      turnsOnCurrentQuestion = 0,
    } = body;

    // Build conversation context
    const historyText = conversationHistory
      .slice(-10) // Keep last 10 exchanges for context window
      .map(msg => `${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
      .join('\n');

    let prompt = `Interview Type: ${interviewType} | Difficulty: ${difficulty} | Question ${questionIndex + 1}/${totalQuestions}

Conversation so far:
${historyText}

Current question: ${currentQuestion}
Candidate's answer: ${userAnswer}`;

    // Add code context for DSA
    if (codeContent && codeLanguage) {
      prompt += `\n\nCandidate's code (${codeLanguage}):\n${codeContent}`;
    }

    // Calculate question duration
    const questionDurationSeconds = currentQuestionStartedAt 
      ? Math.floor((Date.now() - currentQuestionStartedAt) / 1000) 
      : 0;

    prompt += `\n\n[CONTEXT: Question duration: ${questionDurationSeconds}s, Turns so far: ${turnsOnCurrentQuestion}]

Respond as the interviewer. Be conversational, brief (2-4 sentences), and natural.

IMPORTANT RULES:
- If question duration >= 120 seconds (2 minutes), you MUST move to next question
- If turns >= 3 on this question, you SHOULD move to next question unless answer is incomplete
- Maximum 4 turns per question - then MUST move on
- Don't over-probe - get key insights and move forward

Decide whether to:
1. Ask a follow-up to probe deeper (ONLY if turns < 3 and time < 120s)
2. Give feedback and move to the next topic
3. Provide a hint if the candidate is struggling
4. Summarize and transition to the next question (REQUIRED if time >= 120s or turns >= 4)

Respond in JSON format:
{
  "response": "your conversational response",
  "action": "follow-up" | "feedback" | "hint" | "next-question",
  "score": 0-100 (for this answer, null if just follow-up),
  "feedback": "brief evaluation of the answer (null if just follow-up)"
}`;

    const systemPrompt = SYSTEM_PROMPTS[interviewType] || SYSTEM_PROMPTS['technical'];

    // Use fast model for low-latency conversation
    const result = await smartGenerate({
      feature: 'live-interview-respond',
      prompt,
      systemPrompt,
      jsonMode: true,
    });

    let parsed;
    try {
      const cleaned = result.content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: use raw content as response
      parsed = {
        response: result.content,
        action: 'follow-up',
        score: null,
        feedback: null,
      };
    }

    // Generate TTS audio if requested and Sarvam is available
    let audios: string[] = [];
    if (generateAudio && isSarvamAvailable() && parsed.response) {
      try {
        if (parsed.response.length > 2500) {
          audios = await sarvamTTSLongText(parsed.response, {
            speaker: speaker as SarvamTTSSpeaker,
            model: 'bulbul:v3',
            pace: 1.0,
            speechSampleRate: 24000,
          });
        } else {
          const ttsResult = await sarvamTTS(parsed.response, {
            speaker: speaker as SarvamTTSSpeaker,
            model: 'bulbul:v3',
            pace: 1.0,
            speechSampleRate: 24000,
          });
          audios = ttsResult.audios;
        }
      } catch (ttsError: any) {
        console.warn('[LiveInterview] TTS generation failed, returning text only:', ttsError.message);
      }
    }

    // Persist user + AI messages to database
    if (body.sessionId) {
      try {
        const userMsg = {
          id: `msg_${Date.now()}_user`,
          role: 'candidate' as const,
          content: userAnswer,
          timestamp: Date.now() - 1,
        };
        const aiMsg = {
          id: `msg_${Date.now()}_ai`,
          role: 'interviewer' as const,
          content: parsed.response,
          timestamp: Date.now(),
          score: parsed.score,
          action: parsed.action,
          feedback: parsed.feedback,
        };
        await appendMessages(body.sessionId, [userMsg, aiMsg]);
      } catch (dbErr) {
        console.warn('[LiveInterview] Failed to persist messages:', dbErr);
      }
    }

    return NextResponse.json({
      ...parsed,
      audios,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    console.error('[LiveInterview] Respond error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to generate interview response' },
      { status: 500 }
    );
  }
}
