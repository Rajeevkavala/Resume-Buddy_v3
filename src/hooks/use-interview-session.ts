'use client';

/**
 * useInterviewSession Hook
 * 
 * Central state manager for the enhanced interview experience.
 * Coordinates question flow, answer submission, evaluation, TTS, and persistence.
 */

import { useState, useCallback, useRef } from 'react';
import { getVoiceInterviewer } from '@/lib/speech/text-to-speech';
import { detectBrowserSupport } from '@/lib/speech/browser-support';
import {
  startInterviewSessionAction,
  evaluateAnswerAction,
  evaluateCodeAction,
  getFollowUpAction,
} from '@/app/actions';
import {
  createInterviewSession,
  saveSessionQuestions,
  saveSessionAnswer,
  updateInterviewSession,
} from '@/lib/firestore-interview';
import { notifyAIRequestMade } from '@/hooks/use-daily-usage';
import { toast } from 'sonner';
import type {
  InterviewConfig,
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  AnswerEvaluation,
  SessionStatus,
  CodeLanguage,
  InterviewDifficulty,
} from '@/lib/types/interview';
import { calculateAdaptiveDifficulty } from '@/lib/types/interview';

// ============ TYPES ============

export type SessionPhase =
  | 'config'       // Setting up
  | 'generating'   // AI generating questions
  | 'active'       // Interview in progress
  | 'evaluating'   // Evaluating current answer
  | 'review'       // Reviewing evaluation feedback
  | 'completed';   // All questions done

interface SessionState {
  phase: SessionPhase;
  session: InterviewSession | null;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  currentQuestionIndex: number;
  currentEvaluation: AnswerEvaluation | null;
  voiceExplanation: string | null;
  voiceEnabled: boolean;  // Track if voice/TTS is enabled for this session
  error: string | null;
  isLoading: boolean;
}

const initialState: SessionState = {
  phase: 'config',
  session: null,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  currentEvaluation: null,
  voiceExplanation: null,
  voiceEnabled: false,
  error: null,
  isLoading: false,
};

// ============ HOOK ============

/** Fire-and-forget Firestore persistence — never block the session */
function persistAsync(fn: () => Promise<void>) {
  fn().catch((err) => {
    console.warn('[InterviewSession] Firestore persistence failed:', err?.message || err);
  });
}

