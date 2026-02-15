 'use client';

import React, { useState } from 'react';
import type {SuggestResumeImprovementsOutput} from '@/ai/flows/suggest-resume-improvements';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {Download, FileText, RefreshCw, ArrowRight, TrendingUp, CheckCircle, Target, Sparkles, Wand2, BarChart3, Eye, CheckSquare, Plus } from 'lucide-react';

import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from './ui/table';
import { TemplateExportDialog } from './template-export-dialog';
import type { TemplateMetadata, TemplateCustomization } from '@/lib/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';
import { compileLatexFromResumeTextAction } from '@/app/actions';
import type { LatexTemplateId } from '@/lib/latex-templates';
import { LATEX_TEMPLATE_ASSETS } from '@/lib/latex-templates';
import { LatexTemplateSelect } from '@/components/latex-template-select';
import { LatexExportDialog } from '@/components/latex-export-dialog';

function toSafeResumeText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value) return '';

  // Common case observed in production: model returns a structured object.
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

interface ImprovementsTabProps {
  improvements: SuggestResumeImprovementsOutput | null;
  originalResume: string;
  onExport: (format: 'docx' | 'pdf', filename?: string, template?: TemplateMetadata, customization?: TemplateCustomization) => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasDataChanged?: boolean;
  improvedResumeText?: string; // For template-based PDF export
}

