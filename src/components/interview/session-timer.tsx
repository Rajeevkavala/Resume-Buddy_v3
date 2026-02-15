'use client';

/**
 * Session Timer
 * Shows elapsed time and per-question time during interview.
 */

import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface SessionTimerProps {
  isRunning: boolean;
  onTick?: (elapsedMs: number) => void;
}

export function SessionTimer({ isRunning, onTick }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const ms = now - startTimeRef.current;
        setElapsed(ms);
        onTick?.(ms);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span className="font-accent font-medium tabular-nums">
        {formatTime(elapsed)}
      </span>
    </div>
  );
}

/**
 * Get current elapsed ms (for answer time tracking)
 */
export function useQuestionTimer() {
  const startRef = useRef<number>(Date.now());

  const reset = () => {
    startRef.current = Date.now();
  };

  const getElapsed = () => Date.now() - startRef.current;

  return { reset, getElapsed };
}
