'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, Check, AlertCircle, Loader2 } from 'lucide-react';

export type ExportStage = 'idle' | 'preparing' | 'compiling' | 'downloading' | 'complete' | 'error';

interface ExportProgressProps {
  isExporting: boolean;
  stage?: ExportStage;
  error?: string | null;
  onComplete?: () => void;
  className?: string;
}

const STAGE_CONFIG = {
  idle: { progress: 0, label: 'Ready to export' },
  preparing: { progress: 15, label: 'Preparing resume data...' },
  compiling: { progress: 50, label: 'Compiling LaTeX to PDF...' },
  downloading: { progress: 85, label: 'Preparing download...' },
  complete: { progress: 100, label: 'Export complete!' },
  error: { progress: 0, label: 'Export failed' },
};

/**
 * Animated progress indicator for PDF export
 * Shows percentage and stage information
 */
export function ExportProgress({
  isExporting,
  stage = 'idle',
  error,
  onComplete,
  className,
}: ExportProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const targetProgress = STAGE_CONFIG[stage]?.progress ?? 0;

  // Smooth progress animation
  useEffect(() => {
    if (!isExporting && stage === 'idle') {
      setDisplayProgress(0);
      setAnimatedProgress(0);
      return;
    }

    // Animate to target progress
    const animateProgress = () => {
      setAnimatedProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.5) return targetProgress;
        return prev + diff * 0.1;
      });
    };

    const interval = setInterval(animateProgress, 50);
    return () => clearInterval(interval);
  }, [targetProgress, isExporting, stage]);

  // Update display progress with slight delay for smoothness
  useEffect(() => {
    setDisplayProgress(Math.round(animatedProgress));
  }, [animatedProgress]);

  // Call onComplete when done
  useEffect(() => {
    if (stage === 'complete' && onComplete) {
      const timeout = setTimeout(onComplete, 1500);
      return () => clearTimeout(timeout);
    }
  }, [stage, onComplete]);

  if (!isExporting && stage === 'idle') {
    return null;
  }

  const stageLabel = error ? error : STAGE_CONFIG[stage]?.label || 'Exporting...';
  const isError = stage === 'error';
  const isComplete = stage === 'complete';

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Progress bar container */}
      <div className="relative">
        {/* Background track */}
        <div className="h-2 sm:h-3 bg-muted rounded-full overflow-hidden">
          {/* Animated fill */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              isError && 'bg-destructive',
              isComplete && 'bg-green-500',
              !isError && !isComplete && 'bg-gradient-to-r from-primary via-primary/80 to-primary'
            )}
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        {/* Shimmer effect for active state */}
        {isExporting && !isComplete && !isError && (
          <div className="absolute inset-0 h-2 sm:h-3 rounded-full overflow-hidden">
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
        {/* Left: Icon + Label */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isError ? (
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          ) : isComplete ? (
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
          )}
          <span
            className={cn(
              'truncate',
              isError && 'text-destructive',
              isComplete && 'text-green-600 dark:text-green-400',
              !isError && !isComplete && 'text-muted-foreground'
            )}
          >
            {stageLabel}
          </span>
        </div>

        {/* Right: Percentage */}
        <div
          className={cn(
            'text-sm sm:text-base font-semibold tabular-nums flex-shrink-0',
            isError && 'text-destructive',
            isComplete && 'text-green-600 dark:text-green-400',
            !isError && !isComplete && 'text-primary'
          )}
        >
          {displayProgress}%
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage export progress state
 */
export function useExportProgress() {
  const [isExporting, setIsExporting] = useState(false);
  const [stage, setStage] = useState<ExportStage>('idle');
  const [error, setError] = useState<string | null>(null);

  const startExport = useCallback(() => {
    setIsExporting(true);
    setStage('preparing');
    setError(null);
  }, []);

  const setCompiling = useCallback(() => {
    setStage('compiling');
  }, []);

  const setDownloading = useCallback(() => {
    setStage('downloading');
  }, []);

  const completeExport = useCallback(() => {
    setStage('complete');
    // Auto-reset after animation
    setTimeout(() => {
      setIsExporting(false);
      setStage('idle');
    }, 2000);
  }, []);

  const failExport = useCallback((errorMessage: string) => {
    setStage('error');
    setError(errorMessage);
    // Auto-reset after showing error
    setTimeout(() => {
      setIsExporting(false);
      setStage('idle');
      setError(null);
    }, 4000);
  }, []);

  const reset = useCallback(() => {
    setIsExporting(false);
    setStage('idle');
    setError(null);
  }, []);

  return {
    isExporting,
    stage,
    error,
    startExport,
    setCompiling,
    setDownloading,
    completeExport,
    failExport,
    reset,
  };
}

/**
 * Full-screen overlay for export progress (mobile-friendly)
 */
export function ExportProgressOverlay({
  isExporting,
  stage,
  error,
  filename,
}: {
  isExporting: boolean;
  stage: ExportStage;
  error?: string | null;
  filename?: string;
}) {
  if (!isExporting && stage === 'idle') {
    return null;
  }

  const isComplete = stage === 'complete';
  const isError = stage === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border rounded-xl shadow-2xl p-6 space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className={cn(
              'p-4 rounded-full',
              isError && 'bg-destructive/10',
              isComplete && 'bg-green-500/10',
              !isError && !isComplete && 'bg-primary/10'
            )}
          >
            {isError ? (
              <AlertCircle className="h-8 w-8 text-destructive" />
            ) : isComplete ? (
              <Download className="h-8 w-8 text-green-500" />
            ) : (
              <FileText className="h-8 w-8 text-primary animate-pulse" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {isError ? 'Export Failed' : isComplete ? 'Export Complete!' : 'Exporting PDF'}
          </h3>
          {filename && !isError && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{filename}.pdf</p>
          )}
        </div>

        {/* Progress */}
        <ExportProgress isExporting={isExporting} stage={stage} error={error} />
      </div>
    </div>
  );
}
