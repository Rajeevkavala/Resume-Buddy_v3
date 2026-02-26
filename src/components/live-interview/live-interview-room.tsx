'use client';

/**
 * Live Interview Room
 * 
 * Main container component that orchestrates the entire live interview experience.
 * Renders different views based on the current phase from useLiveInterview.
 */

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Radio, Timer, HelpCircle, Brain, Code2, Users, Server } from 'lucide-react';

import { useLiveInterview } from '@/hooks/use-live-interview';
import type { LiveConfig } from '@/hooks/use-live-interview';
import { LiveConfigPanel } from './live-config-panel';
import { LiveAudioVisualizer } from './live-audio-visualizer';
import { LiveTranscript } from './live-transcript';
import { LiveCodeEditor } from './live-code-editor';
import { LiveControls } from './live-controls';
import { LiveEvaluationView } from './live-evaluation-view';
import type { InterviewSessionType } from '@/lib/types/interview';

interface LiveInterviewRoomProps {
  userId: string;
  resumeText?: string;
  jobDescription?: string;
}

const TYPE_ICONS: Record<InterviewSessionType, React.ReactNode> = {
  dsa: <Code2 className="h-4 w-4" />,
  behavioral: <Users className="h-4 w-4" />,
  technical: <Brain className="h-4 w-4" />,
  'system-design': <Server className="h-4 w-4" />,
};

const TYPE_LABELS: Record<InterviewSessionType, string> = {
  dsa: 'DSA / Coding',
  behavioral: 'Behavioral',
  technical: 'Technical',
  'system-design': 'System Design',
};

export function LiveInterviewRoom({ userId, resumeText, jobDescription }: LiveInterviewRoomProps) {
  const live = useLiveInterview(userId);

  // BUG-008 fix: live timer that updates every second
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!live.startedAt || live.phase === 'setup' || live.phase === 'completed') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [live.startedAt, live.phase]);

  const elapsedTime = useMemo(() => {
    if (!live.startedAt) return '00:00';
    const diff = now - live.startedAt;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [live.startedAt, now]);

  const handleStart = (config: LiveConfig) => {
    live.startSession(config);
  };

  // ─── SETUP PHASE ────────────────────────────────────────────────────

  if (live.phase === 'setup') {
    return (
      <LiveConfigPanel
        onStart={handleStart}
        isLoading={live.isLoading}
        resumeText={resumeText}
        jobDescription={jobDescription}
      />
    );
  }

  // ─── CONNECTING PHASE ───────────────────────────────────────────────

  if (live.phase === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-headline font-bold">Setting Up Interview</h2>
          <p className="text-sm text-muted-foreground">
            Preparing your {live.config ? TYPE_LABELS[live.config.type] : ''} interview...
          </p>
        </div>
      </div>
    );
  }

  // ─── COMPLETED / EVALUATION PHASE ──────────────────────────────────

  if (live.phase === 'completed' && live.evaluation) {
    return (
      <LiveEvaluationView
        evaluation={live.evaluation}
        interviewType={live.config?.type || 'technical'}
        duration={live.startedAt ? Date.now() - live.startedAt : 0}
        questionsAnswered={live.questionIndex + 1}
        totalQuestions={live.config?.questionCount || 5}
        onRestart={live.reset}
      />
    );
  }

  // ─── EVALUATING ─────────────────────────────────────────────────────

  if (live.phase === 'evaluating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-headline font-bold">Evaluating Performance</h2>
          <p className="text-sm text-muted-foreground">
            Analyzing your answers and generating detailed feedback...
          </p>
        </div>
      </div>
    );
  }

  // ─── ACTIVE INTERVIEW ──────────────────────────────────────────────

  const isDSA = live.config?.type === 'dsa';

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[520px] max-h-[860px] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            <span className="text-sm font-medium">Live Interview</span>
          </div>
          {live.config && (
            <Badge variant="secondary" className="text-xs gap-1">
              {TYPE_ICONS[live.config.type]}
              {TYPE_LABELS[live.config.type]}
            </Badge>
          )}
          {live.config && (
            <Badge variant="outline" className="text-xs capitalize">
              {live.config.difficulty}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-mono gap-1">
            <Timer className="h-3 w-3" />
            {elapsedTime}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <HelpCircle className="h-3 w-3" />
            Q{live.questionIndex + 1}/{live.config?.questionCount || 0}
          </Badge>
        </div>
      </div>

      {/* Main Content fills remaining height */}
      <div className={`flex-1 flex min-h-0 ${isDSA ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        {/* Conversation / Visualizer Panel */}
        <div className={`flex flex-col min-h-0 overflow-hidden ${isDSA ? 'w-1/2 border-r border-border/40' : 'flex-1'}`}>
          {/* Audio Visualizer */}
          <div className="flex justify-center py-3 border-b border-border/30 shrink-0">
            <LiveAudioVisualizer
              phase={live.phase}
              audioLevel={live.audioLevel}
              interviewerAudioLevel={live.interviewerAudioLevel}
            />
          </div>

          {/* Current Question */}
          {live.currentQuestion && (
            <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 shrink-0">
              <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-0.5">Current Question</p>
              <p className="text-sm text-foreground/90 leading-snug line-clamp-2">{live.currentQuestion}</p>
            </div>
          )}

          {/* Transcript — flex-1 scroll */}
          <LiveTranscript
            messages={live.messages}
            interimTranscript={live.transcript}
            className="flex-1 min-h-0"
          />
        </div>

        {/* Code Editor (DSA only) */}
        {isDSA && (
          <div className="w-1/2 flex flex-col overflow-hidden min-h-0 p-3">
            <LiveCodeEditor
              code={live.codeContent}
              codeTemplate={live.codeTemplate}
              onChange={live.updateCode}
              onSubmit={live.submitCode}
              language={live.config?.codeLanguage}
              hints={live.hints}
              examples={live.examples}
              constraints={live.constraints}
              expectedComplexity={live.expectedComplexity}
              questionCategory={live.questionCategory}
              disabled={live.phase === 'processing' || live.phase === 'thinking' || live.phase === 'speaking'}
            />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <LiveControls
        phase={live.phase}
        isMicActive={live.isMicActive}
        audioLevel={live.audioLevel}
        onToggleMic={live.toggleMic}
        onSubmitText={live.submitTextAnswer}
        onEndSession={live.endSession}
        onSkipGreeting={live.skipAudioGreeting}
        onSkipToNextQuestion={live.skipToNextQuestion}
        audioEnabled={live.config?.enableAudio}
      />
    </div>
  );
}
