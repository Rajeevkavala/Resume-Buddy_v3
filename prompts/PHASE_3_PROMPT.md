# Phase 3: Communication - OTP Authentication + Email Notifications

> **Copilot Agent Prompt for Phase 3 Implementation**
> **Estimated Duration**: ~8 hours
> **Dependencies**: Phase 1 (Auth) + Phase 2 (Database + Business Logic) must be complete
> **Blocking**: Phase 5 (Testing)

---

## Instruction

Take the `ARCHITECTURE_TRANSFORMATION.md` as the **primary reference** and `IMPLEMENTATION_TIMELINE_7_DAYS.md` as the secondary reference for phase-wise implementation.

Now implement **Phase 3 completely end-to-end** — it should work 100% without any errors. Test after implementing.

**Important**: If `IMPLEMENTATION_TIMELINE_7_DAYS.md` does not have enough context, use `ARCHITECTURE_TRANSFORMATION.md` as the primary source of truth for all code, schemas, configurations, and architectural decisions.

**Prerequisite**: Phase 1 and Phase 2 must be fully working:
- Auth system functional (JWT, sessions, OAuth)
- PostgreSQL database with all models migrated
- Server actions using Prisma
- Redis running for sessions and rate limiting

---

## Phase 3 Scope

Phase 3 has two sub-phases:
1. **Phase 3.1 — OTP Authentication** (~4 hours)
2. **Phase 3.2 — Email Notification System** (~4 hours)

---

## Phase 3.1: OTP Authentication

### Objective
Add multi-channel OTP authentication: WhatsApp OTP, SMS OTP, and Email OTP as additional login methods alongside email/password and Google OAuth.

### Tasks (implement in order)

#### 1. OTP Types & Configuration (`packages/auth/src/otp/types.ts`)
```typescript
export type OTPChannel = 'whatsapp' | 'sms' | 'email';
export type OTPPurpose = 'login' | 'verify_phone' | 'verify_email' | 'password_reset';

export interface OTPRequest {
  destination: string;    // Phone number or email
  channel: OTPChannel;
  purpose: OTPPurpose;
  userId?: string;        // For logged-in users verifying phone/email
}

export interface OTPVerification {
  destination: string;
  code: string;
  channel: OTPChannel;
  purpose: OTPPurpose;
}

export interface OTPResult {
  success: boolean;
  message: string;
  expiresIn?: number;     // seconds
  attemptsRemaining?: number;
}

export interface OTPConfig {
  length: number;         // Default: 6
  expirySeconds: number;  // Default: 300 (5 minutes)
  maxAttempts: number;    // Default: 3
  cooldownSeconds: number; // Default: 60 (resend cooldown)
}

export const DEFAULT_OTP_CONFIG: OTPConfig = {
  length: 6,
  expirySeconds: 300,
  maxAttempts: 3,
  cooldownSeconds: 60,
};
```

#### 2. Redis-Backed OTP Store (`packages/auth/src/otp/store.ts`)
```typescript
// Redis key patterns:
// otp:{channel}:{destination} → { code, attempts, purpose, createdAt }
// otp_cooldown:{channel}:{destination} → "1" (TTL-based cooldown)
// otp_block:{channel}:{destination} → "1" (temporary block after too many failures)

// Functions:
generateOTP(length: number)           // Crypto-random numeric string
storeOTP(destination, channel, purpose, config)  // Store in Redis with TTL
verifyOTP(destination, channel, code)  // Check code, decrement attempts, return result
isOnCooldown(destination, channel)     // Check if resend cooldown active
blockDestination(destination, channel) // Block for 15 min after max attempts exceeded
isBlocked(destination, channel)        // Check if destination is temporarily blocked
clearOTP(destination, channel)         // Clean up after successful verification
```

Key implementation details:
- Generate OTP with `crypto.randomInt(0, 10^length)` padded to length
- Store as Redis hash: `HSET otp:{channel}:{destination} code {otp} attempts 0 purpose {purpose}`
- Set TTL: `EXPIRE otp:{channel}:{destination} 300`
- On verify: increment attempts, compare code, delete on success
- After 3 failed attempts: set `otp_block:{channel}:{destination}` with 900s TTL (15 min)
- Cooldown: set `otp_cooldown:{channel}:{destination}` with 60s TTL after each send

