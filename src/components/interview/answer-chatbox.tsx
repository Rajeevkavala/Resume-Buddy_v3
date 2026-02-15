'use client';

/**
 * Answer Chatbox
 * Text input with optional voice-to-text (STT) for interview answers.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { getSpeechRecognizer } from '@/lib/speech/speech-recognition';
import { detectBrowserSupport } from '@/lib/speech/browser-support';

interface AnswerChatboxProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  isEvaluating?: boolean;
  enableVoice?: boolean;    // Show/hide voice recorder
  placeholder?: string;
}

export function AnswerChatbox({
  onSubmit,
  disabled = false,
  isEvaluating = false,
  enableVoice = true,
  placeholder = 'Type your answer or click the mic to speak...',
}: AnswerChatboxProps) {
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [sttSupported, setSttSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const support = detectBrowserSupport();
    setSttSupported(support.stt);
  }, []);

  const handleVoiceToggle = useCallback(() => {
    const recognizer = getSpeechRecognizer();

    if (isRecording) {
      recognizer.stop();
      setIsRecording(false);
      setInterimText('');
      return;
    }

    recognizer.start({
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setAnswer((prev) => (prev ? prev + ' ' : '') + transcript);
          setInterimText('');
        } else {
          setInterimText(transcript);
        }
      },
      onError: (error) => {
        console.warn('STT error:', error);
        setIsRecording(false);
        setInterimText('');
      },
      onEnd: () => {
        setIsRecording(false);
        setInterimText('');
      },
      onStatusChange: (status) => {
        setIsRecording(status === 'listening');
      },
    });
  }, [isRecording]);

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setAnswer('');
    setInterimText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isEvaluating}
          className="min-h-[100px] pr-24 resize-none"
          rows={4}
        />
        {interimText && (
          <div className="absolute bottom-12 left-2 text-xs text-muted-foreground italic bg-background/80 px-2 py-1 rounded">
            {interimText}
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {sttSupported && enableVoice && (
            <Button
              type="button"
              size="sm"
              variant={isRecording ? 'destructive' : 'outline'}
              className="h-8 w-8 p-0"
              onClick={handleVoiceToggle}
              disabled={disabled || isEvaluating}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            className="h-8 px-3"
            onClick={handleSubmit}
            disabled={disabled || isEvaluating || !answer.trim()}
          >
            {isEvaluating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          Listening... Speak clearly.
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Press Ctrl+Enter to submit
      </p>
    </div>
  );
}
