import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { retryWithBackoff } from './retryWithBackoff';

interface EmailInput {
  email: string;
  fullName: string;
}

interface PasswordResetEmailInput {
  to: string;
  fullName: string;
  resetLink: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Load HTML email template from file
 */
function loadEmailTemplate(templateName: string): string {
  try {
    const templatePath = join(process.cwd(), 'src', 'templates', 'email', `${templateName}.html`);
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`[Email] Failed to load template ${templateName}:`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Replace placeholders in template with actual values
 */
function replaceTemplatePlaceholders(
  template: string,
  replacements: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

/**
 * Send activation email to new user
 * Requirements: 26.3, 26.6, 26.9
 */
export async function sendActivationEmail(
  user: EmailInput,
  token: string,
  lang: 'id' | 'en' = 'id',
): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';

  if (!transporter) {
    console.info('[Email] SMTP not configured. Activation token:', token);
    return;
  }

  const templateName = `activation-${lang}`;
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  const activationLink = `${baseUrl}/activate-account?token=${token}`;

  const subject = lang === 'id' ? 'Aktivasi Akun - Corporate Finance Dashboard' : 'Account Activation - Corporate Finance Dashboard';

  try {
    const htmlTemplate = loadEmailTemplate(templateName);
    const html = replaceTemplatePlaceholders(htmlTemplate, {
      fullName: user.fullName,
      activationLink,
      baseUrl,
    });

    await retryWithBackoff(
      () =>
        transporter.sendMail({
          from,
          to: user.email,
          subject,
          html,
        }),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        shouldRetry: (error) => {
          // Retry on network errors or 5xx errors
          if (error instanceof TypeError) return true;
          if (error instanceof Error && error.message.includes('ECONNREFUSED')) return true;
          if (error instanceof Error && error.message.includes('ETIMEDOUT')) return true;
          return false;
        },
      },
    );

    console.info(`[Email] Activation email sent to ${user.email}`);
  } catch (error) {
    console.error(`[Email] Failed to send activation email to ${user.email}:`, error);
    throw error;
  }
}

/**
 * Send password reset email to user
 * Requirements: 26.4, 26.7, 26.9
 */
export async function sendPasswordResetEmail(
  user: EmailInput,
  token: string,
  lang?: 'id' | 'en',
): Promise<void>;
export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
export async function sendPasswordResetEmail(
  userOrInput: EmailInput | PasswordResetEmailInput,
  token?: string,
  lang?: 'id' | 'en',
): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';
  const langValue = lang || 'id';

  if (!transporter) {
    // Handle legacy call
    if ('resetLink' in userOrInput) {
      console.info('[Email] SMTP not configured. Password reset link:', userOrInput.resetLink);
    } else {
      console.info('[Email] SMTP not configured. Password reset token:', token);
    }
    return;
  }

  try {
    // Handle new signature: sendPasswordResetEmail(user, token, lang)
    if ('resetLink' in userOrInput) {
      // Legacy signature
      const input = userOrInput as PasswordResetEmailInput;
      const subject = 'Reset Password - Corporate Finance Dashboard';
      const text = [
        `Halo ${input.fullName},`,
        '',
        'Kami menerima permintaan reset password untuk akun Anda.',
        'Klik link berikut untuk mengatur password baru:',
        input.resetLink,
        '',
        'Link ini berlaku selama 1 jam dan hanya dapat digunakan satu kali.',
        'Jika Anda tidak meminta reset password, abaikan email ini.',
      ].join('\n');

      const html = `
        <div style="font-family: Inter, Arial, sans-serif; color: #1c1b1b; line-height: 1.6;">
          <p>Halo ${input.fullName},</p>
          <p>Kami menerima permintaan reset password untuk akun Anda.</p>
          <p>
            <a href="${input.resetLink}" style="display:inline-block;padding:12px 20px;background:#ba0015;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">
              Reset Password
            </a>
          </p>
          <p>Atau buka link berikut secara manual:</p>
          <p><a href="${input.resetLink}">${input.resetLink}</a></p>
          <p>Link ini berlaku selama 1 jam dan hanya dapat digunakan satu kali.</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `;

      await transporter.sendMail({
        from,
        to: input.to,
        subject,
        text,
        html,
      });
    } else {
      // New signature: sendPasswordResetEmail(user, token, lang)
      const user = userOrInput as EmailInput;
      const templateName = `password-reset-${langValue}`;
      const baseUrl = process.env.APP_URL || 'http://localhost:5000';
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      const subject = langValue === 'id' ? 'Reset Password - Corporate Finance Dashboard' : 'Password Reset - Corporate Finance Dashboard';

      const htmlTemplate = loadEmailTemplate(templateName);
      const html = replaceTemplatePlaceholders(htmlTemplate, {
        fullName: user.fullName,
        resetLink,
        baseUrl,
      });

      await retryWithBackoff(
        () =>
          transporter.sendMail({
            from,
            to: user.email,
            subject,
            html,
          }),
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          shouldRetry: (error) => {
            // Retry on network errors or 5xx errors
            if (error instanceof TypeError) return true;
            if (error instanceof Error && error.message.includes('ECONNREFUSED')) return true;
            if (error instanceof Error && error.message.includes('ETIMEDOUT')) return true;
            return false;
          },
        },
      );

      console.info(`[Email] Password reset email sent to ${user.email}`);
    }
  } catch (error) {
    console.error(`[Email] Failed to send password reset email:`, error);
    throw error;
  }
}