#### 3. WhatsApp OTP Provider (`packages/auth/src/otp/whatsapp.ts`)
Support multiple WhatsApp API providers with a pluggable interface:

```typescript
export type WhatsAppProvider = 'twilio' | 'meta' | 'gupshup';

interface WhatsAppOTPProvider {
  sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }>;
}

// Twilio WhatsApp implementation:
class TwilioWhatsAppProvider implements WhatsAppOTPProvider {
  async sendOTP(phone: string, otp: string) {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      body: `Your ResumeBuddy verification code is: ${otp}. Valid for 5 minutes.`,
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phone}`,
    });
    return { success: true, messageId: message.sid };
  }
}

// Meta Business API implementation:
class MetaWhatsAppProvider implements WhatsAppOTPProvider {
  async sendOTP(phone: string, otp: string) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
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
    return { success: !!data.messages?.[0]?.id, messageId: data.messages?.[0]?.id };
  }
}

// Gupshup implementation:
class GupshupWhatsAppProvider implements WhatsAppOTPProvider {
  async sendOTP(phone: string, otp: string) {
    const params = new URLSearchParams({
      channel: 'whatsapp',
      source: GUPSHUP_SOURCE_NUMBER,
      destination: phone,
      'src.name': GUPSHUP_APP_NAME,
      message: JSON.stringify({
        type: 'text',
        text: `Your ResumeBuddy code: ${otp}. Valid for 5 minutes.`,
      }),
    });
    const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: { apikey: GUPSHUP_API_KEY },
      body: params,
    });
    return { success: response.ok };
  }
}

// Factory function:
export function getWhatsAppProvider(): WhatsAppOTPProvider {
  const provider = process.env.WHATSAPP_PROVIDER || 'twilio';
  switch (provider) {
    case 'twilio': return new TwilioWhatsAppProvider();
    case 'meta': return new MetaWhatsAppProvider();
    case 'gupshup': return new GupshupWhatsAppProvider();
    default: throw new Error(`Unknown WhatsApp provider: ${provider}`);
  }
}
```

#### 4. SMS OTP Provider (`packages/auth/src/otp/sms.ts`)
Support Twilio and MSG91:

```typescript
export type SMSProvider = 'twilio' | 'msg91';

interface SMSOTPProvider {
  sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }>;
}

// Twilio SMS:
class TwilioSMSProvider implements SMSOTPProvider {
  async sendOTP(phone: string, otp: string) {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      body: `Your ResumeBuddy code is: ${otp}. Valid for 5 minutes. Don't share this code.`,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { success: true, messageId: message.sid };
  }
}

// MSG91:
class MSG91SMSProvider implements SMSOTPProvider {
  async sendOTP(phone: string, otp: string) {
    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        recipients: [{ mobiles: phone, otp }],
      }),
    });
    return { success: response.ok };
  }
}

// Factory:
export function getSMSProvider(): SMSOTPProvider {
  const provider = process.env.SMS_PROVIDER || 'twilio';
  switch (provider) {
    case 'twilio': return new TwilioSMSProvider();
    case 'msg91': return new MSG91SMSProvider();
    default: throw new Error(`Unknown SMS provider: ${provider}`);
  }
}
```

#### 5. Email OTP Provider (`packages/auth/src/otp/email-otp.ts`)
```typescript
import { Resend } from 'resend';

