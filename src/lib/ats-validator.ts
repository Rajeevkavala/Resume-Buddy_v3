/**
 * ATS Compatibility Validator
 * Validates resume templates and content against ATS (Applicant Tracking System) requirements
 */

import { TemplateMetadata, ColorScheme, FontPairing } from '@/lib/types';

export interface ATSValidationResult {
  score: number;
  passed: boolean;
  issues: ATSIssue[];
  warnings: ATSWarning[];
  recommendations: string[];
}

export interface ATSIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'design' | 'content' | 'formatting' | 'structure';
  message: string;
  fix: string;
}

export interface ATSWarning {
  category: 'design' | 'content' | 'formatting' | 'structure';
  message: string;
  suggestion: string;
}

/**
 * Validate template design for ATS compatibility
 */
export function validateTemplateDesign(template: TemplateMetadata): ATSValidationResult {
  const issues: ATSIssue[] = [];
  const warnings: ATSWarning[] = [];
  const recommendations: string[] = [];
  
  let score = 100;

  // Check color contrast
  const colorIssues = validateColorScheme(template.colorScheme);
  issues.push(...colorIssues);
  score -= colorIssues.length * 5;

  // Check font choices
  const fontIssues = validateFonts(template.fonts);
  issues.push(...fontIssues);
  score -= fontIssues.length * 3;

  // Check layout
  const layoutIssues = validateLayout(template.layout);
  issues.push(...layoutIssues);
  score -= layoutIssues.length * 8;

  // Add recommendations
  if (template.layout === 'two-column') {
    recommendations.push('Two-column layouts may be harder for some ATS to parse. Consider using single-column for maximum compatibility.');
  }

  if (template.layout === 'creative') {
    recommendations.push('Creative layouts should be used carefully. Ensure all text is selectable and not embedded in images.');
  }

  // Check overall score
  score = Math.max(0, Math.min(100, score));
  const passed = score >= 85;

  return {
    score,
    passed,
    issues,
    warnings,
    recommendations,
  };
}

/**
 * Validate color scheme for ATS compatibility
 */
function validateColorScheme(colors: ColorScheme): ATSIssue[] {
  const issues: ATSIssue[] = [];

  // Check if colors are too similar (contrast ratio)
  const primaryLuminance = getRelativeLuminance(colors.primary);
  const backgroundLuminance = getRelativeLuminance(colors.background || '#FFFFFF');
  
  const contrastRatio = calculateContrastRatio(primaryLuminance, backgroundLuminance);
  
  if (contrastRatio < 4.5) {
    issues.push({
      severity: 'high',
      category: 'design',
      message: 'Primary color contrast ratio is too low (below WCAG AA standard)',
      fix: 'Choose a darker or lighter primary color to ensure text is readable by both humans and ATS systems',
    });
  }

  // Check if using pure black or pure white for text
  if (colors.text === '#000000' || colors.text === '#FFFFFF') {
    // This is actually fine for ATS, just noting it
  }

  return issues;
}

/**
 * Validate font choices for ATS compatibility
 */
function validateFonts(fonts: FontPairing): ATSIssue[] {
  const issues: ATSIssue[] = [];

  const atsUnfriendlyFonts = [
    'Comic Sans',
    'Papyrus',
    'Brush Script',
    'Curlz',
    'Impact',
  ];

  const complexFonts = [
    'Playfair Display',
    'Lobster',
    'Pacifico',
  ];

  // Check heading font
  if (atsUnfriendlyFonts.some(font => fonts.heading.includes(font))) {
    issues.push({
      severity: 'medium',
      category: 'design',
      message: `Heading font "${fonts.heading}" may not be ATS-friendly`,
      fix: 'Use standard fonts like Arial, Calibri, Georgia, or Helvetica',
    });
  }

  // Check body font
  if (atsUnfriendlyFonts.some(font => fonts.body.includes(font))) {
    issues.push({
      severity: 'high',
      category: 'design',
      message: `Body font "${fonts.body}" may not be ATS-friendly`,
      fix: 'Use standard fonts like Arial, Calibri, Georgia, or Helvetica for body text',
    });
  }

  // Check for overly decorative fonts
  if (complexFonts.some(font => fonts.heading.includes(font) || fonts.body.includes(font))) {
    issues.push({
      severity: 'low',
      category: 'design',
      message: 'Decorative fonts may reduce ATS readability',
      fix: 'Consider using simpler, more standard fonts',
    });
  }

  return issues;
}

