'use client';

/**
 * Session Results Summary
 * 
 * Comprehensive results view shown after completing an interview session.
 * Shows score, breakdown by category, time stats, and retake option.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  SkipForward,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { InterviewQuestion, InterviewAnswer } from '@/lib/types/interview';

interface SessionResultsProps {
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  totalDurationMs: number;
  onRetake: () => void;
  onNewSession: () => void;
}

export function SessionResults({
  questions,
  answers,
  totalDurationMs,
  onRetake,
  onNewSession,
}: SessionResultsProps) {
  const stats = useMemo(() => {
    const totalScore = answers.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0);
    const avgScore = answers.length > 0 ? Math.round(totalScore / answers.length) : 0;
    const correct = answers.filter((a) => a.evaluation?.isCorrect).length;
    const skipped = questions.length - answers.length;
    const incorrect = answers.length - correct;
    const avgTimeMs =
      answers.length > 0
        ? answers.reduce((s, a) => s + a.timeSpentMs, 0) / answers.length
        : 0;

    // Category breakdown
    const categoryMap = new Map<string, { total: number; correct: number; totalScore: number }>();
    answers.forEach((a) => {
      const q = questions.find((q) => q.id === a.questionId);
      const cat = q?.category || 'General';
      const prev = categoryMap.get(cat) || { total: 0, correct: 0, totalScore: 0 };
      categoryMap.set(cat, {
        total: prev.total + 1,
        correct: prev.correct + (a.evaluation?.isCorrect ? 1 : 0),
        totalScore: prev.totalScore + (a.evaluation?.score ?? 0),
      });
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        avgScore: Math.round(data.totalScore / data.total),
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return { avgScore, correct, incorrect, skipped, avgTimeMs, categories };
  }, [questions, answers]);

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${min}m ${remSec}s`;
  };

  const scoreColor =
    stats.avgScore >= 80
      ? 'text-green-600'
      : stats.avgScore >= 60
        ? 'text-primary'
        : 'text-destructive';

  return (
    <Card className="border-border/60">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Session Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-5xl font-accent font-bold ${scoreColor}`}>
            {stats.avgScore}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Average Score</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-lg bg-green-600/5 border border-green-600/15">
            <CheckCircle2 className="h-4 w-4 text-green-600 mb-1" />
            <span className="text-lg font-accent font-bold text-green-600">{stats.correct}</span>
            <span className="text-xs text-muted-foreground">Correct</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/5 border border-destructive/15">
            <XCircle className="h-4 w-4 text-destructive mb-1" />
            <span className="text-lg font-accent font-bold text-destructive">{stats.incorrect}</span>
            <span className="text-xs text-muted-foreground">Incorrect</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border/60">
            <SkipForward className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-lg font-accent font-bold">{stats.skipped}</span>
            <span className="text-xs text-muted-foreground">Skipped</span>
          </div>
        </div>

        {/* Time Stats */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/60">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Total Time</span>
          </div>
          <span className="font-accent font-medium">{formatTime(totalDurationMs)}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/60">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Avg per Question</span>
          </div>
          <span className="font-accent font-medium">{formatTime(stats.avgTimeMs)}</span>
        </div>

        {/* Category Breakdown */}
        {stats.categories.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Performance by Category
            </h3>
            <div className="space-y-2">
              {stats.categories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cat.name}</span>
                    <span className="font-accent font-medium">
                      {cat.correct}/{cat.total} ({cat.avgScore}%)
                    </span>
                  </div>
                  <Progress value={cat.avgScore} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={onRetake}>
            <RotateCcw className="h-4 w-4" />
            Retake
          </Button>
          <Button className="flex-1" onClick={onNewSession}>
            New Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
