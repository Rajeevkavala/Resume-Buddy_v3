'use client';

/**
 * Active Interview View
 * 
 * Main interaction area during a live AI interview session.
 * Shows current question, answer input, evaluation feedback,
 * and session progress in a responsive layout.
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronRight,
  SkipForward,
  StopCircle,
  Lightbulb,
  Hash,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { AnswerChatbox } from './answer-chatbox';
import { AudioVisualizer } from './audio-visualizer';
import { CodeEditor } from './code-editor';
import { ExplainApproach } from './explain-approach';
import { EvaluationFeedback } from './evaluation-feedback';
import { SessionTimer } from './session-timer';
import type {
  InterviewQuestion,
  InterviewAnswer,
  AnswerEvaluation,
  CodeLanguage,
  InterviewSessionType,
  AnswerFormat,
} from '@/lib/types/interview';
import type { SessionPhase } from '@/hooks/use-interview-session';

interface ActiveInterviewViewProps {
  phase: SessionPhase;
  sessionType: InterviewSessionType;
  answerFormat?: AnswerFormat;    // User-selected answer format
  currentQuestion: InterviewQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: InterviewAnswer[];
  currentEvaluation: AnswerEvaluation | null;
  voiceExplanation: string | null;
  isLoading: boolean;
  codeLanguage: CodeLanguage;
  useVoice: boolean;
  // Actions
  onSubmitAnswer: (answer: string) => void;
  onSubmitCode: (code: string, language: CodeLanguage) => void;
  onSetVoiceExplanation: (transcript: string) => void;
  onNextQuestion: () => void;
  onSkipQuestion: () => void;
  onEndSession: () => void;
}

export function ActiveInterviewView({
  phase,
  sessionType,
  answerFormat = 'text',
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  answers,
  currentEvaluation,
  voiceExplanation,
  isLoading,
  codeLanguage: initialCodeLanguage,
  useVoice,
  onSubmitAnswer,
  onSubmitCode,
  onSetVoiceExplanation,
  onNextQuestion,
  onSkipQuestion,
  onEndSession,
}: ActiveInterviewViewProps) {
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>(initialCodeLanguage);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHints, setShowHints] = useState(false);
  const progressPercent = totalQuestions > 0
    ? Math.round(((currentQuestionIndex + (phase === 'review' ? 1 : 0)) / totalQuestions) * 100)
    : 0;

  const isDSA = sessionType === 'dsa';
  const shouldShowMCQ = !isDSA && answerFormat === 'mcq' && currentQuestion?.options && currentQuestion.options.length > 0;
  const shouldShowVoiceRecorder = !isDSA && answerFormat === 'voice';
  const isEvaluating = phase === 'evaluating';
  const isReview = phase === 'review';

  // Reset selected option when question changes
  const questionKey = `${currentQuestionIndex}`;
  const prevQuestionKeyRef = useRef(questionKey);
  if (prevQuestionKeyRef.current !== questionKey) {
    prevQuestionKeyRef.current = questionKey;
    setSelectedOption(null);
    setShowHints(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <SessionTimer isRunning={phase === 'active' || phase === 'evaluating'} />
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Voice Visualizer */}
        {useVoice && <AudioVisualizer isVisible={phase === 'active'} />}

        {/* Question Card */}
        {currentQuestion && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  <Hash className="h-3 w-3 mr-1" />
                  {currentQuestionIndex + 1}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.category}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {currentQuestion.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {currentQuestion.question}
              </p>

              {/* DSA: Examples & Constraints */}
              {isDSA && (currentQuestion as any).examples && (
                <div className="text-sm space-y-2 p-3 rounded-lg bg-muted/30 border border-border/60">
                  <p className="font-medium">Examples:</p>
                  {((currentQuestion as any).examples as any[]).map((ex: any, i: number) => (
                    <div key={i} className="font-mono text-xs space-y-0.5">
                      <p>Input: {ex.input}</p>
                      <p>Output: {ex.output}</p>
                      {ex.explanation && (
                        <p className="text-muted-foreground">// {ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Hints */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => setShowHints(!showHints)}
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {showHints ? 'Hide' : 'Show'} Hints ({currentQuestion.hints.length})
                  </Button>
                  {showHints && (
                    <ul className="mt-2 space-y-1 pl-4">
                      {currentQuestion.hints.map((hint, i) => (
                        <li key={i} className="text-sm text-muted-foreground list-disc">
                          {hint}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Answer Area */}
        {!isReview && currentQuestion && (
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              {/* DSA: Explain Approach + Code Editor */}
              {isDSA ? (
                <>
                  {!voiceExplanation && (
                    <ExplainApproach
                      onExplanationComplete={onSetVoiceExplanation}
                      disabled={isEvaluating}
                    />
                  )}
                  {voiceExplanation && (
                    <div className="p-3 rounded-lg bg-green-600/5 border border-green-600/15">
                      <p className="text-xs font-medium text-green-700 mb-1">Your Explanation (recorded)</p>
                      <p className="text-sm text-foreground/80 line-clamp-3">{voiceExplanation}</p>
                    </div>
                  )}
                  <CodeEditor
                    initialCode={currentQuestion.codeTemplate || ''}
                    language={codeLanguage}
                    onLanguageChange={setCodeLanguage}
                    onSubmit={(code) => onSubmitCode(code, codeLanguage)}
                    disabled={isEvaluating}
                    isEvaluating={isEvaluating}
                  />
                </>
              ) : shouldShowMCQ ? (
                /* MCQ Options for behavioral/technical */
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Choose the best answer:</p>
                  <div className="space-y-2">
                    {currentQuestion.options!.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !isEvaluating && setSelectedOption(idx)}
                        disabled={isEvaluating}
                        className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                          selectedOption === idx
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                        } ${isEvaluating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-medium ${
                            selectedOption === idx
                              ? 'border-primary bg-primary text-white'
                              : 'border-muted-foreground/40 text-muted-foreground'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="flex-1">{option}</span>
                          {selectedOption === idx && (
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-2"
                    disabled={selectedOption === null || isEvaluating}
                    onClick={() => {
                      if (selectedOption !== null && currentQuestion.options) {
                        onSubmitAnswer(currentQuestion.options[selectedOption]);
                      }
                    }}
                  >
                    {isEvaluating ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Evaluating...</>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                </div>
              ) : (
                /* Text or Voice Answer - AnswerChatbox handles both */
                <AnswerChatbox
                  onSubmit={onSubmitAnswer}
                  disabled={isEvaluating}
                  isEvaluating={isEvaluating}
                  enableVoice={shouldShowVoiceRecorder}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Evaluation Feedback */}
        {isReview && currentEvaluation && (
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <EvaluationFeedback evaluation={currentEvaluation} />
            </CardContent>
          </Card>
        )}

        {/* Evaluating Spinner */}
        {isEvaluating && (
          <div className="flex items-center justify-center gap-3 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">AI is evaluating your answer...</span>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Session Actions */}
        <Card className="border-border/60">
          <CardContent className="pt-6 space-y-3">
            {isReview ? (
              <Button className="w-full gap-2" onClick={onNextQuestion}>
                {currentQuestionIndex + 1 >= totalQuestions ? (
                  <>View Results</>
                ) : (
                  <>
                    Next Question
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={onSkipQuestion}
                disabled={isEvaluating}
              >
                <SkipForward className="h-4 w-4" />
                Skip Question
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onEndSession}
            >
              <StopCircle className="h-4 w-4" />
              End Session
            </Button>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-3">Questions</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const answer = answers.find((a) => a.questionIndex === i);
                const isCurrent = i === currentQuestionIndex;
                let bgClass = 'bg-muted text-muted-foreground'; // pending

                if (answer?.evaluation?.isCorrect) bgClass = 'bg-green-600 text-white';
                else if (answer) bgClass = 'bg-destructive text-white';
                if (isCurrent) bgClass += ' ring-2 ring-primary ring-offset-2';

                return (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded flex items-center justify-center text-xs font-accent font-medium ${bgClass}`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Answer Stats */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-2">Progress</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Answered</span>
                <span className="font-accent">{answers.length}/{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correct</span>
                <span className="font-accent text-green-600">
                  {answers.filter((a) => a.evaluation?.isCorrect).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Score</span>
                <span className="font-accent">
                  {answers.length > 0
                    ? Math.round(
                        answers.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0) /
                          answers.length
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
