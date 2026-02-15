import { latexEscape } from './escape.js';
const MAX_LATEX_SOURCE_CHARS = 200_000;
function clampLatexSource(latex) {
    if (latex.length <= MAX_LATEX_SOURCE_CHARS)
        return latex;
    return latex.slice(0, MAX_LATEX_SOURCE_CHARS) + '\n% [TRUNCATED]\n';
}
function sanitizeTemplateId(templateId) {
    const trimmed = templateId.trim().toLowerCase();
    const validIds = ['professional', 'faang', 'jake', 'deedy', 'modern', 'minimal', 'tech'];
    return validIds.includes(trimmed) ? trimmed : 'professional';
}
function asDetokenized(input) {
    // Defensive: keep braces out of \detokenize{...}.
    return input.replace(/[{}]/g, '').trim();
}
function normalizeUrl(raw) {
    if (!raw)
        return undefined;
    const s = raw.trim();
    if (!s)
        return undefined;
    if (/^https?:\/\//i.test(s))
        return s;
    if (/^mailto:/i.test(s))
        return s;
    return `https://${s}`;
}
function href(url, label) {
    const safeUrl = asDetokenized(url);
    const safeLabel = label?.trim() ? latexEscape(label.trim()) : latexEscape(url);
    // Use \detokenize to avoid URL escaping issues with underscores, etc.
    return `\\href{\\detokenize{${safeUrl}}}{${safeLabel}}`;
}
function headerBlock(fullName, contactLine) {
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
function section(title, bodyLines) {
    const cleanTitle = latexEscape(title);
    const body = bodyLines.filter(Boolean).join('\n');
    if (!body.trim())
        return '';
    return [`\\section*{${cleanTitle}}`, body, `\\vspace{4pt}`].join('\n');
}
function asItemize(items) {
    const safeItems = items
        .map((i) => i.trim())
        .filter(Boolean)
        .map((i) => `  \\item ${latexEscape(i)}`);
    if (!safeItems.length)
        return '';
    return [`\\begin{itemize}`, ...safeItems, `\\end{itemize}`].join('\n');
}
function linesToBlocks(text) {
    const raw = text.replace(/\r\n/g, '\n');
    const paragraphs = raw
        .split(/\n\s*\n/g)
        .map((p) => p.trim())
        .filter(Boolean);
    const blocks = [];
    for (const p of paragraphs) {
        const lines = p
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
        const bulletLines = lines.filter((l) => /^[-•*]\s+/.test(l));
        const nonBulletLines = lines.filter((l) => !/^[-•*]\s+/.test(l));
        if (bulletLines.length && bulletLines.length === lines.length) {
            blocks.push(asItemize(bulletLines.map((l) => l.replace(/^[-•*]\s+/, '').trim())));
            continue;
        }
        // Default: join lines as a paragraph with line breaks
        const joined = nonBulletLines.map((l) => latexEscape(l)).join('\\\\\n');
        blocks.push(joined);
        if (bulletLines.length) {
            blocks.push(asItemize(bulletLines.map((l) => l.replace(/^[-•*]\s+/, '').trim())));
        }
    }
    return blocks.filter((b) => b.trim().length > 0);
}
function pickString(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function pickStringArray(value) {
    if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(value))
        return [];
    return value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}
function serializeResumeData(resumeData) {
    const data = (resumeData && typeof resumeData === 'object' ? resumeData : {});
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
    ].filter(Boolean);
    const summary = pickString(data.summary);
    // Skills: support both legacy array-of-groups and current object-of-arrays.
    const skillsBlocks = [];
    const skills = data.skills;
    if (Array.isArray(skills)) {
        for (const group of skills) {
            const category = pickString(group?.category) || 'Skills';
            const items = pickStringArray(group?.items);
            if (items.length) {
                skillsBlocks.push(`${latexEscape(category)}: ${latexEscape(items.join(', '))}\\\\`);
            }
        }
    }
    else if (skills && typeof skills === 'object') {
        const entries = Object.entries(skills);
        for (const [key, val] of entries) {
            const arr = pickStringArray(val);
            if (arr.length) {
                const label = key[0]?.toUpperCase() ? key[0].toUpperCase() + key.slice(1) : key;
                skillsBlocks.push(`${latexEscape(label)}: ${latexEscape(arr.join(', '))}\\\\`);
            }
        }
    }
    // Experience
    const expLines = [];
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
                expLines.push(`\\textbf{${latexEscape(headingParts[0])}}\\\\`);
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
    const eduLines = [];
    const eduSource = (data.educationAndCertifications && data.educationAndCertifications.education) ||
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
            if (line.trim())
                eduLines.push(`${latexEscape(line)}\\\\`);
            if (meta.trim())
                eduLines.push(`\\small ${latexEscape(meta)}\\normalsize\\\\`);
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
function faangHeaderBlock(params) {
    // Skip header entirely if no name provided
    if (!params.fullName?.trim())
        return '';
    const name = latexEscape(params.fullName.trim().toUpperCase());
    const contactParts = [];
    if (params.phone)
        contactParts.push(latexEscape(params.phone.trim()));
    if (params.location)
        contactParts.push(latexEscape(params.location.trim()));
    if (params.email) {
        const email = params.email.trim();
        contactParts.push(`{\\color{cyan}${href(`mailto:${email}`, email)}}`);
    }
    const linkedinUrl = normalizeUrl(params.linkedin);
    if (linkedinUrl)
        contactParts.push(`{\\color{cyan}${href(linkedinUrl, params.linkedin?.trim() || 'LinkedIn')}}`);
    const githubUrl = normalizeUrl(params.github);
    if (githubUrl)
        contactParts.push(`{\\color{cyan}${href(githubUrl, params.github?.trim() || 'GitHub')}}`);
    const websiteUrl = normalizeUrl(params.website);
    if (websiteUrl)
        contactParts.push(`{\\color{cyan}${href(websiteUrl, params.website?.trim() || 'Website')}}`);
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
function faangSection(title, bodyLines) {
    const cleanTitle = latexEscape(title.toUpperCase());
    const body = bodyLines.filter(Boolean).join('\n');
    if (!body.trim())
        return '';
    return [
        `\\par`,
        `\\noindent{\\color{teal}\\textsc{\\textbf{${cleanTitle}}}}\\\\`,
        `\\vspace{2pt}\\hrule\\vspace{4pt}`,
        body,
        `\\par\\vspace{6pt}`,
    ].join('\n');
}
function faangSkillsLines(skills) {
    const data = skills;
    const lines = [];
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
        const entries = Object.entries(data);
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
function faangCertificationsFromResumeData(resumeData) {
    const data = (resumeData && typeof resumeData === 'object' ? resumeData : {});
    const certs = data.educationAndCertifications?.certifications || data.certifications;
    const lines = [];
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
                lines.push(right
                    ? `\\textbf{${latexEscape(left)}}\\hfill ${latexEscape(right)}\\\\`
                    : `\\textbf{${latexEscape(left)}}\\\\`);
                const metaParts = [
                    expirationDate ? `Expires: ${expirationDate}` : undefined,
                    credentialId ? `Credential ID: ${credentialId}` : undefined,
                ].filter(Boolean);
                if (metaParts.length) {
                    lines.push(`\\small ${latexEscape(metaParts.join(' | '))}\\normalsize\\\\`);
                }
                lines.push('\\par\\vspace{2pt}');
            }
        }
    }
    return lines;
}
function faangExperienceFromResumeData(resumeData) {
    const data = (resumeData && typeof resumeData === 'object' ? resumeData : {});
    if (!Array.isArray(data.experience))
        return [];
    const lines = [];
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
function faangProjectsFromResumeData(resumeData) {
    const data = (resumeData && typeof resumeData === 'object' ? resumeData : {});
    if (!Array.isArray(data.projects))
        return [];
    const lines = [];
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
        const rightParts = [];
        if (normalizedGitHub)
            rightParts.push(`{\\color{cyan}[${href(normalizedGitHub, 'GitHub')}]}`);
        if (normalizedLive)
            rightParts.push(`{\\color{cyan}[${href(normalizedLive, 'Live')}]}`);
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
function faangEducationFromResumeData(resumeData) {
    const data = (resumeData && typeof resumeData === 'object' ? resumeData : {});
    const eduSource = (data.educationAndCertifications && data.educationAndCertifications.education) || data.education;
    const lines = [];
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
function faangAwardsFromResumeData(resumeData) {
    const data = (resumeData && typeof resumeData === 'object' ? resumeData : {});
    const awards = data.awards;
    if (!Array.isArray(awards) || !awards.length)
        return [];
    const lines = [];
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
function normalizeResumeTextToData(text) {
    const data = {
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
                if (emailMatch)
                    data.personalInfo.email = emailMatch[1];
                const phoneMatch = contactText.match(/(\+?\d[\d\s-]{8,}\d)/i);
                if (phoneMatch)
                    data.personalInfo.phone = phoneMatch[1].trim();
                const linkedinMatch = contactText.match(/linkedin[.:]?\s*([^\s|]+)/i) || contactText.match(/(linkedin\.com\/in\/[\w-]+)/i);
                if (linkedinMatch)
                    data.personalInfo.linkedin = linkedinMatch[1];
                const githubMatch = contactText.match(/github[.:]?\s*([^\s|]+)/i) || contactText.match(/(github\.com\/[\w-]+)/i);
                if (githubMatch)
                    data.personalInfo.github = githubMatch[1];
                // Extract location - usually last item before newline or end
                const locMatch = contactText.match(/\|\s*([A-Za-z][A-Za-z\s,]+?)(?:\s*$|\s*\n)/);
                if (locMatch)
                    data.personalInfo.location = locMatch[1].trim();
            }
        }
    }
    // Split by === SECTION === markers
    const sectionPattern = /===\s*([^=]+?)\s*===/gi;
    const sections = [];
    let lastIndex = 0;
    let match;
    const sectionTitles = [];
    const sectionIndices = [];
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
            let currentExp = null;
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
            const isBullet = (line) => /^[•\-*]\s+/.test(line);
            const isLikelyHeader = (line) => {
                if (isBullet(line))
                    return false;
                // Avoid treating link-only lines as headers.
                if (/^(GitHub|Live|Demo)\s*:/i.test(line))
                    return false;
                if (/^https?:\/\//i.test(line))
                    return false;
                // A header is typically short and starts with a letter/number.
                if (!/^[A-Za-z0-9]/.test(line))
                    return false;
                return true;
            };
            const blocks = [];
            let current = [];
            for (const line of rawLines) {
                if (isLikelyHeader(line)) {
                    if (current.length)
                        blocks.push(current);
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
            if (current.length)
                blocks.push(current);
            for (const blockLines of blocks) {
                const headerLine = blockLines[0] || '';
                const restLines = blockLines.slice(1);
                // Extract project name and technologies from common patterns.
                let name;
                let technologies = [];
                // Pattern 1: "Name | Tech, Tech"
                const pipeMatch = headerLine.match(/^([^|]+)\|(.+)$/);
                if (pipeMatch) {
                    name = pipeMatch[1]?.trim();
                    technologies = pipeMatch[2]
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean);
                }
                else {
                    // Pattern 2: "Name – Subtitle" / "Name - Subtitle" / "Name — Subtitle"
                    // Keep only the name part as the project name.
                    const dashMatch = headerLine.match(/^(.+?)(?:\s*[–—-]\s+.+)?$/);
                    name = dashMatch?.[1]?.trim();
                }
                // Parse bullets for description/achievements and capture links.
                let description;
                const achievements = [];
                let githubUrl;
                let liveDemoUrl;
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
                    if (ghMatch)
                        githubUrl = ghMatch[1];
                    const liveMatch = payload.match(/(?:Live|Demo)\s*:\s*(https?:\/\/[^\s|]+)/i);
                    if (liveMatch)
                        liveDemoUrl = liveMatch[1];
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
                if (!githubUrl && githubLinkMatch?.[1])
                    githubUrl = githubLinkMatch[1];
                if (!liveDemoUrl && (liveLinkMatch?.[1] || demoLinkMatch?.[1]))
                    liveDemoUrl = liveLinkMatch?.[1] || demoLinkMatch?.[1];
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
                if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
                    continue;
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
                if (!cleanLine)
                    continue;
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
export function serializeToLatex(input) {
    const templateId = sanitizeTemplateId(input.templateId);
    // Normalize resume data
    let effectiveResumeData = input.resumeData;
    if (input.source === 'resumeText') {
        const text = (input.resumeText || '').trim();
        effectiveResumeData = normalizeResumeTextToData(text);
    }
    const extracted = serializeResumeData(effectiveResumeData);
    const contact = extracted.contact || {};
    const resumeDataObj = effectiveResumeData && typeof effectiveResumeData === 'object' ? effectiveResumeData : {};
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
        // Build contact line
        const contactItems = [
            contact.email ? latexEscape(contact.email) : undefined,
            contact.phone ? latexEscape(contact.phone) : undefined,
            contact.linkedin ? `linkedin.com/in/${latexEscape(contact.linkedin.replace(/.*linkedin\.com\/in\//i, '').replace(/\/$/, ''))}` : undefined,
            contact.github ? `github.com/${latexEscape(contact.github.replace(/.*github\.com\//i, '').replace(/\/$/, ''))}` : undefined,
        ].filter(Boolean);
        // Education entries
        const eduEntries = [];
        const eduData = resumeDataObj.educationAndCertifications?.education || resumeDataObj.education;
        if (Array.isArray(eduData)) {
            const rows = [];
            rows.push(`\\toprule`);
            rows.push(`\\textbf{Degree} & \\textbf{Specialization} & \\textbf{Institute} & \\textbf{Year} & \\textbf{GPA} \\\\`);
            rows.push(`\\midrule`);
            for (const edu of eduData) {
                const degree = pickString(edu?.degree) || '';
                const institution = pickString(edu?.institution) || '';
                const gradDate = pickString(edu?.graduationDate) || '';
                const gpa = pickString(edu?.gpa) || '-';
                const field = pickString(edu?.field) || '';
                rows.push(`${latexEscape(degree)} & \\textit{${latexEscape(field)}} & ${latexEscape(institution)} & ${latexEscape(gradDate)} & ${latexEscape(gpa)} \\\\`);
            }
            rows.push(`\\bottomrule`);
            eduEntries.push(...rows);
        }
        // Experience entries
        const expEntries = [];
        if (Array.isArray(resumeDataObj.experience)) {
            for (const exp of resumeDataObj.experience) {
                const title = pickString(exp?.title) || '';
                const company = pickString(exp?.company) || '';
                const startDate = pickString(exp?.startDate) || '';
                const endDate = pickString(exp?.endDate) || '';
                const current = Boolean(exp?.current);
                const achievements = pickStringArray(exp?.achievements);
                const dateRange = [startDate, current ? 'Present' : endDate].filter(Boolean).join('-');
                if (title || company) {
                    expEntries.push(`\\begin{itemize}`);
                    expEntries.push(`\\vspace{-0.5mm}`);
                    expEntries.push(`\\item {\\bf ${latexEscape(title)}} \\textit{[${latexEscape(company)}]}`);
                    expEntries.push(`\\textit{\\hfill {${latexEscape(dateRange)}}}`);
                    expEntries.push(`\\vspace{-1mm}`);
                    if (achievements.length) {
                        expEntries.push(`\\begin{itemize}`);
                        for (const ach of achievements) {
                            expEntries.push(`\\item ${latexEscape(ach)}`);
                        }
                        expEntries.push(`\\vspace{-1mm}`);
                        expEntries.push(`\\end{itemize}`);
                    }
                    expEntries.push(`\\end{itemize}`);
                }
            }
        }
        // Projects entries
        const projEntries = [];
        if (Array.isArray(resumeDataObj.projects)) {
            for (const proj of resumeDataObj.projects) {
                const name = pickString(proj?.name) || '';
                const tech = pickStringArray(proj?.technologies);
                const achievements = pickStringArray(proj?.achievements);
                const description = pickString(proj?.description) || '';
                if (name) {
                    projEntries.push(`\\begin{itemize}`);
                    projEntries.push(`\\vspace{-0.5mm}`);
                    const techStr = tech.length ? ` \\textit{[${latexEscape(tech.slice(0, 3).join(', '))}]}` : '';
                    projEntries.push(`\\item {\\bf ${latexEscape(name)}}${techStr}`);
                    projEntries.push(`\\begin{itemize}`);
                    projEntries.push(`\\vspace{-2mm}`);
                    if (description) {
                        projEntries.push(`\\item ${latexEscape(description)}`);
                    }
                    for (const ach of achievements.slice(0, 3)) {
                        projEntries.push(`\\item ${latexEscape(ach)}`);
                    }
                    projEntries.push(`\\vspace{-2mm}`);
                    projEntries.push(`\\end{itemize}`);
                    projEntries.push(`\\end{itemize}`);
                }
            }
        }
        // Skills
        const skillEntries = [];
        if (Array.isArray(resumeDataObj.skills)) {
            for (const group of resumeDataObj.skills) {
                const category = pickString(group?.category) || 'Skills';
                const items = pickStringArray(group?.items);
                if (items.length) {
                    skillEntries.push(`\\item \\textbf{${latexEscape(category)}:} ${latexEscape(items.join(', '))}`);
                    skillEntries.push(`\\vspace{-1mm}`);
                }
            }
        }
        // Certifications
        const certEntries = [];
        const certs = resumeDataObj.educationAndCertifications?.certifications || resumeDataObj.certifications;
        if (Array.isArray(certs)) {
            for (const cert of certs) {
                const name = pickString(cert?.name);
                const issuer = pickString(cert?.issuer);
                if (name) {
                    const issuerStr = issuer ? ` (${latexEscape(issuer)})` : '';
                    certEntries.push(`\\item ${latexEscape(name)}${issuerStr}`);
                    certEntries.push(`\\vspace{-1.5mm}`);
                }
            }
        }
        const latexSource = clampLatexSource([
            `% template: jake`,
            `% Jake's Resume - Academic style with gray section headers`,
            `\\documentclass[a4paper,10pt]{article}`,
            ``,
            `\\usepackage[top=0.75in, bottom=0.75in, left=0.55in, right=0.85in]{geometry}`,
            `\\usepackage{graphicx}`,
            `\\usepackage{url}`,
            `\\usepackage{palatino}`,
            `\\usepackage{booktabs}`,
            `\\usepackage{hyperref}`,
            `\\fontfamily{garamond}`,
            `\\selectfont`,
            ``,
            `\\hypersetup{`,
            `    colorlinks=true,`,
            `    linkcolor=blue,`,
            `    filecolor=magenta,`,
            `    urlcolor=cyan,`,
            `}`,
            ``,
            `\\urlstyle{same}`,
            ``,
            `\\usepackage[T1]{fontenc}`,
            `\\usepackage[utf8]{inputenc}`,
            ``,
            `\\usepackage{color}`,
            `\\definecolor{mygrey}{gray}{0.75}`,
            `\\textheight=9.8in`,
            `\\raggedbottom`,
            ``,
            `\\setlength{\\tabcolsep}{0in}`,
            `\\newcommand{\\isep}{-2 pt}`,
            `\\newcommand{\\lsep}{-0.5cm}`,
            `\\newcommand{\\psep}{-0.6cm}`,
            `\\renewcommand{\\labelitemii}{$\\circ$}`,
            ``,
            `\\pagestyle{empty}`,
            ``,
            `% Custom commands`,
            `\\newcommand{\\resitem}[1]{\\item #1 \\vspace{-2pt}}`,
            `\\newcommand{\\resheading}[1]{{\\small \\colorbox{mygrey}{\\begin{minipage}{0.975\\textwidth}{\\textbf{#1 \\vphantom{p\\^{E}}}}\\end{minipage}}}}`,
            `\\newcommand{\\ressubheading}[3]{`,
            `\\begin{tabular*}{6.62in}{l @{\\extracolsep{\\fill}} r}`,
            `\\textsc{{\\textbf{#1}}} & \\textsc{\\textit{[#2]}} \\\\`,
            `\\end{tabular*}\\vspace{-8pt}}`,
            ``,
            `\\begin{document}`,
            ``,
            `\\hspace{0.5cm}\\\\[-1.8cm]`,
            ``,
            `% Header`,
            `\\textbf{${latexEscape(extracted.fullName || 'Resume')}} \\hspace{8cm} ${contactItems[0] ? `{\\bf ${contactItems[0]}}` : ''}\\\\`,
            contactItems[1] ? `\\indent ${contactItems[1]} \\\\` : '',
            contactItems[2] ? `\\indent ${contactItems[2]} \\\\` : '',
            contactItems[3] ? `\\indent ${contactItems[3]} \\\\` : '',
            ``,
            `\\vspace{-2mm}`,
            // Education
            eduEntries.length > 3 ? [
                `\\resheading{\\textbf{EDUCATION} }\\\\[\\lsep]\\\\ \\\\`,
                `\\indent \\begin{tabular}{ p{2.5cm} @{\\hskip 0.15in} p{5.5cm} @{\\hskip 0.15in} p{3.5cm} @{\\hskip 0.15in} p{2.5cm} @{\\hskip 0.15in} p{1.5cm} }`,
                ...eduEntries,
                `\\end{tabular}`,
                `\\\\ \\\\`,
            ].join('\n') : '',
            ``,
            `\\vspace{1mm}`,
            // Experience
            expEntries.length ? [
                `\\resheading{\\textbf{WORK EXPERIENCE} }`,
                ``,
                ...expEntries,
            ].join('\n') : '',
            ``,
            // Projects
            projEntries.length ? [
                `\\resheading{\\textbf{PROJECTS} }`,
                ``,
                ...projEntries,
            ].join('\n') : '',
            ``,
            // Certifications
            certEntries.length ? [
                `\\resheading{\\textbf{CERTIFICATIONS \\& ACHIEVEMENTS} }`,
                `\\begin{itemize}`,
                `\\vspace{-0.5mm}`,
                ...certEntries,
                `\\end{itemize}`,
            ].join('\n') : '',
            ``,
            // Skills
            skillEntries.length ? [
                `\\resheading{\\textbf{TECHNICAL SKILLS} }`,
                `\\begin{itemize}`,
                `\\vspace{-1mm}`,
                ...skillEntries,
                `\\vspace{-4mm}`,
                `\\end{itemize}`,
            ].join('\n') : '',
            ``,
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
        const leftColumnParts = [];
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
        const rightColumnParts = [];
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
    // ========== PROFESSIONAL TEMPLATE (Custom Class with Photo & csection) ==========
    // Helper to generate the professional template header with photo support
    function professionalHeaderBlock(params) {
        const name = latexEscape(params.fullName?.trim() || 'Your Name');
        const tagline = params.tagline?.trim() ? latexEscape(params.tagline.trim()) : '';
        const location = params.location?.trim() ? latexEscape(params.location.trim()) : '';
        const contactLinks = [];
        if (params.website) {
            const url = normalizeUrl(params.website) || params.website;
            contactLinks.push(`\\href{\\detokenize{${asDetokenized(url)}}}{Portfolio}`);
        }
        if (params.email) {
            contactLinks.push(`\\href{mailto:${asDetokenized(params.email)}}{Mail ID}`);
        }
        if (params.phone) {
            contactLinks.push(`\\href{tel:${asDetokenized(params.phone)}}{Mobile}`);
        }
        if (params.github) {
            const url = normalizeUrl(params.github) || params.github;
            contactLinks.push(`\\href{\\detokenize{${asDetokenized(url)}}}{GitHub}`);
        }
        const secondaryLinks = [];
        if (params.linkedin) {
            const url = normalizeUrl(params.linkedin) || params.linkedin;
            secondaryLinks.push(`\\href{\\detokenize{${asDetokenized(url)}}}{LinkedIn}`);
        }
        if (params.codingProfiles) {
            const url = normalizeUrl(params.codingProfiles) || params.codingProfiles;
            secondaryLinks.push(`\\href{\\detokenize{${asDetokenized(url)}}}{Coding Profiles}`);
        }
        const firstRowLinks = contactLinks.length ? `\\clink{${contactLinks.join(' \\textbf{·} ')}}` : '';
        const secondRowLinks = secondaryLinks.length ? `\\clink{${secondaryLinks.join(' \\textbf{·} ')}}` : '';
        return [
            `\\noindent`,
            `\\begin{tabularx}{\\linewidth}{@{}m{0.75\\textwidth} m{0.20\\textwidth}@{}}`,
            `{`,
            `    \\large {${name}} \\newline`,
            `    \\small{`,
            tagline ? `        ${tagline}\\newline` : '',
            location ? `        ${location} \\textbf{·} \\newline` : '',
            firstRowLinks ? `        ${firstRowLinks} \\newline` : '',
            secondRowLinks ? `        ${secondRowLinks}` : '',
            `    }`,
            `}`,
            `&`,
            `{`,
            `    % Photo placeholder - replace mypic.png with actual photo`,
            `    \\raggedleft`,
            `    \\rule{3cm}{3.5cm} % Placeholder box for photo`,
            `}`,
            `\\end{tabularx}`,
        ].filter(Boolean).join('\n');
    }
    function professionalCsection(title, content) {
        if (!content.trim())
            return '';
        return [
            `\\csection{${latexEscape(title)}}{\\small`,
            content,
            `}`,
        ].join('\n');
    }
    // Build professional template body
    const profData = (input.resumeData && typeof input.resumeData === 'object' ? input.resumeData : {});
    const profPersonal = profData.personalInfo || {};
    // Summary section
    const profSummary = pickString(profData.summary);
    const summarySection = profSummary
        ? professionalCsection('Summary', `    \\begin{itemize}\n        \\item \\footnotesize ${latexEscape(profSummary)}\n    \\end{itemize}`)
        : '';
    // Education section
    const profEduSource = profData.educationAndCertifications?.education || profData.education;
    let educationItems = '';
    if (Array.isArray(profEduSource)) {
        const eduParts = [];
        for (const edu of profEduSource) {
            const degree = pickString(edu?.degree);
            const institution = pickString(edu?.institution);
            const gradDate = pickString(edu?.graduationDate);
            const gpa = pickString(edu?.gpa);
            const dateStr = gradDate ? `(${latexEscape(gradDate)})` : '';
            const line = [
                degree ? `\\textbf{${latexEscape(degree)}\\hspace{25em}${dateStr}}` : '',
                institution ? `\\newline{${latexEscape(institution)}}` : '',
                gpa ? `\\newline{GPA: ${latexEscape(gpa)}}` : '',
            ].filter(Boolean).join('');
            if (line)
                eduParts.push(`        \\item ${line}`);
        }
        if (eduParts.length) {
            educationItems = `    \\begin{itemize}\n${eduParts.join('\n\n')}\n    \\end{itemize}`;
        }
    }
    const educationSection = educationItems ? professionalCsection('EDUCATION', educationItems) : '';
    // Skills section
    let skillsItems = '';
    const profSkills = profData.skills;
    if (Array.isArray(profSkills) && profSkills.length) {
        const skillParts = [];
        for (const group of profSkills) {
            const category = pickString(group?.category) || 'Skills';
            const items = pickStringArray(group?.items);
            if (items.length) {
                skillParts.push(`        \\item \\textbf{${latexEscape(category)}} \\newline\n        {\\footnotesize ${latexEscape(items.join(', '))}}{}{}`);
            }
        }
        if (skillParts.length) {
            skillsItems = `    \\begin{itemize}\n${skillParts.join('\n\n')}\n    \\end{itemize}`;
        }
    }
    const skillsSection = skillsItems ? professionalCsection('SKILLS', skillsItems) : '';
    // Projects section  
    let projectsItems = '';
    if (Array.isArray(profData.projects) && profData.projects.length) {
        const projParts = [];
        for (const proj of profData.projects) {
            const name = pickString(proj?.name);
            const githubUrl = pickString(proj?.githubUrl);
            const liveDemoUrl = pickString(proj?.liveDemoUrl);
            const link = pickString(proj?.link);
            const linkPart = liveDemoUrl
                ? `{\\footnotesize \\hspace{30em}\\href{\\detokenize{${asDetokenized(normalizeUrl(liveDemoUrl) || liveDemoUrl)}}}{Link}}`
                : (link ? `{\\footnotesize \\hspace{30em}\\href{\\detokenize{${asDetokenized(normalizeUrl(link) || link)}}}{Link}}` : '');
            const githubPart = githubUrl
                ? `\\hspace{3em}{\\href{\\detokenize{${asDetokenized(normalizeUrl(githubUrl) || githubUrl)}}}{Github}}`
                : '';
            if (name) {
                projParts.push(`        \\item \\textbf{${latexEscape(name)}}\n        ${linkPart}${githubPart}{}`);
            }
        }
        if (projParts.length) {
            projectsItems = `    \\begin{itemize}\n${projParts.join('\n\n')}\n    \\end{itemize}`;
        }
    }
    const projectsSection = projectsItems ? professionalCsection('PROJECTS', projectsItems) : '';
    // Experience section
    let experienceItems = '';
    if (Array.isArray(profData.experience) && profData.experience.length) {
        const expParts = [];
        for (const exp of profData.experience) {
            const company = pickString(exp?.company);
            const title = pickString(exp?.title);
            const startDate = pickString(exp?.startDate);
            const endDate = pickString(exp?.endDate);
            const current = Boolean(exp?.current);
            const dateRange = [startDate, current ? 'Present' : endDate].filter(Boolean).join(' – ');
            const line = [
                company ? `\\textbf{${latexEscape(company)} \\hspace{15em}${dateRange ? latexEscape(dateRange) : ''}}` : '',
                title ? `\\newline{${latexEscape(title)}}{}{}{}` : '',
            ].filter(Boolean).join('');
            if (line)
                expParts.push(`        \\item ${line}`);
        }
        if (expParts.length) {
            experienceItems = `    \\begin{itemize}\n${expParts.join('\n\n')}\n    \\end{itemize}`;
        }
    }
    const experienceSection = experienceItems ? professionalCsection('EXPERIENCE', experienceItems) : '';
    // Certifications section (Global Certifications)
    let certsItems = '';
    const profCerts = profData.educationAndCertifications?.certifications || profData.certifications;
    if (Array.isArray(profCerts) && profCerts.length) {
        const certParts = [];
        for (const cert of profCerts) {
            const name = pickString(cert?.name);
            const issuer = pickString(cert?.issuer);
            const credentialId = pickString(cert?.credentialId);
            const scoreStr = credentialId ? `Overall Score: ${latexEscape(credentialId)}` : '';
            if (name) {
                certParts.push(`        \\item \\textbf{${latexEscape(name)}} \n        {\\hspace{20em}${scoreStr}}{}{}`);
            }
        }
        if (certParts.length) {
            certsItems = `    \\begin{itemize}\n${certParts.join('\n\n')}\n    \\end{itemize}`;
        }
    }
    const certificationsSection = certsItems ? professionalCsection('Global Certifications', certsItems) : '';
    // Awards section (can be shown as Significant Roles)
    let awardsItems = '';
    if (Array.isArray(profData.awards) && profData.awards.length) {
        const awardParts = [];
        for (const award of profData.awards) {
            const title = pickString(award?.title);
            const issuer = pickString(award?.issuer);
            const date = pickString(award?.date);
            const dateStr = date ? latexEscape(date) : '';
            if (title) {
                awardParts.push(`        \\item \\textbf{${latexEscape(title)} \\hspace{17.5em}${dateStr}}\\newline{${issuer ? latexEscape(issuer) : ''}}{}{}{}`);
            }
        }
        if (awardParts.length) {
            awardsItems = `    \\begin{itemize}\n${awardParts.join('\n\n')}\n    \\end{itemize}`;
        }
    }
    const awardsSection = awardsItems ? professionalCsection('Significant Roles', awardsItems) : '';
    // Declaration section
    const declarationSection = professionalCsection('Declaration', `    \\begin{itemize}
        \\item \\footnotesize I hereby declare that the above mentioned information is correct up to my knowledge and I bear the responsibility for the correctness of the above mentioned.
    \\end{itemize}`);
    // Assemble header
    const profHeader = professionalHeaderBlock({
        fullName: pickString(profPersonal.fullName),
        tagline: pickString(profData.tagline) || pickString(profPersonal.title),
        location: pickString(profPersonal.location),
        email: pickString(profPersonal.email),
        phone: pickString(profPersonal.phone),
        github: pickString(profPersonal.github),
        linkedin: pickString(profPersonal.linkedin),
        website: pickString(profPersonal.website) || pickString(profPersonal.portfolio),
    });
    const latexSource = clampLatexSource([
        `% template: professional`,
        `% Custom resume class with photo and csection environment`,
        `\\documentclass[14pt]{extreport}`,
        ``,
        `\\usepackage{ifthen}`,
        `\\usepackage[english]{babel}`,
        `\\usepackage[utf8x]{inputenc}`,
        `\\usepackage{geometry}`,
        `\\usepackage{array}`,
        `\\usepackage{enumitem}`,
        `\\usepackage{hyperref}`,
        `\\usepackage{xltabular}`,
        `\\usepackage{graphicx}`,
        `\\usepackage{outlines}`,
        ``,
        `\\setlist[itemize]{leftmargin=*}`,
        `\\linespread{1.15}`,
        `\\geometry{a4paper,`,
        `    left={0.5in},`,
        `    top={0.4in},`,
        `    right={0.5in},`,
        `    bottom={0.4in}`,
        `}`,
        ``,
        `\\newcommand\\clink[1]{{\\usefont{T1}{lmtt}{m}{n} #1 }}`,
        `\\pagenumbering{gobble}`,
        ``,
        `% Custom csection environment`,
        `\\newenvironment{csection}[2]{`,
        `    \\textbf{#1}`,
        `    \\vspace{0.15cm}`,
        `    \\hrule`,
        `    {#2}`,
        `}{}`,
        ``,
        `% Custom frcontent environment for formatted content`,
        `\\newenvironment{frcontent}[4]{`,
        `    {`,
        `        \\textbf{#1} \\leavevmode\\newline`,
        `        {\\footnotesize`,
        `            \\ifthenelse{\\equal{#2}{}}{}{#2 \\leavevmode\\newline}`,
        `            \\ifthenelse{\\equal{#3}{}}{}{#3 \\leavevmode\\newline}`,
        `            \\ifthenelse{\\equal{#4}{}}{}{\\textit{#4}}`,
        `        }`,
        `    }`,
        `}{}`,
        ``,
        `\\hypersetup{`,
        `    colorlinks=true,`,
        `    linkcolor=blue,`,
        `    urlcolor=blue`,
        `}`,
        ``,
        `\\begin{document}`,
        `\\fontfamily{ppl}\\selectfont`,
        ``,
        profHeader,
        ``,
        summarySection,
        educationSection,
        skillsSection,
        projectsSection,
        awardsSection,
        experienceSection,
        certificationsSection,
        declarationSection,
        ``,
        `\\end{document}`,
        '',
    ].filter(line => line !== undefined).join('\n'));
    return { latexSource, templateId };
}
