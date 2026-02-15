'use client';

import { useState, useContext, useEffect } from 'react';
import { runQAGenerationAction } from '@/app/actions';
import { ResumeContext } from '@/context/resume-context';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { saveUserData } from '@/lib/local-storage';
import { QASkeleton } from '@/components/ui/page-skeletons';
import { usePageTitle } from '@/hooks/use-page-title';
import { notifyAIRequestMade } from '@/hooks/use-daily-usage';
import { CreditsExhaustedModal, useCreditsExhaustedModal } from '@/components/credits-exhausted-modal';
import { QAHeader, QAContent } from './components';
import type { QATopic } from '@/lib/types';

export default function QAPage() {
  const { 
    resumeText, 
    jobDescription, 
    jobRole, 
    jobUrl, 
    qa, 
    setQa, 
    storedResumeText, 
    storedJobDescription, 
    storedJobRole, 
    storedJobUrl, 
    updateStoredValues, 
    isDataLoaded 
  } = useContext(ResumeContext);
  
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<QATopic>("General");
  const { isOpen: isCreditsModalOpen, setIsOpen: setCreditsModalOpen, showModal: showCreditsModal } = useCreditsExhaustedModal();

  // Set page title
  usePageTitle('Resume Q&A');

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

  const hasDataChanged = !!(resumeText && resumeText !== storedResumeText) || 
                         !!(jobDescription && jobDescription !== storedJobDescription) ||
                         !!(jobRole && jobRole !== storedJobRole) ||
                         !!(jobUrl && jobUrl !== storedJobUrl);

  const handleGeneration = async (topic: QATopic, numQuestions: number) => {
    if (!user) {
      toast.error('Authentication Error', { description: 'You must be logged in to generate Q&A.' });
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
    // Clear only the data for the current topic to show the loading state correctly
    if (qa) {
      setQa({ ...qa, [topic]: null });
    } else {
      setQa({ [topic]: null } as any);
    }

    const promise = runQAGenerationAction({ 
      userId: user.uid, 
      resumeText, 
      jobDescription, 
      topic, 
      numQuestions,
      jobRole,
      jobUrl,
    }).then((result) => {
        // Notify navbar to update the usage counter
        notifyAIRequestMade();
        
        const newQaData = { ...qa, [topic]: result } as any;
        setQa(newQaData);
        
        const dataToSave: any = {
            qa: newQaData,
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
      loading: `Generating Q&A for "${topic}"...`,
      success: () => 'Q&A pairs generated successfully!',
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
    return <QASkeleton />;
  }

  return (
    <div className="flex-1 min-h-screen bg-background page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <QAHeader qa={qa} isLoading={isLoading} />
        
        <QAContent
          qa={qa}
          onGenerate={handleGeneration}
          isLoading={isLoading}
          hasDataChanged={hasDataChanged}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
        />
      </div>
      
      {/* Credits Exhausted Modal */}
      <CreditsExhaustedModal 
        open={isCreditsModalOpen} 
        onOpenChange={setCreditsModalOpen}
        featureName="Resume Q&A"
      />
    </div>
  );
}
