import { baseLayout, ctaButton, infoBox } from './base';
import type { SubscriptionConfirmationData } from '../types';

export function subscriptionConfirmationTemplate(data: SubscriptionConfirmationData): { subject: string; html: string; text: string } {
  const featuresList = data.features.map(f =>
    `<tr><td style="padding:6px 0;"><span style="color:#22c55e; margin-right:8px;">✅</span><span style="color:#334155; font-size:14px;">${f}</span></td></tr>`
  ).join('');

  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Welcome to Pro! 🚀</h2>
    <p style="color:#475569; margin:0 0 8px; font-size:15px; line-height:1.6;">
      Hi ${data.name},
    </p>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      Thank you for upgrading to <strong>ResumeBuddy Pro</strong>! You now have access to all premium features.
    </p>
    ${infoBox(`
      <p style="color:#1e293b; margin:0 0 8px; font-size:14px; font-weight:600;">Order Summary</p>
      <table style="width:100%; font-size:13px; color:#475569;">
        <tr><td>Plan:</td><td style="text-align:right; font-weight:600;">${data.tier} Plan</td></tr>
        <tr><td>Amount:</td><td style="text-align:right; font-weight:600;">${data.amount}</td></tr>
        <tr><td>Period:</td><td style="text-align:right;">${data.periodStart} to ${data.periodEnd}</td></tr>
        ${data.orderId ? `<tr><td>Order ID:</td><td style="text-align:right; font-family:monospace; font-size:12px;">${data.orderId}</td></tr>` : ''}
      </table>
    `)}
    <p style="color:#475569; margin:20px 0 12px; font-size:15px; font-weight:600;">Features Unlocked:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      ${featuresList}
    </table>
    ${ctaButton('Explore Pro Features', `${process.env.APP_URL || 'https://resumebuddy.com'}/dashboard`)}
  `, { preheader: `You're now a Pro member! Your upgrade has been confirmed.` });

  return {
    subject: 'Welcome to ResumeBuddy Pro! 🚀',
    html,
    text: `Hi ${data.name},\n\nThank you for upgrading to ResumeBuddy Pro!\n\nOrder Summary:\n- Plan: ${data.tier}\n- Amount: ${data.amount}\n- Period: ${data.periodStart} to ${data.periodEnd}\n\nFeatures unlocked:\n${data.features.map(f => `- ${f}`).join('\n')}\n\nEnjoy your Pro features!`,
  };
}
