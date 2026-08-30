import { Resend } from "resend";
import type { AlertPayload } from "../alert-manager";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlertEmail(alert: AlertPayload): Promise<void> {
  const FROM = process.env.ALERT_EMAIL_FROM || "alerts@resume-buddy.tech";
  const TO = process.env.ALERT_EMAIL_TO || "resumebuddy0@gmail.com";

  const severityColor = {
    P1_CRITICAL: "#ef4444",
    P2_HIGH: "#f97316",
    P3_MEDIUM: "#f59e0b",
    P4_LOW: "#3b82f6",
  }[alert.severity] || "#3b82f6";

  await resend.emails.send({
    from: FROM,
    to: [TO],
    subject: `[${alert.severity}] ${alert.title}`,
    html: `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: 'Inter', sans-serif; background: #0a0f1e; color: #cbd5e1; margin: 0; padding: 20px; }
  .card { background: #111b30; border: 1px solid ${severityColor}40; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; }
  .badge { display: inline-block; background: ${severityColor}20; color: ${severityColor}; border: 1px solid ${severityColor}40; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .title { font-size: 18px; font-weight: 700; color: white; margin: 16px 0 8px; }
  .message { font-family: monospace; background: #0a0f1e; border: 1px solid #1a2540; border-radius: 8px; padding: 16px; font-size: 12px; color: #94a3b8; white-space: pre-wrap; }
  .footer { margin-top: 16px; font-size: 11px; color: #475569; text-align: center; }
  a { color: #10b981; }
</style></head>
<body>
  <div class="card">
    <span class="badge">${alert.severity}</span>
    <div class="title">${alert.title}</div>
    <div class="message">${alert.message}</div>
    <div class="footer">
      Resume Buddy Monitor &middot; <a href="https://monitor.resume-buddy.tech">monitor.resume-buddy.tech</a>
    </div>
  </div>
</body>
</html>`,
  });
}
