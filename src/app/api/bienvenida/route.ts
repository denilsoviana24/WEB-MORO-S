import { NextResponse } from 'next/server';
import { varietyGridHtml } from '@/lib/emails';
import { sendEmail } from '@/lib/mailer';

/**
 * POST /api/bienvenida
 * Al crear una cuenta: envía correo de bienvenida con ofertas (Gmail SMTP,
 * respaldo Resend) y suscribe al cliente al newsletter (Mailchimp + Resend).
 * Todo tolerante a fallos.
 */
export async function POST(req: Request) {
  let body: { email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim() || 'amigo';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-moro-s-brhw.vercel.app';
  const results: Record<string, boolean> = { email: false, newsletter: false, resendContact: false };

  // 1) Suscribir al newsletter de Mailchimp (no bloquea si no está configurado)
  const mcKey = process.env.MAILCHIMP_API_KEY;
  const mcServer = process.env.MAILCHIMP_SERVER_PREFIX;
  const mcAudience = process.env.MAILCHIMP_AUDIENCE_ID;
  if (mcKey && mcServer && mcAudience) {
    try {
      const res = await fetch(
        `https://${mcServer}.api.mailchimp.com/3.0/lists/${mcAudience}/members`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`x:${mcKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: email,
            status: 'subscribed',
            merge_fields: { FNAME: name.slice(0, 50) },
            tags: ['web-moros', 'cuenta-creada'],
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      results.newsletter = res.ok || data?.title === 'Member Exists';
    } catch {
      // ignorar
    }
  }

  // 1b) Agregar a la audiencia de Resend (para usar Broadcasts)
  const resendKeyEarly = process.env.RESEND_API_KEY;
  const resendAudience = process.env.RESEND_AUDIENCE_ID;
  if (resendKeyEarly && resendAudience) {
    try {
      const res = await fetch(`https://api.resend.com/audiences/${resendAudience}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKeyEarly}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, first_name: name.slice(0, 50), unsubscribed: false }),
      });
      results.resendContact = res.ok || res.status === 409;
    } catch {
      // ignorar
    }
  }

  // 2) Correo de bienvenida con ofertas (Gmail SMTP, respaldo Resend)
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0f0a06;color:#fafafa;padding:32px 24px;border-radius:16px;">
      <h1 style="margin:0;">🍔 ¡Bienvenido al Club Moro's, ${name}!</h1>
      <p style="color:#d4d4d8;">Tu cuenta está lista. Guarda sellos con cada pedido y recibe nuestras promos.</p>
      <div style="background:#78350f;border:2px dashed #f59e0b;border-radius:12px;padding:16px;text-align:center;margin:20px 0;">
        <p style="margin:0;color:#fbbf24;font-size:12px;letter-spacing:2px;">TU CUPÓN DE BIENVENIDA</p>
        <p style="margin:8px 0;font-size:28px;letter-spacing:4px;"><strong>MOROS10</strong></p>
        <p style="margin:0;color:#d4d4d8;font-size:13px;">10% OFF en tu pedido mayor a $5. Menciónalo en caja o por WhatsApp.</p>
      </div>
      <h3 style="color:#fbbf24;">🍔 Empieza por lo más pedido</h3>
      ${varietyGridHtml(4)}
      <h3 style="color:#fbbf24;margin-top:20px;">⭐ Lo que te espera:</h3>
      <ul style="color:#d4d4d8;line-height:1.9;font-size:14px;">
        <li>🍟 1 sello por cada pedido → con 20 te regalamos una <strong>Papi Completa</strong></li>
        <li>🥉 Bronce: Salchipapa gratis · 🥈 Plata: Bebida grande gratis · 🥇 Oro: Picaditas gratis</li>
        <li>🎟️ Cupones exclusivos cada semana en tu correo</li>
      </ul>
      <div style="text-align:center;margin:24px 0;">
        <a href="${siteUrl}/#menu" style="background:#f59e0b;color:#09090b;font-weight:bold;padding:12px 28px;border-radius:12px;text-decoration:none;">Ver el menú</a>
        &nbsp;
        <a href="${siteUrl}/promociones" style="border:1px solid #f59e0b;color:#fbbf24;font-weight:bold;padding:12px 28px;border-radius:12px;text-decoration:none;">Promociones</a>
      </div>
      <p style="color:#71717a;font-size:12px;text-align:center;">Av. Veintimilla y Pasaje Atahualpa, Tulcán · Lun-Dom 17:00–23:00<br>¡Buen provecho! 🔥</p>
    </div>`;
  results.email = await sendEmail({
    to: email,
    subject: `🎉 Bienvenido al Club Moro's, ${name} — tienes un cupón`,
    html,
    fromName: "Moro's Club",
  });

  return NextResponse.json(results);
}
