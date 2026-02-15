import { baseLayout, ctaButton, infoBox } from './base';
import type { SubscriptionExpiringData } from '../types';

export function subscriptionExpiringTemplate(data: SubscriptionExpiringData): { subject: string; html: string; text: string } {
  const html = baseLayout(`
    <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Your Pro Subscription is Expiring ⚠️</h2>
    <p style="color:#475569; margin:0 0 8px; font-size:15px; line-height:1.6;">
      Hi ${data.name},
    </p>
    <p style="color:#475569; margin:0 0 24px; font-size:15px; line-height:1.6;">
      Your ResumeBuddy Pro subscription will expire in <strong>${data.daysRemaining} day${data.daysRemaining > 1 ? 's' : ''}</strong> on <strong>${data.expiryDate}</strong>.
    </p>
    ${infoBox(`
      <p style="color:#b45309; margin:0 0 8px; font-size:14px; font-weight:600;">What you'll lose after expiration:</p>
      <ul style="color:#475569; margin:0; padding-left:20px; font-size:13px; line-height:1.8;">
        <li>10 AI credits/day → 5 AI credits/day</li>
        <li>Unlimited exports → 2 exports/day</li>
        <li>Interview preparation feature</li>
        <li>Cover letter generation</li>
        <li>Advanced Q&A sessions</li>
        <li>Priority AI processing</li>
      </ul>
    `)}
    ${ctaButton('Renew Subscription', data.renewUrl)}
    <p style="color:#94a3b8; margin:0; font-size:13px; text-align:center;">
      Questions? Reply to this email and we'll help you out.
    </p>
  `, { preheader: `Your Pro subscription expires in ${data.daysRemaining} days` });

  return {
    subject: `Your Pro Subscription Expires in ${data.daysRemaining} Days`,
    html,
    text: `Hi ${data.name},\n\nYour ResumeBuddy Pro subscription will expire in ${data.daysRemaining} days on ${data.expiryDate}.\n\nAfter expiration you'll lose:\n- 10 AI credits/day → 5 AI credits/day\n- Unlimited exports → 2 exports/day\n- Interview preparation\n- Cover letter generation\n- Advanced Q&A sessions\n\nRenew now: ${data.renewUrl}`,
  };
}
