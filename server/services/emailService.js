import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export const isEmailConfigured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    // Development fallback: print the email so the flow can be tested without SMTP.
    console.log(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] ${text}\n`);
    return { delivered: false };
  }
  await getTransporter().sendMail({ from: env.smtp.from, to, subject, text, html });
  return { delivered: true };
};
