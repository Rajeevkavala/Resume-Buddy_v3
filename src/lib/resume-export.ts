/**
 * Modern Resume Export Utilities
 * Direct PDF and DOCX export from HTML/CSS
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { ResumeData } from './types';

/**
 * Export resume to PDF using html2canvas + jsPDF
 * This captures the exact visual appearance
 */
export async function exportToPDF(
  elementId: string,
  filename: string = 'resume.pdf'
): Promise<void> {
  try {
    toast.loading('Generating PDF...', { id: 'pdf-export' });

    // Try multiple element selectors to find the resume content
    let element = document.getElementById(elementId);
    if (!element) {
      element = document.getElementById('resume-preview-container');
    }
    if (!element) {
      element = document.querySelector('.resume-preview-container') as HTMLElement;
    }
    if (!element) {
      element = document.querySelector('.resume-container') as HTMLElement;
    }
    if (!element) {
      element = document.querySelector('[id*="resume"]') as HTMLElement;
    }
    
    if (!element) {
      throw new Error('Resume element not found. Please refresh and try again.');
    }

    console.log('Found element for PDF export:', element);

    // CRITICAL: Remove any parent transforms that could interfere
    const parentElement = element.parentElement;
    const grandParentElement = parentElement?.parentElement;
    const originalParentTransform = parentElement?.style.transform;
    const originalGrandParentTransform = grandParentElement?.style.transform;
    
    // Store original styles to restore later
    const originalStyles = {
      display: element.style.display,
      overflow: element.style.overflow,
      maxHeight: element.style.maxHeight,
      transform: element.style.transform,
      width: element.style.width,
      height: element.style.height
    };
    
    // Prepare element for capture
    element.style.display = 'block';
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.transform = 'none'; // Remove any zoom transforms
    element.style.width = '210mm';
    
    // Remove parent transforms
    if (parentElement) parentElement.style.transform = 'none';
    if (grandParentElement) grandParentElement.style.transform = 'none';
    
    // Find and prepare the resume container
    const resumeContainer = element.querySelector('.resume-container') as HTMLElement || element;
    if (resumeContainer && resumeContainer !== element) {
      resumeContainer.style.height = 'auto';
      resumeContainer.style.minHeight = 'auto';
      resumeContainer.style.overflow = 'visible';
    }

    // Apply export preparation styles
    element.classList.add('preparing-export');

    // Collect link positions BEFORE capturing (for adding clickable PDF annotations)
    const linkData: Array<{ href: string; x: number; y: number; width: number; height: number }> = [];
    const elementRect = element.getBoundingClientRect();
    const links = element.querySelectorAll('a[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('mailto:'))) {
        const rect = link.getBoundingClientRect();
        linkData.push({
          href,
          x: rect.left - elementRect.left,
          y: rect.top - elementRect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    // Collect text content with positions for creating selectable/extractable text layer
    const textData: Array<{ text: string; x: number; y: number; fontSize: number; fontWeight: string }> = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (!text) continue;
      
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      if (rects.length === 0) continue;
      
      const parentEl = node.parentElement;
      if (!parentEl) continue;
      
      const computedStyle = window.getComputedStyle(parentEl);
      const fontSize = parseFloat(computedStyle.fontSize) || 12;
      const fontWeight = computedStyle.fontWeight;
      
      // Get the first rect for positioning
      const rect = rects[0];
      textData.push({
        text,
        x: rect.left - elementRect.left,
        y: rect.top - elementRect.top + fontSize * 0.8, // Adjust for baseline
        fontSize,
        fontWeight,
      });
    }

    // Wait for layout to settle and ensure all content is rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Wait for any dynamic content (like fonts or async components)
    await document.fonts.ready;
    
    // Additional wait for any animations or dynamic content to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('Element dimensions before capture:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      hasContent: element.textContent?.length || 0
    });

    // Final check that element has content
    if (!element.textContent?.trim()) {
      throw new Error('Resume content is empty. Please ensure the resume has loaded properly.');
    }
    
    // Capture the element as canvas with enhanced settings
    const canvas = await html2canvas(element, ({
      scale: 3, // Sharper text/styling for exported PDFs
      useCORS: true,
      logging: true, // Enable logging for debugging
      backgroundColor: '#ffffff',
      width: element.scrollWidth, // Capture full width
      height: element.scrollHeight, // Capture full height - no limits
      scrollY: 0,
      scrollX: 0,
      imageTimeout: 30000,
      removeContainer: false,
      allowTaint: false,
      // letterRendering can introduce spacing artifacts; prefer normal rendering
      letterRendering: false,
      foreignObjectRendering: false,
      ignoreElements: (element: Element) => {
        // Ignore any zoom controls or buttons
        return element.classList.contains('no-export') || 
               element.tagName === 'BUTTON' ||
               element.getAttribute('role') === 'button';
      },
      onclone: (clonedDoc: globalThis.Document, clonedElement: HTMLElement) => {
        // Prevent common html2canvas clipping issues on line-clamped blocks.
        // We keep the clamp but add a small bottom padding so descenders aren't cut.
        const styleEl = clonedDoc.createElement('style');
        styleEl.textContent = `
          /* Ensure the export root doesn't clip its own contents */
          .preparing-export,
          .preparing-export .resume-container {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }

          .preparing-export [style*="-webkit-line-clamp"],
          .preparing-export [style*="WebkitLineClamp"] {
            padding-bottom: 0.25em !important;
          }
        `;
        clonedDoc.head.appendChild(styleEl);

        // Apply print styles to cloned document
        const resumeEl = clonedElement.querySelector('.resume-preview-container') ||
                        clonedElement.querySelector('.resume-container') ||
                        clonedElement;
        
        if (resumeEl) {
          (resumeEl as HTMLElement).classList.add('preparing-export');
          (resumeEl as HTMLElement).style.width = '210mm';
          (resumeEl as HTMLElement).style.backgroundColor = '#ffffff';
          (resumeEl as HTMLElement).style.fontFamily = 'Inter, Calibri, Helvetica, Arial, sans-serif';
        }
        
        // Ensure all fonts are loaded in cloned document
        const fontFaces = Array.from(document.fonts.values());
        return Promise.all(fontFaces.map(font => font.load()));
      }
    }) as any);

    console.log('Canvas captured successfully:', {
      width: canvas.width,
      height: canvas.height
    });

    // Check if canvas is empty (common cause of blank PDFs)
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas capture failed - element may be hidden or have no content');
    }

    // Restore original styles
    Object.entries(originalStyles).forEach(([property, value]) => {
      (element.style as any)[property] = value;
    });
    element.classList.remove('preparing-export');
    
    // Restore parent transforms
    if (parentElement && originalParentTransform) {
      parentElement.style.transform = originalParentTransform;
    }
    if (grandParentElement && originalGrandParentTransform) {
      grandParentElement.style.transform = originalGrandParentTransform;
    }
    
    if (resumeContainer) {
      resumeContainer.style.height = '';
      resumeContainer.style.minHeight = '';
      resumeContainer.style.maxHeight = '';
      resumeContainer.style.overflow = '';
    }

    // Convert to PDF with standard settings
    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality PNG for text clarity
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false, // Don't compress to maintain quality
      precision: 16 // Higher precision for better rendering
    });

    // A4 dimensions: 210mm × 297mm
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    console.log('PDF dimensions:', { pdfWidth, pdfHeight, imgWidth, imgHeight });
    
    // Calculate scaling to fit width with margins
    // IMPORTANT: keep the exported PDF matching the on-screen preview.
    // The preview is already sized to A4 (210mm wide), so we avoid adding extra
    // margins or re-scaling to fit height.
    const margin = 0;
    const contentWidth = pdfWidth;
    const scaleFactor = contentWidth / imgWidth;
    const scaledHeight = imgHeight * scaleFactor;
    
    console.log('Scaled dimensions:', { contentWidth, scaleFactor, scaledHeight });
    
    const pageContentHeight = pdfHeight;

    // If it fits on one page, render 1:1 with the preview.
    if (scaledHeight <= pageContentHeight) {
      // Tiny safety shrink to avoid last-line clipping due to PDF rounding.
      const safeMaxHeight = pageContentHeight - 0.5;
      let renderWidth = contentWidth;
      let renderHeight = scaledHeight;
      let x = 0;
      if (renderHeight > safeMaxHeight) {
        const s = safeMaxHeight / renderHeight;
        renderWidth *= s;
        renderHeight *= s;
        x = (contentWidth - renderWidth) / 2;
      }
      pdf.addImage(imgData, 'PNG', x, 0, renderWidth, renderHeight, undefined, 'FAST');

      // Add invisible text layer for text selection and ATS extraction
      const textScaleFactor = renderWidth / element.scrollWidth;
      pdf.setTextColor(255, 255, 255); // White (invisible on white background)
      textData.forEach(({ text, x: tx, y: ty, fontSize, fontWeight }) => {
        const pdfX = x + tx * textScaleFactor;
        const pdfY = ty * textScaleFactor;
        const pdfFontSize = fontSize * textScaleFactor * 0.75; // Convert px to pt approximately
        
        pdf.setFontSize(pdfFontSize > 1 ? pdfFontSize : 1);
        try {
          pdf.setFont('helvetica', fontWeight === '700' || fontWeight === 'bold' ? 'bold' : 'normal');
        } catch {
          pdf.setFont('helvetica', 'normal');
        }
        
        // Add text with 0 opacity effect (render color same as background)
        pdf.text(text, pdfX, pdfY, { renderingMode: 'invisible' as any });
      });

      // Add clickable link annotations on top of the image
      const linkScaleFactor = renderWidth / element.scrollWidth;
      linkData.forEach(({ href, x: lx, y: ly, width: lw, height: lh }) => {
        const pdfX = x + lx * linkScaleFactor;
        const pdfY = ly * linkScaleFactor;
        const pdfW = lw * linkScaleFactor;
        const pdfH = lh * linkScaleFactor;
        pdf.link(pdfX, pdfY, pdfW, pdfH, { url: href });
      });
    } else {
      // Multi-page: re-use the full image with vertical offsets (avoids slice/canvas rounding loss)
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, -position, contentWidth, scaledHeight, undefined, 'FAST');
      while (position + pageContentHeight < scaledHeight) {
        position += pageContentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, contentWidth, scaledHeight, undefined, 'FAST');
      }
    }

    // Save the PDF
    pdf.save(filename);

    toast.success('PDF exported successfully!', { id: 'pdf-export' });
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to export PDF. Please try again.', { id: 'pdf-export' });
  }
}

