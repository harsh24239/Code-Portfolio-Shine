import nodemailer from 'nodemailer';

export const sendContactEmailNotification = async ({ name, email, subject, message }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const targetEmail = process.env.NOTIFY_EMAIL || 'kumarharsh1851@gmail.com';

  if (!emailUser || !emailPass) {
    console.log(`ℹ Email notification skipped (EMAIL_USER / EMAIL_PASS env vars not set). Message logged to Admin Inbox.`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"Portfolio Contact System" <${emailUser}>`,
      to: targetEmail,
      replyTo: email,
      subject: `📥 New Transmission: ${subject || 'Portfolio Contact'}`,
      html: `
        <div style="font-family: monospace, sans-serif; background-color: #0a0000; color: #f7e8e8; padding: 2rem; border: 1px solid #4a1818;">
          <div style="color: #ff6060; font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; border-bottom: 1px solid #4a1818; padding-bottom: 0.5rem;">
            影 SHADOW HQ // NEW TRANSMISSION
          </div>
          <p><strong style="color: #ff6060;">SENDER NAME:</strong> ${name}</p>
          <p><strong style="color: #ff6060;">SENDER EMAIL:</strong> <a href="mailto:${email}" style="color: #ff6060;">${email}</a></p>
          <p><strong style="color: #ff6060;">SUBJECT:</strong> ${subject}</p>
          <p><strong style="color: #ff6060;">TIMESTAMP:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border-color: #4a1818; margin: 1.5rem 0;" />
          <div style="background-color: #1f0505; border: 1px solid #4a1818; padding: 1rem; color: #f7e8e8; white-space: pre-wrap; font-size: 0.95rem;">${message}</div>
          <p style="font-size: 0.8rem; color: #8c8080; margin-top: 1.5rem;">This message was automatically forwarded from your Portfolio Contact Form.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Email notification sent successfully to ${targetEmail}`);
    return true;
  } catch (error) {
    console.warn(`⚠ Failed to send email notification: ${error.message}`);
    return false;
  }
};
