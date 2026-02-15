import React from 'react';
import { ResumeData, ColorScheme, FontPairing } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TemplateProps {
  data: ResumeData;
  colorScheme?: ColorScheme;
  fonts?: FontPairing;
  className?: string;
}

// Professional Two Column Template
export function TwoColumnTemplate({ data, colorScheme, fonts, className }: TemplateProps) {
  const colors = colorScheme || {
    primary: '#2C3E50',
    secondary: '#34495E',
    accent: '#ECF0F1',
    text: '#000000',
    background: '#FFFFFF',
  };

  const fontFamily = fonts || {
    heading: 'Roboto, sans-serif',
    body: 'Open Sans, sans-serif',
  };

  return (
    <div
      className={cn('resume-template bg-white max-w-5xl mx-auto flex', className)}
      style={{ 
        fontFamily: fontFamily.body, 
        color: colors.text || '#000000',
      }}
    >
      {/* Left Sidebar - 35% */}
      <aside 
        className="w-[35%] p-6" 
        style={{ backgroundColor: colors.accent }}
      >
        {/* Contact Info */}
        <section className="mb-6">
          <h2 
            className="text-lg font-semibold mb-3 uppercase tracking-wide" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            Contact
          </h2>
          <div className="space-y-2 text-xs">
            {data.personalInfo.email && (
              <div className="break-words">{data.personalInfo.email}</div>
            )}
            {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
            {data.personalInfo.location && <div>{data.personalInfo.location}</div>}
          </div>
        </section>

        {/* Links */}
        {(data.personalInfo.linkedin || data.personalInfo.github || data.personalInfo.portfolio) && (
          <section className="mb-6">
            <h2 
              className="text-lg font-semibold mb-3 uppercase tracking-wide" 
              style={{ fontFamily: fontFamily.heading, color: colors.primary }}
            >
              Links
            </h2>
            <div className="space-y-2 text-xs">
              {data.personalInfo.linkedin && (
                <div className="break-words">
                  <a href={data.personalInfo.linkedin} className="hover:underline">
                    LinkedIn
                  </a>
                </div>
              )}
              {data.personalInfo.github && (
                <div className="break-words">
                  <a href={data.personalInfo.github} className="hover:underline">
                    GitHub
                  </a>
                </div>
              )}
              {data.personalInfo.portfolio && (
                <div className="break-words">
                  <a href={data.personalInfo.portfolio} className="hover:underline">
                    Portfolio
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-lg font-semibold mb-3 uppercase tracking-wide" 
              style={{ fontFamily: fontFamily.heading, color: colors.primary }}
            >
              Skills
            </h2>
            {data.skills.map((skillGroup, idx) => (
              <div key={idx} className="mb-3">
                <h3 className="font-semibold text-xs mb-1">{skillGroup.category}</h3>
                <div className="text-xs space-y-1">
                  {skillGroup.items.map((skill, i) => (
                    <div key={i}>• {skill}</div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-lg font-semibold mb-3 uppercase tracking-wide" 
              style={{ fontFamily: fontFamily.heading, color: colors.primary }}
            >
              Education
            </h2>
            {data.education.map((edu, idx) => (
              <div key={idx} className="mb-3 text-xs">
                <h3 className="font-semibold">{edu.degree}</h3>
                <p className="mt-1">{edu.institution}</p>
                <p>{edu.graduationDate}</p>
                {edu.gpa && <p>GPA: {edu.gpa}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-lg font-semibold mb-3 uppercase tracking-wide" 
              style={{ fontFamily: fontFamily.heading, color: colors.primary }}
            >
              Certifications
            </h2>
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="mb-2 text-xs">
                <h3 className="font-semibold">{cert.name}</h3>
                <p className="mt-1">{cert.issuer}</p>
                <p>{cert.date}</p>
              </div>
            ))}
          </section>
        )}
      </aside>

      {/* Right Main Content - 65% */}
      <main className="w-[65%] p-6" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <header className="mb-6">
          <h1 
            className="text-3xl font-bold mb-2" 
            style={{ fontFamily: fontFamily.heading, color: colors.primary }}
          >
            {data.personalInfo.fullName}
          </h1>
          {data.summary && (
            <p className="text-sm leading-relaxed mt-3">{data.summary}</p>
          )}
        </header>

        {/* Experience */}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-xl font-semibold mb-4 uppercase tracking-wide pb-2 border-b-2" 
              style={{ 
                fontFamily: fontFamily.heading, 
                color: colors.primary,
                borderColor: colors.primary 
              }}
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
                  <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
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
              className="text-xl font-semibold mb-4 uppercase tracking-wide pb-2 border-b-2" 
              style={{ 
                fontFamily: fontFamily.heading, 
                color: colors.primary,
                borderColor: colors.primary 
              }}
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
                      className="text-xs hover:underline"
                      style={{ color: colors.primary }}
                    >
                      Link
                    </a>
                  )}
                </div>
                <p className="text-sm mb-1">{project.description}</p>
                <p className="text-xs mb-2" style={{ color: colors.secondary }}>
                  {project.technologies.join(' • ')}
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

        {/* Awards */}
        {data.awards && data.awards.length > 0 && (
          <section className="mb-6">
            <h2 
              className="text-xl font-semibold mb-4 uppercase tracking-wide pb-2 border-b-2" 
              style={{ 
                fontFamily: fontFamily.heading, 
                color: colors.primary,
                borderColor: colors.primary 
              }}
            >
              Awards & Recognition
            </h2>
            {data.awards.map((award, idx) => (
              <div key={idx} className="mb-2">
                <h3 className="font-semibold text-sm">{award.title}</h3>
                <p className="text-xs" style={{ color: colors.secondary }}>
                  {award.issuer} | {award.date}
                </p>
                {award.description && <p className="text-sm mt-1">{award.description}</p>}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
