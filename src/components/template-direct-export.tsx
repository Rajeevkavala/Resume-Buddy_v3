'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, FileDown, Palette, FileText, Loader2 } from 'lucide-react';
import { MODERN_TEMPLATES, ModernTemplateId, ModernTemplate } from '@/lib/modern-templates';
import { parseResumeText } from '@/lib/resume-parser';
import { ResumeData } from '@/lib/types';
import toast from 'react-hot-toast';

interface TemplateDirectExportProps {
  format: 'pdf';
  resumeText: string;
  children: React.ReactNode;
}

/**
 * Template Direct Export - Export improved resume with modern templates
 * No preview - directly select template and export to PDF
 */
export function TemplateDirectExport({ format, resumeText, children }: TemplateDirectExportProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ModernTemplate | null>(null);
  const [useTemplate, setUseTemplate] = useState(true);
  const [filename, setFilename] = useState('Resume_Enhanced.pdf');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!resumeText || resumeText.trim().length === 0) {
      toast.error('No resume content available');
      return;
    }

    setIsExporting(true);

    try {
      if (useTemplate && selectedTemplate) {
        // Parse the improved resume text into structured data
        const resumeData = parseResumeText(resumeText);
        
        // Load export utilities lazily
        const { exportToPDFWithTemplate } = await import('@/lib/resume-export-template');
        
        const cleanFilename = filename.replace(/\.pdf$/i, '') + '.pdf';
        await exportToPDFWithTemplate(resumeData, selectedTemplate.id, cleanFilename);
        
        toast.success(`Resume exported as ${cleanFilename}`);
      } else {
        // Plain text PDF export
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - margin * 2;
        let yPos = margin;

        const sections = resumeText.split('\n\n');
        
        for (const section of sections) {
          const lines = section.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;

            const isHeader = line.startsWith('===') || line === line.toUpperCase();
            
            if (isHeader) {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              yPos += 4;
            } else {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
            }

            const cleanLine = line.replace(/^=+\s*|\s*=+$/g, '').trim();
            const wrappedLines = doc.splitTextToSize(cleanLine, maxWidth);
            
            for (const wLine of wrappedLines) {
              if (yPos > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
              }
              doc.text(wLine, margin, yPos);
              yPos += isHeader ? 7 : 5.5;
            }

            if (isHeader) yPos += 2;
          }
          yPos += 3;
        }

        const cleanFilename = filename.replace(/\.pdf$/i, '') + '.pdf';
        doc.save(cleanFilename);
        toast.success(`Resume exported as ${cleanFilename}`);
      }

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export resume');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Resume as PDF
          </DialogTitle>
          <DialogDescription>
            Choose a professional template or export as plain text
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="template"
          className="flex-1 overflow-hidden flex flex-col"
          onValueChange={(v) => setUseTemplate(v === 'template')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template">
              <Palette className="w-4 h-4 mr-2" />
              With Template
            </TabsTrigger>
            <TabsTrigger value="plain">
              <FileText className="w-4 h-4 mr-2" />
              Plain Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[340px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MODERN_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ATS: {template.atsScore}%
                      </Badge>
                      {template.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {/* Color preview */}
                    <div className="flex gap-1 mt-3">
                      <div
                        className="w-5 h-5 rounded border"
                        style={{ backgroundColor: template.colorScheme.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-5 h-5 rounded border"
                        style={{ backgroundColor: template.colorScheme.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="w-5 h-5 rounded border"
                        style={{ backgroundColor: template.colorScheme.accent }}
                        title="Accent"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {selectedTemplate && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Selected: {selectedTemplate.name}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="plain" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Standard Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Export as a clean, ATS-friendly PDF without template styling
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Filename input */}
        <div className="space-y-2 mt-4">
          <Label htmlFor="filename">Filename</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Resume_Enhanced.pdf"
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (useTemplate && !selectedTemplate)}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
