import nodemailer from 'nodemailer';
import { escapeHtml } from '../utils/validation.js';

const createTransporter = (cleanUser, cleanPass) => {
  const serviceConfig = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();
  
  if (serviceConfig === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: process.env.EMAIL_SECURE !== 'false',
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    connectionTimeout: 10000,
  });
};

export const sendContactEmailNotification = async ({ name, email, subject, message }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const targetEmail = process.env.NOTIFY_EMAIL || process.env.EMAIL_USER;

  if (!emailUser || !emailPass) {
    console.log(`ℹ Email notification skipped (EMAIL_USER / EMAIL_PASS env vars not set). Message logged to Admin Inbox.`);
    return false;
  }

  const cleanUser = emailUser.trim();
  const cleanPass = emailPass.trim().replace(/\s+/g, '');
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || 'Portfolio Contact');
  const safeMessage = escapeHtml(message);

  try {
    const transporter = createTransporter(cleanUser, cleanPass);

    const mailOptions = {
      from: `"Portfolio Contact System" <${cleanUser}>`,
      to: targetEmail,
      replyTo: email,
       subject: `📥 New Transmission: ${subject || 'Portfolio Contact'}`,
      html: `
        <div style="font-family: monospace, sans-serif; background-color: #0a0000; color: #f7e8e8; padding: 2rem; border: 1px solid #4a1818;">
          <div style="color: #ff6060; font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; border-bottom: 1px solid #4a1818; padding-bottom: 0.5rem;">
            影 SHADOW HQ // NEW TRANSMISSION
          </div>
           <p><strong style="color: #ff6060;">SENDER NAME:</strong> ${safeName}</p>
           <p><strong style="color: #ff6060;">SENDER EMAIL:</strong> <a href="mailto:${safeEmail}" style="color: #ff6060;">${safeEmail}</a></p>
           <p><strong style="color: #ff6060;">SUBJECT:</strong> ${safeSubject}</p>
          <p><strong style="color: #ff6060;">TIMESTAMP:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border-color: #4a1818; margin: 1.5rem 0;" />
           <div style="background-color: #1f0505; border: 1px solid #4a1818; padding: 1rem; color: #f7e8e8; white-space: pre-wrap; font-size: 0.95rem;">${safeMessage}</div>
          <p style="font-size: 0.8rem; color: #8c8080; margin-top: 1.5rem;">This message was automatically forwarded from your Portfolio Contact Form.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Email notification sent successfully to ${targetEmail}`);
    return true;
  } catch (error) {
    console.warn(`⚠ Failed to send email notification (${cleanUser}): ${error.message}`);
    return false;
  }
};

export const sendPasswordResetOTP = async ({ otpCode, actionName = 'Security Verification' }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const targetEmail = process.env.NOTIFY_EMAIL || process.env.EMAIL_USER;

  if (!emailUser || !emailPass) {
    console.log(`ℹ ${actionName} OTP [ ${otpCode} ] generated for Admin verification.`);
    return false;
  }

  const cleanUser = emailUser.trim();
  const cleanPass = emailPass.trim().replace(/\s+/g, '');
  const safeActionName = escapeHtml(actionName);
  const safeOtpCode = escapeHtml(otpCode);

  try {
    const transporter = createTransporter(cleanUser, cleanPass);

    const mailOptions = {
      from: `"Shadow HQ Security" <${cleanUser}>`,
      to: targetEmail,
      subject: `🔒 Admin Security OTP (${actionName}): ${otpCode}`,
      html: `
        <div style="font-family: monospace, sans-serif; background-color: #0a0000; color: #f7e8e8; padding: 2rem; border: 1px solid #4a1818;">
          <div style="color: #ff6060; font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; border-bottom: 1px solid #4a1818; padding-bottom: 0.5rem;">
            影 SHADOW HQ // SECURITY VERIFICATION
          </div>
           <p>An Admin security request (<strong>${safeActionName}</strong>) was initiated for your portfolio dashboard.</p>
          <div style="background-color: #1f0505; border: 1px dashed #ff6060; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
            <div style="font-size: 0.85rem; color: #8c8080; letter-spacing: 0.2em; margin-bottom: 0.5rem;">YOUR 6-DIGIT VERIFICATION CODE</div>
             <div style="font-size: 2.5rem; font-weight: bold; color: #ff6060; letter-spacing: 0.3em;">${safeOtpCode}</div>
          </div>
          <p style="font-size: 0.85rem; color: #8c8080;">This code is valid for 10 minutes. If you did not initiate this request, please change your credentials immediately.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ OTP Email (${actionName}) sent to ${targetEmail}`);
    return true;
  } catch (error) {
    console.warn(`⚠ Failed to send OTP email (${cleanUser}): ${error.message}`);
    return false;
  }
};
