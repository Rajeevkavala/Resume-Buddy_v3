'use client';

import React from 'react';
import { ResumeData } from '@/lib/types';

interface MinimalTemplateProps {
  resumeData: ResumeData;
}

export function MinimalTemplate({ resumeData }: MinimalTemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, awards, languages } = resumeData;

  // Refined minimal color scheme with enhanced contrast
  const colors = {
    text: '#0f0f0f',          // Deep black for maximum readability
    primary: '#2d3748',       // Charcoal for headings
    light: '#718096',         // Refined gray for secondary text
    accent: '#e2e8f0',        // Subtle background accent
    border: '#f1f5f9',        // Ultra-light border
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
  };

  return (
    <div style={{ 
      minHeight: '297mm',
      padding: '4rem 5rem',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      backgroundColor: '#ffffff',
      fontWeight: 300,
      lineHeight: 1.6
    }}>
      {/* Enhanced Minimal Header */}
      <header style={{ 
        textAlign: 'center',
        marginBottom: '4rem',
        position: 'relative',
        paddingBottom: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '3.5rem',
          marginBottom: '1rem',
          color: colors.text,
          fontWeight: 200,
          letterSpacing: '0.02em',
          lineHeight: 1.1,
          margin: 0
        }}>
          {personalInfo.fullName}
        </h1>
        
        {/* Elegant separator line */}
        <div style={{ 
          width: '4rem',
          height: '1px',
          backgroundColor: colors.primary,
          margin: '1.5rem auto',
          opacity: 0.6
        }} />
        
        <div style={{ 
          fontSize: '0.95rem',
          color: colors.light,
          fontWeight: 400,
          letterSpacing: '0.025em',
          marginBottom: '0.5rem'
        }}>
          {[
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
          ].filter(Boolean).join(' • ')}
        </div>
        
        {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio || personalInfo.website) && (
          <div style={{ 
            fontSize: '0.85rem',
            color: colors.light,
            fontWeight: 400,
            opacity: 0.8
          }}>
            {[
              personalInfo.linkedin && 'LinkedIn',
              personalInfo.github && 'GitHub',
              personalInfo.portfolio && 'Portfolio',
              personalInfo.website && 'Website'
            ].filter(Boolean).join(' • ')}
          </div>
        )}
        
        {/* Subtle decorative element */}
        <div style={{ 
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '2rem',
          background: `linear-gradient(to bottom, ${colors.primary}40, transparent)`,
          opacity: 0.3
        }} />
      </header>

      {/* Enhanced Professional Summary */}
      {summary && (
        <section style={{ 
          marginBottom: '4rem',
          position: 'relative'
        }}>
          <div style={{ 
            maxWidth: '42rem',
            margin: '0 auto',
            padding: '2rem',
            background: colors.cardBg,
            borderRadius: '0.5rem',
            boxShadow: colors.shadow,
            border: `1px solid ${colors.border}`,
            position: 'relative'
          }}>
            {/* Subtle corner accent */}
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1rem',
              height: '1rem',
              background: colors.accent,
              clipPath: 'polygon(0 0, 100% 0, 0 100%)'
            }} />
            
            <p style={{ 
              fontSize: '1rem',
              lineHeight: 1.8,
              textAlign: 'center',
              color: colors.text,
              fontWeight: 300,
              margin: 0,
              letterSpacing: '0.01em'
            }}>
              {summary}
            </p>
          </div>
        </section>
      )}

      {/* Enhanced Experience Section */}
      {experience.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ 
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            marginBottom: '2.5rem',
            color: colors.primary,
            fontWeight: 500,
            letterSpacing: '0.15em',
            textAlign: 'center',
            position: 'relative',
            paddingBottom: '0.75rem'
          }}>
            Experience
            <div style={{ 
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2rem',
              height: '1px',
              backgroundColor: colors.primary,
              opacity: 0.4
            }} />
          </h2>
          
          <div style={{ 
            maxWidth: '48rem',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem'
          }}>
            {experience.map((exp, index) => (
              <div key={index} style={{ 
                position: 'relative',
                padding: '2rem',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.375rem',
                boxShadow: colors.shadow
              }}>
                {/* Minimal side accent */}
                <div style={{ 
                  position: 'absolute',
                  left: 0,
                  top: '1.5rem',
                  width: '2px',
                  height: '2rem',
                  backgroundColor: colors.primary,
                  opacity: 0.3
                }} />
                
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ 
                    fontSize: '1.1rem',
                    marginBottom: '0.5rem',
                    color: colors.text,
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    margin: 0
                  }}>
                    {exp.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.9rem',
                    color: colors.light,
                    fontWeight: 400,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontWeight: 500 }}>{exp.company}</span>
                    <span style={{ opacity: 0.6 }}>•</span>
                    <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                    {exp.location && (
                      <>
                        <span style={{ opacity: 0.6 }}>•</span>
                        <span style={{ fontStyle: 'italic' }}>{exp.location}</span>
                      </>
                    )}
                  </p>
                </div>
                
                {exp.achievements && exp.achievements.length > 0 && (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginTop: '1.5rem'
                  }}>
                    {exp.achievements.map((achievement, idx) => (
                      <p key={idx} style={{ 
                        fontSize: '0.9rem',
                        lineHeight: 1.7,
                        color: colors.text,
                        fontWeight: 300,
                        margin: 0,
                        paddingLeft: '1rem',
                        position: 'relative'
                      }}>
                        <span style={{ 
                          position: 'absolute',
                          left: 0,
                          top: '0.6rem',
                          width: '3px',
                          height: '3px',
                          borderRadius: '50%',
                          backgroundColor: colors.primary,
                          opacity: 0.5
                        }} />
                        {achievement}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-16">
          <h2 
            className="text-sm uppercase mb-8" 
            style={{ 
              color: colors.text, 
              fontWeight: 400, 
              letterSpacing: '0.2em',
            }}
          >
            Projects
          </h2>
          {projects.map((project, index) => (
            <div key={index} className="mb-10">
              <h3 className="text-base mb-1" style={{ color: colors.text, fontWeight: 400 }}>
                {project.name}
              </h3>
              {project.technologies && project.technologies.length > 0 && (
                <p className="text-xs mb-2" style={{ color: colors.light, fontWeight: 300 }}>
                  {project.technologies.join(' · ')}
                </p>
              )}
              <p className="text-sm mb-3 leading-relaxed" style={{ color: colors.text, fontWeight: 300 }}>
                {project.description}
              </p>
              {project.achievements && project.achievements.length > 0 && (
                <div className="space-y-2">
                  {project.achievements.map((achievement, idx) => (
                    <p key={idx} className="text-sm leading-relaxed" style={{ color: colors.text, fontWeight: 300 }}>
                      {achievement}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-16">
          <h2 
            className="text-sm uppercase mb-8" 
            style={{ 
              color: colors.text, 
              fontWeight: 400, 
              letterSpacing: '0.2em',
            }}
          >
            Education
          </h2>
          {education.map((edu, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-base mb-1" style={{ color: colors.text, fontWeight: 400 }}>
                {edu.degree}
              </h3>
              <p className="text-sm" style={{ color: colors.light, fontWeight: 300 }}>
                {edu.institution} · {edu.graduationDate}
              </p>
              {edu.gpa && (
                <p className="text-sm mt-1" style={{ color: colors.light, fontWeight: 300 }}>
                  GPA: {edu.gpa}
                </p>
              )}
              {edu.honors && edu.honors.length > 0 && (
                <p className="text-xs mt-2" style={{ color: colors.light, fontWeight: 300 }}>
                  {edu.honors.join(' · ')}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-16">
          <h2 
            className="text-sm uppercase mb-8" 
            style={{ 
              color: colors.text, 
              fontWeight: 400, 
              letterSpacing: '0.2em',
            }}
          >
            Skills
          </h2>
          {skills.map((skillGroup, index) => (
            <div key={index} className="mb-4">
              <p className="text-sm" style={{ color: colors.text, fontWeight: 300 }}>
                {skillGroup.items.join(' · ')}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section className="mb-16">
          <h2 
            className="text-sm uppercase mb-8" 
            style={{ 
              color: colors.text, 
              fontWeight: 400, 
              letterSpacing: '0.2em',
            }}
          >
            Certifications
          </h2>
          {certifications.map((cert, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-sm" style={{ color: colors.text, fontWeight: 400 }}>
                {cert.name}
              </h3>
              <p className="text-xs" style={{ color: colors.light, fontWeight: 300 }}>
                {cert.issuer} · {cert.date}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <section className="mb-16">
          <h2 
            className="text-sm uppercase mb-8" 
            style={{ 
              color: colors.text, 
              fontWeight: 400, 
              letterSpacing: '0.2em',
            }}
          >
            Awards
          </h2>
          {awards.map((award, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-sm" style={{ color: colors.text, fontWeight: 400 }}>
                {award.title}
              </h3>
              <p className="text-xs" style={{ color: colors.light, fontWeight: 300 }}>
                {award.issuer} · {award.date}
              </p>
              {award.description && (
                <p className="text-xs mt-1" style={{ color: colors.light, fontWeight: 300 }}>
                  {award.description}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <section className="mb-16">
          <h2 
            className="text-sm uppercase mb-8" 
            style={{ 
              color: colors.text, 
              fontWeight: 400, 
              letterSpacing: '0.2em',
            }}
          >
            Languages
          </h2>
          <p className="text-sm" style={{ color: colors.text, fontWeight: 300 }}>
            {languages.map(lang => `${lang.language} (${lang.proficiency})`).join(' · ')}
          </p>
        </section>
      )}
    </div>
  );
}
