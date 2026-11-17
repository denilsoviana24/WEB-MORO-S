import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';
import { markOrderPaid } from '@/lib/payments';

/**
 * POST /api/pagos/webhook
 * Mercado Pago avisa aquí cuando un pago cambia de estado.
 * Verificamos el pago contra su API y, si está aprobado y el monto
 * coincide, marcamos el pedido como pagado y descontamos el stock.
 *
 * Opcional (recomendado): MERCADOPAGO_WEBHOOK_SECRET para validar la firma.
 * Configura la URL en Mercado Pago:
 *   https://tu-dominio/api/pagos/webhook   (evento: payment)
 */

export const dynamic = 'force-dynamic';

const STATUS_MAP: Record<string, string> = {
  approved: 'paid',
  authorized: 'pending',
  pending: 'pending',
  in_process: 'pending',
  in_mediation: 'pending',
  rejected: 'failed',
  cancelled: 'failed',
  refunded: 'refunded',
  charged_back: 'refunded',
};

function validSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = req.headers.get('x-signature') || '';
  const requestId = req.headers.get('x-request-id') || '';
  const parts = Object.fromEntries(
    signature.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(v1, 'utf8'));
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: true });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const type = String(body.type || body.topic || '');
  const data = (body.data || {}) as Record<string, unknown>;
  const paymentId = String(data.id || body.id || (type === 'payment' ? body.resource : '') || '');

  // Solo nos interesan los pagos.
  if (type && type !== 'payment') return NextResponse.json({ ok: true });
  if (!paymentId) return NextResponse.json({ ok: true });
  if (!validSignature(req, paymentId)) {
    return NextResponse.json({ ok: false, error: 'BAD_SIGNATURE' }, { status: 401 });
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return NextResponse.json({ ok: true });

    const payment = (await res.json()) as {
      status?: string;
      status_detail?: string;
      transaction_amount?: number;
      external_reference?: string;
      id?: number | string;
    };

    const orderId = String(payment.external_reference || '');
    if (!orderId) return NextResponse.json({ ok: true });

    const svc = serviceClient();
    if (!svc) return NextResponse.json({ ok: true });

    const { data: order } = await svc
      .from('orders')
      .select('id,total,payment_status')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) return NextResponse.json({ ok: true });

    // No damos por pagado un monto distinto al del pedido.
    const amount = Number(payment.transaction_amount || 0);
    if (payment.status === 'approved' && Math.abs(amount - Number(order.total)) > 0.02) {
      console.warn('Mercado Pago: monto distinto', { orderId, amount, total: order.total });
      return NextResponse.json({ ok: true });
    }

    if (payment.status === 'approved') {
      // Pagado: descuenta el stock reservado y confirma el pedido.
      await markOrderPaid(svc, orderId);
    } else {
      // Rechazado / pendiente / reembolsado: solo guardamos el estado.
      // La reserva de stock caduca sola si el cliente no completa el pago.
      const paymentStatus = STATUS_MAP[String(payment.status || '')] || 'pending';
      await svc
        .from('orders')
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook Mercado Pago:', err);
    return NextResponse.json({ ok: true });
  }
}
