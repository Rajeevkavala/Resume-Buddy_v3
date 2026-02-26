/**
 * POST /api/live-interview/start
 * 
 * Starts a live interview session. Generates the first question
 * and returns it with optional TTS audio for immediate playback.
 */
import { NextRequest, NextResponse } from 'next/server';
import { smartGenerate } from '@/ai';
import { sarvamTTS, sarvamTTSLongText, isSarvamAvailable } from '@/ai/providers/sarvam';
import type { SarvamTTSSpeaker } from '@/ai/providers/sarvam';
import { getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';
import { enforceRateLimitAsync } from '@/lib/rate-limiter';
import { assertFeatureAllowed } from '@/lib/subscription-service';
import { createLiveSession, appendMessage } from '@/lib/live-interview-service';

interface StartRequest {
  interviewType: 'dsa' | 'behavioral' | 'technical' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  codeLanguage?: string;
  dsaCategories?: string[];
  resumeText?: string;
  jobDescription?: string;
  generateAudio?: boolean;
  speaker?: string;
}

const GENERATION_PROMPTS: Record<string, string> = {
  'dsa': `Generate a DSA/Coding interview opening. Include a warm greeting and the first coding problem.
The problem should include a clear description, 1-2 examples with input/output, and constraints.`,

  'behavioral': `Generate a behavioral interview opening. Include a warm, professional greeting and the first behavioral question.
Use the STAR method framework. Start with an easy warm-up question about their background.`,

  'technical': `Generate a technical interview opening. Include a professional greeting and the first technical question.
Start with a fundamental concept question that's approachable but reveals depth of knowledge.`,

  'system-design': `Generate a system design interview opening. Include a professional greeting and the first design problem.
Start by presenting the system to design and ask the candidate to begin with requirements gathering.`,
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;

    // 2. Rate limit
    try {
      await enforceRateLimitAsync(userId, 'live-interview');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }

    // 3. Tier check
    try {
      await assertFeatureAllowed(userId, 'generate-questions');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }

    const body: StartRequest = await req.json();
    const {
      interviewType,
      difficulty,
      questionCount,
      codeLanguage,
      dsaCategories,
      resumeText,
      jobDescription,
      generateAudio = true,
      speaker = 'shubh',
    } = body;

    let prompt = `${GENERATION_PROMPTS[interviewType]}

Interview Configuration:
- Type: ${interviewType}
- Difficulty: ${difficulty}
- Total questions planned: ${questionCount}
${codeLanguage ? `- Code language: ${codeLanguage}` : ''}
${dsaCategories?.length ? `- DSA topics: ${dsaCategories.join(', ')}` : ''}
${resumeText ? `- Candidate resume (brief): ${resumeText.slice(0, 500)}` : ''}
${jobDescription ? `- Target role: ${jobDescription.slice(0, 300)}` : ''}

Generate the interview opening in JSON format:
{
  "greeting": "warm professional greeting (1-2 sentences)",
  "firstQuestion": "the first interview question",
  "questionCategory": "category of this question",
  "hints": ["hint1", "hint2"] (optional, for DSA only),
  "codeTemplate": "starter code template" (optional, for DSA only),
  "expectedComplexity": { "time": "O(n)", "space": "O(1)" } (optional, for DSA only),
  "examples": [{ "input": "...", "output": "...", "explanation": "..." }] (optional, for DSA only),
  "constraints": ["constraint1"] (optional, for DSA only)
}`;

    const systemPrompt = `You are a world-class interviewer. Generate the opening for a ${interviewType} interview at ${difficulty} difficulty level. Be conversational and professional. Do not use markdown formatting in your greeting or question - speak naturally as if in a voice conversation.`;

    const result = await smartGenerate({
      feature: 'live-interview-start',
      prompt,
      systemPrompt,
      jsonMode: true,
    });

    let parsed;
    try {
      const cleaned = result.content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        greeting: 'Welcome to your interview! Let me start with the first question.',
        firstQuestion: 'Tell me about a challenging project you worked on recently.',
        questionCategory: 'General',
      };
    }

    // Generate TTS for the greeting + first question
    const spokenText = `${parsed.greeting} ${parsed.firstQuestion}`;
    let audios: string[] = [];
    
    if (generateAudio && isSarvamAvailable()) {
      try {
        if (spokenText.length > 2500) {
          audios = await sarvamTTSLongText(spokenText, {
            speaker: speaker as SarvamTTSSpeaker,
            model: 'bulbul:v3',
            pace: 1.0,
            speechSampleRate: 24000,
          });
        } else {
          const ttsResult = await sarvamTTS(spokenText, {
            speaker: speaker as SarvamTTSSpeaker,
            model: 'bulbul:v3',
            pace: 1.0,
            speechSampleRate: 24000,
          });
          audios = ttsResult.audios;
        }
      } catch (err: any) {
        console.warn('[LiveInterview] TTS for opening failed:', err.message);
      }
    }

    // Persist session to database and get UUID
    let liveSessionId: string | null = null;
    try {
      liveSessionId = await createLiveSession(userId, {
        type: interviewType as any,
        difficulty: difficulty as any,
        questionCount,
        codeLanguage: codeLanguage as any,
        dsaCategories: dsaCategories as any,
        resumeText,
        jobDescription,
        speaker,
        enableAudio: generateAudio,
        useSarvamTTS: generateAudio,
      });

      // Save the greeting message
      if (liveSessionId) {
        await appendMessage(liveSessionId, {
          id: `msg_${Date.now()}_greeting`,
          role: 'interviewer',
          content: `${parsed.greeting} ${parsed.firstQuestion}`,
          timestamp: Date.now(),
        });
      }
    } catch (dbErr) {
      console.warn('[LiveInterview] Failed to persist session:', dbErr);
      // Non-fatal — session continues without persistence
      // Generate fallback session ID for client
      liveSessionId = `live_${userId}_${Date.now()}`;
    }

    return NextResponse.json({
      sessionId: liveSessionId,
      greeting: parsed.greeting,
      firstQuestion: parsed.firstQuestion,
      questionCategory: parsed.questionCategory || 'General',
      hints: parsed.hints,
      codeTemplate: parsed.codeTemplate,
      expectedComplexity: parsed.expectedComplexity,
      examples: parsed.examples,
      constraints: parsed.constraints,
      audios,
    });
  } catch (error: any) {
    console.error('[LiveInterview] Start error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to start live interview' },
      { status: 500 }
    );
  }
}
