import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.smtpHost || "smtp.gmail.com",
  port: env.smtpPort || 465,
  secure: (env.smtpPort || 465) === 465,
  auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
});

export async function sendOtpEmail(to: string, code: string, purpose: "verify_email" | "reset_password") {
  const isVerify = purpose === "verify_email";
  const subject = isVerify ? "🔐 Verify your TrueHire Account — Code: " + code : "🔑 Reset your TrueHire Password — Code: " + code;

  const plainText = isVerify
    ? `Welcome to TrueHire!\n\nYour 6-digit verification code is: ${code}\n\nThis code expires in 10 minutes. Please do not share it with anyone.`
    : `Reset your TrueHire password.\n\nYour 6-digit password reset code is: ${code}\n\nThis code expires in 10 minutes.`;

  // Split code into individual digits for the box UI
  const codeDigits = code.split("");

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1F2937;">
  <!-- Preview text -->
  <div style="display: none; font-size: 1px; color: #F3F4F6; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your TrueHire verification code is ${code}. Valid for 10 minutes.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main White Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
          
          <!-- Top Accent Teal Gradient Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #0D9488 0%, #14B8A6 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #F3F4F6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Verified Beacon Mark -->
                    <table role="presentation" cellspacing="0" cellpadding="0" style="display: inline-table;">
                      <tr>
                        <td style="background-color: #F0FDFA; border: 1.5px solid #99F6E4; border-radius: 8px; width: 34px; height: 34px; text-align: center; vertical-align: middle;">
                          <span style="color: #0D9488; font-size: 17px; font-weight: 800; line-height: 1;">✦</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">True<span style="color: #0D9488;">Hire</span></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 12px; background-color: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 99px; font-size: 11px; font-weight: 700; color: #0F766E; text-transform: uppercase; letter-spacing: 0.8px;">
                      Security Code
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px 24px 36px;">
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.3px; line-height: 1.3;">
                ${isVerify ? "Confirm your email address" : "Reset your password"}
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 14.5px; line-height: 1.6; color: #4B5563;">
                ${
                  isVerify
                    ? "Welcome to TrueHire. Enter the 6-digit verification code below to verify your email and unlock verified tech opportunities."
                    : "We received a request to reset your TrueHire account password. Enter the code below to proceed."
                }
              </p>

              <!-- 6-Box Clean White/Teal Passcode Card -->
              <div style="background-color: #F9FAFB; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 24px 16px; text-align: center; margin-bottom: 28px;">
                <span style="display: block; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">
                  Your One-Time Passcode
                </span>

                <!-- 6 Digit Boxes -->
                <table role="presentation" align="center" cellspacing="8" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    ${codeDigits
                      .map(
                        (digit) => `
                      <td width="48" height="54" align="center" valign="middle" style="background-color: #FFFFFF; border: 2px solid #0D9488; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 28px; font-weight: 800; color: #0F766E; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.08);">
                        ${digit}
                      </td>
                    `
                      )
                      .join("")}
                  </tr>
                </table>
              </div>

              <!-- Security Info Callout Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                <tr>
                  <td width="22" valign="top" style="font-size: 15px; padding-top: 1px;">⏱️</td>
                  <td style="font-size: 13px; line-height: 1.5; color: #134E4A; padding-left: 8px;">
                    <strong style="color: #0F766E;">Valid for 10 minutes:</strong> For your security, this code cannot be used after 10 minutes. Never share this code with anyone.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #6B7280;">
                If you didn't create an account or request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; background-color: #F9FAFB; border-top: 1px solid #F3F4F6; text-align: left;">
              <p style="margin: 0 0 6px 0; font-size: 12.5px; font-weight: 600; color: #4B5563;">
                TrueHire — Real jobs, verified hiring intent, zero ghost postings.
              </p>
              <p style="margin: 0; font-size: 11.5px; color: #9CA3AF; line-height: 1.5;">
                This is an automated security transmission. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Always log to terminal in development
  console.log(`\x1b[36m[TrueHire Mailer]\x1b[0m OTP for \x1b[33m${to}\x1b[0m is: \x1b[32m\x1b[1m${code}\x1b[0m`);

  // 1. Try Resend HTTP API (if key starts with re_)
  if (env.smtpPass && env.smtpPass.startsWith("re_")) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.smtpPass}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.mailFrom || "TrueHire <onboarding@resend.dev>",
          to: [to],
          subject,
          text: plainText,
          html: htmlBody,
        }),
      });

      if (res.ok) {
        console.log(`\x1b[32m[Resend API]\x1b[0m Email sent successfully to ${to}`);
        return;
      }
    } catch (apiErr) {
      console.warn(`[Resend API] Fallback to SMTP:`, apiErr);
    }
  }

  // 2. SMTP Transport
  if (env.smtpHost) {
    try {
      await transporter.sendMail({
        from: env.mailFrom || `TrueHire Security <${env.smtpUser}>`,
        replyTo: "no-reply@truehire.dev",
        to,
        subject,
        text: plainText,
        html: htmlBody,
      });
      console.log(`\x1b[32m[SMTP]\x1b[0m Email successfully delivered via SMTP to ${to}`);
    } catch (smtpErr) {
      console.error(`\x1b[31m[SMTP Error]\x1b[0m Error sending to ${to}:`, smtpErr);
    }
  }
}
