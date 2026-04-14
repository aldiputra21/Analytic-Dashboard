import nodemailer from 'nodemailer';

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

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';
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

  if (!transporter) {
    console.info('[Auth] SMTP not configured. Password reset link:', input.resetLink);
    return;
  }

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text,
    html,
  });
}