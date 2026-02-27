'use client';

/**
 * useLiveInterview Hook — V2 (Real-Time, Zero-Latency)
 *
 * Key improvements over V1:
 *  1. Uses browser-native Web Speech API for STT — zero network latency,
 *     real-time interim transcripts displayed instantly.
 *  2. Conversation buffering — user speech accumulates continuously;
 *     sent to JLM ONLY when user explicitly stops (click mic / auto-silence).
 *     No per-word / per-sentence LLM calls.
 *  3. Full conversation stored in state; evaluation happens ONCE at the end.
 *  4. Browser TTS (speechSynthesis) as default for instant playback;
 *     Sarvam TTS available as optional high-quality mode.
 *  5. All callbacks use refs to avoid stale-closure bugs.
 *
 * Pipeline per turn:
 *  1. User speaks → Web Speech API → real-time interim transcript (instant)
 *  2. User stops / clicks submit → full turn text collected
 *  3. Turn text + context → /api/live-interview/respond → AI response
 *  4. AI response → Browser TTS (instant) or Sarvam TTS (optional)
 *  5. Repeat until session ends → /api/live-interview/evaluate (once)
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
  | 'setup'
  | 'connecting'
  | 'greeting'
  | 'listening'
  | 'processing'
  | 'thinking'
  | 'speaking'
  | 'code-input'
  | 'evaluating'
  | 'completed';

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
  /** Use Sarvam TTS instead of browser TTS (higher quality but slower) */
  useSarvamTTS?: boolean;
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
  audioLevel: number;
  interviewerAudioLevel: number;
  transcript: string;          // Accumulated final transcript for current turn
  interimText: string;         // Interim (partial) recognition text — live
  isMicActive: boolean;
  evaluation: LiveEvaluation | null;
  error: string | null;
  isLoading: boolean;
  startedAt: number | null;
  codeContent: string;
  codeTemplate: string;
  hints: string[];
  examples: any[];
  constraints: string[];
  expectedComplexity: any;
  questionCategory: string;
  currentQuestionStartedAt: number | null;
  turnsOnCurrentQuestion: number;
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
  interimText: '',
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
  currentQuestionStartedAt: null,
  turnsOnCurrentQuestion: 0,
};

// ─── Browser TTS Helpers ──────────────────────────────────────────────────────

function browserSpeak(text: string, onEnd?: () => void, onError?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let idx = 0;

  const speakNext = () => {
    if (idx >= sentences.length) { onEnd?.(); return; }
    const utt = new SpeechSynthesisUtterance(sentences[idx].trim());
    utt.rate = 1.05;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft David') ||
      v.name.includes('Samantha')
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;

    utt.onend = () => { idx++; speakNext(); };
    utt.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') onEnd?.();
      else { console.warn('[BrowserTTS] error:', e.error); onError?.(); }
    };
    window.speechSynthesis.speak(utt);
  };
  speakNext();
}

