'use client';

/**
 * Explain Approach Recorder
 * 
 * "Record Your Approach" feature for DSA questions.
 * Users explain their thought process via voice before coding.
 * Mimics real whiteboard interview communication practice.
 */

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, CheckCircle, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSpeechRecognizer } from '@/lib/speech/speech-recognition';
import { detectBrowserSupport } from '@/lib/speech/browser-support';

interface ExplainApproachProps {
  onExplanationComplete: (transcript: string) => void;
  maxDurationSec?: number;
  disabled?: boolean;
}

export function ExplainApproach({
  onExplanationComplete,
  maxDurationSec = 90,
  disabled = false,
}: ExplainApproachProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'done'>('idle');
  const [transcript, setTranscript] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const sttSupported = detectBrowserSupport().stt;

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recognizer = getSpeechRecognizer();
    recognizer.stop();
    setState('done');
  }, []);

  // Keep ref updated with latest stopRecording
  stopRecordingRef.current = stopRecording;

  const startRecording = useCallback(() => {
    setTranscript('');
    setElapsed(0);
    setState('recording');

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSec) {
          // Use ref to avoid stale closure
          stopRecordingRef.current?.();
          return maxDurationSec;
        }
        return next;
      });
    }, 1000);

    const recognizer = getSpeechRecognizer();
    recognizer.updateConfig({ continuous: true, interimResults: true });
    recognizer.start({
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript((prev) => (prev ? prev + ' ' : '') + text);
        }
      },
      onError: () => {
        stopRecordingRef.current?.();
      },
      onEnd: () => {
        // Continuous mode may auto-restart, so only finalize if we stopped
      },
    });
  }, [maxDurationSec]);

  const handleConfirm = () => {
    if (transcript.trim()) {
      onExplanationComplete(transcript.trim());
    }
  };

  const handleReset = () => {
    setTranscript('');
    setElapsed(0);
    setState('idle');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!sttSupported) {
    return null; // Don't render in unsupported browsers
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Mic className="h-4 w-4 text-primary" />
        Explain Your Approach
      </div>

      {state === 'idle' && (
        <div className="p-4 rounded-lg border border-dashed border-border bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">
            Record yourself explaining your approach before coding — just like a
            real whiteboard interview. AI will evaluate both your code and
            communication.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={disabled}
            className="gap-2"
          >
            <Mic className="h-4 w-4" />
            Start Recording (max {maxDurationSec}s)
          </Button>
        </div>
      )}

      {state === 'recording' && (
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">
                Recording...
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-accent">
                {formatTime(elapsed)} / {formatTime(maxDurationSec)}
              </span>
            </div>
          </div>

          {transcript && (
            <p className="text-sm text-foreground mb-3 p-2 rounded bg-card border border-border/60">
              {transcript}
            </p>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="gap-2"
          >
            <Square className="h-3.5 w-3.5" />
            Stop Recording
          </Button>
        </div>
      )}

      {state === 'done' && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">
              Recorded ({formatTime(elapsed)})
            </span>
          </div>

          {transcript ? (
            <>
              <p className="text-sm text-foreground mb-3 p-2 rounded bg-card border border-border/60 max-h-32 overflow-y-auto">
                {transcript}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className="gap-2"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Use This Explanation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Redo
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">No speech was captured. Try again or skip this step.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
