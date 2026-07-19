const nodemailer = require('nodemailer');

let transporterPromise = null;

/**
 * Lazily builds the Nodemailer transporter.
 * - If EMAIL_USER/EMAIL_PASS are set, uses real SMTP credentials.
 * - Otherwise auto-provisions a free Ethereal test inbox so emails can still
 *   be sent and previewed (logged to console) without any real credentials.
 */
const getTransporter = async () => {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }

    // Mock mode — Ethereal generates a disposable inbox for dev/testing.
    const testAccount = await nodemailer.createTestAccount();
    console.log(
      '[email] No EMAIL_USER/EMAIL_PASS set — using Ethereal test inbox. Emails will not reach real recipients; preview URLs will be logged instead.'
    );

    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  })();

  return transporterPromise;
};

module.exports = { getTransporter };
