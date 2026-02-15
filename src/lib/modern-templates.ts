/**
 * Modern Resume Templates - HTML/CSS Based
 * Direct PDF/DOCX Export without LaTeX
 */

import { ResumeData } from './types';

export type ModernTemplateId = 
  | 'professional'
  | 'modern'
  | 'creative'
  | 'minimal'
  | 'executive'
  | 'tech'
  | 'faang';

export interface ModernTemplate {
  id: ModernTemplateId;
  name: string;
  description: string;
  thumbnail: string;
  isPremium: boolean;
  tags: string[];
  atsScore: number;
  atsExplanation: string;
  recommendedFor: string[];
  bestUseCases: string[];
  industries: string[];
  typography: {
    headingFont: string;
    bodyFont: string;
    fontWeights: string;
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  features: string[];
}

export const MODERN_TEMPLATES: ModernTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, ATS-friendly single-column format perfect for any industry',
    thumbnail: '/templates/professional.png',
    isPremium: false,
    tags: ['ATS-Friendly', 'Single Column', 'Clean', 'Universal'],
    atsScore: 98,
    atsExplanation: 'Single-column layout with clear section headers, standard fonts, and no graphics ensures maximum ATS compatibility',
    recommendedFor: ['Software Engineer', 'Manager', 'Any Role'],
    bestUseCases: [
      'First-time job seekers needing a safe, reliable template',
      'Career changers who want to emphasize transferable skills',
      'Traditional industries (finance, legal, healthcare)',
      'ATS-heavy application processes'
    ],
    industries: ['Technology', 'Finance', 'Healthcare', 'Legal', 'Education', 'All Industries'],
    typography: {
      headingFont: 'Inter (sans-serif)',
      bodyFont: 'Inter (sans-serif)',
      fontWeights: '400 (body), 600-700 (headings)'
    },
    colorScheme: {
      primary: '#374151', // gray-700
      secondary: '#6B7280', // gray-500
      accent: '#3B82F6', // blue-500
      text: '#111827', // gray-900
      background: '#FFFFFF',
    },
    features: [
      'Single-column layout for linear reading',
      'Clear section dividers with borders',
      'Standard font sizing (10-12pt)',
      'Consistent spacing and alignment',
      'Maximum white space for readability',
      'No images or graphics',
      'Plain text formatting only'
    ],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary two-column design with sidebar and accent colors',
    thumbnail: '/templates/modern.png',
    isPremium: false,
    tags: ['Two Column', 'Modern', 'Professional', 'Icons'],
    atsScore: 92,
    atsExplanation: 'Two-column layout with sidebar is ATS-parseable but requires careful ordering. Icons enhance visual appeal while maintaining scannability',
    recommendedFor: ['Product Manager', 'Marketing Manager', 'UX Designer'],
    bestUseCases: [
      'Mid-level professionals with diverse skills',
      'Design-conscious industries',
      'Roles requiring creativity and organization',
      'When visual hierarchy is important'
    ],
    industries: ['Technology', 'Marketing', 'Design', 'Startups', 'Creative Services'],
    typography: {
      headingFont: 'Space Grotesk (sans-serif)',
      bodyFont: 'Inter (sans-serif)',
      fontWeights: '400-500 (body), 600-700 (headings)'
    },
    colorScheme: {
      primary: '#3B82F6', // blue-500
      secondary: '#1F2937', // gray-800
      accent: '#60A5FA', // blue-400
      text: '#111827', // gray-900
      background: '#F9FAFB', // gray-50 (sidebar)
    },
    features: [
      'Two-column layout (35% sidebar, 65% main)',
      'Sidebar with contact info and skills',
      'Icon integration for visual appeal',
      'Color accents for section headers',
      'Clean grid-based layout',
      'Balanced information density',
      'Modern sans-serif typography'
    ],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold gradient header with timeline design for creative professionals',
    thumbnail: '/templates/creative.png',
    isPremium: false,
    tags: ['Creative', 'Colorful', 'Timeline', 'Portfolio'],
    atsScore: 85,
    atsExplanation: 'Visual elements like gradients and timelines add personality but may reduce ATS compatibility. Best used when submitting directly to hiring managers',
    recommendedFor: ['UI/UX Designer', 'Graphic Designer', 'Creative Director'],
    bestUseCases: [
      'Creative industries that value design skills',
      'Portfolio-style presentations',
      'When visual impact is crucial',
      'Direct submissions (not ATS-heavy)',
      'Agency or startup environments'
    ],
    industries: ['Design', 'Marketing', 'Advertising', 'Media', 'Creative Services', 'Startups'],
    typography: {
      headingFont: 'Poppins (sans-serif)',
      bodyFont: 'Poppins (sans-serif)',
      fontWeights: '400-500 (body), 600-700 (headings)'
    },
    colorScheme: {
      primary: '#8B5CF6', // purple-500
      secondary: '#EC4899', // pink-500
      accent: '#F59E0B', // amber-500
      text: '#111827', // gray-900
      background: '#FFFFFF',
    },
    features: [
      'Gradient header (purple to pink)',
      'Timeline visualization for experience',
      'Visual dots and progress indicators',
      'Skill badges with borders',
      'Project boxes with borders',
      'Multiple accent colors',
      'Creative section layouts',
      'Portfolio-ready formatting'
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean minimalist design with maximum white space and light typography',
    thumbnail: '/templates/minimal.png',
    isPremium: false,
    tags: ['Minimal', 'Clean', 'Simple', 'ATS-Friendly'],
    atsScore: 97,
    atsExplanation: 'Excellent ATS compatibility with single-column layout, light typography, and maximum spacing. Content-first approach ensures easy parsing',
    recommendedFor: ['Any Role', 'Career Changer', 'Consultant', 'Freelancer'],
    bestUseCases: [
      'When content should speak for itself',
      'Minimalist or design-conscious industries',
      'Senior professionals with strong credentials',
      'Career changers focusing on transferable skills',
      'Consultants and freelancers'
    ],
    industries: ['All Industries', 'Consulting', 'Finance', 'Law', 'Academia', 'Nonprofits'],
    typography: {
      headingFont: 'Montserrat (sans-serif)',
      bodyFont: 'Montserrat (sans-serif)',
      fontWeights: '300 (light for body), 300-400 (headings)'
    },
    colorScheme: {
      primary: '#000000', // black
      secondary: '#4B5563', // gray-600
      accent: '#9CA3AF', // gray-400
      text: '#111827', // gray-900
      background: '#FFFFFF',
    },
    features: [
      'Ultra-light font weights (300)',
      'Maximum white space (16-unit margins)',
      'Centered header for elegant presentation',
      'Letter-spacing on headings (0.2em)',
      'Single-column for simplicity',
      'Minimal visual elements',
      'Focus on content hierarchy',
      'Timeless, elegant aesthetic'
    ],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Sophisticated two-column design with serif typography for senior leadership',
    thumbnail: '/templates/executive.png',
    isPremium: false,
    tags: ['Executive', 'Serif', 'Sophisticated', 'Leadership'],
    atsScore: 93,
    atsExplanation: 'Strong ATS compatibility with clear structure. Serif headings add gravitas while maintaining scannability. Two-column sidebar keeps information organized',
    recommendedFor: ['C-Level Executive', 'VP', 'Director', 'Senior Manager'],
    bestUseCases: [
      'Senior leadership positions',
      'C-suite and VP-level roles',
      'Traditional corporate environments',
      'Finance and consulting industries',
      'Board positions and advisory roles'
    ],
    industries: ['Finance', 'Consulting', 'Corporate', 'Legal', 'Healthcare', 'Manufacturing'],
    typography: {
      headingFont: 'Playfair Display (serif)',
      bodyFont: 'Work Sans (sans-serif)',
      fontWeights: '400-500 (body), 600-700 (headings)'
    },
    colorScheme: {
      primary: '#1e3a8a', // blue-900 (navy)
      secondary: '#374151', // gray-700 (charcoal)
      accent: '#92400e', // amber-800 (burgundy)
      text: '#111827', // gray-900
      background: '#FFFFFF',
    },
    features: [
      'Two-column layout (35% sidebar, 65% main)',
      'Serif fonts for authority and tradition',
      'Professional color palette (navy, charcoal)',
      'Sidebar with contact and qualifications',
      'Clean, organized information hierarchy',
      'Elegant yet conservative design',
      'Suitable for C-suite presentations',
      'Board-ready formatting'
    ],
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Code-style template with syntax highlighting aesthetics for developers',
    thumbnail: '/templates/tech.png',
    isPremium: false,
    tags: ['Developer', 'Code', 'Monospace', 'GitHub'],
    atsScore: 94,
    atsExplanation: 'Good ATS compatibility despite creative styling. Code comments and monospace fonts are parseable. Clear section structure maintains scannability',
    recommendedFor: ['Software Engineer', 'DevOps Engineer', 'Full Stack Developer'],
    bestUseCases: [
      'Software development positions',
      'DevOps and infrastructure roles',
      'Data science and ML engineering',
      'Backend and frontend engineering',
      'Tech startups and FAANG companies'
    ],
    industries: ['Technology', 'Software', 'Startups', 'FAANG', 'Open Source', 'Gaming'],
    typography: {
      headingFont: 'JetBrains Mono (monospace)',
      bodyFont: 'JetBrains Mono (monospace)',
      fontWeights: '400 (body), 500-600 (headings)'
    },
    colorScheme: {
      primary: '#0EA5E9', // cyan-500
      secondary: '#8B5CF6', // purple-500
      accent: '#10B981', // green-500
      text: '#1F2937', // gray-800
      background: '#FFFFFF',
    },
    features: [
      'Monospace font throughout (code style)',
      'Code comment syntax (// headers)',
      'Function-style section formatting',
      'VS Code-inspired color scheme',
      'Syntax highlighting aesthetics',
      'GitHub-style markdown feel',
      'Developer-friendly formatting',
      'Technical project showcases'
    ],
  },
  {
    id: 'faang',
    name: 'FAANG',
    description: 'Clean, simple template optimized for FAANG and top tech company applications',
    thumbnail: '/templates/faang.png',
    isPremium: false,
    tags: ['FAANG', 'Simple', 'Clean', 'ATS-Friendly'],
    atsScore: 99,
    atsExplanation: 'Maximum ATS compatibility with single-column layout, clear section headers, standard fonts, and minimal styling. Optimized specifically for tech company ATS systems',
    recommendedFor: ['Software Engineer', 'FAANG Applications', 'Tech Roles'],
    bestUseCases: [
      'FAANG company applications (Google, Meta, Amazon, Apple, Netflix)',
      'Top tech companies and unicorn startups',
      'Software engineering positions',
      'Entry to senior-level tech roles',
      'When ATS compatibility is critical',
      'Companies with strict resume parsing systems'
    ],
    industries: ['Technology', 'Software', 'FAANG', 'Startups', 'Big Tech', 'Engineering'],
    typography: {
      headingFont: 'Inter (sans-serif)',
      bodyFont: 'Inter (sans-serif)',
      fontWeights: '400 (body), 600-700 (headings)'
    },
    colorScheme: {
      primary: '#111827', // gray-900
      secondary: '#374151', // gray-700
      accent: '#2563EB', // blue-600
      text: '#1F2937', // gray-800
      background: '#FFFFFF',
    },
    features: [
      'Single-column layout for linear ATS parsing',
      'Clean section headers with underlines',
      'Professional typography with Inter font',
      'Minimal icons for contact information',
      'Clear date alignment on the right',
      'Bullet points for easy scanning',
      'Optimized spacing for readability',
      'Focus on content over design',
      'FAANG recruiter-approved format',
      'Technical skills section with categories',
      'Projects section with links',
      'Education with GPA and coursework'
    ],
  },
];
