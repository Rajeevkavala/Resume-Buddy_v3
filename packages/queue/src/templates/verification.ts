import { baseLayout } from './base';
import type { VerificationEmailData } from '../types';

export function verificationTemplate(data: VerificationEmailData): { subject: string; html: string; text: string } {
  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Verify Your Email</h2>
    <p style="color:#475569; margin:0 0 8px; font-size:15px; line-height:1.6;">
      Hi ${data.name || 'there'},
    </p>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      Please use the following code to verify your email address:
    </p>
    <div style="font-size:36px; font-weight:700; letter-spacing:10px; background:#f0f9ff; 
                padding:24px; text-align:center; border-radius:10px; margin:0 0 24px;
                border:2px dashed #93c5fd; color:#1e40af; font-family:monospace;">
      ${data.code}
    </div>
    <p style="color:#475569; margin:0 0 8px; font-size:14px;">
      ⏱ This code expires in <strong>24 hours</strong>.
    </p>
    <p style="color:#94a3b8; margin:24px 0 0; font-size:13px; line-height:1.5;">
      ⚠️ Don't share this code with anyone. Our team will never ask for your verification code.
    </p>
  `, { preheader: `Your verification code is ${data.code}` });

  return {
    subject: 'Verify Your Email — ResumeBuddy',
    html,
    text: `Hi ${data.name || 'there'},\n\nYour verification code is: ${data.code}\n\nThis code expires in 24 hours.\n\nDon't share this code with anyone.`,
  };
}
