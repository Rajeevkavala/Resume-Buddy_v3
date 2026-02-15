'use client';

import { useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ResumeContext } from '@/context/resume-context';
import { Button } from '@/components/ui/button';
import { extractText, saveData, clearData } from '../actions';
import { toast } from 'sonner';
import { 
  FileText, 
  Briefcase, 
  Link as LinkIcon, 
  CheckCircle, 
  Upload, 
  Eye,
  Info
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { usePageTitle } from '@/hooks/use-page-title';
import { useRouter } from 'next/navigation';
import { saveUserData, clearUserData as clearLocalData } from '@/lib/local-storage';
import FileUploader from '@/components/file-uploader';
import { RoleSelector } from '@/components/role-selector';
import { JobUrlInput } from '@/components/job-url-input';
import { EnhancedJobDescriptionInput } from '@/components/enhanced-job-description-input';
import { DashboardSkeleton } from '@/components/ui/page-skeletons';
import { WelcomeModal } from '@/components/welcome-modal';
import { cn } from '@/lib/utils';

// Dashboard components
import { 
  DashboardHeader, 
  ProgressStepper, 
  NextStepCard, 
  ActionBar 
} from './components';

export default function Dashboard() {
  const {
    resumeText,
    setResumeText,
    jobDescription,
    setJobDescription,
    jobRole,
    setJobRole,
    jobUrl,
    setJobUrl,
    resumeFile,
    setResumeFile,
    updateStoredValues,
    isDataLoaded,
    hasAnyData,
    analysis,
  } = useContext(ResumeContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const hasCheckedFirstTimeRef = useRef(false);
  const resumeSectionRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Set page title
  usePageTitle('Dashboard');

  // Check for first-time user and show welcome modal
  useEffect(() => {
    if (!isPageLoading && user && !hasCheckedFirstTimeRef.current) {
      hasCheckedFirstTimeRef.current = true;
      
      const welcomeDismissedKey = `resume_buddy_welcome_dismissed_${user.uid}`;
      const hasSeenWelcome = typeof window !== 'undefined' && localStorage.getItem(welcomeDismissedKey);
      
      if (hasSeenWelcome) {
        return;
      }
      
      const isFirstTimeUser = !resumeText && !jobDescription && !jobRole && !jobUrl && !analysis;
      
      if (isFirstTimeUser) {
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isPageLoading, user, resumeText, jobDescription, jobRole, jobUrl, analysis]);

  const handleCloseWelcomeModal = () => {
    if (user) {
      const welcomeDismissedKey = `resume_buddy_welcome_dismissed_${user.uid}`;
      localStorage.setItem(welcomeDismissedKey, 'true');
    }
    setShowWelcomeModal(false);
  };

  const handleUploadSelected = () => {
    setTimeout(() => {
      resumeSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
  };

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
      const timer = setTimeout(() => setIsPageLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, isDataLoaded]);

  const handleAutoExtract = async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);

    setIsLoading(true);

    try {
      const result = await extractText(formData);
      if (result.error) {
        throw new Error(result.error);
      }
      setResumeText(result.text || '');
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveData = async () => {
    if (!user) {
      toast.error('You must be logged in to save data.');
      return;
    }
    if (!resumeText && !jobDescription && !jobRole && !jobUrl) {
      toast.error('There is no data to save.');
      return;
    }

    setIsSaving(true);

    const dataToSave: any = { 
      resumeText, 
      jobDescription,
      analysis: null,
      qa: null,
      interview: null,
      improvements: null,
    };
    
    if (jobRole) {
      dataToSave.jobRole = jobRole;
    }
    
    if (jobUrl) {
      dataToSave.jobUrl = jobUrl;
    }

    const promise = saveData(user.uid, dataToSave).then(() => {
      saveUserData(user.uid, dataToSave);
      updateStoredValues(resumeText, jobDescription, jobRole, jobUrl);
    });

    toast.promise(promise, {
      loading: 'Saving your data...',
      success: 'Data saved successfully!',
      error: 'Failed to save data.',
      finally: () => {
        setIsSaving(false);
      },
    });
  };

  const handleClearData = async () => {
    if (!user) {
      toast.error('You must be logged in to clear data.');
      return;
    }

    const promise = clearData(user.uid).then(() => {
      clearLocalData(user.uid);
      setResumeText('');
      setJobDescription('');
      setJobRole('');
      setJobUrl('');
      setResumeFile(null);
      updateStoredValues('', '', '', '');
    });

    toast.promise(promise, {
      loading: 'Clearing your data...',
      success: () => 'Data cleared successfully!',
      error: 'Failed to clear data.',
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (isPageLoading || authLoading || !user) {
    return <DashboardSkeleton />;
  }

  // Step configuration
  const completionSteps = [
    { name: 'Upload Resume', completed: !!resumeFile || !!resumeText, icon: Upload },
    { name: 'Extract Text', completed: !!resumeText, icon: FileText },
    { name: 'Target Role', completed: !!jobRole, icon: Briefcase },
    { name: 'Job Description', completed: !!jobDescription, icon: LinkIcon },
  ];
  
  const hasAnyInput = Boolean(resumeText || jobDescription || jobRole || jobUrl);
  const isReadyForAI = Boolean(resumeText && jobDescription);

  // Word/char counts
  const resumeWordCount = resumeText ? resumeText.split(/\s+/).filter(Boolean).length : 0;
  const resumeCharCount = resumeText ? resumeText.length : 0;
  const jobDescWordCount = jobDescription ? jobDescription.split(/\s+/).filter(Boolean).length : 0;

  return (
    <>
      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleCloseWelcomeModal}
        onUploadSelected={handleUploadSelected}
      />
      
      {/* Main Content */}
      <div className="flex-1 min-h-screen page-enter">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          
          {/* Header Section */}
          <DashboardHeader 
            userName={user?.displayName}
            resumeText={resumeText}
            jobDescription={jobDescription}
            jobRole={jobRole}
          />

          {/* Progress Stepper */}
          <Card className="border-border/60">
            <CardContent className="p-4 sm:p-6">
              <ProgressStepper steps={completionSteps} />
            </CardContent>
          </Card>

          {/* Next Step Card */}
          <NextStepCard 
            resumeText={resumeText}
            jobRole={jobRole}
            jobDescription={jobDescription}
            onNavigate={(path) => router.push(path)}
          />

          {/* Main Content Grid */}
          <div className="space-y-6">
            
            {/* Job Information Card */}
            <Card id="job-info" className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Job Information</CardTitle>
                      <CardDescription className="text-sm">
                        Tell us about your target position
                      </CardDescription>
                    </div>
                  </div>
                  
                  {jobRole && (
                    <Badge 
                      variant="secondary" 
                      className="bg-success/10 text-success border-0 shrink-0"
                    >
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      <span className="hidden sm:inline">Role selected</span>
                      <span className="sm:hidden">Selected</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5">
                {/* Role Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Target Role
                    <span className="text-destructive">*</span>
                  </Label>
                  <RoleSelector
                    value={jobRole}
                    onValueChange={setJobRole}
                  />
                  {!jobRole && (
                    <p className="text-xs text-muted-foreground">
                      Select your target job role for tailored recommendations
                    </p>
                  )}
                </div>
                
                {/* Job URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    Job Posting URL
                    <Badge variant="outline" className="text-xs font-normal ml-auto">
                      Optional
                    </Badge>
                  </Label>
                  <JobUrlInput
                    value={jobUrl}
                    onChange={setJobUrl}
                    onJobDescriptionExtracted={setJobDescription}
                    existingJobDescription={jobDescription}
                    userId={user?.uid}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Two Column Grid for Resume & Job Description */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Resume Card */}
              <Card 
                id="resume" 
                ref={resumeSectionRef} 
                className="border-border/60"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Your Resume</CardTitle>
                        <CardDescription className="text-sm">
                          Upload and review your resume
                        </CardDescription>
                      </div>
                    </div>
                    
                    {resumeText && (
                      <Badge 
                        variant="secondary" 
                        className="bg-success/10 text-success border-0 shrink-0"
                      >
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Processed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* File Uploader */}
                  <FileUploader
                    file={resumeFile}
                    setFile={setResumeFile}
                    setPreview={setResumeText}
                    onAutoExtract={handleAutoExtract}
                    isExtracting={isLoading}
                  />
                  
                  {/* Extracted Text Preview */}
                  {resumeText && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          Extracted Content
                        </Label>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{resumeWordCount} words</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          <span>{resumeCharCount} chars</span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Your extracted resume text will appear here..."
                          className="min-h-[240px] text-sm font-mono bg-muted/30 resize-none pr-4"
                        />
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Review the text and make edits if needed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Description Card */}
              <Card id="job-description" className="border-border/60">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Job Description</CardTitle>
                        <CardDescription className="text-sm">
                          Paste the job posting details
                        </CardDescription>
                      </div>
                    </div>
                    
                    {jobDescription && (
                      <Badge 
                        variant="secondary" 
                        className="bg-success/10 text-success border-0 shrink-0"
                      >
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        {jobDescWordCount} words
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <EnhancedJobDescriptionInput
                    value={jobDescription}
                    onChange={setJobDescription}
                    jobRole={jobRole}
                  />
                  
                  {!jobDescription && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Pro Tip</p>
                          <p>Copy the full job description including requirements and responsibilities for the most accurate analysis.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Bar */}
          <ActionBar
            hasAnyInput={hasAnyInput}
            isReadyForAI={isReadyForAI}
            isSaving={isSaving}
            onSave={handleSaveData}
            onClear={handleClearData}
            onStartAnalysis={() => router.push('/analysis')}
          />
        </div>
      </div>
    </>
  );
}
