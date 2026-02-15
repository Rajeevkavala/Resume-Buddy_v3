import { latexEscape } from './escape.js';

const MAX_LATEX_SOURCE_CHARS = 200_000;

function clampLatexSource(latex: string): string {
  if (latex.length <= MAX_LATEX_SOURCE_CHARS) return latex;
  return latex.slice(0, MAX_LATEX_SOURCE_CHARS) + '\n% [TRUNCATED]\n';
}

// Supported template IDs - each has its own distinct implementation
type TemplateId = 'professional' | 'faang' | 'jake' | 'deedy' | 'modern' | 'minimal' | 'tech';

function sanitizeTemplateId(templateId: string): TemplateId {
  const trimmed = templateId.trim().toLowerCase();
  const validIds: TemplateId[] = ['professional', 'faang', 'jake', 'deedy', 'modern', 'minimal', 'tech'];
  return validIds.includes(trimmed as TemplateId) ? (trimmed as TemplateId) : 'professional';
}

function asDetokenized(input: string): string {
  // Defensive: keep braces out of \detokenize{...}.
  return input.replace(/[{}]/g, '').trim();
}

function normalizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^mailto:/i.test(s)) return s;
  return `https://${s}`;
}

function href(url: string, label?: string): string {
  const safeUrl = asDetokenized(url);
  const safeLabel = label?.trim() ? latexEscape(label.trim()) : latexEscape(url);
  // Use \detokenize to avoid URL escaping issues with underscores, etc.
  return `\\href{\\detokenize{${safeUrl}}}{${safeLabel}}`;
}

function headerBlock(fullName?: string, contactLine?: string): string {
  const name = latexEscape(fullName?.trim() || 'Resume');
  const contact = contactLine?.trim() ? latexEscape(contactLine.trim()) : '';

  return [
    `\\begin{center}`,
    `  {\\LARGE\\bfseries ${name}}\\\\`,
    contact ? `  \\vspace{2pt}\\small ${contact}\\\\` : `  \\vspace{2pt}`,
    `\\end{center}`,
    `\\vspace{6pt}`,
    `\\hrule`,
    `\\vspace{10pt}`,
  ].join('\n');
}

function section(title: string, bodyLines: string[]): string {
  const cleanTitle = latexEscape(title);
  const body = bodyLines.filter(Boolean).join('\n');
  if (!body.trim()) return '';
  return [`\\section*{${cleanTitle}}`, body, `\\vspace{4pt}`].join('\n');
}

function asItemize(items: string[]): string {
  const safeItems = items
    .map((i) => i.trim())
    .filter(Boolean)
    .map((i) => `  \\item ${latexEscape(i)}`);

  if (!safeItems.length) return '';
  return [`\\begin{itemize}`, ...safeItems, `\\end{itemize}`].join('\n');
}

function linesToBlocks(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n');
  const paragraphs = raw
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks: string[] = [];

  for (const p of paragraphs) {
    const lines = p
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const bulletLines = lines.filter((l) => /^[-•*]\s+/.test(l));
    const nonBulletLines = lines.filter((l) => !/^[-•*]\s+/.test(l));

    if (bulletLines.length && bulletLines.length === lines.length) {
      blocks.push(
        asItemize(
          bulletLines.map((l) => l.replace(/^[-•*]\s+/, '').trim())
        )
      );
      continue;
    }

    // Default: join lines as a paragraph with line breaks
    const joined = nonBulletLines.map((l) => latexEscape(l)).join('\\\\\n');
    blocks.push(joined);

    if (bulletLines.length) {
      blocks.push(
        asItemize(
          bulletLines.map((l) => l.replace(/^[-•*]\s+/, '').trim())
        )
      );
    }
  }

  return blocks.filter((b) => b.trim().length > 0);
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pickStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}

function serializeResumeData(resumeData: unknown) {
  const data = (resumeData && typeof resumeData === 'object' ? (resumeData as any) : {}) as any;

  const personal = data.personalInfo || {};
  const fullName = pickString(personal.fullName);
  const email = pickString(personal.email);
  const phone = pickString(personal.phone);
  const location = pickString(personal.location);
  const linkedin = pickString(personal.linkedin);
  const github = pickString(personal.github);
  const website = pickString(personal.website || personal.portfolio);

  const contactParts = [
    email,
    phone,
    location,
    linkedin ? `LinkedIn: ${linkedin}` : undefined,
    github ? `GitHub: ${github}` : undefined,
    website ? `Website: ${website}` : undefined,
  ].filter(Boolean) as string[];

  const summary = pickString(data.summary);

  // Skills: support both legacy array-of-groups and current object-of-arrays.
  const skillsBlocks: string[] = [];
  const skills = data.skills;
  if (Array.isArray(skills)) {
    for (const group of skills) {
      const category = pickString(group?.category) || 'Skills';
      const items = pickStringArray(group?.items);
      if (items.length) {
        skillsBlocks.push(`${latexEscape(category)}: ${latexEscape(items.join(', '))}\\\\`);
      }
    }
  } else if (skills && typeof skills === 'object') {
    const entries = Object.entries(skills as Record<string, unknown>);
    for (const [key, val] of entries) {
      const arr = pickStringArray(val);
      if (arr.length) {
        const label = key[0]?.toUpperCase() ? key[0].toUpperCase() + key.slice(1) : key;
        skillsBlocks.push(`${latexEscape(label)}: ${latexEscape(arr.join(', '))}\\\\`);
      }
    }
  }

  // Experience
  const expLines: string[] = [];
  if (Array.isArray(data.experience)) {
    for (const exp of data.experience) {
      const title = pickString(exp?.title);
      const company = pickString(exp?.company);
      const startDate = pickString(exp?.startDate);
      const endDate = pickString(exp?.endDate);
      const expLoc = pickString(exp?.location);

      const headingParts = [
        [title, company].filter(Boolean).join(' — '),
        [startDate, endDate || 'Present'].filter(Boolean).join(' – '),
        expLoc,
      ].filter(Boolean);

      if (headingParts.length) {
        expLines.push(`\\textbf{${latexEscape(headingParts[0]!)}}\\\\`);
        if (headingParts.length > 1) {
          expLines.push(`\\small ${latexEscape(headingParts.slice(1).join(' | '))}\\normalsize\\\\`);
        }
      }

      const achievements = pickStringArray(exp?.achievements);
      if (achievements.length) {
        expLines.push(asItemize(achievements));
      }

      expLines.push('\\vspace{4pt}');
    }
  }

  // Education
  const eduLines: string[] = [];
  const eduSource =
    (data.educationAndCertifications && data.educationAndCertifications.education) ||
    data.education;

  if (Array.isArray(eduSource)) {
    for (const edu of eduSource) {
      const degree = pickString(edu?.degree);
      const major = pickString(edu?.major);
      const institution = pickString(edu?.institution);
      const grad = pickString(edu?.graduationDate);
      const eduLoc = pickString(edu?.location);
      const gpa = pickString(edu?.gpa);

      const left = [degree, major ? `in ${major}` : undefined].filter(Boolean).join(' ');
      const right = [institution, eduLoc].filter(Boolean).join(', ');
      const meta = [grad, gpa ? `GPA: ${gpa}` : undefined].filter(Boolean).join(' | ');

      const line = [left || right || undefined, right || undefined].filter(Boolean).join(' — ');
      if (line.trim()) eduLines.push(`${latexEscape(line)}\\\\`);
      if (meta.trim()) eduLines.push(`\\small ${latexEscape(meta)}\\normalsize\\\\`);
      eduLines.push('\\vspace{2pt}');
    }
  }

  return {
    fullName,
    contactLine: contactParts.join(' | '),
    contact: {
      email,
      phone,
      location,
      linkedin,
      github,
      website,
    },
    summary,
    skillsBlocks,
    expLines,
    eduLines,
  };
}

function faangHeaderBlock(params: {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}): string {
  // Skip header entirely if no name provided
  if (!params.fullName?.trim()) return '';

  const name = latexEscape(params.fullName.trim().toUpperCase());

  const contactParts: string[] = [];
  if (params.phone) contactParts.push(latexEscape(params.phone.trim()));
  if (params.location) contactParts.push(latexEscape(params.location.trim()));
  if (params.email) {
    const email = params.email.trim();
    contactParts.push(`{\\color{cyan}${href(`mailto:${email}`, email)}}`);
  }

  const linkedinUrl = normalizeUrl(params.linkedin);
  if (linkedinUrl) contactParts.push(`{\\color{cyan}${href(linkedinUrl, params.linkedin?.trim() || 'LinkedIn')}}`);

  const githubUrl = normalizeUrl(params.github);
  if (githubUrl) contactParts.push(`{\\color{cyan}${href(githubUrl, params.github?.trim() || 'GitHub')}}`);

  const websiteUrl = normalizeUrl(params.website);
  if (websiteUrl) contactParts.push(`{\\color{cyan}${href(websiteUrl, params.website?.trim() || 'Website')}}`);

  // Use diamond separator like the FAANG template
  const contactLine = contactParts.filter(Boolean).join(' $\\diamond$ ');

  return [
    `\\begin{center}`,
    `  {\\LARGE\\bfseries ${name}}\\\\`,
    contactLine ? `  \\vspace{2pt}\\small ${contactLine}` : ``,
    `\\end{center}`,
    `\\vspace{4pt}`,
  ].join('\n');
}

function faangSection(title: string, bodyLines: string[]): string {
  const cleanTitle = latexEscape(title.toUpperCase());
  const body = bodyLines.filter(Boolean).join('\n');
  if (!body.trim()) return '';
  return [
    `\\par`,
    `\\noindent{\\color{teal}\\textsc{\\textbf{${cleanTitle}}}}\\\\`,
    `\\vspace{2pt}\\hrule\\vspace{4pt}`,
    body,
    `\\par\\vspace{6pt}`,
  ].join('\n');
}

