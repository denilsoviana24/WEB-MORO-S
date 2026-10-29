import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/shop';

/** Admin · Pedidos: listar y cambiar estado (con reposición de stock al cancelar). */

const VALID = ORDER_STATUSES.map((s) => s.id);

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

  if (status && VALID.includes(status as OrderStatus)) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
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
    .select('id,status,items')
    .eq('id', id)
    .maybeSingle();

  if (readError || !current) {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
  }

  // Reponer inventario solo al cancelar (una sola vez)
  if (status === 'cancelled' && current.status !== 'cancelled') {
    const items = Array.isArray(current.items) ? (current.items as { id?: string; qty?: number }[]) : [];
    for (const item of items) {
      if (!item?.id) continue;
      await guard.svc.rpc('restore_stock', { p_id: item.id, p_qty: Number(item.qty) || 1 });
    }
  }

  const { data, error } = await guard.svc
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
