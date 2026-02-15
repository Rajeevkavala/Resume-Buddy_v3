/**
 * Resume Parser Utility
 * Extracts structured data from plain text resume content
 */

import { ResumeData } from './types';

/**
 * Helper function to clean institution name from location, dates, and other details
 */
function cleanInstitutionName(institutionText: string): string {
  let cleaned = institutionText.trim();
  
  // Handle the specific case: "ML) | Malla Reddy University | Hyderabad, India | 2023-Present"
  // First remove everything after the institution name (location and dates)
  
  // Split by pipe separator and find the institution name
  if (cleaned.includes('|')) {
    const parts = cleaned.split('|').map(part => part.trim());
    // Find the part that contains university/college keywords
    const institutionPart = parts.find(part => 
      /University|College|Institute|School|Academy|Polytechnic/i.test(part) &&
      !/(^\d{4}|Present$|Current$)/i.test(part) && // Not a date
      !/^[A-Z][a-z]+,\s*[A-Z]/i.test(part) // Not a location
    );
    
    if (institutionPart) {
      cleaned = institutionPart.trim();
    } else {
      // Fallback: take the second part if it exists (common pattern)
      cleaned = parts[1] || parts[0];
    }
  }
  
  // Remove parenthetical content at the beginning (like "ML)")
  cleaned = cleaned.replace(/^[^)]*\)\s*/, '');
  
  // Remove location patterns (City, State or City, Country)
  cleaned = cleaned.replace(/,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*([A-Z]{2,}|[A-Z][a-z]+).*$/, '');
  
  // Remove date patterns at the end
  cleaned = cleaned.replace(/\s*[-–]\s*\d{4}.*$/, '');
  cleaned = cleaned.replace(/\s*[-–]\s*Present.*$/i, '');
  cleaned = cleaned.replace(/\s*\d{4}[-–]\d{4}.*$/, '');
  cleaned = cleaned.replace(/\s*\d{4}[-–]Present.*$/i, '');
  cleaned = cleaned.replace(/\s*\w{3,}\s+\d{4}.*$/, '');
  
  // Remove extra whitespace and clean up
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Helper function to parse a complex education line and extract institution, location, and date
 */
function parseEducationLine(line: string): { institution: string; location?: string; graduationDate?: string } {
  let institution = '';
  let location = '';
  let graduationDate = '';
  
  if (line.includes('|')) {
    // Handle pipe-separated format: "Institution | Location | Date"
    const parts = line.split('|').map(part => part.trim());
    
    // Find institution (contains university/college keywords)
    const institutionPart = parts.find(part => 
      /University|College|Institute|School|Academy|Polytechnic/i.test(part) &&
      !/(^\d{4}|Present$|Current$)/i.test(part) && // Not a date
      !/^[A-Z][a-z]+,\s*[A-Z]/i.test(part) // Not a location pattern
    );
    
    if (institutionPart) {
      institution = institutionPart;
    } else if (parts.length > 0) {
      // Fallback to first non-date, non-location part
      institution = parts.find(part => 
        !/(^\d{4}|Present$|Current$|[-–]\d{4}|[-–]Present)/i.test(part) &&
        !/^[A-Z][a-z]+,\s*[A-Z]/i.test(part)
      ) || parts[0];
    }
    
    // Find location (City, State/Country pattern)
    const locationPart = parts.find(part => 
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*([A-Z]{2,}|[A-Z][a-z]+)$/i.test(part)
    );
    if (locationPart) {
      location = locationPart;
    }
    
    // Find graduation date
    const datePart = parts.find(part => 
      /(^\d{4}|Present$|Current$|[-–]\d{4}|[-–]Present|\d{4}[-–]\d{4}|\d{4}[-–]Present)/i.test(part)
    );
    if (datePart) {
      graduationDate = datePart;
    }
  } else {
    // No pipes, try to extract from the whole line
    institution = cleanInstitutionName(line);
    
    // Extract location
    const locationMatch = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2,}|[A-Z][a-z]+)/);
    if (locationMatch) {
      location = locationMatch[0];
    }
    
    // Extract date
    const dateMatch = line.match(/(\d{4}[-–]\d{4}|\d{4}[-–]Present|\d{4}|Present)/i);
    if (dateMatch) {
      graduationDate = dateMatch[0];
    }
  }
  
  return {
    institution: institution.trim(),
    location: location.trim() || undefined,
    graduationDate: graduationDate.trim() || undefined
  };
}

/**
 * Parse resume text into structured ResumeData
 */
export function parseResumeText(resumeText: string): ResumeData {
  const lines = resumeText.split('\n').filter(line => line.trim());
  
  // Extract personal info from the beginning
  const personalInfo = extractPersonalInfo(resumeText);
  
  // Extract sections
  const summary = extractSection(resumeText, ['summary', 'objective', 'profile']);
  const skills = extractSkills(resumeText);
  const experience = extractExperience(resumeText);
  const education = extractEducation(resumeText);
  const projects = extractProjects(resumeText);
  const certifications = extractCertifications(resumeText);
  const awards = extractAwards(resumeText);
  const languages = extractLanguages(resumeText);
  
  return {
    personalInfo,
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    awards,
    languages,
  };
}