export async function sendEmailOTP(email: string, otp: string): Promise<{ success: boolean }> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Your ResumeBuddy Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                    background: #f4f4f5; padding: 20px; text-align: center; 
                    border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Email OTP send error:', error);
    return { success: false };
  }

  return { success: true };
}
```

#### 6. OTP API Routes

**POST `/api/auth/otp/send`**
```typescript
// Request body: { destination: string, channel: 'whatsapp' | 'sms' | 'email', purpose: 'login' | ... }
// Logic:
// 1. Validate input with Zod
// 2. Check if destination is blocked → 429
// 3. Check cooldown → 429 with retryAfter
// 4. Generate OTP via store
// 5. Send via appropriate provider:
//    - channel === 'whatsapp' → getWhatsAppProvider().sendOTP()
//    - channel === 'sms' → getSMSProvider().sendOTP()
//    - channel === 'email' → sendEmailOTP()
// 6. Return { success: true, expiresIn: 300 }
```

**POST `/api/auth/otp/verify`**
```typescript
// Request body: { destination: string, code: string, channel: string, purpose: string }
// Logic:
// 1. Validate input with Zod
// 2. Verify OTP via store → check code + attempts
// 3. If failed → return { success: false, attemptsRemaining }
// 4. If max attempts exceeded → block destination
// 5. If success:
//    a. For login: find/create user by phone/email
//    b. For verify_phone: update user.phoneVerified = true
//    c. For verify_email: update user.emailVerified = true
//    d. For password_reset: generate password reset token
// 6. If login: generate tokens + session (same as /api/auth/login)
// 7. Clear OTP from store
// 8. Return { success: true, user, accessToken } (for login)
```

#### 7. WhatsApp OTP Login Component
Create `apps/web/src/components/whatsapp-otp-login.tsx`:

```typescript
// Multi-step flow:
// Step 1: Phone number input (with country code selector)
//   - Validate phone format
//   - Send OTP button → calls POST /api/auth/otp/send { channel: 'whatsapp', destination: phone }
//   - Show loading state while sending
//
// Step 2: OTP code input (6-digit)
//   - Auto-focus first digit
//   - Auto-submit when all 6 digits entered
//   - Resend button with countdown timer (60 seconds)
//   - Calls POST /api/auth/otp/verify { code, channel: 'whatsapp', destination: phone }
//   - Show error on wrong code with attempts remaining
//
// Step 3: Name input (only for new users without a name)
//   - If user.name is null/empty after OTP verify, prompt for name
//   - PATCH /api/auth/profile { name }
//
// Step 4: Success → redirect to /dashboard

// UI: Use shadcn/ui components (Input, Button, Card, Alert)
// Animation: Smooth step transitions
// Error states: Invalid phone, OTP expired, max attempts, network error
```

#### 8. Update Login Page
Add WhatsApp/SMS OTP tabs to the login page alongside email/password and Google OAuth:
```typescript
// Tab options on login page:
// 1. Email & Password (existing)
// 2. WhatsApp OTP (new)
// 3. Google (existing)
// Maybe add SMS OTP as an option within the WhatsApp tab as a toggle
```

#### 9. Update Auth Exports
Export all OTP functions from `packages/auth/src/index.ts`:
```typescript
export * from './otp/types';
export * from './otp/store';
export { getWhatsAppProvider } from './otp/whatsapp';
export { getSMSProvider } from './otp/sms';
export { sendEmailOTP } from './otp/email-otp';
```

### Phase 3.1 Verification
```bash
# Test OTP flow (using email OTP which doesn't need external provider):
curl -X POST http://localhost:9002/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"destination":"test@test.com","channel":"email","purpose":"login"}'

# Check Redis for stored OTP:
redis-cli HGETALL "otp:email:test@test.com"

# Verify OTP:
curl -X POST http://localhost:9002/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"destination":"test@test.com","code":"123456","channel":"email","purpose":"login"}'
```

---

## Phase 3.2: Email Notification System

### Objective
Build a complete email notification system with professional HTML templates, BullMQ job queue for background processing, and user notification preferences.

### Tasks (implement in order)

#### 1. Create `packages/queue` Package
- `package.json` with dependencies: `bullmq`, `ioredis`
- `tsconfig.json`
- Set up queue connection to Redis

#### 2. BullMQ Queue Setup (`packages/queue/src/queues.ts`)
```typescript
import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Define all queues:
export const emailQueue = new Queue('email', { connection, defaultJobOptions: {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
}});

export const whatsappQueue = new Queue('whatsapp', { connection, defaultJobOptions: {
  removeOnComplete: 50,
  removeOnFail: 50,
  attempts: 2,
  backoff: { type: 'exponential', delay: 5000 },
}});

export const smsQueue = new Queue('sms', { connection, defaultJobOptions: {
  removeOnComplete: 50,
  removeOnFail: 50,
  attempts: 2,
  backoff: { type: 'exponential', delay: 5000 },
}});

export const aiTaskQueue = new Queue('ai-tasks', { connection, defaultJobOptions: {
  removeOnComplete: 200,
  removeOnFail: 100,
  attempts: 2,
  backoff: { type: 'exponential', delay: 10000 },
}});

