'use client';

import { useState } from 'react';
import type { GenerateInterviewQuestionsOutput, GenerateInterviewQuestionsInput } from '@/ai/flows/generate-interview-questions';
import type { InterviewType, DifficultyLevel } from '@/app/interview/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/context/subscription-context';
import { UpgradePrompt, ProBadge } from '@/components/upgrade-prompt';
import { SkipForward, ArrowRight, Trophy, Settings } from 'lucide-react';

import { InterviewHeader } from './interview-header';
import { ConfigurationPanel } from './configuration-panel';
import { QuizProgress } from './quiz-progress';
import { QuestionCard } from './question-card';
import { AnswerOptions } from './answer-options';
import { ExplanationCard } from './explanation-card';
import { ResultsView } from './results-view';
import { MobileFooter } from './mobile-footer';
import { GeneratingState, EmptyState } from './empty-state';

type QuizPhase = 'configuration' | 'in-progress' | 'completed';

interface QuizContentProps {
  interview: GenerateInterviewQuestionsOutput | null;
  onGenerate: (config: Omit<GenerateInterviewQuestionsInput, 'resumeText' | 'jobDescription'>) => void;
  isLoading: boolean;
}

export function QuizContent({ interview, onGenerate, isLoading }: QuizContentProps) {
  const { canAccessFeature, isLoading: subscriptionLoading } = useSubscription();
  const hasAccess = canAccessFeature('generate-questions');

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [currentSelection, setCurrentSelection] = useState<number | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Config state (for generating state display)
  const [lastConfig, setLastConfig] = useState<{ numQuestions: number; interviewType: string }>({
    numQuestions: 5,
    interviewType: 'General',
  });

  // Determine quiz phase
  const getQuizPhase = (): QuizPhase => {
    if (!interview || !interview.questions || interview.questions.length === 0) {
      return 'configuration';
    }
    // Check if all questions have been answered and we're done
    const answeredCount = selectedAnswers.filter(a => a !== null).length;
    const skippedToEnd = currentQuestionIndex >= interview.questions.length;
    if (skippedToEnd || (answeredCount === interview.questions.length && hasAnsweredCurrent && currentQuestionIndex === interview.questions.length - 1)) {
      // Check if we should show results
      if (currentQuestionIndex >= interview.questions.length - 1 && hasAnsweredCurrent) {
        return 'completed';
      }
    }
    return 'in-progress';
  };

  const phase = interview && interview.questions && interview.questions.length > 0 
    ? (currentQuestionIndex >= interview.questions.length ? 'completed' : 'in-progress')
    : 'configuration';

  const handleGenerate = (config: Omit<GenerateInterviewQuestionsInput, 'resumeText' | 'jobDescription'>) => {
    setLastConfig({ numQuestions: config.numQuestions, interviewType: config.interviewType });
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setCurrentSelection(null);
    setHasAnsweredCurrent(false);
    setShowConfig(false);
    onGenerate(config);
  };

  const handleSelectAnswer = (index: number) => {
    if (hasAnsweredCurrent) return;
    setCurrentSelection(index);
    setHasAnsweredCurrent(true);
    
    // Store the answer
    const newAnswers = [...selectedAnswers];
    while (newAnswers.length < currentQuestionIndex) {
      newAnswers.push(null); // Fill skipped questions
    }
    newAnswers[currentQuestionIndex] = index;
    setSelectedAnswers(newAnswers);
  };

  const handleSkip = () => {
    // Store null for skipped question
    const newAnswers = [...selectedAnswers];
    while (newAnswers.length < currentQuestionIndex) {
      newAnswers.push(null);
    }
    newAnswers[currentQuestionIndex] = null;
    setSelectedAnswers(newAnswers);
    
    handleNext();
  };

  const handleNext = () => {
    if (!interview) return;
    
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentSelection(null);
      setHasAnsweredCurrent(false);
    } else {
      // Move to completed phase
      setCurrentQuestionIndex(interview.questions.length);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setCurrentSelection(null);
    setHasAnsweredCurrent(false);
  };

  const handleNewQuiz = () => {
    onGenerate({ interviewType: 'General', difficultyLevel: 'Mid', numQuestions: -1 });
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setCurrentSelection(null);
    setHasAnsweredCurrent(false);
  };

  // Calculate results
  const calculateResults = () => {
    if (!interview) return { correct: 0, incorrect: 0, skipped: 0 };
    
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    
    interview.questions.forEach((q, i) => {
      const answer = selectedAnswers[i];
      if (answer === null || answer === undefined) {
        skipped++;
      } else if (answer === q.correctAnswerIndex) {
        correct++;
      } else {
        incorrect++;
      }
    });
    
    return { correct, incorrect, skipped };
  };

  // Show upgrade prompt for free users
  if (!subscriptionLoading && !hasAccess) {
    return (
      <div className="space-y-6">
        <InterviewHeader phase="configuration" />
        <UpgradePrompt 
          feature="generate-questions"
          title="Unlock Interview Quiz"
          description="Practice with AI-generated interview questions tailored to your experience level. Get instant feedback and ace your next interview."
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <InterviewHeader phase="configuration" />
        <GeneratingState 
          numQuestions={lastConfig.numQuestions} 
          interviewType={lastConfig.interviewType} 
        />
      </div>
    );
  }

  // Configuration phase
  if (phase === 'configuration') {
    return (
      <div className="space-y-6">
        <InterviewHeader phase="configuration" />
        <ConfigurationPanel onGenerate={handleGenerate} isLoading={isLoading} />
      </div>
    );
  }

  // Completed phase
  if (phase === 'completed' && interview) {
    const results = calculateResults();
    
    return (
      <div className="space-y-6">
        <InterviewHeader phase="completed" />
        <ResultsView
          correctCount={results.correct}
          incorrectCount={results.incorrect}
          skippedCount={results.skipped}
          totalQuestions={interview.questions.length}
          onRetake={handleRetake}
          onNewQuiz={handleNewQuiz}
        />
        
        {/* New Quiz Configuration (collapsed by default) */}
        {showConfig ? (
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">New Quiz Settings</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)}>
                  Close
                </Button>
              </div>
              <ConfigurationPanel onGenerate={handleGenerate} isLoading={isLoading} isCompact />
            </CardContent>
          </Card>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setShowConfig(true)}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure New Quiz
          </Button>
        )}
      </div>
    );
  }

  // In-progress phase
  if (!interview || !interview.questions[currentQuestionIndex]) {
    return <EmptyState />;
  }

  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === interview.questions.length - 1;

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <InterviewHeader phase="in-progress" />
      
      {/* Progress Bar */}
      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={interview.questions.length}
        interviewType={currentQuestion.category || 'General'}
        progress={progress}
      />
      
      {/* Question */}
      <QuestionCard 
        questionNumber={currentQuestionIndex + 1} 
        questionText={currentQuestion.question} 
      />
      
      {/* Answer Options */}
      <AnswerOptions
        options={currentQuestion.options}
        selectedAnswer={currentSelection}
        correctAnswerIndex={currentQuestion.correctAnswerIndex}
        hasAnswered={hasAnsweredCurrent}
        onSelect={handleSelectAnswer}
      />
      
      {/* Explanation (shown after answering) */}
      {hasAnsweredCurrent && currentQuestion.explanation && (
        <ExplanationCard explanation={currentQuestion.explanation} />
      )}
      
      {/* Desktop Actions */}
      <div className="hidden lg:flex justify-between items-center pt-4">
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {interview.questions.length}
        </span>
        <div className="flex gap-3">
          {!hasAnsweredCurrent && (
            <Button variant="outline" onClick={handleSkip}>
              Skip
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            disabled={!hasAnsweredCurrent}
          >
            {isLastQuestion ? (
              <>
                See Results
                <Trophy className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Mobile Footer */}
      <MobileFooter
        hasAnswered={hasAnsweredCurrent}
        isLastQuestion={isLastQuestion}
        onSkip={handleSkip}
        onNext={handleNext}
      />
    </div>
  );
}
