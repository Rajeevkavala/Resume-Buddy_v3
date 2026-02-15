'use client';

import { useState, useContext, useEffect, startTransition } from 'react';
import { runCoverLetterGenerationAction } from '@/app/actions';
import { ResumeContext } from '@/context/resume-context';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { saveUserData } from '@/lib/local-storage';
import { CoverLetterSkeleton } from '@/components/ui/page-skeletons';
import { usePageTitle } from '@/hooks/use-page-title';
import { notifyAIRequestMade } from '@/hooks/use-daily-usage';
import { CreditsExhaustedModal, useCreditsExhaustedModal } from '@/components/credits-exhausted-modal';
import type { GenerateCoverLetterOutput } from '@/ai/flows/generate-cover-letter';

import {
  CoverLetterHeader,
  CoverLetterForm,
  CoverLetterPreview,
  EmptyState,
  NotReadyState,
} from './components';

export type ToneType = 'professional' | 'enthusiastic' | 'confident' | 'conversational';

export default function CoverLetterPage() {
  const { 
    resumeText, 
    jobDescription, 
    jobRole, 
    coverLetter, 
    setCoverLetter, 
    updateStoredValues, 
    isDataLoaded 
  } = useContext(ResumeContext);
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { isOpen: isCreditsModalOpen, setIsOpen: setCreditsModalOpen, showModal: showCreditsModal } = useCreditsExhaustedModal();

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [hiringManagerName, setHiringManagerName] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');

  // Set page title
  usePageTitle('Cover Letter');

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

  // Derived state
  const hasResume = Boolean(resumeText);
  const hasJobContext = Boolean(jobDescription || jobRole);
  const isReadyForGeneration = hasResume && hasJobContext;

  const handleGeneration = async () => {
    if (!user) {
      toast.error('Authentication Error', { 
        description: 'You must be logged in to generate a cover letter.' 
      });
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
    setCoverLetter(null);

    const input = {
      userId: user.uid,
      resumeText,
      jobDescription: jobDescription || '',
      companyName: companyName || undefined,
      hiringManagerName: hiringManagerName || undefined,
      tone,
      jobRole,
    };

    const promise = runCoverLetterGenerationAction(input).then((result: GenerateCoverLetterOutput) => {
      if (!result || !result.coverLetter) {
        throw new Error("The AI failed to generate a cover letter. Please try again.");
      }
      
      notifyAIRequestMade();
      
      startTransition(() => {
        setCoverLetter(result);
        
        const dataToSave: any = {
          coverLetter: result,
          resumeText,
          jobDescription,
        };
        
        if (jobRole) {
          dataToSave.jobRole = jobRole;
        }
        
        saveUserData(user.uid, dataToSave);
        updateStoredValues(resumeText, jobDescription, jobRole);
      });
      
      return result;
    });

    toast.promise(promise, {
      loading: 'Crafting your cover letter...',
      success: () => 'Your cover letter is ready!',
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

  const handleRegenerate = () => {
    setCoverLetter(null);
  };
  
  // Show skeleton loading while page is loading or user not authenticated
  if (isPageLoading || !user) {
    return <CoverLetterSkeleton />;
  }

  // Determine which content to render
  const renderContent = () => {
    // Not ready - missing resume or job context
    if (!isReadyForGeneration) {
      return <NotReadyState hasResume={hasResume} />;
    }

    // Has generated cover letter - show preview
    if (coverLetter) {
      return (
        <CoverLetterPreview 
          coverLetter={coverLetter}
          companyName={companyName}
          onRegenerate={handleRegenerate}
        />
      );
    }

    // Ready for generation - show form
    return (
      <CoverLetterForm
        companyName={companyName}
        setCompanyName={setCompanyName}
        hiringManagerName={hiringManagerName}
        setHiringManagerName={setHiringManagerName}
        tone={tone}
        setTone={setTone}
        onGenerate={handleGeneration}
        isLoading={isLoading}
      />
    );
  };

  return (
    <div className="flex-1 min-h-screen page-enter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <CoverLetterHeader 
          coverLetter={coverLetter} 
          onGenerate={handleGeneration}
          onRegenerate={handleRegenerate}
          isLoading={isLoading}
        />
        
        {renderContent()}
      </div>
      
      {/* Credits Exhausted Modal */}
      <CreditsExhaustedModal 
        open={isCreditsModalOpen} 
        onOpenChange={setCreditsModalOpen}
        featureName="Cover Letter Generator"
      />
    </div>
  );
}
