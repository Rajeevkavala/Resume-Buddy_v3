'use client';

import { useState } from 'react';
import type { SuggestResumeImprovementsOutput } from '@/ai/flows/suggest-resume-improvements';
import type { TemplateMetadata, TemplateCustomization } from '@/lib/types';
import type { LatexTemplateId } from '@/lib/latex-templates';
import { useSubscription } from '@/context/subscription-context';
import { useAuth } from '@/context/auth-context';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { compileLatexFromResumeTextAction } from '@/app/actions';
import toast from 'react-hot-toast';

import { ImprovementHeader } from './improvement-header';
import { EmptyState } from './empty-state';
import { GeneratingState } from './generating-state';
import { ExportSection } from './export-section';
import { ImpactForecast } from './impact-forecast';
import { ImprovementSummary } from './improvement-summary';
import { ComparisonView } from './comparison-view';
import { AchievementsList } from './achievements-list';
import { SkillsList } from './skills-list';

// Helper to safely convert AI response to string
function toSafeResumeText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value) return '';

  if (typeof value === 'object') {
    try {
      const record = value as Record<string, unknown>;
      const parts: string[] = [];

      const professionalSummary = record.professionalSummary;
      if (typeof professionalSummary === 'string' && professionalSummary.trim()) {
        parts.push('=== PROFESSIONAL SUMMARY ===');
        parts.push(professionalSummary.trim());
      }

      const skills = record.skills;
      if (skills) {
        parts.push('=== SKILLS ===');
        if (typeof skills === 'string') {
          parts.push(skills);
        } else {
          parts.push(JSON.stringify(skills, null, 2));
        }
      }

      const experience = record.experience;
      if (experience) {
        parts.push('=== EXPERIENCE ===');
        parts.push(typeof experience === 'string' ? experience : JSON.stringify(experience, null, 2));
      }

      const projects = record.projects;
      if (projects) {
        parts.push('=== PROJECTS ===');
        parts.push(typeof projects === 'string' ? projects : JSON.stringify(projects, null, 2));
      }

      if (parts.length > 0) {
        return parts.join('\n\n');
      }

      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

interface ImprovementContentProps {
  improvements: SuggestResumeImprovementsOutput | null;
  originalResume: string;
  improvedResumeText?: string;
  onExport: (format: 'docx' | 'pdf', filename?: string, template?: TemplateMetadata, customization?: TemplateCustomization) => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasDataChanged?: boolean;
}

// Blob download utility
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// Base64 to Uint8Array utility
function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function ImprovementContent({
  improvements,
  originalResume,
  improvedResumeText,
  onExport,
  onGenerate,
  isLoading,
  hasDataChanged,
}: ImprovementContentProps) {
  const { user } = useAuth();
  const { canAccessFeature, isLoading: subscriptionLoading } = useSubscription();
  const [isLatexExporting, setIsLatexExporting] = useState(false);
  
  const hasAccess = canAccessFeature('improve-resume');
  const hasImprovements = Boolean(improvements && !hasDataChanged);
  
  // Safe text extraction
  const safeImprovedText = improvedResumeText || toSafeResumeText(improvements?.improvedResumeText);
  const canExportLatex = Boolean(safeImprovedText && safeImprovedText.trim().length > 0);

  // Handle LaTeX export
  const handleLatexExport = async (filename: string, templateId: LatexTemplateId) => {
    const userId = user?.uid;
    if (!userId) {
      toast.error('Please log in to export LaTeX.');
      throw new Error('User not authenticated');
    }
    if (!canExportLatex) {
      toast.error('No improved resume text available.');
      throw new Error('No resume text available');
    }

    setIsLatexExporting(true);
    try {
      const result = await compileLatexFromResumeTextAction({
        userId,
        templateId,
        resumeText: safeImprovedText,
      });

      const pdfBytes = base64ToUint8Array(result.pdfBase64);
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(pdfBlob, `${filename}.pdf`);

      toast.success('Resume PDF downloaded successfully!');
    } catch (error) {
      console.error('LaTeX export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export LaTeX. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLatexExporting(false);
    }
  };

  // Show upgrade prompt for free users
  if (!subscriptionLoading && !hasAccess) {
    return (
      <div className="space-y-6">
        <ImprovementHeader hasImprovements={false} isLoading={false} />
        <UpgradePrompt 
          feature="improve-resume"
          title="Unlock Resume Improvements"
          description="Transform your resume with AI-powered enhancements. Quantify achievements, integrate missing skills, and optimize for ATS systems."
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <ImprovementHeader hasImprovements={false} isLoading={true} />
        <GeneratingState />
      </div>
    );
  }

  // Empty or data changed state
  if (!improvements || hasDataChanged) {
    return (
      <div className="space-y-6">
        <ImprovementHeader 
          hasImprovements={Boolean(improvements)} 
          isLoading={false} 
          hasDataChanged={hasDataChanged} 
        />
        <EmptyState 
          onGenerate={onGenerate} 
          isLoading={isLoading} 
          hasDataChanged={hasDataChanged} 
        />
      </div>
    );
  }

  // Has improvements - show full content
  const { impactForecast, improvementsSummary, quantifiedAchievements, integratedSkills } = improvements;

  return (
    <div className="space-y-6">
      <ImprovementHeader hasImprovements={true} isLoading={false} />
      
      {/* Export Section */}
      <ExportSection
        onExport={onExport}
        onRegenerate={onGenerate}
        onLatexExport={handleLatexExport}
        isLoading={isLoading}
        isLatexExporting={isLatexExporting}
        canExportLatex={canExportLatex}
      />
      
      {/* Impact Forecast */}
      {impactForecast && (
        <ImpactForecast
          atsScore={impactForecast.atsScore || { before: 0, after: 0 }}
          skillsMatch={impactForecast.skillsMatch || { before: 0, after: 0 }}
          quantifiedAchievements={impactForecast.quantifiedAchievements || { before: 0, after: 0 }}
        />
      )}
      
      {/* Improvement Summary */}
      {improvementsSummary && (
        <ImprovementSummary summary={improvementsSummary} />
      )}
      
      {/* Before & After Comparison */}
      <ComparisonView
        originalResume={originalResume}
        improvedResume={safeImprovedText}
      />
      
      {/* Two-column grid for achievements and skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quantified Achievements */}
        {quantifiedAchievements && quantifiedAchievements.length > 0 && (
          <AchievementsList achievements={quantifiedAchievements} />
        )}
        
        {/* Integrated Skills */}
        {integratedSkills && integratedSkills.length > 0 && (
          <SkillsList skills={integratedSkills} />
        )}
      </div>
    </div>
  );
}
