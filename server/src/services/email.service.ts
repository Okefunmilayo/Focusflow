import sgMail from '@sendgrid/mail';
import { env } from '../config/env';

const isConfigured = () =>
  Boolean(env.sendgridApiKey) && env.sendgridApiKey.startsWith('SG.');

if (isConfigured()) {
  sgMail.setApiKey(env.sendgridApiKey);
}

const FROM = { email: env.emailFrom, name: 'FocusFlow' };

// ── Password Reset ────────────────────────────────────────────
export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string
): Promise<void> => {
  if (!isConfigured()) {
    console.log(`[Email] SendGrid not configured. Reset link for ${to}: ${resetUrl}`);
    return;
  }

  await sgMail.send({
    to,
    from: FROM,
    subject: 'Reset your FocusFlow password',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: #2563eb; padding: 32px; text-align: center;">
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: inline-block; line-height: 32px; text-align: center; font-size: 18px;">⚡</div>
                      <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">FocusFlow</span>
                    </div>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Reset your password</h1>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
                      We received a request to reset the password for your FocusFlow account.
                      Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
                    </p>
                    <div style="text-align: center; margin-bottom: 28px;">
                      <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
                        Reset Password
                      </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you didn't request a password reset, you can safely ignore this email.
                      Your password will not be changed.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                      FocusFlow · AI Productivity Planner<br />
                      <a href="${resetUrl}" style="color: #94a3b8; word-break: break-all;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
    text: `Reset your FocusFlow password\n\nClick the link below (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  });
};

// ── Welcome Email ─────────────────────────────────────────────
export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  if (!isConfigured()) {
    console.log(`[Email] SendGrid not configured. Skipping welcome email for ${to}`);
    return;
  }

  await sgMail.send({
    to,
    from: FROM,
    subject: 'Welcome to FocusFlow!',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px; text-align: center;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700;">⚡ FocusFlow</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 32px;">
                    <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Welcome, ${name}! 🎉</h1>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                      You're all set to supercharge your productivity with AI. Here's what you can do with FocusFlow:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      ${[
                        ['⚡', 'AI Goal Breakdown', 'Turn any big goal into a daily action plan'],
                        ['🍅', 'Pomodoro Timer', 'Stay focused with timed work sessions'],
                        ['📄', 'Document Analyser', 'Upload PDFs and get AI summaries + flashcards'],
                        ['📊', 'Weekly AI Digest', 'Get personalised productivity insights every Sunday'],
                      ].map(([icon, title, desc]) => `
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 36px; font-size: 20px;">${icon}</td>
                          <td style="padding: 10px 0 10px 12px; border-bottom: 1px solid #f1f5f9;">
                            <strong style="color: #0f172a; font-size: 14px;">${title}</strong>
                            <p style="color: #64748b; font-size: 13px; margin: 2px 0 0;">${desc}</p>
                          </td>
                        </tr>
                      `).join('')}
                    </table>
                    <div style="text-align: center;">
                      <a href="http://localhost:5173/dashboard" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
                        Go to Dashboard
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                      FocusFlow · AI Productivity Planner
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
    text: `Welcome to FocusFlow, ${name}!\n\nYou're all set. Visit your dashboard to get started:\nhttp://localhost:5173/dashboard`,
  });
};
