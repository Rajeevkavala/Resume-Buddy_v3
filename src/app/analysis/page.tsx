'use client';

import { useState, useContext, useEffect, startTransition } from 'react';
import { motion, type Variants } from 'framer-motion';
import { runAnalysisAction } from '@/app/actions';
import { ResumeContext } from '@/context/resume-context';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { saveUserData } from '@/lib/local-storage';
import { 
  AnalysisLoading
} from '@/components/loading-animations';
import { AnalysisSkeleton } from '@/components/ui/page-skeletons';
import { usePageTitle } from '@/hooks/use-page-title';
import { notifyAIRequestMade } from '@/hooks/use-daily-usage';
import { CreditsExhaustedModal, useCreditsExhaustedModal } from '@/components/credits-exhausted-modal';

import {
  AnalysisHeader,
  ScoreOverview,
  ExecutiveSummary,
  SkillsAnalysis,
  IndustryFit,
  QualityAssessment,
  EmptyState,
  NotReadyState,
} from './components';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

export default function AnalysisPage() {
  const { resumeText, jobDescription, jobRole, jobUrl, analysis, setAnalysis, storedResumeText, storedJobDescription, storedJobRole, storedJobUrl, updateStoredValues, isDataLoaded } = useContext(ResumeContext);
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { isOpen: isCreditsModalOpen, setIsOpen: setCreditsModalOpen, showModal: showCreditsModal } = useCreditsExhaustedModal();

  // Set page title
  usePageTitle('Resume Analysis');

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
  const hasDataChanged = !!(resumeText && resumeText !== storedResumeText) || 
                         !!(jobDescription && jobDescription !== storedJobDescription) ||
                         !!(jobRole && jobRole !== storedJobRole) ||
                         !!(jobUrl && jobUrl !== storedJobUrl);

  const hasResume = Boolean(resumeText);
  const hasJobContext = Boolean(jobDescription || jobRole);
  const isReadyForAnalysis = hasResume && hasJobContext;

  const handleGeneration = async () => {
    if (!user) {
      toast.error('Authentication Error', {
        description: 'You must be logged in to generate an analysis.',
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
    setAnalysis(null); // Clear previous analysis

    const promise = runAnalysisAction({ 
      userId: user.uid, 
      resumeText, 
      jobDescription,
      jobRole,
      jobUrl,
    }).then((result) => {
        // Notify navbar to update the usage counter
        notifyAIRequestMade();
        
        startTransition(() => {
          setAnalysis(result);
          // Update local storage asynchronously
          Promise.resolve().then(() => {
            const dataToSave: Record<string, unknown> = {
              analysis: result,
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
          });
        });
        return result;
    });

    toast.promise(promise, {
      loading: 'Analyzing your resume...',
      success: () => 'Analysis Complete!',
      error: (error: Error) => {
        if (error.message && error.message.includes('[503 Service Unavailable]')) {
          return 'API call limit exceeded. Please try again later.';
        }
        if (error.message && (error.message.includes('Daily limit') || (error as { code?: string }).code === 'DAILY_LIMIT_EXCEEDED')) {
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
    return <AnalysisSkeleton />;
  }

  // Determine which content to render
  const renderContent = () => {
    // Not ready - missing resume or job context
    if (!isReadyForAnalysis) {
      return <NotReadyState hasResume={hasResume} />;
    }

    // Loading state
    if (isLoading) {
      return <AnalysisLoading />;
    }

    // No analysis or data changed - show empty/regenerate state
    if (!analysis || hasDataChanged) {
      return (
        <EmptyState 
          onGenerate={handleGeneration} 
          isLoading={isLoading}
          hasDataChanged={hasDataChanged}
          hasExistingAnalysis={!!analysis}
        />
      );
    }

    // Show analysis results
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <ScoreOverview analysis={analysis} />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <ExecutiveSummary summary={analysis.summary} />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <SkillsAnalysis analysis={analysis} />
        </motion.div>
        
        {analysis.industryCompatibility && analysis.industryCompatibility.length > 0 && (
          <motion.div variants={itemVariants}>
            <IndustryFit industryCompatibility={analysis.industryCompatibility} />
          </motion.div>
        )}
        
        {analysis.qualityMetrics && (
          <motion.div variants={itemVariants}>
            <QualityAssessment 
              qualityMetrics={analysis.qualityMetrics}
              actionVerbFeedback={analysis.actionVerbFeedback}
              quantifiableResultsFeedback={analysis.quantifiableResultsFeedback}
            />
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex-1 min-h-screen page-enter">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <AnalysisHeader 
          analysis={analysis} 
          onGenerate={handleGeneration} 
          isLoading={isLoading}
        />
        
        {renderContent()}
      </div>
      
      {/* Credits Exhausted Modal */}
      <CreditsExhaustedModal 
        open={isCreditsModalOpen} 
        onOpenChange={setCreditsModalOpen}
        featureName="Resume Analysis"
      />
    </div>
  );
}
