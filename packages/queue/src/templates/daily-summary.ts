import { baseLayout, ctaButton, infoBox } from './base';
import type { DailySummaryData } from '../types';

export function dailySummaryTemplate(data: DailySummaryData): { subject: string; html: string; text: string } {
  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Your Daily Summary 📈</h2>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      Hi ${data.name}, here's what happened today:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="width:33%; text-align:center; padding:16px 8px;">
          <div style="background:#f0fdf4; border-radius:10px; padding:16px;">
            <p style="margin:0; font-size:28px; font-weight:700; color:#16a34a;">${data.analysesRun}</p>
            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Analyses Run</p>
          </div>
        </td>
        <td style="width:33%; text-align:center; padding:16px 8px;">
          <div style="background:#eff6ff; border-radius:10px; padding:16px;">
            <p style="margin:0; font-size:28px; font-weight:700; color:#2563eb;">${data.resumesExported}</p>
            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Resumes Exported</p>
          </div>
        </td>
        <td style="width:33%; text-align:center; padding:16px 8px;">
          <div style="background:#fefce8; border-radius:10px; padding:16px;">
            <p style="margin:0; font-size:28px; font-weight:700; color:#ca8a04;">${data.creditsRemaining}</p>
            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Credits Left</p>
          </div>
        </td>
      </tr>
    </table>
    ${ctaButton('Continue Optimizing', data.dashboardUrl)}
  `, { preheader: `Today: ${data.analysesRun} analyses, ${data.resumesExported} exports, ${data.creditsRemaining} credits remaining` });

  return {
    subject: 'Your ResumeBuddy Daily Summary 📈',
    html,
    text: `Hi ${data.name},\n\nYour daily summary:\n- Analyses Run: ${data.analysesRun}\n- Resumes Exported: ${data.resumesExported}\n- Credits Remaining: ${data.creditsRemaining}\n\nContinue at: ${data.dashboardUrl}`,
  };
}
