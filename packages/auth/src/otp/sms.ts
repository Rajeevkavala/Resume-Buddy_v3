// ============ SMS OTP Provider ============
// Supports: Twilio, MSG91

export type SMSProviderType = 'twilio' | 'msg91';

interface SMSOTPProvider {
  sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }>;
}

// ============ Twilio SMS ============

class TwilioSMSProvider implements SMSOTPProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken) {
      console.warn('[SMS] Twilio credentials not configured');
    }
  }

  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        Body: `Your ResumeBuddy code is: ${otp}. Valid for 5 minutes. Don't share this code.`,
        From: this.fromNumber,
        To: phone,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[SMS/Twilio] Send failed:', errorData);
        return { success: false };
      }

      const data = await response.json();
      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error('[SMS/Twilio] Error:', error);
      return { success: false };
    }
  }
}

// ============ MSG91 ============

class MSG91SMSProvider implements SMSOTPProvider {
  private authKey: string;
  private templateId: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || '';
    this.templateId = process.env.MSG91_TEMPLATE_ID || '';
  }

  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: this.templateId,
          recipients: [{ mobiles: phone, otp }],
        }),
      });

      if (!response.ok) {
        console.error('[SMS/MSG91] Send failed:', response.statusText);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('[SMS/MSG91] Error:', error);
      return { success: false };
    }
  }
}

// ============ Factory ============

/**
 * Get the configured SMS OTP provider.
 * Defaults to Twilio if SMS_PROVIDER env var is not set.
 */
export function getSMSProvider(): SMSOTPProvider {
  const provider = (process.env.SMS_PROVIDER || 'twilio') as SMSProviderType;

  switch (provider) {
    case 'twilio':
      return new TwilioSMSProvider();
    case 'msg91':
      return new MSG91SMSProvider();
    default:
      throw new Error(`Unknown SMS provider: ${provider}`);
  }
}