export const cleanupQueue = new Queue('cleanup', { connection, defaultJobOptions: {
  removeOnComplete: 10,
  removeOnFail: 5,
}});

export const analyticsQueue = new Queue('analytics', { connection, defaultJobOptions: {
  removeOnComplete: 50,
  removeOnFail: 20,
}});

export const notificationQueue = new Queue('notifications', { connection, defaultJobOptions: {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
}});
```

#### 3. Job Type Interfaces (`packages/queue/src/types.ts`)
```typescript
export interface EmailJobData {
  type: 'welcome' | 'verification' | 'password-reset' | 'subscription-confirmation'
    | 'subscription-expiring' | 'export-ready' | 'analysis-complete'
    | 'account-activity' | 'daily-summary' | 'feedback-request';
  to: string;
  subject: string;
  data: Record<string, unknown>;
}

export interface WhatsAppJobData {
  type: 'otp' | 'welcome' | 'export-ready' | 'subscription-reminder';
  phone: string;
  data: Record<string, unknown>;
}

export interface SMSJobData {
  type: 'otp' | 'alert';
  phone: string;
  message: string;
}

export interface AITaskJobData {
  type: 'analyze' | 'interview' | 'improvements' | 'cover-letter';
  userId: string;
  input: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
}

export interface CleanupJobData {
  type: 'expired-sessions' | 'old-otps' | 'temp-files' | 'usage-records';
  olderThan: Date;
}
```

#### 4. Email Service (`packages/queue/src/services/email.service.ts`)
Dual-provider email service with Resend (primary) + Nodemailer (fallback):

```typescript
interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;        // Plain text fallback
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

// Resend provider (primary):
async function sendWithResend(message: EmailMessage) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    ...message,
  });
}

// Nodemailer provider (fallback):
async function sendWithNodemailer(message: EmailMessage) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
    ...message,
  });
}

// Main send function with fallback:
export async function sendEmail(message: EmailMessage) {
  try {
    return await sendWithResend(message);
  } catch (error) {
    console.warn('Resend failed, falling back to Nodemailer:', error);
    return await sendWithNodemailer(message);
  }
}
```

#### 5. Email Templates (`packages/queue/src/templates/`)
Create professional HTML email templates for all 10 notification types. Each template should:
- Be responsive (mobile-friendly)
- Use inline CSS (email-safe)
- Include unsubscribe link
- Match ResumeBuddy branding (blue primary color: `#3b82f6`)

Create these template files:

**`welcome.ts`** — Welcome email after registration
- Greet user by name
- List 3 key features
- CTA button: "Start Building Your Resume"
- Link to `/dashboard`

**`verification.ts`** — Email verification
- Verification link or code
- Expires in 24 hours
- Warning: don't share this link

**`password-reset.ts`** — Password reset
- Reset link (valid 1 hour)
- Mention if they didn't request this
- IP address and timestamp of request

**`subscription-confirmation.ts`** — Pro subscription activated
- Thank you message
- List Pro features unlocked
- Subscription period dates
- CTA: "Explore Pro Features"

**`subscription-expiring.ts`** — Subscription expiring in 7 days
- Expiry date
- What they'll lose (Pro features)
- CTA: "Renew Subscription"

**`export-ready.ts`** — Resume export completed
- Template name used
- Download link (presigned URL, valid 24h)
- CTA: "Download Your Resume"

**`analysis-complete.ts`** — Analysis results ready
- ATS Score (big number)
- Top 3 improvement areas (brief)
- CTA: "View Full Analysis"

**`account-activity.ts`** — Security alert
- Activity type (login, password change, etc.)
- Device, IP, location, timestamp
- "If this wasn't you" link

**`daily-summary.ts`** — Daily usage summary
- Analyses run today
- Resumes exported
- Credits remaining
- CTA: "Continue Optimizing"

**`feedback-request.ts`** — Feedback request (sent after 7 days)
- How was your experience?
- 5-star rating links
- Brief survey link

Each template function signature:
```typescript
export function welcomeTemplate(data: { name: string; loginUrl: string }): { subject: string; html: string; text: string };
```

