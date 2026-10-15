import { NextResponse } from 'next/server';

/**
 * POST /api/newsletter
 * Suscribe un correo a la audiencia de Mailchimp (newsletter de promos).
 *
 * Requiere en Vercel / .env.local (SOLO servidor, sin NEXT_PUBLIC_):
 *   MAILCHIMP_API_KEY=...       (Account → Extras → API keys)
 *   MAILCHIMP_SERVER_PREFIX=... (ej: us21 — son las letras tras el "-" de tu API key)
 *   MAILCHIMP_AUDIENCE_ID=...   (Audience → Settings → Audience ID)
 */
export async function POST(req: Request) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !server || !audienceId) {
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 501 });
  }

  let body: { email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
  }

  // También agregar a la audiencia de Resend (para Broadcasts), sin bloquear
  const resendKey = process.env.RESEND_API_KEY;
  const resendAudience = process.env.RESEND_AUDIENCE_ID;
  if (resendKey && resendAudience) {
    try {
      await fetch(`https://api.resend.com/audiences/${resendAudience}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, first_name: name.slice(0, 50), unsubscribed: false }),
      }).catch(() => {});
    } catch {
      // ignorar
    }
  }

  try {
    const res = await fetch(
      `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`x:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: { FNAME: name.slice(0, 50) },
          tags: ['web-moros'],
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return NextResponse.json({ subscribed: true });
    }
    // Ya estaba suscrito → también cuenta como éxito
    if (data?.title === 'Member Exists') {
      return NextResponse.json({ subscribed: true, already: true });
    }
    console.error('Mailchimp error:', JSON.stringify(data).slice(0, 300));
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
  } catch (err) {
    console.error('Error suscribiendo newsletter:', err);
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
  }
}
