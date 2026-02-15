'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useResume } from '@/context/resume-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import { useAutoSave } from '@/hooks/use-auto-save';
import toast from 'react-hot-toast';
import { LatexTemplateId } from '@/lib/latex-templates';
import { parseResumeText } from '@/lib/resume-parser';
import { ResumeData } from '@/lib/types';
import { compileLatexFromResumeDataAction, parseResumeIntelligentlyAction } from '@/app/actions';
import { notifyAIRequestMade } from '@/hooks/use-daily-usage';
import { CreateResumeSkeleton } from '@/components/ui/page-skeletons';

// Import new components
import {
  BuilderHeader,
  TemplateDropdown,
  AIFillBanner,
  LivePreview,
  MobilePreviewToggle,
  MultiStepForm,
} from './components';

export default function CreateResumePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { resumeText, improvements } = useResume();
  usePageTitle('Resume Builder');
  
  const [selectedTemplate, setSelectedTemplate] = useState<LatexTemplateId>('faang');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFillingFromAI, setIsFillingFromAI] = useState(false);

  const draftKey = user ? `resume_buddy_builder_draft_${user.uid}` : 'resume_buddy_builder_draft_anon';
  const { loadFromStorage } = useAutoSave({
    key: draftKey,
    data: resumeData,
    delay: 500,
    enabled: !!resumeData,
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Restore any saved draft before parsing resumeText.
  useEffect(() => {
    if (draftChecked) return;
    if (authLoading) return;

    const saved = loadFromStorage();
    if (saved?.data) {
      setResumeData(saved.data);
    }

    setDraftChecked(true);
  }, [authLoading, draftChecked, loadFromStorage]);

  // Parse resume data - Load basic data from original resume only
  useEffect(() => {
    if (!draftChecked) return;

    if (!resumeData) {
      setIsLoading(true);
      if (resumeText) {
        try {
          const parsed = parseResumeText(resumeText);
          setResumeData(parsed);
        } catch (error) {
          console.error(error);
          toast.error('Failed to parse resume');
        }
      } else {
        // Create empty resume data structure if no resume text
        setResumeData({
          personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            github: '',
            portfolio: '',
            website: '',
          },
          summary: '',
          skills: [],
          experience: [],
          education: [],
          projects: [],
          certifications: [],
        } as any);
      }
      setIsLoading(false);
    }
  }, [resumeText, resumeData, draftChecked]);

  // Handle resume data changes
  const handleResumeDataChange = useCallback((newData: ResumeData) => {
    setResumeData(newData);
  }, []);

  // Export handler utilities
  const downloadBlob = useCallback((blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const base64ToUint8Array = useCallback((base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }, []);

  const handleExport = useCallback(async (filename: string, templateId: LatexTemplateId) => {
    if (!user?.uid) {
      toast.error('Please log in to export PDF.');
      throw new Error('User not authenticated');
    }

    if (!resumeData) {
      toast.error('No resume data to export.');
      throw new Error('No resume data');
    }

    setIsExporting(true);
    try {
      const result = await compileLatexFromResumeDataAction({
        userId: user.uid,
        templateId,
        resumeData,
      });

      // Only download PDF file
      const pdfBytes = base64ToUint8Array(result.pdfBase64);
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(pdfBlob, `${filename}.pdf`);

      toast.success('Resume PDF downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [user?.uid, resumeData, downloadBlob, base64ToUint8Array]);

  // Fill from AI improvements
  const handleFillFromAI = useCallback(async () => {
    if (!improvements) return;

    // PHASE 1: Structured Data (Preferred)
    if (improvements.structuredResumeData) {
      setIsFillingFromAI(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setResumeData(improvements.structuredResumeData as unknown as ResumeData);
        toast.success('Resume updated with AI improvements!', { duration: 3000 });
      } catch (e) {
        console.error('Error applying structured data', e);
        toast.error('Failed to apply improvements.');
      } finally {
        setIsFillingFromAI(false);
      }
      return;
    }

    // PHASE 2: Text Parsing (Fallback)
    if (!improvements.improvedResumeText) {
      toast.error('No improved resume text available');
      return;
    }

    setIsFillingFromAI(true);
    try {
      const result = await parseResumeIntelligentlyAction(improvements.improvedResumeText, user?.uid);
      
      if (result.success && result.data) {
        if (user?.uid) {
          notifyAIRequestMade();
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        setResumeData(result.data);
        toast.success('Resume updated with AI improvements!', { duration: 3000 });
      } else {
        if (result.error && (result.error.includes('Daily limit') || result.error.includes('Rate limit'))) {
          toast.error(result.error, { duration: 5000 });
          return;
        }
        
        // Fallback to basic parsing
        const parsed = parseResumeText(improvements.improvedResumeText);
        await new Promise(resolve => setTimeout(resolve, 500));
        setResumeData(parsed);
        toast.success('Resume updated!', { duration: 3000 });
      }
    } catch (error: any) {
      console.error('Error parsing improved resume:', error);
      if (error.message && (error.message.includes('Daily limit') || error.message.includes('Rate limit'))) {
        toast.error(error.message, { duration: 5000 });
      } else {
        toast.error('Failed to parse improved resume. Please try again.');
      }
    } finally {
      setIsFillingFromAI(false);
    }
  }, [improvements, user?.uid]);

  // Calculate section completion
  const hasImprovements = Boolean(improvements?.improvedResumeText || improvements?.structuredResumeData);

  // Loading state
  if (authLoading || isLoading) {
    return <CreateResumeSkeleton />;
  }

  // Empty state
  if (!resumeData) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border/60 rounded-lg min-h-[500px] bg-muted/30">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Resume Data</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-sm">
              Please upload and analyze your resume first to use the resume builder
            </p>
            <Button onClick={() => router.push('/dashboard')} className="gap-2">
              <FileText className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 page-enter">
      {/* AI Processing Overlay */}
      {isFillingFromAI && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-80 border-border/60 shadow-lg p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium">Applying AI Improvements</h3>
                <p className="text-sm text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <BuilderHeader hasImprovements={hasImprovements} />
        
        {/* No resume uploaded guidance */}
        {!resumeText && (
          <div className="p-4 rounded-lg border border-border/60 bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-sm">No resume uploaded yet</p>
                  <p className="text-xs text-muted-foreground">
                    You can build from scratch here, or upload your resume first for faster editing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => router.push('/dashboard#resume')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Upload Resume
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Split Layout - 9/3 grid for better form space */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 lg:pb-0">
          
          {/* LEFT PANEL - Form (9 cols for spacious editing) */}
          <div className="lg:col-span-9">
            <div className="rounded-xl border border-border/60 bg-card">
              {/* Template & AI Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 border-b border-border/40">
                <div className="flex-1 min-w-0">
                  <TemplateDropdown
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={setSelectedTemplate}
                  />
                </div>
                {hasImprovements && (
                  <AIFillBanner
                    hasImprovements={hasImprovements}
                    onFill={handleFillFromAI}
                    isLoading={isFillingFromAI}
                  />
                )}
              </div>
              
              {/* Multi-Step Form - No fixed height, natural flow */}
              <div className="p-4 sm:p-5">
                <MultiStepForm
                  resumeData={resumeData}
                  onResumeDataChange={handleResumeDataChange}
                />
              </div>
            </div>
          </div>
          
          {/* RIGHT PANEL - Preview (3 cols, compact reference) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 rounded-xl border border-border/60 bg-card overflow-hidden">
              <LivePreview
                resumeData={resumeData}
                templateId={selectedTemplate}
                onExport={handleExport}
                isExporting={isExporting}
              />
            </div>
          </div>
          
        </div>
        
        {/* Mobile: Fixed Bottom Navigation */}
        <MobilePreviewToggle
          resumeData={resumeData}
          templateId={selectedTemplate}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
}