/**
 * Validate layout for ATS compatibility
 */
function validateLayout(layout: string): ATSIssue[] {
  const issues: ATSIssue[] = [];

  if (layout === 'creative') {
    issues.push({
      severity: 'medium',
      category: 'structure',
      message: 'Creative layouts may have parsing issues with some ATS systems',
      fix: 'Ensure all text is in standard HTML elements, not images or complex graphics',
    });
  }

  if (layout === 'two-column') {
    issues.push({
      severity: 'low',
      category: 'structure',
      message: 'Two-column layouts can sometimes confuse ATS parsing order',
      fix: 'Test with major ATS systems or consider using single-column layout',
    });
  }

  return issues;
}

/**
 * Calculate relative luminance for a color
 * Used for WCAG contrast ratio calculations
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(luminance1: number, luminance2: number): number {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate resume content for ATS compatibility
 */
export function validateResumeContent(resumeText: string): ATSValidationResult {
  const issues: ATSIssue[] = [];
  const warnings: ATSWarning[] = [];
  const recommendations: string[] = [];
  
  let score = 100;

  // Check for common ATS-unfriendly elements
  
  // Check for tables
  if (resumeText.includes('<table') || resumeText.includes('|---|')) {
    issues.push({
      severity: 'high',
      category: 'formatting',
      message: 'Tables detected in resume content',
      fix: 'Replace tables with simple lists or paragraphs for better ATS parsing',
    });
    score -= 10;
  }

  // Check for images
  if (resumeText.includes('<img') || resumeText.includes('[image]')) {
    warnings.push({
      category: 'content',
      message: 'Images detected in resume',
      suggestion: 'Ensure critical information is not embedded in images as ATS cannot read them',
    });
    score -= 5;
  }

  // Check for text boxes
  if (resumeText.includes('text-box') || resumeText.includes('textbox')) {
    issues.push({
      severity: 'medium',
      category: 'formatting',
      message: 'Text boxes may not be readable by ATS',
      fix: 'Use standard paragraphs and lists instead of text boxes',
    });
    score -= 8;
  }

  // Check for special characters
  const specialChars = /[★☆♦◆●○■□▪▫]/g;
  if (specialChars.test(resumeText)) {
    warnings.push({
      category: 'formatting',
      message: 'Special characters detected',
      suggestion: 'Replace decorative characters with standard bullets or text',
    });
    score -= 3;
  }

  // Check for standard section headers
  const standardSections = [
    'experience',
    'education',
    'skills',
    'summary',
    'objective',
  ];
  
  const foundSections = standardSections.filter(section => 
    resumeText.toLowerCase().includes(section)
  );

  if (foundSections.length < 3) {
    warnings.push({
      category: 'structure',
      message: 'Missing standard section headers',
      suggestion: 'Include clear section headers like "Experience", "Education", and "Skills"',
    });
  }

  // Add general recommendations
  recommendations.push('Use standard section headers (Experience, Education, Skills, etc.)');
  recommendations.push('Avoid headers and footers as they may not be parsed correctly');
  recommendations.push('Use standard bullet points (•, -, or *) instead of custom symbols');
  recommendations.push('Save as .docx or .pdf format for best ATS compatibility');

  score = Math.max(0, Math.min(100, score));
  const passed = score >= 85;

  return {
    score,
    passed,
    issues,
    warnings,
    recommendations,
  };
}

/**
 * Comprehensive ATS validation combining template and content checks
 */
export function validateForATS(
  template: TemplateMetadata,
  resumeText?: string
): ATSValidationResult {
  const templateResult = validateTemplateDesign(template);
  
  if (resumeText) {
    const contentResult = validateResumeContent(resumeText);
    
    // Combine results
    return {
      score: Math.round((templateResult.score + contentResult.score) / 2),
      passed: templateResult.passed && contentResult.passed,
      issues: [...templateResult.issues, ...contentResult.issues],
      warnings: [...templateResult.warnings, ...contentResult.warnings],
      recommendations: [...templateResult.recommendations, ...contentResult.recommendations],
    };
  }
  
  return templateResult;
}