/**
 * Export resume to DOCX format
 */
export async function exportToDOCX(
  resumeData: ResumeData,
  filename: string = 'resume.docx'
): Promise<void> {
  try {
    toast.loading('Generating DOCX...', { id: 'docx-export' });

    // Support multiple ResumeData shapes used across the repo.
    const anyResume = resumeData as any;
    const experience = Array.isArray(anyResume.experience) ? anyResume.experience : [];
    const education = Array.isArray(anyResume.education)
      ? anyResume.education
      : Array.isArray(anyResume.educationAndCertifications?.education)
        ? anyResume.educationAndCertifications.education
        : [];
    const projects = Array.isArray(anyResume.projects) ? anyResume.projects : [];
    const certifications = Array.isArray(anyResume.certifications)
      ? anyResume.certifications
      : Array.isArray(anyResume.educationAndCertifications?.certifications)
        ? anyResume.educationAndCertifications.certifications
        : [];

    const skillsGroups = Array.isArray(anyResume.skills)
      ? anyResume.skills
      : anyResume.skills && typeof anyResume.skills === 'object'
        ? Object.entries(anyResume.skills)
            .map(([category, items]) => ({
              category,
              items: Array.isArray(items) ? items : [],
            }))
            .filter((g) => g.items.length > 0)
        : [];

    // Recruiter-standard sizes in twips (1pt = 20 twips)
    const PT = {
      name: 20 * 20,      // 20pt
      section: 12 * 20,   // 12pt
      body: 10.5 * 20,    // 10.5pt (210 twips)
      contact: 9.5 * 20,  // 9.5pt (190 twips)
    };

    // Spacing in twips
    const SPACING = {
      afterName: 12 * 20,       // 12pt after name
      afterContact: 8 * 20,     // 8pt after contact line
      beforeSection: 15 * 20,   // 15pt before section heading
      afterSection: 8 * 20,     // 8pt after section heading
      afterParagraph: 6 * 20,   // 6pt after body paragraphs
      afterBullet: 4 * 20,      // 4pt between bullets
      betweenEntries: 10 * 20,  // 10pt between experience/project entries
    };

    // Build links line
    const linksLine = [
      anyResume.personalInfo?.linkedin ? 'LinkedIn' : '',
      anyResume.personalInfo?.github ? 'GitHub' : '',
      (anyResume.personalInfo?.portfolio || anyResume.personalInfo?.website || anyResume.personalInfo?.url) ? 'Portfolio' : '',
    ].filter(Boolean).join(' | ');

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5in
                right: 1008, // 0.7in
                bottom: 720, // 0.5in
                left: 1008,  // 0.7in
              },
            },
          },
          children: [
            // Header with name (20pt semi-bold centered)
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: SPACING.afterName },
              children: [
                new TextRun({
                  text: resumeData.personalInfo.fullName,
                  size: PT.name,
                  bold: true,
                  font: 'Calibri',
                }),
              ],
            }),

            // Contact info (9.5pt centered)
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 0 },
              children: [
                new TextRun({
                  text: [
                    resumeData.personalInfo.email,
                    resumeData.personalInfo.phone,
                    resumeData.personalInfo.location,
                  ]
                    .filter(Boolean)
                    .join(' | '),
                  size: PT.contact,
                  font: 'Calibri',
                }),
              ],
            }),

            // Links line (9.5pt centered, no underline)
            ...(linksLine
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: SPACING.afterContact },
                    children: [
                      new TextRun({
                        text: linksLine,
                        size: PT.contact,
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ]
              : []),

            // Summary
            ...(resumeData.summary
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'PROFESSIONAL SUMMARY',
                        size: PT.section,
                        bold: true,
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
                    border: {
                      bottom: { style: 'single' as any, size: 4, color: '222222' },
                    },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: resumeData.summary,
                        size: PT.body,
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { after: SPACING.afterParagraph, line: 276 }, // 1.15 line spacing
                  }),
                ]
              : []),

            // Experience
            ...(experience.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'EXPERIENCE',
                        size: PT.section,
                        bold: true,
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
                    border: {
                      bottom: { style: 'single' as any, size: 4, color: '222222' },
                    },
                  }),
                  ...experience.flatMap((exp: any, idx: number) => [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: exp.title,
                          size: PT.body,
                          bold: true,
                          font: 'Calibri',
                        }),
                      ],
                      spacing: { before: idx > 0 ? SPACING.betweenEntries : 0, after: 40 },
                      tabStops: [{ type: 'right' as any, position: 9360 }],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${exp.company}${exp.location ? ` | ${exp.location}` : ''}`,
                          size: PT.body,
                          font: 'Calibri',
                        }),
                        new TextRun({
                          text: `\t${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`,
                          size: PT.body,
                          font: 'Calibri',
                        }),
                      ],
                      spacing: { after: 60 },
                    }),
                    ...(Array.isArray(exp.achievements) ? exp.achievements : []).slice(0, 3).map(
                      (achievement: any) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `• ${achievement}`,
                              size: PT.body,
                              font: 'Calibri',
                            }),
                          ],
                          spacing: { after: SPACING.afterBullet, line: 276 },
                          indent: { left: 288 },
                        })
                    ),
                  ]),
                ]
              : []),

            // Education
            ...(education.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'EDUCATION',
                        size: PT.section,
                        bold: true,
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
                    border: {
                      bottom: { style: 'single' as any, size: 4, color: '222222' },
                    },
                  }),
                  ...education.flatMap((edu: any, idx: number) => [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: edu.degree,
                          size: PT.body,
                          bold: true,
                          font: 'Calibri',
                        }),
                        new TextRun({
                          text: `\t${edu.graduationDate || ''}`,
                          size: PT.body,
                          font: 'Calibri',
                        }),
                      ],
                      spacing: { before: idx > 0 ? SPACING.betweenEntries : 0, after: 40 },
                      tabStops: [{ type: 'right' as any, position: 9360 }],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: edu.institution,
                          size: PT.body,
                          font: 'Calibri',
                        }),
                      ],
                      spacing: { after: SPACING.afterParagraph },
                    }),
                  ]),
                ]
              : []),

            // Skills
            ...(skillsGroups.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'SKILLS',
                        size: PT.section,
                        bold: true,
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
                    border: {
                      bottom: { style: 'single' as any, size: 4, color: '222222' },
                    },
                  }),
                  ...skillsGroups.map(
                    (skill: any) =>
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${skill.category}: `,
                            size: PT.body,
                            bold: true,
                            font: 'Calibri',
                          }),
                          new TextRun({
                            text: (Array.isArray(skill.items) ? skill.items : []).join(', '),
                            size: PT.body,
                            font: 'Calibri',
                          }),
                        ],
                        spacing: { after: 100, line: 300 }, // 1.25 line spacing
                      })
                  ),
                ]
              : []),

            // Projects
            ...(projects.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'PROJECTS',
                        size: PT.section,
                        bold: true,
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
                    border: {
                      bottom: { style: 'single' as any, size: 4, color: '222222' },
                    },
                  }),
                  ...projects.slice(0, 2).flatMap((project: any, idx: number) => [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: project.name,
                          size: PT.body,
                          bold: true,
                          font: 'Calibri',
                        }),
                        ...(project.description
                          ? [
                              new TextRun({
                                text: ` – ${project.description}`,
                                size: PT.body,
                                font: 'Calibri',
                              }),
                            ]
                          : []),
                      ],
                      spacing: { before: idx > 0 ? SPACING.betweenEntries : 0, after: 60 },
                    }),
                    ...(Array.isArray(project.achievements) ? project.achievements : []).slice(0, 2).map(
                      (achievement: any) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `• ${achievement}`,
                              size: PT.body,
                              font: 'Calibri',
                            }),
                          ],
                          spacing: { after: SPACING.afterBullet, line: 276 },
                          indent: { left: 288 },
                        })
                    ),
                  ]),
                ]
              : []),

            // Certifications
            ...(certifications.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'ACHIEVEMENTS & CERTIFICATIONS',
                        size: PT.section,
                        bold: true,
                        font: 'Calibri',
                      }),
                    ],
                    spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
                    border: {
                      bottom: { style: 'single' as any, size: 4, color: '222222' },
                    },
                  }),
                  ...certifications.slice(0, 2).map(
                    (cert: any) =>
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cert.name || cert.title || String(cert),
                            size: PT.body,
                            font: 'Calibri',
                          }),
                        ],
                        spacing: { after: SPACING.afterParagraph },
                      })
                  ),
                ]
              : []),
          ],
        },
      ],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);

    toast.success('DOCX exported successfully!', { id: 'docx-export' });
  } catch (error) {
    console.error('DOCX export error:', error);
    toast.error('Failed to export DOCX. Please try again.', { id: 'docx-export' });
  }
}

