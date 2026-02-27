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
import { BrowserSupportBanner } from '@/components/interview';
import { LiveInterviewRoom } from '@/components/live-interview';
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
          <TabsList className="grid w-full max-w-lg grid-cols-2 mx-auto">
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

          {/* AI Interview Tab (real-time voice with Sarvam AI) */}
          <TabsContent value="ai-interview" className="mt-6">
            <LiveInterviewRoom
              userId={user.uid}
              resumeText={resumeText ?? undefined}
              jobDescription={jobDescription ?? undefined}
            />
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
