'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus } from 'lucide-react';

interface QuestionCountProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuestionCount({ 
  value, 
  onChange, 
  min = 3, 
  max = 10, 
  disabled 
}: QuestionCountProps) {
  const getLabel = () => {
    if (value <= 4) return 'Quick review';
    if (value <= 7) return 'Balanced prep';
    return 'Comprehensive';
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-medium">Questions to Generate</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {getLabel()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChange(Math.max(min, value - 1))}
              disabled={value <= min || disabled}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Decrease</span>
            </Button>
            
            <div className="flex items-baseline gap-1 min-w-[60px] justify-center">
              <span className="text-3xl font-mono font-bold text-primary tabular-nums">
                {value}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChange(Math.min(max, value + 1))}
              disabled={value >= max || disabled}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Increase</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
