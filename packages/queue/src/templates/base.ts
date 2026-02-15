// ============ Base Email Layout ============
// Shared layout wrapper for all email templates

const BRAND_COLOR = '#3b82f6';
const BRAND_DARK = '#2563eb';

export function baseLayout(content: string, options: { preheader?: string } = {}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ResumeBuddy</title>
  ${options.preheader ? `<span style="display:none;font-size:0;line-height:0;max-height:0;mso-hide:all;overflow:hidden;">${options.preheader}</span>` : ''}
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI',Arial,Helvetica,sans-serif; background-color:#f4f4f5; -webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR},${BRAND_DARK}); padding:28px 40px; border-radius:12px 12px 0 0; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.3px;">ResumeBuddy</h1>
              <p style="color:#dbeafe; margin:6px 0 0; font-size:13px;">AI-Powered Resume Builder</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff; padding:36px 40px; border-radius:0 0 12px 12px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; text-align:center;">
              <p style="color:#94a3b8; font-size:12px; margin:0 0 8px; line-height:1.5;">
                &copy; ${new Date().getFullYear()} ResumeBuddy. All rights reserved.
              </p>
              <p style="color:#94a3b8; font-size:11px; margin:0;">
                <a href="{{{unsubscribeUrl}}}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="{{{privacyUrl}}}" style="color:#94a3b8; text-decoration:underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ctaButton(text: string, url: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
  <tr>
    <td align="center">
      <a href="${url}" style="display:inline-block; background:linear-gradient(135deg,${BRAND_COLOR},${BRAND_DARK}); color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:600; letter-spacing:0.2px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

export function infoBox(content: string): string {
  return `
<div style="background:#f0f9ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px 20px; margin:20px 0;">
  ${content}
</div>`;
}
