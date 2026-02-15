'use client';

import React from 'react';
import { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Terminal } from 'lucide-react';

interface TechTemplateProps {
  resumeData: ResumeData;
}

export function TechTemplate({ resumeData }: TechTemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, awards } = resumeData;

  // Enhanced tech color scheme with modern developer aesthetics  
  const colors = {
    primary: '#0EA5E9',      // Cyan - primary accent
    secondary: '#8B5CF6',    // Purple - secondary accent  
    accent: '#10B981',       // Green - success/highlight
    warning: '#F59E0B',      // Amber - warning/attention
    comment: '#6B7280',      // Gray - comments
    text: '#1F2937',         // Dark text
    lightText: '#9CA3AF',    // Light gray text
    border: '#E5E7EB',       // Light border
    codeBg: '#F8FAFC',       // Code background
    cardBg: '#FFFFFF',       // Card background
    darkBg: '#1E293B',       // Dark theme background
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  return (
    <div className="min-h-[297mm] px-12 py-12 font-mono text-sm" style={{ backgroundColor: '#ffffff' }}>
      {/* Enhanced Code-Style Header */}
      <header style={{ 
        marginBottom: '2.5rem',
        background: colors.codeBg,
        padding: '2rem',
        borderRadius: '0.75rem',
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow,
        position: 'relative',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace'
      }}>
        {/* Terminal-style header */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          paddingBottom: '0.75rem',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div style={{ 
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#EF4444'
          }} />
          <div style={{ 
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: colors.warning
          }} />
          <div style={{ 
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: colors.accent
          }} />
          <Terminal style={{ 
            width: '1rem',
            height: '1rem',
            color: colors.comment,
            marginLeft: '0.5rem'
          }} />
          <span style={{ 
            color: colors.comment,
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            developer_profile.tsx
          </span>
        </div>
        
        <div style={{ 
          color: colors.comment,
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {'/* =========================================='}
          <br />
          {'   Developer Profile - Software Engineer'}
          <br />
          {'========================================== */'}
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: colors.comment, fontSize: '0.875rem' }}>
            {'// Full Stack Developer Profile'}
          </div>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ color: colors.secondary, fontWeight: '600' }}>const</span>
            <span style={{ color: colors.accent, fontWeight: '600' }}>developer</span>
            <span style={{ color: colors.text }}>=</span>
            <span style={{ color: colors.primary, fontWeight: '600' }}>"{personalInfo.fullName}"</span>
            <span style={{ color: colors.text }}>;</span>
          </div>
        </div>
        
        <div style={{ 
          height: '2px',
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
          borderRadius: '1px',
          marginBottom: '1.5rem'
        }} />
        
        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {personalInfo.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" style={{ color: colors.primary }} />
              <span style={{ color: colors.text }}>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" style={{ color: colors.primary }} />
              <span style={{ color: colors.text }}>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" style={{ color: colors.primary }} />
              <span style={{ color: colors.text }}>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.github && (
            <div className="flex items-center gap-2">
              <Github className="h-3 w-3" style={{ color: colors.primary }} />
              <span style={{ color: colors.text }}>{personalInfo.github}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin className="h-3 w-3" style={{ color: colors.primary }} />
              <span style={{ color: colors.text }}>{personalInfo.linkedin}</span>
            </div>
          )}
          {personalInfo.portfolio && (
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3" style={{ color: colors.primary }} />
              <span style={{ color: colors.text }}>{personalInfo.portfolio}</span>
            </div>
          )}
        </div>
      </header>

      {/* Tech Stack */}
      {skills.length > 0 && (
        <section className="mb-8">
          <div className="mb-3" style={{ color: colors.comment }}>
            {'<TechStack>'}
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: colors.border, backgroundColor: colors.codeBg }}>
            {skills.map((skillGroup, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: colors.comment }}>├─</span>
                  <span className="font-semibold" style={{ color: colors.secondary }}>
                    {skillGroup.category}
                  </span>
                  <span style={{ color: colors.comment }}>{'─'.repeat(30 - skillGroup.category.length)}</span>
                </div>
                <div className="pl-6 flex flex-wrap gap-2">
                  {skillGroup.items.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: 'white',
                        color: colors.primary,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3" style={{ color: colors.comment }}>
            {'</TechStack>'}
          </div>
        </section>
      )}

      {/* Summary */}
      {summary && (
        <section className="mb-8">
          <div className="mb-3" style={{ color: colors.comment }}>
            {'/* Professional Summary */'}
          </div>
          <p className="leading-relaxed font-sans text-sm" style={{ color: colors.text }}>
            {summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <div className="mb-3" style={{ color: colors.comment }}>
            {'<Experience>'}
          </div>
          {experience.map((exp, index) => (
            <div 
              key={index} 
              className="border rounded-lg p-4 mb-4"
              style={{ borderColor: colors.border, backgroundColor: colors.codeBg }}
            >
              <div className="mb-3">
                <div style={{ color: colors.comment }}>
                  {'function '}
                  <span style={{ color: colors.accent }}>{exp.title.replace(/\s+/g, '')}</span>
                  {'() {'}
                </div>
              </div>
              
              <div className="pl-4 space-y-2 font-sans text-xs">
                <div>
                  <span style={{ color: colors.secondary }}>company</span>
                  <span style={{ color: colors.text }}>: </span>
                  <span style={{ color: colors.primary }}>"{exp.company}"</span>
                </div>
                <div>
                  <span style={{ color: colors.secondary }}>period</span>
                  <span style={{ color: colors.text }}>: </span>
                  <span style={{ color: colors.primary }}>
                    "{exp.startDate} - {exp.current ? 'Present' : exp.endDate}"
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.secondary }}>location</span>
                  <span style={{ color: colors.text }}>: </span>
                  <span style={{ color: colors.primary }}>"{exp.location}"</span>
                </div>
                
                {exp.achievements && exp.achievements.length > 0 && (
                  <div>
                    <span style={{ color: colors.secondary }}>achievements</span>
                    <span style={{ color: colors.text }}>: [</span>
                    <div className="pl-4 mt-2 space-y-2">
                      {exp.achievements.map((achievement, idx) => (
                        <div key={idx}>
                          <span style={{ color: colors.accent }}>"{achievement}"</span>
                          {idx < exp.achievements.length - 1 && <span style={{ color: colors.text }}>,</span>}
                        </div>
                      ))}
                    </div>
                    <span style={{ color: colors.text }}>]</span>
                  </div>
                )}
              </div>
              
              <div style={{ color: colors.comment }}>
                {'}'}
              </div>
            </div>
          ))}
          <div className="mt-3" style={{ color: colors.comment }}>
            {'</Experience>'}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-8">
          <div className="mb-3" style={{ color: colors.comment }}>
            {'<Projects>'}
          </div>
          {projects.map((project, index) => (
            <div 
              key={index} 
              className="border rounded-lg p-4 mb-4"
              style={{ borderColor: colors.border, backgroundColor: colors.codeBg }}
            >
              <h3 className="font-bold mb-2" style={{ color: colors.primary }}>
                {project.name}
              </h3>
              
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: 'white',
                        color: colors.secondary,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-xs font-sans mb-2" style={{ color: colors.text }}>
                {project.description}
              </p>
              
              {project.achievements && project.achievements.length > 0 && (
                <ul className="space-y-1 text-xs font-sans">
                  {project.achievements.map((achievement, idx) => (
                    <li key={idx} className="flex items-start" style={{ color: colors.text }}>
                      <span className="mr-2" style={{ color: colors.accent }}>▸</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="mt-3" style={{ color: colors.comment }}>
            {'</Projects>'}
          </div>
        </section>
      )}

      {/* Education, Certifications, Awards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Education */}
        {education.length > 0 && (
          <div>
            <div className="mb-2" style={{ color: colors.comment }}>
              {'// Education'}
            </div>
            {education.map((edu, index) => (
              <div key={index} className="mb-3 text-xs font-sans">
                <h3 className="font-semibold" style={{ color: colors.secondary }}>
                  {edu.degree}
                </h3>
                <p style={{ color: colors.text }}>{edu.institution}</p>
                <p style={{ color: colors.comment }}>{edu.graduationDate}</p>
                {edu.gpa && (
                  <p style={{ color: colors.comment }}>GPA: {edu.gpa}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <div>
            <div className="mb-2" style={{ color: colors.comment }}>
              {'// Certifications'}
            </div>
            {certifications.map((cert, index) => (
              <div key={index} className="mb-3 text-xs font-sans">
                <h3 className="font-semibold" style={{ color: colors.accent }}>
                  {cert.name}
                </h3>
                <p style={{ color: colors.text }}>{cert.issuer}</p>
                <p style={{ color: colors.comment }}>{cert.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
