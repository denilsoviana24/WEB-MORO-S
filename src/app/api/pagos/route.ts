import { NextResponse } from 'next/server';

interface PagoBody {
  items: { title: string; quantity: number; unit_price: number }[];
  total: number;
  customerName: string;
  customerPhone?: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  orderNotes?: string;
}

/**
 * POST /api/pagos
 * Crea una preferencia de pago en Mercado Pago (Checkout Pro) y
 * devuelve el link de pago (init_point).
 *
 * Requiere en Vercel / .env.local:
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...  (credenciales de Mercado Pago)
 *   NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app  (para el retorno)
 *
 * Sin el token responde 501 y el frontend usa el plan B (WhatsApp / link fijo).
 */
export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error: 'NOT_CONFIGURED',
        message:
          'Pago en línea aún no configurado. Completa tu pedido por WhatsApp.',
      },
      { status: 501 }
    );
  }

  let body: PagoBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  if (!body.items?.length || !body.total || body.total <= 0) {
    return NextResponse.json({ error: 'EMPTY_ORDER' }, { status: 400 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://moros-tulcan.vercel.app';

  const preference = {
    items: body.items.map((i) => ({
      title: i.title.slice(0, 250),
      quantity: Math.max(1, Math.floor(i.quantity)),
      unit_price: Number(i.unit_price.toFixed(2)),
      currency_id: 'USD',
    })),
    payer: {
      name: body.customerName?.slice(0, 100),
    },
    external_reference: `moros-${Date.now()}`,
    notification_url: `${siteUrl}/api/pagos/webhook`,
    back_urls: {
      success: `${siteUrl}/?pago=exitoso`,
      failure: `${siteUrl}/?pago=fallido`,
      pending: `${siteUrl}/?pago=pendiente`,
    },
    auto_return: 'approved',
    statement_descriptor: "MORO'S TULCAN",
    metadata: {
      delivery_type: body.deliveryType,
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
    });
  } catch (err) {
    console.error('Error creando preferencia:', err);
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
  }
}
