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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, FileDown, Eye, Palette } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '@/components/templates';
import { TemplateMetadata, TemplateCustomization } from '@/lib/types';

interface TemplateExportDialogProps {
  format: 'docx' | 'pdf';
  onExport: (format: 'docx' | 'pdf', filename?: string, template?: TemplateMetadata, customization?: TemplateCustomization) => void;
  children: React.ReactNode;
}

export function TemplateExportDialog({ format, onExport, children }: TemplateExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [filename, setFilename] = useState(`Resume_Enhanced.${format}`);

  const handleExport = () => {
    const cleanFilename = filename.replace(/\.(docx|pdf)$/i, '');
    const finalFilename = `${cleanFilename}.${format}`;
    
    if (useTemplate && selectedTemplate) {
      const customization: TemplateCustomization = {
        templateId: selectedTemplate.templateId,
        colorScheme: selectedTemplate.colorScheme,
        fonts: selectedTemplate.fonts,
        sectionOrder: ['header', 'summary', 'skills', 'experience', 'education', 'projects', 'certifications'],
        spacing: 'normal',
        fontSize: 'medium',
      };
      onExport(format, finalFilename, selectedTemplate, customization);
    } else {
      onExport(format, finalFilename);
    }
    
    setOpen(false);
  };

  const formatName = format.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Resume as {formatName}
          </DialogTitle>
          <DialogDescription>
            Choose to export with a professional template or as plain text
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="plain" className="w-full" onValueChange={(value) => setUseTemplate(value === 'template')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plain">
              <FileDown className="w-4 h-4 mr-2" />
              Plain Export
            </TabsTrigger>
            <TabsTrigger value="template">
              <Palette className="w-4 h-4 mr-2" />
              With Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plain" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <FileDown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Standard Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Export your improved resume as a clean, ATS-friendly document without template styling
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="template" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-3">
                Select a professional template to apply to your improved resume:
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {DEFAULT_TEMPLATES.map((template) => (
                  <button
                    key={template.templateId}
                    onClick={() => setSelectedTemplate(template)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate?.templateId === template.templateId
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      {selectedTemplate?.templateId === template.templateId && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ATS: {template.atsScore}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.layout}
                      </Badge>
                      {template.industry.slice(0, 2).map((ind) => (
                        <Badge key={ind} variant="outline" className="text-xs">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Color scheme preview */}
                    <div className="flex gap-2 mt-3">
                      <div 
                        className="w-6 h-6 rounded border" 
                        style={{ backgroundColor: template.colorScheme.primary }}
                        title="Primary color"
                      />
                      <div 
                        className="w-6 h-6 rounded border" 
                        style={{ backgroundColor: template.colorScheme.secondary }}
                        title="Secondary color"
                      />
                      <div 
                        className="w-6 h-6 rounded border" 
                        style={{ backgroundColor: template.colorScheme.accent }}
                        title="Accent color"
                      />
                    </div>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">
                        Selected: {selectedTemplate.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Your resume will be exported with professional formatting, optimized colors, and ATS-friendly design.
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Eye className="w-3 h-3" />
                        <span>You can customize this template further in the &quot;Create Resume&quot; page</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={useTemplate && !selectedTemplate}
            className="w-full sm:w-auto"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download {formatName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
