'use client';

import { Button } from '@/components/ui/button';
import { SkipForward, ArrowRight, Trophy } from 'lucide-react';

interface MobileFooterProps {
  hasAnswered: boolean;
  isLastQuestion: boolean;
  onSkip: () => void;
  onNext: () => void;
}

export function MobileFooter({ hasAnswered, isLastQuestion, onSkip, onNext }: MobileFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border/60 lg:hidden z-20">
      <div className="flex gap-3 max-w-lg mx-auto">
        {!hasAnswered ? (
          <>
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1 h-12"
            >
              Skip
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
            <Button
              disabled
              className="flex-1 h-12"
            >
              Select Answer
            </Button>
          </>
        ) : (
          <Button
            onClick={onNext}
            className="w-full h-12"
          >
            {isLastQuestion ? (
              <>
                See Results
                <Trophy className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
