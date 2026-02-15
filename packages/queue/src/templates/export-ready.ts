import { baseLayout, ctaButton } from './base';
import type { ExportReadyData } from '../types';

export function exportReadyTemplate(data: ExportReadyData): { subject: string; html: string; text: string } {
  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Your Resume is Ready! 📄</h2>
    <p style="color:#475569; margin:0 0 8px; font-size:15px; line-height:1.6;">
      Hi ${data.name},
    </p>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      Your resume has been generated using the <strong>${data.templateName}</strong> template and is ready for download.
    </p>
    ${ctaButton('Download Your Resume', data.downloadUrl)}
    <div style="background:#fefce8; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin:20px 0;">
      <p style="color:#92400e; margin:0; font-size:13px;">
        ⏱ This download link expires in <strong>${data.expiresIn}</strong>. 
        Make sure to download your resume before then.
      </p>
    </div>
    <p style="color:#94a3b8; margin:0; font-size:13px; text-align:center;">
      You can always generate a new resume from your dashboard.
    </p>
  `, { preheader: `Your ${data.templateName} resume is ready to download!` });

  return {
    subject: 'Your Resume is Ready! 📄',
    html,
    text: `Hi ${data.name},\n\nYour resume has been generated using the ${data.templateName} template.\n\nDownload it here: ${data.downloadUrl}\n\nThis link expires in ${data.expiresIn}.\n\nYou can always generate a new resume from your dashboard.`,
  };
}
