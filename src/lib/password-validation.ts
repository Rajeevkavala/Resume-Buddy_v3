export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 1: weak, 2: fair, 3: good, 4: strong)
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  percentage: number;
  suggestions: string[];
}

export interface PasswordValidationResult {
  isValid: boolean;
  criteria: PasswordCriteria;
  strength: PasswordStrength;
  errors: string[];
}

/**
 * Validates password against comprehensive criteria
 * @param password - The password to validate
 * @param minLength - Minimum required length (default: 6)
 * @returns PasswordValidationResult with detailed analysis
 */
export function validatePassword(password: string, minLength: number = 6): PasswordValidationResult {
  // Check individual criteria
  const criteria: PasswordCriteria = {
    minLength: password.length >= minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Calculate strength score
  let score = 0;
  const suggestions: string[] = [];
  const errors: string[] = [];

  // Base score for minimum length
  if (criteria.minLength) {
    score += 1;
  } else {
    errors.push(`Password must be at least ${minLength} characters long`);
    suggestions.push(`Use at least ${minLength} characters`);
  }

  // Additional points for complexity
  if (criteria.hasUppercase) {
    score += 1;
  } else {
    suggestions.push('Add uppercase letters (A-Z)');
  }

  if (criteria.hasLowercase) {
    score += 1;
  } else {
    suggestions.push('Add lowercase letters (a-z)');
  }

  if (criteria.hasNumber) {
    score += 1;
  } else {
    suggestions.push('Add numbers (0-9)');
  }

  if (criteria.hasSpecialChar) {
    score += 1;
  } else {
    suggestions.push('Add special characters (!@#$%^&*)');
  }

  // Bonus points for length
  if (password.length >= 12) {
    score += 0.5;
  } else if (password.length >= 8) {
    score += 0.25;
  }

  // Cap score at 4
  score = Math.min(score, 4);

  // Determine strength label and color
  let label: PasswordStrength['label'];
  let color: string;
  let percentage: number;

  if (score < 1) {
    label = 'Very Weak';
    color = 'text-red-600 dark:text-red-400';
    percentage = 10;
  } else if (score < 2) {
    label = 'Weak';
    color = 'text-red-500 dark:text-red-400';
    percentage = 25;
  } else if (score < 3) {
    label = 'Fair';
    color = 'text-yellow-500 dark:text-yellow-400';
    percentage = 50;
  } else if (score < 4) {
    label = 'Good';
    color = 'text-blue-500 dark:text-blue-400';
    percentage = 75;
  } else {
    label = 'Strong';
    color = 'text-green-500 dark:text-green-400';
    percentage = 100;
  }

  const strength: PasswordStrength = {
    score,
    label,
    color,
    percentage,
    suggestions: suggestions.slice(0, 3), // Limit suggestions to prevent UI overflow
  };

  // Password is considered valid if it meets minimum requirements
  const isValid = criteria.minLength && score >= 2; // At least Fair strength

  return {
    isValid,
    criteria,
    strength,
    errors,
  };
}

/**
 * Get progress bar color based on password strength
 */
export function getProgressBarColor(strength: PasswordStrength): string {
  switch (strength.label) {
    case 'Very Weak':
      return 'bg-red-500';
    case 'Weak':
      return 'bg-red-400';
    case 'Fair':
      return 'bg-yellow-400';
    case 'Good':
      return 'bg-blue-400';
    case 'Strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

/**
 * Check if passwords match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): {
  isValid: boolean;
  error?: string;
} {
  if (!confirmPassword) {
    return { isValid: false };
  }
  
  if (password !== confirmPassword) {
    return { 
      isValid: false, 
      error: "Passwords don't match" 
    };
  }
  
  return { isValid: true };
}

/**
 * Generate secure password suggestions
 */
export function generatePasswordSuggestion(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining length with random characters
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}