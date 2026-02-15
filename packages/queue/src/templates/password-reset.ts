import { baseLayout, ctaButton, infoBox } from './base';
import type { PasswordResetEmailData } from '../types';

export function passwordResetTemplate(data: PasswordResetEmailData): { subject: string; html: string; text: string } {
  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Password Reset Request</h2>
    <p style="color:#475569; margin:0 0 8px; font-size:15px; line-height:1.6;">
      Hi ${data.name},
    </p>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      We received a request to reset your password. Use the code below or click the button to set a new password:
    </p>
    <div style="font-size:32px; font-weight:700; letter-spacing:8px; background:#fef2f2; 
                padding:20px; text-align:center; border-radius:10px; margin:0 0 24px;
                border:2px dashed #fca5a5; color:#dc2626; font-family:monospace;">
      ${data.resetCode}
    </div>
    ${ctaButton('Reset Your Password', data.resetUrl)}
    <p style="color:#475569; margin:0 0 8px; font-size:14px;">
      ⏱ This link expires in <strong>1 hour</strong>.
    </p>
    ${data.ipAddress ? infoBox(`
      <p style="color:#475569; margin:0; font-size:13px;">
        <strong>Request details:</strong><br>
        IP Address: ${data.ipAddress}<br>
        Time: ${data.timestamp}
      </p>
    `) : ''}
    <p style="color:#94a3b8; margin:20px 0 0; font-size:13px; line-height:1.5;">
      If you didn't request a password reset, you can safely ignore this email. 
      Your password will not be changed.
    </p>
  `, { preheader: 'Reset your ResumeBuddy password' });

  return {
    subject: 'Reset Your Password — ResumeBuddy',
    html,
    text: `Hi ${data.name},\n\nWe received a request to reset your password.\n\nYour reset code is: ${data.resetCode}\n\nOr visit: ${data.resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
  };
}
