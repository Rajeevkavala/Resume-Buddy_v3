/**
 * Live Interview Persistence Service
 *
 * Uses the existing Interview model in PostgreSQL to persist
 * live interview sessions, messages, and evaluations.
 *
 * The Interview model's JSON fields (questions, answers, feedback)
 * store live interview data:
 *   - questions: { conversation: LiveMessage[], config: LiveConfig }
 *   - answers: not used for live (messages are in questions.conversation)
 *   - feedback: LiveEvaluation JSON
 */
import { prisma } from '@/lib/db';
import type { LiveMessage, LiveConfig, LiveEvaluation } from '@/hooks/use-live-interview';

// Maps app-level types to Prisma enums
const TYPE_MAP: Record<string, string> = {
  dsa: 'DSA',
  behavioral: 'BEHAVIORAL',
  technical: 'TECHNICAL',
  'system-design': 'SYSTEM_DESIGN',
};

const DIFFICULTY_MAP: Record<string, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const REVERSE_TYPE_MAP: Record<string, string> = {
  DSA: 'dsa',
  BEHAVIORAL: 'behavioral',
  TECHNICAL: 'technical',
  SYSTEM_DESIGN: 'system-design',
};

const REVERSE_DIFFICULTY_MAP: Record<string, string> = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export interface LiveInterviewRecord {
  id: string;
  userId: string;
  type: string;
  difficulty: string;
  status: string;
  config: LiveConfig | null;
  conversation: LiveMessage[];
  evaluation: LiveEvaluation | null;
  score: number | null;
  questionsAsked: number;
  totalDurationMs: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

/**
 * Create a new live interview session in the database
 * Returns the generated UUID session ID
 */
export async function createLiveSession(
  userId: string,
  config: LiveConfig,
): Promise<string> {
  const interview = await prisma.interview.create({
    data: {
      userId,
      type: (TYPE_MAP[config.type] || 'TECHNICAL') as any,
      difficulty: (DIFFICULTY_MAP[config.difficulty] || 'MEDIUM') as any,
      status: 'IN_PROGRESS',
      role: 'Live Interview',
      questions: {
        conversation: [] as any[],
        config: config as any,
        isLiveInterview: true,
      } as any,
      startedAt: new Date(),
    },
  });
  return interview.id;
}

/**
 * Append a message to the live interview conversation
 */
export async function appendMessage(
  sessionId: string,
  message: LiveMessage,
): Promise<void> {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: sessionId },
      select: { questions: true },
    });

    if (!interview) {
      console.warn(`[LiveInterview] Session ${sessionId} not found for appendMessage`);
      return;
    }

    const questionsData = interview.questions as any || {};
    const conversation = questionsData.conversation || [];
    conversation.push(message);

    await prisma.interview.update({
      where: { id: sessionId },
      data: {
        questions: {
          ...questionsData,
          conversation,
        },
      },
    });
  } catch (error) {
    console.error('[LiveInterview] appendMessage error:', error);
  }
}

/**
 * Append multiple messages at once (more efficient)
 */
export async function appendMessages(
  sessionId: string,
  messages: LiveMessage[],
): Promise<void> {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: sessionId },
      select: { questions: true },
    });

    if (!interview) return;

    const questionsData = interview.questions as any || {};
    const conversation = questionsData.conversation || [];
    conversation.push(...messages);

    await prisma.interview.update({
      where: { id: sessionId },
      data: {
        questions: {
          ...questionsData,
          conversation,
        },
      },
    });
  } catch (error) {
    console.error('[LiveInterview] appendMessages error:', error);
  }
}

/**
 * Save evaluation and mark session as completed
 */
export async function saveLiveEvaluation(
  sessionId: string,
  evaluation: LiveEvaluation,
  questionsAsked: number,
  totalDurationMs: number,
): Promise<void> {
  try {
    await prisma.interview.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        feedback: evaluation as any,
        score: evaluation.overallScore || 0,
        completedAt: new Date(),
        answers: {
          questionsAsked,
          totalDurationMs,
          verdict: evaluation.verdict,
        },
      },
    });
  } catch (error) {
    console.error('[LiveInterview] saveLiveEvaluation error:', error);
  }
}

/**
 * Get a single live interview session by ID
 */
export async function getLiveInterview(
  sessionId: string,
): Promise<LiveInterviewRecord | null> {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: sessionId },
    });

    if (!interview) return null;

    const questionsData = interview.questions as any || {};
    if (!questionsData.isLiveInterview) return null;

    const answersData = interview.answers as any || {};

    return {
      id: interview.id,
      userId: interview.userId,
      type: REVERSE_TYPE_MAP[interview.type] || 'technical',
      difficulty: REVERSE_DIFFICULTY_MAP[interview.difficulty] || 'medium',
      status: interview.status,
      config: questionsData.config || null,
      conversation: questionsData.conversation || [],
      evaluation: (interview.feedback as any as LiveEvaluation) || null,
      score: interview.score,
      questionsAsked: answersData.questionsAsked || 0,
      totalDurationMs: answersData.totalDurationMs || 0,
      startedAt: interview.startedAt,
      completedAt: interview.completedAt,
      createdAt: interview.createdAt,
    };
  } catch (error) {
    console.error('[LiveInterview] getLiveInterview error:', error);
    return null;
  }
}

/**
 * Get user's live interview history
 */
export async function getUserLiveInterviews(
  userId: string,
  limit: number = 20,
): Promise<LiveInterviewRecord[]> {
  try {
    const interviews = await prisma.interview.findMany({
      where: {
        userId,
        role: 'Live Interview',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return interviews.map((interview) => {
      const questionsData = interview.questions as any || {};
      const answersData = interview.answers as any || {};

      return {
        id: interview.id,
        userId: interview.userId,
        type: REVERSE_TYPE_MAP[interview.type] || 'technical',
        difficulty: REVERSE_DIFFICULTY_MAP[interview.difficulty] || 'medium',
        status: interview.status,
        config: questionsData.config || null,
        conversation: questionsData.conversation || [],
        evaluation: (interview.feedback as any as LiveEvaluation) || null,
        score: interview.score,
        questionsAsked: answersData.questionsAsked || 0,
        totalDurationMs: answersData.totalDurationMs || 0,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        createdAt: interview.createdAt,
      };
    });
  } catch (error) {
    console.error('[LiveInterview] getUserLiveInterviews error:', error);
    return [];
  }
}

/**
 * Delete a live interview session
 */
export async function deleteLiveInterview(sessionId: string): Promise<void> {
  try {
    await prisma.interview.delete({
      where: { id: sessionId },
    });
  } catch (error) {
    console.error('[LiveInterview] deleteLiveInterview error:', error);
  }
}
