'use client';

/**
 * Live Transcript
 * 
 * Real-time scrolling conversation between the AI interviewer and the user.
 * Shows messages with timestamps, role badges, and optional score/feedback.
 */

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Volume2, ArrowDown } from 'lucide-react';
import type { LiveMessage } from '@/hooks/use-live-interview';

interface LiveTranscriptProps {
  messages: LiveMessage[];
  interimTranscript?: string;
  className?: string;
}

export function LiveTranscript({ messages, interimTranscript, className = '' }: LiveTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isAutoScrollingRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript]);

  // Track if user scrolled up
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isAutoScrollingRef.current = atBottom;
  };

  const scrollToBottom = () => {
    isAutoScrollingRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`relative flex flex-col ${className}`}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 p-4 scroll-smooth"
      >
        {messages.length === 0 && !interimTranscript && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Conversation will appear here...
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'interviewer'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-green-500/10 text-green-600 dark:text-green-400'
              }`}
            >
              {msg.role === 'interviewer' ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`flex-1 max-w-[80%] space-y-1 ${
                msg.role === 'candidate' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'interviewer'
                    ? 'bg-muted/60 text-foreground rounded-tl-sm'
                    : 'bg-primary/10 text-foreground rounded-tr-sm'
                }`}
              >
                {msg.content}

                {/* Inline feedback */}
                {msg.feedback && (
                  <p className="mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground italic">
                    {msg.feedback}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className={`flex items-center gap-2 px-1 ${
                msg.role === 'candidate' ? 'justify-end' : 'justify-start'
              }`}>
                <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                {msg.audioAvailable && (
                  <Volume2 className="h-3 w-3 text-muted-foreground" />
                )}
                {msg.score != null && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                    {msg.score}/100
                  </Badge>
                )}
                {msg.action && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {msg.action}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Interim transcript (user is still speaking) */}
        {interimTranscript && (
          <div className="flex gap-3 flex-row-reverse">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-600 dark:text-green-400">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 max-w-[80%]">
              <div className="inline-block rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed bg-green-500/5 text-muted-foreground border border-green-500/20">
                {interimTranscript}
                <span className="inline-block ml-1 w-1.5 h-4 bg-green-500/60 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isAutoScrollingRef.current && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
