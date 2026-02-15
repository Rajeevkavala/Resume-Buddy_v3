'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Award, Target, RotateCcw, Plus } from 'lucide-react';

interface ResultsViewProps {
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalQuestions: number;
  onRetake: () => void;
  onNewQuiz: () => void;
}

export function ResultsView({ 
  correctCount, 
  incorrectCount, 
  skippedCount, 
  totalQuestions,
  onRetake,
  onNewQuiz
}: ResultsViewProps) {
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const [displayScore, setDisplayScore] = useState(0);

  // Count-up animation for score
  useEffect(() => {
    const duration = 1200; // ms
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.floor(eased * scorePercentage));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [scorePercentage]);

  const getScoreMessage = () => {
    if (scorePercentage >= 80) return 'Excellent performance!';
    if (scorePercentage >= 50) return 'Good effort, keep practicing!';
    return 'Room for improvement. Try again!';
  };

  const ScoreIcon = scorePercentage >= 80 ? Trophy : scorePercentage >= 50 ? Award : Target;

  return (
    <Card className="border-border/60">
      <CardContent className="p-6 sm:p-10 text-center">
        <div className="space-y-6">
          {/* Trophy/Icon */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ScoreIcon className="w-10 h-10 text-primary" />
          </div>
          
          {/* Score Number */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className={cn(
                "text-6xl sm:text-7xl font-mono font-bold tabular-nums",
                scorePercentage >= 80 && "text-emerald-600 dark:text-emerald-400",
                scorePercentage >= 50 && scorePercentage < 80 && "text-primary",
                scorePercentage < 50 && "text-red-600 dark:text-red-400"
              )}>
                {displayScore}
              </span>
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
            <p className="text-muted-foreground">
              {getScoreMessage()}
            </p>
          </div>
          
          {/* Stats Breakdown */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="p-4 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
              <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {correctCount}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 dark:bg-red-500/20">
              <div className="text-2xl font-mono font-bold text-red-600 dark:text-red-400 tabular-nums">
                {incorrectCount}
              </div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-mono font-bold text-muted-foreground tabular-nums">
                {skippedCount}
              </div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button onClick={onRetake} variant="outline" className="sm:min-w-[160px]">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
            <Button onClick={onNewQuiz} className="sm:min-w-[160px]">
              <Plus className="w-4 h-4 mr-2" />
              New Quiz
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
