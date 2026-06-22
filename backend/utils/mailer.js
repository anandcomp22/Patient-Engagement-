const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Centralized email utility for AidME platform.
 * Used by: appointment confirmations, reminders, prescription delivery.
 * 
 * Uses MAIL_USER / MAIL_PASS from .env (Gmail App Password).
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send an email using the shared transporter.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @param {Array} attachments - Optional nodemailer attachments array
 * @returns {Promise} - nodemailer send result
 */
async function sendEmail(to, subject, html, attachments = []) {
  const mailOptions = {
    from: `"AidME Healthcare" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] ✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[Mailer] ❌ Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

module.exports = { sendEmail, transporter };
