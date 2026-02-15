'use client';

import { useState, useContext, useEffect } from 'react';
import type { GenerateInterviewQuestionsInput, GenerateInterviewQuestionsOutput } from '@/ai/flows/generate-interview-questions';
import { runInterviewGenerationAction } from '@/app/actions';
import { ResumeContext } from '@/context/resume-context';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { saveUserData } from '@/lib/local-storage';
import { InterviewSkeleton } from '@/components/ui/page-skeletons';
import { usePageTitle } from '@/hooks/use-page-title';
import { notifyAIRequestMade } from '@/hooks/use-daily-usage';
import { CreditsExhaustedModal, useCreditsExhaustedModal } from '@/components/credits-exhausted-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BrowserSupportBanner, SessionConfigPanel, SessionResults, ActiveInterviewView } from '@/components/interview';
import { useInterviewSession } from '@/hooks/use-interview-session';
import { BrainCircuit, Zap } from 'lucide-react';

import { QuizContent } from './components';

export type InterviewType = "Technical" | "Behavioral" | "Leadership" | "General";
export type DifficultyLevel = "Entry" | "Mid" | "Senior" | "Executive";

export default function InterviewPage() {
  const { resumeText, jobDescription, jobRole, jobUrl, interview, setInterview, updateStoredValues, isDataLoaded } = useContext(ResumeContext);
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('quick-quiz');
  const { isOpen: isCreditsModalOpen, setIsOpen: setCreditsModalOpen, showModal: showCreditsModal } = useCreditsExhaustedModal();

  // AI Interview Session Hook
  const session = useInterviewSession(user?.uid ?? '');

  // Set page title
  usePageTitle('Interview Prep');

  // Handle page loading state
  useEffect(() => {
    if (authLoading) {
      setIsPageLoading(true);
      return;
    }

    if (!user) {
      setIsPageLoading(false);
      return;
    }

    if (isDataLoaded) {
      const timer = setTimeout(() => setIsPageLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, isDataLoaded]);

  // --- Quick Quiz generation handler (existing logic) ---
  const handleGeneration = async (config: Omit<GenerateInterviewQuestionsInput, 'resumeText' | 'jobDescription'>) => {
    if (config.numQuestions === -1) {
      setInterview(null);
      return;
    }
    
    if (!user) {
      toast.error('Authentication Error', { description: 'You must be logged in to generate an interview quiz.' });
      return;
    }
    if (!resumeText) {
      toast.error('Missing Resume', {
        description: 'Please upload your resume on the dashboard.',
      });
      return;
    }
    if (!jobDescription && !jobRole) {
      toast.error('Missing Job Information', {
        description: 'Please provide either a job description or select a target role on the dashboard.',
      });
      return;
    }
    
    setIsLoading(true);
    setInterview(null);

    const input = {
      userId: user.uid,
      resumeText,
      jobDescription,
      jobRole,
      jobUrl,
      ...config,
    };

    const promise = runInterviewGenerationAction(input).then((result: GenerateInterviewQuestionsOutput) => {
      if (!result || !result.questions || result.questions.length === 0) {
        throw new Error("The AI failed to generate questions. Please try again.");
      }
      
      notifyAIRequestMade();
      setInterview(result);
      
      const dataToSave: any = {
        interview: result,
        resumeText,
        jobDescription,
      };
      
      if (jobRole) {
        dataToSave.jobRole = jobRole;
      }
      
      if (jobUrl) {
        dataToSave.jobUrl = jobUrl;
      }
      
      saveUserData(user.uid, dataToSave);
      updateStoredValues(resumeText, jobDescription, jobRole, jobUrl);
      return result;
    });

    toast.promise(promise, {
      loading: 'Generating interview quiz...',
      success: () => 'Interview quiz is ready!',
      error: (error: any) => {
        if (error.message && error.message.includes('[503 Service Unavailable]')) {
          return 'API call limit exceeded. Please try again later.';
        }
        if (error.message && (error.message.includes('Daily limit') || error.code === 'DAILY_LIMIT_EXCEEDED')) {
          showCreditsModal();
          return error.message;
        }
        return error.message || 'An unexpected error occurred.';
      },
      finally: () => setIsLoading(false)
    });
  };
  
  // Show skeleton loading while page is loading or user not authenticated
  if (isPageLoading || !user) {
    return <InterviewSkeleton />;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Browser support banner for voice features */}
        <BrowserSupportBanner />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="quick-quiz" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Quiz
            </TabsTrigger>
            <TabsTrigger value="ai-interview" className="gap-2">
              <BrainCircuit className="h-4 w-4" />
              AI Interview
            </TabsTrigger>
          </TabsList>

          {/* Quick Quiz Tab (existing MCQ flow) */}
          <TabsContent value="quick-quiz" className="mt-6">
            <div className="max-w-4xl mx-auto">
              <QuizContent
                interview={interview}
                onGenerate={handleGeneration}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          {/* AI Interview Tab (new session-based flow) */}
          <TabsContent value="ai-interview" className="mt-6">
            {/* Error display */}
            {session.error && (
              <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <p className="font-medium">Error: {session.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => session.reset()}
                >
                  Reset
                </Button>
              </div>
            )}

            {/* Config Phase */}
            {session.phase === 'config' && (
              <SessionConfigPanel
                onStart={session.startSession}
                isLoading={false}
                resumeText={resumeText ?? undefined}
                jobDescription={jobDescription ?? undefined}
              />
            )}

            {/* Generating Phase */}
            {session.phase === 'generating' && (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="text-muted-foreground">Generating your interview questions...</p>
              </div>
            )}

            {/* Active / Evaluating / Review Phase */}
            {(session.phase === 'active' || session.phase === 'evaluating' || session.phase === 'review') && (
              session.currentQuestion ? (
                  <ActiveInterviewView
                    phase={session.phase}
                    sessionType={session.session?.type ?? 'behavioral'}
                    answerFormat={session.session?.answerFormat}
                    currentQuestion={session.currentQuestion}
                    currentQuestionIndex={session.currentQuestionIndex}
                    totalQuestions={session.questions.length}
                    answers={session.answers}
                    currentEvaluation={session.currentEvaluation}
                    voiceExplanation={session.voiceExplanation}
                    isLoading={false}
                    codeLanguage={session.session?.codeLanguage ?? 'javascript'}
                    useVoice={false}
                    onSubmitAnswer={session.submitAnswer}
                    onSubmitCode={session.submitCode}
                    onSetVoiceExplanation={session.setVoiceExplanation}
                    onNextQuestion={session.nextQuestion}
                    onSkipQuestion={session.skipQuestion}
                    onEndSession={session.endSession}
                  />
                ) : (
                  <div className="p-4 bg-destructive/10 rounded-lg text-sm border border-destructive/20">
                    <p className="font-medium text-destructive">No current question available</p>
                    <p className="text-muted-foreground mt-1">Please restart the session.</p>
                  </div>
                )
            )}

            {/* Completed Phase */}
            {session.phase === 'completed' && (
              <SessionResults
                questions={session.questions}
                answers={session.answers}
                totalDurationMs={
                  session.session?.timing
                    ? (session.session.timing.endedAt ?? Date.now()) - session.session.timing.startedAt
                    : 0
                }
                onRetake={() => session.reset()}
                onNewSession={() => session.reset()}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Credits Exhausted Modal */}
      <CreditsExhaustedModal 
        open={isCreditsModalOpen} 
        onOpenChange={setCreditsModalOpen}
        featureName="Interview Practice"
      />
    </div>
  );
}
