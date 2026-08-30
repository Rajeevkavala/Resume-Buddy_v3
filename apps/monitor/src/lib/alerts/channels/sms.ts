import twilio from "twilio";
import type { AlertPayload } from "../alert-manager";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendAlertSMS(alert: AlertPayload): Promise<void> {
  const TO = process.env.ALERT_PHONE_NUMBER || "+919876543210";
  const FROM = process.env.TWILIO_PHONE_NUMBER || "+14155238886";

  const message = `[${alert.severity}] Resume Buddy Monitor\n${alert.title}\n\nmonitor.resume-buddy.tech`;

  await client.messages.create({
    body: message,
    from: FROM,
    to: TO,
  });
}

export async function sendAlertWhatsApp(alert: AlertPayload): Promise<void> {
  const TO = `whatsapp:${process.env.ALERT_PHONE_NUMBER || "+919876543210"}`;
  const FROM = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  const message = `🚨 *[${alert.severity}] Resume Buddy Monitor*\n\n${alert.title}\n\n_${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST_\n\nhttps://monitor.resume-buddy.tech`;

  await client.messages.create({
    body: message,
    from: FROM,
    to: TO,
  });
}
