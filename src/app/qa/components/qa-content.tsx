'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { TopicSelector } from './topic-selector';
import { QuestionCount } from './question-count';
import { QAList } from './qa-list';
import { EmptyState } from './empty-state';
import { GeneratingState } from './generating-state';
import { useSubscription } from '@/context/subscription-context';
import { UpgradePrompt, ProBadge } from '@/components/upgrade-prompt';
import type { GenerateResumeQAOutput, QATopic } from '@/lib/types';

interface QAContentProps {
  qa: Record<QATopic, GenerateResumeQAOutput | null> | null;
  onGenerate: (topic: QATopic, numQuestions: number) => void;
  isLoading: boolean;
  hasDataChanged?: boolean;
  selectedTopic: QATopic;
  setSelectedTopic: (topic: QATopic) => void;
}

export function QAContent({
  qa,
  onGenerate,
  isLoading,
  hasDataChanged,
  selectedTopic,
  setSelectedTopic,
}: QAContentProps) {
  const [numQuestions, setNumQuestions] = useState(5);
  const { canAccessFeature, isLoading: subscriptionLoading } = useSubscription();
  
  // Check if Q&A feature is accessible (Pro only)
  const hasAccess = canAccessFeature('generate-qa');

  const handleGenerate = () => {
    onGenerate(selectedTopic, numQuestions);
  };

  // Check if any data has been generated
  const noDataGenerated = !qa || Object.values(qa).every(val => val === null);
  
  // Check if current topic has data (must exist and not be null/undefined)
  const currentTopicHasData = qa && qa[selectedTopic] != null && qa[selectedTopic] !== undefined;
  
  // Check if we're generating for the current topic
  // Only true if we're loading AND specifically generating for this topic (data is null/undefined)
  const isGeneratingCurrentTopic = isLoading && (!qa || qa[selectedTopic] == null);

  // Show upgrade prompt for free users
  if (!subscriptionLoading && !hasAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Q&A Preparation</h2>
          <ProBadge />
        </div>
        <UpgradePrompt 
          feature="generate-qa"
          title="Unlock Q&A Preparation"
          description="Generate personalized interview questions and expertly crafted answers based on your resume. Practice with topic-specific Q&A pairs to ace your next interview."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="space-y-4">
        <TopicSelector
          selectedTopic={selectedTopic}
          onSelectTopic={setSelectedTopic}
          disabled={false}
        />
        
        <QuestionCount
          value={numQuestions}
          onChange={setNumQuestions}
          disabled={isGeneratingCurrentTopic}
        />
        
        {/* Generate Button - Show when no data for current topic or data changed */}
        {(!currentTopicHasData || hasDataChanged) && !isGeneratingCurrentTopic && (
          <Button 
            onClick={handleGenerate} 
            disabled={isGeneratingCurrentTopic} 
            size="lg" 
            className="w-full sm:w-auto"
          >
            {isGeneratingCurrentTopic ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {numQuestions} Q&A for &apos;{selectedTopic}&apos;
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content Section */}
      {isGeneratingCurrentTopic ? (
        <GeneratingState 
          selectedTopic={selectedTopic} 
          numQuestions={numQuestions} 
        />
      ) : currentTopicHasData && qa ? (
        <QAList
          qa={qa}
          selectedTopic={selectedTopic}
          isLoading={isLoading}
          onRegenerate={handleGenerate}
        />
      ) : (
        <EmptyState
          hasDataChanged={!!hasDataChanged}
          selectedTopic={selectedTopic}
          numQuestions={numQuestions}
          isLoading={isGeneratingCurrentTopic}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}
