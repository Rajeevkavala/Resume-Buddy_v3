import { baseLayout, ctaButton } from './base';
import type { FeedbackRequestData } from '../types';

export function feedbackRequestTemplate(data: FeedbackRequestData): { subject: string; html: string; text: string } {
  const stars = [1, 2, 3, 4, 5].map(rating =>
    `<td style="text-align:center; padding:8px;">
      <a href="${data.surveyUrl}?rating=${rating}" style="text-decoration:none; font-size:28px;">
        ${'⭐'}
      </a>
      <p style="margin:4px 0 0; font-size:11px; color:#94a3b8;">${rating}</p>
    </td>`
  ).join('');

  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">How's Your Experience? 💬</h2>
    <p style="color:#475569; margin:0 0 8px; font-size:15px; line-height:1.6;">
      Hi ${data.name},
    </p>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      You've been using ResumeBuddy for ${data.daysSinceSignup} days! We'd love to hear how it's going.
    </p>
    <p style="color:#475569; margin:0 0 12px; font-size:15px; font-weight:600; text-align:center;">
      Rate your experience:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>${stars}</tr>
    </table>
    ${ctaButton('Share Detailed Feedback', data.surveyUrl)}
    <p style="color:#94a3b8; margin:0; font-size:13px; text-align:center; line-height:1.5;">
      Your feedback helps us build a better product for everyone. 
      It only takes 2 minutes!
    </p>
  `, { preheader: `We'd love your feedback after ${data.daysSinceSignup} days of using ResumeBuddy` });

  return {
    subject: `How's ResumeBuddy working for you? 💬`,
    html,
    text: `Hi ${data.name},\n\nYou've been using ResumeBuddy for ${data.daysSinceSignup} days! We'd love to hear how it's going.\n\nShare your feedback: ${data.surveyUrl}\n\nIt only takes 2 minutes!`,
  };
}
