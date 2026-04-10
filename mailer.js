/**
 * config/mailer.js
 * Nodemailer transporter + branded OTP email template.
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendOTPEmail(email, otp) {
  const isDevMode = !process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com';

  if (isDevMode) {
    console.log(`\n📧 [DEV MODE] OTP for ${email}: ${otp}\n`);
    return { messageId: 'dev-mode' };
  }

  return transporter.sendMail({
    from:    `"ElectionChain" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to:      email,
    subject: '🗳️ Your ElectionChain Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;
                  background:#f5f2ee;padding:32px;border-radius:16px;">
        <div style="background:#1a2e52;border-radius:12px;padding:24px;
                    text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:1.4rem;">🗳️ ElectionChain</h1>
          <p style="color:rgba(255,255,255,.7);font-size:.9rem;margin:4px 0 0;">
            Secure Democratic Voting
          </p>
        </div>
        <h2 style="color:#1a2e52;">Your Verification Code</h2>
        <p style="color:#475569;">Use this 6-digit code to verify your email:</p>
        <div style="background:#fff;border:2px solid #1a2e52;border-radius:12px;
                    padding:24px;text-align:center;margin:20px 0;">
          <div style="font-size:2.5rem;font-weight:900;letter-spacing:12px;color:#1a2e52;">
            ${otp}
          </div>
          <p style="color:#94a3b8;font-size:.8rem;margin:8px 0 0;">Valid for 10 minutes</p>
        </div>
        <p style="color:#94a3b8;font-size:.8rem;">
          Do not share this code with anyone. ElectionChain will never ask for it.
        </p>
      </div>`,
  });
}

module.exports = { sendOTPEmail };
