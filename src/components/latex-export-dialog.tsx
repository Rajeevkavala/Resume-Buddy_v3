'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Download, 
  Eye, 
  AlertCircle,
  Loader2,
  FileCode,
  Zap,
  Star,
  Info,
  ExternalLink,
  Check,
  Settings,
  Code2,
  Users,
  TrendingUp,
  Shield,
  FileDown,
  ChevronDown,
  Target,
  Briefcase,
  Crown,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { LatexTemplateId, LatexTemplate } from '@/lib/latex-templates';
import { LATEX_TEMPLATES, getTemplateById } from '@/lib/latex-templates';
import { ExportProgress, type ExportStage } from '@/components/export-progress';

// Templates that are currently available (only FAANG and Jake for now)
const AVAILABLE_TEMPLATES: LatexTemplateId[] = ['faang', 'jake'];
import { useSubscription } from '@/context/subscription-context';
import Link from 'next/link';

interface LatexExportDialogProps {
  onExport: (filename: string, templateId: LatexTemplateId) => Promise<void>;
  isExporting: boolean;
  children: React.ReactNode;
  defaultFilename?: string;
}

// Template preview SVG icons for each template type
const TemplatePreviewIcon = ({ templateId, className }: { templateId: LatexTemplateId; className?: string }) => {
  const baseClass = cn("w-full h-full", className);
  
  switch (templateId) {
    case 'professional':
      return (
        <svg className={baseClass} viewBox="0 0 100 140" fill="none">
          <rect x="5" y="5" width="90" height="130" rx="2" className="fill-card stroke-border" strokeWidth="1"/>
          {/* Header with name and photo */}
          <rect x="10" y="10" width="55" height="10" rx="1" className="fill-foreground/80"/>
          <rect x="10" y="22" width="45" height="3" rx="0.5" className="fill-muted/60"/>
          <rect x="10" y="27" width="50" height="2" rx="0.5" className="fill-blue-500/50"/>
          {/* Photo placeholder */}
          <rect x="70" y="10" width="20" height="25" rx="1" className="fill-muted/30 stroke-muted" strokeWidth="0.5"/>
          <circle cx="80" cy="18" r="5" className="fill-muted/50"/>
          <rect x="73" y="25" width="14" height="8" rx="1" className="fill-muted/40"/>
          {/* Summary section */}
          <rect x="10" y="42" width="35" height="3" rx="0.5" className="fill-primary"/>
          <line x1="10" y1="47" x2="90" y2="47" className="stroke-foreground/60" strokeWidth="0.5"/>
          <rect x="12" y="51" width="2" height="2" rx="0.5" className="fill-primary/60"/>
          <rect x="16" y="51" width="70" height="2" rx="0.5" className="fill-muted/60"/>
          {/* Education section */}
          <rect x="10" y="60" width="40" height="3" rx="0.5" className="fill-primary"/>
          <line x1="10" y1="65" x2="90" y2="65" className="stroke-foreground/60" strokeWidth="0.5"/>
          <rect x="12" y="69" width="2" height="2" rx="0.5" className="fill-primary/60"/>
          <rect x="16" y="69" width="65" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="16" y="73" width="50" height="2" rx="0.5" className="fill-muted/50"/>
          {/* Skills section */}
          <rect x="10" y="82" width="25" height="3" rx="0.5" className="fill-primary"/>
          <line x1="10" y1="87" x2="90" y2="87" className="stroke-foreground/60" strokeWidth="0.5"/>
          <rect x="12" y="91" width="2" height="2" rx="0.5" className="fill-primary/60"/>
          <rect x="16" y="91" width="70" height="2" rx="0.5" className="fill-muted/60"/>
          {/* Experience section */}
          <rect x="10" y="100" width="40" height="3" rx="0.5" className="fill-primary"/>
          <line x1="10" y1="105" x2="90" y2="105" className="stroke-foreground/60" strokeWidth="0.5"/>
          <rect x="12" y="109" width="2" height="2" rx="0.5" className="fill-primary/60"/>
          <rect x="16" y="109" width="65" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="16" y="113" width="45" height="2" rx="0.5" className="fill-muted/50"/>
          {/* Declaration section */}
          <rect x="10" y="122" width="35" height="3" rx="0.5" className="fill-primary"/>
          <line x1="10" y1="127" x2="90" y2="127" className="stroke-foreground/60" strokeWidth="0.5"/>
        </svg>
      );
    case 'faang':
      return (
        <svg className={baseClass} viewBox="0 0 100 140" fill="none">
          <rect x="5" y="5" width="90" height="130" rx="2" className="fill-card stroke-border" strokeWidth="1"/>
          <rect x="20" y="12" width="60" height="10" rx="1" className="fill-primary/30"/>
          <rect x="30" y="26" width="40" height="3" rx="0.5" className="fill-cyan-500/60"/>
          <line x1="15" y1="38" x2="85" y2="38" className="stroke-primary/40" strokeWidth="0.5"/>
          <rect x="15" y="42" width="40" height="3" rx="0.5" className="fill-teal-600"/>
          <rect x="15" y="50" width="70" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="55" width="65" height="2" rx="0.5" className="fill-muted/60"/>
          <line x1="15" y1="65" x2="85" y2="65" className="stroke-primary/40" strokeWidth="0.5"/>
          <rect x="15" y="69" width="35" height="3" rx="0.5" className="fill-teal-600"/>
          <rect x="15" y="77" width="70" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="82" width="55" height="2" rx="0.5" className="fill-muted/60"/>
          <line x1="15" y1="92" x2="85" y2="92" className="stroke-primary/40" strokeWidth="0.5"/>
          <rect x="15" y="96" width="30" height="3" rx="0.5" className="fill-teal-600"/>
          <rect x="15" y="104" width="70" height="2" rx="0.5" className="fill-muted/60"/>
        </svg>
      );
    case 'jake':
      return (
        <svg className={baseClass} viewBox="0 0 100 140" fill="none">
          <rect x="5" y="5" width="90" height="130" rx="2" className="fill-card stroke-border" strokeWidth="1"/>
          <rect x="25" y="12" width="50" height="12" rx="1" className="fill-slate-800 dark:fill-slate-200"/>
          <rect x="20" y="28" width="60" height="3" rx="0.5" className="fill-muted"/>
          <line x1="10" y1="38" x2="90" y2="38" className="stroke-foreground" strokeWidth="1"/>
          <rect x="10" y="44" width="35" height="4" rx="0.5" className="fill-foreground/80"/>
          <rect x="10" y="52" width="80" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="57" width="70" height="2" rx="0.5" className="fill-muted/50"/>
          <rect x="15" y="62" width="65" height="2" rx="0.5" className="fill-muted/50"/>
          <line x1="10" y1="72" x2="90" y2="72" className="stroke-foreground" strokeWidth="1"/>
          <rect x="10" y="78" width="40" height="4" rx="0.5" className="fill-foreground/80"/>
          <rect x="10" y="86" width="80" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="91" width="75" height="2" rx="0.5" className="fill-muted/50"/>
          <line x1="10" y1="101" x2="90" y2="101" className="stroke-foreground" strokeWidth="1"/>
          <rect x="10" y="107" width="30" height="4" rx="0.5" className="fill-foreground/80"/>
        </svg>
      );
    case 'deedy':
      return (
        <svg className={baseClass} viewBox="0 0 100 140" fill="none">
          <rect x="5" y="5" width="90" height="130" rx="2" className="fill-card stroke-border" strokeWidth="1"/>
          <rect x="10" y="10" width="35" height="15" rx="1" className="fill-blue-800"/>
          <rect x="47" y="10" width="25" height="4" rx="0.5" className="fill-blue-600/60"/>
          <line x1="47" y1="30" x2="90" y2="30" className="stroke-blue-600/40" strokeWidth="0.5"/>
          <rect x="10" y="32" width="30" height="3" rx="0.5" className="fill-primary/60"/>
          <rect x="10" y="40" width="28" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="10" y="45" width="25" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="47" y="35" width="40" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="47" y="40" width="38" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="47" y="45" width="35" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="10" y="55" width="25" height="3" rx="0.5" className="fill-primary/60"/>
          <rect x="10" y="63" width="28" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="10" y="68" width="25" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="47" y="55" width="35" height="3" rx="0.5" className="fill-blue-600"/>
          <rect x="47" y="63" width="40" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="47" y="68" width="38" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="47" y="73" width="35" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="47" y="85" width="30" height="3" rx="0.5" className="fill-blue-600"/>
          <rect x="47" y="93" width="40" height="2" rx="0.5" className="fill-muted/60"/>
        </svg>
      );
    case 'modern':
      return (
        <svg className={baseClass} viewBox="0 0 100 140" fill="none">
          <rect x="5" y="5" width="90" height="130" rx="2" className="fill-card stroke-border" strokeWidth="1"/>
          <rect x="25" y="12" width="50" height="12" rx="1" className="fill-primary"/>
          <rect x="30" y="28" width="40" height="3" rx="0.5" className="fill-muted/80"/>
          <rect x="15" y="42" width="30" height="4" rx="0.5" className="fill-primary"/>
          <line x1="15" y1="48" x2="85" y2="48" className="stroke-primary" strokeWidth="0.5"/>
          <rect x="15" y="54" width="70" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="59" width="65" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="64" width="60" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="76" width="35" height="4" rx="0.5" className="fill-primary"/>
          <line x1="15" y1="82" x2="85" y2="82" className="stroke-primary" strokeWidth="0.5"/>
          <rect x="15" y="88" width="70" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="93" width="55" height="2" rx="0.5" className="fill-muted/60"/>
          <rect x="15" y="105" width="25" height="4" rx="0.5" className="fill-primary"/>
          <line x1="15" y1="111" x2="85" y2="111" className="stroke-primary" strokeWidth="0.5"/>
          <rect x="15" y="117" width="70" height="2" rx="0.5" className="fill-muted/60"/>
        </svg>
      );
    case 'minimal':
      return (
        <svg className={baseClass} viewBox="0 0 100 140" fill="none">
          <rect x="5" y="5" width="90" height="130" rx="2" className="fill-card stroke-border" strokeWidth="1"/>
          <rect x="15" y="15" width="45" height="8" rx="0.5" className="fill-foreground/80"/>
          <rect x="15" y="28" width="55" height="2" rx="0.5" className="fill-muted/40"/>
          <line x1="15" y1="40" x2="85" y2="40" className="stroke-muted/30" strokeWidth="0.5"/>
          <rect x="15" y="50" width="70" height="2" rx="0.5" className="fill-muted/50"/>
          <rect x="15" y="55" width="65" height="2" rx="0.5" className="fill-muted/50"/>
          <rect x="15" y="60" width="60" height="2" rx="0.5" className="fill-muted/50"/>
          <rect x="15" y="75" width="30" height="4" rx="0.5" className="fill-foreground/70"/>
          <rect x="15" y="84" width="70" height="2" rx="0.5" className="fill-muted/50"/>
          <rect x="15" y="89" width="60" height="2" rx="0.5" className="fill-muted/50"/>
          <rect x="15" y="104" width="25" height="4" rx="0.5" className="fill-foreground/70"/>
          <rect x="15" y="113" width="70" height="2" rx="0.5" className="fill-muted/50"/>
          <rect x="15" y="118" width="55" height="2" rx="0.5" className="fill-muted/50"/>
        </svg>
      );
    case 'tech':
      return (
        <svg className={baseClass} viewBox="0 0 100 140" fill="none">
          <rect x="5" y="5" width="90" height="130" rx="2" className="fill-slate-900 stroke-emerald-500/30" strokeWidth="1"/>
          <text x="50" y="22" textAnchor="middle" className="fill-emerald-400 text-[8px] font-mono">&lt;Dev /&gt;</text>
          <rect x="20" y="28" width="60" height="2" rx="0.5" className="fill-emerald-500/50"/>
          <rect x="15" y="42" width="40" height="3" rx="0.5" className="fill-emerald-400"/>
          <line x1="15" y1="48" x2="85" y2="48" className="stroke-emerald-500" strokeWidth="1"/>
          <rect x="15" y="54" width="70" height="2" rx="0.5" className="fill-slate-400"/>
          <rect x="15" y="59" width="65" height="2" rx="0.5" className="fill-slate-500"/>
          <rect x="15" y="64" width="55" height="2" rx="0.5" className="fill-slate-500"/>
          <rect x="15" y="76" width="35" height="3" rx="0.5" className="fill-emerald-400"/>
          <line x1="15" y1="82" x2="85" y2="82" className="stroke-emerald-500" strokeWidth="1"/>
          <rect x="15" y="88" width="70" height="2" rx="0.5" className="fill-slate-400"/>
          <rect x="15" y="93" width="60" height="2" rx="0.5" className="fill-slate-500"/>
          <rect x="15" y="105" width="30" height="3" rx="0.5" className="fill-emerald-400"/>
          <line x1="15" y1="111" x2="85" y2="111" className="stroke-emerald-500" strokeWidth="1"/>
          <rect x="15" y="117" width="70" height="2" rx="0.5" className="fill-slate-400"/>
        </svg>
      );
    default:
      return null;
  }
};

