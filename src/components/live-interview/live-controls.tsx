'use client';

/**
 * Live Interview Controls
 *
 * Bottom control bar for the live interview.
 * - Mic button reflects ACTUAL recording state (isMicActive), not just phase
 * - Auto-listening: mic activates automatically when phase = 'listening'
 * - Manual toggle: user can pause/resume the mic at any time
 * - Text input fallback for typing answers
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic, MicOff, Send, PhoneOff, SkipForward, Keyboard, X, Loader2, Volume2, ChevronsRight,
} from 'lucide-react';
import type { LivePhase } from '@/hooks/use-live-interview';

interface LiveControlsProps {
  phase: LivePhase;
  isMicActive: boolean;
  audioLevel: number;
  onToggleMic: () => void;
  onSubmitText: (text: string) => void;
  onEndSession: () => void;
  onSkipGreeting: () => void;
  onSkipToNextQuestion?: () => void;
  audioEnabled?: boolean;
}

export function LiveControls({
  phase,
  isMicActive,
  audioLevel,
  onToggleMic,
  onSubmitText,
  onEndSession,
  onSkipGreeting,
  onSkipToNextQuestion,
  audioEnabled = true,
}: LiveControlsProps) {
  const [showTextInput, setShowTextInput] = useState(!audioEnabled);
  const [textValue, setTextValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isListening  = phase === 'listening';
  const isProcessing = phase === 'processing' || phase === 'thinking';
  const isAISpeaking = phase === 'speaking' || phase === 'greeting';
  const canType      = isListening || phase === 'code-input';
  const isActive     = !['setup', 'connecting', 'evaluating', 'completed'].includes(phase);

  const handleTextSubmit = () => {
    const trimmed = textValue.trim();
    if (!trimmed) return;
    onSubmitText(trimmed);
    setTextValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const ringScale   = 1 + audioLevel * 0.6;
  const ringOpacity = Math.min(0.6, 0.15 + audioLevel * 0.5);

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-background/95 backdrop-blur-sm shrink-0 min-h-[64px]">

      {/* Text input area */}
      {showTextInput ? (
        <div className="flex-1 flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={canType ? 'Type your answer (Enter to send)' : 'Wait for your turn…'}
            disabled={!canType}
            rows={2}
            className="flex-1 resize-none min-h-[52px] max-h-[120px] text-sm"
          />
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              onClick={handleTextSubmit}
              disabled={!textValue.trim() || !canType}
              className="h-8 w-8 p-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            {audioEnabled && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTextInput(false)}
                className="h-8 w-8 p-0 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Left: AI speaking / processing status */}
          <div className="flex items-center gap-2 min-w-[120px]">
            {isAISpeaking && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkipGreeting}
                  className="text-muted-foreground text-xs h-8 px-2"
                >
                  <SkipForward className="h-3.5 w-3.5 mr-1" />
                  Skip
                </Button>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  Speaking
                </span>
              </>
            )}
            {isProcessing && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {phase === 'processing' ? 'Transcribing…' : 'Thinking…'}
              </span>
            )}
          </div>

          {/* Centre: Mic button */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1">
            {isListening ? (
              <>
                <div className="relative flex items-center justify-center">
                  {isMicActive && (
                    <div
                      className="absolute rounded-full bg-red-500 pointer-events-none transition-transform duration-75"
                      style={{ width: 56, height: 56, transform: `scale(${ringScale})`, opacity: ringOpacity }}
                    />
                  )}
                  <button
                    onClick={onToggleMic}
                    title={isMicActive ? 'Pause mic' : 'Start speaking'}
                    className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                      isMicActive
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isMicActive ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    {isMicActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full border-2 border-red-500 animate-pulse" />
                    )}
                  </button>
                </div>
                <p className={`text-[11px] font-medium ${isMicActive ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {isMicActive ? 'Listening — tap to pause' : 'Tap to speak'}
                </p>
              </>
            ) : isProcessing ? (
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
              </div>
            ) : null}
          </div>

          {/* Right: Type toggle + Next Question */}
          <div className="flex items-center justify-end gap-2 min-w-[120px]">
            {isActive && onSkipToNextQuestion && (isListening || phase === 'code-input') && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSkipToNextQuestion}
                className="text-xs h-8 px-2"
                title="Move to next question (2 min limit per question)"
              >
                <ChevronsRight className="h-3.5 w-3.5 mr-1" />
                Next
              </Button>
            )}
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTextInput(true);
                  setTimeout(() => inputRef.current?.focus(), 80);
                }}
                className="text-muted-foreground text-xs h-8 px-2"
              >
                <Keyboard className="h-3.5 w-3.5 mr-1" />
                Type
              </Button>
            )}
          </div>
        </>
      )}

      {/* End session */}
      {isActive && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onEndSession}
          className="shrink-0 h-9 px-3 text-xs"
        >
          <PhoneOff className="h-3.5 w-3.5 mr-1.5" />
          End
        </Button>
      )}
    </div>
  );
}
