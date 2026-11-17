import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Movimientos de inventario al confirmar o rechazar un pago en línea.
 * Se usan tanto en el cobro con Kushki como en el webhook de Mercado Pago.
 */

const now = () => new Date().toISOString();

interface OrderRow {
  id: string;
  status: string | null;
  stock_state: string | null;
  payment_status: string | null;
}

/**
 * Pago aprobado: convierte la reserva en salida real de stock y
 * deja el pedido como pagado y confirmado.
 */
export async function markOrderPaid(svc: SupabaseClient, orderId: string): Promise<boolean> {
  const { data: order } = await svc
    .from('orders')
    .select('id,status,stock_state,payment_status')
    .eq('id', orderId)
    .maybeSingle<OrderRow>();

  if (!order) return false;

  const stockState = order.stock_state || 'reserved';
  const patch: Record<string, unknown> = {
    payment_status: 'paid',
    paid_at: now(),
    updated_at: now(),
  };

  if (!order.status || order.status === 'pending' || order.status === 'cancelled') {
    patch.status = 'confirmed';
  }

  if (stockState === 'reserved') {
    const { data: reservations } = await svc
      .from('stock_reservations')
      .select('id')
      .eq('order_id', orderId)
      .eq('released', false);

    for (const r of reservations || []) {
      await svc.rpc('commit_reservation', { p_reservation: r.id });
    }
    patch.stock_state = 'committed';
  }

  const { error } = await svc.from('orders').update(patch).eq('id', orderId);
  return !error;
}

/**
 * Pago rechazado: cancela el pedido y libera el stock reservado.
 * Nunca toca un pedido que ya está pagado.
 */
export async function releaseOrderAfterDecline(svc: SupabaseClient, orderId: string): Promise<void> {
  const { data: order } = await svc
    .from('orders')
    .select('id,status,stock_state,payment_status')
    .eq('id', orderId)
    .maybeSingle<OrderRow>();

  if (!order || order.payment_status === 'paid') return;

  if ((order.stock_state || 'reserved') === 'reserved') {
    const { data: reservations } = await svc
      .from('stock_reservations')
      .select('id')
      .eq('order_id', orderId)
      .eq('released', false);

    for (const r of reservations || []) {
      await svc.rpc('release_reservation', { p_reservation: r.id });
    }
  }

  await svc
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: 'failed',
      stock_state: 'released',
      updated_at: now(),
    })
    .eq('id', orderId);
}