function extractPersonalInfo(text: string): ResumeData['personalInfo'] {
  const lines = text.split('\n').slice(0, 15); // Check first 15 lines for === format
  
  // Extract name - handle === NAME === format from AI improvements
  let fullName = 'Your Name';
  
  // First, try to find name in === NAME === format
  const nameHeaderMatch = text.match(/^=+\s*([^=\n]+?)\s*=+$/m);
  if (nameHeaderMatch && nameHeaderMatch[1]) {
    const extractedName = nameHeaderMatch[1].trim();
    // Make sure it's not a section header like "PROFESSIONAL SUMMARY"
    const sectionHeaders = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'technical', 'professional'];
    if (!sectionHeaders.some(h => extractedName.toLowerCase().includes(h)) && extractedName.length < 50) {
      fullName = extractedName;
    }
  }
  
  // Fallback to first line if no === format found
  if (fullName === 'Your Name') {
    const firstLine = lines[0]?.trim();
    // Clean === markers from first line
    const cleanedFirst = firstLine?.replace(/^=+\s*|\s*=+$/g, '').trim();
    if (cleanedFirst && cleanedFirst.length < 50 && !cleanedFirst.includes('@') && !cleanedFirst.includes('http')) {
      fullName = cleanedFirst;
    }
  }
  
  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  // Extract location
  const locationMatch = text.match(/([A-Z][a-z]+,?\s*[A-Z]{2}|[A-Z][a-z]+\s*,\s*[A-Z][a-z]+)/);
  const location = locationMatch ? locationMatch[0] : '';
  
  // Extract LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : undefined;
  
  // Extract GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  const github = githubMatch ? `https://${githubMatch[0]}` : undefined;
  
  // Extract portfolio/website
  const portfolioMatch = text.match(/https?:\/\/(?!linkedin|github)[\w.-]+\.\w+/);
  const portfolio = portfolioMatch && !portfolioMatch[0].includes('linkedin') && !portfolioMatch[0].includes('github') 
    ? portfolioMatch[0] 
    : undefined;
  
  return {
    fullName,
    email,
    phone,
    location,
    linkedin,
    github,
    portfolio,
  };
}

function extractSection(text: string, headers: string[]): string {
  // Try multiple regex patterns for different resume formats
  const patterns = [
    // === SECTION === format from AI improvements (highest priority)
    new RegExp(`(?:^|\\n)\\s*=+\\s*(${headers.join('|')})\\s*=+\\s*\\n([\\s\\S]*?)(?=\\n\\s*=+\\s*[A-Z][A-Za-z\\s]+\\s*=+|$)`, 'i'),
    // Standard format: "SECTION NAME:\n content"
    new RegExp(`(?:^|\\n)\\s*(${headers.join('|')})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:[A-Z][A-Za-z\\s]+:?\\s*\\n|$))`, 'i'),
    // Bold/caps format: "SECTION NAME" followed by content
    new RegExp(`(?:^|\\n)\\s*(${headers.join('|')})\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:[A-Z][A-Za-z\\s]+\\s*\\n|$))`, 'i'),
    // Inline format: "Section:" content on same line
    new RegExp(`(?:^|\\n)\\s*(${headers.join('|')})\\s*:?\\s+([^\\n]+(?:\\n(?!\\s*[A-Z][A-Za-z\\s]+:?\\s*)[^\\n]*)*)`, 'i')
  ];
  
  for (const regex of patterns) {
    const match = text.match(regex);
    if (match && match[2]) {
      // Clean up === markers and extra whitespace from content
      let content = match[2].trim();
      content = content.replace(/^=+\s*/gm, '').replace(/\s*=+$/gm, '');
      // For summary/objective, return the full content
      if (headers.some(h => ['summary', 'objective', 'profile'].includes(h.toLowerCase()))) {
        return content;
      }
      return content;
    }
  }
  
  return '';
}

function extractSkills(text: string): ResumeData['skills'] {
  const skillsSection = extractSection(text, ['skills', 'technical skills', 'core competencies', 'expertise']);
  
  if (!skillsSection) return [];
  
  // Try to detect skill categories
  const lines = skillsSection.split('\n');
  const skills: ResumeData['skills'] = [];
  
  lines.forEach(line => {
    // Check if line has a category format (e.g., "Programming Languages: Java, Python")
    const categoryMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (categoryMatch) {
      const category = categoryMatch[1].trim();
      const items = categoryMatch[2].split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        skills.push({ category, items });
      }
    } else {
      // If no category, try to split by common delimiters
      const items = line.split(/[,;|•·]/).map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        skills.push({ category: 'Skills', items });
      }
    }
  });
  
  // If no skills extracted, create a single category with all items
  if (skills.length === 0 && skillsSection) {
    const items = skillsSection.split(/[,;|•·\n]/).map(s => s.trim()).filter(Boolean);
    if (items.length > 0) {
      skills.push({ category: 'Technical Skills', items });
    }
  }
  
  return skills;
}