export function LatexExportDialog({
  onExport,
  isExporting,
  children,
  defaultFilename = 'Resume-Enhanced',
}: LatexExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState(defaultFilename);
  const [templateId, setTemplateId] = useState<LatexTemplateId>('faang');
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');
  const [exportStage, setExportStage] = useState<ExportStage>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Subscription state for export limits
  const { 
    tier, 
    dailyExportsRemaining, 
    dailyExportsUsed,
    limits,
    hasExportsRemaining, 
    getExportLimitMessage,
    refreshExportUsage,
  } = useSubscription();
  
  const canExport = hasExportsRemaining();
  const isUnlimited = dailyExportsRemaining === -1;

  // Reset export state when dialog closes
  useEffect(() => {
    if (!open) {
      setExportStage('idle');
      setExportError(null);
    }
  }, [open]);
  
  // Refresh export usage when dialog opens
  useEffect(() => {
    if (open) {
      refreshExportUsage();
    }
  }, [open, refreshExportUsage]);

  const handleExport = useCallback(async () => {
    if (!isValidFilename) {
      toast.error('Please enter a valid filename');
      return;
    }

    const cleanFilename = filename.replace(/\.(tex|pdf)$/i, '');
    const template = getTemplateById(templateId);

    try {
      setExportStage('preparing');
      setExportError(null);
      
      // Short delay to show preparing stage
      await new Promise(resolve => setTimeout(resolve, 300));
      setExportStage('compiling');
      
      await onExport(cleanFilename, templateId);
      
      setExportStage('downloading');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setExportStage('complete');
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Resume exported successfully!</span>
        </div>,
        { id: 'latex-export', duration: 4000 }
      );
      
      // Close dialog after animation
      setTimeout(() => setOpen(false), 1500);
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error.message || 'Please try again';
      setExportStage('error');
      setExportError(errorMessage);
      toast.error(
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium">Export failed</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        </div>,
        { id: 'latex-export', duration: 5000 }
      );
      // Reset error state after delay
      setTimeout(() => {
        setExportStage('idle');
        setExportError(null);
      }, 3000);
    }
  }, [filename, templateId, onExport]);

  const isValidFilename = filename.trim().length > 0;
  const selectedTemplate = getTemplateById(templateId);
  // Sort templates: recommended first, then popular, then by ATS score
  const templates = Object.values(LATEX_TEMPLATES).sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return b.atsScore - a.atsScore;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] p-0 overflow-hidden border-border/60 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <FileCode className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-2xl font-bold text-foreground">
                Export as LaTeX
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1 text-muted-foreground line-clamp-2">
                Choose a professional template and generate high-quality LaTeX source with PDF
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content - Stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Template Selection - Left Side / Top on mobile */}
          <div className="flex-1 min-h-0 lg:border-r flex flex-col">
            <div className="p-3 sm:p-4 border-b bg-muted/30 flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Choose Your Template
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select from professionally designed templates
              </p>
            </div>
            <ScrollArea className="flex-1 min-h-[150px] max-h-[200px] lg:max-h-none">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {templates.map((template) => (
                  <TemplateOption
                    key={template.id}
                    template={template}
                    isSelected={templateId === template.id}
                    onClick={() => setTemplateId(template.id)}
                    disabled={isExporting}
                    isAvailable={AVAILABLE_TEMPLATES.includes(template.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Template Details - Right Side / Bottom on mobile */}
          <div className="w-full lg:w-[320px] xl:w-[350px] bg-muted/20 flex flex-col min-h-0 border-t lg:border-t-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full rounded-none border-b bg-transparent p-0 h-auto flex-shrink-0">
                <TabsTrigger 
                  value="preview" 
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 sm:py-3 text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 sm:py-3 text-xs sm:text-sm"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="flex-1 overflow-auto p-3 sm:p-4 mt-0 max-h-[200px] lg:max-h-none">
                <TemplatePreview template={selectedTemplate} />
              </TabsContent>

              <TabsContent value="settings" className="flex-1 overflow-auto p-3 sm:p-4 mt-0 max-h-[200px] lg:max-h-none">
                <div className="space-y-3 sm:space-y-4">
                  {/* Filename Input */}
                  <div className="space-y-2">
                    <Label htmlFor="filename" className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Filename
                    </Label>
                    <Input
                      id="filename"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="Resume-Enhanced"
                      disabled={isExporting}
                      className={cn(
                        'transition-all',
                        !isValidFilename ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'
                      )}
                    />
                    {!isValidFilename && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Please enter a valid filename
                      </p>
                    )}
                  </div>

                  {/* Output Files Info */}
                  <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      What you'll get
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          <strong className="text-foreground">{filename || 'Resume'}.tex</strong>
                          <span className="text-muted-foreground"> - Editable LaTeX source</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>
                          <strong className="text-foreground">{filename || 'Resume'}.pdf</strong>
                          <span className="text-muted-foreground"> - Ready-to-use PDF</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-muted-foreground">ATS-optimized formatting</span>
                      </li>
                    </ul>
                  </div>

                  {/* Tips */}
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Tip:</strong> The LaTeX source file can be edited 
                        in Overleaf, TeXstudio, or any LaTeX editor for further customization.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t bg-muted/30 flex-shrink-0">
          {/* Export limit warning for free users at limit */}
          {!canExport && tier === 'free' && (
            <div className="w-full mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    {getExportLimitMessage()}
                  </span>
                </div>
                <Link href="/pricing">
                  <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                    <Crown className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Progress bar - shows during export */}
          {(isExporting || exportStage !== 'idle') && (
            <div className="w-full mb-3">
              <ExportProgress
                isExporting={isExporting || exportStage !== 'idle'}
                stage={exportStage}
                error={exportError}
              />
            </div>
          )}
          
          <div className="flex w-full items-center justify-between gap-4">
            {/* Left side - Template info + reassurance */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="font-semibold text-xs sm:text-sm px-2.5 py-1 bg-primary/10 border-primary/30 text-primary">
                {selectedTemplate.label}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" />
                ATS: {selectedTemplate.atsScore}%
              </span>
              {/* Export limit indicator */}
              {!isUnlimited ? (
                <span className={cn(
                  "text-xs hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full",
                  canExport 
                    ? "text-muted-foreground bg-muted" 
                    : "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                )}>
                  <FileDown className="h-3 w-3" />
                  {dailyExportsRemaining}/{dailyExportsRemaining + dailyExportsUsed} exports left
                </span>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10">
                  <Crown className="h-3 w-3" />
                  Unlimited exports
                </span>
              )}
            </div>
            {/* Right side - Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isExporting}
                className="px-3 sm:px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={!isValidFilename || isExporting || !canExport}
                className={cn(
                  "shadow-sm hover:shadow-md transition-all duration-200 px-4 sm:px-6 gap-2",
                  canExport 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Exporting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : !canExport ? (
                  <>
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Limit Reached</span>
                    <span className="sm:hidden">Locked</span>
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateOption({
  template,
  isSelected,
  onClick,
  disabled,
  isAvailable = true,
}: {
  template: LatexTemplate;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  isAvailable?: boolean;
}) {
  const isDisabled = disabled || !isAvailable;
  
  return (
    <div
      onClick={isAvailable ? onClick : undefined}
      onKeyDown={(e) => e.key === 'Enter' && isAvailable && onClick()}
      tabIndex={isDisabled ? -1 : 0}
      role="button"
      aria-selected={isSelected}
      aria-disabled={!isAvailable}
      className={cn(
        'relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        !isAvailable
          ? 'border-border/40 bg-muted/20 cursor-not-allowed opacity-60'
          : isSelected
            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20 cursor-pointer'
            : 'border-border/60 hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      {/* Coming Soon overlay badge */}
      {!isAvailable && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="text-[10px] bg-muted-foreground/20 text-muted-foreground border-0 px-2 py-0.5">
            <Lock className="h-2.5 w-2.5 mr-1" />
            Coming Soon
          </Badge>
        </div>
      )}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Mini Preview Icon */}
        <div className={cn(
          "w-12 h-16 sm:w-14 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border transition-all duration-200",
          isSelected ? "border-primary/50 shadow-sm" : "border-border/60 group-hover:border-primary/30"
        )}>
          <TemplatePreviewIcon templateId={template.id} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-sm sm:text-base">{template.label}</h4>
            {template.recommended && (
              <Badge className="text-[10px] sm:text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-1.5 sm:px-2">
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 fill-current" />
                Top Pick
              </Badge>
            )}
            {template.popular && !template.recommended && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                Popular
              </Badge>
            )}
          </div>
          
          {/* Use case tags - makes choices faster */}
          {template.bestFor && template.bestFor.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {template.bestFor.slice(0, 2).map((useCase, i) => (
                <span key={i} className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full">
                  ✓ {useCase}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-[10px] sm:text-xs text-muted-foreground/80 line-clamp-1 mb-2">{template.description}</p>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ATS Score with confidence indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md cursor-help transition-colors",
                    template.atsScore >= 97 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                    template.atsScore >= 94 ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    <Shield className="h-3 w-3" />
                    <span className="font-mono">{template.atsScore}%</span>
                    {/* Confidence dots */}
                    <div className="flex gap-0.5 ml-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 h-1 rounded-full",
                            i < Math.round(template.atsScore / 20) ? "bg-current" : "bg-current/20"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">ATS Compatibility: {template.atsScore}%</p>
                    <div className="space-y-0.5 text-muted-foreground">
                      <p>• Parsing accuracy: {Math.min(100, template.atsScore + 1)}%</p>
                      <p>• Layout compatibility: {template.atsScore}%</p>
                      <p>• Keyword optimization: {Math.max(90, template.atsScore - 2)}%</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Color palette */}
            <div className="flex gap-1">
              <div
                className="w-3 h-3 rounded-full border border-border/50 shadow-sm"
                style={{ backgroundColor: template.colors.primary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-border/50 shadow-sm"
                style={{ backgroundColor: template.colors.secondary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-border/50 shadow-sm"
                style={{ backgroundColor: template.colors.accent }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="p-1 bg-primary rounded-md shadow-sm">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatePreview({ template }: { template: LatexTemplate }) {
  return (
    <div className="space-y-4">
      {/* Template Header with ATS breakdown */}
      <div className="text-center p-4 bg-primary/5 rounded-lg border border-border/60">
        <h3 className="font-bold text-lg mb-2">{template.label}</h3>
        
        {/* ATS Score with breakdown tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-2 cursor-help">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
                  template.atsScore >= 97 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                  template.atsScore >= 94 ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                  "bg-muted"
                )}>
                  <Shield className="h-4 w-4" />
                  ATS: {template.atsScore}%
                </div>
                {/* Confidence indicator */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-3 rounded-full transition-colors",
                        i < Math.round(template.atsScore / 20) 
                          ? template.atsScore >= 97 ? "bg-emerald-500" : template.atsScore >= 94 ? "bg-blue-500" : "bg-muted-foreground"
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] p-3">
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-sm">ATS Compatibility Breakdown</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Keyword matching</span>
                    <span className="font-mono text-emerald-500">{Math.max(95, template.atsScore - 1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parsing accuracy</span>
                    <span className="font-mono text-emerald-500">{Math.min(100, template.atsScore + 1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Layout compatibility</span>
                    <span className="font-mono text-emerald-500">{template.atsScore}%</span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Template Preview - SVG Visualization with animation */}
      <div className="relative rounded-lg overflow-hidden border border-border/60 shadow-sm bg-muted/30 p-4">
        <div className="aspect-[100/140] w-full max-w-[180px] mx-auto transition-transform duration-500 hover:scale-105">
          <TemplatePreviewIcon templateId={template.id} />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-center">
          <Badge variant="secondary" className="text-[10px] bg-background/90 backdrop-blur-sm shadow-sm">
            <Code2 className="h-2.5 w-2.5 mr-1" />
            LaTeX Template
          </Badge>
        </div>
      </div>

      {/* Best For section - helps with decision making */}
      {template.bestFor && template.bestFor.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            Best For
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {template.bestFor.map((useCase, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                <Check className="h-2.5 w-2.5 mr-1 text-emerald-500" />
                {useCase}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Target Roles */}
      {template.targetRoles && template.targetRoles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
            Ideal Roles
          </h4>
          <div className="flex flex-wrap gap-1">
            {template.targetRoles.map((role, i) => (
              <span key={i} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Key Features
        </h4>
        <ul className="space-y-1.5">
          {template.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Color Palette */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <span className="text-xs text-muted-foreground">Colors:</span>
        <div className="flex gap-1.5">
          <div
            className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: template.colors.primary }}
            title="Primary"
          />
          <div
            className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: template.colors.secondary }}
            title="Secondary"
          />
          <div
            className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: template.colors.accent }}
            title="Accent"
          />
        </div>
      </div>
    </div>
  );
}
