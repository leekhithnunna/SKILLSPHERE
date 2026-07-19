const nodemailer = require('nodemailer');
const { getTransporter } = require('../config/email');

/**
 * Sends an email. In mock mode (no EMAIL_USER/PASS configured) this hits an
 * Ethereal test inbox and logs a preview URL instead of a real mailbox.
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'SkillSphere <no-reply@skillsphere.dev>',
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[email] Preview URL for "${subject}" to ${to}: ${previewUrl}`);
  }

  return info;
};

module.exports = sendEmail;
