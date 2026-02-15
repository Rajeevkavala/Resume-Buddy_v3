'use client';

import React from 'react';
import { LatexTemplateId, LATEX_TEMPLATES } from '@/lib/latex-templates';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Check, FileText, Star, TrendingUp } from 'lucide-react';

interface ModernTemplateSelectorProps {
  selectedTemplate: LatexTemplateId;
  onSelectTemplate: (templateId: LatexTemplateId) => void;
}

// Sort templates: recommended first, then popular, then by ATS score
const sortedTemplates = Object.values(LATEX_TEMPLATES).sort((a, b) => {
  if (a.recommended && !b.recommended) return -1;
  if (!a.recommended && b.recommended) return 1;
  if (a.popular && !b.popular) return -1;
  if (!a.popular && b.popular) return 1;
  return b.atsScore - a.atsScore;
});

export function ModernTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: ModernTemplateSelectorProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold">Choose Your Template</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-full">
          <FileText className="h-4 w-4" />
          <span>Professional LaTeX PDF Templates</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg relative ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              } ${template.recommended ? 'border-amber-400' : ''}`}
              onClick={() => onSelectTemplate(template.id)}
            >
              {/* Priority Badges */}
              {(template.recommended || template.popular) && (
                <div className="absolute -top-2 -right-2 flex gap-1">
                  {template.recommended && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs shadow-md">
                      <Star className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                  {template.popular && !template.recommended && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs shadow-md">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
              )}
              
              <CardContent className="p-4 pt-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-base">{template.label}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        ATS Score: {template.atsScore}
                      </Badge>
                      {template.popular && template.recommended && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                
                {/* Color scheme preview */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Colors:</span>
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: template.colors.primary }}
                      title="Primary"
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: template.colors.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: template.colors.accent }}
                      title="Accent"
                    />
                  </div>
                </div>

                {/* Best For */}
                {template.bestFor && template.bestFor.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Best for:</span> {template.bestFor.slice(0, 2).join(', ')}
                  </div>
                )}

                {/* Tags */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex flex-wrap gap-2">
                    {template.tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
