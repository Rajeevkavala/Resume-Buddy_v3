'use client';

/**
 * Live Audio Visualizer
 * 
 * Animated orb + waveform that responds to real-time audio levels.
 * Shows different states for user speaking vs AI speaking.
 */

import { useEffect, useRef } from 'react';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import type { LivePhase } from '@/hooks/use-live-interview';

interface LiveAudioVisualizerProps {
  phase: LivePhase;
  audioLevel: number;           // 0-1, user mic level
  interviewerAudioLevel: number; // 0-1, AI speaking level
  className?: string;
}

export function LiveAudioVisualizer({
  phase,
  audioLevel,
  interviewerAudioLevel,
  className = '',
}: LiveAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const barsRef = useRef<number[]>(new Array(32).fill(0));

  const isUserActive = phase === 'listening' && audioLevel > 0.02;
  const isAIActive = phase === 'speaking' && interviewerAudioLevel > 0.02;
  const isProcessing = phase === 'processing' || phase === 'thinking';
  const level = isAIActive ? interviewerAudioLevel : audioLevel;

  // Canvas waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = barsRef.current;
      const barCount = bars.length;
      const barWidth = w / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        // Smoothly animate bars toward target
        const target = isProcessing
          ? Math.sin(Date.now() * 0.003 + i * 0.3) * 0.3 + 0.15
          : (isUserActive || isAIActive)
          ? level * (0.5 + Math.random() * 0.5)
          : 0.05 + Math.sin(Date.now() * 0.001 + i * 0.2) * 0.03;

        bars[i] += (target - bars[i]) * 0.15;

        const barH = Math.max(2, bars[i] * h * 0.8);
        const x = i * (barWidth + 2);
        const y = (h - barH) / 2;

        // Color based on state
        const hue = isAIActive ? 210 : isUserActive ? 142 : 220;
        const sat = isProcessing ? 60 : 75;
        const light = 55 + bars[i] * 20;
        const alpha = 0.4 + bars[i] * 0.6;

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isUserActive, isAIActive, isProcessing, level]);

  const statusLabel = (() => {
    switch (phase) {
      case 'listening': return audioLevel > 0.02 ? 'Listening...' : 'Speak now';
      case 'processing': return 'Transcribing...';
      case 'thinking': return 'AI is thinking...';
      case 'speaking': return 'AI is speaking';
      case 'greeting': return 'AI is greeting you';
      case 'connecting': return 'Connecting...';
      case 'code-input': return 'Write your code';
      default: return '';
    }
  })();

  const StatusIcon = (() => {
    if (phase === 'listening') return Mic;
    if (phase === 'speaking' || phase === 'greeting') return Volume2;
    if (phase === 'processing' || phase === 'thinking' || phase === 'connecting') return Loader2;
    return Mic;
  })();

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Animated Orb */}
      <div className="relative">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isUserActive
              ? 'bg-green-500/20 ring-2 ring-green-500/40 shadow-lg shadow-green-500/20'
              : isAIActive
              ? 'bg-primary/20 ring-2 ring-primary/40 shadow-lg shadow-primary/20'
              : isProcessing
              ? 'bg-amber-500/15 ring-2 ring-amber-500/30'
              : 'bg-muted/50 ring-1 ring-border/40'
          }`}
          style={{
            transform: `scale(${1 + level * 0.15})`,
          }}
        >
          <StatusIcon
            className={`h-8 w-8 transition-colors duration-300 ${
              isUserActive ? 'text-green-500' :
              isAIActive ? 'text-primary' :
              isProcessing ? 'text-amber-500 animate-spin' :
              'text-muted-foreground'
            }`}
          />
        </div>

        {/* Pulse rings when active */}
        {(isUserActive || isAIActive) && (
          <>
            <div
              className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                isUserActive ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ animationDuration: '2s' }}
            />
            <div
              className={`absolute -inset-2 rounded-full animate-ping opacity-10 ${
                isUserActive ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ animationDuration: '3s' }}
            />
          </>
        )}
      </div>

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={256}
        height={48}
        className="w-64 h-12 opacity-80"
      />

      {/* Status Label */}
      {statusLabel && (
        <p className={`text-sm font-medium transition-colors duration-300 ${
          isUserActive ? 'text-green-600 dark:text-green-400' :
          isAIActive ? 'text-primary' :
          isProcessing ? 'text-amber-600 dark:text-amber-400' :
          'text-muted-foreground'
        }`}>
          {statusLabel}
        </p>
      )}
    </div>
  );
}
