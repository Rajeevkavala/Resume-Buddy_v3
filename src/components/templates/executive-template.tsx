'use client';

import React from 'react';
import { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

interface ExecutiveTemplateProps {
  resumeData: ResumeData;
}

export function ExecutiveTemplate({ resumeData }: ExecutiveTemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, awards, languages } = resumeData;

  // Sophisticated executive color scheme with enhanced luxury elements
  const colors = {
    primary: '#1e3a8a',      // Navy Blue - authority and trust
    secondary: '#374151',    // Charcoal - sophisticated neutrals
    accent: '#92400e',       // Burgundy - luxury accent
    gold: '#d97706',         // Gold - premium accent
    text: '#0f172a',         // Deep slate for maximum readability
    lightText: '#64748b',    // Refined gray for secondary text
    border: '#cbd5e1',       // Light border
    cardBg: '#ffffff',
    lightBg: '#f8fafc',      // Subtle background
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  return (
    <div className="min-h-[297mm] font-serif" style={{ backgroundColor: '#ffffff' }}>
      {/* Enhanced Executive Header */}
      <header style={{ 
        padding: '3rem 3rem 2rem 3rem',
        borderBottom: `3px solid ${colors.primary}`,
        background: `linear-gradient(135deg, ${colors.cardBg} 0%, ${colors.lightBg} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Luxury background pattern */}
        <div style={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          width: '12rem',
          height: '12rem',
          background: `linear-gradient(135deg, ${colors.primary}08, ${colors.gold}05)`,
          borderRadius: '50%',
          transform: 'translate(6rem, -6rem)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ 
            fontSize: '2.75rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: colors.primary,
            letterSpacing: '0.01em',
            fontFamily: '"Playfair Display", Georgia, serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.05)',
            margin: 0
          }}>
            {personalInfo.fullName}
          </h1>
          
          {/* Executive title line with gold accent */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              width: '3rem',
              height: '2px',
              background: `linear-gradient(90deg, ${colors.gold}, ${colors.accent})`,
              borderRadius: '1px'
            }} />
            <span style={{ 
              fontSize: '1.1rem',
              fontWeight: '500',
              color: colors.secondary,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Executive Profile
            </span>
          </div>
          
          {/* Executive Contact Information */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            {personalInfo.email && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.5rem',
                boxShadow: colors.shadow
              }}>
                <div style={{ 
                  padding: '0.375rem',
                  borderRadius: '0.375rem',
                  background: `${colors.primary}15`
                }}>
                  <Mail style={{ 
                    width: '1rem',
                    height: '1rem',
                    color: colors.primary
                  }} />
                </div>
                <span style={{ 
                  color: colors.text,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {personalInfo.email}
                </span>
              </div>
            )}
            {personalInfo.phone && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.5rem',
                boxShadow: colors.shadow
              }}>
                <div style={{ 
                  padding: '0.375rem',
                  borderRadius: '0.375rem',
                  background: `${colors.gold}15`
                }}>
                  <Phone style={{ 
                    width: '1rem',
                    height: '1rem',
                    color: colors.gold
                  }} />
                </div>
                <span style={{ 
                  color: colors.text,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {personalInfo.phone}
                </span>
              </div>
            )}
            {personalInfo.location && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.5rem',
                boxShadow: colors.shadow
              }}>
                <div style={{ 
                  padding: '0.375rem',
                  borderRadius: '0.375rem',
                  background: `${colors.accent}15`
                }}>
                  <MapPin style={{ 
                    width: '1rem',
                    height: '1rem',
                    color: colors.accent
                  }} />
                </div>
                <span style={{ 
                  color: colors.text,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {personalInfo.location}
                </span>
              </div>
            )}
            {(personalInfo.linkedin || personalInfo.portfolio || personalInfo.website) && (
              <div style={{ 
                gridColumn: '1 / -1',
                display: 'flex',
                gap: '1rem',
                marginTop: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {personalInfo.linkedin && (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: `${colors.primary}10`,
                    borderRadius: '0.5rem',
                    border: `1px solid ${colors.primary}20`
                  }}>
                    <Linkedin style={{ 
                      width: '0.875rem',
                      height: '0.875rem',
                      color: colors.primary
                    }} />
                    <span style={{ 
                      color: colors.text,
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      LinkedIn
                    </span>
                  </div>
                )}
                {(personalInfo.portfolio || personalInfo.website) && (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: `${colors.gold}10`,
                    borderRadius: '0.5rem',
                    border: `1px solid ${colors.gold}20`
                  }}>
                    <Globe style={{ 
                      width: '0.875rem',
                      height: '0.875rem',
                      color: colors.gold
                    }} />
                    <span style={{ 
                      color: colors.text,
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      Portfolio
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[35%_65%] gap-8 px-12 py-8">
        {/* Left Column */}
        <aside className="pr-6 border-r" style={{ borderColor: colors.border }}>
          {/* Executive Profile */}
          {summary && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase mb-3 tracking-wider" style={{ color: colors.primary }}>
                Executive Profile
              </h2>
              <p className="text-sm font-sans leading-relaxed" style={{ color: colors.text }}>
                {summary}
              </p>
            </section>
          )}

          {/* Core Competencies */}
          {skills.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase mb-3 tracking-wider" style={{ color: colors.primary }}>
                Core Competencies
              </h2>
              <ul className="space-y-2 font-sans">
                {skills.flatMap(group => group.items).map((skill, index) => (
                  <li key={index} className="text-sm flex items-start" style={{ color: colors.text }}>
                    <span className="mr-2" style={{ color: colors.accent }}>▪</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase mb-3 tracking-wider" style={{ color: colors.primary }}>
                Education
              </h2>
              {education.map((edu, index) => (
                <div key={index} className="mb-4 font-sans">
                  <h3 className="text-sm font-bold" style={{ color: colors.secondary }}>
                    {edu.degree}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: colors.text }}>
                    {edu.institution}
                  </p>
                  <p className="text-xs" style={{ color: colors.lightText }}>
                    {edu.graduationDate}
                  </p>
                  {edu.gpa && (
                    <p className="text-xs mt-1" style={{ color: colors.lightText }}>
                      GPA: {edu.gpa}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Professional Certifications */}
          {certifications && certifications.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase mb-3 tracking-wider" style={{ color: colors.primary }}>
                Certifications
              </h2>
              {certifications.map((cert, index) => (
                <div key={index} className="mb-3 font-sans">
                  <h3 className="text-xs font-bold" style={{ color: colors.secondary }}>
                    {cert.name}
                  </h3>
                  <p className="text-xs" style={{ color: colors.lightText }}>
                    {cert.issuer}, {cert.date}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* Board Memberships / Awards */}
          {awards && awards.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase mb-3 tracking-wider" style={{ color: colors.primary }}>
                Honors & Awards
              </h2>
              {awards.map((award, index) => (
                <div key={index} className="mb-3 font-sans">
                  <h3 className="text-xs font-bold" style={{ color: colors.secondary }}>
                    {award.title}
                  </h3>
                  <p className="text-xs" style={{ color: colors.lightText }}>
                    {award.issuer}, {award.date}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase mb-3 tracking-wider" style={{ color: colors.primary }}>
                Languages
              </h2>
              {languages.map((lang, index) => (
                <div key={index} className="text-xs mb-2 font-sans" style={{ color: colors.text }}>
                  <span className="font-semibold">{lang.language}</span>
                  <span style={{ color: colors.lightText }}> – {lang.proficiency}</span>
                </div>
              ))}
            </section>
          )}
        </aside>

        {/* Right Column - Experience */}
        <main className="pl-6">
          {experience.length > 0 && (
            <section>
              <h2 className="text-lg font-bold uppercase mb-6 tracking-wider" style={{ color: colors.primary }}>
                Leadership Experience
              </h2>
              {experience.map((exp, index) => (
                <div key={index} className="mb-8">
                  <div className="mb-2">
                    <h3 className="text-base font-bold" style={{ color: colors.secondary }}>
                      {exp.title}
                    </h3>
                    <div className="flex justify-between items-baseline mt-1">
                      <p className="text-sm font-semibold font-sans" style={{ color: colors.accent }}>
                        {exp.company}
                      </p>
                      <span className="text-xs font-sans" style={{ color: colors.lightText }}>
                        {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-xs font-sans mt-1" style={{ color: colors.lightText }}>
                      {exp.location}
                    </p>
                  </div>
                  
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-bold uppercase mb-2 font-sans tracking-wider" style={{ color: colors.secondary }}>
                        Key Achievements:
                      </h4>
                      <ul className="space-y-2 font-sans">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-sm flex items-start leading-relaxed" style={{ color: colors.text }}>
                            <span className="mr-2 mt-1" style={{ color: colors.accent }}>▪</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Notable Projects */}
          {projects && projects.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold uppercase mb-6 tracking-wider" style={{ color: colors.primary }}>
                Strategic Initiatives
              </h2>
              {projects.map((project, index) => (
                <div key={index} className="mb-6">
                  <h3 className="text-base font-bold" style={{ color: colors.secondary }}>
                    {project.name}
                  </h3>
                  <p className="text-sm font-sans mt-2 leading-relaxed" style={{ color: colors.text }}>
                    {project.description}
                  </p>
                  {project.achievements && project.achievements.length > 0 && (
                    <ul className="mt-2 space-y-1 font-sans">
                      {project.achievements.map((achievement, idx) => (
                        <li key={idx} className="text-sm flex items-start" style={{ color: colors.text }}>
                          <span className="mr-2" style={{ color: colors.accent }}>▪</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
