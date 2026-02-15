// ============ WhatsApp OTP Provider ============
// Supports: Twilio, Meta Business API, Gupshup

export type WhatsAppProviderType = 'twilio' | 'meta' | 'gupshup';

interface WhatsAppOTPProvider {
  sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }>;
  sendMessage?(phone: string, text: string): Promise<{ success: boolean; messageId?: string }>;
}

// ============ Twilio WhatsApp ============

class TwilioWhatsAppProvider implements WhatsAppOTPProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

    if (!this.accountSid || !this.authToken) {
      console.warn('[WhatsApp] Twilio credentials not configured');
    }
  }

  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    return this.sendMessage(phone, `Your ResumeBuddy verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`);
  }

  async sendMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      // fromNumber may already include 'whatsapp:' prefix from env var
      const fromFormatted = this.fromNumber.startsWith('whatsapp:') ? this.fromNumber : `whatsapp:${this.fromNumber}`;
      // Destination phone should also have 'whatsapp:' prefix
      const toFormatted = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
      const body = new URLSearchParams({
        Body: text,
        From: fromFormatted,
        To: toFormatted,
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
        console.error('[WhatsApp/Twilio] Send failed:', errorData);
        return { success: false };
      }

      const data = await response.json();
      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error('[WhatsApp/Twilio] Error:', error);
      return { success: false };
    }
  }
}

// ============ Meta Business API ============

class MetaWhatsAppProvider implements WhatsAppOTPProvider {
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
  }

  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
              name: 'otp_verification',
              language: { code: 'en' },
              components: [{
                type: 'body',
                parameters: [{ type: 'text', text: otp }],
              }],
            },
          }),
        }
      );

      const data = await response.json();
      return {
        success: !!data.messages?.[0]?.id,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error('[WhatsApp/Meta] Error:', error);
      return { success: false };
    }
  }

  async sendMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: text },
          }),
        }
      );

      const data = await response.json();
      return {
        success: !!data.messages?.[0]?.id,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error('[WhatsApp/Meta] Error:', error);
      return { success: false };
    }
  }
}

// ============ Gupshup ============

class GupshupWhatsAppProvider implements WhatsAppOTPProvider {
  private apiKey: string;
  private sourceNumber: string;
  private appName: string;

  constructor() {
    this.apiKey = process.env.GUPSHUP_API_KEY || '';
    this.sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER || '';
    this.appName = process.env.GUPSHUP_APP_NAME || 'ResumeBuddy';
  }

  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    return this.sendMessage(phone, `Your ResumeBuddy code: ${otp}. Valid for 5 minutes.`);
  }

  async sendMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const params = new URLSearchParams({
        channel: 'whatsapp',
        source: this.sourceNumber,
        destination: phone,
        'src.name': this.appName,
        message: JSON.stringify({
          type: 'text',
          text,
        }),
      });

      const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
        method: 'POST',
        headers: { apikey: this.apiKey },
        body: params,
      });

      return { success: response.ok };
    } catch (error) {
      console.error('[WhatsApp/Gupshup] Error:', error);
      return { success: false };
    }
  }
}

// ============ Factory ============

/**
 * Get the configured WhatsApp OTP provider.
 * Defaults to Twilio if WHATSAPP_PROVIDER env var is not set.
 */
export function getWhatsAppProvider(): WhatsAppOTPProvider {
  const provider = (process.env.WHATSAPP_PROVIDER || 'twilio') as WhatsAppProviderType;

  switch (provider) {
    case 'twilio':
      return new TwilioWhatsAppProvider();
    case 'meta':
      return new MetaWhatsAppProvider();
    case 'gupshup':
      return new GupshupWhatsAppProvider();
    default:
      throw new Error(`Unknown WhatsApp provider: ${provider}`);
  }
}
