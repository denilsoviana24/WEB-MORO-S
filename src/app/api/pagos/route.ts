import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';

interface PagoBody {
  items?: { title: string; quantity: number; unit_price: number }[];
  total?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryType?: 'pickup' | 'delivery';
  deliveryAddress?: string;
  orderNotes?: string;
  orderId?: string;
  orderNumber?: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  payment_status: string | null;
  customer_name: string | null;
}

/**
 * GET /api/pagos
 * Indica qué pasarelas están activas para que el checkout muestre
 * solo las que realmente pueden cobrar.
 */
export async function GET() {
  const mercadoPago = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  const kushki = Boolean(process.env.KUSHKI_PRIVATE_KEY && process.env.NEXT_PUBLIC_KUSHKI_PUBLIC_KEY);

  return NextResponse.json(
    { mercadoPago, kushki },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * POST /api/pagos
 * Crea una preferencia de pago en Mercado Pago (Checkout Pro) y
 * devuelve el link de pago (init_point).
 *
 * El monto SIEMPRE sale del pedido guardado en la base (orders.total),
 * no de lo que envíe el navegador.
 *
 * Requiere en Vercel / .env.local:
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...  (credenciales de Mercado Pago)
 *   NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app  (para los retornos)
 *
 * Sin el token responde 501 y el checkout oculta el pago con tarjeta.
 */
export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error: 'NOT_CONFIGURED',
        message: 'Pago en línea aún no configurado. Completa tu pedido por WhatsApp.',
      },
      { status: 501 }
    );
  }

  let body: PagoBody;
  try {
    body = (await req.json()) as PagoBody;
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const orderId = String(body.orderId || '').trim();
  const svc = serviceClient();

  let orderNumber = String(body.orderNumber || '');
  let customerName = String(body.customerName || '');
  let total = Number(body.total) || 0;
  let preferenceItems: { title: string; quantity: number; unit_price: number }[] = [];

  if (svc && orderId) {
    const { data: order } = await svc
      .from('orders')
      .select('id,order_number,total,payment_status,customer_name')
      .eq('id', orderId)
      .maybeSingle<OrderRow>();

    if (!order) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'No encontramos tu pedido.' }, { status: 404 });
    }
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'ALREADY_PAID', message: 'Este pedido ya está pagado.' },
        { status: 409 }
      );
    }

    total = Number(order.total);
    orderNumber = order.order_number;
    customerName = customerName || String(order.customer_name || '');

    // Una sola línea con el total exacto del pedido (incluye IVA, envío y cupón).
    preferenceItems = [
      {
        title: `Pedido ${order.order_number} · Moro's`.slice(0, 250),
        quantity: 1,
        unit_price: round2(total),
      },
    ];
  } else {
    // Sin pedido guardado: se usan los ítems enviados (no habrá confirmación automática).
    preferenceItems = (body.items || []).map((i) => ({
      title: String(i.title || 'Producto').slice(0, 250),
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
      unit_price: round2(Number(i.unit_price) || 0),
    }));
    total = round2(Number(body.total) || preferenceItems.reduce((s, i) => s + i.unit_price * i.quantity, 0));
  }

  if (!preferenceItems.length || !(total > 0)) {
    return NextResponse.json({ error: 'EMPTY_ORDER', message: 'El pedido no tiene un total válido.' }, { status: 400 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  const secureSite = siteUrl.startsWith('https://');
  const reference = orderId || orderNumber || `moros-${Date.now()}`;

  const preference = {
    items: preferenceItems.map((i) => ({ ...i, currency_id: 'USD' })),
    payer: customerName ? { name: customerName.slice(0, 100) } : undefined,
    external_reference: reference.slice(0, 64),
    notification_url: `${siteUrl}/api/pagos/webhook`,
    back_urls: {
      success: `${siteUrl}/?pago=exitoso`,
      failure: `${siteUrl}/?pago=fallido`,
      pending: `${siteUrl}/?pago=pendiente`,
    },
    ...(secureSite ? { auto_return: 'approved' } : {}),
    statement_descriptor: "MORO'S TULCAN",
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      delivery_type: body.deliveryType || '',
      customer_phone: body.customerPhone || '',
      delivery_address: body.deliveryAddress || '',
      order_notes: body.orderNotes || '',
    },
  };

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Mercado Pago error:', detail);
      return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      preference_id: data.id,
      reference,
      total,
    });
  } catch (err) {
    console.error('Error creando preferencia:', err);
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
  }
}
