/**
 * FAANG Template
 * Clean, simple template inspired by FAANGPath with excellent ATS compatibility
 * Features: Single column, cyan section headers, professional typography, optimized for tech roles
 */

import React from 'react';
import { ResumeData } from '@/lib/types';

interface FaangTemplateProps {
  resumeData: ResumeData;
}

export function FaangTemplate({ resumeData }: FaangTemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, awards } = resumeData;

  const coerceInlineText = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
    if (Array.isArray(value)) return value.map(coerceInlineText).filter(Boolean).join(' ');
    if (typeof value === 'object') {
      const candidates = [
        (value as any).text,
        (value as any).value,
        (value as any).content,
        (value as any).description,
        (value as any).achievement,
        (value as any).improved,
        (value as any).bullet,
      ];
      const s = candidates.find((c) => typeof c === 'string' && c.trim().length > 0);
      if (typeof s === 'string') return s;
    }
    return '';
  };

  const normalizedSkillsEntries: Array<{ category: string; items: string[] }> =
    Array.isArray(skills)
      ? skills
          .map((g: any) => ({
            category: typeof g?.category === 'string' ? g.category : 'Skills',
            items: Array.isArray(g?.items) ? g.items.filter((x: any) => typeof x === 'string') : [],
          }))
          .filter((g) => g.category && g.items.length > 0)
      : [];

  // Build contact info array for bullet-separated display
  const contactItems: string[] = [];
  if (personalInfo.phone) contactItems.push(personalInfo.phone);
  if (personalInfo.location) contactItems.push(personalInfo.location);
  if (personalInfo.email) contactItems.push(personalInfo.email);
  if (personalInfo.linkedin) {
    const linkedinDisplay = personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    contactItems.push(linkedinDisplay);
  }
  if (personalInfo.github) {
    const githubDisplay = personalInfo.github.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    contactItems.push(githubDisplay);
  }
  if (personalInfo.website) {
    const websiteDisplay = personalInfo.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    contactItems.push(websiteDisplay);
  }

  // Section header component with cyan background
  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-cyan-600 text-white px-3 py-1.5 mb-3 -mx-12">
      <h2 className="text-sm font-bold uppercase tracking-wider px-12">
        {children}
      </h2>
    </div>
  );

  return (
    <div className="template-faang font-faang p-12 bg-white text-gray-900" style={{ minHeight: '297mm' }}>
      {/* Header Section */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 tracking-tight uppercase">
          {personalInfo.fullName}
        </h1>
        
        {/* Contact Information - Bullet separated */}
        <div className="text-sm text-gray-700">
          {contactItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-2">•</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* Objective/Summary Section */}
      {summary && (
        <section className="mb-6">
          <SectionHeader>Objective</SectionHeader>
          <p className="text-sm leading-relaxed text-gray-800 px-1">
            {summary}
          </p>
        </section>
      )}

      {/* Education Section - Moved up for FAANG style */}
      {education && education.length > 0 && (
        <section className="mb-6">
          <SectionHeader>Education</SectionHeader>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index} className="px-1">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-gray-900">{edu.institution}</span>
                    {edu.location && (
                      <span className="text-sm text-gray-700"> — {edu.location}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {edu.graduationDate}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {edu.degree}
                  {edu.gpa && <span className="ml-2">• GPA: {edu.gpa}</span>}
                </div>
                {edu.honors && edu.honors.length > 0 && (
                  <p className="text-sm text-gray-700 italic">
                    {edu.honors.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technical Skills Section */}
      {normalizedSkillsEntries.length > 0 && (
        <section className="mb-6">
          <SectionHeader>Technical Skills</SectionHeader>
          <div className="space-y-1 px-1">
            {normalizedSkillsEntries.map(({ category, items }, index) => (
              <div key={`skill-${index}-${category}`} className="text-sm">
                <span className="font-bold text-gray-900">{category}:</span>{' '}
                <span className="text-gray-800">{items.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <section className="mb-6">
          <SectionHeader>Experience</SectionHeader>
          <div className="space-y-4 px-1">
            {experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-gray-900">{exp.company}</span>
                    {exp.location && (
                      <span className="text-sm text-gray-700"> — {exp.location}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {exp.startDate} – {exp.endDate || 'Present'}
                  </span>
                </div>
                <div className="text-sm italic text-gray-700 mb-1">
                  {exp.title}
                </div>
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-outside ml-5 space-y-0.5 text-sm text-gray-800">
                    {exp.achievements.map((achievement: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {coerceInlineText(achievement)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <section className="mb-6">
          <SectionHeader>Projects</SectionHeader>
          <div className="space-y-3 px-1">
            {projects.map((project, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">
                    {project.name}
                    {(() => {
                      const githubUrl =
                        (project as any).githubUrl ||
                        (project.link && /github\.com\//i.test(project.link) ? project.link : undefined);
                      const liveDemoUrl =
                        (project as any).liveDemoUrl ||
                        (project.link && !/github\.com\//i.test(project.link) ? project.link : undefined);

                      return (
                        <>
                          {githubUrl && (
                            <a
                              href={githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-normal"
                            >
                              [GitHub]
                            </a>
                          )}
                          {liveDemoUrl && (
                            <a
                              href={liveDemoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-normal"
                            >
                              [Live]
                            </a>
                          )}
                          {!githubUrl && !liveDemoUrl && project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-normal"
                            >
                              [Link]
                            </a>
                          )}
                        </>
                      );
                    })()}
                  </span>
                  {project.technologies && project.technologies.length > 0 && (
                    <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
                      {project.technologies.slice(0, 3).join(', ')}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-gray-700 italic mb-1">
                    {project.description}
                  </p>
                )}
                {project.achievements && project.achievements.length > 0 && (
                  <ul className="list-disc list-outside ml-5 space-y-0.5 text-sm text-gray-800">
                    {project.achievements.map((achievement: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {coerceInlineText(achievement)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications Section */}
      {certifications && certifications.length > 0 && (
        <section className="mb-6">
          <SectionHeader>Certifications</SectionHeader>
          <div className="space-y-2 px-1">
            {certifications.map((cert, index) => (
              <div key={index} className="flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-gray-900">{cert.name}</span>
                  {cert.issuer && (
                    <span className="text-sm text-gray-700"> — {cert.issuer}</span>
                  )}
                </div>
                {cert.date && (
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {cert.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Awards Section */}
      {awards && awards.length > 0 && (
        <section className="mb-6">
          <SectionHeader>Awards & Achievements</SectionHeader>
          <div className="space-y-2 px-1">
            {awards.map((award, index) => (
              <div key={index} className="flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-gray-900">{award.title}</span>
                  {award.issuer && (
                    <span className="text-sm text-gray-700"> — {award.issuer}</span>
                  )}
                </div>
                {award.date && (
                  <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                    {award.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
