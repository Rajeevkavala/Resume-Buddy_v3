import { ResumeData } from '@/lib/types';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  score: number; // Overall completeness score 0-100
}

export interface ATSValidationResult {
  score: number;
  issues: ValidationError[];
  recommendations: string[];
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone format (flexible international format)
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
}

/**
 * Validates URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if text has good length for ATS
 */
function checkTextLength(text: string, min: number, max: number): { isValid: boolean; message?: string } {
  if (text.length < min) {
    return { isValid: false, message: `Too short (${text.length} characters). Aim for ${min}-${max} characters.` };
  }
  if (text.length > max) {
    return { isValid: false, message: `Too long (${text.length} characters). Aim for ${min}-${max} characters.` };
  }
  return { isValid: true };
}

/**
 * Validates resume data comprehensively
 */
export function validateResumeData(data: ResumeData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const info: ValidationError[] = [];

  // Personal Information Validation
  if (!data.personalInfo.fullName?.trim()) {
    errors.push({
      field: 'personalInfo.fullName',
      message: 'Full name is required',
      severity: 'error',
      suggestion: 'Enter your full professional name'
    });
  } else if (data.personalInfo.fullName.length < 2) {
    warnings.push({
      field: 'personalInfo.fullName',
      message: 'Name seems too short',
      severity: 'warning',
      suggestion: 'Use your full professional name'
    });
  }

  if (!data.personalInfo.email?.trim()) {
    errors.push({
      field: 'personalInfo.email',
      message: 'Email address is required',
      severity: 'error',
      suggestion: 'Add a professional email address'
    });
  } else if (!isValidEmail(data.personalInfo.email)) {
    errors.push({
      field: 'personalInfo.email',
      message: 'Invalid email format',
      severity: 'error',
      suggestion: 'Use format: name@domain.com'
    });
  }

  if (!data.personalInfo.phone?.trim()) {
    errors.push({
      field: 'personalInfo.phone',
      message: 'Phone number is required',
      severity: 'error',
      suggestion: 'Add your primary phone number'
    });
  } else if (!isValidPhone(data.personalInfo.phone)) {
    warnings.push({
      field: 'personalInfo.phone',
      message: 'Phone format may not be recognized by ATS',
      severity: 'warning',
      suggestion: 'Use format: +1 (555) 123-4567'
    });
  }

  if (!data.personalInfo.location?.trim()) {
    warnings.push({
      field: 'personalInfo.location',
      message: 'Location helps with local job matching',
      severity: 'warning',
      suggestion: 'Add city and state/country'
    });
  }

  // LinkedIn validation
  if (data.personalInfo.linkedin && !isValidURL(data.personalInfo.linkedin)) {
    warnings.push({
      field: 'personalInfo.linkedin',
      message: 'LinkedIn URL format incorrect',
      severity: 'warning',
      suggestion: 'Use format: linkedin.com/in/yourname'
    });
  }

  // Professional Summary Validation
  if (!data.summary?.trim()) {
    warnings.push({
      field: 'summary',
      message: 'Professional summary is highly recommended',
      severity: 'warning',
      suggestion: 'Add a 2-3 sentence summary of your background'
    });
  } else {
    const summaryCheck = checkTextLength(data.summary, 100, 300);
    if (!summaryCheck.isValid) {
      warnings.push({
        field: 'summary',
        message: `Professional summary length issue: ${summaryCheck.message}`,
        severity: 'warning',
        suggestion: 'Aim for 2-3 impactful sentences'
      });
    }
  }

  // Experience Validation
  if (data.experience.length === 0) {
    errors.push({
      field: 'experience',
      message: 'At least one work experience is required',
      severity: 'error',
      suggestion: 'Add your most relevant work experience'
    });
  } else {
    data.experience.forEach((exp, index) => {
      if (!exp.title?.trim()) {
        errors.push({
          field: `experience[${index}].title`,
          message: 'Job title is required',
          severity: 'error',
          suggestion: 'Enter your job title'
        });
      }

      if (!exp.company?.trim()) {
        errors.push({
          field: `experience[${index}].company`,
          message: 'Company name is required',
          severity: 'error',
          suggestion: 'Enter the company/organization name'
        });
      }

      if (!exp.startDate?.trim()) {
        errors.push({
          field: `experience[${index}].startDate`,
          message: 'Start date is required',
          severity: 'error',
          suggestion: 'Enter when you started this role'
        });
      }

      if (!exp.current && !exp.endDate?.trim()) {
        warnings.push({
          field: `experience[${index}].endDate`,
          message: 'End date recommended for past roles',
          severity: 'warning',
          suggestion: 'Add end date or mark as current'
        });
      }

      if (exp.achievements.length === 0 || exp.achievements.every(a => !a.trim())) {
        warnings.push({
          field: `experience[${index}].achievements`,
          message: 'No achievements listed',
          severity: 'warning',
          suggestion: 'Add 2-4 key achievements with metrics'
        });
      } else {
        exp.achievements.forEach((achievement, achIndex) => {
          if (achievement.trim().length < 20) {
            info.push({
              field: `experience[${index}].achievements[${achIndex}]`,
              message: 'Achievement description is very short',
              severity: 'info',
              suggestion: 'Include specific metrics and impact'
            });
          }
        });
      }
    });
  }

  // Education Validation
  if (data.education.length === 0) {
    warnings.push({
      field: 'education',
      message: 'Education section is recommended',
      severity: 'warning',
      suggestion: 'Add your highest level of education'
    });
  } else {
    data.education.forEach((edu, index) => {
      if (!edu.degree?.trim()) {
        errors.push({
          field: `education[${index}].degree`,
          message: 'Degree/qualification name is required',
          severity: 'error',
          suggestion: 'Enter your degree or certification'
        });
      }

      if (!edu.institution?.trim()) {
        errors.push({
          field: `education[${index}].institution`,
          message: 'Institution name is required',
          severity: 'error',
          suggestion: 'Enter the school/university name'
        });
      }

      if (!edu.graduationDate?.trim()) {
        warnings.push({
          field: `education[${index}].graduationDate`,
          message: 'Graduation date recommended',
          severity: 'warning',
          suggestion: 'Add graduation month/year'
        });
      }
    });
  }

  // Skills Validation
  if (data.skills.length === 0) {
    warnings.push({
      field: 'skills',
      message: 'Skills section is highly recommended',
      severity: 'warning',
      suggestion: 'Add relevant technical and professional skills'
    });
  } else {
    const totalSkills = data.skills.reduce((sum, category) => sum + category.items.length, 0);
    if (totalSkills < 5) {
      info.push({
        field: 'skills',
        message: 'Consider adding more skills',
        severity: 'info',
        suggestion: 'Aim for 10-15 relevant skills across categories'
      });
    }

    data.skills.forEach((category, index) => {
      if (!category.category?.trim()) {
        warnings.push({
          field: `skills[${index}].category`,
          message: 'Skill category name missing',
          severity: 'warning',
          suggestion: 'Add a category name like "Programming Languages"'
        });
      }

      if (category.items.length === 0 || category.items.every(item => !item.trim())) {
        warnings.push({
          field: `skills[${index}].items`,
          message: 'No skills listed in category',
          severity: 'warning',
          suggestion: 'Add relevant skills for this category'
        });
      }
    });
  }

  // Projects Validation (optional but recommended)
  if (data.projects && data.projects.length > 0) {
    data.projects.forEach((project, index) => {
      if (!project.name?.trim()) {
        warnings.push({
          field: `projects[${index}].name`,
          message: 'Project name is required',
          severity: 'warning',
          suggestion: 'Add a descriptive project name'
        });
      }

      if (!project.description?.trim()) {
        warnings.push({
          field: `projects[${index}].description`,
          message: 'Project description is required',
          severity: 'warning',
          suggestion: 'Describe what the project does and your role'
        });
      } else {
        const descCheck = checkTextLength(project.description, 50, 200);
        if (!descCheck.isValid) {
          info.push({
            field: `projects[${index}].description`,
            message: `Project description ${descCheck.message}`,
            severity: 'info',
            suggestion: 'Provide concise but informative description'
          });
        }
      }

      if (project.technologies.length === 0) {
        info.push({
          field: `projects[${index}].technologies`,
          message: 'Technologies used not specified',
          severity: 'info',
          suggestion: 'List key technologies used in the project'
        });
      }
    });
  }

  // Calculate completeness score
  const totalSections = 6; // personal, summary, experience, education, skills, projects
  let completedSections = 1; // personal info is always present

  if (data.summary?.trim()) completedSections++;
  if (data.experience.length > 0) completedSections++;
  if (data.education.length > 0) completedSections++;
  if (data.skills.length > 0) completedSections++;
  if (data.projects && data.projects.length > 0) completedSections++;

  const baseScore = (completedSections / totalSections) * 100;
  const errorPenalty = errors.length * 10;
  const warningPenalty = warnings.length * 3;
  
  const score = Math.max(0, Math.min(100, baseScore - errorPenalty - warningPenalty));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
    score: Math.round(score)
  };
}