function extractExperience(text: string): ResumeData['experience'] {
  const experienceSection = extractSection(text, ['experience', 'work experience', 'employment', 'professional experience']);
  
  if (!experienceSection) return [];
  
  // Enhanced splitting for various resume formats
  let entries: string[] = [];
  
  // Try splitting by double newlines first
  const doubleNewlineSplit = experienceSection.split(/\n\n+/);
  
  if (doubleNewlineSplit.length > 1) {
    entries = doubleNewlineSplit;
  } else {
    // If no double newlines, try to identify job entries by patterns
    const lines = experienceSection.split('\n');
    let currentEntry = '';
    let entries_temp: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new job entry
      const isNewJobEntry = 
        // Starts with job title patterns
        /^[A-Z][A-Za-z\s]+(Manager|Developer|Engineer|Analyst|Specialist|Coordinator|Director|Lead|Senior|Junior|Associate|Intern)/i.test(line) ||
        // Has job title - company format
        /^[A-Z][A-Za-z\s]+\s*[-–]\s*[A-Z][A-Za-z\s]+/.test(line) ||
        // Has "at Company" format
        /^[A-Z][A-Za-z\s]+\s+at\s+[A-Z][A-Za-z\s]+/i.test(line) ||
        // Company name followed by title on next line pattern
        (line.match(/^[A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Ltd|Company|Co\.|Group|Associates)/) && 
         i < lines.length - 1 && 
         /^[A-Z][A-Za-z\s]+(Manager|Developer|Engineer|Analyst|Specialist)/i.test(lines[i + 1]?.trim() || ''));
      
      if (isNewJobEntry && currentEntry.trim()) {
        // Save previous entry and start new one
        entries_temp.push(currentEntry.trim());
        currentEntry = line;
      } else {
        // Add to current entry
        currentEntry += (currentEntry ? '\n' : '') + line;
      }
    }
    
    // Add the last entry
    if (currentEntry.trim()) {
      entries_temp.push(currentEntry.trim());
    }
    
    entries = entries_temp.length > 0 ? entries_temp : [experienceSection];
  }
  const experience: ResumeData['experience'] = [];
  
  // Process all experience entries
  entries.forEach(entry => {
    const lines = entry.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;
    
    let title = '';
    let company = '';
    let location = '';
    let startDate = '';
    let endDate = '';
    let current = false;
    const achievements: string[] = [];
    
    // Process each line with enhanced parsing
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      // First line: Try to extract job title, company, and dates
      if (idx === 0) {
        // Enhanced date pattern matching various formats
        const datePattern = /(\w{3}\s+\d{4}|\d{1,2}\/\d{2,4}|\d{4})\s*[-–]\s*(\w{3}\s+\d{4}|\d{1,2}\/\d{2,4}|\d{4}|Present|Current)/i;
        const dateMatch = trimmedLine.match(datePattern);
        
        if (dateMatch) {
          startDate = dateMatch[1].trim();
          const end = dateMatch[2].trim();
          if (end.toLowerCase().includes('present') || end.toLowerCase().includes('current')) {
            endDate = 'Present';
            current = true;
          } else {
            endDate = end;
          }
          
          // Remove date portion to extract title and company
          let lineWithoutDate = trimmedLine.replace(datePattern, '').trim();
          // Clean up separators at the end
          lineWithoutDate = lineWithoutDate.replace(/[,|\s]*$/, '').trim();
          
          // Enhanced parsing for title and company
          // Try different separator patterns
          const separatorPatterns = [
            /\s*[-–]\s*/,           // dash
            /\s*\|\s*/,             // pipe
            /\s+at\s+/i,            // "at"
            /,\s*/,                 // comma
            /\s*•\s*/               // bullet
          ];
          
          let parts: string[] = [];
          for (const pattern of separatorPatterns) {
            parts = lineWithoutDate.split(pattern).filter(Boolean);
            if (parts.length >= 2) break;
          }
          
          if (parts.length >= 2) {
            title = parts[0].trim();
            company = parts[1].trim();
            // Check if there's location in the company part
            const locationInCompany = company.match(/^([^,]+),\s*(.+)$/);
            if (locationInCompany) {
              company = locationInCompany[1].trim();
              location = locationInCompany[2].trim();
            }
          } else if (parts.length === 1) {
            title = parts[0].trim();
          }
        } else {
          // No date in first line, enhanced title/company extraction
          const separatorPatterns = [
            /\s*[-–]\s*/,
            /\s+at\s+/i,
            /,\s*/,
            /\s*\|\s*/
          ];
          
          let parts: string[] = [];
          for (const pattern of separatorPatterns) {
            parts = trimmedLine.split(pattern).filter(Boolean);
            if (parts.length >= 2) break;
          }
          
          if (parts.length >= 2) {
            title = parts[0].trim();
            company = parts[1].trim();
            // Extract location from company if present
            const locationInCompany = company.match(/^([^,]+),\s*(.+)$/);
            if (locationInCompany) {
              company = locationInCompany[1].trim();
              location = locationInCompany[2].trim();
            }
          } else {
            title = trimmedLine;
          }
        }
      }
      // Second line might contain additional info
      else if (idx === 1) {
        // Check if this line is an achievement (starts with bullet)
        if (trimmedLine.match(/^[•·\-\*]\s+/)) {
          const achievement = trimmedLine.replace(/^[•·\-\*]\s+/, '').trim();
          if (achievement) {
            achievements.push(achievement);
          }
        }
        // Check for dates if not already found
        else if (!startDate) {
          const datePattern = /(\w{3}\s+\d{4}|\d{1,2}\/\d{2,4})\s*[-–]\s*(\w{3}\s+\d{4}|\d{1,2}\/\d{2,4}|Present|Current)/i;
          const dateMatch = trimmedLine.match(datePattern);
          
          if (dateMatch) {
            startDate = dateMatch[1].trim();
            const end = dateMatch[2].trim();
            if (end.toLowerCase() === 'present' || end.toLowerCase() === 'current') {
              endDate = 'Present';
              current = true;
            } else {
              endDate = end;
            }
          }
          // Check if this line is a company name (if not found yet)
          else if (!company && !trimmedLine.match(/^\d{1,2}\/\d{2,4}|\w{3}\s+\d{4}/)) {
            company = trimmedLine;
          }
          // Check for location
          else {
            const locationPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+([A-Z]{2}|[A-Z][a-z]+)/;
            const locationMatch = trimmedLine.match(locationPattern);
            if (locationMatch && !location) {
              location = trimmedLine.replace(/,\s*$/, '').trim();
            }
          }
        }
      }
      // Additional lines for location, dates, or achievements
      else {
        // First check if this is an achievement (bullet point)
        if (trimmedLine.match(/^[•·\-\*]\s+/)) {
          const achievement = trimmedLine.replace(/^[•·\-\*]\s+/, '').trim();
          if (achievement) {
            achievements.push(achievement);
          }
        }
        // Check for dates if not already found and not a bullet point
        else if (!startDate) {
          const datePattern = /(\w{3}\s+\d{4}|\d{1,2}\/\d{2,4})\s*[-–]\s*(\w{3}\s+\d{4}|\d{1,2}\/\d{2,4}|Present|Current)/i;
          const dateMatch = trimmedLine.match(datePattern);
          
          if (dateMatch) {
            startDate = dateMatch[1].trim();
            const end = dateMatch[2].trim();
            if (end.toLowerCase() === 'present' || end.toLowerCase() === 'current') {
              endDate = 'Present';
              current = true;
            } else {
              endDate = end;
            }
          }
          // Check for location if not found and no date
          else if (!location) {
            const locationPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+([A-Z]{2}|[A-Z][a-z]+)/;
            const locationMatch = trimmedLine.match(locationPattern);
            if (locationMatch && trimmedLine.length < 50) {
              location = trimmedLine.replace(/,\s*$/, '').trim();
            }
            // If not a location pattern, might be an achievement without bullet
            else if (trimmedLine.length > 20 && !trimmedLine.match(/^[A-Z][a-z]+,?\s+[A-Z]{2}$/)) {
              achievements.push(trimmedLine);
            }
          }
          // Not a date or location, might be achievement
          else if (trimmedLine.length > 20 && !trimmedLine.match(/^[A-Z][a-z]+,?\s+[A-Z]{2}$/)) {
            achievements.push(trimmedLine);
          }
        }
        // If dates and location are found, treat remaining lines as achievements
        else if (trimmedLine.length > 10) {
          achievements.push(trimmedLine);
        }
      }
    });
    
    // Fallback values
    if (!title) title = 'Position Title';
    if (!company) company = 'Company Name';
    if (!location) location = 'Location';
    if (!startDate) startDate = 'Start Date';
    if (!endDate && !current) endDate = 'End Date';
    
    // If no achievements were found, create a placeholder
    if (achievements.length === 0) {
      achievements.push('Key responsibilities and achievements');
    }
    
    experience.push({
      title,
      company,
      location,
      startDate,
      endDate,
      current,
      achievements,
    });
  });
  
  return experience;
}

