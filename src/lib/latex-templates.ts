/**
 * LaTeX Template Configuration
 * Inspired by famous open-source resume templates
 */

export type LatexTemplateId = 
  | 'professional' 
  | 'faang' 
  | 'jake' 
  | 'deedy' 
  | 'modern' 
  | 'minimal'
  | 'tech';

export interface LatexTemplate {
  id: LatexTemplateId;
  label: string;
  description: string;
  atsScore: number;
  tags: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  samplePdf?: string;
  screenshot?: string;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
  /** Best use cases for this template */
  bestFor?: string[];
  /** Target roles/industries */
  targetRoles?: string[];
}

export const LATEX_TEMPLATES: Record<LatexTemplateId, LatexTemplate> = {
  professional: {
    id: 'professional',
    label: 'Professional',
    description: 'Clean, ATS-friendly single-column format perfect for any industry',
    atsScore: 98,
    tags: ['ATS-Friendly', 'Single Column', 'Clean', 'Traditional'],
    colors: {
      primary: '#64748b',
      secondary: '#475569',
      accent: '#3b82f6',
    },
    features: [
      'Maximum ATS compatibility',
      'Clean single-column layout',
      'Perfect for corporate roles',
      'Standard section ordering',
    ],
    bestFor: ['Corporate', 'Traditional industries', 'HR-friendly'],
    targetRoles: ['Business Analyst', 'Manager', 'Consultant', 'Finance'],
  },
  faang: {
    id: 'faang',
    label: 'FAANG',
    description: 'Clean, simple template optimized for FAANG and top tech company applications',
    atsScore: 99,
    tags: ['FAANG', 'Simple', 'Clean', 'Tech'],
    colors: {
      primary: '#64748b',
      secondary: '#475569',
      accent: '#3b82f6',
    },
    samplePdf: '/latex-templates/faang-sample.pdf',
    screenshot: '/latex-templates/faang-sample.png',
    features: [
      'Optimized for tech companies',
      'ATS score: 99%',
      'Single-page focused',
      'Metrics-first achievements',
    ],
    recommended: true,
    popular: true,
    bestFor: ['Big Tech', 'FAANG/MAANG', 'Tech startups'],
    targetRoles: ['SDE', 'SWE', 'ML Engineer', 'Data Scientist'],
  },
  jake: {
    id: 'jake',
    label: 'Jake\'s Resume',
    description: 'Popular LaTeX template with clean typography and excellent readability',
    atsScore: 96,
    tags: ['Popular', 'GitHub Star', 'Clean', 'Developer'],
    colors: {
      primary: '#1e3a5f',
      secondary: '#2d5a87',
      accent: '#4a90d9',
    },
    features: [
      '40k+ GitHub stars inspiration',
      'Clean typography',
      'Developer-friendly',
      'Excellent readability',
    ],
    popular: true,
    bestFor: ['Academia', 'Research', 'Dense content'],
    targetRoles: ['Researcher', 'PhD', 'Professor', 'Senior Engineer'],
  },
  deedy: {
    id: 'deedy',
    label: 'Deedy',
    description: 'Contemporary two-column design with sidebar and accent colors',
    atsScore: 92,
    tags: ['Two Column', 'Modern', 'Professional', 'Creative'],
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b5998',
      accent: '#4169e1',
    },
    features: [
      'Two-column layout',
      'Efficient space usage',
      'Modern aesthetics',
      'Accent color support',
    ],
    bestFor: ['Creative roles', 'Design-forward', 'Startups'],
    targetRoles: ['Designer', 'Product Manager', 'UX/UI', 'Creative'],
  },
  modern: {
    id: 'modern',
    label: 'Modern',
    description: 'Contemporary design with subtle colors and modern typography',
    atsScore: 94,
    tags: ['Modern', 'Stylish', 'Professional', 'Sleek'],
    colors: {
      primary: '#2563eb',
      secondary: '#4f46e5',
      accent: '#7c3aed',
    },
    features: [
      'Modern aesthetics',
      'Subtle color accents',
      'Clean section dividers',
      'Professional appearance',
    ],
    bestFor: ['Tech companies', 'Modern industries', 'Stylish presentation'],
    targetRoles: ['Product Manager', 'Developer', 'Designer', 'Marketer'],
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Ultra-clean minimalist design with maximum white space and light typography',
    atsScore: 97,
    tags: ['Minimal', 'Clean', 'Simple', 'Elegant'],
    colors: {
      primary: '#94a3b8',
      secondary: '#64748b',
      accent: '#475569',
    },
    features: [
      'Maximum white space',
      'Light typography',
      'Distraction-free',
      'Focus on content',
    ],
    bestFor: ['Content-focused', 'Executive roles', 'Senior positions'],
    targetRoles: ['Executive', 'Director', 'VP', 'Senior IC'],
  },
  tech: {
    id: 'tech',
    label: 'Tech',
    description: 'Code-style template with syntax highlighting aesthetics for developers',
    atsScore: 94,
    tags: ['Developer', 'Code', 'Monospace', 'Technical'],
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#10b981',
    },
    features: [
      'Developer-focused',
      'Technical aesthetic',
      'Skills emphasis',
      'Project showcase',
    ],
    bestFor: ['Developer roles', 'Technical positions', 'Open source'],
    targetRoles: ['Backend Dev', 'Frontend Dev', 'DevOps', 'Full Stack'],
  },
};

export const LATEX_TEMPLATE_OPTIONS: ReadonlyArray<{
  id: LatexTemplateId;
  label: string;
}> = Object.values(LATEX_TEMPLATES).map(t => ({ id: t.id, label: t.label }));

// Legacy compatibility
export const LATEX_TEMPLATE_ASSETS: Readonly<Record<LatexTemplateId, {
  label: string;
  description: string;
  samplePdf?: string;
  screenshot?: string;
}>> = Object.fromEntries(
  Object.entries(LATEX_TEMPLATES).map(([id, t]) => [
    id,
    {
      label: t.label,
      description: t.description,
      samplePdf: t.samplePdf,
      screenshot: t.screenshot,
    },
  ])
) as any;

export function coerceLatexTemplateId(input: unknown): LatexTemplateId {
  if (typeof input === 'string' && input in LATEX_TEMPLATES) {
    return input as LatexTemplateId;
  }
  return 'professional';
}

export function getTemplateById(id: LatexTemplateId): LatexTemplate {
  return LATEX_TEMPLATES[id] || LATEX_TEMPLATES.professional;
}
