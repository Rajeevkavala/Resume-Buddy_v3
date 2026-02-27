'use client';

/**
 * Live Interview Room
 * 
 * Main container component that orchestrates the entire live interview experience.
 * Renders different views based on the current phase from useLiveInterview.
 * Requires Pro subscription to access.
 */

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Radio, Timer, HelpCircle, Brain, Code2, Users, Server, Lock, Sparkles, Target } from 'lucide-react';

import { useLiveInterview } from '@/hooks/use-live-interview';
import type { LiveConfig } from '@/hooks/use-live-interview';
import { LiveConfigPanel } from './live-config-panel';
import { LiveAudioVisualizer } from './live-audio-visualizer';
import { LiveTranscript } from './live-transcript';
import { LiveCodeEditor } from './live-code-editor';
import { LiveControls } from './live-controls';
import { LiveEvaluationView } from './live-evaluation-view';
import type { InterviewSessionType } from '@/lib/types/interview';
import { useSubscription } from '@/context/subscription-context';
import { UpgradePrompt } from '@/components/upgrade-prompt';

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
  const { canAccessFeature, isLoading: subscriptionLoading, tier } = useSubscription();
  const live = useLiveInterview(userId);

  // Check if user has access to AI Interview feature
  const hasAccess = canAccessFeature('ai-interview');

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

  // ─── SUBSCRIPTION CHECK ────────────────────────────────────────────

  if (subscriptionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading subscription status...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
        <Card className="max-w-2xl w-full border-2">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI Interview - Pro Feature
              </CardTitle>
              <CardDescription className="text-base">
                Upgrade to Pro to access our advanced AI Interview feature with real-time voice interaction
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What you'll get with Pro:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Real-time AI Interview Practice</p>
                    <p className="text-sm text-muted-foreground">
                      Practice with our advanced AI interviewer that adapts to your responses
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Radio className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Voice-enabled Interviews</p>
                    <p className="text-sm text-muted-foreground">
                      Natural conversation flow with speech recognition and AI voice responses
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Code2 className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Live Coding Challenges</p>
                    <p className="text-sm text-muted-foreground">
                      Practice DSA problems with integrated code editor and instant feedback
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Detailed Performance Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Get comprehensive feedback on your interview performance
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            
            <UpgradePrompt 
              feature="ai-interview"
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <span className="text-sm font-medium">AI Interview</span>
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
