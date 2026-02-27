/**
 * POST /api/live-interview/evaluate
 * 
 * Evaluates the complete live interview session and provides
 * comprehensive feedback with scoring.
 */
import { NextRequest, NextResponse } from 'next/server';
import { smartGenerate } from '@/ai';
import { getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';
import { enforceRateLimitAsync } from '@/lib/rate-limiter';
import { saveLiveEvaluation } from '@/lib/live-interview-service';

interface EvaluateRequest {
  sessionId: string;
  interviewType: 'dsa' | 'behavioral' | 'technical' | 'system-design';
  difficulty: 'easy' | 'medium' | 'hard';
  conversationHistory: Array<{
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp: number;
  }>;
  totalDurationMs: number;
  questionsAsked: number;
}

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
      await enforceRateLimitAsync(session.userId, 'evaluate-answer');
    } catch (e: any) {
      const statusCode = e.code === 'DAILY_LIMIT_EXCEEDED' ? 403 : 429;
      return NextResponse.json({ 
        error: e.message,
        code: e.code || 'RATE_LIMIT_EXCEEDED',
        dailyLimitExceeded: e.dailyLimitExceeded || false,
        tier: e.tier || 'free'
      }, { status: statusCode });
    }

    const body: EvaluateRequest = await req.json();
    const {
      interviewType,
      difficulty,
      conversationHistory,
      totalDurationMs,
      questionsAsked,
    } = body;

    const historyText = conversationHistory
      .map(msg => `${msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
      .join('\n');

    const durationMinutes = Math.round(totalDurationMs / 60000);

    const prompt = `Evaluate this complete ${interviewType} interview (${difficulty} difficulty, ${durationMinutes} minutes, ${questionsAsked} questions).

Full conversation transcript:
${historyText}

Provide a comprehensive evaluation in JSON:
{
  "overallScore": 0-100,
  "verdict": "strong-hire" | "hire" | "lean-hire" | "lean-no-hire" | "no-hire",
  "summary": "2-3 sentence overall assessment",
  "categoryScores": {
    "technicalKnowledge": 0-100,
    "problemSolving": 0-100,
    "communication": 0-100,
    "codeQuality": 0-100 (null if not DSA),
    "systemThinking": 0-100 (null if not system-design)
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "detailedFeedback": "Paragraph with specific examples from their answers",
  "recommendedTopics": ["topic1", "topic2"] (topics to study),
  "interviewTips": ["tip1", "tip2"] (for next time)
}`;

    const systemPrompt = `You are an expert interview evaluator at a top tech company. Provide fair, constructive, and specific feedback. Reference actual answers from the conversation. Be encouraging but honest.`;

    const result = await smartGenerate({
      feature: 'live-interview-evaluate',
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
        overallScore: 50,
        verdict: 'lean-hire',
        summary: 'Unable to generate detailed evaluation. Please try again.',
        categoryScores: {},
        strengths: [],
        areasForImprovement: [],
        detailedFeedback: '',
        recommendedTopics: [],
        interviewTips: [],
      };
    }

    // Persist evaluation to database
    if (body.sessionId) {
      try {
        await saveLiveEvaluation(
          body.sessionId,
          parsed,
          questionsAsked,
          totalDurationMs,
        );
      } catch (dbErr) {
        console.warn('[LiveInterview] Failed to persist evaluation:', dbErr);
      }
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('[LiveInterview] Evaluate error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate interview' },
      { status: 500 }
    );
  }
}
