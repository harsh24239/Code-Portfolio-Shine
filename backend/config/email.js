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
      greetingTimeout: 10000,
      socketTimeout: 10000,
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
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

export const sendContactEmailNotification = async ({ name, email, subject, message, messageId }) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim().replace(/\s+/g, '');
  const targetEmail = process.env.CONTACT_NOTIFY_EMAIL?.trim() || process.env.NOTIFY_EMAIL?.trim() || emailUser;
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();
  if (!targetEmail || (apiKey ? !fromEmail : !emailUser || !emailPass)) {
    console.info('Contact email is not configured. The message remains in the admin inbox.');
    return false;
  }

  const title = subject || 'Portfolio Contact';
  const text = `From: ${name} <${email}>\nSubject: ${title}\n\n${message}`;
  const html = `
    <div style="background:#f7f5f0;color:#262b2e;font-family:Arial,sans-serif;padding:32px;max-width:640px">
      <div style="background:#303a36;color:#f7f5f0;padding:20px 24px;font-size:12px;letter-spacing:2px">HARSH.DEV / NEW MESSAGE</div>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:normal">${escapeHtml(title)}</h1>
      <p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
      <div style="border-top:1px solid #bfc5bb;padding-top:24px;white-space:pre-wrap;line-height:1.7">${escapeHtml(message)}</div>
      <p style="color:#62696c;font-size:12px;margin-top:32px">Sent from your portfolio. Reply to this email to reach the sender.</p>
    </div>`;

  try {
    // HTTPS works on Render Free, where the usual Gmail SMTP ports are blocked.
    if (apiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(messageId ? { 'Idempotency-Key': `portfolio-contact-${messageId}` } : {}),
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          from: fromEmail,
          to: [targetEmail],
          reply_to: email,
          subject: `Portfolio / ${title}`,
          text,
          html,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.id !== 'string' || !result.id) {
        console.warn(`Contact email provider did not accept the message (HTTP ${response.status}).`);
        return false;
      }
      return true;
    }

    const transporter = createTransporter(emailUser, emailPass);
    const result = await transporter.sendMail({
      from: `"Harsh Portfolio" <${emailUser}>`, to: targetEmail, replyTo: email,
      subject: `Portfolio / ${title}`, text, html,
    });
    return Array.isArray(result.accepted) && result.accepted.length > 0;
  } catch {
    // Never log credentials, provider payloads or visitors' message contents.
    console.warn('Contact email could not be accepted. The message remains in the admin inbox.');
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