function extractEducation(text: string): ResumeData['education'] {
  const educationSection = extractSection(text, ['education', 'academic', 'qualifications', 'academic background', 'educational background']);
  
  if (!educationSection) return [];
  
  // Enhanced splitting patterns for different resume formats
  let entries: string[] = [];
  
  // Try splitting by double newlines first
  const doubleNewlineSplit = educationSection.split(/\n\n+/);
  
  if (doubleNewlineSplit.length > 1) {
    entries = doubleNewlineSplit;
  } else {
    // Try to identify education entries by degree patterns
    const lines = educationSection.split('\n');
    let currentEntry = '';
    let entries_temp: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new education entry
      const isNewEducationEntry = 
        // Degree patterns
        /^(Bachelor|Master|PhD|Doctorate|Associate|Certificate|Diploma|B\.?[AS]|M\.?[AS]|Ph\.?D|B\.?Sc|M\.?Sc|B\.?Tech|M\.?Tech|MBA|JD|MD)/i.test(line) ||
        // Institution patterns (common university indicators)
        /University|College|Institute|School|Academy|Polytechnic|Community College/i.test(line) && 
        !/^[•·\-\*]\s+/.test(line) && // Not a bullet point
        line.length < 100; // Reasonable length for institution name
      
      if (isNewEducationEntry && currentEntry.trim()) {
        // Save previous entry and start new one
        entries_temp.push(currentEntry.trim());
        currentEntry = line;
      } else {
        // Add to current entry
        currentEntry += (currentEntry ? '\n' : '') + line;
      }
    }
    
    // Add the last entry
    if (currentEntry.trim()) {
      entries_temp.push(currentEntry.trim());
    }
    
    entries = entries_temp.length > 0 ? entries_temp : [educationSection];
  }
  
  const education: ResumeData['education'] = [];
  
  // Limit to 3 education entries for resume format
  entries.slice(0, 3).forEach(entry => {
    const lines = entry.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;
    
    let degree = '';
    let institution = '';
    let location = '';
    let graduationDate = '';
    let gpa = '';
    let honors: string[] = [];
    let major = '';
    let minor = '';
    
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      // Enhanced parsing for each line
      if (idx === 0) {
        // First line: Try multiple formats
        
        // Format: "Degree in Major - Institution"
        let degreeInstMatch = trimmedLine.match(/^(.+?)\s*[-–]\s*(.+)$/);
        if (degreeInstMatch) {
          const leftPart = degreeInstMatch[1].trim();
          const rightPart = degreeInstMatch[2].trim();
          
          // Check which part is the degree vs institution
          const degreePattern = /(Bachelor|Master|PhD|Doctorate|Associate|Certificate|Diploma|B\.?[AS]|M\.?[AS]|Ph\.?D|B\.?Sc|M\.?Sc|B\.?Tech|M\.?Tech|MBA|JD|MD)/i;
          
          if (degreePattern.test(leftPart)) {
            degree = leftPart;
            // Parse the right part which may contain institution, location, and dates
            const rightPartData = parseEducationLine(rightPart);
            institution = rightPartData.institution;
            if (rightPartData.location && !location) location = rightPartData.location;
            if (rightPartData.graduationDate && !graduationDate) graduationDate = rightPartData.graduationDate;
          } else if (degreePattern.test(rightPart)) {
            const leftPartData = parseEducationLine(leftPart);
            institution = leftPartData.institution;
            degree = rightPart;
            if (leftPartData.location && !location) location = leftPartData.location;
            if (leftPartData.graduationDate && !graduationDate) graduationDate = leftPartData.graduationDate;
          } else {
            // Default assignment
            degree = leftPart;
            const rightPartData = parseEducationLine(rightPart);
            institution = rightPartData.institution;
            if (rightPartData.location && !location) location = rightPartData.location;
            if (rightPartData.graduationDate && !graduationDate) graduationDate = rightPartData.graduationDate;
          }
        }
        // Format: "Degree, Institution"
        else {
          degreeInstMatch = trimmedLine.match(/^(.+?),\s*(.+)$/);
          if (degreeInstMatch) {
            degree = degreeInstMatch[1].trim();
            institution = cleanInstitutionName(degreeInstMatch[2].trim());
          }
          // Format: "Degree at Institution"
          else {
            degreeInstMatch = trimmedLine.match(/^(.+?)\s+at\s+(.+)$/i);
            if (degreeInstMatch) {
              degree = degreeInstMatch[1].trim();
              institution = cleanInstitutionName(degreeInstMatch[2].trim());
            }
            // Single line - determine if it's degree or institution
            else {
              const degreePattern = /(Bachelor|Master|PhD|Doctorate|Associate|Certificate|Diploma|B\.?[AS]|M\.?[AS]|Ph\.?D|B\.?Sc|M\.?Sc|B\.?Tech|M\.?Tech|MBA|JD|MD)/i;
              const institutionPattern = /University|College|Institute|School|Academy|Polytechnic/i;
              
              if (degreePattern.test(trimmedLine)) {
                degree = trimmedLine;
              } else if (institutionPattern.test(trimmedLine)) {
                institution = cleanInstitutionName(trimmedLine);
              } else {
                // Default to degree
                degree = trimmedLine;
              }
            }
          }
        }
        
        // Extract major from degree if present
        const majorMatch = degree.match(/(?:in|of)\s+([^,]+)/i);
        if (majorMatch) {
          major = majorMatch[1].trim();
        }
      }
      else {
        // Subsequent lines: Look for specific information patterns
        
        // Institution (if not found)
        if (!institution && /University|College|Institute|School|Academy|Polytechnic/i.test(trimmedLine)) {
          institution = cleanInstitutionName(trimmedLine);
        }
        // Degree (if not found)
        else if (!degree && /(Bachelor|Master|PhD|Doctorate|Associate|Certificate|Diploma|B\.?[AS]|M\.?[AS]|Ph\.?D|B\.?Sc|M\.?Sc|B\.?Tech|M\.?Tech|MBA|JD|MD)/i.test(trimmedLine)) {
          degree = trimmedLine;
        }
        // GPA patterns
        else if (!gpa) {
          const gpaMatch = trimmedLine.match(/GPA:?\s*(\d+\.?\d*)\s*(?:\/\s*(\d+\.?\d*))?/i) ||
                          trimmedLine.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)\s*GPA/i) ||
                          trimmedLine.match(/Cumulative GPA:?\s*(\d+\.?\d*)/i);
          if (gpaMatch) {
            gpa = gpaMatch[1];
            if (gpaMatch[2]) {
              gpa += `/${gpaMatch[2]}`;
            }
          }
        }
        // Honors/Awards patterns
        else if (honors.length === 0) {
          const honorsMatch = trimmedLine.match(/(Summa Cum Laude|Magna Cum Laude|Cum Laude|With Honors|Dean's List|Honor Roll|Academic Excellence)/gi);
          if (honorsMatch) {
            honors = honorsMatch;
          }
        }
        // Date patterns (enhanced)
        else if (!graduationDate) {
          const dateMatch = trimmedLine.match(/(?:Graduated?:?\s*)?(\w{3,}\s+\d{4}|\d{4}|\d{1,2}\/\d{2,4}|Expected\s+\d{4}|Class\s+of\s+\d{4})/i) ||
                          trimmedLine.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Current)/i);
          if (dateMatch) {
            graduationDate = dateMatch[1];
            // Handle date ranges
            if (dateMatch[2]) {
              graduationDate = dateMatch[2].toLowerCase().includes('present') || dateMatch[2].toLowerCase().includes('current') 
                ? `${dateMatch[1]} - Present` 
                : `${dateMatch[1]} - ${dateMatch[2]}`;
            }
          }
        }
        // Location patterns
        else if (!location) {
          const locationMatch = trimmedLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2,}|[A-Z][a-z]+)$/);
          if (locationMatch && trimmedLine.length < 50) {
            location = trimmedLine;
          }
        }
        // Major/Minor (if not already extracted)
        else if (!major && /Major:?\s*(.+)/i.test(trimmedLine)) {
          const majorMatch = trimmedLine.match(/Major:?\s*(.+)/i);
          if (majorMatch) major = majorMatch[1].trim();
        }
        else if (!minor && /Minor:?\s*(.+)/i.test(trimmedLine)) {
          const minorMatch = trimmedLine.match(/Minor:?\s*(.+)/i);
          if (minorMatch) minor = minorMatch[1].trim();
        }
      }
    });
    
    // Enhanced fallback logic
    if (!degree) {
      degree = major ? `Degree in ${major}` : 'Degree';
    }
    if (!institution) institution = 'University Name';
    if (!location) location = '';
    if (!graduationDate) graduationDate = '';
    
    // Construct the education object with enhanced fields
    const educationEntry: ResumeData['education'][0] = {
      degree,
      institution,
      location,
      graduationDate,
    };
    
    // Add optional fields if they exist
    if (gpa) educationEntry.gpa = gpa;
    if (honors.length > 0) educationEntry.honors = honors;
    if (major && !degree.toLowerCase().includes(major.toLowerCase())) {
      educationEntry.major = major;
    }
    if (minor) educationEntry.minor = minor;
    
    education.push(educationEntry);
  });
  
  return education;
}