/**
 * Validates resume for ATS compatibility
 */
export function validateForATS(data: ResumeData): ATSValidationResult {
  const issues: ValidationError[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check for common ATS issues
  
  // File format (this would be checked during export)
  recommendations.push('Use PDF or DOCX format for best ATS compatibility');

  // Font and formatting
  recommendations.push('Use standard fonts like Arial, Calibri, or Times New Roman');
  
  // Contact information placement
  if (!data.personalInfo.email || !data.personalInfo.phone) {
    issues.push({
      field: 'contact',
      message: 'Missing critical contact information',
      severity: 'error',
      suggestion: 'Ensure email and phone are clearly visible'
    });
    score -= 15;
  }

  // Keywords and skills
  const totalSkills = data.skills.reduce((sum, cat) => sum + cat.items.length, 0);
  if (totalSkills < 10) {
    issues.push({
      field: 'skills',
      message: 'Limited skills may reduce keyword matching',
      severity: 'warning',
      suggestion: 'Add more relevant skills and technologies'
    });
    score -= 10;
  }

  // Experience descriptions
  const hasQuantifiedAchievements = data.experience.some(exp =>
    exp.achievements.some(achievement => 
      /\d+(%|percent|\$|k|million|billion|x)/.test(achievement.toLowerCase())
    )
  );

  if (!hasQuantifiedAchievements) {
    issues.push({
      field: 'experience',
      message: 'No quantified achievements found',
      severity: 'warning',
      suggestion: 'Add numbers, percentages, or metrics to achievements'
    });
    score -= 10;
  }

  // Section headers
  recommendations.push('Use standard section headers: Experience, Education, Skills');
  
  // Length check
  const totalCharacters = JSON.stringify(data).length;
  if (totalCharacters < 2000) {
    issues.push({
      field: 'overall',
      message: 'Resume content seems sparse',
      severity: 'warning',
      suggestion: 'Add more detailed descriptions and achievements'
    });
    score -= 5;
  }

  // Date formatting
  const hasInconsistentDates = data.experience.some(exp => {
    const startDate = exp.startDate.toLowerCase();
    const endDate = exp.endDate.toLowerCase();
    return !startDate.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/|\d{4})\b/);
  });

  if (hasInconsistentDates) {
    issues.push({
      field: 'dates',
      message: 'Inconsistent date formatting detected',
      severity: 'warning',
      suggestion: 'Use consistent format like "Jan 2023" or "01/2023"'
    });
    score -= 5;
  }

  return {
    score: Math.max(0, Math.round(score)),
    issues,
    recommendations
  };
}

