import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends an invitation email. Never throws — returns whether the email was sent.
 * If SMTP is not configured, logs the invite link and returns false (no-op).
 */
export async function sendInvite(email: string, url: string): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) {
    console.log(`[mailer] SMTP no configurado, link de invitación para ${email}: ${url}`);
    return false;
  }

  try {
    await tx.sendMail({
      from: env.MAIL_FROM || env.SMTP_USER,
      to: email,
      subject: "Invitación a Gym Tracker",
      text: `Has sido invitado a Gym Tracker. Acepta tu invitación aquí: ${url}`,
      html: `<p>Has sido invitado a <strong>Gym Tracker</strong>.</p>
             <p><a href="${url}">Acepta tu invitación</a></p>
             <p>O copia este enlace: ${url}</p>`,
    });
    console.log(`[mailer] invitación enviada a ${email}`);
    return true;
  } catch (err) {
    console.error(`[mailer] error enviando invitación a ${email}:`, err);
    return false;
  }
}
