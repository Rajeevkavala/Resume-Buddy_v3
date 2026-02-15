import { baseLayout, ctaButton } from './base';
import type { WelcomeEmailData } from '../types';

export function welcomeTemplate(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Welcome to ResumeBuddy, ${data.name}! 🎉</h2>
    <p style="color:#475569; margin:0 0 20px; font-size:15px; line-height:1.6;">
      We're thrilled to have you on board! Your AI-powered resume journey starts now.
    </p>
    <p style="color:#475569; margin:0 0 12px; font-size:15px; font-weight:600;">Here's what you can do:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:10px 0;">
          <span style="color:${data.name ? '#3b82f6' : '#475569'}; font-size:18px; margin-right:10px;">📊</span>
          <span style="color:#334155; font-size:14px;"><strong>ATS Analysis</strong> — Get your resume scored against job descriptions</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;">
          <span style="font-size:18px; margin-right:10px;">🎯</span>
          <span style="color:#334155; font-size:14px;"><strong>AI Improvements</strong> — Get tailored suggestions to boost your resume</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;">
          <span style="font-size:18px; margin-right:10px;">📄</span>
          <span style="color:#334155; font-size:14px;"><strong>PDF Export</strong> — Generate professional resumes with FAANG-quality templates</span>
        </td>
      </tr>
    </table>
    ${ctaButton('Start Building Your Resume', data.loginUrl)}
    <p style="color:#94a3b8; margin:0; font-size:13px; text-align:center;">
      Free tier includes 5 AI credits/day and 2 exports/day
    </p>
  `, { preheader: `Welcome to ResumeBuddy! Start building your perfect resume.` });

  return {
    subject: `Welcome to ResumeBuddy, ${data.name}! 🎉`,
    html,
    text: `Welcome to ResumeBuddy, ${data.name}!\n\nYour AI-powered resume journey starts now.\n\nHere's what you can do:\n- ATS Analysis: Get your resume scored against job descriptions\n- AI Improvements: Get tailored suggestions to boost your resume\n- PDF Export: Generate professional resumes with FAANG-quality templates\n\nStart building: ${data.loginUrl}\n\nFree tier includes 5 AI credits/day and 2 exports/day.`,
  };
}
