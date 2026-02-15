'use client';

import React, { useMemo, useState } from 'react';
import { ResumeData } from '@/lib/types';
import type { LatexTemplateId } from '@/lib/latex-templates';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Download, FileText, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { compileLatexFromResumeDataAction } from '@/app/actions';
import { LatexExportDialog } from '@/components/latex-export-dialog';

// Lazy import heavy PDF libraries only when export is triggered
const loadExportUtils = () => import('@/lib/resume-export');

// Direct PDF generation function - lazy loaded
const generateDirectPDF = async (resumeData: ResumeData, filename: string) => {
  const { jsPDF } = await import('jspdf');
  console.log('📝 Generating PDF from resume data...');
  console.log('Resume data:', resumeData);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Validate resume data
  if (!resumeData) {
    doc.setFontSize(12);
    doc.text('Error: No resume data available', margin, yPos);
    doc.save('resume.pdf');
    return;
  }

  const addText = (text: string, fontSize: number = 11, isBold: boolean = false, color: string = '#000000') => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    const lineHeight = fontSize * 0.5;
    const totalHeight = lines.length * lineHeight;
    
    if (yPos + totalHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
    
    lines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
    
    return yPos;
  };

  const addSection = (title: string) => {
    yPos += 5; // Add space before section
    addText(title.toUpperCase(), 14, true, '#1a73e8');
    yPos += 3; // Add space after section title
  };

  try {
    // Header - Personal Information
    if (resumeData.personalInfo) {
      const { fullName, email, phone, location, linkedin, github, website } = resumeData.personalInfo;
      
      // Name
      addText(fullName || 'Your Name', 18, true, '#1a1a1a');
      yPos += 2;
      
      // Contact Info
      const contactInfo = [];
      if (email) contactInfo.push(`Email: ${email}`);
      if (phone) contactInfo.push(`Phone: ${phone}`);
      if (location) contactInfo.push(`Location: ${location}`);
      
      if (contactInfo.length > 0) {
        addText(contactInfo.join(' | '), 10, false, '#666666');
      }
      
      // Links
      const links = [];
      if (linkedin) links.push(`LinkedIn: ${linkedin}`);
      if (github) links.push(`GitHub: ${github}`);
      if (website) links.push(`Website: ${website}`);
      
      if (links.length > 0) {
        addText(links.join(' | '), 10, false, '#666666');
      }
      
      yPos += 5;
    }

    // Professional Summary
    if (resumeData.summary) {
      addSection('Professional Summary');
      addText(resumeData.summary);
      yPos += 5;
    }

    // Skills - New compact format
    if (resumeData.skills && resumeData.skills.length > 0) {
      addSection('Technical Skills');
      
      // Render each skill group on its own line for better readability
      resumeData.skills.forEach(group => {
        if (group.items && group.items.length > 0) {
          addText(`${group.category}: ${group.items.join(', ')}`, 10, false, '#333333');
        }
      });
      yPos += 3;
    }

    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      addSection('Professional Experience');
      
      resumeData.experience.forEach((exp, index) => {
        // Company and Position
        const title = `${exp.title} at ${exp.company}`;
        addText(title, 12, true, '#1a1a1a');
        
        // Duration and Location
        const duration = `${exp.startDate} - ${exp.endDate || 'Present'}`;
        const locationText = exp.location ? ` | ${exp.location}` : '';
        addText(duration + locationText, 10, false, '#666666');
        yPos += 1;
        
        // Achievements
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach(achievement => {
            addText(`• ${achievement}`, 10);
          });
        }
        
        if (index < resumeData.experience.length - 1) {
          yPos += 3; // Space between jobs
        }
      });
      yPos += 5;
    }

    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      addSection('Education');
      
      resumeData.education.forEach((edu, index) => {
        const title = `${edu.degree}${edu.major ? ` in ${edu.major}` : ''}`;
        const schoolInfo = `${edu.institution}, ${edu.location}`;
        const dateAndGpa = [edu.graduationDate, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join(' | ');
        
        addText(`${title} – ${schoolInfo} (${dateAndGpa})`, 10, false, '#333333');
        
        if (index < resumeData.education.length - 1) {
          yPos += 1;
        }
      });
      yPos += 3;
    }

    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      addSection('Certifications');
      
      const certs = resumeData.certifications;
      certs.forEach((cert, index) => {
        const certLine = `${cert.name} – ${cert.issuer} (${cert.date})`;
        addText(certLine, 10, false, '#333333');
        
        if (index < certs.length - 1) {
          yPos += 1;
        }
      });
      yPos += 3;
    }

    // Projects - Compact format (max 2-3 key projects)
    if (resumeData.projects && resumeData.projects.length > 0) {
      addSection('Key Projects');
      
      // Limit to top 3 projects for single-page format
      const topProjects = resumeData.projects.slice(0, 3);
      
      topProjects.forEach((project, index) => {
        // Project title with technologies in one line
        const titleLine = `${project.name} (${project.technologies.join(', ')})`;
        addText(titleLine, 11, true, '#1a1a1a');
        
        // Description (keep it to 1 line)
        if (project.description) {
          addText(project.description, 10, false, '#333333');
        }
        
        // Achievements (max 2 bullet points)
        if (project.achievements && project.achievements.length > 0) {
          const topAchievements = project.achievements.slice(0, 2);
          topAchievements.forEach(achievement => {
            addText(`• ${achievement}`, 10);
          });
        }
        
        if (project.link) {
          addText(`🔗 ${project.link}`, 9, false, '#1a73e8');
        }
        
        if (index < topProjects.length - 1) {
          yPos += 2;
        }
      });
      yPos += 3;
    }



    console.log('💾 Saving PDF...');
    doc.save(filename);
    console.log('✅ PDF saved successfully!');
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};

