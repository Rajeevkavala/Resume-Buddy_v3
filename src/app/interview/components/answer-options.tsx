'use client';

import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface AnswerOptionsProps {
  options: string[];
  selectedAnswer: number | null;
  correctAnswerIndex: number;
  hasAnswered: boolean;
  onSelect: (index: number) => void;
}

export function AnswerOptions({ 
  options, 
  selectedAnswer, 
  correctAnswerIndex, 
  hasAnswered, 
  onSelect 
}: AnswerOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D
        const isSelected = selectedAnswer === index;
        const isCorrect = hasAnswered && index === correctAnswerIndex;
        const isWrong = hasAnswered && isSelected && index !== correctAnswerIndex;
        
        return (
          <button
            key={index}
            onClick={() => !hasAnswered && onSelect(index)}
            disabled={hasAnswered}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
              // Default state
              !hasAnswered && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/30",
              // Selected but not answered yet
              !hasAnswered && isSelected && "border-primary bg-primary/5",
              // Correct answer (after answering)
              isCorrect && "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20",
              // Wrong answer (after answering)
              isWrong && "border-red-500 bg-red-500/10 dark:bg-red-500/20",
              // Disabled after answering (not selected, not correct)
              hasAnswered && !isCorrect && !isWrong && "border-border/50 opacity-60",
              // Cursor
              hasAnswered ? "cursor-default" : "cursor-pointer"
            )}
          >
            {/* Letter Indicator */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-medium text-sm transition-all",
              // Default
              !hasAnswered && !isSelected && "bg-muted text-muted-foreground",
              // Selected
              !hasAnswered && isSelected && "bg-primary text-primary-foreground",
              // Correct
              isCorrect && "bg-emerald-500 text-white",
              // Wrong
              isWrong && "bg-red-500 text-white"
            )}>
              {isCorrect ? (
                <Check className="w-5 h-5" />
              ) : isWrong ? (
                <X className="w-5 h-5" />
              ) : (
                letter
              )}
            </div>
            
            {/* Option Text */}
            <span className={cn(
              "text-sm sm:text-base flex-1",
              isCorrect && "text-emerald-700 dark:text-emerald-300 font-medium",
              isWrong && "text-red-700 dark:text-red-300"
            )}>
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
