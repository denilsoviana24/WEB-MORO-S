import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Envío de correos de la web de Moro's.
 *
 * Proveedor principal: Gmail SMTP con contraseña de aplicación
 *   GMAIL_USER=micorreo@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (16 letras, requiere 2FA activo)
 *
 * Respaldo: Resend (si Gmail falla o no está configurado)
 *   RESEND_API_KEY=...
 *
 * Opcional:
 *   MAIL_FROM_NAME=Moro's   (nombre visible del remitente)
 *   ORDERS_EMAIL=...        (correo del dueño)
 */

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
}

export type MailProvider = 'gmail' | 'resend' | 'none';

function gmailUser(): string {
  return (process.env.GMAIL_USER || '').trim();
}

function gmailPass(): string {
  // Gmail muestra la contraseña con espacios ("abcd efgh ijkl mnop")
  return (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
}

/** Qué proveedor se usará con la configuración actual. */
export function mailProvider(): MailProvider {
  if (gmailUser() && gmailPass()) return 'gmail';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'none';
}

function fromName(explicit?: string): string {
  return explicit || process.env.MAIL_FROM_NAME || "Moro's";
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  const user = gmailUser();
  const pass = gmailPass();
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    // Evita que un servidor colgado bloquee el pedido del cliente
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
  return cachedTransport;
}

async function sendViaGmail(payload: MailPayload): Promise<boolean> {
  const user = gmailUser();
  const html = payload.html;
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|tr|h[1-6]|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  const info = await getTransport().sendMail({
    from: `"${fromName(payload.fromName)}" <${user}>`,
    to: payload.to,
    replyTo: payload.replyTo || user,
    subject: payload.subject,
    html,
    text,
  });
  return Boolean(info?.accepted?.length);
}

async function sendViaResend(payload: MailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${fromName(payload.fromName)} <onboarding@resend.dev>`,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });
  if (!res.ok) {
    console.error('Resend error:', (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}

/**
 * Envía un correo: primero Gmail SMTP, y si falla cae a Resend.
 * Nunca lanza excepción (devuelve false si no se pudo).
 */
export async function sendEmail(payload: MailPayload): Promise<boolean> {
  const provider = mailProvider();
  if (provider === 'none') {
    console.warn('Sin proveedor de correo configurado (GMAIL_* o RESEND_API_KEY).');
    return false;
  }

  if (provider === 'gmail') {
    try {
      const ok = await sendViaGmail(payload);
      if (ok) return true;
      console.error('Gmail no aceptó el correo; probando Resend…');
    } catch (err) {
      console.error('Error Gmail SMTP:', err instanceof Error ? err.message : err);
    }
  }

  try {
    return await sendViaResend(payload);
  } catch (err) {
    console.error('Error enviando correo:', err instanceof Error ? err.message : err);
    return false;
  }
}

/** Correo del dueño (avisos de pedidos). */
export function ordersEmail(): string {
  return (process.env.ORDERS_EMAIL || gmailUser() || '').trim();
}
