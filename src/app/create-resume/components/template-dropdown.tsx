'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Star, TrendingUp, Clock } from 'lucide-react';
import { LatexTemplateId, LATEX_TEMPLATES, getTemplateById } from '@/lib/latex-templates';

interface TemplateDropdownProps {
  selectedTemplate: LatexTemplateId;
  onSelectTemplate: (templateId: LatexTemplateId) => void;
}

// Templates that are currently available (only FAANG and Jake for now)
const AVAILABLE_TEMPLATES: LatexTemplateId[] = ['faang', 'jake'];

// Sort templates: available first, then coming soon
const sortedTemplates = Object.values(LATEX_TEMPLATES).sort((a, b) => {
  const aAvailable = AVAILABLE_TEMPLATES.includes(a.id);
  const bAvailable = AVAILABLE_TEMPLATES.includes(b.id);
  if (aAvailable && !bAvailable) return -1;
  if (!aAvailable && bAvailable) return 1;
  if (a.recommended && !b.recommended) return -1;
  if (!a.recommended && b.recommended) return 1;
  if (a.popular && !b.popular) return -1;
  if (!a.popular && b.popular) return 1;
  return b.atsScore - a.atsScore;
});

export function TemplateDropdown({
  selectedTemplate,
  onSelectTemplate,
}: TemplateDropdownProps) {
  const template = getTemplateById(selectedTemplate);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Resume Template
      </label>
      
      <Select value={selectedTemplate} onValueChange={(value) => onSelectTemplate(value as LatexTemplateId)}>
        <SelectTrigger className="w-full border-border/60">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{template.label}</span>
              <Badge variant="outline" className="text-xs border-border/60">
                ATS: {template.atsScore}%
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {sortedTemplates.map((t) => {
            const isAvailable = AVAILABLE_TEMPLATES.includes(t.id);
            
            return (
              <SelectItem 
                key={t.id} 
                value={t.id}
                className="py-3"
                disabled={!isAvailable}
              >
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${!isAvailable ? 'text-muted-foreground' : ''}`}>
                      {t.label}
                    </span>
                    {!isAvailable && (
                      <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        Coming Soon
                      </Badge>
                    )}
                    {isAvailable && t.recommended && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                    {isAvailable && t.popular && !t.recommended && (
                      <TrendingUp className="w-3 h-3 text-primary" />
                    )}
                  </div>
                  {isAvailable && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>{t.atsScore}%</span>
                    </div>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {/* Mini color preview */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Colors:</span>
        <div className="flex gap-1">
          <div
            className="w-4 h-4 rounded border border-border/60"
            style={{ backgroundColor: template.colors.primary }}
          />
          <div
            className="w-4 h-4 rounded border border-border/60"
            style={{ backgroundColor: template.colors.secondary }}
          />
          <div
            className="w-4 h-4 rounded border border-border/60"
            style={{ backgroundColor: template.colors.accent }}
          />
        </div>
        <span className="ml-1 truncate">• {template.description}</span>
      </div>
    </div>
  );
}