function faangSkillsLines(skills: unknown): string[] {
  const data = skills;
  const lines: string[] = [];

  // Support parse-resume-intelligently output: array of { category, items }.
  if (Array.isArray(data)) {
    for (const group of data) {
      const category = pickString(group?.category) || 'Skills';
      const items = pickStringArray(group?.items);
      if (items.length) {
        lines.push(`\\textbf{${latexEscape(category)}} \\quad ${latexEscape(items.join(', '))}\\\\`);
      }
    }
    return lines;
  }

  // Handle object-of-arrays format.
  if (data && typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    for (const [key, val] of entries) {
      const arr = pickStringArray(val);
      if (arr.length) {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`\\textbf{${latexEscape(label)}} \\quad ${latexEscape(arr.join(', '))}\\\\`);
      }
    }
  }

  return lines;
}

function faangCertificationsFromResumeData(resumeData: unknown): string[] {
  const data = (resumeData && typeof resumeData === 'object' ? (resumeData as any) : {}) as any;
  const certs = data.educationAndCertifications?.certifications || data.certifications;
  
  const lines: string[] = [];
  if (Array.isArray(certs) && certs.length) {
    for (const cert of certs) {
      const name = pickString(cert?.name);
      const issuer = pickString(cert?.issuer);
      const date = pickString(cert?.date);
      const expirationDate = pickString(cert?.expirationDate);
      const credentialId = pickString(cert?.credentialId);
      
      const left = [name, issuer].filter(Boolean).join(' -- ');
      const right = date || '';
      
      if (left) {
        // One certification per block; keep strong line separation.
        lines.push(
          right
            ? `\\textbf{${latexEscape(left)}}\\hfill ${latexEscape(right)}\\\\`
            : `\\textbf{${latexEscape(left)}}\\\\`
        );

        const metaParts = [
          expirationDate ? `Expires: ${expirationDate}` : undefined,
          credentialId ? `Credential ID: ${credentialId}` : undefined,
        ].filter(Boolean) as string[];

        if (metaParts.length) {
          lines.push(`\\small ${latexEscape(metaParts.join(' | '))}\\normalsize\\\\`);
        }

        lines.push('\\par\\vspace{2pt}');
      }
    }
  }
  
  return lines;
}

function faangExperienceFromResumeData(resumeData: unknown): string[] {
  const data = (resumeData && typeof resumeData === 'object' ? (resumeData as any) : {}) as any;
  if (!Array.isArray(data.experience)) return [];

  const lines: string[] = [];
  for (const exp of data.experience) {
    const title = pickString(exp?.title);
    const company = pickString(exp?.company);
    const startDate = pickString(exp?.startDate);
    const endDate = pickString(exp?.endDate);
    const current = Boolean(exp?.current);
    const expLoc = pickString(exp?.location);
    const achievements = pickStringArray(exp?.achievements);

    const dates = [startDate, current ? 'Present' : endDate].filter(Boolean).join(' -- ');

    // Format: "Title – Company" on left, "Dates" on right
    const headerLeft = [title, company].filter(Boolean).join(' -- ');
    if (headerLeft || dates) {
      lines.push(`\\textbf{${latexEscape(headerLeft || '')}}\\hfill ${latexEscape(dates || '')}\\\\`);
    }

    if (expLoc) {
      lines.push(`\\small ${latexEscape(expLoc)}\\normalsize\\\\`);
    }
    if (achievements.length) {
      lines.push(asItemize(achievements));
    }
    lines.push('\\par\\vspace{3pt}');
  }
  return lines;
}

function faangProjectsFromResumeData(resumeData: unknown): string[] {
  const data = (resumeData && typeof resumeData === 'object' ? (resumeData as any) : {}) as any;
  if (!Array.isArray(data.projects)) return [];
  const lines: string[] = [];

  for (const proj of data.projects) {
    const name = pickString(proj?.name);
    const description = pickString(proj?.description);
    const tech = pickStringArray(proj?.technologies);
    const githubUrl = pickString(proj?.githubUrl);
    const liveDemoUrl = pickString(proj?.liveDemoUrl);
    const link = pickString(proj?.link);
    const achievements = pickStringArray(proj?.achievements);

    // Format: "Project Name – Tech Stack (italics)" on left, "[Live Demo]" link on right
    const techStr = tech.length ? ` \\textit{(${latexEscape(tech.join(', '))})}` : '';
    const left = name ? `\\textbf{${latexEscape(name)}}${techStr}` : '';
    const normalizedGitHub = githubUrl ? normalizeUrl(githubUrl) || githubUrl : undefined;
    const normalizedLive = liveDemoUrl ? normalizeUrl(liveDemoUrl) || liveDemoUrl : undefined;
    const normalizedLink = link ? normalizeUrl(link) || link : undefined;

    const rightParts: string[] = [];
    if (normalizedGitHub) rightParts.push(`{\\color{cyan}[${href(normalizedGitHub, 'GitHub')}]}`);
    if (normalizedLive) rightParts.push(`{\\color{cyan}[${href(normalizedLive, 'Live')}]}`);
    if (!rightParts.length && normalizedLink) {
      const linkLabel = /github\.com\//i.test(normalizedLink) ? 'GitHub' : 'Link';
      rightParts.push(`{\\color{cyan}[${href(normalizedLink, linkLabel)}]}`);
    }
    const right = rightParts.join(' ');
    
    if (left || right) {
      // Ensure each project starts on its own line.
      lines.push(`${left}\\hfill ${right}\\\\`);
    }

    if (description) {
      lines.push(`\\textbf{Description:}\\quad ${latexEscape(description)}\\\\`);
    }
    if (achievements.length) {
      lines.push(asItemize(achievements));
    }
    lines.push('\\par\\vspace{3pt}');
  }
  return lines;
}

function faangEducationFromResumeData(resumeData: unknown): string[] {
  const data = (resumeData && typeof resumeData === 'object' ? (resumeData as any) : {}) as any;
  const eduSource =
    (data.educationAndCertifications && data.educationAndCertifications.education) || data.education;

  const lines: string[] = [];
  if (Array.isArray(eduSource)) {
    for (const edu of eduSource) {
      const degree = pickString(edu?.degree);
      const major = pickString(edu?.major);
      const minor = pickString(edu?.minor);
      const institution = pickString(edu?.institution);
      const grad = pickString(edu?.graduationDate);
      const eduLoc = pickString(edu?.location);
      const gpa = pickString(edu?.gpa);
      const honors = pickStringArray(edu?.honors);
      const coursework = pickString(edu?.coursework) || pickStringArray(edu?.relevantCoursework).join(', ');

      // Format: "Degree (Major), Institution" on left, "Date" on right
      const degreeStr = [degree, major ? `(${major})` : undefined].filter(Boolean).join(' ');
      const left = [degreeStr, institution].filter(Boolean).join(', ');
      const right = grad || '';

      if (left || right) {
        lines.push(`\\textbf{${latexEscape(left)}}\\hfill ${latexEscape(right)}\\\\`);
      }
      if (eduLoc) {
        lines.push(`\\small ${latexEscape(eduLoc)}\\normalsize\\\\`);
      }
      if (gpa) {
        // CGPA must be on its own line.
        lines.push(`CGPA: ${latexEscape(gpa)}\\\\`);
      }
      if (minor) {
        lines.push(`Minor: ${latexEscape(minor)}\\\\`);
      }
      if (honors.length) {
        lines.push(`Honors: ${latexEscape(honors.join(', '))}\\\\`);
      }
      if (coursework) {
        lines.push(`Relevant Coursework: \\textit{${latexEscape(coursework)}}\\\\`);
      }
      lines.push('\\par\\vspace{3pt}');
    }
  }

  return lines;
}

function faangAwardsFromResumeData(resumeData: unknown): string[] {
  const data = (resumeData && typeof resumeData === 'object' ? (resumeData as any) : {}) as any;
  const awards = data.awards;
  if (!Array.isArray(awards) || !awards.length) return [];

  const lines: string[] = [];
  for (const award of awards) {
    const title = pickString(award?.title);
    const issuer = pickString(award?.issuer);
    const date = pickString(award?.date);
    const description = pickString(award?.description);

    const left = [title, issuer].filter(Boolean).join(' -- ');
    if (left || date) {
      lines.push(`\\textbf{${latexEscape(left || '')}}\\hfill ${latexEscape(date || '')}\\\\`);
    }
    if (description) {
      lines.push(`\\small ${latexEscape(description)}\\normalsize\\\\`);
    }
    lines.push('\\par\\vspace{2pt}');
  }
  return lines;
}

// function faangLanguagesFromResumeData(resumeData: unknown): string[] {
//   const data = (resumeData && typeof resumeData === 'object' ? (resumeData as any) : {}) as any;
//   const languages = data.languages;
//   if (!Array.isArray(languages) || !languages.length) return [];

//   const lines: string[] = [];
//   for (const lang of languages) {
//     const language = pickString(lang?.language);
//     const proficiency = pickString(lang?.proficiency);
//     if (!language) continue;
//     const text = proficiency ? `${language} — ${proficiency}` : language;
//     lines.push(`${latexEscape(text)}\\\\`);
//   }
//   return lines;
// }

/**
 * Parse raw resume text (with === SECTION === markers) into structured resumeData.
 * This enables FAANG template formatting for text input.
 */
