import { NextResponse } from 'next/server';
import { RESTAURANT_INFO } from '@/data/menuData';
import { mailProvider, ordersEmail, sendEmail } from '@/lib/mailer';

/**
 * POST /api/pedido-email
 * Envía el aviso de un pedido nuevo al correo del dueño.
 *
 * Proveedor principal: Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD).
 * Respaldo: Resend (RESEND_API_KEY).
 * Destino: ORDERS_EMAIL (o GMAIL_USER si no se define).
 */
interface OrderItem {
  name: string;
  detail?: string;
  qty: number;
  price: number;
}

interface Body {
  number?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryType?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  items?: OrderItem[];
  notes?: string;
  total?: number;
}

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(req: Request) {
  const to = ordersEmail() || RESTAURANT_INFO.email;

  if (mailProvider() === 'none') {
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 501 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  if (!body.items?.length || !(Number(body.total) > 0)) {
    return NextResponse.json({ error: 'EMPTY_ORDER' }, { status: 400 });
  }

  const itemsHtml = (body.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.qty}x <strong>${esc(i.name)}</strong>${i.detail ? `<br><small style="color:#888;">${esc(i.detail)}</small>` : ''}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(i.price * i.qty).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#fafafa;padding:24px;border-radius:12px;">
    <h2 style="margin:0 0 4px;">🍔 Nuevo pedido ${esc(body.number || '')} — Moro's</h2>
    <p style="color:#666;margin:0 0 16px;">${new Date().toLocaleString('es-EC')}</p>
    <table style="width:100%;background:#fff;border-radius:8px;padding:8px 16px;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Cliente</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;"><strong>${esc(body.customerName || '')}</strong></td></tr>
      ${body.customerPhone ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Teléfono</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${esc(body.customerPhone)}</td></tr>` : ''}
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Tipo</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${body.deliveryType === 'delivery' ? '🛵 Domicilio' : '📍 Retiro en local'}</td></tr>
      ${body.deliveryAddress ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Dirección</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${esc(body.deliveryAddress)}</td></tr>` : ''}
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Pago</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${esc(body.paymentMethod || '')}</td></tr>
    </table>
    <h3 style="margin:16px 0 8px;">Detalle</h3>
    <table style="width:100%;background:#fff;border-radius:8px;padding:8px 16px;border-collapse:collapse;">
      ${itemsHtml}
      <tr><td style="padding:12px 8px 8px;"><strong>TOTAL</strong></td><td style="padding:12px 8px 8px;text-align:right;font-size:20px;"><strong>$${Number(body.total).toFixed(2)}</strong></td></tr>
    </table>
    ${body.notes ? `<p style="color:#666;"><em>Notas: ${esc(body.notes)}</em></p>` : ''}
    <p style="color:#999;font-size:12px;">Enviado automáticamente desde la web de Moro's.</p>
  </div>`;

  const sent = await sendEmail({
    to,
    subject: `🍔 Nuevo pedido ${body.number || ''} — $${Number(body.total).toFixed(2)}`,
    html,
    fromName: "Moro's Web",
  });

  if (!sent) {
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
  }
  return NextResponse.json({ sent: true, provider: mailProvider() });
}
