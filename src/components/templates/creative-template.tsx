'use client';

import React from 'react';
import { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Palette, Star, Award, Target } from 'lucide-react';

interface CreativeTemplateProps {
  resumeData: ResumeData;
}

export function CreativeTemplate({ resumeData }: CreativeTemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, awards, languages } = resumeData;

  // Enhanced color scheme - vibrant and creative
  const colors = {
    primary: '#8B5CF6',      // Purple
    secondary: '#EC4899',    // Pink
    accent: '#F59E0B',       // Amber
    tertiary: '#10B981',     // Emerald
    text: '#1F2937',
    textLight: '#6B7280',
    lightBg: '#FAF5FF',
    cardBg: '#FFFFFF',
    shadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  };

  return (
    <div className="min-h-[297mm] font-sans" style={{ backgroundColor: '#ffffff' }}>
      {/* Enhanced Creative Header Banner */}
      <header 
        style={{ 
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
          borderRadius: '0 0 2rem 2rem',
          marginBottom: '2rem'
        }}
      >
        {/* Animated Background Elements */}
        <div style={{ 
          position: 'absolute',
          top: '-2rem',
          right: '-2rem',
          width: '8rem',
          height: '8rem',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{ 
          position: 'absolute',
          bottom: '-1rem',
          left: '10%',
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />
        <div style={{ 
          position: 'absolute',
          top: '2rem',
          left: '20%',
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          animation: 'float 4s ease-in-out infinite'
        }} />
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Creative Name Display */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <Palette style={{ 
              width: '3rem',
              height: '3rem',
              color: 'white',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }} />
            <h1 style={{ 
              fontSize: '3.5rem',
              fontWeight: '900',
              color: 'white',
              margin: 0,
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              {personalInfo.fullName}
            </h1>
          </div>
          
          {/* Creative Contact Info Grid */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            {personalInfo.email && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Mail style={{ 
                  width: '1rem',
                  height: '1rem',
                  color: 'white'
                }} />
                <span style={{ 
                  color: 'rgba(255, 255, 255, 0.95)',
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
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Phone style={{ 
                  width: '1rem',
                  height: '1rem',
                  color: 'white'
                }} />
                <span style={{ 
                  color: 'rgba(255, 255, 255, 0.95)',
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
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <MapPin style={{ 
                  width: '1rem',
                  height: '1rem',
                  color: 'white'
                }} />
                <span style={{ 
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {personalInfo.location}
                </span>
              </div>
            )}
            {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) && (
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
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Linkedin style={{ width: '0.875rem', height: '0.875rem', color: 'white' }} />
                    <span style={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      LinkedIn
                    </span>
                  </div>
                )}
                {personalInfo.github && (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Github style={{ width: '0.875rem', height: '0.875rem', color: 'white' }} />
                    <span style={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      GitHub
                    </span>
                  </div>
                )}
                {(personalInfo.portfolio || personalInfo.website) && (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Globe style={{ width: '0.875rem', height: '0.875rem', color: 'white' }} />
                    <span style={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
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
        
        {/* Decorative circle */}
        <div 
          className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full opacity-20"
          style={{ backgroundColor: 'white' }}
        />
      </header>

      {/* Add creative animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slideIn {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .creative-section {
          animation: slideIn 0.6s ease-out;
        }
        .creative-item:hover {
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
      `}</style>

      <div style={{ padding: '2rem 3rem' }}>
        {/* Enhanced About Me / Summary */}
        {summary && (
          <section className="creative-section" style={{ 
            marginBottom: '3rem',
            background: colors.cardBg,
            padding: '2rem',
            borderRadius: '1.5rem',
            boxShadow: colors.shadow,
            position: 'relative',
            overflow: 'hidden',
            border: `3px solid transparent`,
            backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box'
          }}>
            {/* Decorative elements */}
            <div style={{ 
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
              animation: 'pulse 3s ease-in-out infinite'
            }} />
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <Target style={{ 
                width: '2rem',
                height: '2rem',
                color: colors.primary,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }} />
              <h2 style={{ 
                fontSize: '1.75rem',
                fontWeight: '800',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: 0
              }}>
                About Me
              </h2>
              <div style={{ 
                flex: 1,
                height: '3px',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                borderRadius: '1.5px',
                marginLeft: '1rem',
                opacity: 0.7
              }} />
            </div>
            
            <p style={{ 
              fontSize: '0.95rem',
              lineHeight: 1.8,
              color: colors.text,
              textAlign: 'justify',
              position: 'relative',
              paddingLeft: '1.5rem',
              borderLeft: `4px solid ${colors.accent}`,
              marginLeft: '2rem'
            }}>
              {summary}
            </p>
          </section>
        )}

        {/* Enhanced Creative Skills */}
        {skills.length > 0 && (
          <section className="creative-section" style={{ marginBottom: '3rem' }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <Star style={{ 
                width: '2rem',
                height: '2rem',
                color: colors.secondary,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }} />
              <h2 style={{ 
                fontSize: '1.75rem',
                fontWeight: '800',
                background: `linear-gradient(135deg, ${colors.secondary}, ${colors.accent})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: 0
              }}>
                Skills & Expertise
              </h2>
              <div style={{ 
                flex: 1,
                height: '3px',
                background: `linear-gradient(90deg, ${colors.secondary}, ${colors.accent})`,
                borderRadius: '1.5px',
                marginLeft: '1rem',
                opacity: 0.7
              }} />
            </div>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {skills.map((skillGroup, index) => (
                <div 
                  key={index}
                  className="creative-item"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.cardBg}, ${colors.lightBg})`,
                    padding: '1.5rem',
                    borderRadius: '1.25rem',
                    boxShadow: colors.shadow,
                    position: 'relative',
                    overflow: 'hidden',
                    border: `2px solid transparent`,
                    backgroundImage: `linear-gradient(135deg, ${colors.cardBg}, ${colors.lightBg}), linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'content-box, border-box'
                  }}
                >
                  {/* Decorative corner */}
                  <div style={{ 
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '2rem',
                    height: '2rem',
                    background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`,
                    clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
                  }} />
                  
                  <h3 style={{ 
                    fontSize: '1rem',
                    fontWeight: '700',
                    marginBottom: '1rem',
                    color: colors.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    position: 'relative',
                    zIndex: 2
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
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '0.5rem 1rem',
                          borderRadius: '1rem',
                          background: `linear-gradient(135deg, ${colors.accent}20, ${colors.primary}15)`,
                          color: colors.text,
                          border: `1px solid ${colors.accent}30`,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.3s ease',
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
          </section>
        )}

        {/* Featured Work / Projects */}
        {projects && projects.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-1 rounded"
                style={{ backgroundColor: colors.accent }}
              />
              <h2 className="text-2xl font-bold" style={{ color: colors.accent }}>
                Featured Work
              </h2>
            </div>
            {projects.map((project, index) => (
              <div 
                key={index} 
                className="border-2 rounded-lg p-5 mb-4 ml-16"
                style={{ 
                  borderColor: colors.accent + '40',
                  backgroundColor: colors.lightBg + '40',
                }}
              >
                <h3 className="text-lg font-bold mb-2" style={{ color: colors.accent }}>
                  {project.name}
                </h3>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={{ 
                          backgroundColor: 'white',
                          color: colors.accent,
                          border: `1px solid ${colors.accent}40`,
                        }}
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
                  <ul className="space-y-1">
                    {project.achievements.map((achievement, idx) => (
                      <li key={idx} className="text-sm flex items-start" style={{ color: colors.text }}>
                        <span className="mr-2 font-bold" style={{ color: colors.accent }}>✦</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Experience Timeline */}
        {experience.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-1 rounded"
                style={{ backgroundColor: colors.primary }}
              />
              <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                Experience Timeline
              </h2>
            </div>
            <div className="pl-16 relative">
              {/* Timeline line */}
              <div 
                className="absolute left-8 top-0 bottom-0 w-0.5"
                style={{ backgroundColor: colors.primary + '40' }}
              />
              
              {experience.map((exp, index) => (
                <div key={index} className="mb-6 relative pl-8">
                  {/* Timeline dot */}
                  <div 
                    className="absolute left-6 top-2 w-4 h-4 rounded-full border-4 border-white"
                    style={{ backgroundColor: colors.primary }}
                  />
                  
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-bold" style={{ color: colors.primary }}>
                      {exp.title}
                    </h3>
                    <span className="text-xs font-semibold" style={{ color: colors.text }}>
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.secondary }}>
                    {exp.company} • {exp.location}
                  </p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {exp.achievements.map((achievement, idx) => (
                        <li key={idx} className="text-sm flex items-start" style={{ color: colors.text }}>
                          <span className="mr-2" style={{ color: colors.primary }}>▸</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education & Certifications Side by Side */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Education */}
          {education.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-8 h-1 rounded"
                  style={{ backgroundColor: colors.secondary }}
                />
                <h2 className="text-xl font-bold" style={{ color: colors.secondary }}>
                  Education
                </h2>
              </div>
              {education.map((edu, index) => (
                <div key={index} className="mb-4 pl-10">
                  <h3 className="text-sm font-bold" style={{ color: colors.secondary }}>
                    {edu.degree}
                  </h3>
                  <p className="text-sm" style={{ color: colors.text }}>{edu.institution}</p>
                  <p className="text-xs" style={{ color: colors.text }}>{edu.graduationDate}</p>
                  {edu.gpa && (
                    <p className="text-xs mt-1" style={{ color: colors.text }}>GPA: {edu.gpa}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Certifications & Awards */}
          {((certifications && certifications.length > 0) || (awards && awards.length > 0)) && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-8 h-1 rounded"
                  style={{ backgroundColor: colors.accent }}
                />
                <h2 className="text-xl font-bold" style={{ color: colors.accent }}>
                  Recognition
                </h2>
              </div>
              
              {certifications && certifications.map((cert, index) => (
                <div key={index} className="mb-3 pl-10">
                  <h3 className="text-sm font-bold" style={{ color: colors.accent }}>
                    {cert.name}
                  </h3>
                  <p className="text-xs" style={{ color: colors.text }}>
                    {cert.issuer} • {cert.date}
                  </p>
                </div>
              ))}
              
              {awards && awards.map((award, index) => (
                <div key={index} className="mb-3 pl-10">
                  <h3 className="text-sm font-bold" style={{ color: colors.accent }}>
                    {award.title}
                  </h3>
                  <p className="text-xs" style={{ color: colors.text }}>
                    {award.issuer} • {award.date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Languages */}
        {languages && languages.length > 0 && (
          <div className="pl-16">
            <h3 className="text-sm font-bold mb-2" style={{ color: colors.primary }}>
              Languages
            </h3>
            <div className="flex flex-wrap gap-3">
              {languages.map((lang, index) => (
                <span
                  key={index}
                  className="text-sm px-4 py-2 rounded-full font-medium"
                  style={{ 
                    backgroundColor: colors.lightBg,
                    color: colors.primary,
                  }}
                >
                  {lang.language} ({lang.proficiency})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
