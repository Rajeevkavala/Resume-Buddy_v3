import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  storeOTP,
  isBlocked,
  isOnCooldown,
  getCooldownRemaining,
  sendEmailOTP,
  getWhatsAppProvider,
  getSMSProvider,
  type OTPChannel,
  type OTPPurpose,
} from '@/lib/auth';

// ============ Request Schema ============

const sendOTPSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  purpose: z.enum(['login', 'verify_phone', 'verify_email', 'password_reset']),
});

// ============ Phone Number Validation ============

const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateDestination(destination: string, channel: OTPChannel): { valid: boolean; error?: string } {
  if (channel === 'email') {
    if (!EMAIL_REGEX.test(destination)) {
      return { valid: false, error: 'Invalid email address' };
    }
  } else {
    // WhatsApp and SMS require E.164 phone format
    if (!E164_REGEX.test(destination)) {
      return { valid: false, error: 'Phone number must be in E.164 format (e.g., +919876543210)' };
    }
  }
  return { valid: true };
}

// ============ POST /api/auth/otp/send ============

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validated = sendOTPSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { destination, channel, purpose } = validated.data;

    // 2. Validate destination format
    const destValidation = validateDestination(destination, channel);
    if (!destValidation.valid) {
      return NextResponse.json(
        { error: destValidation.error },
        { status: 400 }
      );
    }

    // 3. Check if destination is blocked (too many failed attempts)
    const blocked = await isBlocked(destination, channel);
    if (blocked) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // 4. Check cooldown (prevent rapid resends)
    const onCooldown = await isOnCooldown(destination, channel);
    if (onCooldown) {
      const remaining = await getCooldownRemaining(destination, channel);
      return NextResponse.json(
        {
          error: 'Please wait before requesting a new code.',
          retryAfter: remaining,
        },
        { status: 429 }
      );
    }

    // 5. Generate and store OTP
    const { code, expiresIn } = await storeOTP(destination, channel, purpose as OTPPurpose);

    // 6. Send OTP via appropriate channel
    let sendResult: { success: boolean; messageId?: string } = { success: false };

    switch (channel) {
      case 'email':
        sendResult = await sendEmailOTP(destination, code);
        break;

      case 'whatsapp':
        try {
          const whatsappProvider = getWhatsAppProvider();
          sendResult = await whatsappProvider.sendOTP(destination, code);
        } catch (error) {
          console.error('[OTP/WhatsApp] Provider error:', error);
          sendResult = { success: false };
        }
        break;

      case 'sms':
        try {
          const smsProvider = getSMSProvider();
          sendResult = await smsProvider.sendOTP(destination, code);
        } catch (error) {
          console.error('[OTP/SMS] Provider error:', error);
          sendResult = { success: false };
        }
        break;
    }

    if (!sendResult.success) {
      return NextResponse.json(
        { error: `Failed to send OTP via ${channel}. Please try again.` },
        { status: 500 }
      );
    }

    // 7. Return success (never expose the OTP code in the response)
    const maskedDestination = channel === 'email'
      ? maskEmail(destination)
      : maskPhone(destination);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedDestination}`,
      expiresIn,
      channel,
    });

  } catch (error) {
    console.error('[OTP/Send] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============ Helpers ============

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return '***' + phone.slice(-2);
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}