/**
 * Print resume (opens browser print dialog)
 */
export function printResume(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Resume not found');
    return;
  }

  // Create print window
  const printWindow = window.open('', '', 'height=800,width=800');
  if (!printWindow) {
    toast.error('Please allow popups to print');
    return;
  }

  // Get all stylesheets from the current page
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(link => {
      if (link.tagName === 'LINK') {
        return `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}">`;
      } else {
        return `<style>${link.innerHTML}</style>`;
      }
    })
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Resume</title>
        <meta charset="utf-8">
        ${stylesheets}
        <style>
          body { 
            margin: 0; 
            padding: 10px; 
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
          }
          
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            
            body { 
              margin: 0; 
              padding: 0;
              font-size: 10pt;
              line-height: 1.4;
            }
            
            .resume-container {
              width: 100%;
              overflow: visible;
            }
            
            h1 { font-size: 18pt; margin-bottom: 6pt; line-height: 1.2; }
            h2 { font-size: 13pt; margin-bottom: 4pt; margin-top: 8pt; line-height: 1.2; }
            h3 { font-size: 11pt; margin-bottom: 3pt; margin-top: 5pt; line-height: 1.2; }
            
            p { margin-bottom: 6pt; line-height: 1.4; }
            ul, ol { margin-bottom: 6pt; padding-left: 15pt; }
            li { margin-bottom: 2pt; font-size: 10pt; line-height: 1.4; }
            
            .experience-item,
            .education-item,
            .project-item {
              margin-bottom: 12pt;
              page-break-inside: avoid;
            }
            
            .no-print,
            button,
            .export-buttons,
            .zoom-controls {
              display: none !important;
            }
          }
          
          @media screen {
            .resume-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}
