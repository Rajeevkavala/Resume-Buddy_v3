'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Sparkles, Loader2 } from 'lucide-react';
import type { QATopic } from '@/lib/types';

interface EmptyStateProps {
  hasDataChanged: boolean;
  selectedTopic: QATopic;
  numQuestions: number;
  isLoading: boolean;
  onGenerate: () => void;
}

export function EmptyState({ 
  hasDataChanged, 
  selectedTopic, 
  numQuestions, 
  isLoading, 
  onGenerate 
}: EmptyStateProps) {
  return (
    <Card className="border-border/60 border-dashed">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-headline font-semibold text-foreground">
              {hasDataChanged ? 'Content Updated' : 'Generate Q&A Pairs'}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {hasDataChanged 
                ? 'Your resume or job info has changed. Regenerate to get updated Q&A pairs tailored to your new content.'
                : 'Create personalized interview questions and answers based on your resume and target role.'}
            </p>
          </div>
          
          <Button 
            onClick={onGenerate} 
            disabled={isLoading} 
            size="lg" 
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating {numQuestions} questions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {numQuestions} Q&A for &apos;{selectedTopic}&apos;
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
