'use client';

/**
 * Audio Visualizer
 * Shows when AI is speaking via TTS with pause/stop controls.
 */

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVoiceInterviewer, type TTSStatus } from '@/lib/speech/text-to-speech';

interface AudioVisualizerProps {
  isVisible: boolean;
}

export function AudioVisualizer({ isVisible }: AudioVisualizerProps) {
  const [status, setStatus] = useState<TTSStatus>('idle');

  useEffect(() => {
    const tts = getVoiceInterviewer();
    const unsub = tts.onStatusChange(setStatus);
    return unsub;
  }, []);

  if (!isVisible && status === 'idle') return null;

  const isSpeaking = status === 'speaking';
  const isPaused = status === 'paused';

  const handleToggle = () => {
    const tts = getVoiceInterviewer();
    if (isSpeaking) {
      tts.pause();
    } else if (isPaused) {
      tts.resume();
    }
  };

  const handleStop = () => {
    const tts = getVoiceInterviewer();
    tts.stop();
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <Volume2 className="w-5 h-5 text-primary flex-shrink-0" />

      {/* Simple bars animation */}
      <div className="flex items-end gap-0.5 h-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-1 bg-primary/60 rounded-full transition-all duration-150 ${
              isSpeaking ? 'animate-pulse' : ''
            }`}
            style={{
              height: isSpeaking ? `${8 + Math.random() * 16}px` : '4px',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <span className="text-sm text-muted-foreground flex-1">
        {isSpeaking ? 'AI is speaking...' : isPaused ? 'Paused' : 'Ready'}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleToggle}
          title={isSpeaking ? 'Pause' : 'Resume'}
        >
          {isSpeaking ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={handleStop}
          title="Stop"
        >
          <VolumeX className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
