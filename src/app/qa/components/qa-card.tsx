'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, MessageSquareQuote, Tags, CheckSquare } from 'lucide-react';

interface QAPair {
  question: string;
  answer: string;
  relatedSections: string[];
  keyPoints: string[];
}

interface QACardProps {
  pair: QAPair;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function QACard({ pair, index, isExpanded, onToggle }: QACardProps) {
  return (
    <Card className="border-border/60 overflow-hidden">
      {/* Question Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-start gap-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-sm font-mono font-bold text-primary">
            {index + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium leading-relaxed pr-2">
            {pair.question}
          </p>
        </div>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200",
            isExpanded && "rotate-180"
          )} 
        />
      </button>
      
      {/* Expandable Answer Section */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60">
            {/* Answer */}
            <div className="p-4 sm:p-5 bg-emerald-500/5 dark:bg-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareQuote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Suggested Answer
                </h4>
              </div>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {pair.answer}
              </p>
            </div>
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 bg-muted/30">
              {/* Related Sections */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4 text-muted-foreground" />
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Related Sections
                  </h5>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pair.relatedSections.length > 0 ? (
                    pair.relatedSections.map((section, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {section}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No sections linked</span>
                  )}
                </div>
              </div>
              
              {/* Key Points */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-muted-foreground" />
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Key Points
                  </h5>
                </div>
                <ul className="space-y-1.5">
                  {pair.keyPoints.length > 0 ? (
                    pair.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No key points</span>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper function to safely validate QA pair structure
export function validateQAPair(pair: unknown): QAPair {
  const p = pair as Record<string, unknown>;
  return {
    question: (typeof p?.question === 'string' ? p.question : 'Question not available'),
    answer: (typeof p?.answer === 'string' ? p.answer : 'Answer not available'),
    relatedSections: Array.isArray(p?.relatedSections) ? p.relatedSections : [],
    keyPoints: Array.isArray(p?.keyPoints) ? p.keyPoints : []
  };
}
