'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Star, Sparkles, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LatexTemplateId, LatexTemplate } from '@/lib/latex-templates';
import { LATEX_TEMPLATES } from '@/lib/latex-templates';

interface LatexTemplateSelectProps {
  value: LatexTemplateId;
  onValueChange: (value: LatexTemplateId) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function LatexTemplateSelect({
  value,
  onValueChange,
  disabled,
  className,
  compact = false,
}: LatexTemplateSelectProps) {
  const templates = Object.values(LATEX_TEMPLATES);

  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-2', className)}>
        {templates.map((template) => (
          <CompactTemplateCard
            key={template.id}
            template={template}
            isSelected={value === template.id}
            onClick={() => !disabled && onValueChange(template.id)}
            disabled={disabled}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={value === template.id}
          onClick={() => !disabled && onValueChange(template.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  onClick,
  disabled,
}: {
  template: LatexTemplate;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 bg-card',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-2">
        {template.recommended && (
          <Badge variant="default" className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Recommended
          </Badge>
        )}
        {template.popular && !template.recommended && (
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        )}
      </div>

      {/* Template name */}
      <h3 className="font-semibold text-lg mb-1">{template.label}</h3>

      {/* ATS Score */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs font-mono">
          <Award className="h-3 w-3 mr-1" />
          ATS Score: {template.atsScore}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {template.description}
      </p>

      {/* Color preview */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Colors:</span>
        <div className="flex gap-1">
          <div
            className="w-5 h-5 rounded-md border border-border shadow-sm"
            style={{ backgroundColor: template.colors.primary }}
          />
          <div
            className="w-5 h-5 rounded-md border border-border shadow-sm"
            style={{ backgroundColor: template.colors.secondary }}
          />
          <div
            className="w-5 h-5 rounded-md border border-border shadow-sm"
            style={{ backgroundColor: template.colors.accent }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {template.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
            {tag}
          </Badge>
        ))}
        {template.tags.length > 3 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            +{template.tags.length - 3} more
          </Badge>
        )}
      </div>
    </div>
  );
}

function CompactTemplateCard({
  template,
  isSelected,
  onClick,
  disabled,
}: {
  template: LatexTemplate;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200',
        'hover:shadow-md',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50 bg-card',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
        </div>
      )}

      <h4 className="font-medium text-sm mb-1 pr-6">{template.label}</h4>
      <Badge variant="outline" className="text-xs font-mono">
        ATS: {template.atsScore}
      </Badge>
    </div>
  );
}
