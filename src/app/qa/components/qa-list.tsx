'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { QACard, validateQAPair } from './qa-card';
import { topics } from './topic-selector';
import type { GenerateResumeQAOutput, QATopic } from '@/lib/types';

interface QAListProps {
  qa: Record<QATopic, GenerateResumeQAOutput | null>;
  selectedTopic: QATopic;
  isLoading: boolean;
  onRegenerate: () => void;
}

export function QAList({ qa, selectedTopic, isLoading, onRegenerate }: QAListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  
  const topicData = qa[selectedTopic];
  const topicInfo = topics.find(t => t.id === selectedTopic);
  const qaPairs = topicData?.qaPairs || [];
  const totalQuestions = qaPairs.length;

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const goToNext = () => {
    if (currentMobileIndex < totalQuestions - 1) {
      setCurrentMobileIndex(currentMobileIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentMobileIndex > 0) {
      setCurrentMobileIndex(currentMobileIndex - 1);
    }
  };

  if (!topicData || qaPairs.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {topicInfo && (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <topicInfo.icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg sm:text-xl">
                {selectedTopic} Questions
              </CardTitle>
              <CardDescription className="text-sm">
                {topicInfo?.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'}
            </Badge>
            <Button 
              onClick={onRegenerate} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentMobileIndex === 0}
                  className="h-9"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-primary">
                    {currentMobileIndex + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">of {totalQuestions}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentMobileIndex === totalQuestions - 1}
                  className="h-9"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentMobileIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Mobile Single Card View */}
          <div className="mt-4">
            <QACard
              pair={validateQAPair(qaPairs[currentMobileIndex])}
              index={currentMobileIndex}
              isExpanded={true}
              onToggle={() => {}}
            />
          </div>
        </div>

        {/* Desktop All Cards View */}
        <div className="hidden lg:block space-y-4">
          {qaPairs.map((pair, index) => (
            <QACard
              key={index}
              pair={validateQAPair(pair)}
              index={index}
              isExpanded={expandedIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
