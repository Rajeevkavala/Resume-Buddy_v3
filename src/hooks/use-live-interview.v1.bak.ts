'use client';

/**
 * useLiveInterview Hook
 * 
 * Central state machine for real-time AI voice interviews using Sarvam AI.
 * Manages the complete conversation lifecycle:
 *   setup → connecting → greeting → conversation → evaluating → completed
 * 
 * Pipeline per turn:
 *   1. User speaks → SarvamAudioRecorder captures → STT API → transcript
 *   2. Transcript + context → /api/live-interview/respond → AI response
 *   3. AI response → /api/live-interview/tts → SarvamAudioPlayer plays
 *   4. Repeat until session ends
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type {
  InterviewSessionType,
  InterviewDifficulty,
  CodeLanguage,
  DSACategory,
} from '@/lib/types/interview';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LivePhase =
  | 'setup'        // Configuration screen
  | 'connecting'   // Starting session, loading first question
  | 'greeting'     // AI is greeting the candidate
  | 'listening'    // Waiting for user to speak
  | 'processing'   // Transcribing user audio
  | 'thinking'     // AI generating response
  | 'speaking'     // AI speaking response
  | 'code-input'   // User editing code (DSA mode)
  | 'evaluating'   // Final evaluation
  | 'completed';   // Interview done

export interface LiveMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
  audioAvailable?: boolean;
  score?: number | null;
  action?: string;
  feedback?: string | null;
}

export interface LiveConfig {
  type: InterviewSessionType;
  difficulty: InterviewDifficulty;
  questionCount: number;
  codeLanguage?: CodeLanguage;
  dsaCategories?: DSACategory[];
  resumeText?: string;
  jobDescription?: string;
  speaker?: string;
  enableAudio?: boolean;
}

export interface LiveEvaluation {
  overallScore: number;
  verdict: string;
  summary: string;
  categoryScores: Record<string, number | null>;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
  recommendedTopics: string[];
  interviewTips: string[];
}

interface LiveState {
  phase: LivePhase;
  sessionId: string | null;
  config: LiveConfig | null;
  messages: LiveMessage[];
  currentQuestion: string;
  questionIndex: number;
  audioLevel: number;          // 0-1 for visualization
  interviewerAudioLevel: number;
  transcript: string;          // Current interim transcript
  isMicActive: boolean;        // Whether mic is currently recording
  evaluation: LiveEvaluation | null;
  error: string | null;
  isLoading: boolean;
  startedAt: number | null;
  codeContent: string;         // DSA code editor content
  codeTemplate: string;        // Initial code template
  hints: string[];
  examples: any[];
  constraints: string[];
  expectedComplexity: any;
  questionCategory: string;
}

const initialState: LiveState = {
  phase: 'setup',
  sessionId: null,
  config: null,
  messages: [],
  currentQuestion: '',
  questionIndex: 0,
  audioLevel: 0,
  interviewerAudioLevel: 0,
  transcript: '',
  isMicActive: false,
  evaluation: null,
  error: null,
  isLoading: false,
  startedAt: null,
  codeContent: '',
  codeTemplate: '',
  hints: [],
  examples: [],
  constraints: [],
  expectedComplexity: null,
  questionCategory: '',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveInterview(userId: string) {
  const [state, setState] = useState<LiveState>(initialState);
  const recorderRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Ref to always call the latest submitTranscript (avoids stale closure)
  const submitTranscriptRef = useRef<(text: string) => void>(() => {});
  // Ref to latest startListening for auto-start useEffect
  const startListeningRef = useRef<(() => Promise<void>) | undefined>(undefined);
  // Prevent double auto-start within one listening phase
  const autoStartedRef = useRef(false);

  // Lazy-load audio modules (client-only)
  const getRecorder = useCallback(async () => {
    if (!recorderRef.current) {
      const { getSarvamRecorder } = await import('@/lib/speech/sarvam-recorder');
      recorderRef.current = getSarvamRecorder({
        silenceTimeout: 2500,
        maxRecordingTime: 90000,
      });
    }
    return recorderRef.current;
  }, []);

  const getPlayer = useCallback(async () => {
    if (!playerRef.current) {
      const { getSarvamPlayer } = await import('@/lib/speech/sarvam-player');
      playerRef.current = getSarvamPlayer();
    }
    return playerRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      recorderRef.current?.destroy?.();
      playerRef.current?.destroy?.();
    };
  }, []);

  // Auto-start recording whenever phase becomes 'listening'
  useEffect(() => {
    if (state.phase === 'listening') {
      if (!autoStartedRef.current) {
        autoStartedRef.current = true;
        const t = setTimeout(() => {
          startListeningRef.current?.();
        }, 350);
        return () => clearTimeout(t);
      }
    } else {
      // Reset flag so next listening phase auto-starts again
      autoStartedRef.current = false;
    }
  }, [state.phase]);

  // ─── START SESSION ──────────────────────────────────────────────────────

  const startSession = useCallback(async (config: LiveConfig) => {
    setState(s => ({
      ...s,
      phase: 'connecting',
      config,
      isLoading: true,
      error: null,
      messages: [],
      startedAt: Date.now(),
    }));

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/live-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          interviewType: config.type,
          difficulty: config.difficulty,
          questionCount: config.questionCount,
          codeLanguage: config.codeLanguage,
          dsaCategories: config.dsaCategories,
          resumeText: config.resumeText,
          jobDescription: config.jobDescription,
          generateAudio: config.enableAudio !== false,
          speaker: config.speaker || 'shubh',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start session');
      }

      // Pre-warm recorder & request mic permission now (non-blocking)
      getRecorder().then(rec => {
        rec.requestPermission?.();
      }).catch(() => {});

      const data = await response.json();
      
      const greetingMsg: LiveMessage = {
        id: `msg_${Date.now()}_greeting`,
        role: 'interviewer',
        content: `${data.greeting} ${data.firstQuestion}`,
        timestamp: Date.now(),
        audioAvailable: data.audios?.length > 0,
      };

      setState(s => ({
        ...s,
        phase: 'greeting',
        sessionId: data.sessionId,
        messages: [greetingMsg],
        currentQuestion: data.firstQuestion,
        questionIndex: 0,
        questionCategory: data.questionCategory || '',
        codeTemplate: data.codeTemplate || '',
        codeContent: data.codeTemplate || '',
        hints: data.hints || [],
        examples: data.examples || [],
        constraints: data.constraints || [],
        expectedComplexity: data.expectedComplexity || null,
        isLoading: false,
      }));

      // Play greeting audio
      if (data.audios?.length > 0 && config.enableAudio !== false) {
        try {
          const player = await getPlayer();
          await player.play(data.audios, {
            onAudioLevel: (level: number) => {
              setState(s => ({ ...s, interviewerAudioLevel: level }));
            },
            onComplete: () => {
              setState(s => ({
                ...s,
                phase: config.type === 'dsa' ? 'code-input' : 'listening',
                interviewerAudioLevel: 0,
              }));
            },
            onError: (err: string) => {
              console.warn('[LiveInterview] Audio playback failed:', err);
              setState(s => ({
                ...s,
                phase: config.type === 'dsa' ? 'code-input' : 'listening',
                interviewerAudioLevel: 0,
              }));
            },
          });
        } catch {
          setState(s => ({
            ...s,
            phase: config.type === 'dsa' ? 'code-input' : 'listening',
          }));
        }
      } else {
        // No audio, transition immediately
        setTimeout(() => {
          setState(s => ({
            ...s,
            phase: config.type === 'dsa' ? 'code-input' : 'listening',
          }));
        }, 2000);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('[LiveInterview] Start error:', error);
      toast.error('Failed to start interview', { description: error.message });
      setState(s => ({
        ...s,
        phase: 'setup',
        error: error.message,
        isLoading: false,
      }));
    }
  }, [userId, getPlayer]);

  // ─── START LISTENING ──────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    try {
      const recorder = await getRecorder();

      // If already recording, don't double-start
      if (recorder.isRecording) return;

      setState(s => ({ ...s, transcript: '', isMicActive: true }));

      recorder.start({
        onStatusChange: (status: string) => {
          if (status === 'processing') {
            setState(s => ({ ...s, phase: 'processing', isMicActive: false }));
          } else if (status === 'error') {
            setState(s => ({ ...s, isMicActive: false }));
          }
        },
        onTranscript: (transcript: string, isFinal: boolean) => {
          if (isFinal && transcript && transcript.trim().length > 0) {
            setState(s => ({ ...s, transcript, isMicActive: false }));
            // Use ref so submitTranscript always has fresh state
            submitTranscriptRef.current(transcript);
          } else if (isFinal && (!transcript || transcript.trim().length === 0)) {
            // Empty transcript — go back to listening (auto-start will re-trigger)
            setState(s => ({ ...s, phase: 'listening', transcript: '', isMicActive: false }));
          } else {
            // Interim results
            setState(s => ({ ...s, transcript }));
          }
        },
        onAudioLevel: (level: number) => {
          setState(s => ({ ...s, audioLevel: level }));
        },
        onError: (error: string) => {
          console.error('[LiveInterview] Recording error:', error);
          toast.error('Microphone error', { description: error });
          setState(s => ({ ...s, phase: 'listening', audioLevel: 0, isMicActive: false }));
          // Reset auto-start so it tries again
          autoStartedRef.current = false;
        },
        onRecordingStop: () => {
          setState(s => ({ ...s, audioLevel: 0 }));
        },
      });
    } catch (error: any) {
      toast.error('Failed to start recording', { description: error.message });
      setState(s => ({ ...s, isMicActive: false }));
    }
  }, [getRecorder]);

  // Keep ref in sync with latest startListening
  startListeningRef.current = startListening;

  // ─── STOP LISTENING ───────────────────────────────────────────────────

  const stopListening = useCallback(async () => {
    const recorder = await getRecorder();
    recorder.stop();
    setState(s => ({ ...s, isMicActive: false }));
  }, [getRecorder]);

  // ─── TOGGLE MIC ───────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    const recorder = await getRecorder();
    if (recorder.isRecording) {
      // Stop and go back to idle listening (user paused)
      recorder.cancel();
      setState(s => ({ ...s, isMicActive: false, audioLevel: 0, transcript: '' }));
    } else {
      // Manual start — reset auto-start flag first
      autoStartedRef.current = true;
      await startListening();
    }
  }, [getRecorder, startListening]);

  // ─── SUBMIT TRANSCRIPT (voice or text) ────────────────────────────────

  const submitTranscript = useCallback(async (text: string) => {
    if (!text.trim() || !state.config) return;

    const userMsg: LiveMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'candidate',
      content: text,
      timestamp: Date.now(),
    };

    setState(s => ({
      ...s,
      phase: 'thinking',
      messages: [...s.messages, userMsg],
      transcript: '',
      audioLevel: 0,
    }));

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/live-interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          interviewType: state.config.type,
          difficulty: state.config.difficulty,
          conversationHistory: [...state.messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          currentQuestion: state.currentQuestion,
          userAnswer: text,
          questionIndex: state.questionIndex,
          totalQuestions: state.config.questionCount,
          codeLanguage: state.config.codeLanguage,
          codeContent: state.config.type === 'dsa' ? state.codeContent : undefined,
          generateAudio: state.config.enableAudio !== false,
          speaker: state.config.speaker || 'shubh',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'AI response failed');
      }

      const data = await response.json();

      const aiMsg: LiveMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'interviewer',
        content: data.response,
        timestamp: Date.now(),
        audioAvailable: data.audios?.length > 0,
        score: data.score,
        action: data.action,
        feedback: data.feedback,
      };

      // Check if we should move to next question
      const isNextQuestion = data.action === 'next-question';
      const newQuestionIndex = isNextQuestion ? state.questionIndex + 1 : state.questionIndex;
      const isComplete = newQuestionIndex >= state.config.questionCount;

      setState(s => ({
        ...s,
        phase: 'speaking',
        messages: [...s.messages, userMsg, aiMsg],
        questionIndex: newQuestionIndex,
        currentQuestion: isNextQuestion ? data.response : s.currentQuestion,
      }));

      // Play AI audio
      if (data.audios?.length > 0 && state.config.enableAudio !== false) {
        try {
          const player = await getPlayer();
          await player.play(data.audios, {
            onAudioLevel: (level: number) => {
              setState(s => ({ ...s, interviewerAudioLevel: level }));
            },
            onComplete: () => {
              setState(s => ({
                ...s,
                interviewerAudioLevel: 0,
                phase: isComplete
                  ? 'evaluating'
                  : state.config?.type === 'dsa'
                  ? 'code-input'
                  : 'listening',
              }));
              if (isComplete) {
                evaluateSession();
              }
            },
            onError: () => {
              setState(s => ({
                ...s,
                interviewerAudioLevel: 0,
                phase: isComplete
                  ? 'evaluating'
                  : state.config?.type === 'dsa'
                  ? 'code-input'
                  : 'listening',
              }));
              if (isComplete) {
                evaluateSession();
              }
            },
          });
        } catch {
          setState(s => ({
            ...s,
            phase: isComplete
              ? 'evaluating'
              : state.config?.type === 'dsa'
              ? 'code-input'
              : 'listening',
          }));
          if (isComplete) evaluateSession();
        }
      } else {
        // No audio, transition after brief pause
        setTimeout(() => {
          setState(s => ({
            ...s,
            phase: isComplete
              ? 'evaluating'
              : state.config?.type === 'dsa'
              ? 'code-input'
              : 'listening',
          }));
          if (isComplete) evaluateSession();
        }, 1500);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('[LiveInterview] Response error:', error);
      toast.error('AI response failed', { description: error.message });
      setState(s => ({
        ...s,
        phase: state.config?.type === 'dsa' ? 'code-input' : 'listening',
        error: error.message,
      }));
    }
  }, [state.sessionId, state.config, state.messages, state.currentQuestion, state.questionIndex, state.codeContent, getPlayer]);

  // Keep ref in sync so startListening's onTranscript always calls latest version
  submitTranscriptRef.current = submitTranscript;

  // ─── SUBMIT TEXT ANSWER (keyboard input) ──────────────────────────────

  const submitTextAnswer = useCallback((text: string) => {
    submitTranscript(text);
  }, [submitTranscript]);

  // ─── SUBMIT CODE (DSA) ────────────────────────────────────────────────

  const submitCode = useCallback((code: string) => {
    setState(s => ({ ...s, codeContent: code }));
    submitTranscript(`Here's my code solution:\n\n${code}\n\nLet me explain my approach.`);
  }, [submitTranscript]);

  // ─── UPDATE CODE ──────────────────────────────────────────────────────

  const updateCode = useCallback((code: string) => {
    setState(s => ({ ...s, codeContent: code }));
  }, []);

  // ─── EVALUATE SESSION ─────────────────────────────────────────────────

  const evaluateSession = useCallback(async () => {
    setState(s => ({ ...s, phase: 'evaluating', isLoading: true }));

    try {
      const response = await fetch('/api/live-interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          interviewType: state.config?.type,
          difficulty: state.config?.difficulty,
          conversationHistory: state.messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          totalDurationMs: state.startedAt ? Date.now() - state.startedAt : 0,
          questionsAsked: state.questionIndex + 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate');
      }

      const evaluation = await response.json();

      setState(s => ({
        ...s,
        phase: 'completed',
        evaluation,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('[LiveInterview] Evaluation error:', error);
      setState(s => ({
        ...s,
        phase: 'completed',
        evaluation: {
          overallScore: 0,
          verdict: 'error',
          summary: 'Evaluation could not be completed.',
          categoryScores: {},
          strengths: [],
          areasForImprovement: [],
          detailedFeedback: error.message,
          recommendedTopics: [],
          interviewTips: [],
        },
        isLoading: false,
      }));
    }
  }, [state.sessionId, state.config, state.messages, state.questionIndex, state.startedAt]);

  // ─── END SESSION ──────────────────────────────────────────────────────

  const endSession = useCallback(async () => {
    // Stop any recording/playback
    recorderRef.current?.cancel?.();
    playerRef.current?.stop?.();
    abortRef.current?.abort();

    await evaluateSession();
  }, [evaluateSession]);

  // ─── SKIP TO TEXT ─────────────────────────────────────────────────────
  // Allow user to type instead of speak (fallback)

  const skipAudioGreeting = useCallback(() => {
    playerRef.current?.stop?.();
    setState(s => ({
      ...s,
      phase: state.config?.type === 'dsa' ? 'code-input' : 'listening',
      interviewerAudioLevel: 0,
    }));
  }, [state.config?.type]);

  // ─── RESET ────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    recorderRef.current?.cancel?.();
    playerRef.current?.stop?.();
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  return {
    // State
    phase: state.phase,
    sessionId: state.sessionId,
    config: state.config,
    messages: state.messages,
    currentQuestion: state.currentQuestion,
    questionIndex: state.questionIndex,
    audioLevel: state.audioLevel,
    interviewerAudioLevel: state.interviewerAudioLevel,
    transcript: state.transcript,
    isMicActive: state.isMicActive,
    evaluation: state.evaluation,
    error: state.error,
    isLoading: state.isLoading,
    startedAt: state.startedAt,
    codeContent: state.codeContent,
    codeTemplate: state.codeTemplate,
    hints: state.hints,
    examples: state.examples,
    constraints: state.constraints,
    expectedComplexity: state.expectedComplexity,
    questionCategory: state.questionCategory,

    // Actions
    startSession,
    startListening,
    stopListening,
    toggleMic,
    submitTextAnswer,
    submitCode,
    updateCode,
    endSession,
    skipAudioGreeting,
    reset,
  };
}
