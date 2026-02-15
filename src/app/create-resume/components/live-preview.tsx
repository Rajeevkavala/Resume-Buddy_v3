'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { 
  Download, 
  Maximize2,
  Minimize2,
  Loader2,
  ExternalLink,
  FileText,
  X,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResumeData } from '@/lib/types';
import type { LatexTemplateId } from '@/lib/latex-templates';
import { LatexExportDialog } from '@/components/latex-export-dialog';

interface LivePreviewProps {
  resumeData: ResumeData | null;
  templateId: LatexTemplateId;
  onExport: (filename: string, templateId: LatexTemplateId) => Promise<void>;
  isExporting: boolean;
}

// Map template IDs to their static preview images
const STATIC_IMAGE_MAP: Record<string, string> = {
  faang: '/latex-templates/faang-sample.png',
  jake: '/latex-templates/jake-sample.png',
  professional: '/latex-templates/professional-sample.png',
};

// Map template IDs to their static PDF files (for viewing full PDF)
const STATIC_PDF_MAP: Record<string, string> = {
  faang: '/latex-templates/faang-sample.pdf',
  jake: '/latex-templates/jake-sample.pdf',
  professional: '/latex-templates/professional-sample.pdf',
};

// Template display names
const TEMPLATE_NAMES: Record<string, string> = {
  faang: 'FAANG Style',
  jake: 'Jake\'s Resume',
  professional: 'Professional',
};

export function LivePreview({
  resumeData,
  templateId,
  onExport,
  isExporting,
}: LivePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get the static image URL for the selected template
  const imageUrl = STATIC_IMAGE_MAP[templateId] || STATIC_IMAGE_MAP.faang;
  const pdfUrl = STATIC_PDF_MAP[templateId] || STATIC_PDF_MAP.faang;
  const templateName = TEMPLATE_NAMES[templateId] || 'Template';

  // Reset loading/error state when template changes
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
  }, [templateId]);

  // Handle Escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when fullscreen
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Open PDF in new tab
  const handleViewFullPdf = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Fullscreen backdrop overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
          aria-label="Close fullscreen preview"
        />
      )}
      
      <div className={cn(
        "flex flex-col h-full",
        isFullscreen && "fixed inset-4 z-50 bg-card rounded-xl shadow-2xl border border-border/60"
      )}>
        {/* Fullscreen close button - prominent X in corner */}
        {isFullscreen && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -top-2 -right-2 z-50 h-8 w-8 rounded-full shadow-lg bg-background border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={() => setIsFullscreen(false)}
            title="Close fullscreen (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30 rounded-t-xl">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isFullscreen ? 'Preview (Press Esc or click outside to close)' : 'Preview'}
          </span>
          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleViewFullPdf}
              title="View full PDF in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      
        {/* Image Preview Container */}
        <div className="flex-1 relative pdf-preview-container bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
          {/* Example label overlay */}
          <div className="absolute top-2 left-2 z-20">
            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/90 text-white shadow-sm">
              Example
            </span>
          </div>
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground">Loading preview...</span>
              </div>
            </div>
          )}
          
          {/* Image Preview with hover effect */}
          <div className="w-full h-full flex items-center justify-center p-3">
            <div 
              className="relative w-full bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer group"
              style={{ 
                aspectRatio: '8.5/11',
                maxHeight: isFullscreen ? 'calc(100vh - 180px)' : '100%',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleViewFullPdf}
            >
              {!imageError ? (
                <>
                  {/* Template Preview Image */}
                  <Image
                    src={imageUrl}
                    alt={`${templateName} Resume Preview`}
                    fill
                    className={cn(
                      "object-contain transition-all duration-300",
                      isHovered && "scale-[1.02] brightness-[0.7]"
                    )}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setImageError(true)}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  
                  {/* Hover overlay with View Resume button */}
                  <div 
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300",
                      isHovered ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 transform transition-transform duration-300 hover:scale-105">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium text-sm">View Resume</span>
                    </div>
                    <p className="text-white/90 text-xs mt-2 drop-shadow-lg">
                      Click to open full PDF
                    </p>
                  </div>
                </>
              ) : (
                /* Fallback placeholder */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 p-4">
                  <FileText className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {templateName}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs mt-2"
                    onClick={handleViewFullPdf}
                  >
                    View PDF
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      
      {/* Footer with Export */}
      <div className="p-3 border-t border-border/40 bg-card rounded-b-xl">
        <LatexExportDialog
          onExport={onExport}
          isExporting={isExporting}
          defaultFilename={resumeData?.personalInfo?.fullName 
            ? `${resumeData.personalInfo.fullName}-Resume` 
            : 'Resume'}
        >
          <Button 
            size="sm" 
            disabled={isExporting || !resumeData}
            className="w-full h-9 gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Export Your Resume
              </>
            )}
          </Button>
        </LatexExportDialog>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Export generates PDF with your data
        </p>
      </div>
    </div>
    </>
  );
}
