import { baseLayout, infoBox } from './base';
import type { AccountActivityData } from '../types';

export function accountActivityTemplate(data: AccountActivityData): { subject: string; html: string; text: string } {
  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Security Alert 🔒</h2>
    <p style="color:#475569; margin:0 0 8px; font-size:15px; line-height:1.6;">
      Hi ${data.name},
    </p>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      We detected a new <strong>${data.activityType}</strong> on your ResumeBuddy account:
    </p>
    ${infoBox(`
      <table style="width:100%; font-size:13px; color:#475569;">
        <tr><td style="padding:4px 0; font-weight:600;">Activity:</td><td>${data.activityType}</td></tr>
        <tr><td style="padding:4px 0; font-weight:600;">Device:</td><td>${data.device}</td></tr>
        <tr><td style="padding:4px 0; font-weight:600;">IP Address:</td><td style="font-family:monospace;">${data.ipAddress}</td></tr>
        ${data.location ? `<tr><td style="padding:4px 0; font-weight:600;">Location:</td><td>${data.location}</td></tr>` : ''}
        <tr><td style="padding:4px 0; font-weight:600;">Time:</td><td>${data.timestamp}</td></tr>
      </table>
    `)}
    <p style="color:#475569; margin:20px 0 8px; font-size:14px;">
      If this was you, no action is needed.
    </p>
    <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="color:#dc2626; margin:0; font-size:14px; font-weight:600;">
        ⚠️ Wasn't you?
      </p>
      <p style="color:#991b1b; margin:8px 0 0; font-size:13px; line-height:1.5;">
        If you didn't perform this action, please <a href="${data.securityUrl}" style="color:#dc2626; font-weight:600;">secure your account immediately</a> by changing your password and reviewing active sessions.
      </p>
    </div>
  `, { preheader: `New ${data.activityType} detected on your account` });

  return {
    subject: `Security Alert: New ${data.activityType} Detected`,
    html,
    text: `Hi ${data.name},\n\nNew ${data.activityType} detected on your account.\n\nDevice: ${data.device}\nIP: ${data.ipAddress}\n${data.location ? `Location: ${data.location}\n` : ''}Time: ${data.timestamp}\n\nIf this wasn't you, secure your account: ${data.securityUrl}`,
  };
}
