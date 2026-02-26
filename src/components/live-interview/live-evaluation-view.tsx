'use client';

/**
 * Live Evaluation View
 * 
 * Comprehensive results display after a live interview completes.
 * Shows scores, strengths, improvements, and actionable tips.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy, Star, TrendingUp, BookOpen, Lightbulb, RotateCcw,
  ChevronRight, CheckCircle2, AlertCircle, Target,
} from 'lucide-react';
import type { LiveEvaluation } from '@/hooks/use-live-interview';
import type { InterviewSessionType } from '@/lib/types/interview';

interface LiveEvaluationViewProps {
  evaluation: LiveEvaluation;
  interviewType: InterviewSessionType;
  duration: number;              // ms
  questionsAnswered: number;
  totalQuestions: number;
  onRestart: () => void;
}

const verdictConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'excellent': { label: 'Excellent', color: 'text-green-600 dark:text-green-400', icon: <Trophy className="h-6 w-6" /> },
  'strong': { label: 'Strong', color: 'text-blue-600 dark:text-blue-400', icon: <Star className="h-6 w-6" /> },
  'good': { label: 'Good', color: 'text-primary', icon: <CheckCircle2 className="h-6 w-6" /> },
  'average': { label: 'Average', color: 'text-amber-600 dark:text-amber-400', icon: <Target className="h-6 w-6" /> },
  'needs-improvement': { label: 'Needs Work', color: 'text-red-600 dark:text-red-400', icon: <AlertCircle className="h-6 w-6" /> },
  'error': { label: 'Error', color: 'text-muted-foreground', icon: <AlertCircle className="h-6 w-6" /> },
};

function getVerdict(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'needs-improvement';
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function LiveEvaluationView({
  evaluation,
  interviewType,
  duration,
  questionsAnswered,
  totalQuestions,
  onRestart,
}: LiveEvaluationViewProps) {
  const verdictKey = evaluation.verdict || getVerdict(evaluation.overallScore);
  const verdict = verdictConfig[verdictKey] || verdictConfig['average'];

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Hero Score Card */}
      <Card className="border-border/60 overflow-hidden">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
          
          <CardContent className="relative pt-8 pb-6 text-center space-y-4">
            {/* Verdict Badge */}
            <div className={`inline-flex items-center gap-2 ${verdict.color}`}>
              {verdict.icon}
              <span className="text-lg font-headline font-bold">{verdict.label}</span>
            </div>

            {/* Score */}
            <div className="space-y-2">
              <span className={`text-6xl font-headline font-black tracking-tighter ${getScoreColor(evaluation.overallScore)}`}>
                {evaluation.overallScore}
              </span>
              <span className="text-2xl text-muted-foreground font-light">/100</span>
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {evaluation.summary}
            </p>

            {/* Quick Stats */}
            <div className="flex justify-center gap-6 pt-2">
              <div className="text-center">
                <p className="text-lg font-bold">{questionsAnswered}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="w-px h-10 bg-border/60" />
              <div className="text-center">
                <p className="text-lg font-bold">{formatDuration(duration)}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <div className="w-px h-10 bg-border/60" />
              <div className="text-center">
                <p className="text-lg font-bold capitalize">{interviewType.replace('-', ' ')}</p>
                <p className="text-xs text-muted-foreground">Type</p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Category Scores */}
      {Object.keys(evaluation.categoryScores).length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-headline flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Category Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(evaluation.categoryScores).map(([cat, score]) => (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm capitalize">{cat.replace(/-/g, ' ')}</span>
                  <span className={`text-sm font-mono font-bold ${getScoreColor(score ?? 0)}`}>
                    {score ?? 'N/A'}
                  </span>
                </div>
                {score != null && (
                  <Progress value={score} className="h-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {evaluation.strengths.length > 0 && (
          <Card className="border-green-500/20 bg-green-500/3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <ChevronRight className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {evaluation.areasForImprovement.length > 0 && (
          <Card className="border-amber-500/20 bg-amber-500/3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {evaluation.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <ChevronRight className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Feedback */}
      {evaluation.detailedFeedback && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-headline flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Detailed Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {evaluation.detailedFeedback}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommended Topics */}
      {evaluation.recommendedTopics.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-headline flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Recommended Topics to Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {evaluation.recommendedTopics.map((topic, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Tips */}
      {evaluation.interviewTips.length > 0 && (
        <Card className="border-primary/20 bg-primary/3">
          <CardHeader>
            <CardTitle className="text-base font-headline flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Interview Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.interviewTips.map((tip, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3 pt-2">
        <Button onClick={onRestart} size="lg" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Start New Interview
        </Button>
      </div>
    </div>
  );
}
