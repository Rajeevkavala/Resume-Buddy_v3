import { baseLayout, ctaButton, infoBox } from './base';
import type { AnalysisCompleteData } from '../types';

export function analysisCompleteTemplate(data: AnalysisCompleteData): { subject: string; html: string; text: string } {
  const scoreColor = data.atsScore >= 80 ? '#22c55e' : data.atsScore >= 60 ? '#eab308' : '#ef4444';

  const improvementsList = data.improvements.slice(0, 3).map(imp =>
    `<tr><td style="padding:6px 0;"><span style="color:#f59e0b; margin-right:8px;">💡</span><span style="color:#334155; font-size:14px;">${imp}</span></td></tr>`
  ).join('');

  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Your ATS Analysis is Complete! 📊</h2>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      Hi ${data.name}, here's a summary of your resume analysis:
    </p>
    <!-- ATS Score -->
    <div style="text-align:center; margin:0 0 28px;">
      <div style="display:inline-block; width:120px; height:120px; border-radius:50%; 
                  background:linear-gradient(135deg, ${scoreColor}22, ${scoreColor}11); 
                  border:4px solid ${scoreColor}; padding:28px 0;">
        <p style="margin:0; font-size:40px; font-weight:800; color:${scoreColor}; line-height:1;">${data.atsScore}</p>
        <p style="margin:4px 0 0; font-size:12px; color:#64748b; font-weight:500;">ATS Score</p>
      </div>
    </div>
    ${data.improvements.length > 0 ? `
    <p style="color:#475569; margin:0 0 12px; font-size:15px; font-weight:600;">Top Improvement Areas:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      ${improvementsList}
    </table>
    ` : ''}
    ${ctaButton('View Full Analysis', data.reportUrl)}
  `, { preheader: `Your ATS Score: ${data.atsScore}/100 — See your full analysis` });

  return {
    subject: `Your ATS Score: ${data.atsScore}/100 — Analysis Complete`,
    html,
    text: `Hi ${data.name},\n\nYour ATS analysis is complete!\n\nATS Score: ${data.atsScore}/100\n\nTop improvements:\n${data.improvements.slice(0, 3).map(i => `- ${i}`).join('\n')}\n\nView full analysis: ${data.reportUrl}`,
  };
}
