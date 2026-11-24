// Sends email through SMTP when SMTP_HOST is set; otherwise prints it to the console (dev mode).
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transport = null;
function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transport;
}

// Test hook: every sent mail is pushed here so tests can read verification links.
export const sentMail = [];

export async function sendMail({ to, subject, text, html }) {
  sentMail.push({ to, subject, text, html });
  if (env.isTest) return;
  if (!env.smtp.host) {
    console.log(`\n--- EMAIL to ${to} ---\n${subject}\n${text}\n--- end email ---\n`);
    return;
  }
  await getTransport().sendMail({ from: env.mailFrom, to, subject, text, html });
}