function normalizeResumeTextToData(text: string): {
  personalInfo: { fullName?: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string };
  summary?: string;
  skills: Record<string, string[]>;
  experience: Array<{ title?: string; company?: string; startDate?: string; endDate?: string; location?: string; achievements: string[] }>;
  projects: Array<{
    name?: string;
    technologies?: string[];
    description?: string;
    githubUrl?: string;
    liveDemoUrl?: string;
    link?: string;
    achievements: string[];
  }>;
  education: Array<{ degree?: string; institution?: string; graduationDate?: string; gpa?: string; coursework?: string }>;
  certifications: Array<{ name?: string; issuer?: string; date?: string }>;
} {
  const data: ReturnType<typeof normalizeResumeTextToData> = {
    personalInfo: {},
    skills: {},
    experience: [],
    projects: [],
    education: [],
    certifications: [],
  };

  // Try to extract header info - check if first section is a name (short, no common section keywords)
  const firstSectionMatch = text.match(/^===\s*([^=]+?)\s*===/i);
  if (firstSectionMatch) {
    const firstTitle = firstSectionMatch[1].trim().toLowerCase();
    const isNameSection = !['summary', 'objective', 'skills', 'experience', 'project', 'education', 'certification', 'technical', 'professional', 'work'].some(k => firstTitle.includes(k));
    
    if (isNameSection) {
      // This is likely the name
      data.personalInfo.fullName = firstSectionMatch[1].trim();
      
      // The contact info should be right after the name section header
      const afterNameMatch = text.match(/^===\s*[^=]+?\s*===\s*\n([^=]+?)(?===|$)/is);
      if (afterNameMatch) {
        const contactText = afterNameMatch[1].trim();
        const emailMatch = contactText.match(/([\w.-]+@[\w.-]+\.\w+)/i);
        if (emailMatch) data.personalInfo.email = emailMatch[1];
        const phoneMatch = contactText.match(/(\+?\d[\d\s-]{8,}\d)/i);
        if (phoneMatch) data.personalInfo.phone = phoneMatch[1].trim();
        const linkedinMatch = contactText.match(/linkedin[.:]?\s*([^\s|]+)/i) || contactText.match(/(linkedin\.com\/in\/[\w-]+)/i);
        if (linkedinMatch) data.personalInfo.linkedin = linkedinMatch[1];
        const githubMatch = contactText.match(/github[.:]?\s*([^\s|]+)/i) || contactText.match(/(github\.com\/[\w-]+)/i);
        if (githubMatch) data.personalInfo.github = githubMatch[1];
        // Extract location - usually last item before newline or end
        const locMatch = contactText.match(/\|\s*([A-Za-z][A-Za-z\s,]+?)(?:\s*$|\s*\n)/);
        if (locMatch) data.personalInfo.location = locMatch[1].trim();
      }
    }
  }

  // Split by === SECTION === markers
  const sectionPattern = /===\s*([^=]+?)\s*===/gi;
  const sections: Array<{ title: string; content: string }> = [];
  let lastIndex = 0;
  let match;
  const sectionTitles: string[] = [];
  const sectionIndices: number[] = [];

  while ((match = sectionPattern.exec(text)) !== null) {
    sectionTitles.push(match[1].trim().toLowerCase());
    sectionIndices.push(match.index);
  }

  for (let i = 0; i < sectionTitles.length; i++) {
    const startIdx = sectionIndices[i];
    const endIdx = i < sectionTitles.length - 1 ? sectionIndices[i + 1] : text.length;
    const sectionText = text.slice(startIdx, endIdx);
    // Remove the header line
    const content = sectionText.replace(/^===\s*[^=]+?\s*===\s*/i, '').trim();
    sections.push({ title: sectionTitles[i], content });
  }

  for (const { title, content } of sections) {
    // Summary / Objective
    if (title.includes('summary') || title.includes('objective') || title.includes('professional summary')) {
      data.summary = content.replace(/\n+/g, ' ').trim();
    }

    // Technical Skills
    if (title.includes('skill') || title.includes('technical')) {
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          // Preserve the original key with proper capitalization, just trim it
          const rawKey = line.slice(0, colonIdx).trim();
          // Convert to camelCase-like key for storage, but keep display-friendly version
          const key = rawKey.toLowerCase().replace(/\s+/g, '-');
          const values = line.slice(colonIdx + 1).split(',').map(v => v.trim()).filter(Boolean);
          if (key && values.length) {
            // Store with a display-friendly key
            data.skills[rawKey] = values;
          }
        }
      }
    }

    // Experience
    if (title.includes('experience') || title.includes('work')) {
      // Split by lines that look like experience headers (contain | or start with a role-like word)
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      let currentExp: { title?: string; company?: string; startDate?: string; endDate?: string; location?: string; achievements: string[] } | null = null;
      
      for (const line of lines) {
        // Check if it's a bullet point
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          if (currentExp) {
            currentExp.achievements.push(line.replace(/^[•\-*]\s*/, '').trim());
          }
          continue;
        }
        
        // Check if it's a header line (contains | or date patterns)
        const isHeader = line.includes('|') || /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)\b/i.test(line);
        
        if (isHeader) {
          // Save previous experience if exists
          if (currentExp && (currentExp.title || currentExp.company)) {
            data.experience.push(currentExp);
          }
          
          // Parse the header - format: "Title | Company | Location | Dates"
          const parts = line.split('|').map(p => p.trim());
          
          // Try to extract date range from any part
          let dateRange = '';
          let datePartIndex = -1;
          for (let i = 0; i < parts.length; i++) {
            if (/\b\d{4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(parts[i])) {
              dateRange = parts[i];
              datePartIndex = i;
              break;
            }
          }
          
          // Parse dates
          let startDate = '';
          let endDate = '';
          if (dateRange) {
            const dateParts = dateRange.split(/\s*[-–—]\s*/);
            startDate = dateParts[0]?.trim() || '';
            endDate = dateParts[1]?.trim() || 'Present';
          }
          
          // Assign parts based on position
          const nonDateParts = parts.filter((_, i) => i !== datePartIndex);
          
          currentExp = {
            title: nonDateParts[0] || undefined,
            company: nonDateParts[1] || undefined,
            location: nonDateParts[2] || undefined,
            startDate,
            endDate,
            achievements: [],
          };
        }
      }
      
      // Don't forget the last experience
      if (currentExp && (currentExp.title || currentExp.company)) {
        data.experience.push(currentExp);
      }
    }

    // Projects
    if (title.includes('project')) {
      // Robust project parsing:
      // - Accept headers like "Project Name | Tech"
      // - Also accept headers like "Project Name – Subtitle (Live Demo)" (no '|')
      // - Treat any non-bullet line as a potential project header and group subsequent
      //   bullet lines and link lines under it.

      const rawLines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const isBullet = (line: string) => /^[•\-*]\s+/.test(line);
      const isLikelyHeader = (line: string) => {
        if (isBullet(line)) return false;
        // Avoid treating link-only lines as headers.
        if (/^(GitHub|Live|Demo)\s*:/i.test(line)) return false;
        if (/^https?:\/\//i.test(line)) return false;
        // A header is typically short and starts with a letter/number.
        if (!/^[A-Za-z0-9]/.test(line)) return false;
        return true;
      };

      const blocks: string[][] = [];
      let current: string[] = [];

      for (const line of rawLines) {
        if (isLikelyHeader(line)) {
          if (current.length) blocks.push(current);
          current = [line];
          continue;
        }
        if (!current.length) {
          // If content starts with bullets/links without a header, keep collecting until we find one.
          // We can't reliably create a project entry without a header.
          continue;
        }
        current.push(line);
      }
      if (current.length) blocks.push(current);

      for (const blockLines of blocks) {
        const headerLine = blockLines[0] || '';
        const restLines = blockLines.slice(1);

        // Extract project name and technologies from common patterns.
        let name: string | undefined;
        let technologies: string[] = [];

        // Pattern 1: "Name | Tech, Tech"
        const pipeMatch = headerLine.match(/^([^|]+)\|(.+)$/);
        if (pipeMatch) {
          name = pipeMatch[1]?.trim();
          technologies = pipeMatch[2]
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        } else {
          // Pattern 2: "Name – Subtitle" / "Name - Subtitle" / "Name — Subtitle"
          // Keep only the name part as the project name.
          const dashMatch = headerLine.match(/^(.+?)(?:\s*[–—-]\s+.+)?$/);
          name = dashMatch?.[1]?.trim();
        }

        // Parse bullets for description/achievements and capture links.
        let description: string | undefined;
        const achievements: string[] = [];
        let githubUrl: string | undefined;
        let liveDemoUrl: string | undefined;

        const bulletPayloads = restLines
          .filter((l) => isBullet(l))
          .map((l) => l.replace(/^[•\-*]\s+/, '').trim())
          .filter(Boolean);

        for (const payload of bulletPayloads) {
          const descMatch = payload.match(/^Description\s*:\s*(.+)$/i);
          if (descMatch) {
            description = descMatch[1].trim();
            continue;
          }
          const achMatch = payload.match(/^Achievement\s*:\s*(.+)$/i);
          if (achMatch) {
            achievements.push(achMatch[1].trim());
            continue;
          }

          const ghMatch = payload.match(/GitHub\s*:\s*(https?:\/\/[^\s|]+)/i);
          if (ghMatch) githubUrl = ghMatch[1];

          const liveMatch = payload.match(/(?:Live|Demo)\s*:\s*(https?:\/\/[^\s|]+)/i);
          if (liveMatch) liveDemoUrl = liveMatch[1];

          // If it's not a structured description/achievement/link line, treat as an achievement.
          if (!descMatch && !achMatch && !ghMatch && !liveMatch) {
            achievements.push(payload);
          }
        }

        // Look for GitHub/Live/Demo links anywhere in the block as fallback.
        const joinedBlock = [headerLine, ...restLines].join('\n');
        const githubLinkMatch = joinedBlock.match(/GitHub:\s*(https?:\/\/[^\s|]+)/i);
        const liveLinkMatch = joinedBlock.match(/Live:\s*(https?:\/\/[^\s|]+)/i);
        const demoLinkMatch = joinedBlock.match(/Demo:\s*(https?:\/\/[^\s|]+)/i);
        const anyUrlMatch = joinedBlock.match(/https?:\/\/[^\s|]+/i);

        if (!githubUrl && githubLinkMatch?.[1]) githubUrl = githubLinkMatch[1];
        if (!liveDemoUrl && (liveLinkMatch?.[1] || demoLinkMatch?.[1])) liveDemoUrl = liveLinkMatch?.[1] || demoLinkMatch?.[1];

        const link = liveDemoUrl || githubUrl || anyUrlMatch?.[0];

        if (name) {
          data.projects.push({ name, technologies, description, githubUrl, liveDemoUrl, link, achievements });
        }
      }
    }

    // Education
    if (title.includes('education')) {
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      
      for (const line of lines) {
        // Skip bullet points
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) continue;
        
        // Parse education: "Degree | Institution | Date" or "Degree in Field | Institution | Expected: Year"
        const parts = line.split('|').map(p => p.trim());
        
        if (parts.length >= 2) {
          // Extract degree and field
          const degreeMatch = parts[0]?.match(/^(.+?)\s+in\s+(.+)$/i);
          const degree = degreeMatch ? `${degreeMatch[1]} in ${degreeMatch[2]}` : parts[0];
          
          // Institution is usually the second part
          const institution = parts[1]?.replace(/,.*$/, '').trim();
          
          // Graduation date - look for year pattern
          let gradDate = parts[2] || '';
          // Extract just the year if "Expected: 2025" format
          const yearMatch = gradDate.match(/(\d{4})/);
          if (yearMatch) {
            gradDate = gradDate.includes('Expected') ? `Expected ${yearMatch[1]}` : yearMatch[1];
          }
          
          // Extract GPA if present
          const gpaMatch = line.match(/GPA[:\s]*([\d.]+)/i);
          
          data.education.push({
            degree,
            institution,
            graduationDate: gradDate,
            gpa: gpaMatch?.[1],
          });
        }
      }
    }

    // Certifications
    if (title.includes('certification')) {
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
        if (!cleanLine) continue;
        // Parse: "Name - Issuer - Date" or similar
        const parts = cleanLine.split(/\s*[-–]\s*/);
        data.certifications.push({
          name: parts[0]?.trim(),
          issuer: parts[1]?.trim(),
          date: parts[2]?.trim(),
        });
      }
    }
  }

  return data;
}