#### 6. Email Worker (`packages/queue/src/workers/email.worker.ts`)
```typescript
import { Worker, Job } from 'bullmq';
import { sendEmail } from '../services/email.service';
import * as templates from '../templates';

const emailWorker = new Worker('email', async (job: Job<EmailJobData>) => {
  const { type, to, data } = job.data;

  // Get template by type
  const template = getTemplate(type, data);

  // Send email
  await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return { sent: true, to, type };
}, {
  connection,
  concurrency: 5,           // Process 5 emails concurrently
  limiter: {
    max: 100,               // Max 100 emails per minute
    duration: 60_000,
  },
});

emailWorker.on('completed', (job) => {
  console.log(`Email sent: ${job.data.type} to ${job.data.to}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email failed: ${job?.data.type} to ${job?.data.to}:`, err.message);
});
```

#### 7. WhatsApp Worker (`packages/queue/src/workers/whatsapp.worker.ts`)
```typescript
const whatsappWorker = new Worker('whatsapp', async (job: Job<WhatsAppJobData>) => {
  const { type, phone, data } = job.data;
  const provider = getWhatsAppProvider();

  switch (type) {
    case 'otp':
      await provider.sendOTP(phone, data.otp as string);
      break;
    case 'welcome':
      await provider.sendMessage(phone, `Welcome to ResumeBuddy, ${data.name}!`);
      break;
    case 'export-ready':
      await provider.sendMessage(phone, `Your resume is ready! Download: ${data.downloadUrl}`);
      break;
  }
}, { connection, concurrency: 2 });
```

#### 8. SMS Worker (`packages/queue/src/workers/sms.worker.ts`)
```typescript
const smsWorker = new Worker('sms', async (job: Job<SMSJobData>) => {
  const { phone, message } = job.data;
  const provider = getSMSProvider();
  await provider.sendOTP(phone, message);
}, { connection, concurrency: 2 });
```

#### 9. Worker Orchestrator (`packages/queue/src/workers/index.ts`)
```typescript
// Start all workers when the app boots
export function startAllWorkers() {
  console.log('Starting background workers...');
  require('./email.worker');
  require('./whatsapp.worker');
  require('./sms.worker');
  console.log('All workers started');
}

// Graceful shutdown
export function stopAllWorkers() {
  // Close all worker connections
}
```

#### 10. Notification Preferences
Create notification preferences in the User model or a separate table:

```typescript
// In server actions or a preferences API route:
// POST /api/user/notification-preferences
// {
//   emailNotifications: true,
//   whatsappNotifications: false,
//   smsNotifications: false,
//   dailySummary: true,
//   marketingEmails: false,
//   securityAlerts: true,
// }

// Before sending any notification, check preferences:
async function shouldNotify(userId: string, channel: OTPChannel, type: string): boolean {
  const prefs = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });
  // Check relevant preference...
}
```

#### 11. Integration Points
Wire up email notifications in existing flows:

```typescript
// In registration action:
await emailQueue.add('welcome-email', {
  type: 'welcome',
  to: user.email,
  data: { name: user.name, loginUrl: `${APP_URL}/dashboard` },
});

// In analysis action (after completion):
await emailQueue.add('analysis-complete', {
  type: 'analysis-complete',
  to: user.email,
  data: { atsScore: result.atsScore, improvements: result.topImprovements },
});

// In export action (after PDF generated):
await emailQueue.add('export-ready', {
  type: 'export-ready',
  to: user.email,
  data: { templateName, downloadUrl },
});

// In Razorpay webhook (after payment):
await emailQueue.add('subscription-confirmation', {
  type: 'subscription-confirmation',
  to: user.email,
  data: { tier: 'PRO', periodEnd: subscription.currentPeriodEnd },
});
```

---

## Required Dependencies to Install

```bash
# In packages/queue
pnpm add bullmq ioredis resend nodemailer
pnpm add -D @types/nodemailer

# In packages/auth (for OTP providers)
pnpm add twilio   # If using Twilio for WhatsApp/SMS
```

---

## File Deliverables Checklist

