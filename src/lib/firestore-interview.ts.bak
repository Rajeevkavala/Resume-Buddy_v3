/**
 * Firestore Interview Service
 * 
 * Manages interview session persistence using subcollections
 * for efficient Firestore free-tier usage.
 * 
 * Data Model:
 *   interview_sessions/{sessionId}           - Lightweight session doc
 *   interview_sessions/{sessionId}/questions/{qId}  - Questions subcollection
 *   interview_sessions/{sessionId}/answers/{aId}    - Answers subcollection
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  SessionProgress,
  SessionTiming,
  InterviewDifficulty,
} from '@/lib/types/interview';

const SESSIONS_COLLECTION = 'interview_sessions';

// ============ SESSION CRUD ============

/** Create a new interview session */
export async function createInterviewSession(
  session: InterviewSession
): Promise<void> {
  const ref = doc(db, SESSIONS_COLLECTION, session.id);
  await setDoc(ref, {
    ...session,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/** Get a session by ID */
export async function getInterviewSession(
  sessionId: string
): Promise<InterviewSession | null> {
  const ref = doc(db, SESSIONS_COLLECTION, sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InterviewSession;
}

/** Update session progress/status */
export async function updateInterviewSession(
  sessionId: string,
  updates: Partial<
    Pick<InterviewSession, 'status' | 'progress' | 'timing' | 'difficulty'>
  >
): Promise<void> {
  const ref = doc(db, SESSIONS_COLLECTION, sessionId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/** Get recent sessions for a user */
export async function getUserSessions(
  userId: string,
  maxResults = 20
): Promise<InterviewSession[]> {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InterviewSession);
}

// ============ QUESTIONS SUBCOLLECTION ============

/** Save questions to subcollection (batch write) */
export async function saveSessionQuestions(
  sessionId: string,
  questions: InterviewQuestion[]
): Promise<void> {
  for (const q of questions) {
    const ref = doc(
      db,
      SESSIONS_COLLECTION,
      sessionId,
      'questions',
      q.id
    );
    await setDoc(ref, q);
  }
}

/** Get all questions for a session */
export async function getSessionQuestions(
  sessionId: string
): Promise<InterviewQuestion[]> {
  const q = query(
    collection(db, SESSIONS_COLLECTION, sessionId, 'questions'),
    orderBy('index', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InterviewQuestion);
}

// ============ ANSWERS SUBCOLLECTION ============

/** Save an answer to subcollection */
export async function saveSessionAnswer(
  sessionId: string,
  answer: InterviewAnswer
): Promise<void> {
  const ref = doc(
    db,
    SESSIONS_COLLECTION,
    sessionId,
    'answers',
    answer.id
  );
  await setDoc(ref, answer);
}

/** Get all answers for a session */
export async function getSessionAnswers(
  sessionId: string
): Promise<InterviewAnswer[]> {
  const q = query(
    collection(db, SESSIONS_COLLECTION, sessionId, 'answers'),
    orderBy('questionIndex', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InterviewAnswer);
}

/** Get last N answers (for adaptive difficulty) */
export async function getLastNAnswers(
  sessionId: string,
  n: number
): Promise<InterviewAnswer[]> {
  const q = query(
    collection(db, SESSIONS_COLLECTION, sessionId, 'answers'),
    orderBy('submittedAt', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InterviewAnswer);
}

// ============ SESSION HISTORY ============

/** Get completed sessions with summary stats */
export async function getSessionHistory(
  userId: string,
  daysBack = 30,
  maxResults = 50
): Promise<InterviewSession[]> {
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;

  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'completed'),
    where('createdAt', '>=', cutoff),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InterviewSession);
}

/** Delete a session and its subcollections */
export async function deleteInterviewSession(
  sessionId: string
): Promise<void> {
  // Delete questions subcollection
  const questionsSnap = await getDocs(
    collection(db, SESSIONS_COLLECTION, sessionId, 'questions')
  );
  for (const d of questionsSnap.docs) {
    await deleteDoc(d.ref);
  }

  // Delete answers subcollection
  const answersSnap = await getDocs(
    collection(db, SESSIONS_COLLECTION, sessionId, 'answers')
  );
  for (const d of answersSnap.docs) {
    await deleteDoc(d.ref);
  }

  // Delete session doc
  await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
}
