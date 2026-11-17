import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';
import { markOrderPaid, releaseOrderAfterDecline } from '@/lib/payments';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pagos/kushki
 * Cobra la tarjeta tokenizada con Kushki.js en el navegador.
 *
 * El monto SIEMPRE sale de la base de datos (orders.total), nunca del navegador.
 * Requiere en Vercel / .env.local (solo servidor):
 *   KUSHKI_PRIVATE_KEY=...      (credencial privada)
 *   KUSHKI_ENV=test|production   (por defecto: test)
 *
 * Si el banco rechaza la tarjeta: el pedido se cancela y se libera el stock.
 * Si aprueba: pedido pagado + stock descontado.
 */

interface Body {
  token?: string;
  orderId?: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  currency: string | null;
  payment_status: string | null;
}

const declined = (message: string) =>
  NextResponse.json(
    {
      approved: false,
      error: 'DECLINED',
      message: message || 'La tarjeta fue rechazada. Verifica los datos o usa otro método.',
    },
    { status: 402 }
  );

export async function POST(req: Request) {
  const privateKey = process.env.KUSHKI_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json(
      { approved: false, error: 'NOT_CONFIGURED', message: 'Kushki aún no está configurado.' },
      { status: 501 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ approved: false, error: 'BAD_REQUEST' }, { status: 400 });
  }

  const token = String(body.token || '').trim();
  const orderId = String(body.orderId || '').trim();
  if (!token || !orderId) {
    return NextResponse.json(
      { approved: false, error: 'BAD_REQUEST', message: 'Faltan los datos del pago.' },
      { status: 400 }
    );
  }

  const svc = serviceClient();
  if (!svc) {
    return NextResponse.json({ approved: false, error: 'NOT_CONFIGURED' }, { status: 501 });
  }

  const { data: order } = await svc
    .from('orders')
    .select('id,order_number,total,currency,payment_status')
    .eq('id', orderId)
    .maybeSingle<OrderRow>();

  if (!order) {
    return NextResponse.json(
      { approved: false, error: 'NOT_FOUND', message: 'No encontramos tu pedido.' },
      { status: 404 }
    );
  }

  // Idempotente: si ya está pagado, no se vuelve a cobrar.
  if (order.payment_status === 'paid') {
    return NextResponse.json({ approved: true, alreadyPaid: true, ticket: '' });
  }

  const total = Number(order.total);
  if (!(total > 0)) {
    return NextResponse.json(
      { approved: false, error: 'BAD_ORDER', message: 'El pedido no tiene un total válido.' },
      { status: 400 }
    );
  }

  const currency = /^[A-Z]{3}$/.test(String(order.currency || '')) ? String(order.currency) : 'USD';
  const isProduction =
    (process.env.KUSHKI_ENV || process.env.NEXT_PUBLIC_KUSHKI_ENV) === 'production';
  const base = isProduction ? 'https://api.kushkipagos.com' : 'https://api-uat.kushkipagos.com';

  try {
    const res = await fetch(`${base}/card/v1/charges`, {
      method: 'POST',
      headers: {
        'Private-Merchant-Id': privateKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        amount: {
          subtotalIva: 0,
          subtotalIva0: Number(total.toFixed(2)),
          ice: 0,
          iva: 0,
          currency,
        },
        fullResponse: true,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ticketNumber?: string;
      message?: string;
      details?: { ticketNumber?: string; message?: string };
    };

    const ticket = String(data?.ticketNumber || data?.details?.ticketNumber || '');

    if (!res.ok || !ticket) {
      console.error('Kushki rechazó el cobro:', res.status, JSON.stringify(data).slice(0, 300));
      await releaseOrderAfterDecline(svc, order.id);
      return declined(String(data?.message || data?.details?.message || ''));
    }

    const ok = await markOrderPaid(svc, order.id);
    if (!ok) {
      // El cobro se hizo pero no pudimos actualizar el pedido: dejar rastro.
      console.error('Kushki cobró pero no se pudo marcar el pedido como pagado:', {
        orderId: order.id,
        orderNumber: order.order_number,
        ticket,
      });
    }

    return NextResponse.json({
      approved: true,
      ticket,
      orderNumber: order.order_number,
      total: Number(total.toFixed(2)),
    });
  } catch (err) {
    console.error('Error cobrando con Kushki:', err);
    return NextResponse.json(
      {
        approved: false,
        error: 'GATEWAY_ERROR',
        message: 'No pudimos conectar con la pasarela. Intenta de nuevo en un momento.',
      },
      { status: 502 }
    );
  }
}
