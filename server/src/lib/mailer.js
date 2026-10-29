import nodemailer from "nodemailer";

// In development (or when SMTP isn't configured) we don't actually send email —
// we just log it to the console. This keeps local testing friction-free.
const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

let transporter = null;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendMail({ to, subject, text }) {
  const from = process.env.MAIL_FROM || "Requesto <no-reply@requesto.in>";

  if (!transporter) {
    // Dev fallback: print the email so you can see notifications working.
    console.log("\n--- EMAIL (dev, not sent) ---");
    console.log(`From:    ${from}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("--- end email ---\n");
    return;
  }

  await transporter.sendMail({ from, to, subject, text });
}
