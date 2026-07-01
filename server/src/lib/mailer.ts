import { env } from "./env";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Sends an invitation email via the Brevo HTTP API. Never throws — returns
 * whether the email was sent.
 *
 * Render blocks outbound SMTP, so we use Brevo's transactional email HTTP API
 * instead of nodemailer/SMTP. If BREVO_API_KEY is not configured this is a
 * no-op that logs the invite link (fallback) and returns false.
 *
 * The request is bounded by a ~10s timeout (AbortController) so a slow/hung
 * Brevo call can never block the HTTP request that triggered it.
 */
export async function sendInvite(email: string, url: string): Promise<boolean> {
  if (!env.BREVO_API_KEY) {
    console.log(
      `[mailer] BREVO_API_KEY no configurado, link de invitación para ${email}: ${url}`
    );
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body = {
      sender: {
        email: env.MAIL_FROM,
        name: env.MAIL_FROM_NAME || "Gym Tracker",
      },
      to: [{ email }],
      subject: "Invitación a Gym Tracker",
      htmlContent: `<p>Has sido invitado a <strong>Gym Tracker</strong>.</p><p><a href="${url}">Acepta tu invitación</a></p><p>O copia este enlace: ${url}</p>`,
      textContent: `Has sido invitado a Gym Tracker. Acepta aquí: ${url}`,
    };

    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[mailer] Brevo respondió ${res.status} enviando a ${email}: ${detail}`
      );
      return false;
    }

    console.log(`[mailer] invitación enviada a ${email} vía Brevo`);
    return true;
  } catch (err) {
    console.error(`[mailer] error enviando invitación a ${email}:`, err);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
