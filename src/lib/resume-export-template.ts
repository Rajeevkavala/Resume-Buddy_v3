/**
 * Resume Export with Template - Renders template to PDF
 * Uses html2canvas + jsPDF for styled export
 */

import { ResumeData } from './types';
import { ModernTemplateId } from './modern-templates';

// Static template imports to avoid dynamic import issues with Turbopack
import { ProfessionalTemplate } from '@/components/templates/professional-template';
import { ModernTemplate } from '@/components/templates/modern-template';
import { CreativeTemplate } from '@/components/templates/creative-template';
import { MinimalTemplate } from '@/components/templates/minimal-template';
import { ExecutiveTemplate } from '@/components/templates/executive-template';
import { TechTemplate } from '@/components/templates/tech-template';
import { FaangTemplate } from '@/components/templates/faang-template';

// Template component map
const TEMPLATE_COMPONENTS: Record<ModernTemplateId, React.ComponentType<{ resumeData: ResumeData }>> = {
  professional: ProfessionalTemplate,
  modern: ModernTemplate,
  creative: CreativeTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  tech: TechTemplate,
  faang: FaangTemplate,
};

/**
 * Export resume to PDF using a specific template
 * Creates a temporary DOM element, renders the template, and captures to PDF
 */
export async function exportToPDFWithTemplate(
  resumeData: ResumeData,
  templateId: ModernTemplateId,
  filename: string = 'resume.pdf'
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');
  const { createRoot } = await import('react-dom/client');
  const React = await import('react');

  // Get the template component from static map
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId];

  if (!TemplateComponent) {
    throw new Error(`Template "${templateId}" not found`);
  }

  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.id = 'temp-resume-export-container';
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    min-height: 297mm;
    background: white;
    z-index: -9999;
    overflow: visible;
  `;
  document.body.appendChild(container);

  try {
    // Render the template
    const root = createRoot(container);
    
    await new Promise<void>((resolve, reject) => {
      try {
        root.render(
          React.createElement(TemplateComponent, { resumeData })
        );
        // Wait for render to complete
        setTimeout(resolve, 500);
      } catch (err) {
        reject(err);
      }
    });

    // Wait for fonts and images
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find the resume container within the rendered template
    // Check for common class names used in templates
    const resumeElement = 
      container.querySelector('.resume-template') || 
      container.querySelector('.resume-container') || 
      container.firstElementChild ||
      container;

    // Verify we have actual content to capture
    if (!resumeElement || resumeElement.innerHTML.trim() === '') {
      throw new Error('Template failed to render content');
    }

    // Capture to canvas with JPEG format to avoid PNG signature issues
    const canvas = await html2canvas(resumeElement as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      windowWidth: 794,
      logging: false,
      allowTaint: true,
      onclone: (_clonedDoc: Document, element: HTMLElement) => {
        element.style.width = '210mm';
        element.style.minHeight = '297mm';
        element.style.overflow = 'visible';
      }
    });

    // Validate canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas capture failed - no content');
    }

    // Convert to PDF using JPEG to avoid PNG signature issues
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Get image data as JPEG (more reliable than PNG for jsPDF)
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // If content is longer than one page, handle pagination
    if (imgHeight <= pdfHeight) {
      // Fits on one page
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
    } else {
      // Multi-page handling
      let position = 0;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        const pageCanvas = document.createElement('canvas');
        const ctx = pageCanvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to create canvas context');
        }
        
        const sourceY = (position / imgHeight) * canvas.height;
        const sourceHeight = Math.min(
          (pdfHeight / imgHeight) * canvas.height,
          canvas.height - sourceY
        );
        
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, sourceHeight,
          0, 0,
          canvas.width, sourceHeight
        );

        const pageImgHeight = (sourceHeight * pdfWidth) / canvas.width;
        
        if (position > 0) {
          pdf.addPage();
        }
        
        // Use JPEG for page images too
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        
        pdf.addImage(
          pageImgData,
          'JPEG',
          0,
          0,
          imgWidth,
          pageImgHeight,
          undefined,
          'FAST'
        );

        position += pdfHeight;
        remainingHeight -= pdfHeight;
      }
    }

    pdf.save(filename);

    // Cleanup
    root.unmount();
  } finally {
    document.body.removeChild(container);
  }
}
