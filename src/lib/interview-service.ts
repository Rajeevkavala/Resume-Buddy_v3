/**
 * Interview Service — Prisma/PostgreSQL based
 *
 * Replaces the Firestore subcollection-based interview persistence.
 * Uses the `Interview` model which stores questions/answers as Json columns.
 */

import 'server-only';

import { prisma } from '@/lib/db';
import type {
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  InterviewDifficulty,
} from '@/lib/types/interview';

// ============ Mapping Helpers ============

/**
 * Map our InterviewSession type to Prisma enum values
 */
function mapDifficulty(d: InterviewDifficulty): 'EASY' | 'MEDIUM' | 'HARD' {
  const map: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
    easy: 'EASY', medium: 'MEDIUM', hard: 'HARD',
  };
  return map[d] ?? 'MEDIUM';
}

function mapInterviewType(t: string): 'TECHNICAL' | 'BEHAVIORAL' | 'DSA' | 'SYSTEM_DESIGN' {
  const map: Record<string, 'TECHNICAL' | 'BEHAVIORAL' | 'DSA' | 'SYSTEM_DESIGN'> = {
    technical: 'TECHNICAL', behavioral: 'BEHAVIORAL', dsa: 'DSA', 'system-design': 'SYSTEM_DESIGN',
  };
  return map[t] ?? 'TECHNICAL';
}

function mapStatus(s: string): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' {
  const map: Record<string, 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'> = {
    configuring: 'NOT_STARTED', active: 'IN_PROGRESS', paused: 'IN_PROGRESS', completed: 'COMPLETED',
  };
  return map[s] ?? 'NOT_STARTED';
}

function reverseStatus(s: string): InterviewSession['status'] {
  const map: Record<string, InterviewSession['status']> = {
    NOT_STARTED: 'configuring', IN_PROGRESS: 'active', COMPLETED: 'completed',
  };
  return map[s] ?? 'configuring';
}

function reverseDifficulty(d: string): InterviewDifficulty {
  return d.toLowerCase() as InterviewDifficulty;
}

function reverseType(t: string): InterviewSession['type'] {
  const map: Record<string, InterviewSession['type']> = {
    TECHNICAL: 'technical', BEHAVIORAL: 'behavioral', DSA: 'dsa', SYSTEM_DESIGN: 'system-design',
  };
  return map[t] ?? 'technical';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToSession(row: any): InterviewSession {
  return {
    id: row.id,
    userId: row.userId,
    type: reverseType(row.type),
    difficulty: reverseDifficulty(row.difficulty),
    status: reverseStatus(row.status),
    totalQuestions: (row.questions as InterviewQuestion[])?.length ?? 0,
    answerFormat: undefined,
    codeLanguage: undefined,
    dsaCategories: undefined,
    resumeContext: undefined,
    jobDescription: undefined,
    progress: {
      currentQuestionIndex: 0,
      completed: (row.answers as InterviewAnswer[])?.length ?? 0,
      correct: 0,
      skipped: 0,
      averageScore: row.score ?? 0,
    },
    timing: {
      startedAt: row.startedAt?.getTime() ?? row.createdAt.getTime(),
      endedAt: row.completedAt?.getTime(),
      totalDurationMs: row.completedAt && row.startedAt
        ? row.completedAt.getTime() - row.startedAt.getTime()
        : 0,
      averageAnswerTimeMs: 0,
    },
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

// ============ SESSION CRUD ============

export async function createInterviewSession(session: InterviewSession): Promise<void> {
  await prisma.interview.create({
    data: {
      id: session.id,
      userId: session.userId,
      type: mapInterviewType(session.type),
      difficulty: mapDifficulty(session.difficulty),
      status: mapStatus(session.status),
      questions: [],
      answers: [],
      score: session.progress?.averageScore ?? null,
      startedAt: session.timing?.startedAt ? new Date(session.timing.startedAt) : null,
    },
  });
}

export async function getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
  const row = await prisma.interview.findUnique({ where: { id: sessionId } });
  if (!row) return null;
  return dbToSession(row);
}

export async function updateInterviewSession(
  sessionId: string,
  updates: Partial<Pick<InterviewSession, 'status' | 'progress' | 'timing' | 'difficulty'>>
): Promise<void> {
  const data: Record<string, unknown> = {};

  if (updates.status) data.status = mapStatus(updates.status);
  if (updates.difficulty) data.difficulty = mapDifficulty(updates.difficulty);
  if (updates.progress?.averageScore != null) data.score = updates.progress.averageScore;
  if (updates.status === 'completed') data.completedAt = new Date();
  if (updates.timing?.startedAt && !updates.timing.endedAt) data.startedAt = new Date(updates.timing.startedAt);

  await prisma.interview.update({ where: { id: sessionId }, data });
}

export async function getUserSessions(
  userId: string,
  maxResults = 20
): Promise<InterviewSession[]> {
  const rows = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: maxResults,
  });
  return rows.map(dbToSession);
}

// ============ QUESTIONS ============

export async function saveSessionQuestions(
  sessionId: string,
  questions: InterviewQuestion[]
): Promise<void> {
  await prisma.interview.update({
    where: { id: sessionId },
    data: { questions: questions as unknown as object[] },
  });
}

export async function getSessionQuestions(sessionId: string): Promise<InterviewQuestion[]> {
  const row = await prisma.interview.findUnique({
    where: { id: sessionId },
    select: { questions: true },
  });
  if (!row) return [];
  return (row.questions as unknown as InterviewQuestion[]) ?? [];
}

// ============ ANSWERS ============

export async function saveSessionAnswer(
  sessionId: string,
  answer: InterviewAnswer
): Promise<void> {
  // Append answer to the Json array
  const row = await prisma.interview.findUnique({
    where: { id: sessionId },
    select: { answers: true },
  });

  const existing = (row?.answers as unknown as InterviewAnswer[]) ?? [];
  // Replace if same questionIndex exists, otherwise append
  const idx = existing.findIndex((a) => a.questionIndex === answer.questionIndex);
  if (idx >= 0) {
    existing[idx] = answer;
  } else {
    existing.push(answer);
  }

  await prisma.interview.update({
    where: { id: sessionId },
    data: { answers: existing as unknown as object[] },
  });
}

export async function getSessionAnswers(sessionId: string): Promise<InterviewAnswer[]> {
  const row = await prisma.interview.findUnique({
    where: { id: sessionId },
    select: { answers: true },
  });
  if (!row) return [];
  return (row.answers as unknown as InterviewAnswer[]) ?? [];
}

export async function getLastNAnswers(
  sessionId: string,
  n: number
): Promise<InterviewAnswer[]> {
  const all = await getSessionAnswers(sessionId);
  return all.slice(-n);
}

// ============ SESSION HISTORY ============

export async function getSessionHistory(
  userId: string,
  daysBack = 30,
  maxResults = 50
): Promise<InterviewSession[]> {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const rows = await prisma.interview.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: 'desc' },
    take: maxResults,
  });

  return rows.map(dbToSession);
}

// ============ DELETE ============

export async function deleteInterviewSession(sessionId: string): Promise<void> {
  await prisma.interview.delete({ where: { id: sessionId } });
}
