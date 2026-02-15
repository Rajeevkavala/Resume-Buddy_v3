'use client';

import React from 'react';
import { ResumeData } from '@/lib/types';

interface ProfessionalTemplateProps {
  resumeData: ResumeData;
}

export function ProfessionalTemplate({ resumeData }: ProfessionalTemplateProps) {
  const personalInfo = (resumeData as any)?.personalInfo || {};
  const summary = (resumeData as any)?.summary || '';

  // Support both legacy and current shapes found in the repo.
  const experience = Array.isArray((resumeData as any)?.experience) ? (resumeData as any).experience : [];
  const projects = Array.isArray((resumeData as any)?.projects) ? (resumeData as any).projects : [];

  const education =
    Array.isArray((resumeData as any)?.education)
      ? (resumeData as any).education
      : Array.isArray((resumeData as any)?.educationAndCertifications?.education)
        ? (resumeData as any).educationAndCertifications.education
        : [];

  const certifications =
    Array.isArray((resumeData as any)?.certifications)
      ? (resumeData as any).certifications
      : Array.isArray((resumeData as any)?.educationAndCertifications?.certifications)
        ? (resumeData as any).educationAndCertifications.certifications
        : [];

  const awards = Array.isArray((resumeData as any)?.awards) ? (resumeData as any).awards : [];

  // One-page constraints (A4): cap content + clamp long text to reduce overflow.
  const LIMITS = {
    summaryLines: 4,
    experienceRoles: 3,
    experienceBulletsPerRole: 3,
    educationEntries: 2,
    skillGroups: 4,
    skillItemsPerGroup: 6,
    projects: 2,
    projectTech: 4,
    certifications: 2,
    awards: 2,
  };

  const clampText = (text: unknown, maxChars: number) => {
    if (typeof text !== 'string') return '';
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    if (normalized.length <= maxChars) return normalized;
    return `${normalized.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
  };

  const lineClamp = (lines: number): React.CSSProperties => ({
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical' as any,
    WebkitLineClamp: lines as any,
    // Avoid PDF/html2canvas clipping where the last pixels of a line (descenders)
    // get cut off when clamped with overflow hidden.
    paddingBottom: '0.25em',
    overflow: 'hidden',
  });

  const safeName = clampText(personalInfo?.fullName, 60);
  const safeSummary = clampText(summary, 500);

  // Smart summary line clamping based on content length
  const summaryLineCount = safeSummary.length > 350 ? 5 
    : safeSummary.length > 250 ? 4 
    : safeSummary.length > 150 ? 3 
    : 2;

  const contactItems = [
    personalInfo.email ? String(personalInfo.email).trim() : '',
    personalInfo.phone ? String(personalInfo.phone).trim() : '',
    personalInfo.location ? String(personalInfo.location).trim() : '',
  ].filter(Boolean);

  const contactLinkItems = [
    { key: 'linkedin', label: 'LinkedIn', icon: 'in' },
    { key: 'github', label: 'GitHub', icon: '⌂' },
    { key: 'website', label: 'Website', icon: '🌐' },
    { key: 'portfolio', label: 'Portfolio', icon: '🌐' },
    { key: 'url', label: 'Website', icon: '🌐' },
  ]
    .map(({ key, label, icon }) => {
      const raw = (personalInfo as any)?.[key];
      const value = typeof raw === 'string' ? raw.trim() : '';
      if (!value) return null;
      return { key, label, icon, value: clampText(value, 80) || value };
    })
    .filter(Boolean) as Array<{ key: string; label: string; icon: string; value: string }>;

  const normalizeHref = (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return '';
    // If user stored plain domain/user handle, make it a valid clickable URL.
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const contactLinks = Array.from(
    new Map(
      contactLinkItems
        .map((item) => {
          const label = item.label === 'Website' ? 'Portfolio' : item.label;
          return {
            label,
            href: normalizeHref(item.value),
          };
        })
        .filter((l) => l.label && l.href)
        .map((l) => [l.label, l] as const)
    ).values()
  );

  const getSkillGroups = (): Record<
    'Languages & Web' | 'Frontend' | 'Backend' | 'Databases' | 'Tools & DevOps',
    string[]
  > => {
    const groups = {
      'Languages & Web': [] as string[],
      Frontend: [] as string[],
      Backend: [] as string[],
      Databases: [] as string[],
      'Tools & DevOps': [] as string[],
    };

    const rawSkills = (resumeData as any)?.skills;
    const addTo = (group: keyof typeof groups, items: unknown[]) => {
      items
        .map((s) => clampText(String(s ?? ''), 60))
        .filter(Boolean)
        .forEach((s) => groups[group].push(s));
    };

    // Array-based grouped skills: [{ category, items: [] }]
    if (Array.isArray(rawSkills)) {
      rawSkills.forEach((g: any) => {
        const category = String(g?.category ?? '').toLowerCase();
        const items = Array.isArray(g?.items) ? g.items : [];

        if (category.includes('language') || category.includes('web')) return addTo('Languages & Web', items);
        if (category.includes('front') || category.includes('ui')) return addTo('Frontend', items);
        if (category.includes('back') || category.includes('server')) return addTo('Backend', items);
        if (category.includes('database') || category.includes('db')) return addTo('Databases', items);
        if (category.includes('devops') || category.includes('tool') || category.includes('ci')) return addTo('Tools & DevOps', items);

        // Fallback to tools/devops to avoid adding extra group names.
        return addTo('Tools & DevOps', items);
      });
      return groups;
    }

    // Object-based grouped skills: { languages:[], frameworks:[], ... }
    if (rawSkills && typeof rawSkills === 'object') {
      addTo('Languages & Web', [
        ...((rawSkills as any).languages ?? []),
        ...((rawSkills as any).other ?? []),
      ]);
      addTo('Frontend', (rawSkills as any).frameworks ?? []);
      addTo('Databases', (rawSkills as any).databases ?? []);
      addTo('Tools & DevOps', [
        ...((rawSkills as any).tools ?? []),
        ...((rawSkills as any).cloud ?? []),
      ]);
      return groups;
    }

    return groups;
  };

  const skillGroups = getSkillGroups();
  const hasSkills = Object.values(skillGroups).some((items) => items.length > 0);

  const PT = {
    name: '20pt',
    section: '12pt',
    body: '10.5pt',
    contact: '9.5pt',
  } as const;

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: PT.section,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    lineHeight: 1.2,
    paddingBottom: '6pt',
    borderBottom: '0.5pt solid #222',
    marginTop: '16pt',
    marginBottom: '10pt',
  };

  const bodyTextStyle: React.CSSProperties = {
    fontSize: PT.body,
    lineHeight: 1.15,
    margin: 0,
  };

  const rowBetween: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '0.75rem',
  };

  return (
    <div
      className="resume-template template-professional resume-container"
      style={{
        padding: '0.55in 0.7in',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Inter, Calibri, Helvetica, Arial, sans-serif',
        fontSize: PT.body,
        lineHeight: 1.15,
      }}
    >
      {/* Header (matches sample: centered name + single-line contact) */}
      <header style={{ textAlign: 'center', marginBottom: '12pt' }}>
        <div style={{ fontSize: PT.name, fontWeight: 600, margin: 0, marginBottom: '12pt', lineHeight: 1.1 }}>
          {safeName || personalInfo.fullName || 'Your Name'}
        </div>

        {contactItems.length ? (
          <div
            style={{
              marginTop: '0',
              fontSize: PT.contact,
              lineHeight: 1.25,
              wordBreak: 'break-word',
            }}
          >
            {contactItems.join(' | ')}
          </div>
        ) : null}

        {contactLinks.length ? (
          <div
            style={{
              marginTop: '4pt',
              fontSize: PT.contact,
              lineHeight: 1.25,
              wordBreak: 'break-word',
            }}
          >
            {contactLinks.map((l, idx) => (
              <React.Fragment key={l.label}>
                {idx > 0 ? ' | ' : null}
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#333', textDecoration: 'none' }}
                >
                  {l.label}
                </a>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </header>

      {/* PROFESSIONAL SUMMARY */}
      {safeSummary ? (
        <section>
          <div style={sectionTitleStyle}>Professional Summary</div>
          <p style={{ ...bodyTextStyle, lineHeight: 1.2, marginBottom: '8pt', maxWidth: '95%', ...lineClamp(summaryLineCount) }}>
            {safeSummary}
          </p>
        </section>
      ) : null}

      {/* SKILLS */}
      {hasSkills ? (
        <section>
          <div style={sectionTitleStyle}>Skills</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
            {(Object.keys(skillGroups) as Array<keyof typeof skillGroups>).map((label) => {
              const items = skillGroups[label].slice(0, 10); // Max 10 items per group
              if (!items.length) return null;
              return (
                <div key={label} style={{ ...bodyTextStyle, lineHeight: 1.25, paddingLeft: '2pt' }}>
                  <span style={{ fontWeight: 700 }}>{label}:</span> <span>{items.join(', ')}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* EXPERIENCE */}
      {experience.length ? (
        <section>
          <div style={sectionTitleStyle}>Experience</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12pt' }}>
            {experience.slice(0, LIMITS.experienceRoles).map((exp: any, index: number) => {
              const start = clampText(exp.startDate, 24) || '';
              const end = exp.current ? 'Present' : (clampText(exp.endDate, 24) || '');
              const dateText = [start, end].filter(Boolean).join(' - ');

              return (
                <div key={index}>
                  <div style={rowBetween}>
                    <div style={{ fontWeight: 700, fontSize: PT.body }}>
                      {clampText(exp.title, 80) || exp.title}
                    </div>
                    <div style={{ fontWeight: 400, fontSize: PT.body, whiteSpace: 'nowrap', color: '#444' }}>{dateText}</div>
                  </div>
                  <div style={{ fontSize: PT.body, marginTop: '2pt' }}>
                    {clampText(exp.company, 70) || exp.company}
                    {exp.location ? <span> | {clampText(exp.location, 60) || exp.location}</span> : null}
                  </div>

                  {exp.achievements?.length ? (
                    <ul style={{ margin: '6pt 0 0 16pt', padding: 0 }}>
                      {exp.achievements
                        .slice(0, index === 0 ? 4 : LIMITS.experienceBulletsPerRole) // Allow 4 bullets for primary role
                        .map((a: any, i: number) => (
                          <li key={i} style={{ ...bodyTextStyle, marginBottom: '5pt', lineHeight: 1.2 }}>
                            {clampText(a, 180) || a}
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* PROJECTS */}
      {projects.length ? (
        <section>
          <div style={sectionTitleStyle}>Projects</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12pt' }}>
            {projects.slice(0, LIMITS.projects).map((p: any, index: number) => (
              <div key={index}>
                <div style={{ fontWeight: 700, fontSize: PT.body }}>
                  {clampText(p.name, 70) || p.name}
                </div>
                {p.description ? (
                  <div style={{ fontSize: PT.body, fontStyle: 'italic', marginTop: '2pt', color: '#333' }}>
                    {clampText(p.description, 160) || p.description}
                  </div>
                ) : null}

                {p.achievements?.length ? (
                  <ul style={{ margin: '6pt 0 0 16pt', padding: 0 }}>
                    {p.achievements.slice(0, 2).map((a: any, i: number) => (
                      <li key={i} style={{ ...bodyTextStyle, marginBottom: '5pt', lineHeight: 1.2 }}>
                        {clampText(a, 180) || a}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ACHIEVEMENTS & CERTIFICATIONS */}
      {(certifications.length || awards.length) ? (
        <section>
          <div style={sectionTitleStyle}>Achievements &amp; Certifications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
            {awards.slice(0, LIMITS.awards).map((a: any, i: number) => (
              <p key={`award-${i}`} style={{ ...bodyTextStyle, marginBottom: '4pt' }}>
                {clampText(a.title || a.name || a, 120) || String(a)}
              </p>
            ))}
            {certifications.slice(0, LIMITS.certifications).map((c: any, i: number) => (
              <p key={`cert-${i}`} style={{ ...bodyTextStyle, marginBottom: '6pt' }}>
                {clampText(c.name || c.title || c, 120) || String(c)}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {/* EDUCATION */}
      {education.length ? (
        <section>
          <div style={sectionTitleStyle}>Education</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
            {education.slice(0, LIMITS.educationEntries).map((edu: any, index: number) => (
              <div key={index}>
                <div style={rowBetween}>
                  <div style={{ fontWeight: 700, fontSize: PT.body }}>
                    {clampText(edu.degree, 80) || edu.degree}
                  </div>
                  <div style={{ fontWeight: 400, fontSize: PT.body, whiteSpace: 'nowrap', color: '#444' }}>
                    {clampText(edu.graduationDate, 24) || edu.graduationDate}
                  </div>
                </div>
                <div style={{ fontSize: PT.body, marginTop: '2pt' }}>
                  {clampText(edu.institution, 90) || edu.institution}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