```
Phase 3.1 (OTP Authentication):
├── packages/auth/src/otp/types.ts                  ✅
├── packages/auth/src/otp/store.ts                  ✅
├── packages/auth/src/otp/whatsapp.ts               ✅
├── packages/auth/src/otp/sms.ts                    ✅
├── packages/auth/src/otp/email-otp.ts              ✅
├── apps/web/src/app/api/auth/otp/send/route.ts     ✅
├── apps/web/src/app/api/auth/otp/verify/route.ts   ✅
├── apps/web/src/components/whatsapp-otp-login.tsx   ✅
├── Login page updated with OTP tab                 ✅

Phase 3.2 (Email Notifications):
├── packages/queue/package.json                     ✅
├── packages/queue/tsconfig.json                    ✅
├── packages/queue/src/queues.ts                    ✅
├── packages/queue/src/types.ts                     ✅
├── packages/queue/src/services/email.service.ts    ✅
├── packages/queue/src/templates/welcome.ts         ✅
├── packages/queue/src/templates/verification.ts    ✅
├── packages/queue/src/templates/password-reset.ts  ✅
├── packages/queue/src/templates/subscription-confirmation.ts ✅
├── packages/queue/src/templates/subscription-expiring.ts     ✅
├── packages/queue/src/templates/export-ready.ts    ✅
├── packages/queue/src/templates/analysis-complete.ts ✅
├── packages/queue/src/templates/account-activity.ts ✅
├── packages/queue/src/templates/daily-summary.ts   ✅
├── packages/queue/src/templates/feedback-request.ts ✅
├── packages/queue/src/templates/index.ts           ✅
├── packages/queue/src/workers/email.worker.ts      ✅
├── packages/queue/src/workers/whatsapp.worker.ts   ✅
├── packages/queue/src/workers/sms.worker.ts        ✅
├── packages/queue/src/workers/index.ts             ✅
├── packages/queue/src/index.ts                     ✅
```

---

## Phase 3 Exit Criteria (Test All)

```
OTP Authentication:
- [ ] OTP generation produces 6-digit codes
- [ ] OTP stored in Redis with correct TTL (5 min)
- [ ] OTP verification succeeds with correct code
- [ ] OTP verification fails with wrong code (decrement attempts)
- [ ] OTP blocked after 3 failed attempts (15 min block)
- [ ] Resend cooldown enforced (60 seconds)
- [ ] POST /api/auth/otp/send returns success for email channel
- [ ] POST /api/auth/otp/verify creates session on login purpose
- [ ] WhatsApp OTP login component renders correctly
- [ ] Phone → OTP → Name → Dashboard flow works end-to-end
- [ ] Email OTP login works without external provider setup
- [ ] OTP cleanup happens automatically via Redis TTL

Email Notifications:
- [ ] BullMQ queues created in Redis
- [ ] Email worker processes jobs from queue
- [ ] Welcome email sends on registration
- [ ] All 10 email templates render correctly (check HTML)
- [ ] Resend API integration works (or Nodemailer fallback)
- [ ] Failed emails retry with exponential backoff (3 attempts)
- [ ] Worker concurrency limits respected (5 concurrent)
- [ ] Rate limiting on email queue (100/min)
- [ ] Analysis-complete notification fires after AI analysis
- [ ] Export-ready notification fires after PDF generation

Verification Commands:
# Check Redis for OTP:
redis-cli HGETALL "otp:email:test@test.com"
redis-cli TTL "otp:email:test@test.com"

# Check BullMQ queues:
redis-cli KEYS "bull:email:*"
redis-cli LLEN "bull:email:wait"

# Test email template rendering:
# Import template function and log HTML output to verify
```

---

## Important Notes

1. **WhatsApp/SMS providers need API credentials** — for local development, test with Email OTP channel which works with Resend or Nodemailer.
2. **OTP security**: Never log or expose OTP codes in API responses. Only log delivery status.
3. **Phone number format**: Always store in E.164 format (+91XXXXXXXXXX). Validate with a regex.
4. **BullMQ workers run in the same Node.js process** for simplicity. In production, they can be separated into a dedicated worker process.
5. **Email templates**: Test rendering by calling template functions directly and inspecting HTML output before deploying.
6. **Notification preferences**: If adding `notificationPreferences` Json field to User model, create a Prisma migration.
7. **Don't skip the queue for OTP emails** — Send OTP emails directly (not via queue) for latency reasons. Queue is for non-urgent notifications only.