function stopBrowserSpeak() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveInterview(userId: string) {
  const [state, setState] = useState<LiveState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  // Web Speech API recognition
  const recognitionRef = useRef<any>(null);
  // Accumulated final transcript within one listening turn
  const accumulatedRef = useRef('');
  // Silence auto-submit timer
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SILENCE_MS = 4000; // 4s silence → auto-submit
  // BUG-003 fix: guard against double submission
  const submittedRef = useRef(false);
  // BUG-004 fix: retry counter for auto-start listening
  const listenRetryRef = useRef(0);
  const MAX_LISTEN_RETRIES = 3;

  // Always-fresh state ref (avoids stale closures in callbacks)
  const stateRef = useRef(state);
  stateRef.current = state;

  // Sarvam player (lazy)
  const sarvamPlayerRef = useRef<any>(null);

  // ─── Cleanup ──────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      try { recognitionRef.current?.abort?.(); } catch { /* ignore */ }
      stopBrowserSpeak();
      sarvamPlayerRef.current?.destroy?.();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // ─── Get / create Web Speech API recognition ─────────────────────────

  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    recognitionRef.current = r;
    return r;
  }, []);

  // ─── submitAnswer — single LLM call per turn ─────────────────────────

  const submitAnswer = useCallback(async (text: string) => {
    const s = stateRef.current;
    if (!text.trim() || !s.config) return;
    // Prevent double-submit
    if (s.phase === 'thinking' || s.phase === 'speaking' || s.phase === 'evaluating') return;

    const userMsg: LiveMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'candidate',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...s.messages, userMsg];

    setState(prev => ({
      ...prev,
      phase: 'thinking',
      messages: updatedMessages,
      transcript: '',
      interimText: '',
      audioLevel: 0,
      turnsOnCurrentQuestion: prev.turnsOnCurrentQuestion + 1,
    }));

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/live-interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: s.sessionId,
          interviewType: s.config.type,
          difficulty: s.config.difficulty,
          conversationHistory: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          currentQuestion: s.currentQuestion,
          userAnswer: text,
          questionIndex: s.questionIndex,
          totalQuestions: s.config.questionCount,
          codeLanguage: s.config.codeLanguage,
          codeContent: s.config.type === 'dsa' ? s.codeContent : undefined,
          generateAudio: !!s.config.useSarvamTTS,
          speaker: s.config.speaker || 'shubh',
          currentQuestionStartedAt: s.currentQuestionStartedAt,
          turnsOnCurrentQuestion: s.turnsOnCurrentQuestion,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.dailyLimitExceeded
          ? `Daily credits exhausted! ${err.error || 'Upgrade to Pro for more credits.'}`
          : err.error || 'AI response failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const aiMsg: LiveMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'interviewer',
        content: data.response,
        timestamp: Date.now(),
        score: data.score,
        action: data.action,
        feedback: data.feedback,
      };

      const isNextQuestion = data.action === 'next-question';
      const newQuestionIndex = isNextQuestion ? s.questionIndex + 1 : s.questionIndex;
      const isComplete = newQuestionIndex >= s.config.questionCount;

      setState(prev => ({
        ...prev,
        phase: 'speaking',
        messages: [...updatedMessages, aiMsg],
        questionIndex: newQuestionIndex,
        currentQuestion: isNextQuestion ? data.response : prev.currentQuestion,
        currentQuestionStartedAt: isNextQuestion ? Date.now() : prev.currentQuestionStartedAt,
        turnsOnCurrentQuestion: isNextQuestion ? 0 : prev.turnsOnCurrentQuestion,
      }));

      // ─── Speak AI response ──────────────────────────────────────
      // BUG-002 fix: pass complete messages to doEvaluate
      const completeMessages = [...updatedMessages, aiMsg];
      const afterSpeak = () => {
        if (isComplete) {
          doEvaluate(completeMessages);
        } else {
          setState(prev => ({
            ...prev,
            phase: prev.config?.type === 'dsa' ? 'code-input' : 'listening',
            interviewerAudioLevel: 0,
          }));
        }
      };

      const cfg = s.config;
      if (cfg.useSarvamTTS && data.audios?.length > 0) {
        try {
          if (!sarvamPlayerRef.current) {
            const { getSarvamPlayer } = await import('@/lib/speech/sarvam-player');
            sarvamPlayerRef.current = getSarvamPlayer();
          }
          await sarvamPlayerRef.current.play(data.audios, {
            onAudioLevel: (level: number) => setState(p => ({ ...p, interviewerAudioLevel: level })),
            onComplete: afterSpeak,
            onError: () => afterSpeak(),
          });
        } catch {
          browserSpeak(data.response, afterSpeak, afterSpeak);
        }
      } else {
        browserSpeak(data.response, afterSpeak, afterSpeak);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('[LiveInterview] Response error:', error);
      
      const isDailyLimit = error.message?.includes('Daily credits exhausted') || error.message?.includes('Daily limit reached');
      
      toast.error(
        isDailyLimit ? 'Daily Credits Exhausted' : 'AI response failed',
        { 
          description: error.message,
          duration: isDailyLimit ? 6000 : 4000,
        }
      );
      
      setState(prev => ({
        ...prev,
        phase: prev.config?.type === 'dsa' ? 'code-input' : 'listening',
        error: error.message,
      }));
    }
  }, []); // no deps — uses stateRef for always-fresh state

  // ─── Evaluate session (called once at end) ────────────────────────────
  // BUG-002 fix: accept finalMessages param to avoid stale closure
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

      if (!response.ok) throw new Error('Failed to evaluate');
      const evaluation = await response.json();

      setState(p => ({ ...p, phase: 'completed', evaluation, isLoading: false }));
    } catch (error: any) {
      console.error('[LiveInterview] Evaluation error:', error);
      setState(p => ({
        ...p,
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
  }, []);

  // ─── Start listening (Web Speech API — zero latency) ──────────────────

  const startListening = useCallback(() => {
    const recognition = getRecognition();
    if (!recognition) {
      toast.error('Speech recognition not available', {
        description: 'Please use Chrome or Edge, or type your answer.',
      });
      return;
    }

    accumulatedRef.current = '';
    submittedRef.current = false; // BUG-003 fix: reset guard
    setState(s => ({ ...s, transcript: '', interimText: '', isMicActive: true }));

    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = accumulatedRef.current.trim();
        if (text.length > 0) {
          try { recognition.stop(); } catch { /* already stopped */ }
        }
      }, SILENCE_MS);
    };

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interim += r[0].transcript;
      }

      if (finalChunk) {
        accumulatedRef.current += (accumulatedRef.current ? ' ' : '') + finalChunk.trim();
        setState(s => ({ ...s, transcript: accumulatedRef.current, interimText: '' }));
      }
      if (interim) {
        setState(s => ({ ...s, interimText: interim }));
      }

      resetSilenceTimer();
      // Simulate audio level
      setState(s => ({ ...s, audioLevel: interim ? 0.5 + Math.random() * 0.5 : 0.15 }));
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setState(s => ({ ...s, isMicActive: false, audioLevel: 0 }));
        return;
      }
      console.error('[WebSpeechAPI] Error:', event.error);
      toast.error('Speech recognition error', { description: event.error });
      setState(s => ({ ...s, isMicActive: false, audioLevel: 0 }));
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setState(s => ({ ...s, isMicActive: false, audioLevel: 0, interimText: '' }));
      const text = accumulatedRef.current.trim();
      // BUG-003 fix: guard against double submission from continuous mode race
      if (text.length > 0 && !submittedRef.current) {
        submittedRef.current = true;
        submitAnswer(text);
      }
    };

    recognition.onspeechend = () => {
      setState(s => ({ ...s, audioLevel: 0.1 }));
    };

    try {
      recognition.start();
      resetSilenceTimer();
    } catch {
      try { recognition.stop(); } catch { /* ignore */ }
      setTimeout(() => {
        try { recognition.start(); resetSilenceTimer(); } catch { /* ignore */ }
      }, 200);
    }
  }, [getRecognition, submitAnswer]);

  // ─── Stop listening ───────────────────────────────────────────────────

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
    setState(s => ({ ...s, isMicActive: false, audioLevel: 0 }));
  }, []);

  // ─── Toggle mic ───────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    if (stateRef.current.isMicActive) {
      stopListening(); // triggers onend → submitAnswer
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // ─── Auto-start listening when phase becomes 'listening' ──────────────

  // BUG-004 fix: add retry counter to prevent infinite loop on mic failure
  useEffect(() => {
    if (state.phase === 'listening' && !state.isMicActive) {
      if (listenRetryRef.current >= MAX_LISTEN_RETRIES) {
        toast.error('Microphone unavailable', {
          description: 'Could not access microphone. Use text input instead.',
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

  // ─── START SESSION ────────────────────────────────────────────────────

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
          generateAudio: !!config.useSarvamTTS,
          speaker: config.speaker || 'shubh',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.dailyLimitExceeded 
          ? `Daily credits exhausted! ${err.error || 'Upgrade to Pro for more credits.'}`
          : err.error || 'Failed to start session';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const greetingMsg: LiveMessage = {
        id: `msg_${Date.now()}_greeting`,
        role: 'interviewer',
        content: `${data.greeting} ${data.firstQuestion}`,
        timestamp: Date.now(),
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

      const spokenText = `${data.greeting} ${data.firstQuestion}`;

      const transitionToListening = () => {
        setState(s => ({
          ...s,
          phase: s.config?.type === 'dsa' ? 'code-input' : 'listening',
          interviewerAudioLevel: 0,
          currentQuestionStartedAt: Date.now(),
          turnsOnCurrentQuestion: 0,
        }));
      };

      if (config.useSarvamTTS && data.audios?.length > 0) {
        try {
          const { getSarvamPlayer } = await import('@/lib/speech/sarvam-player');
          sarvamPlayerRef.current = getSarvamPlayer();
          await sarvamPlayerRef.current.play(data.audios, {
            onAudioLevel: (level: number) => setState(s => ({ ...s, interviewerAudioLevel: level })),
            onComplete: transitionToListening,
            onError: () => transitionToListening(),
          });
        } catch {
          browserSpeak(spokenText, transitionToListening, transitionToListening);
        }
      } else {
        browserSpeak(spokenText, transitionToListening, transitionToListening);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('[LiveInterview] Start error:', error);
      
      const isDailyLimit = error.message?.includes('Daily credits exhausted') || error.message?.includes('Daily limit reached');
      
      toast.error(
        isDailyLimit ? 'Daily Credits Exhausted' : 'Failed to start interview',
        { 
          description: error.message,
          duration: isDailyLimit ? 6000 : 4000,
        }
      );
      
      setState(s => ({ ...s, phase: 'setup', error: error.message, isLoading: false }));
    }
  }, [userId]);

  // ─── Submit text answer (keyboard input) ──────────────────────────────

  const submitTextAnswer = useCallback((text: string) => {
    try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    accumulatedRef.current = '';
    submitAnswer(text);
  }, [submitAnswer]);

  // ─── Submit code (DSA) ────────────────────────────────────────────────

  const submitCode = useCallback((code: string) => {
    setState(s => ({ ...s, codeContent: code }));
    submitAnswer(`Here's my code solution:\n\n${code}\n\nLet me explain my approach.`);
  }, [submitAnswer]);

  // ─── Update code ──────────────────────────────────────────────────────

  const updateCode = useCallback((code: string) => {
    setState(s => ({ ...s, codeContent: code }));
  }, []);

  // ─── End session ──────────────────────────────────────────────────────

  const endSession = useCallback(async () => {
    try { recognitionRef.current?.abort?.(); } catch { /* ignore */ }
    stopBrowserSpeak();
    sarvamPlayerRef.current?.stop?.();
    abortRef.current?.abort();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    await doEvaluate();
  }, [doEvaluate]);

  // ─── Skip greeting ───────────────────────────────────────────────────

  const skipAudioGreeting = useCallback(() => {
    stopBrowserSpeak();
    sarvamPlayerRef.current?.stop?.();
    setState(s => ({
      ...s,
      phase: s.config?.type === 'dsa' ? 'code-input' : 'listening',
      interviewerAudioLevel: 0,
    }));
  }, []);

  // ─── Skip to next question ───────────────────────────────────────────

  const skipToNextQuestion = useCallback(() => {
    const s = stateRef.current;
    if (!s.config || s.phase === 'evaluating' || s.phase === 'completed') return;
    
    const nextIndex = s.questionIndex + 1;
    if (nextIndex >= s.config.questionCount) {
      // Last question - go to evaluation
      doEvaluate();
      return;
    }

    // Force move to next question
    const skipMsg: LiveMessage = {
      id: `msg_${Date.now()}_skip`,
      role: 'interviewer',
      content: "Let's move on to the next question.",
      timestamp: Date.now(),
      action: 'next-question',
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, skipMsg],
      questionIndex: nextIndex,
      currentQuestion: "Next question (generating...)",
      phase: prev.config?.type === 'dsa' ? 'code-input' : 'listening',
      currentQuestionStartedAt: Date.now(),
      turnsOnCurrentQuestion: 0,
    }));

    toast.success('Moved to next question');
  }, [doEvaluate]);

  // ─── Reset ────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    try { recognitionRef.current?.abort?.(); } catch { /* ignore */ }
    stopBrowserSpeak();
    sarvamPlayerRef.current?.stop?.();
    abortRef.current?.abort();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    accumulatedRef.current = '';
    recognitionRef.current = null;
    setState(initialState);
  }, []);

  // ─── Combined transcript for display ──────────────────────────────────

  const displayTranscript = state.transcript + (state.interimText ? ' ' + state.interimText : '');

  return {
    phase: state.phase,
    sessionId: state.sessionId,
    config: state.config,
    messages: state.messages,
    currentQuestion: state.currentQuestion,
    questionIndex: state.questionIndex,
    audioLevel: state.audioLevel,
    interviewerAudioLevel: state.interviewerAudioLevel,
    transcript: displayTranscript,
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
    currentQuestionStartedAt: state.currentQuestionStartedAt,
    turnsOnCurrentQuestion: state.turnsOnCurrentQuestion,

    startSession,
    startListening,
    stopListening,
    toggleMic,
    submitTextAnswer,
    submitCode,
    updateCode,
    endSession,
    skipAudioGreeting,
    skipToNextQuestion,
    reset,
  };
}
