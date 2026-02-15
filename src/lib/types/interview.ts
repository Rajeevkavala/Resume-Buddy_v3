/**
 * Interview Session Types
 * 
 * Shared types for the enhanced interview prep system.
 * Uses Firestore subcollections for efficient storage.
 */

// ============ ENUMS ============

export type InterviewSessionType = 'dsa' | 'behavioral' | 'technical' | 'system-design';
export type InterviewDifficulty = 'easy' | 'medium' | 'hard';
export type SessionStatus = 'configuring' | 'active' | 'paused' | 'completed';
export type QuestionStatus = 'pending' | 'current' | 'answered' | 'skipped';
export type AnswerMode = 'text' | 'voice' | 'code';

// ============ DSA CATEGORIES ============

export const DSA_CATEGORIES = [
  'arrays',
  'strings',
  'linked-lists',
  'stacks-queues',
  'trees',
  'graphs',
  'dynamic-programming',
  'sorting-searching',
  'hash-tables',
  'recursion',
  'greedy',
  'bit-manipulation',
] as const;

export type DSACategory = (typeof DSA_CATEGORIES)[number];

export const DSA_CATEGORY_LABELS: Record<DSACategory, string> = {
  'arrays': 'Arrays',
  'strings': 'Strings',
  'linked-lists': 'Linked Lists',
  'stacks-queues': 'Stacks & Queues',
  'trees': 'Trees',
  'graphs': 'Graphs',
  'dynamic-programming': 'Dynamic Programming',
  'sorting-searching': 'Sorting & Searching',
  'hash-tables': 'Hash Tables',
  'recursion': 'Recursion',
  'greedy': 'Greedy Algorithms',
  'bit-manipulation': 'Bit Manipulation',
};

// ============ CODE LANGUAGES ============

export const CODE_LANGUAGES = ['javascript', 'python', 'java', 'cpp'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

// ============ ANSWER FORMATS ============

export const ANSWER_FORMATS = ['mcq', 'text', 'voice', 'code'] as const;
export type AnswerFormat = (typeof ANSWER_FORMATS)[number];

export const ANSWER_FORMAT_LABELS: Record<AnswerFormat, string> = {
  mcq: 'Multiple Choice',
  text: 'Text Answer',
  voice: 'Voice Recording',
  code: 'Code Answer',
};

// ============ SESSION ============

/** Main session document — lightweight, no arrays */
export interface InterviewSession {
  id: string;
  userId: string;
  type: InterviewSessionType;
  difficulty: InterviewDifficulty;
  status: SessionStatus;
  totalQuestions: number;
  answerFormat?: AnswerFormat;   // User-selected answer format
  codeLanguage?: CodeLanguage;
  dsaCategories?: DSACategory[];
  resumeContext?: string;      // Truncated for token optimization
  jobDescription?: string;     // Truncated
  progress: SessionProgress;
  timing: SessionTiming;
  createdAt: number;           // Date.now()
  updatedAt: number;
}

export interface SessionProgress {
  currentQuestionIndex: number;
  completed: number;
  correct: number;
  skipped: number;
  averageScore: number;
}

export interface SessionTiming {
  startedAt: number;
  endedAt?: number;
  totalDurationMs: number;
  averageAnswerTimeMs: number;
}

// ============ QUESTION (subcollection) ============

/** Stored in interview_sessions/{sessionId}/questions/{qId} */
export interface InterviewQuestion {
  id: string;
  index: number;
  status: QuestionStatus;
  type: InterviewSessionType;
  difficulty: InterviewDifficulty;
  question: string;
  category: string;
  hints?: string[];
  // DSA-specific
  codeTemplate?: string;
  expectedComplexity?: {
    time: string;
    space: string;
  };
  // MCQ-specific (for behavioral/technical)
  options?: string[];
  correctAnswerIndex?: number;
}

// ============ ANSWER (subcollection) ============

/** Stored in interview_sessions/{sessionId}/answers/{aId} */
export interface InterviewAnswer {
  id: string;
  questionId: string;
  questionIndex: number;
  mode: AnswerMode;
  textAnswer?: string;
  codeAnswer?: string;
  codeLanguage?: CodeLanguage;
  voiceTranscript?: string;
  voiceExplanation?: string;  // "Explain your approach" recording
  submittedAt: number;
  timeSpentMs: number;
  evaluation?: AnswerEvaluation;
}

// ============ EVALUATION ============

export interface AnswerEvaluation {
  score: number;           // 0-100
  isCorrect: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
  // Code-specific
  codeAnalysis?: CodeAnalysis;
  // Communication-specific
  communicationScore?: number;
  communicationFeedback?: string;
}

export interface CodeAnalysis {
  correctness: number;     // 0-100
  efficiency: number;      // 0-100
  readability: number;     // 0-100
  timeComplexity: string;
  spaceComplexity: string;
  edgeCasesHandled: boolean;
  suggestions: string[];
}

// ============ SESSION CONFIG (UI) ============

export interface InterviewConfig {
  type: InterviewSessionType;
  difficulty: InterviewDifficulty;
  questionCount: number;
  answerFormat: AnswerFormat;       // User-selected answer format
  codeLanguage?: CodeLanguage;
  dsaCategories?: DSACategory[];
  useVoice: boolean;
  resumeText?: string;
  jobDescription?: string;
}

// ============ SESSION RESULTS ============

export interface SessionResults {
  session: InterviewSession;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  summary: {
    totalScore: number;
    accuracy: number;
    averageTimePerQuestion: number;
    strongCategories: string[];
    weakCategories: string[];
    overallFeedback: string;
  };
}

// ============ ADAPTIVE DIFFICULTY ============

/**
 * Simple adaptive difficulty based on last 2 scores.
 * No ML needed — good enough, ships fast.
 */
export function calculateAdaptiveDifficulty(
  lastScores: number[]
): InterviewDifficulty {
  if (lastScores.length < 2) return 'medium';

  const last2 = lastScores.slice(-2);
  const avg = last2.reduce((a, b) => a + b, 0) / last2.length;

  if (avg > 80) return 'hard';
  if (avg < 60) return 'easy';
  return 'medium';
}
