import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/shop';

/**
 * Admin · Pedidos.
 * - Lista con filtro por estado.
 * - Cambia estado y mueve el inventario correctamente, incluidos los combos:
 *   reservado → confirmado (descuenta stock físico de cada componente)
 *   cancelado → libera reserva o devuelve stock si ya se había descontado
 */
const VALID = ORDER_STATUSES.map((s) => s.id);

interface OrderItem {
  variantId?: string;
  comboId?: string;
  components?: { variantId: string; qty: number }[];
  id?: string;
  qty?: number;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 100));

  let query = guard.svc
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && VALID.includes(status as OrderStatus)) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  const id = String(body.id || '');
  const status = String(body.status || '') as OrderStatus;

  if (!id || !VALID.includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const { data: current, error: readError } = await guard.svc
    .from('orders')
    .select('id,status,items,stock_state')
    .eq('id', id)
    .maybeSingle();

  if (readError || !current) {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }

  const items = (Array.isArray(current.items) ? current.items : []) as OrderItem[];
  const stockState: string = current.stock_state || 'reserved';

  /** Ajusta stock de una línea (producto simple o combo). */
  const moveStock = async (item: OrderItem, sign: 1 | -1) => {
    const reason = sign < 0 ? 'sale' : 'cancel';

    if (item.components?.length) {
      for (const c of item.components) {
        if (!c.variantId) continue;
        await guard.svc.rpc('adjust_stock', {
          p_variant: c.variantId,
          p_delta: sign * (Number(c.qty) || 1),
          p_reason: reason,
        });
      }
      return;
    }

    const qty = Number(item.qty) || 1;
    if (item.variantId) {
      await guard.svc.rpc('adjust_stock', { p_variant: item.variantId, p_delta: sign * qty, p_reason: reason });
    } else if (item.id) {
      await guard.svc.rpc('restore_stock', { p_id: item.id, p_qty: sign * qty });
    }
  };

  let nextStockState = stockState;

  // 1) Confirmar: la reserva se convierte en salida real de inventario
  if (status !== 'cancelled' && stockState === 'reserved' && ['confirmed', 'preparing', 'delivering', 'completed'].includes(status)) {
    const { data: reservations } = await guard.svc
      .from('stock_reservations')
      .select('id')
      .eq('order_id', id)
      .eq('released', false);

    for (const r of reservations || []) {
      await guard.svc.rpc('commit_reservation', { p_reservation: r.id });
    }

    // Pedidos antiguos (sin reservas): descuenta directo
    if (!reservations || reservations.length === 0) {
      for (const item of items) await moveStock(item, -1);
    }
    nextStockState = 'committed';
  }

  // 2) Cancelar: libera lo reservado o devuelve lo ya descontado
  if (status === 'cancelled' && current.status !== 'cancelled') {
    if (stockState === 'reserved') {
      const { data: reservations } = await guard.svc
        .from('stock_reservations')
        .select('id')
        .eq('order_id', id)
        .eq('released', false);

      for (const r of reservations || []) {
        await guard.svc.rpc('release_reservation', { p_reservation: r.id });
      }

      if (!reservations || reservations.length === 0) {
        for (const item of items) await moveStock(item, 1);
      }
    } else if (stockState === 'committed') {
      for (const item of items) await moveStock(item, 1);
    }
    nextStockState = 'released';
  }

  const patch: Record<string, unknown> = {
    status,
    stock_state: nextStockState,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    patch.payment_status = 'paid';
    patch.paid_at = new Date().toISOString();
  }

  const { data, error } = await guard.svc.from('orders').update(patch).eq('id', id).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
