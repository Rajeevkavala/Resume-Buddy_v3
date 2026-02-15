'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TemplateMetadata } from '@/lib/types';
import { TemplateRenderer } from '@/components/templates';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Eye, Star } from 'lucide-react';
import { SAMPLE_RESUME_DATA } from '@/lib/sample-data';

interface TemplatePreviewThumbnailProps {
  template: TemplateMetadata;
  isSelected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
  className?: string;
}

export function TemplatePreviewThumbnail({ 
  template, 
  isSelected, 
  onClick,
  size = 'md',
  showInfo = true,
  className = ''
}: TemplatePreviewThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-40 h-52',
      scale: 'scale-[0.2]',
      dimensions: { width: '500%', height: '500%' }
    },
    md: {
      container: 'w-48 h-64',
      scale: 'scale-[0.25]',
      dimensions: { width: '400%', height: '400%' }
    },
    lg: {
      container: 'w-56 h-72',
      scale: 'scale-[0.3]',
      dimensions: { width: '333%', height: '333%' }
    }
  };

  const config = sizeConfig[size];

  // Simulate loading delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handlePreviewError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handlePreviewLoad = () => {
    setIsLoading(false);
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group ${config.container} rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
        ${isSelected 
          ? 'border-primary ring-2 ring-primary/20 shadow-lg' 
          : 'border-border hover:border-primary/50 hover:shadow-md'
        }
        ${className}
      `}
      aria-label={`Select ${template.name} template`}
      aria-pressed={isSelected}
      role="radio"
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {imageError && !isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
            <Eye className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 text-center">{template.name}</p>
          <p className="text-xs text-gray-400 text-center mt-1">{template.layout}</p>
        </div>
      )}

      {/* Template Preview */}
      {!imageError && !isLoading && (
        <div 
          ref={previewRef}
          className={`
            w-full h-full bg-white transform ${config.scale} origin-top-left overflow-hidden
          `}
          style={{ 
            width: config.dimensions.width, 
            height: config.dimensions.height,
            pointerEvents: 'none'
          }}
          onError={handlePreviewError}
          onLoad={handlePreviewLoad}
        >
          <div className="transform scale-100">
            <TemplateRenderer
              templateId={template.templateId}
              data={SAMPLE_RESUME_DATA}
              colorScheme={template.colorScheme}
              fonts={template.fonts}
            />
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      <div className={`
        absolute inset-0 bg-black/60 transition-opacity duration-300
        ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}
      `}>
        {showInfo && (
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                <p className="text-xs opacity-90 capitalize">{template.layout}</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">{template.atsScore}</span>
              </div>
            </div>
            
            {/* Industry Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {template.industry.slice(0, 2).map((industry) => (
                <Badge 
                  key={industry} 
                  variant="secondary" 
                  className="text-xs px-1 py-0 h-4 bg-white/20 text-white border-white/30"
                >
                  {industry}
                </Badge>
              ))}
              {template.industry.length > 2 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-1 py-0 h-4 bg-white/20 text-white border-white/30"
                >
                  +{template.industry.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-primary text-white rounded-full p-1.5 shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* ATS Score Badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge 
          variant={template.atsScore >= 90 ? "default" : template.atsScore >= 80 ? "secondary" : "destructive"}
          className="text-xs shadow-sm"
        >
          ATS {template.atsScore}%
        </Badge>
      </div>

      {/* Focus Ring */}
      <div className={`
        absolute inset-0 rounded-xl ring-2 ring-offset-2 ring-primary transition-opacity
        ${isSelected ? 'opacity-100' : 'opacity-0'}
      `} />
    </button>
  );
}

// Grid component for displaying multiple template thumbnails
interface TemplateGridProps {
  templates: TemplateMetadata[];
  selectedTemplate?: TemplateMetadata;
  onTemplateSelect: (template: TemplateMetadata) => void;
  size?: 'sm' | 'md' | 'lg';
  columns?: number;
  className?: string;
}

export function TemplateGrid({
  templates,
  selectedTemplate,
  onTemplateSelect,
  size = 'md',
  columns = 3,
  className = ''
}: TemplateGridProps) {
  return (
    <div 
      className={`
        grid gap-4 
        ${columns === 2 ? 'grid-cols-2' : ''}
        ${columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}
        ${columns === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : ''}
        ${className}
      `}
    >
      {templates.map((template) => (
        <TemplatePreviewThumbnail
          key={template.templateId}
          template={template}
          isSelected={selectedTemplate?.templateId === template.templateId}
          onClick={() => onTemplateSelect(template)}
          size={size}
        />
      ))}
    </div>
  );
}

// Carousel component for template previews
interface TemplateCarouselProps {
  templates: TemplateMetadata[];
  selectedTemplate?: TemplateMetadata;
  onTemplateSelect: (template: TemplateMetadata) => void;
  className?: string;
}

export function TemplateCarousel({
  templates,
  selectedTemplate,
  onTemplateSelect,
  className = ''
}: TemplateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {templates.map((template) => (
          <div key={template.templateId} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
            <TemplatePreviewThumbnail
              template={template}
              isSelected={selectedTemplate?.templateId === template.templateId}
              onClick={() => onTemplateSelect(template)}
              size="sm"
            />
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
        aria-label="Scroll left"
      >
        ←
      </button>
      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
        aria-label="Scroll right"
      >
        →
      </button>
    </div>
  );
}