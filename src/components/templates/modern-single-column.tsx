import React from 'react';
import { ResumeData, ColorScheme, FontPairing } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TemplateProps {
  data: ResumeData;
  colorScheme?: ColorScheme;
  fonts?: FontPairing;
  className?: string;
}

// Modern Single Column Template
export function ModernSingleColumnTemplate({ data, colorScheme, fonts, className }: TemplateProps) {
  const colors = colorScheme || {
    primary: '#1A73E8',
    secondary: '#333333',
    accent: '#F1F3F4',
    text: '#000000',
    background: '#FFFFFF',
  };

  const fontFamily = fonts || {
    heading: 'Inter, sans-serif',
    body: 'Roboto, sans-serif',
  };

  return (
    <div
      className={cn('resume-template bg-white p-8 max-w-4xl mx-auto', className)}
      style={{ 
        fontFamily: fontFamily.body, 
        color: colors.text || '#000000',
        backgroundColor: colors.background || '#FFFFFF',
      }}
    >
      {/* Header */}
      <header className="mb-6 pb-6 border-b-2" style={{ borderColor: colors.primary }}>
        <h1 
          className="text-4xl font-bold mb-2" 
          style={{ fontFamily: fontFamily.heading, color: colors.primary }}
        >
          {data.personalInfo.fullName}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: colors.secondary }}>
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: colors.primary }}>
          {data.personalInfo.linkedin && (
            <a href={data.personalInfo.linkedin} className="hover:underline">
              LinkedIn
            </a>
          )}
          {data.personalInfo.github && (
            <a href={data.personalInfo.github} className="hover:underline">
              GitHub
            </a>
          )}
          {data.personalInfo.portfolio && (
            <a href={data.personalInfo.portfolio} className="hover:underline">
              Portfolio
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Skills
          </h2>
          {data.skills.map((skillGroup, idx) => (
            <div key={idx} className="mb-2">
              <span className="font-semibold text-sm">{skillGroup.category}: </span>
              <span className="text-sm">{skillGroup.items.join(', ')}</span>
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Professional Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-semibold text-base">{exp.title}</h3>
                  <p className="text-sm" style={{ color: colors.secondary }}>
                    {exp.company} | {exp.location}
                  </p>
                </div>
                <span className="text-sm whitespace-nowrap" style={{ color: colors.secondary }}>
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {exp.achievements.map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Projects
          </h2>
          {data.projects.map((project, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-base">{project.name}</h3>
                {project.link && (
                  <a 
                    href={project.link} 
                    className="text-sm hover:underline"
                    style={{ color: colors.primary }}
                  >
                    View Project
                  </a>
                )}
              </div>
              <p className="text-sm mb-1">{project.description}</p>
              <p className="text-xs mb-2" style={{ color: colors.secondary }}>
                <span className="font-semibold">Technologies:</span> {project.technologies.join(', ')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {project.achievements.map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-base">{edu.degree}</h3>
                  <p className="text-sm" style={{ color: colors.secondary }}>
                    {edu.institution} | {edu.location}
                  </p>
                  {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                  {edu.honors && edu.honors.length > 0 && (
                    <p className="text-sm">{edu.honors.join(', ')}</p>
                  )}
                </div>
                <span className="text-sm whitespace-nowrap" style={{ color: colors.secondary }}>
                  {edu.graduationDate}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Certifications
          </h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-2">
              <h3 className="font-semibold text-sm">{cert.name}</h3>
              <p className="text-sm" style={{ color: colors.secondary }}>
                {cert.issuer} | {cert.date}
                {cert.credentialId && ` | ID: ${cert.credentialId}`}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Awards */}
      {data.awards && data.awards.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Awards & Recognition
          </h2>
          {data.awards.map((award, idx) => (
            <div key={idx} className="mb-2">
              <h3 className="font-semibold text-sm">{award.title}</h3>
              <p className="text-sm" style={{ color: colors.secondary }}>
                {award.issuer} | {award.date}
              </p>
              {award.description && <p className="text-sm">{award.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 
            className="text-2xl font-semibold mb-3" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Languages
          </h2>
          <div className="flex flex-wrap gap-4">
            {data.languages.map((lang, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-semibold">{lang.language}:</span> {lang.proficiency}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
