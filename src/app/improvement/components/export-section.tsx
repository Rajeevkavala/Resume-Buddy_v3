'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { LatexExportDialog } from '@/components/latex-export-dialog';
import { TemplateExportDialog } from '@/components/template-export-dialog';
import type { TemplateMetadata, TemplateCustomization } from '@/lib/types';
import type { LatexTemplateId } from '@/lib/latex-templates';

interface ExportSectionProps {
  onExport: (format: 'docx' | 'pdf', filename?: string, template?: TemplateMetadata, customization?: TemplateCustomization) => void;
  onRegenerate: () => void;
  onLatexExport: (filename: string, templateId: LatexTemplateId) => Promise<void>;
  isLoading: boolean;
  isLatexExporting: boolean;
  canExportLatex: boolean;
}

export function ExportSection({ 
  onExport, 
  onRegenerate, 
  onLatexExport,
  isLoading, 
  isLatexExporting,
  canExportLatex 
}: ExportSectionProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Export Resume</CardTitle>
              <CardDescription className="text-xs">
                Download your enhanced resume
              </CardDescription>
            </div>
          </div>
          
          {/* Regenerate Button */}
          <Button 
            onClick={onRegenerate} 
            disabled={isLoading} 
            variant="outline" 
            size="sm"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* PDF Export - Primary */}
          <LatexExportDialog onExport={onLatexExport} isExporting={isLatexExporting}>
            <Button disabled={!canExportLatex || isLatexExporting} className="flex-1 sm:flex-none">
              <FileText className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </LatexExportDialog>
          
          {/* DOCX Export - Secondary */}
          <TemplateExportDialog format="docx" onExport={onExport}>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Export as DOCX
            </Button>
          </TemplateExportDialog>
        </div>
      </CardContent>
    </Card>
  );
}