// Import template components
import { ProfessionalTemplate } from '@/components/templates/professional-template';
import { ModernTemplate } from '@/components/templates/modern-template';
import { MinimalTemplate } from '@/components/templates/minimal-template';
import { TechTemplate } from '@/components/templates/tech-template';
import { FaangTemplate } from '@/components/templates/faang-template';

// LaTeX Export Dialog Wrapper for Create Resume page
function LatexExportDialogWrapper({
  userId,
  resumeData,
  isExporting,
  setIsExporting,
}: {
  userId?: string;
  resumeData: any;
  isExporting: boolean;
  setIsExporting: (v: boolean) => void;
}) {
  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const base64ToUint8Array = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const handleExportLatex = async (filename: string, templateId: LatexTemplateId) => {
    if (!userId) {
      toast.error('Please log in to export LaTeX.');
      throw new Error('User not authenticated');
    }

    setIsExporting(true);
    try {
      const result = await compileLatexFromResumeDataAction({
        userId,
        templateId,
        resumeData,
      });

      const pdfBytes = base64ToUint8Array(result.pdfBase64);
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(pdfBlob, `${filename}.pdf`);

      toast.success('Resume PDF downloaded successfully!');
    } catch (error) {
      console.error('LaTeX export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export LaTeX. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <LatexExportDialog
      onExport={handleExportLatex}
      isExporting={isExporting}
      defaultFilename={resumeData?.personalInfo?.fullName ? `${resumeData.personalInfo.fullName}-Resume` : 'Resume'}
    >
      <Button
        variant="default"
        size="sm"
        disabled={isExporting}
        className="text-xs sm:text-sm px-2 sm:px-3"
      >
        <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
        <span className="hidden sm:inline">Export PDF</span>
        <span className="sm:hidden">PDF</span>
      </Button>
    </LatexExportDialog>
  );
}

interface ModernResumePreviewProps {
  resumeData: ResumeData;
  templateId: LatexTemplateId;
  userId?: string;
  className?: string;
}

export function ModernResumePreview({
  resumeData,
  templateId,
  userId,
  className = '',
}: ModernResumePreviewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(100);

  const normalizedResumeData = useMemo(() => {
    const asText = (value: unknown): string => {
      if (typeof value === 'string') return value;
      if (!value || typeof value !== 'object') return '';
      const v = value as Record<string, unknown>;
      if (typeof v.description === 'string') return v.description;
      if (typeof v.text === 'string') return v.text;
      if (typeof v.value === 'string') return v.value;
      return '';
    };

    const normalizeStringList = (list: unknown): string[] => {
      if (!Array.isArray(list)) return [];
      return list.map(asText).map((s) => s.trim()).filter(Boolean);
    };

    const next: any = { ...(resumeData as any) };

    if (Array.isArray(next.experience)) {
      next.experience = next.experience.map((exp: any) => ({
        ...exp,
        achievements: normalizeStringList(exp?.achievements),
      }));
    }

    if (Array.isArray(next.projects)) {
      next.projects = next.projects.map((project: any) => ({
        ...project,
        achievements: normalizeStringList(project?.achievements),
      }));
    }

    return next as ResumeData;
  }, [resumeData]);
  
  const zoomLevels = [50, 75, 100, 125, 150];
  
  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };
  
  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      const rawName = resumeData.personalInfo?.fullName || 'Resume';
      const safeName = rawName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Resume';
      const filename = `${safeName}-Resume.pdf`;

      // Lazy load export utilities
      const { exportToPDF } = await loadExportUtils();
      // Export the exact visual template (HTML/CSS) so styles match the preview.
      await exportToPDF('resume-preview-container', filename);
      toast.success('PDF exported successfully!');
      
    } catch (error) {
      console.error('❌ Styled PDF export failed, falling back to text-based PDF:', error);
      try {
        const rawName = resumeData.personalInfo?.fullName || 'Resume';
        const safeName = rawName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Resume';
        await generateDirectPDF(resumeData, `${safeName}-Resume.pdf`);
        toast.success('PDF exported (fallback)');
      } catch (fallbackError) {
        console.error('❌ Fallback PDF export error:', fallbackError);
        toast.error(fallbackError instanceof Error ? fallbackError.message : 'Failed to export PDF. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
      // Lazy load export utilities
      const { exportToDOCX } = await loadExportUtils();
      await exportToDOCX(resumeData, `${resumeData.personalInfo.fullName}-Resume.docx`);
    } catch (error) {
      console.error('DOCX export error:', error);
      toast.error('Failed to export DOCX. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    // Lazy load export utilities
    const { printResume } = await loadExportUtils();
    printResume('resume-preview-container');
  };

  const renderTemplate = () => {
    const props = { resumeData: normalizedResumeData };
    
    // Map LaTeX template IDs to available preview components
    // Note: jake and deedy use professional template for preview
    switch (templateId) {
      case 'professional':
      case 'jake':
      case 'deedy':
        return <ProfessionalTemplate {...props} />;
      case 'modern':
        return <ModernTemplate {...props} />;
      case 'minimal':
        return <MinimalTemplate {...props} />;
      case 'tech':
        return <TechTemplate {...props} />;
      case 'faang':
        return <FaangTemplate {...props} />;
      default:
        return <ProfessionalTemplate {...props} />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            {/* Zoom Controls - Hidden on very small screens */}
            <div className="hidden md:flex items-center gap-2 border rounded-md p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
                disabled={zoom === zoomLevels[0]}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex gap-1">
                {zoomLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setZoom(level)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      zoom === level
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
                disabled={zoom === zoomLevels[zoomLevels.length - 1]}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isExporting}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <Printer className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <LatexExportDialogWrapper
                userId={userId}
                resumeData={normalizedResumeData}
                isExporting={isExporting}
                setIsExporting={setIsExporting}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDOCX}
                disabled={isExporting}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">DOCX</span>
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="preview" className="flex-1 overflow-auto">
          <div className="bg-gray-100 p-8 min-h-full flex justify-center">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-in-out',
                marginBottom: `${Math.max(0, (zoom - 100) * 3)}px`, // Add bottom margin for zoomed content
                marginTop: zoom < 100 ? '20px' : '0',
              }}
            >
              <div 
                id="resume-preview"
                className="bg-white shadow-lg resume-preview-container resume-container"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '0',
                  overflow: 'visible',
                  position: 'relative'
                }}
              >
                <div 
                  id="resume-preview-container" 
                  className="resume-container"
                  style={{ 
                    overflow: 'visible',
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {renderTemplate()}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
