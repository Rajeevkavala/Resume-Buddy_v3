'use client';

import { useState, useContext, useEffect } from 'react';
import {
  runImprovementsGenerationAction,
  exportDocx,
} from '@/app/actions';
import { ResumeContext } from '@/context/resume-context';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useAuth } from '@/context/auth-context';
import { jsPDF } from 'jspdf';
import { saveUserData } from '@/lib/local-storage';
import { ImprovementSkeleton } from '@/components/ui/page-skeletons';
import { usePageTitle } from '@/hooks/use-page-title';
import { notifyAIRequestMade } from '@/hooks/use-daily-usage';
import { CreditsExhaustedModal, useCreditsExhaustedModal } from '@/components/credits-exhausted-modal';
import { ImprovementContent } from './components';

// Helper to safely convert AI response to string (handles object responses)
function toSafeResumeText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value) return '';
  if (typeof value === 'object') {
    try {
      const record = value as Record<string, unknown>;
      const parts: string[] = [];
      const sections = ['professionalSummary', 'skills', 'experience', 'projects', 'education', 'certifications'];
      for (const key of sections) {
        const content = record[key];
        if (content) {
          parts.push(`=== ${key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()} ===`);
          parts.push(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
        }
      }
      if (parts.length > 0) return parts.join('\n\n');
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function ImprovementPage() {
  const { 
    resumeText, 
    jobDescription, 
    jobRole, 
    jobUrl, 
    improvements, 
    analysis, 
    setImprovements, 
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
  const { isOpen: isCreditsModalOpen, setIsOpen: setCreditsModalOpen, showModal: showCreditsModal } = useCreditsExhaustedModal();

  // Set page title
  usePageTitle('Resume Improvements');

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

  const handleGeneration = async () => {
    if (!user) {
      toast.error('Authentication Error', { description: 'You must be logged in to generate improvements.' });
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
    
    if (!analysis) {
      toast.info("For a more accurate 'before' forecast, run an analysis first.", {
        description: "The AI will estimate the 'before' state for now.",
      });
    }

    setIsLoading(true);
    setImprovements(null);
    
    const promise = runImprovementsGenerationAction({ 
      userId: user.uid, 
      resumeText, 
      jobDescription,
      previousAnalysis: analysis,
      jobRole,
      jobUrl,
    }).then((result) => {
      notifyAIRequestMade();
      setImprovements(result);
      
      const dataToSave: Record<string, unknown> = {
        improvements: result,
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
      loading: 'Generating improvements...',
      success: () => 'Improvements generated successfully!',
      error: (error: Error & { code?: string }) => {
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

  // Client-side PDF export with better formatting
  const exportPdfClient = (text: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        if (!text || text.trim().length === 0) {
          reject(new Error('Resume text is empty. Please generate improvements first.'));
          return;
        }

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxLineWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        const sections = text.split('\n\n');
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i].trim();
          if (!section) continue;

          const lines = section.split('\n');
          
          for (let j = 0; j < lines.length; j++) {
            const line = lines[j].trim();
            if (!line) continue;

            const isHeader = line === line.toUpperCase() || 
                           line.endsWith(':') || 
                           line.startsWith('#');
            
            if (isHeader) {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              if (yPosition > margin) {
                yPosition += 5;
              }
            } else {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
            }

            const estimatedHeight = isHeader ? 8 : 6;
            if (yPosition + estimatedHeight > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }

            const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            const wrappedLines = doc.splitTextToSize(cleanLine, maxLineWidth);
            
            for (const wrappedLine of wrappedLines) {
              if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
              }
              
              doc.text(wrappedLine, margin, yPosition);
              yPosition += isHeader ? 7 : 5.5;
            }

            if (isHeader) {
              yPosition += 2;
            }
          }
          
          if (i < sections.length - 1) {
            yPosition += 4;
          }
        }

        const pdfBlob = doc.output('blob');
        
        if (pdfBlob.size === 0) {
          reject(new Error('Generated PDF is empty. Please try again.'));
          return;
        }
        
        resolve(pdfBlob);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleExport = async (
    format: 'docx' | 'pdf', 
    filename?: string
  ) => {
    const safeResumeText = toSafeResumeText(improvements?.improvedResumeText);
    
    if (!safeResumeText || safeResumeText.trim().length === 0) {
      toast.error('No resume content available', {
        description: 'Please generate improvements first before exporting.'
      });
      return;
    }

    const exportPromise = (async () => {
      try {
        let blob: Blob;
        
        if (format === 'docx') {
          const base64Data = await exportDocx(safeResumeText);
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('DOCX generation returned empty data');
          }
          
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          });
        } else {
          blob = await exportPdfClient(safeResumeText);
        }
        
        if (!blob || blob.size === 0) {
          throw new Error(`Generated ${format.toUpperCase()} file is empty. The file has 0 bytes.`);
        }
        
        saveAs(blob, filename || `Resume_Enhanced.${format}`);
        
        return `File saved: ${filename || `Resume_Enhanced.${format}`}`;
      } catch (error) {
        throw error;
      }
    })();

    toast.promise(exportPromise, {
      loading: `Generating ${format.toUpperCase()} file...`,
      success: () => `✅ Resume exported successfully as ${format.toUpperCase()}!`,
      error: (err: Error) => `❌ Failed to export: ${err.message || 'Unknown error'}`,
    });
  };

  // Show skeleton while loading
  if (isPageLoading) {
    return <ImprovementSkeleton />;
  }

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="flex-1 p-3 sm:p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="max-w-lg mx-auto border-border/60">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <LogIn className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Sign in to Continue</CardTitle>
              <CardDescription>
                Please log in to access Resume Improvements and get AI-powered suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-8 page-enter">
      <div className="max-w-5xl mx-auto">
        <ImprovementContent
          improvements={improvements}
          originalResume={resumeText}
          improvedResumeText={toSafeResumeText(improvements?.improvedResumeText)}
          onExport={handleExport}
          onGenerate={handleGeneration}
          isLoading={isLoading}
          hasDataChanged={hasDataChanged}
        />
      </div>
      
      {/* Credits Exhausted Modal */}
      <CreditsExhaustedModal 
        open={isCreditsModalOpen} 
        onOpenChange={setCreditsModalOpen}
        featureName="Resume Improvements"
      />
    </div>
  );
}