function extractProjects(text: string): ResumeData['projects'] {
  const projectsSection = extractSection(text, ['projects', 'personal projects', 'key projects', 'notable projects', 'side projects']);
  
  if (!projectsSection) return undefined;
  
  // Enhanced splitting for different project formats
  let entries: string[] = [];
  
  // Try splitting by double newlines first
  const doubleNewlineSplit = projectsSection.split(/\n\n+/);
  
  if (doubleNewlineSplit.length > 1) {
    entries = doubleNewlineSplit;
  } else {
    // Try to identify project entries by patterns
    const lines = projectsSection.split('\n');
    let currentEntry = '';
    let entries_temp: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new project
      const isNewProjectEntry = 
        // Starts with project title patterns (not bullet points)
        (!line.match(/^[•·\-\*]\s+/) && 
         line.length > 5 && 
         line.length < 80 && 
         !line.includes(':') &&
         /^[A-Z]/.test(line)) ||
        // Has "Project:" format
        /^Project\s*:/i.test(line) ||
        // Numbered projects
        /^\d+\.\s+/.test(line);
      
      if (isNewProjectEntry && currentEntry.trim()) {
        // Save previous entry and start new one
        entries_temp.push(currentEntry.trim());
        currentEntry = line;
      } else {
        // Add to current entry
        currentEntry += (currentEntry ? '\n' : '') + line;
      }
    }
    
    // Add the last entry
    if (currentEntry.trim()) {
      entries_temp.push(currentEntry.trim());
    }
    
    entries = entries_temp.length > 0 ? entries_temp : [projectsSection];
  }
  
  const projects: NonNullable<ResumeData['projects']> = [];
  
  // Limit to 5 projects for resume format
  entries.slice(0, 5).forEach(entry => {
    const lines = entry.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;
    
    let name = '';
    let description = '';
    let link = '';
    let githubUrl = '';
    let liveDemoUrl = '';
    const technologies: string[] = [];
    const achievements: string[] = [];
    
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      if (idx === 0) {
        // First line: Project name (remove numbering if present)
        name = trimmedLine.replace(/^\d+\.\s*/, '').replace(/^Project\s*:\s*/i, '').trim();
      } else {
        // Subsequent lines: Look for specific patterns
        
        // Check for GitHub/project links
        const githubLabelMatch = trimmedLine.match(/GitHub\s*:\s*(https?:\/\/[^\s|]+)/i);
        const liveLabelMatch = trimmedLine.match(/(?:Live|Demo)\s*:\s*(https?:\/\/[^\s|]+)/i);
        if (githubLabelMatch?.[1]) {
          githubUrl = githubLabelMatch[1];
        }
        if (liveLabelMatch?.[1]) {
          liveDemoUrl = liveLabelMatch[1];
        }
        if (trimmedLine.match(/https?:\/\//)) {
          // If it's a GitHub URL, prefer githubUrl. Otherwise treat as liveDemoUrl.
          if (/github\.com\//i.test(trimmedLine) && !githubUrl) githubUrl = trimmedLine;
          else if (!/github\.com\//i.test(trimmedLine) && !liveDemoUrl) liveDemoUrl = trimmedLine;
          if (!link) link = trimmedLine;
        }
        // Check for technology lists
        else if (trimmedLine.match(/^(Technologies?|Tech Stack|Built with|Tools?):?\s*/i)) {
          const techLine = trimmedLine.replace(/^(Technologies?|Tech Stack|Built with|Tools?):?\s*/i, '');
          const techs = techLine.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
          technologies.push(...techs);
        }
        // Check for technology indicators in parentheses or brackets
        else if (trimmedLine.match(/\(([^)]+)\)|\[([^\]]+)\]/)) {
          const match = trimmedLine.match(/\(([^)]+)\)|\[([^\]]+)\]/);
          if (match) {
            const techString = match[1] || match[2];
            if (techString.length < 50) { // Reasonable length for tech list
              const techs = techString.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
              technologies.push(...techs);
            }
          }
        }
        // Check for bullet points (achievements)
        else if (trimmedLine.match(/^[•·\-\*]\s+/)) {
          const achievement = trimmedLine.replace(/^[•·\-\*]\s+/, '').trim();
          if (achievement) {
            achievements.push(achievement);
          }
        }
        // Check for description (usually longer lines without special patterns)
        else if (!description && trimmedLine.length > 20 && !trimmedLine.match(/^[A-Z][a-z]+:/)) {
          description = trimmedLine;
        }
        // Additional achievements without bullets
        else if (description && trimmedLine.length > 15) {
          achievements.push(trimmedLine);
        }
      }
    });
    
    // Fallback values
    if (!name) name = 'Project Name';
    if (!description) description = 'Project description';
    
    // Ensure at least one achievement
    if (achievements.length === 0) {
      achievements.push('Key project accomplishment');
    }
    // Try to ensure at least two achievements for richer project detail
    if (achievements.length === 1) {
      achievements.push('Additional key project feature or impact');
    }

    // Prefer explicit live demo as the legacy link (fallback to GitHub)
    const legacyLink = liveDemoUrl || githubUrl || link;
    
    projects.push({
      name,
      description,
      technologies,
      githubUrl: githubUrl || undefined,
      liveDemoUrl: liveDemoUrl || undefined,
      link: legacyLink || undefined,
      achievements,
    });
  });
  
  return projects.length > 0 ? projects : undefined;
}

