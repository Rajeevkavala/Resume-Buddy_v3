import React from 'react';
import { ModernSingleColumnTemplate } from './modern-single-column';
import { TwoColumnTemplate } from './two-column-template';
import { ResumeData, TemplateMetadata, ColorScheme, FontPairing } from '@/lib/types';

interface TemplateRendererProps {
  templateId: string;
  data: ResumeData;
  colorScheme?: ColorScheme;
  fonts?: FontPairing;
  className?: string;
}

/**
 * Template Registry - Maps template IDs to their components
 */
const TEMPLATE_REGISTRY = {
  'modern-single-column': ModernSingleColumnTemplate,
  'professional-two-column': TwoColumnTemplate,
  'tech-modern': ModernSingleColumnTemplate, // Alias for tech industry
  'corporate-professional': TwoColumnTemplate, // Alias for corporate
  'creative-modern': ModernSingleColumnTemplate,
};

/**
 * Renders the appropriate template based on templateId
 */
export function TemplateRenderer({ 
  templateId, 
  data, 
  colorScheme, 
  fonts, 
  className 
}: TemplateRendererProps) {
  const TemplateComponent = TEMPLATE_REGISTRY[templateId as keyof typeof TEMPLATE_REGISTRY];
  
  if (!TemplateComponent) {
    return (
      <div className="p-8 text-center text-red-600">
        Template &quot;{templateId}&quot; not found
      </div>
    );
  }

  return (
    <TemplateComponent 
      data={data} 
      colorScheme={colorScheme} 
      fonts={fonts}
      className={className}
    />
  );
}

/**
 * Default Template Configurations
 * These can be used as starting points for template recommendations
 */
export const DEFAULT_TEMPLATES: TemplateMetadata[] = [
  {
    templateId: 'modern-single-column',
    name: 'Modern Professional',
    description: 'Clean, modern single-column layout ideal for tech and creative professionals',
    industry: ['Tech', 'Creative', 'Marketing'],
    recommendedFor: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'UI/UX Designer',
      'Product Manager',
    ],
    experienceLevel: ['Fresher', 'Mid-level', 'Senior'],
    atsScore: 95,
    layout: 'single-column',
    colorScheme: {
      primary: '#1A73E8',
      secondary: '#333333',
      accent: '#F1F3F4',
      background: '#FFFFFF',
      text: '#000000',
    },
    fonts: {
      heading: 'Inter',
      body: 'Roboto',
    },
  },
  {
    templateId: 'professional-two-column',
    name: 'Professional Two-Column',
    description: 'Classic two-column layout perfect for corporate and healthcare roles',
    industry: ['Corporate', 'Finance', 'Healthcare', 'Education'],
    recommendedFor: [
      'Software Engineer',
      'Data Scientist',
      'QA Engineer',
      'DevOps Engineer',
      'Product Manager',
    ],
    experienceLevel: ['Mid-level', 'Senior', 'Executive'],
    atsScore: 92,
    layout: 'two-column',
    colorScheme: {
      primary: '#2C3E50',
      secondary: '#34495E',
      accent: '#ECF0F1',
      background: '#FFFFFF',
      text: '#000000',
    },
    fonts: {
      heading: 'Roboto',
      body: 'Open Sans',
    },
  },
  {
    templateId: 'tech-modern',
    name: 'Tech Focus',
    description: 'Skills-first template optimized for technical roles',
    industry: ['Tech'],
    recommendedFor: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile Developer',
      'DevOps Engineer',
    ],
    experienceLevel: ['Fresher', 'Mid-level'],
    atsScore: 96,
    layout: 'modern',
    colorScheme: {
      primary: '#0066CC',
      secondary: '#333333',
      accent: '#E8F4F8',
      background: '#FFFFFF',
      text: '#000000',
    },
    fonts: {
      heading: 'Inter',
      body: 'Source Sans Pro',
    },
  },
  {
    templateId: 'corporate-professional',
    name: 'Corporate Executive',
    description: 'Conservative, executive-level template for corporate environments',
    industry: ['Corporate', 'Finance'],
    recommendedFor: [
      'Product Manager',
      'Software Engineer',
      'Data Scientist',
    ],
    experienceLevel: ['Senior', 'Executive'],
    atsScore: 94,
    layout: 'classic',
    colorScheme: {
      primary: '#1F2937',
      secondary: '#4B5563',
      accent: '#F3F4F6',
      background: '#FFFFFF',
      text: '#000000',
    },
    fonts: {
      heading: 'Georgia',
      body: 'Arial',
    },
  },
  {
    templateId: 'creative-modern',
    name: 'Creative Professional',
    description: 'Modern, visually appealing template for creative roles',
    industry: ['Creative', 'Marketing'],
    recommendedFor: [
      'UI/UX Designer',
      'Product Manager',
    ],
    experienceLevel: ['Fresher', 'Mid-level', 'Senior'],
    atsScore: 88,
    layout: 'creative',
    colorScheme: {
      primary: '#8B5CF6',
      secondary: '#333333',
      accent: '#F5F3FF',
      background: '#FFFFFF',
      text: '#000000',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter',
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): TemplateMetadata | undefined {
  return DEFAULT_TEMPLATES.find(t => t.templateId === templateId);
}

/**
 * Filter templates by criteria
 */
export function filterTemplates(criteria: {
  industry?: string;
  experienceLevel?: string;
  minAtsScore?: number;
}): TemplateMetadata[] {
  return DEFAULT_TEMPLATES.filter(template => {
    if (criteria.industry && !template.industry.includes(criteria.industry as any)) {
      return false;
    }
    if (criteria.experienceLevel && !template.experienceLevel.includes(criteria.experienceLevel as any)) {
      return false;
    }
    if (criteria.minAtsScore && template.atsScore < criteria.minAtsScore) {
      return false;
    }
    return true;
  });
}
