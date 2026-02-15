'use client';

import React from 'react';
import { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Award, Languages } from 'lucide-react';

interface ModernTemplateProps {
  resumeData: ResumeData;
}

export function ModernTemplate({ resumeData }: ModernTemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, awards, languages } = resumeData;

  // Enhanced color scheme with modern gradients
  const colors = {
    primary: '#3B82F6',    // Blue
    secondary: '#1E40AF',  // Dark Blue
    accent: '#60A5FA',     // Light Blue
    sidebar: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    text: '#1F2937',
    cardBg: '#ffffff',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  return (
    <div className="resume-template template-modern grid grid-cols-[35%_65%] min-h-[297mm] font-sans template-fade-in" 
         style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Enhanced Left Sidebar */}
      <aside className="template-sidebar relative overflow-hidden" 
             style={{ 
               background: colors.sidebar,
               padding: '2rem 1.5rem',
               position: 'relative'
             }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '100px',
          height: '100px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '50%',
          transform: 'translate(30px, -30px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '-20px',
          width: '60px',
          height: '60px',
          background: 'rgba(96, 165, 250, 0.15)',
          borderRadius: '50%'
        }} />
        {/* Enhanced Contact Information */}
        <div style={{ 
          marginBottom: '2rem',
          background: colors.cardBg,
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: colors.shadow,
          position: 'relative',
          zIndex: 10
        }}>
          <h2 style={{ 
            fontSize: '1rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '1rem',
            color: colors.primary,
            textAlign: 'center',
            paddingBottom: '0.5rem',
            borderBottom: `2px solid ${colors.primary}`
          }}>
            Contact
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {personalInfo.email && (
              <div className="template-contact-item" style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                background: 'rgba(59, 130, 246, 0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ 
                  background: colors.primary,
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mail className="h-3 w-3" style={{ color: 'white' }} />
                </div>
                <span style={{ 
                  color: colors.text,
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  wordBreak: 'break-all'
                }}>
                  {personalInfo.email}
                </span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="template-contact-item" style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                background: 'rgba(59, 130, 246, 0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ 
                  background: colors.primary,
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Phone className="h-3 w-3" style={{ color: 'white' }} />
                </div>
                <span style={{ 
                  color: colors.text,
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {personalInfo.phone}
                </span>
              </div>
            )}
            {personalInfo.location && (
              <div className="template-contact-item" style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                background: 'rgba(59, 130, 246, 0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ 
                  background: colors.primary,
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin className="h-3 w-3" style={{ color: 'white' }} />
                </div>
                <span style={{ 
                  color: colors.text,
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {personalInfo.location}
                </span>
              </div>
            )}
            {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) && (
              <div style={{ 
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                {personalInfo.linkedin && (
                  <div className="template-contact-item" style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.05)'
                  }}>
                    <div style={{ 
                      background: colors.primary,
                      padding: '0.375rem',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Linkedin className="h-3 w-3" style={{ color: 'white' }} />
                    </div>
                    <span style={{ 
                      color: colors.text,
                      fontSize: '0.625rem',
                      fontWeight: '500',
                      wordBreak: 'break-all'
                    }}>
                      {personalInfo.linkedin}
                    </span>
                  </div>
                )}
                {personalInfo.github && (
                  <div className="template-contact-item" style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.05)'
                  }}>
                    <div style={{ 
                      background: colors.primary,
                      padding: '0.375rem',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Github className="h-3 w-3" style={{ color: 'white' }} />
                    </div>
                    <span style={{ 
                      color: colors.text,
                      fontSize: '0.625rem',
                      fontWeight: '500',
                      wordBreak: 'break-all'
                    }}>
                      {personalInfo.github}
                    </span>
                  </div>
                )}
                {personalInfo.portfolio && (
                  <div className="template-contact-item" style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.05)'
                  }}>
                    <div style={{ 
                      background: colors.primary,
                      padding: '0.375rem',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Globe className="h-3 w-3" style={{ color: 'white' }} />
                    </div>
                    <span style={{ 
                      color: colors.text,
                      fontSize: '0.625rem',
                      fontWeight: '500',
                      wordBreak: 'break-all'
                    }}>
                      {personalInfo.portfolio}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Skills */}
        {skills.length > 0 && (
          <div style={{ 
            marginBottom: '2rem',
            background: colors.cardBg,
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: colors.shadow,
            position: 'relative'
          }}>
            <h2 style={{ 
              fontSize: '1rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
              color: colors.primary,
              textAlign: 'center',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${colors.primary}`
            }}>
              Skills
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {skills.map((skillGroup, index) => (
                <div key={index} style={{ 
                  background: 'rgba(59, 130, 246, 0.03)',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <h3 style={{ 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: colors.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {skillGroup.category}
                  </h3>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {skillGroup.items.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{ 
                          fontSize: '0.625rem',
                          fontWeight: '500',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}20)`,
                          color: colors.text,
                          border: `1px solid ${colors.primary}30`,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <span style={{ position: 'relative', zIndex: 2 }}>
                          {skill}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Education */}
        {education.length > 0 && (
          <div style={{ 
            marginBottom: '2rem',
            background: colors.cardBg,
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: colors.shadow
          }}>
            <h2 style={{ 
              fontSize: '1rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
              color: colors.primary,
              textAlign: 'center',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${colors.primary}`
            }}>
              Education
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {education.map((edu, index) => (
                <div key={index} style={{ 
                  background: 'rgba(59, 130, 246, 0.03)',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  position: 'relative'
                }}>
                  <div style={{ 
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    background: colors.primary
                  }} />
                  <h3 style={{ 
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: colors.secondary,
                    marginBottom: '0.25rem'
                  }}>
                    {edu.degree}
                  </h3>
                  <p style={{ 
                    fontSize: '0.7rem',
                    color: colors.text,
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    {edu.institution}
                  </p>
                  <p style={{ 
                    fontSize: '0.65rem',
                    color: colors.text,
                    opacity: 0.8
                  }}>
                    {edu.graduationDate}
                  </p>
                  {edu.gpa && (
                    <p style={{ 
                      fontSize: '0.65rem',
                      color: colors.primary,
                      fontWeight: '600',
                      marginTop: '0.5rem'
                    }}>
                      GPA: {edu.gpa}
                    </p>
                  )}
                  {edu.honors && edu.honors.length > 0 && (
                    <div style={{ 
                      marginTop: '0.75rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.25rem'
                    }}>
                      {edu.honors.map((honor, idx) => (
                        <span
                          key={idx}
                          style={{ 
                            fontSize: '0.55rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            background: `linear-gradient(135deg, ${colors.accent}30, ${colors.primary}20)`,
                            color: colors.text,
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {honor}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: colors.primary }}>
              Languages
            </h2>
            {languages.map((lang, index) => (
              <div key={index} className="mb-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: colors.text }}>{lang.language}</span>
                <span className="text-xs" style={{ color: colors.secondary }}>{lang.proficiency}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: colors.primary }}>
              Certifications
            </h2>
            {certifications.map((cert, index) => (
              <div key={index} className="mb-3">
                <h3 className="text-xs font-semibold" style={{ color: colors.secondary }}>
                  {cert.name}
                </h3>
                <p className="text-xs" style={{ color: colors.text }}>{cert.issuer}</p>
                <p className="text-xs" style={{ color: colors.text }}>{cert.date}</p>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Right Column - Enhanced Main Content */}
      <main style={{ 
        paddingRight: '3rem',
        paddingLeft: '2rem', 
        paddingTop: '3rem',
        paddingBottom: '3rem',
        position: 'relative'
      }}>
        {/* Enhanced Header with Modern Design */}
        <header style={{ 
          marginBottom: '2.5rem',
          position: 'relative',
          background: `linear-gradient(135deg, ${colors.primary}08, ${colors.accent}05)`,
          padding: '2rem',
          borderRadius: '1.5rem',
          border: `1px solid ${colors.primary}20`,
          overflow: 'hidden'
        }}>
          {/* Decorative Elements */}
          <div style={{ 
            position: 'absolute',
            top: '-1rem',
            right: '-1rem',
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}20)`,
            opacity: 0.6
          }} />
          <div style={{ 
            position: 'absolute',
            bottom: '-0.5rem',
            left: '-0.5rem',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.accent}30, ${colors.primary}30)`,
            opacity: 0.4
          }} />
          
          <h1 style={{ 
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            position: 'relative',
            zIndex: 2,
            lineHeight: 1.2
          }}>
            {personalInfo.fullName}
          </h1>
          
          {/* Decorative underline */}
          <div style={{ 
            width: '4rem',
            height: '0.25rem',
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
            borderRadius: '0.125rem',
            marginTop: '0.5rem'
          }} />
        </header>

        {/* Enhanced Professional Summary */}
        {summary && (
          <section style={{ 
            marginBottom: '2.5rem',
            background: colors.cardBg,
            padding: '2rem',
            borderRadius: '1.25rem',
            boxShadow: colors.shadow,
            position: 'relative',
            border: `1px solid ${colors.primary}15`
          }}>
            <div style={{ 
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '0.75rem',
              height: '0.75rem',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              opacity: 0.7
            }} />
            
            <h2 style={{ 
              fontSize: '1.25rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1.5rem',
              color: colors.primary,
              position: 'relative',
              paddingBottom: '0.75rem'
            }}>
              Professional Summary
              <div style={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '3rem',
                height: '0.1875rem',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
                borderRadius: '0.09375rem'
              }} />
            </h2>
            
            <p style={{ 
              fontSize: '0.875rem',
              lineHeight: 1.7,
              color: colors.text,
              textAlign: 'justify',
              position: 'relative',
              paddingLeft: '1rem',
              borderLeft: `3px solid ${colors.primary}30`
            }}>
              {summary}
            </p>
          </section>
        )}

        {/* Enhanced Professional Experience */}
        {experience.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ 
              fontSize: '1.25rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '2rem',
              color: colors.primary,
              position: 'relative',
              paddingBottom: '0.75rem'
            }}>
              Professional Experience
              <div style={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '4rem',
                height: '0.1875rem',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
                borderRadius: '0.09375rem'
              }} />
            </h2>
            
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              position: 'relative'
            }}>
              {/* Timeline line */}
              <div style={{ 
                position: 'absolute',
                left: '1rem',
                top: '1rem',
                bottom: '1rem',
                width: '2px',
                background: `linear-gradient(180deg, ${colors.primary}60, ${colors.accent}30)`,
                borderRadius: '1px'
              }} />
              
              {experience.map((exp, index) => (
                <div key={index} style={{ 
                  background: colors.cardBg,
                  padding: '1.5rem',
                  paddingLeft: '3rem',
                  borderRadius: '1rem',
                  boxShadow: colors.shadow,
                  position: 'relative',
                  border: `1px solid ${colors.primary}15`,
                  marginLeft: '1rem'
                }}>
                  {/* Timeline dot */}
                  <div style={{ 
                    position: 'absolute',
                    left: '-2.25rem',
                    top: '1.5rem',
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    zIndex: 2
                  }} />
                  
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <h3 style={{ 
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: colors.secondary,
                      margin: 0
                    }}>
                      {exp.title}
                    </h3>
                    <span style={{ 
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: colors.primary,
                      background: `${colors.primary}15`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.5rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <p style={{ 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: colors.text,
                      margin: 0
                    }}>
                      {exp.company}
                    </p>
                    {exp.location && (
                      <span style={{ 
                        fontSize: '0.75rem',
                        color: colors.text,
                        opacity: 0.8,
                        fontStyle: 'italic'
                      }}>
                        {exp.location}
                      </span>
                    )}
                  </div>
                  
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul style={{ 
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {exp.achievements.map((achievement, idx) => (
                        <li key={idx} style={{ 
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem'
                        }}>
                          <span style={{ 
                            color: colors.primary,
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            marginTop: '0.125rem',
                            flexShrink: 0
                          }}>
                            ▸
                          </span>
                          <span style={{ 
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                            color: colors.text
                          }}>
                            {achievement}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-4 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
              Projects
            </h2>
            {projects.map((project, index) => (
              <div key={index} className="mb-5">
                <h3 className="text-base font-bold mb-1" style={{ color: colors.secondary }}>
                  {project.name}
                </h3>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: colors.accent + '20', color: colors.text }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm mb-2" style={{ color: colors.text }}>
                  {project.description}
                </p>
                {project.achievements && project.achievements.length > 0 && (
                  <ul className="list-none space-y-1 ml-0">
                    {project.achievements.map((achievement, idx) => (
                      <li key={idx} className="text-sm flex items-start" style={{ color: colors.text }}>
                        <span className="mr-2" style={{ color: colors.primary }}>▪</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Awards */}
        {awards && awards.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-4 pb-2 border-b-2" style={{ color: colors.primary, borderColor: colors.primary }}>
              Awards & Honors
            </h2>
            {awards.map((award, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-bold" style={{ color: colors.secondary }}>
                    {award.title}
                  </h3>
                  <span className="text-xs" style={{ color: colors.text }}>{award.date}</span>
                </div>
                <p className="text-sm" style={{ color: colors.text }}>{award.issuer}</p>
                {award.description && (
                  <p className="text-xs mt-1" style={{ color: colors.text }}>{award.description}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