function extractCertifications(text: string): ResumeData['certifications'] {
  const certSection = extractSection(text, ['certifications', 'certificates', 'licenses', 'credentials']);
  
  if (!certSection) return undefined;
  
  const lines = certSection.split('\n').filter(line => line.trim());
  const certifications: NonNullable<ResumeData['certifications']> = [];
  
  let currentCert: Partial<NonNullable<ResumeData['certifications']>[0]> | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if this line starts a new certification (looks like a title)
    // Typically certification titles are on their own line and not sub-details
    if (!trimmed.includes('|') && !trimmed.toLowerCase().startsWith('issuer:') && 
        !trimmed.toLowerCase().startsWith('date:') && !trimmed.toLowerCase().startsWith('expires:') &&
        !trimmed.toLowerCase().startsWith('credential') && !trimmed.toLowerCase().startsWith('id:') &&
        !trimmed.toLowerCase().startsWith('url:') && !trimmed.startsWith('http')) {
      
      // Save previous cert if exists
      if (currentCert && currentCert.name) {
        certifications.push({
          name: currentCert.name,
          issuer: currentCert.issuer || '',
          date: currentCert.date || '',
          expirationDate: currentCert.expirationDate,
          credentialId: currentCert.credentialId,
          url: currentCert.url,
        });
      }
      
      // Start new cert
      currentCert = { name: trimmed };
    } else if (currentCert) {
      // Parse details for current cert
      if (trimmed.includes('|')) {
        // Format: "Certification Name | Issuer | Date"
        const parts = trimmed.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          currentCert.issuer = parts[0];
          currentCert.date = parts[1];
          if (parts.length >= 3) {
            currentCert.expirationDate = parts[2];
          }
        }
      } else if (trimmed.toLowerCase().startsWith('issuer:')) {
        currentCert.issuer = trimmed.substring(7).trim();
      } else if (trimmed.toLowerCase().startsWith('date:') || trimmed.toLowerCase().includes('issued:')) {
        const dateMatch = trimmed.match(/(?:date:|issued:)\s*(.+)/i);
        if (dateMatch) currentCert.date = dateMatch[1].trim();
      } else if (trimmed.toLowerCase().includes('expires:') || trimmed.toLowerCase().includes('expiration:')) {
        const expMatch = trimmed.match(/(?:expires:|expiration:)\s*(.+)/i);
        if (expMatch) currentCert.expirationDate = expMatch[1].trim();
      } else if (trimmed.toLowerCase().includes('credential') || trimmed.toLowerCase().startsWith('id:')) {
        const idMatch = trimmed.match(/(?:credential\s*id:|id:)\s*(.+)/i);
        if (idMatch) currentCert.credentialId = idMatch[1].trim();
      } else if (trimmed.startsWith('http') || trimmed.toLowerCase().startsWith('url:')) {
        const urlMatch = trimmed.match(/(?:url:\s*)?(https?:\/\/.+)/i);
        if (urlMatch) currentCert.url = urlMatch[1].trim();
      }
    }
  }
  
  // Don't forget the last cert
  if (currentCert && currentCert.name) {
    certifications.push({
      name: currentCert.name,
      issuer: currentCert.issuer || '',
      date: currentCert.date || '',
      expirationDate: currentCert.expirationDate,
      credentialId: currentCert.credentialId,
      url: currentCert.url,
    });
  }
  
  return certifications.length > 0 ? certifications : undefined;
}

