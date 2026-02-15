'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  interviewType: string;
  progress: number;
  difficultyLevel?: string;
}

export function QuizProgress({ 
  currentQuestion, 
  totalQuestions, 
  interviewType, 
  progress,
  difficultyLevel 
}: QuizProgressProps) {

  return (
    <Card className="border-border/60 sticky top-0 z-20 bg-card/95 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {interviewType}
            </Badge>
            {difficultyLevel && (
              <Badge variant="outline" className="text-xs">
                {difficultyLevel}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-mono font-bold text-primary tabular-nums">
              {currentQuestion}
            </span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {totalQuestions}
            </span>
          </div>
        </div>
        
        {/* Progress Bar - Solid Color, No Gradient */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
