import { NextResponse } from 'next/server';

/**
 * POST /api/pagos/kushki
 * Cobra una tarjeta tokenizada con Kushki.js en el frontend.
 *
 * Requiere en Vercel / .env.local (SOLO servidor):
 *   KUSHKI_PRIVATE_KEY=...   (credencial privada de Kushki)
 *   KUSHKI_ENV=test|production (por defecto: test)
 *
 * IMPORTANTE: valida este flujo con las tarjetas de prueba de Kushki
 * (https://docs.kushkipagos.com) antes de recibir pagos reales.
 * El IVA se envía en 0: ajústalo con tu contador según tu facturación.
 */
export async function POST(req: Request) {
  const privateKey = process.env.KUSHKI_PRIVATE_KEY;

  if (!privateKey) {
    return NextResponse.json(
      { error: 'NOT_CONFIGURED', message: 'Kushki aún no configurado.' },
      { status: 501 }
    );
  }

  let body: { token?: string; amount?: number; orderNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const total = Number(body.amount || 0);
  if (!body.token || !(total > 0)) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const base =
    process.env.KUSHKI_ENV === 'production'
      ? 'https://api.kushki.com'
      : 'https://api-uat.kushki.com';

  try {
    const res = await fetch(`${base}/v1/charges`, {
      method: 'POST',
      headers: {
        'Private-Merchant-Id': privateKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: body.token,
        amount: {
          subtotalIva: 0,
          subtotalIva0: Number(total.toFixed(2)),
          iva: 0,
          currency: 'USD',
        },
        fullResponse: true,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Kushki error:', JSON.stringify(data).slice(0, 300));
      return NextResponse.json(
        { error: 'DECLINED', message: 'La tarjeta fue rechazada. Verifica los datos o usa otro método.' },
        { status: 402 }
      );
    }

    const ticket =
      data?.ticketNumber || data?.details?.ticketNumber || body.orderNumber || '';
    return NextResponse.json({ approved: true, ticket });
  } catch (err) {
    console.error('Error cobrando con Kushki:', err);
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
  }
}