const ExportDialog = ({ 
  format, 
  onExport, 
  children 
}: { 
  format: 'docx' | 'pdf', 
  onExport: (format: 'docx' | 'pdf', filename?: string) => void,
  children: React.ReactNode 
}) => {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState(`Resume_Enhanced.${format}`);

  const handleExport = () => {
    // Ensure filename has correct extension
    const cleanFilename = filename.replace(/\.(docx|pdf)$/i, '');
    const finalFilename = `${cleanFilename}.${format}`;
    onExport(format, finalFilename);
    setOpen(false);
  };

  const formatName = format.toUpperCase();
  const isValidFilename = filename.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format === 'docx' ? <FileText className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            Export as {formatName}
          </DialogTitle>
          <DialogDescription>
            Choose a filename for your enhanced resume. The file will be downloaded to your device.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={`Resume_Enhanced.${format}`}
              className={!isValidFilename ? "border-red-500" : ""}
            />
            {!isValidFilename && (
              <p className="text-sm text-red-500">Please enter a valid filename</p>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Naming Tips</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• "Resume_John_Doe_Software_Engineer.{format}"</li>
                <li>• "Resume_Company_Position_2024.{format}"</li>
                <li>• "Enhanced_Resume_JobApplication.{format}"</li>
              </ul>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>File will be saved as: <strong>{filename.replace(/\.(docx|pdf)$/i, '')}.{format}</strong></span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!isValidFilename}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50"
          >
            {format === 'docx' ? <FileText className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
            Download {formatName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ImprovementsTab({
  improvements,
  originalResume,
  onExport,
  onGenerate,
  isLoading,
  hasDataChanged,
  improvedResumeText,
}: ImprovementsTabProps) {
  const { user } = useAuth();
  const [isLatexExporting, setIsLatexExporting] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const base64ToUint8Array = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const getButtonContent = () => {
    if (isLoading) {
      return <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>Generating...</>;
    }
    if (improvements && hasDataChanged) {
      return <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate Improvements</>;
    }
    return 'Generate Improvements';
  }

  if (!improvements || hasDataChanged) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-primary/20 rounded-xl min-h-[600px] bg-gradient-to-br from-primary/5 to-transparent">
        <div className="mb-6 p-4 rounded-full bg-primary/10 backdrop-blur-sm">
          <Wand2 className="h-8 w-8 text-primary animate-pulse" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {improvements && hasDataChanged ? 'Content Updated - Regenerate Improvements' : 'Transform Your Resume with AI'}
        </h3>
        
        <p className="text-muted-foreground mb-8 max-w-lg leading-relaxed">
          {improvements && hasDataChanged
            ? 'Your resume or job description has been updated. Regenerate to get fresh, personalized improvements and optimizations.'
            : 'Let our AI transform your resume by quantifying achievements, integrating missing skills, and optimizing for ATS systems to maximize your job prospects.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-2xl">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">Quantify Impact</h4>
            <p className="text-xs text-muted-foreground">Add metrics to achievements</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">Integrate Skills</h4>
            <p className="text-xs text-muted-foreground">Weave in missing keywords</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">ATS Optimize</h4>
            <p className="text-xs text-muted-foreground">Improve system compatibility</p>
          </div>
        </div>
        
        <Button 
          onClick={onGenerate} 
          disabled={isLoading} 
          size="lg" 
          className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3"></div>Analyzing and enhancing...</>
          ) : (
            <><Sparkles className="mr-3 h-5 w-5" /> {improvements && hasDataChanged ? 'Regenerate Improvements' : 'Transform My Resume'}</>
          )}
        </Button>
      </div>
    );
  }
  
  const { impactForecast, improvementsSummary, quantifiedAchievements, integratedSkills, improvedResumeText: rawImprovedText } = improvements;
  const improvedResumeTextSafe = toSafeResumeText(rawImprovedText);
    const improvedResumeTextForExport = improvedResumeText || toSafeResumeText(improvements?.improvedResumeText);
    const canExportLatex = Boolean(improvedResumeTextForExport && improvedResumeTextForExport.trim().length > 0);

    const handleExportLatex = async (filename: string, templateId: LatexTemplateId) => {
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
          resumeText: improvedResumeTextForExport,
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

    const forecastRows = [
    {
      label: 'ATS score',
      before: impactForecast?.atsScore?.before ?? 0,
      after: impactForecast?.atsScore?.after ?? 0,
      suffix: '%',
    },
    {
      label: 'Skills match',
      before: impactForecast?.skillsMatch?.before ?? 0,
      after: impactForecast?.skillsMatch?.after ?? 0,
      suffix: '%',
    },
    {
      label: 'Quantified achievements',
      before: impactForecast?.quantifiedAchievements?.before ?? 0,
      after: impactForecast?.quantifiedAchievements?.after ?? 0,
      suffix: '',
    },
    ];

  return (
    <div className="space-y-6">

      {/* Export first */}
      <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-xl">Export</CardTitle>
          <CardDescription>Download your improved resume</CardDescription>
        </div>
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="shrink-0">
          {isLoading ? (
          <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />Regenerating...</>
          ) : (
          <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</>
          )}
        </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <LatexExportDialog
          onExport={handleExportLatex}
          isExporting={isLatexExporting}
        >
          <Button 
            disabled={!canExportLatex}
            className="w-full sm:w-auto text-sm sm:text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </Button>
        </LatexExportDialog>
        <TemplateExportDialog format="docx" onExport={onExport}>
          <Button variant="outline" className="w-full sm:w-auto border-primary/20 text-sm sm:text-base">
          <Download className="mr-2 h-4 w-4" />
          Export as DOCX
          </Button>
        </TemplateExportDialog>
        </div>
      </CardContent>
      </Card>
      
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Improvement Summary</CardTitle>
              <CardDescription>Overview of all enhancements made to your resume</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-primary">
            <p className="text-sm leading-relaxed text-foreground">
              {improvementsSummary}
            </p>
          </div>
        </CardContent>
      </Card>

       <Card className="border-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Before & After Comparison</CardTitle>
              <CardDescription>See the transformation side by side</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground">
                        Original Resume
                    </h3>
                  </div>
                  <ScrollArea className="h-64 sm:h-80 lg:h-96 rounded-lg border border-border p-3 sm:p-4 bg-muted/30">
                      <p className="text-xs sm:text-sm whitespace-pre-wrap text-foreground leading-relaxed break-words">{originalResume}</p>
                  </ScrollArea>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="font-semibold text-xs sm:text-sm text-primary">
                        Enhanced Resume
                    </h3>
                  </div>
                  <ScrollArea className="h-64 sm:h-80 lg:h-96 rounded-lg border border-primary/30 p-3 sm:p-4 bg-primary/5">
                      <p className="text-xs sm:text-sm whitespace-pre-wrap text-foreground leading-relaxed break-words">
                      {improvedResumeTextSafe}
                      </p>
                  </ScrollArea>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Simpler Impact Forecast */}
      <Card className="border-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Impact Forecast</CardTitle>
              <CardDescription>Estimated change after applying the improvements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/20">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastRows.map((row) => {
                  const delta = row.after - row.before;
                  const sign = delta >= 0 ? '+' : '';
                  return (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right">{row.before}{row.suffix}</TableCell>
                      <TableCell className="text-right">{row.after}{row.suffix}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{sign}{delta}{row.suffix}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            These are estimates to help you understand the expected improvement.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-primary/10">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Quantified Achievements</CardTitle>
                        <CardDescription>Vague tasks transformed into measurable impact</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] sm:h-[350px]">
                    <div className="space-y-3 sm:space-y-4">
                        {(quantifiedAchievements ?? []).map((item, index) => (
                            <div key={index} className="p-3 sm:p-4 rounded-lg border bg-gradient-to-br from-card to-card/50 hover:shadow-sm transition-all duration-200">
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                        <Badge variant="outline" className="text-xs">{item.section}</Badge>
                                    </div>
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div className="p-2 sm:p-3 bg-muted rounded border-l-4 border-muted-foreground/50">
                                            <p className="text-muted-foreground line-through break-words">{item.original || 'General duty'}</p>
                                        </div>
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary mt-1 flex-shrink-0" />
                                            <div className="p-2 sm:p-3 bg-primary/10 rounded border-l-4 border-primary flex-1 min-w-0">
                                                <p className="font-medium text-foreground break-words">{item.improved}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
        
        <Card className="group hover:shadow-lg transition-all duration-300 border-primary/10">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Integrated Skills</CardTitle>
                        <CardDescription>Missing keywords naturally woven into your content</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[300px] sm:h-[350px]">
                    <div className="space-y-2 sm:space-y-3">
                        {(integratedSkills ?? []).map((item, index) => (
                            <div key={index} className="p-3 sm:p-4 rounded-lg border bg-gradient-to-br from-card to-card/50 hover:shadow-sm transition-all duration-200">
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                            {item.skill}
                                        </Badge>
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                    </div>
                                    <div className="p-2 sm:p-3 bg-muted rounded border-l-4 border-primary">
                                        <p className="text-xs sm:text-sm text-foreground italic break-words">
                                            "...{item.integrationPoint}..."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