function extractAwards(text: string): ResumeData['awards'] {
  const awardsSection = extractSection(text, ['awards', 'honors', 'achievements', 'recognition']);
  
  if (!awardsSection) return undefined;
  
  const lines = awardsSection.split('\n').filter(Boolean);
  const awards: NonNullable<ResumeData['awards']> = [];
  
  lines.slice(0, 10).forEach(line => {
    if (line.trim()) {
      awards.push({
        title: line.trim(),
        issuer: 'Issuing Organization',
        date: 'Date',
      });
    }
  });
  
  return awards.length > 0 ? awards : undefined;
}

function extractLanguages(text: string): ResumeData['languages'] {
  const languagesSection = extractSection(text, ['languages']);
  
  if (!languagesSection) return undefined;
  
  const lines = languagesSection.split(/[,;\n]/).filter(Boolean);
  const languages: NonNullable<ResumeData['languages']> = [];
  
  lines.slice(0, 10).forEach(line => {
    const match = line.match(/([^(]+)(?:\(([^)]+)\))?/);
    if (match) {
      const language = match[1].trim();
      const proficiency = match[2]?.trim() || 'Professional';
      
      languages.push({
        language,
        proficiency: proficiency as any || 'Professional',
      });
    }
  });
  
  return languages.length > 0 ? languages : undefined;
}

/**
 * Get default/fallback resume data when no resume is available
 */
export function getDefaultResumeData(): ResumeData {
  return {
    personalInfo: {
      fullName: 'Your Name',
      email: 'your.email@example.com',
      phone: '+1 (555) 123-4567',
      location: 'City, State',
      linkedin: 'https://linkedin.com/in/yourprofile',
      github: 'https://github.com/yourusername',
    },
    summary: 'Upload your resume to see your information displayed here with professional formatting.',
    skills: [
      {
        category: 'Example Skills',
        items: ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4', 'Skill 5'],
      },
    ],
    experience: [
      {
        title: 'Your Job Title',
        company: 'Company Name',
        location: 'City, State',
        startDate: 'Start Date',
        endDate: 'Present',
        current: true,
        achievements: [
          'Upload your resume to see your actual experience displayed here',
          'Your achievements and responsibilities will be shown professionally',
        ],
      },
    ],
    education: [
      {
        degree: 'Your Degree',
        institution: 'University Name',
        location: 'City, State',
        graduationDate: 'Graduation Date',
      },
    ],
  };
}