export function serializeToLatex(input: {
  templateId: string;
  source: 'resumeData' | 'resumeText';
  resumeText?: string;
  resumeData?: unknown;
}): { latexSource: string; templateId: string } {
  const templateId = sanitizeTemplateId(input.templateId);

  // Normalize resume data
  let effectiveResumeData: unknown = input.resumeData;
  if (input.source === 'resumeText') {
    const text = (input.resumeText || '').trim();
    effectiveResumeData = normalizeResumeTextToData(text);
  }

  const extracted = serializeResumeData(effectiveResumeData);
  const contact = extracted.contact || {};
  const resumeDataObj = effectiveResumeData && typeof effectiveResumeData === 'object' ? effectiveResumeData as any : {};

  // Common data extraction
  const experienceLines = faangExperienceFromResumeData(effectiveResumeData);
  const projectLines = faangProjectsFromResumeData(effectiveResumeData);
  const educationLines = faangEducationFromResumeData(effectiveResumeData);
  const skillsLines = faangSkillsLines(resumeDataObj.skills);
  const certificationLines = faangCertificationsFromResumeData(effectiveResumeData);
  const awardLines = faangAwardsFromResumeData(effectiveResumeData);

  // ========== JAKE'S RESUME TEMPLATE ==========
  // Clean academic-style template with gray section headers
  if (templateId === 'jake') {
    // Build contact line with clickable hyperlinks
    const contactItems: string[] = [];
    
    // Email - clickable mailto link
    if (contact.email) {
      contactItems.push('\\href{mailto:' + contact.email + '}{' + latexEscape(contact.email) + '}');
    }
    // Phone
    if (contact.phone) {
      contactItems.push(latexEscape(contact.phone));
    }
    // Location
    if (contact.location) {
      contactItems.push(latexEscape(contact.location));
    }
    // LinkedIn - clickable link
    if (contact.linkedin) {
      const linkedinHandle = contact.linkedin.replace(/.*linkedin\.com\/in\//i, '').replace(/\/$/, '');
      const linkedinUrl = contact.linkedin.includes('linkedin.com') 
        ? (normalizeUrl(contact.linkedin) || contact.linkedin)
        : 'https://linkedin.com/in/' + contact.linkedin;
      contactItems.push('\\href{' + asDetokenized(linkedinUrl) + '}{linkedin.com/in/' + latexEscape(linkedinHandle) + '}');
    }
    // GitHub - clickable link
    if (contact.github) {
      const githubHandle = contact.github.replace(/.*github\.com\//i, '').replace(/\/$/, '');
      const githubUrl = contact.github.includes('github.com')
        ? (normalizeUrl(contact.github) || contact.github)
        : 'https://github.com/' + contact.github;
      contactItems.push('\\href{' + asDetokenized(githubUrl) + '}{github.com/' + latexEscape(githubHandle) + '}');
    }

    // Professional Summary
    const summaryText = pickString(resumeDataObj.summary);

    // Education entries - improved parsing with de-duplication
    const eduEntries: string[] = [];
    const eduData = resumeDataObj.educationAndCertifications?.education || resumeDataObj.education;
    if (Array.isArray(eduData) && eduData.length) {
      for (const edu of eduData) {
        const degree = pickString(edu?.degree) || '';
        const field = pickString(edu?.field) || pickString(edu?.major) || '';
        const institution = pickString(edu?.institution) || '';
        const gradDate = pickString(edu?.graduationDate) || '';
        const gpa = pickString(edu?.gpa);
        const location = pickString(edu?.location);
        
        // Skip if no meaningful data
        if (!degree && !institution) continue;
        
        // Build degree line - avoid duplicating field if already in degree
        let degreeLine = degree;
        if (field && !degree.toLowerCase().includes(field.toLowerCase())) {
          degreeLine = degree ? degree + ' in ' + field : field;
        }
        
        // Institution with location
        const instPart = institution ? '\\textit{' + latexEscape(institution) + '}' : '';
        const locPart = location ? latexEscape(location) : '';
        
        // Build the entry line
        let entryLine = '\\item \\textbf{' + latexEscape(degreeLine) + '}';
        if (instPart) entryLine += ' | ' + instPart;
        if (locPart) entryLine += ', ' + locPart;
        if (gradDate) entryLine += ' \\hfill ' + latexEscape(gradDate);
        
        eduEntries.push(entryLine);
        
        // Add GPA as inline if available
        if (gpa) {
          eduEntries.push('\\\\[-2pt] \\small GPA: ' + latexEscape(gpa) + '\\normalsize');
        }
      }
    }

    // Experience entries - cleaner parsing with better spacing
    const expEntries: string[] = [];
    if (Array.isArray(resumeDataObj.experience) && resumeDataObj.experience.length) {
      for (const exp of resumeDataObj.experience) {
        const title = pickString(exp?.title) || '';
        const company = pickString(exp?.company) || '';
        const location = pickString(exp?.location) || '';
        const startDate = pickString(exp?.startDate) || '';
        const endDate = pickString(exp?.endDate) || '';
        const current = Boolean(exp?.current);
        const achievements = pickStringArray(exp?.achievements);
        
        // Skip if no meaningful data
        if (!title && !company) continue;
        
        const dateRange = [startDate, current ? 'Present' : endDate].filter(Boolean).join(' - ');
        
        // Build header line
        let headerLine = '\\item \\textbf{' + latexEscape(title) + '}';
        if (company) headerLine += ' -- \\textit{' + latexEscape(company) + '}';
        if (location) headerLine += ', ' + latexEscape(location);
        if (dateRange) headerLine += ' \\hfill ' + latexEscape(dateRange);
        
        expEntries.push(headerLine);
        
        // Add achievements as sub-list
        if (achievements.length) {
          expEntries.push('\\begin{itemize}[leftmargin=0.15in, itemsep=1pt, topsep=1pt]');
          for (const ach of achievements) {
            if (ach.trim()) {
              expEntries.push('\\item ' + latexEscape(ach));
            }
          }
          expEntries.push('\\end{itemize}');
        }
      }
    }

    // Projects entries - avoid duplication, cleaner format
    const projEntries: string[] = [];
    if (Array.isArray(resumeDataObj.projects) && resumeDataObj.projects.length) {
      for (const proj of resumeDataObj.projects) {
        const name = pickString(proj?.name) || '';
        const tech = pickStringArray(proj?.technologies);
        const achievements = pickStringArray(proj?.achievements);
        const description = pickString(proj?.description) || '';
        
        // Skip if no name
        if (!name) continue;
        
        // Build header with tech stack
        let headerLine = '\\item \\textbf{' + latexEscape(name) + '}';
        if (tech.length) {
          headerLine += ' | \\textit{' + latexEscape(tech.join(', ')) + '}';
        }
        
        projEntries.push(headerLine);
        
        // Collect all bullet points - avoid duplicating description in achievements
        const bullets: string[] = [];
        
        // Add description as first bullet if it exists and is not already in achievements
        if (description) {
          const descLower = description.toLowerCase().trim();
          const isDuplicate = achievements.some(ach => 
            ach.toLowerCase().trim() === descLower || 
            ach.toLowerCase().includes(descLower) ||
            descLower.includes(ach.toLowerCase().trim())
          );
          if (!isDuplicate) {
            bullets.push(latexEscape(description));
          }
        }
        
        // Add achievements, removing duplicates and "Description:" prefixes
        const seenBullets = new Set(bullets.map(b => b.toLowerCase()));
        for (const ach of achievements) {
          let cleanAch = ach.replace(/^(description|achievement):\s*/i, '').trim();
          if (cleanAch && !seenBullets.has(cleanAch.toLowerCase())) {
            bullets.push(latexEscape(cleanAch));
            seenBullets.add(cleanAch.toLowerCase());
          }
        }
        
        // Output bullets
        if (bullets.length) {
          projEntries.push('\\begin{itemize}[leftmargin=0.15in, itemsep=1pt, topsep=1pt]');
          for (const bullet of bullets) {
            projEntries.push('\\item ' + bullet);
          }
          projEntries.push('\\end{itemize}');
        }
      }
    }

    // Skills - Support both array and object formats
    const skillEntries: string[] = [];
    const skills = resumeDataObj.skills;
    
    if (Array.isArray(skills)) {
      // Array format: [{ category: 'Languages', items: ['JavaScript', 'Java'] }]
      for (const group of skills) {
        const category = pickString(group?.category) || 'Skills';
        const items = pickStringArray(group?.items);
        if (items.length) {
          skillEntries.push('\\item \\textbf{' + latexEscape(category) + ':} ' + latexEscape(items.join(', ')));
        }
      }
    } else if (skills && typeof skills === 'object') {
      // Object format: { Languages: ['JavaScript', 'Java'], Frontend: ['React', 'Next.js'] }
      const entries = Object.entries(skills as Record<string, unknown>);
      for (const [key, val] of entries) {
        const items = pickStringArray(val);
        if (items.length) {
          skillEntries.push('\\item \\textbf{' + latexEscape(key) + ':} ' + latexEscape(items.join(', ')));
        }
      }
    }

    // Certifications with issuer and date
    const certEntries: string[] = [];
    const certs = resumeDataObj.educationAndCertifications?.certifications || resumeDataObj.certifications;
    if (Array.isArray(certs) && certs.length) {
      for (const cert of certs) {
        const name = pickString(cert?.name);
        const issuer = pickString(cert?.issuer);
        const date = pickString(cert?.date);
        if (name) {
          const metaParts = [issuer, date].filter(Boolean);
          const metaStr = metaParts.length ? ' -- ' + latexEscape(metaParts.join(' -- ')) : '';
          certEntries.push('\\item ' + latexEscape(name) + metaStr);
        }
      }
    }

    const latexSource = clampLatexSource([
      `% template: jake`,
      `% Jake's Resume - Clean academic style`,
      `\\documentclass[a4paper,10.5pt]{article}`,
      ``,
      `% Consistent margins`,
      `\\usepackage[top=0.5in, bottom=0.5in, left=0.6in, right=0.6in]{geometry}`,
      `\\usepackage{graphicx}`,
      `\\usepackage{url}`,
      `\\usepackage{lmodern}`,
      `\\usepackage{booktabs}`,
      `\\usepackage{enumitem}`,
      `\\usepackage{hyperref}`,
      `\\usepackage{microtype}`,
      ``,
      `% Use Latin Modern font family`,
      `\\renewcommand{\\familydefault}{\\sfdefault}`,
      ``,
      `% Hyperlink styling`,
      `\\hypersetup{`,
      `    colorlinks=true,`,
      `    linkcolor=black,`,
      `    filecolor=black,`,
      `    urlcolor=blue,`,
      `    pdfborder={0 0 0}`,
      `}`,
      ``,
      `\\urlstyle{same}`,
      ``,
      `\\usepackage[T1]{fontenc}`,
      `\\usepackage[utf8]{inputenc}`,
      ``,
      `\\usepackage{xcolor}`,
      `\\definecolor{sectionbg}{gray}{0.85}`,
      `\\definecolor{sectiontext}{gray}{0.15}`,
      `\\raggedbottom`,
      `\\raggedright`,
      ``,
      `\\setlength{\\tabcolsep}{0in}`,
      `\\setlength{\\parindent}{0pt}`,
      `\\setlength{\\parskip}{0pt}`,
      `\\renewcommand{\\labelitemii}{$\\circ$}`,
      ``,
      `% Compact list formatting`,
      `\\setlist[itemize]{leftmargin=0.18in, itemsep=0pt, topsep=2pt, parsep=0pt, partopsep=0pt}`,
      ``,
      `\\pagestyle{empty}`,
      ``,
      `% Section heading command`,
      `\\newcommand{\\ressection}[1]{\\vspace{6pt}\\colorbox{sectionbg}{\\parbox{\\dimexpr\\textwidth-2\\fboxsep}{\\textbf{\\textcolor{sectiontext}{#1}}}}\\vspace{4pt}}`,
      ``,
      `\\begin{document}`,
      ``,
      `% ========== HEADER ==========`,
      `\\begin{center}`,
      `{\\Large\\textbf{${latexEscape(extracted.fullName || 'Resume')}}}\\\\[3pt]`,
      contactItems.length > 0 ? `{\\small ${contactItems.join(' $\\cdot$ ')}}` : '',
      `\\end{center}`,
      ``,
      `\\vspace{1mm}`,
      
      // Professional Summary
      summaryText ? [
        `\\ressection{PROFESSIONAL SUMMARY}`,
        `\\noindent ${latexEscape(summaryText)}`,
        ``,
      ].join('\n') : '',
      
      // Education
      eduEntries.length ? [
        `\\ressection{EDUCATION}`,
        `\\begin{itemize}[leftmargin=0.15in, itemsep=2pt, topsep=0pt]`,
        ...eduEntries,
        `\\end{itemize}`,
        ``,
      ].join('\n') : '',
      
      // Technical Skills
      skillEntries.length ? [
        `\\ressection{TECHNICAL SKILLS}`,
        `\\begin{itemize}[leftmargin=0.15in, itemsep=1pt, topsep=0pt]`,
        ...skillEntries,
        `\\end{itemize}`,
        ``,
      ].join('\n') : '',
      
      // Professional Experience
      expEntries.length ? [
        `\\ressection{PROFESSIONAL EXPERIENCE}`,
        `\\begin{itemize}[leftmargin=0.15in, itemsep=3pt, topsep=0pt]`,
        ...expEntries,
        `\\end{itemize}`,
        ``,
      ].join('\n') : '',
      
      // Projects
      projEntries.length ? [
        `\\ressection{PROJECTS}`,
        `\\begin{itemize}[leftmargin=0.15in, itemsep=3pt, topsep=0pt]`,
        ...projEntries,
        `\\end{itemize}`,
        ``,
      ].join('\n') : '',
      
      // Certifications
      certEntries.length ? [
        `\\ressection{CERTIFICATIONS}`,
        `\\begin{itemize}[leftmargin=0.15in, itemsep=1pt, topsep=0pt]`,
        ...certEntries,
        `\\end{itemize}`,
        ``,
      ].join('\n') : '',
      
      `\\end{document}`,
      '',
    ].filter(Boolean).join('\n'));

    return { latexSource, templateId };
  }

  // ========== DEEDY RESUME TEMPLATE ==========
  // Two-column modern design with accent colors - self-contained
  if (templateId === 'deedy') {
    // Parse name for Deedy-style header
    const nameParts = (extracted.fullName || 'Resume').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build contact line
    const deedyContactItems = [
      contact.email ? `\\href{mailto:${asDetokenized(contact.email)}}{${latexEscape(contact.email)}}` : undefined,
      contact.phone ? latexEscape(contact.phone) : undefined,
      contact.linkedin ? `\\href{\\detokenize{${normalizeUrl(contact.linkedin) || contact.linkedin}}}{LinkedIn}` : undefined,
      contact.github ? `\\href{\\detokenize{${normalizeUrl(contact.github) || contact.github}}}{GitHub}` : undefined,
    ].filter(Boolean);

    // Left column: Education, Skills, Certifications
    const leftColumnParts: string[] = [];
    
    // Education for left column
    const eduData = resumeDataObj.educationAndCertifications?.education || resumeDataObj.education;
    if (Array.isArray(eduData) && eduData.length) {
      leftColumnParts.push(`\\section{Education}`);
      for (const edu of eduData) {
        const degree = pickString(edu?.degree);
        const institution = pickString(edu?.institution);
        const gradDate = pickString(edu?.graduationDate);
        const gpa = pickString(edu?.gpa);
        
        if (institution) {
          leftColumnParts.push(`\\subsection{${latexEscape(institution)}}`);
        }
        if (degree) {
          leftColumnParts.push(`\\descript{${latexEscape(degree)}}`);
        }
        if (gradDate) {
          leftColumnParts.push(`\\location{${latexEscape(gradDate)}}`);
        }
        if (gpa) {
          leftColumnParts.push(`\\location{GPA: ${latexEscape(gpa)}}`);
        }
        leftColumnParts.push(`\\sectionsep`);
      }
    }

    // Skills for left column
    if (Array.isArray(resumeDataObj.skills) && resumeDataObj.skills.length) {
      leftColumnParts.push(`\\section{Skills}`);
      for (const group of resumeDataObj.skills) {
        const category = pickString(group?.category) || 'Skills';
        const items = pickStringArray(group?.items);
        if (items.length) {
          leftColumnParts.push(`\\subsection{${latexEscape(category)}}`);
          leftColumnParts.push(`${latexEscape(items.join(' \\textbullet{} '))} \\\\`);
        }
      }
      leftColumnParts.push(`\\sectionsep`);
    }

    // Certifications for left column
    const certs = resumeDataObj.educationAndCertifications?.certifications || resumeDataObj.certifications;
    if (Array.isArray(certs) && certs.length) {
      leftColumnParts.push(`\\section{Certifications}`);
      for (const cert of certs) {
        const name = pickString(cert?.name);
        const issuer = pickString(cert?.issuer);
        if (name) {
          leftColumnParts.push(`\\textbf{${latexEscape(name)}} \\\\`);
          if (issuer) {
            leftColumnParts.push(`\\location{${latexEscape(issuer)}}`);
          }
        }
      }
      leftColumnParts.push(`\\sectionsep`);
    }

    // Right column: Experience, Projects
    const rightColumnParts: string[] = [];

    // Experience for right column
    if (Array.isArray(resumeDataObj.experience) && resumeDataObj.experience.length) {
      rightColumnParts.push(`\\section{Experience}`);
      for (const exp of resumeDataObj.experience) {
        const title = pickString(exp?.title);
        const company = pickString(exp?.company);
        const startDate = pickString(exp?.startDate);
        const endDate = pickString(exp?.endDate);
        const current = Boolean(exp?.current);
        const loc = pickString(exp?.location);
        const achievements = pickStringArray(exp?.achievements);
        
        const dateRange = [startDate, current ? 'Present' : endDate].filter(Boolean).join(' - ');
        
        if (company) {
          rightColumnParts.push(`\\runsubsection{${latexEscape(company)}}`);
          rightColumnParts.push(`\\descript{| ${latexEscape(title || '')}}`);
          rightColumnParts.push(`\\location{${latexEscape(dateRange)}${loc ? ` | ${latexEscape(loc)}` : ''}}`);
          if (achievements.length) {
            rightColumnParts.push(`\\begin{tightemize}`);
            for (const ach of achievements) {
              rightColumnParts.push(`\\item ${latexEscape(ach)}`);
            }
            rightColumnParts.push(`\\end{tightemize}`);
          }
          rightColumnParts.push(`\\sectionsep`);
        }
      }
    }

    // Projects for right column
    if (Array.isArray(resumeDataObj.projects) && resumeDataObj.projects.length) {
      rightColumnParts.push(`\\section{Projects}`);
      for (const proj of resumeDataObj.projects) {
        const name = pickString(proj?.name);
        const tech = pickStringArray(proj?.technologies);
        const description = pickString(proj?.description);
        const achievements = pickStringArray(proj?.achievements);
        
        if (name) {
          rightColumnParts.push(`\\runsubsection{${latexEscape(name)}}`);
          if (tech.length) {
            rightColumnParts.push(`\\descript{| ${latexEscape(tech.join(', '))}}`);
          }
          if (description || achievements.length) {
            rightColumnParts.push(`\\begin{tightemize}`);
            if (description) {
              rightColumnParts.push(`\\item ${latexEscape(description)}`);
            }
            for (const ach of achievements) {
              rightColumnParts.push(`\\item ${latexEscape(ach)}`);
            }
            rightColumnParts.push(`\\end{tightemize}`);
          }
          rightColumnParts.push(`\\sectionsep`);
        }
      }
    }

    const latexSource = clampLatexSource([
      `% template: deedy`,
      `% Deedy Resume - Two-column modern design`,
      `\\documentclass[letterpaper,11pt]{article}`,
      ``,
      `\\usepackage[hmargin=1.25cm, vmargin=0.75cm]{geometry}`,
      `\\usepackage[T1]{fontenc}`,
      `\\usepackage[utf8]{inputenc}`,
      `\\usepackage{hyperref}`,
      `\\usepackage{fontspec}`,
      `\\usepackage{xcolor}`,
      `\\usepackage{titlesec}`,
      `\\usepackage{enumitem}`,
      ``,
      `% Colors`,
      `\\definecolor{primary}{HTML}{2b2b2b}`,
      `\\definecolor{headings}{HTML}{6A6A6A}`,
      `\\definecolor{subheadings}{HTML}{333333}`,
      `\\definecolor{date}{HTML}{666666}`,
      `\\definecolor{accent}{HTML}{0066CC}`,
      ``,
      `\\hypersetup{colorlinks=true,urlcolor=accent}`,
      `\\pagenumbering{gobble}`,
      ``,
      `% Section formatting`,
      `\\titleformat{\\section}{\\color{primary}\\scshape\\large\\raggedright}{}{0em}{}[\\color{black}\\titlerule]`,
      `\\titlespacing{\\section}{0pt}{8pt}{6pt}`,
      ``,
      `% Custom commands`,
      `\\newcommand{\\namesection}[3]{`,
      `  \\centering{`,
      `    \\fontsize{32pt}{40pt}\\selectfont #1 `,
      `    \\color{headings}\\fontsize{32pt}{40pt}\\selectfont #2`,
      `  } \\\\[5pt]`,
      `  \\centering{\\color{headings}\\fontsize{11pt}{14pt}\\selectfont #3}`,
      `  \\vspace{12pt}`,
      `}`,
      ``,
      `\\newcommand{\\runsubsection}[1]{\\color{subheadings}\\fontsize{12pt}{12pt}\\selectfont\\bfseries #1 \\normalfont}`,
      `\\newcommand{\\descript}[1]{\\color{subheadings}\\raggedright\\scshape\\fontsize{11pt}{13pt}\\selectfont #1 \\\\[2pt] \\normalfont}`,
      `\\newcommand{\\location}[1]{\\color{date}\\raggedright\\fontsize{10pt}{12pt}\\selectfont #1 \\\\[2pt] \\normalfont}`,
      `\\newcommand{\\sectionsep}{\\vspace{8pt}}`,
      ``,
      `\\newenvironment{tightemize}{\\vspace{-\\topsep}\\begin{itemize}[leftmargin=*, itemsep=-2pt, parsep=0pt]}{\\end{itemize}\\vspace{-\\topsep}}`,
      ``,
      `\\begin{document}`,
      ``,
      `% Header`,
      `\\namesection{${latexEscape(firstName)}}{${latexEscape(lastName)}}{`,
      `  ${deedyContactItems.join(' | ')}`,
      `}`,
      ``,
      `% Two-column layout`,
      `\\begin{minipage}[t]{0.33\\textwidth}`,
      `\\vspace{0pt}`,
      ``,
      ...leftColumnParts,
      ``,
      `\\end{minipage}`,
      `\\hfill`,
      `\\begin{minipage}[t]{0.64\\textwidth}`,
      `\\vspace{0pt}`,
      ``,
      ...rightColumnParts,
      ``,
      `\\end{minipage}`,
      ``,
      `\\end{document}`,
      '',
    ].join('\n'));

    return { latexSource, templateId };
  }

  // ========== MODERN TEMPLATE ==========
  // Clean modern design with subtle accent colors
  if (templateId === 'modern') {
    const bodyParts = [
      // Header with modern styling
      `\\begin{center}`,
      `  {\\fontsize{28}{34}\\selectfont\\color{primary} ${latexEscape(extracted.fullName || 'Resume')}}`,
      `  \\\\[8pt]`,
      `  \\color{darkgray}\\small`,
      `  ${[
        contact.email ? `\\faEnvelope\\ ${latexEscape(contact.email)}` : undefined,
        contact.phone ? `\\faPhone\\ ${latexEscape(contact.phone)}` : undefined,
        contact.location ? `\\faMapMarker\\ ${latexEscape(contact.location)}` : undefined,
        contact.linkedin ? `\\faLinkedin\\ LinkedIn` : undefined,
        contact.github ? `\\faGithub\\ GitHub` : undefined,
      ].filter(Boolean).join(' \\quad ')}`,
      `\\end{center}`,
      `\\vspace{-10pt}`,
      ``,
      // Summary
      extracted.summary ? [
        `\\cvsection{Summary}`,
        `${latexEscape(extracted.summary)}`,
        ``,
      ].join('\n') : '',
      // Experience
      experienceLines.length ? [
        `\\cvsection{Experience}`,
        ...experienceLines,
      ].join('\n') : '',
      // Education
      educationLines.length ? [
        `\\cvsection{Education}`,
        ...educationLines,
      ].join('\n') : '',
      // Skills
      skillsLines.length ? [
        `\\cvsection{Skills}`,
        ...skillsLines,
      ].join('\n') : '',
      // Projects
      projectLines.length ? [
        `\\cvsection{Projects}`,
        ...projectLines,
      ].join('\n') : '',
    ].filter(Boolean);

    const latexSource = clampLatexSource([
      `% template: modern`,
      `\\documentclass[11pt,a4paper]{article}`,
      `\\usepackage[margin=0.75in]{geometry}`,
      `\\usepackage[T1]{fontenc}`,
      `\\usepackage[utf8]{inputenc}`,
      `\\usepackage{fontawesome5}`,
      `\\usepackage{xcolor}`,
      `\\usepackage{hyperref}`,
      `\\usepackage{enumitem}`,
      `\\usepackage{titlesec}`,
      ``,
      `\\definecolor{primary}{RGB}{37,99,235}`,
      `\\definecolor{darkgray}{RGB}{75,85,99}`,
      ``,
      `\\hypersetup{colorlinks=true,urlcolor=primary}`,
      `\\pagenumbering{gobble}`,
      `\\setlength{\\parindent}{0pt}`,
      ``,
      `\\newcommand{\\cvsection}[1]{\\vspace{8pt}{\\large\\bfseries\\color{primary}#1}\\\\[2pt]\\color{primary}\\rule{\\textwidth}{0.5pt}\\\\[4pt]}`,
      ``,
      `\\setlist[itemize]{leftmargin=1.5em, itemsep=1pt, topsep=2pt}`,
      ``,
      `\\begin{document}`,
      ...bodyParts,
      `\\end{document}`,
      '',
    ].join('\n'));

    return { latexSource, templateId };
  }

  // ========== MINIMAL TEMPLATE ==========
  // Ultra-clean minimalist design
  if (templateId === 'minimal') {
    const bodyParts = [
      // Minimal header
      `{\\LARGE ${latexEscape(extracted.fullName || 'Resume')}}`,
      `\\vspace{4pt}`,
      ``,
      `{\\small\\color{gray}${[
        contact.email,
        contact.phone,
        contact.location,
        contact.linkedin ? 'LinkedIn' : undefined,
        contact.github ? 'GitHub' : undefined,
      ].filter(Boolean).map(s => latexEscape(String(s))).join(' \\textbar\\ ')}}`,
      ``,
      `\\vspace{12pt}`,
      `\\hrule`,
      `\\vspace{12pt}`,
      ``,
      // Summary
      extracted.summary ? [
        `${latexEscape(extracted.summary)}`,
        `\\vspace{12pt}`,
      ].join('\n') : '',
      // Experience
      experienceLines.length ? [
        `{\\large\\bfseries Experience}\\\\[4pt]`,
        ...experienceLines,
        `\\vspace{8pt}`,
      ].join('\n') : '',
      // Education
      educationLines.length ? [
        `{\\large\\bfseries Education}\\\\[4pt]`,
        ...educationLines,
        `\\vspace{8pt}`,
      ].join('\n') : '',
      // Skills
      skillsLines.length ? [
        `{\\large\\bfseries Skills}\\\\[4pt]`,
        ...skillsLines,
        `\\vspace{8pt}`,
      ].join('\n') : '',
      // Projects
      projectLines.length ? [
        `{\\large\\bfseries Projects}\\\\[4pt]`,
        ...projectLines,
      ].join('\n') : '',
    ].filter(Boolean);

    const latexSource = clampLatexSource([
      `% template: minimal`,
      `\\documentclass[11pt]{article}`,
      `\\usepackage[margin=1in]{geometry}`,
      `\\usepackage[T1]{fontenc}`,
      `\\usepackage[utf8]{inputenc}`,
      `\\usepackage{xcolor}`,
      `\\usepackage{hyperref}`,
      `\\usepackage{enumitem}`,
      ``,
      `\\definecolor{gray}{RGB}{107,114,128}`,
      ``,
      `\\hypersetup{hidelinks}`,
      `\\pagenumbering{gobble}`,
      `\\setlength{\\parindent}{0pt}`,
      `\\setlist[itemize]{leftmargin=1.2em, itemsep=1pt, topsep=2pt}`,
      ``,
      `\\begin{document}`,
      ...bodyParts,
      `\\end{document}`,
      '',
    ].join('\n'));

    return { latexSource, templateId };
  }

  // ========== TECH TEMPLATE ==========
  // Developer-focused with code-style accents
  if (templateId === 'tech') {
    const bodyParts = [
      // Tech-style header
      `\\begin{center}`,
      `  {\\fontsize{24}{28}\\selectfont\\texttt{<${latexEscape(extracted.fullName || 'Developer')} />}}`,
      `  \\\\[6pt]`,
      `  \\color{accent}\\texttt{`,
      `  ${[
        contact.email ? `email: ${latexEscape(contact.email)}` : undefined,
        contact.github ? `github: ${latexEscape(contact.github)}` : undefined,
        contact.linkedin ? `linkedin: ${latexEscape(contact.linkedin)}` : undefined,
      ].filter(Boolean).join(' | ')}`,
      `  }`,
      `\\end{center}`,
      `\\vspace{8pt}`,
      ``,
      // Skills first for tech resume
      skillsLines.length ? [
        `\\techsection{Tech Stack}`,
        ...skillsLines,
      ].join('\n') : '',
      // Experience
      experienceLines.length ? [
        `\\techsection{Experience}`,
        ...experienceLines,
      ].join('\n') : '',
      // Projects
      projectLines.length ? [
        `\\techsection{Projects}`,
        ...projectLines,
      ].join('\n') : '',
      // Education
      educationLines.length ? [
        `\\techsection{Education}`,
        ...educationLines,
      ].join('\n') : '',
      // Certifications
      certificationLines.length ? [
        `\\techsection{Certifications}`,
        ...certificationLines,
      ].join('\n') : '',
    ].filter(Boolean);

    const latexSource = clampLatexSource([
      `% template: tech`,
      `\\documentclass[11pt]{article}`,
      `\\usepackage[margin=0.75in]{geometry}`,
      `\\usepackage[T1]{fontenc}`,
      `\\usepackage[utf8]{inputenc}`,
      `\\usepackage{xcolor}`,
      `\\usepackage{hyperref}`,
      `\\usepackage{enumitem}`,
      `\\usepackage{fancyvrb}`,
      ``,
      `\\definecolor{accent}{RGB}{16,185,129}`,
      `\\definecolor{codebg}{RGB}{30,41,59}`,
      ``,
      `\\hypersetup{colorlinks=true,urlcolor=accent}`,
      `\\pagenumbering{gobble}`,
      `\\setlength{\\parindent}{0pt}`,
      ``,
      `\\newcommand{\\techsection}[1]{\\vspace{10pt}{\\large\\texttt{// #1}}\\\\[2pt]\\color{accent}\\rule{\\textwidth}{1pt}\\\\[6pt]}`,
      ``,
      `\\setlist[itemize]{leftmargin=1.5em, itemsep=1pt, topsep=2pt}`,
      ``,
      `\\begin{document}`,
      ...bodyParts,
      `\\end{document}`,
      '',
    ].join('\n'));

    return { latexSource, templateId };
  }

  // ========== FAANG TEMPLATE ==========
  if (templateId === 'faang') {
    const bodyParts = [
      faangHeaderBlock({
        fullName: extracted.fullName,
        email: contact.email,
        phone: contact.phone,
        location: contact.location,
        linkedin: contact.linkedin,
        github: contact.github,
        website: contact.website,
      }),
      extracted.summary ? faangSection('Objective', [latexEscape(extracted.summary)]) : '',
      educationLines.length ? faangSection('Education', educationLines) : '',
      skillsLines.length ? faangSection('Technical Skills', skillsLines) : '',
      experienceLines.length ? faangSection('Experience', experienceLines) : '',
      projectLines.length ? faangSection('Projects', projectLines) : '',
      certificationLines.length ? faangSection('Certifications', certificationLines) : '',
      awardLines.length ? faangSection('Awards', awardLines) : '',
    ].filter(Boolean);

    const latexSource = clampLatexSource([
      `% template: faang`,
      `\\documentclass[letterpaper,11pt]{article}`,
      `\\usepackage[margin=0.75in]{geometry}`,
      `\\usepackage[T1]{fontenc}`,
      `\\usepackage[utf8]{inputenc}`,
      `\\usepackage[dvipsnames]{xcolor}`,
      `\\usepackage{hyperref}`,
      `\\usepackage{enumitem}`,
      `\\usepackage{titlesec}`,
      `\\usepackage{tabularx}`,
      `\\definecolor{teal}{RGB}{0,128,128}`,
      `\\definecolor{cyan}{RGB}{0,139,139}`,
      `\\hypersetup{colorlinks=true,linkcolor=cyan,urlcolor=cyan}`,
      `\\pagenumbering{gobble}`,
      `\\setlength\\parindent{0pt}`,
      `\\raggedright`,
      `\\setlist[itemize]{leftmargin=1.5em, itemsep=1pt, topsep=2pt, parsep=0pt}`,
      `\\begin{document}`,
      ...bodyParts,
      `\\end{document}`,
      '',
    ].join('\n'));

    return { latexSource, templateId };
  }

  // ========== PROFESSIONAL TEMPLATE (Jake Gutierrez Style - ATS Optimized) ==========
  // Based on Jake Gutierrez's popular resume template
  // Clean, ATS-friendly format with consistent spacing
  
  // Use effectiveResumeData which is normalized from resumeText if that was the source
  const profData = (effectiveResumeData && typeof effectiveResumeData === 'object' ? (effectiveResumeData as any) : {}) as any;
  const profPersonal = profData.personalInfo || {};
  
  // Build header
  const fullName = latexEscape(pickString(profPersonal.fullName) || 'Your Name');
  const phone = pickString(profPersonal.phone);
  const location = pickString(profPersonal.location);
  const email = pickString(profPersonal.email);
  const linkedin = pickString(profPersonal.linkedin);
  const github = pickString(profPersonal.github);
  const website = pickString(profPersonal.website) || pickString(profPersonal.portfolio);
  
  // Build contact line for header
  const headerContactParts: string[] = [];
  if (phone) headerContactParts.push(phone);
  if (location) headerContactParts.push(location);
  const headerContactLine = headerContactParts.map(p => latexEscape(p)).join(' $\\diamond$ ');
  
  // Build links line
  const linksParts: string[] = [];
  if (email) {
    linksParts.push(`\\href{mailto:${asDetokenized(email)}}{\\raisebox{-0.2\\height}\\faEnvelope\\  \\underline{${latexEscape(email)}}}`);
  }
  if (linkedin) {
    const linkedinUrl = normalizeUrl(linkedin) || linkedin;
    const linkedinDisplay = linkedin.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    linksParts.push(`\\href{\\detokenize{${asDetokenized(linkedinUrl)}}}{\\raisebox{-0.2\\height}\\faLinkedin\\ \\underline{${latexEscape(linkedinDisplay)}}}`);
  }
  if (github) {
    const githubUrl = normalizeUrl(github) || github;
    const githubDisplay = github.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    linksParts.push(`\\href{\\detokenize{${asDetokenized(githubUrl)}}}{\\raisebox{-0.2\\height}\\faGithub\\ \\underline{${latexEscape(githubDisplay)}}}`);
  }
  if (website) {
    const websiteUrl = normalizeUrl(website) || website;
    const websiteDisplay = website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    linksParts.push(`\\href{\\detokenize{${asDetokenized(websiteUrl)}}}{\\raisebox{-0.2\\height}\\faGlobe\\ \\underline{${latexEscape(websiteDisplay)}}}`);
  }
  const linksLine = linksParts.join(' ~ ');
  
  // Summary/Objective section
  const profSummary = pickString(profData.summary);
  const objectiveSection = profSummary ? [
    `%-----------OBJECTIVE-----------`,
    `\\section{Objective}`,
    `  \\resumeSubHeadingListStart`,
    `    \\resumeSubheading`,
    `      {${latexEscape(profSummary)}}{}{}{}`,
    `  \\resumeSubHeadingListEnd`,
    ``,
  ].join('\n') : '';
  
  // Education section
  const profEduSource = profData.educationAndCertifications?.education || profData.education;
  let educationContent = '';
  if (Array.isArray(profEduSource) && profEduSource.length) {
    const eduItems: string[] = [];
    for (const edu of profEduSource) {
      const degree = latexEscape(pickString(edu?.degree) || '');
      const institution = latexEscape(pickString(edu?.institution) || '');
      const gradDate = latexEscape(pickString(edu?.graduationDate) || '');
      const gpa = pickString(edu?.gpa);
      const coursework = pickString(edu?.relevantCoursework);
      
      let eduEntry = `    \\resumeSubheading\n      {${degree}}{${gradDate}}\n      {${institution}}{}`;
      
      // Add GPA and coursework if available
      const details: string[] = [];
      if (gpa) details.push(`GPA: ${latexEscape(gpa)}`);
      if (coursework) details.push(`Relevant Coursework: ${latexEscape(coursework)}`);
      
      if (details.length) {
        eduEntry += `\n      \\resumeItemListStart\n        \\resumeItem{${details.join('. ')}}\n      \\resumeItemListEnd`;
      }
      
      eduItems.push(eduEntry);
    }
    if (eduItems.length) {
      educationContent = [
        `%-----------EDUCATION-----------`,
        `\\section{Education}`,
        `  \\resumeSubHeadingListStart`,
        eduItems.join('\n\n'),
        `  \\resumeSubHeadingListEnd`,
        ``,
      ].join('\n');
    }
  }
  
  // Experience section
  let experienceContent = '';
  if (Array.isArray(profData.experience) && profData.experience.length) {
    const expItems: string[] = [];
    for (const exp of profData.experience) {
      const company = latexEscape(pickString(exp?.company) || '');
      const title = latexEscape(pickString(exp?.title) || '');
      const startDate = pickString(exp?.startDate) || '';
      const endDate = pickString(exp?.endDate) || '';
      const current = Boolean(exp?.current);
      const location = latexEscape(pickString(exp?.location) || '');
      const highlights = pickStringArray(exp?.highlights);
      
      const dateRange = [startDate, current ? 'Present' : endDate].filter(Boolean).join(' -- ');
      
      let expEntry = `    \\resumeSubheading\n      {${company}}{${latexEscape(dateRange)}}\n      {${title}}{${location}}`;
      
      if (highlights.length) {
        const highlightItems = highlights.map(h => `        \\resumeItem{${latexEscape(h)}}`).join('\n');
        expEntry += `\n      \\resumeItemListStart\n${highlightItems}\n      \\resumeItemListEnd`;
      }
      
      expItems.push(expEntry);
    }
    if (expItems.length) {
      experienceContent = [
        `%-----------EXPERIENCE-----------`,
        `\\section{Experience}`,
        `  \\resumeSubHeadingListStart`,
        expItems.join('\n\n'),
        `  \\resumeSubHeadingListEnd`,
        `\\vspace{-16pt}`,
        ``,
      ].join('\n');
    }
  }
  
  // Projects section
  let projectsContent = '';
  if (Array.isArray(profData.projects) && profData.projects.length) {
    const projItems: string[] = [];
    for (const proj of profData.projects) {
      const name = latexEscape(pickString(proj?.name) || '');
      const technologies = pickStringArray(proj?.technologies);
      const date = latexEscape(pickString(proj?.date) || pickString(proj?.startDate) || '');
      const description = pickString(proj?.description);
      const highlights = pickStringArray(proj?.highlights);
      
      const techStr = technologies.length ? technologies.map(t => latexEscape(t)).join(', ') : '';
      const projectHeading = techStr 
        ? `\\textbf{${name}} $|$ \\emph{${techStr}}`
        : `\\textbf{${name}}`;
      
      let projEntry = `      \\resumeProjectHeading\n          {${projectHeading}}{${date}}`;
      
      const allHighlights = [...(description ? [description] : []), ...highlights];
      if (allHighlights.length) {
        const highlightItems = allHighlights.map(h => `            \\resumeItem{${latexEscape(h)}}`).join('\n');
        projEntry += `\n          \\resumeItemListStart\n${highlightItems}\n          \\resumeItemListEnd`;
      }
      
      projItems.push(projEntry);
    }
    if (projItems.length) {
      projectsContent = [
        `%-----------PROJECTS-----------`,
        `\\section{Projects}`,
        `    \\vspace{-5pt}`,
        `    \\resumeSubHeadingListStart`,
        projItems.join('\n          \\vspace{-13pt}\n'),
        `    \\resumeSubHeadingListEnd`,
        `\\vspace{-15pt}`,
        ``,
      ].join('\n');
    }
  }
  
  // Skills section
  let skillsContent = '';
  const profSkills = profData.skills;
  if (Array.isArray(profSkills) && profSkills.length) {
    const skillLines: string[] = [];
    for (const group of profSkills) {
      const category = latexEscape(pickString(group?.category) || 'Skills');
      const items = pickStringArray(group?.items);
      if (items.length) {
        skillLines.push(`     \\textbf{${category}}{: ${items.map(i => latexEscape(i)).join(', ')}} \\\\`);
      }
    }
    if (skillLines.length) {
      skillsContent = [
        `%-----------TECHNICAL SKILLS-----------`,
        `\\section{Technical Skills}`,
        ` \\begin{itemize}[leftmargin=0.15in, label={}]`,
        `    \\small{\\item{`,
        skillLines.join('\n'),
        `    }}`,
        ` \\end{itemize}`,
        ` \\vspace{-16pt}`,
        ``,
      ].join('\n');
    }
  }
  
  // Leadership/Extracurricular (Awards section)
  let leadershipContent = '';
  if (Array.isArray(profData.awards) && profData.awards.length) {
    const awardItems: string[] = [];
    for (const award of profData.awards) {
      const title = latexEscape(pickString(award?.title) || '');
      const issuer = latexEscape(pickString(award?.issuer) || '');
      const date = latexEscape(pickString(award?.date) || '');
      const description = pickString(award?.description);
      
      let awardEntry = `        \\resumeSubheading{${title}}{${date}}{${issuer}}{}`;
      
      if (description) {
        awardEntry += `\n            \\resumeItemListStart\n                \\resumeItem{${latexEscape(description)}}\n            \\resumeItemListEnd`;
      }
      
      awardItems.push(awardEntry);
    }
    if (awardItems.length) {
      leadershipContent = [
        `%-----------LEADERSHIP / EXTRACURRICULAR-----------`,
        `\\section{Leadership / Extracurricular}`,
        `    \\resumeSubHeadingListStart`,
        awardItems.join('\n\n'),
        `    \\resumeSubHeadingListEnd`,
        ``,
      ].join('\n');
    }
  }
  
  // Certifications section
  let certificationsContent = '';
  const profCerts = profData.educationAndCertifications?.certifications || profData.certifications;
  if (Array.isArray(profCerts) && profCerts.length) {
    const certItems: string[] = [];
    for (const cert of profCerts) {
      const name = latexEscape(pickString(cert?.name) || '');
      const issuer = latexEscape(pickString(cert?.issuer) || '');
      const date = latexEscape(pickString(cert?.date) || '');
      
      certItems.push(`        \\resumeSubheading{${name}}{${date}}{${issuer}}{}`);
    }
    if (certItems.length) {
      certificationsContent = [
        `%-----------CERTIFICATIONS-----------`,
        `\\section{Certifications}`,
        `    \\resumeSubHeadingListStart`,
        certItems.join('\n'),
        `    \\resumeSubHeadingListEnd`,
        ``,
      ].join('\n');
    }
  }

  const latexSource = clampLatexSource([
    `%-------------------------`,
    `% Resume in LaTeX - Professional Template`,
    `% Based on Jake Gutierrez's template`,
    `% ATS-Optimized, Clean Layout`,
    `%------------------------`,
    ``,
    `\\documentclass[letterpaper,11pt]{article}`,
    ``,
    `\\usepackage{latexsym}`,
    `\\usepackage[empty]{fullpage}`,
    `\\usepackage{titlesec}`,
    `\\usepackage{marvosym}`,
    `\\usepackage[usenames,dvipsnames]{color}`,
    `\\usepackage{verbatim}`,
    `\\usepackage{enumitem}`,
    `\\usepackage[hidelinks]{hyperref}`,
    `\\usepackage{fancyhdr}`,
    `\\usepackage[english]{babel}`,
    `\\usepackage{tabularx}`,
    `\\usepackage{fontawesome5}`,
    `\\usepackage{multicol}`,
    `\\setlength{\\multicolsep}{-3.0pt}`,
    `\\setlength{\\columnsep}{-1pt}`,
    `% Note: glyphtounicode not needed with XeLaTeX/tectonic - Unicode is native`,
    ``,
    `\\pagestyle{fancy}`,
    `\\fancyhf{} % clear all header and footer fields`,
    `\\fancyfoot{}`,
    `\\renewcommand{\\headrulewidth}{0pt}`,
    `\\renewcommand{\\footrulewidth}{0pt}`,
    ``,
    `% Adjust margins`,
    `\\addtolength{\\oddsidemargin}{-0.6in}`,
    `\\addtolength{\\evensidemargin}{-0.5in}`,
    `\\addtolength{\\textwidth}{1.19in}`,
    `\\addtolength{\\topmargin}{-.7in}`,
    `\\addtolength{\\textheight}{1.4in}`,
    ``,
    `\\urlstyle{same}`,
    ``,
    `\\raggedbottom`,
    `\\raggedright`,
    `\\setlength{\\tabcolsep}{0in}`,
    ``,
    `% Sections formatting`,
    `\\titleformat{\\section}{`,
    `  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries`,
    `}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]`,
    ``,
    `% XeLaTeX/tectonic produces Unicode PDFs natively - ATS parsable`,
    ``,
    `%-------------------------`,
    `% Custom commands`,
    `\\newcommand{\\resumeItem}[1]{`,
    `  \\item\\small{`,
    `    {#1 \\vspace{-2pt}}`,
    `  }`,
    `}`,
    ``,
    `\\newcommand{\\classesList}[4]{`,
    `    \\item\\small{`,
    `        {#1 #2 #3 #4 \\vspace{-2pt}}`,
    `  }`,
    `}`,
    ``,
    `\\newcommand{\\resumeSubheading}[4]{`,
    `  \\vspace{-2pt}\\item`,
    `    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}`,
    `      \\textbf{#1} & \\textbf{\\small #2} \\\\`,
    `      \\textit{\\small#3} & \\textit{\\small #4} \\\\`,
    `    \\end{tabular*}\\vspace{-7pt}`,
    `}`,
    ``,
    `\\newcommand{\\resumeSubSubheading}[2]{`,
    `    \\item`,
    `    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}`,
    `      \\textit{\\small#1} & \\textit{\\small #2} \\\\`,
    `    \\end{tabular*}\\vspace{-7pt}`,
    `}`,
    ``,
    `\\newcommand{\\resumeProjectHeading}[2]{`,
    `    \\item`,
    `    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}`,
    `      \\small#1 & \\textbf{\\small #2}\\\\`,
    `    \\end{tabular*}\\vspace{-7pt}`,
    `}`,
    ``,
    `\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}`,
    ``,
    `\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}`,
    `\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}`,
    ``,
    `\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}`,
    `\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}`,
    `\\newcommand{\\resumeItemListStart}{\\begin{itemize}}`,
    `\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`,
    ``,
    `%-------------------------------------------`,
    `%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%`,
    ``,
    `\\begin{document}`,
    ``,
    `%----------HEADING----------`,
    `\\begin{center}`,
    `    {\\Huge \\scshape ${fullName}} \\\\ \\vspace{1pt}`,
    headerContactLine ? `    ${headerContactLine} \\\\ \\vspace{1pt}` : '',
    linksLine ? `    \\small ${linksLine}` : '',
    `    \\vspace{-8pt}`,
    `\\end{center}`,
    ``,
    objectiveSection,
    educationContent,
    experienceContent,
    projectsContent,
    skillsContent,
    leadershipContent,
    certificationsContent,
    ``,
    `\\end{document}`,
    '',
  ].filter(line => line !== undefined).join('\n'));

  return { latexSource, templateId };
}
