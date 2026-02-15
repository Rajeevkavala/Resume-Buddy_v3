/**
 * Prompt Optimization Utilities
 * Reduces token count by compressing prompts and content intelligently
 */

/**
 * Compress a prompt by removing unnecessary whitespace and formatting
 * @param prompt - The prompt text to compress
 * @returns Compressed prompt with reduced token count
 */
export function compressPrompt(prompt: string): string {
  return prompt
    .replace(/\n{3,}/g, '\n\n')           // Max 2 consecutive newlines
    .replace(/[ \t]+/g, ' ')               // Single spaces only
    .replace(/^\s+|\s+$/gm, '')            // Trim each line
    .trim();
}

/**
 * Estimate token count for a text
 * Rough estimate: 1 token ≈ 4 characters for English text
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Extract sections from resume text
 */
function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionPatterns = [
    { name: 'contact', pattern: /(?:contact|email|phone|address)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i },
    { name: 'summary', pattern: /(?:summary|objective|profile|about)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i },
    { name: 'experience', pattern: /(?:experience|employment|work\s*history|professional\s*experience)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i },
    { name: 'skills', pattern: /(?:skills|technologies|competencies|technical\s*skills)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i },
    { name: 'education', pattern: /(?:education|academic|qualifications|degrees?)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i },
    { name: 'projects', pattern: /(?:projects|portfolio|personal\s*projects)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i },
    { name: 'certifications', pattern: /(?:certifications?|licenses?|credentials?)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i },
  ];

  for (const { name, pattern } of sectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      sections[name] = match[0].trim();
    }
  }

  return sections;
}

/**
 * Truncate resume to essential sections while staying within token limit
 * @param resumeText - Full resume text
 * @param maxTokens - Maximum tokens allowed (default: 2000)
 * @returns Truncated resume text
 */
export function truncateResume(resumeText: string, maxTokens: number = 2000): string {
  const estimatedTokens = estimateTokens(resumeText);

  if (estimatedTokens <= maxTokens) {
    return resumeText;
  }

  // Priority order for sections (most important first)
  const priorityOrder = ['summary', 'experience', 'skills', 'education', 'projects', 'certifications', 'contact'];
  const sections = extractSections(resumeText);

  let result = '';
  let currentTokens = 0;

  for (const section of priorityOrder) {
    const sectionText = sections[section] || '';
    if (!sectionText) continue;

    const sectionTokens = estimateTokens(sectionText);

    if (currentTokens + sectionTokens <= maxTokens) {
      result += sectionText + '\n\n';
      currentTokens += sectionTokens;
    } else {
      // Try to add a truncated version of remaining content
      const remainingTokens = maxTokens - currentTokens;
      if (remainingTokens > 100) {
        const truncatedLength = remainingTokens * 4;
        result += sectionText.substring(0, truncatedLength) + '...';
      }
      break;
    }
  }

  return result.trim();
}

/**
 * Extract only relevant context from job description
 * @param jobDescription - Full job description
 * @param maxLength - Maximum character length (default: 1500)
 * @returns Extracted relevant content
 */
export function extractRelevantJobContext(
  jobDescription: string,
  maxLength: number = 1500
): string {
  // Extract priority sections
  const sectionPatterns = [
    /(?:requirements?|qualifications?)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i,
    /(?:responsibilities|duties|what\s*you['']?ll\s*do)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i,
    /(?:skills|technologies|must\s*have|nice\s*to\s*have)[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/i,
  ];

  const sections: string[] = [];

  for (const pattern of sectionPatterns) {
    const match = jobDescription.match(pattern);
    if (match) {
      sections.push(match[0].trim());
    }
  }

  let result = sections.join('\n\n');

  // If no sections found, use the original text
  if (!result) {
    result = jobDescription;
  }

  // Truncate if needed
  if (result.length > maxLength) {
    result = result.substring(0, maxLength) + '...';
  }

  return result;
}

/**
 * Optimize prompt for minimum token usage
 * Combines compression and truncation strategies
 */
export function optimizePrompt(
  prompt: string,
  maxTokens: number = 3000
): { prompt: string; originalTokens: number; optimizedTokens: number; savings: number } {
  const originalTokens = estimateTokens(prompt);
  
  // Step 1: Compress whitespace
  let optimized = compressPrompt(prompt);
  
  // Step 2: Truncate if still over limit
  if (estimateTokens(optimized) > maxTokens) {
    const maxChars = maxTokens * 4;
    optimized = optimized.substring(0, maxChars) + '...';
  }
  
  const optimizedTokens = estimateTokens(optimized);
  const savings = ((originalTokens - optimizedTokens) / originalTokens) * 100;

  return {
    prompt: optimized,
    originalTokens,
    optimizedTokens,
    savings: Math.round(savings * 10) / 10,
  };
}

/**
 * Create minimal output schema field names
 * Maps verbose field names to shorter versions for token savings
 */
export const minimalFieldMap: Record<string, string> = {
  'atsScore': 's',
  'score': 's',
  'foundKeywords': 'f',
  'missingKeywords': 'm',
  'summary': 'sm',
  'improvements': 'imp',
  'questions': 'q',
  'suggestions': 'sg',
  'analysis': 'a',
};

/**
 * Expand minimal response fields back to full names
 */
export function expandMinimalResponse<T extends Record<string, unknown>>(
  minimal: Record<string, unknown>
): T {
  const reverseMap: Record<string, string> = {};
  for (const [full, short] of Object.entries(minimalFieldMap)) {
    reverseMap[short] = full;
  }

  const expanded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(minimal)) {
    const fullKey = reverseMap[key] || key;
    expanded[fullKey] = value;
  }

  return expanded as T;
}