export function useInterviewSession(userId: string) {
  const [state, setState] = useState<SessionState>(initialState);
  const questionStartTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>('');

  const currentQuestion = state.questions[state.currentQuestionIndex] ?? null;

  // ---- START SESSION ----
  const startSession = useCallback(
    async (config: InterviewConfig) => {
      setState((s) => ({ ...s, phase: 'generating', isLoading: true, error: null }));

      try {
        // Generate questions via server action
        const result = await startInterviewSessionAction({
          userId,
          type: config.type,
          difficulty: config.difficulty,
          questionCount: config.questionCount,
          answerFormat: config.answerFormat,
          codeLanguage: config.codeLanguage,
          dsaCategories: config.dsaCategories,
          resumeText: config.resumeText,
          jobDescription: config.jobDescription,
        });

        if (!result || !result.questions || !Array.isArray(result.questions)) {
          throw new Error('AI returned empty or invalid response. Please try again.');
        }

        // Build session ID
        const sessionId = `${userId}_${Date.now()}`;
        sessionIdRef.current = sessionId;

        // Map questions
        const questions: InterviewQuestion[] = result.questions.map(
          (q: any, i: number) => {
            const baseQuestion = {
              id: `q_${i}`,
              index: i,
              status: i === 0 ? 'current' : ('pending' as const),
              type: config.type,
              difficulty: config.difficulty,
              question: q.question,
              category: q.category || 'General',
              hints: q.hints,
            };

            // Add DSA-specific fields
            if (config.type === 'dsa') {
              return {
                ...baseQuestion,
                codeTemplate: q.codeTemplate,
                expectedComplexity: q.expectedComplexity,
                constraints: q.constraints,
                examples: q.examples,
              };
            }

            // Add MCQ-specific fields for other types
            return {
              ...baseQuestion,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex,
            };
          }
        );

        // Build session doc
        const session: InterviewSession = {
          id: sessionId,
          userId,
          type: config.type,
          difficulty: config.difficulty,
          status: 'active',
          totalQuestions: questions.length,
          answerFormat: config.answerFormat,
          codeLanguage: config.codeLanguage,
          dsaCategories: config.dsaCategories,
          resumeContext: config.resumeText?.slice(0, 500),
          jobDescription: config.jobDescription?.slice(0, 500),
          progress: {
            currentQuestionIndex: 0,
            completed: 0,
            correct: 0,
            skipped: 0,
            averageScore: 0,
          },
          timing: {
            startedAt: Date.now(),
            totalDurationMs: 0,
            averageAnswerTimeMs: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Persist to Firestore (non-blocking — don't fail session if storage errors)
        persistAsync(async () => {
          await createInterviewSession(session);
          await saveSessionQuestions(sessionId, questions);
        });

        // Track credit usage
        notifyAIRequestMade();

        // Speak first question if voice enabled
        if (config.useVoice) {
          const tts = getVoiceInterviewer();
          if (tts.isSupported && questions[0]) {
            tts.speak(questions[0].question).catch(() => {});
          }
        }

        questionStartTimeRef.current = Date.now();

        setState({
          phase: 'active',
          session,
          questions,
          answers: [],
          currentQuestionIndex: 0,
          currentEvaluation: null,
          voiceExplanation: null,
          voiceEnabled: config.useVoice,  // Store voice preference
          error: null,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('[InterviewSession] startSession error:', error);
        toast.error('Failed to start interview', {
          description: error?.message || 'Please try again.',
        });
        setState((s) => ({
          ...s,
          phase: 'config',
          error: error?.message || 'Failed to start session',
          isLoading: false,
        }));
      }
    },
    [userId]
  );

  // ---- SUBMIT TEXT/VOICE ANSWER ----
  const submitAnswer = useCallback(
    async (answerText: string) => {
      if (!currentQuestion || !state.session) return;

      setState((s) => ({ ...s, phase: 'evaluating', isLoading: true }));

      try {
        const timeSpent = Date.now() - questionStartTimeRef.current;

        // Determine correct answer context for MCQ
        let correctAnswer: string | undefined;
        if (
          currentQuestion.options &&
          currentQuestion.correctAnswerIndex != null
        ) {
          correctAnswer =
            currentQuestion.options[currentQuestion.correctAnswerIndex];
        }

        const evaluation = await evaluateAnswerAction({
          userId,
          question: currentQuestion.question,
          questionType: state.session.type,
          difficulty: state.session.difficulty,
          userAnswer: answerText,
          answerMode: state.voiceExplanation ? 'voice' : 'text',  // Determine mode based on voice explanation
          correctAnswer,
          voiceExplanation: state.voiceExplanation || undefined,
        });

        // Build answer doc
        const answer: InterviewAnswer = {
          id: `a_${state.currentQuestionIndex}`,
          questionId: currentQuestion.id,
          questionIndex: state.currentQuestionIndex,
          mode: state.voiceExplanation ? 'voice' : 'text',  // Match evaluation mode
          textAnswer: answerText,
          voiceExplanation: state.voiceExplanation || undefined,
          submittedAt: Date.now(),
          timeSpentMs: timeSpent,
          evaluation,
        };

        // Persist (non-blocking)
        persistAsync(() => saveSessionAnswer(sessionIdRef.current, answer));

        // Track credit usage
        notifyAIRequestMade();

        setState((s) => ({
          ...s,
          phase: 'review',
          answers: [...s.answers, answer],
          currentEvaluation: evaluation,
          isLoading: false,
        }));
      } catch (error: any) {
        toast.error('Evaluation failed', { description: error?.message || 'Please try again.' });
        setState((s) => ({
          ...s,
          phase: 'active',
          error: error?.message || 'Failed to evaluate answer',
          isLoading: false,
        }));
      }
    },
    [currentQuestion, state.session, state.currentQuestionIndex, state.voiceExplanation, userId]
  );

  // ---- SUBMIT CODE ANSWER ----
  const submitCode = useCallback(
    async (code: string, language: CodeLanguage) => {
      if (!currentQuestion || !state.session) return;

      setState((s) => ({ ...s, phase: 'evaluating', isLoading: true }));

      try {
        const timeSpent = Date.now() - questionStartTimeRef.current;

        const evaluation = await evaluateCodeAction({
          userId,
          question: currentQuestion.question,
          code,
          language,
          expectedComplexity: currentQuestion.expectedComplexity,
          voiceExplanation: state.voiceExplanation || undefined,
        });

        const answer: InterviewAnswer = {
          id: `a_${state.currentQuestionIndex}`,
          questionId: currentQuestion.id,
          questionIndex: state.currentQuestionIndex,
          mode: 'code',
          codeAnswer: code,
          codeLanguage: language,
          voiceExplanation: state.voiceExplanation || undefined,
          submittedAt: Date.now(),
          timeSpentMs: timeSpent,
          evaluation: {
            score: evaluation.score,
            isCorrect: evaluation.isCorrect,
            feedback: evaluation.feedback,
            strengths: evaluation.strengths,
            improvements: evaluation.issues,
            codeAnalysis: {
              correctness: evaluation.correctness,
              efficiency: evaluation.efficiency,
              readability: evaluation.readability,
              timeComplexity: evaluation.timeComplexity,
              spaceComplexity: evaluation.spaceComplexity,
              edgeCasesHandled: evaluation.edgeCasesHandled,
              suggestions: evaluation.suggestions,
            },
            communicationScore: evaluation.communicationScore,
            communicationFeedback: evaluation.communicationFeedback,
          },
        };

        // Persist (non-blocking)
        persistAsync(() => saveSessionAnswer(sessionIdRef.current, answer));

        // Track credit usage
        notifyAIRequestMade();

        setState((s) => ({
          ...s,
          phase: 'review',
          answers: [...s.answers, answer],
          currentEvaluation: answer.evaluation!,
          isLoading: false,
        }));
      } catch (error: any) {
        toast.error('Code evaluation failed', { description: error?.message || 'Please try again.' });
        setState((s) => ({
          ...s,
          phase: 'active',
          error: error?.message || 'Failed to evaluate code',
          isLoading: false,
        }));
      }
    },
    [currentQuestion, state.session, state.currentQuestionIndex, state.voiceExplanation, userId]
  );

  // ---- NEXT QUESTION ----
  const nextQuestion = useCallback(async () => {
    const nextIndex = state.currentQuestionIndex + 1;
    const isComplete = nextIndex >= state.questions.length;

    if (isComplete) {
      // Calculate final stats
      const totalScore = state.answers.reduce(
        (sum, a) => sum + (a.evaluation?.score ?? 0),
        0
      );
      const correct = state.answers.filter(
        (a) => a.evaluation?.isCorrect
      ).length;
      const avgScore = state.answers.length > 0 ? totalScore / state.answers.length : 0;

      persistAsync(() =>
        updateInterviewSession(sessionIdRef.current, {
          status: 'completed',
          progress: {
            currentQuestionIndex: nextIndex,
            completed: state.answers.length,
            correct,
            skipped: state.questions.length - state.answers.length,
            averageScore: Math.round(avgScore),
          },
          timing: {
            startedAt: state.session!.timing.startedAt,
            endedAt: Date.now(),
            totalDurationMs: Date.now() - state.session!.timing.startedAt,
            averageAnswerTimeMs:
              state.answers.length > 0
                ? state.answers.reduce((s, a) => s + a.timeSpentMs, 0) /
                  state.answers.length
                : 0,
          },
        })
      );

      setState((s) => ({ ...s, phase: 'completed' }));
    } else {
      questionStartTimeRef.current = Date.now();

      // Speak next question if voice enabled
      const nextQ = state.questions[nextIndex];
      if (nextQ && state.voiceEnabled) {
        const tts = getVoiceInterviewer();
        if (tts.isSupported) {
          tts.speak(nextQ.question).catch(() => {});
        }
      }

      setState((s) => ({
        ...s,
        phase: 'active',
        currentQuestionIndex: nextIndex,
        currentEvaluation: null,
        voiceExplanation: null,
      }));
    }
  }, [state.currentQuestionIndex, state.questions, state.answers, state.session]);

  // ---- SKIP QUESTION ----
  const skipQuestion = useCallback(async () => {
    const answer: InterviewAnswer = {
      id: `a_${state.currentQuestionIndex}`,
      questionId: currentQuestion?.id || '',
      questionIndex: state.currentQuestionIndex,
      mode: 'text',
      textAnswer: '[Skipped]',
      submittedAt: Date.now(),
      timeSpentMs: Date.now() - questionStartTimeRef.current,
      evaluation: {
        score: 0,
        isCorrect: false,
        feedback: 'Question was skipped.',
        strengths: [],
        improvements: ['Try attempting the question next time.'],
      },
    };

    persistAsync(() => saveSessionAnswer(sessionIdRef.current, answer));

    setState((s) => ({
      ...s,
      answers: [...s.answers, answer],
    }));

    // Move to next (or complete)
    nextQuestion();
  }, [state.currentQuestionIndex, currentQuestion, nextQuestion]);

  // ---- SET VOICE EXPLANATION ----
  const setVoiceExplanation = useCallback((transcript: string) => {
    setState((s) => ({ ...s, voiceExplanation: transcript }));
  }, []);

  // ---- RESET ----
  const reset = useCallback(() => {
    const tts = getVoiceInterviewer();
    tts.stop();
    setState(initialState);
  }, []);

  // ---- END SESSION EARLY ----
  const endSession = useCallback(async () => {
    const tts = getVoiceInterviewer();
    tts.stop();

    if (sessionIdRef.current && state.session) {
      const totalScore = state.answers.reduce(
        (sum, a) => sum + (a.evaluation?.score ?? 0),
        0
      );
      const avgScore = state.answers.length > 0 ? totalScore / state.answers.length : 0;

      persistAsync(() =>
        updateInterviewSession(sessionIdRef.current, {
          status: 'completed',
          progress: {
            currentQuestionIndex: state.currentQuestionIndex,
            completed: state.answers.length,
            correct: state.answers.filter((a) => a.evaluation?.isCorrect).length,
            skipped: state.questions.length - state.answers.length,
            averageScore: Math.round(avgScore),
          },
          timing: {
            startedAt: state.session!.timing.startedAt,
            endedAt: Date.now(),
            totalDurationMs: Date.now() - state.session!.timing.startedAt,
            averageAnswerTimeMs:
              state.answers.length > 0
                ? state.answers.reduce((s, a) => s + a.timeSpentMs, 0) /
                  state.answers.length
                : 0,
          },
        })
      );
    }

    setState((s) => ({ ...s, phase: 'completed' }));
  }, [state.session, state.answers, state.questions, state.currentQuestionIndex]);

  return {
    // State
    phase: state.phase,
    session: state.session,
    questions: state.questions,
    answers: state.answers,
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    currentEvaluation: state.currentEvaluation,
    voiceExplanation: state.voiceExplanation,
    error: state.error,
    isLoading: state.isLoading,

    // Actions
    startSession,
    submitAnswer,
    submitCode,
    nextQuestion,
    skipQuestion,
    setVoiceExplanation,
    endSession,
    reset,
  };
}