/**
 * Get suggestions for improving resume content
 */
export function getImprovementSuggestions(data: ResumeData): string[] {
  const suggestions: string[] = [];

  // Experience improvements
  if (data.experience.length > 0) {
    const averageAchievements = data.experience.reduce((sum, exp) => sum + exp.achievements.length, 0) / data.experience.length;
    
    if (averageAchievements < 3) {
      suggestions.push('Add more achievements to each role (aim for 3-5 bullet points)');
    }

    const hasActionVerbs = data.experience.some(exp =>
      exp.achievements.some(achievement => 
        /^(achieved|built|created|developed|implemented|improved|increased|led|managed|optimized|reduced|streamlined)/i.test(achievement)
      )
    );

    if (!hasActionVerbs) {
      suggestions.push('Start achievement bullet points with strong action verbs');
    }
  }

  // Skills organization
  if (data.skills.length > 0) {
    const hasUncategorizedSkills = data.skills.some(cat => !cat.category?.trim());
    if (hasUncategorizedSkills) {
      suggestions.push('Organize skills into clear categories (e.g., "Programming Languages", "Frameworks")');
    }
  }

  // Professional summary
  if (!data.summary?.trim()) {
    suggestions.push('Add a professional summary to highlight your value proposition');
  } else if (data.summary.length < 100) {
    suggestions.push('Expand your professional summary to 2-3 sentences');
  }

  // Projects section
  if (!data.projects || data.projects.length === 0) {
    suggestions.push('Consider adding a projects section to showcase your work');
  }

  // Contact information
  if (!data.personalInfo.linkedin) {
    suggestions.push('Add your LinkedIn profile URL');
  }

  if (!data.personalInfo.location) {
    suggestions.push('Add your location (city, state) for local job matching');
  }

  return suggestions;
}

/**
 * Check if resume meets minimum requirements for job applications
 */
export function isResumeJobReady(data: ResumeData): {
  isReady: boolean;
  missingRequirements: string[];
} {
  const missingRequirements: string[] = [];

  if (!data.personalInfo.fullName?.trim()) {
    missingRequirements.push('Full name');
  }

  if (!data.personalInfo.email?.trim() || !isValidEmail(data.personalInfo.email)) {
    missingRequirements.push('Valid email address');
  }

  if (!data.personalInfo.phone?.trim()) {
    missingRequirements.push('Phone number');
  }

  if (data.experience.length === 0) {
    missingRequirements.push('Work experience');
  }

  if (data.skills.length === 0) {
    missingRequirements.push('Skills section');
  }

  // Check if experience entries are complete
  const incompleteExperience = data.experience.some(exp => 
    !exp.title?.trim() || !exp.company?.trim()
  );

  if (incompleteExperience) {
    missingRequirements.push('Complete job titles and company names');
  }

  return {
    isReady: missingRequirements.length === 0,
    missingRequirements
  };
}