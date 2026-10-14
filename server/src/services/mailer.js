const nodemailer = require("nodemailer");

// Two ways to send email, checked in this order:
//  1. Any SMTP service (we use Brevo: smtp-relay.brevo.com) — SMTP_HOST,
//     SMTP_USER, SMTP_PASS, and MAIL_FROM (a sender verified in Brevo).
//  2. A Gmail account with a Google App Password (not the normal Gmail
//     password — Google rejects those) — GMAIL_USER, GMAIL_APP_PASSWORD.
// Created lazily so the server still boots when email isn't configured yet.
let transporter = null;

function smtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT) || 587;
    return { host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } };
  }
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    return { service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s+/g, "") } };
  }
  return null;
}

function fromAddress() {
  return process.env.MAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER;
}

function getTransporter() {
  const config = smtpConfig();
  if (!config) return null;
  if (!transporter) transporter = nodemailer.createTransport(config);
  return transporter;
}

function isMailerConfigured() {
  return Boolean(getTransporter());
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) throw new Error("Email is not configured. Set the SMTP_* (Brevo) or GMAIL_* settings.");
  await t.sendMail({ from: `"RentaFlow" <${fromAddress()}>`, to, subject, text, html });
}

module.exports = { sendMail, isMailerConfigured };
