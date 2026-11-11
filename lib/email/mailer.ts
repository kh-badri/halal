import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(toEmail: string, resetToken: string, appUrl: string): Promise<boolean> {
  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[Email] SMTP not configured. Password reset link for ${toEmail}: ${resetLink}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Road To Halal <noreply@roadtohalal.id>',
      to: toEmail,
      subject: 'Reset Password Akun Road To Halal',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #FFE4EE; border-radius: 16px;">
          <h2 style="color: #1F6FDB; margin-bottom: 8px;">Road To Halal</h2>
          <h3 style="color: #5A1633;">Permintaan Reset Password</h3>
          <p style="color: #5A1633; font-size: 14px; line-height: 1.6;">
            Kami menerima permintaan untuk mereset password akun Road To Halal Anda. Klik tombol di bawah ini untuk membuat password baru. Tautan ini berlaku selama 30 menit.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #D94F86; color: #FFFFFF; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              Reset Password Saya
            </a>
          </div>
          <p style="color: #5A1633; font-size: 12px; line-height: 1.5;">
            Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut di browser Anda:<br />
            <a href="${resetLink}" style="color: #D94F86;">${resetLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #FFE4EE; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">Jika Anda tidak merasa meminta reset password, abaikan email ini dengan aman.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] Failed to send reset email:', error);
    return false;
  }
}
