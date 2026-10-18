import { getPopular, PROMOTIONS } from '@/data/assistantData';
import { sendEmail } from '@/lib/mailer';

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://web-moro-s-brhw.vercel.app';
}

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Grilla de platos destacados con precio (para correos). */
export function varietyGridHtml(count = 6): string {
  const items = getPopular(count);
  let rows = '';
  for (let i = 0; i < items.length; i += 2) {
    const cells = items
      .slice(i, i + 2)
      .map(
        (it) => `
        <td style="width:50%;padding:10px;background:#1c1917;border-radius:10px;">
          <strong style="color:#fafafa;font-size:14px;">${esc(it.name)}</strong><br>
          <span style="color:#fbbf24;font-weight:bold;">$${it.price.toFixed(2)}</span>
        </td>`
      )
      .join('<td style="width:8px;"></td>');
    rows += `<tr>${cells}</tr><tr><td colspan="3" style="height:8px;"></td></tr>`;
  }
  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

function promosHtml(): string {
  return PROMOTIONS.slice(0, 2)
    .map(
      (p) => `
      <p style="background:#1c1917;border-radius:10px;padding:10px 14px;margin:8px 0;font-size:14px;color:#d4d4d8;">
        🔥 <strong style="color:#fafafa;">${esc(p.title)}</strong> — <span style="color:#fbbf24;font-weight:bold;">$${p.price.toFixed(2)}</span>
      </p>`
    )
    .join('');
}

/**
 * Correo con variedad de platos + promos.
 * reason: 'welcome' (cuenta nueva) | 'comeback' (volvió tras días sin entrar)
 */
export async function sendVarietyEmail(
  to: string,
  name: string,
  reason: 'welcome' | 'comeback' = 'comeback'
): Promise<boolean> {
  const firstName = (name || 'amigo').split(' ')[0];
  const subject =
    reason === 'welcome'
      ? `🍔 ${firstName}, mira todo lo rico que te espera en Moro's`
      : `🍔 Te extrañamos, ${firstName} — mira lo que hay de nuevo en Moro's`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0a06;color:#fafafa;padding:32px 24px;border-radius:16px;">
    <h1 style="margin:0;">${reason === 'welcome' ? '🍔 ¡Pide tu favorito!' : '🍔 ¡Vuelve por tu favorito!'}</h1>
    <p style="color:#d4d4d8;">Hola ${esc(firstName)}, esto es lo más pedido de la casa esta semana 👇</p>
    ${varietyGridHtml(6)}
    <h3 style="color:#fbbf24;margin:20px 0 8px;">🎟️ Promos activas</h3>
    ${promosHtml()}
    <div style="text-align:center;margin:24px 0;">
      <a href="${siteUrl()}/#menu" style="background:#f59e0b;color:#09090b;font-weight:bold;padding:12px 28px;border-radius:12px;text-decoration:none;">Pedir ahora</a>
    </div>
    <p style="color:#71717a;font-size:12px;text-align:center;">Av. Veintimilla y Pasaje Atahualpa, Tulcán · Lun-Dom 17:00–23:00</p>
  </div>`;

  return sendEmail({
    to,
    subject,
    html,
    fromName: "Moro's Club",
  });
}
