import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Admin · Inventario avanzado.
 * GET  → stock por variante (físico, reservado, disponible), reservas activas y movimientos.
 * POST → ajuste manual, liberar reservas caducadas, sincronizar producto.
 */
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const [variants, products, reservations, movements] = await Promise.all([
    guard.svc.from('product_variants').select('*').order('sku'),
    guard.svc.from('products').select('id,name,type').order('name'),
    guard.svc
      .from('stock_reservations')
      .select('*')
      .eq('released', false)
      .order('expires_at')
      .limit(200),
    guard.svc
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  const nameById = new Map((products.data || []).map((p) => [p.id, p.name]));

  const rows = (variants.data || []).map((v) => ({
    ...v,
    product_name: nameById.get(v.product_id) || 'Producto',
    available: Math.max(0, (Number(v.stock) || 0) - (Number(v.reserved) || 0)),
  }));

  return NextResponse.json(
    {
      variants: rows,
      reservations: reservations.data || [],
      movements: movements.data || [],
    },
    { headers: NO_STORE }
  );
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    variantId?: string;
    delta?: number;
    reason?: string;
  };

  if (body.action === 'expire') {
    const { data, error } = await guard.svc.rpc('expire_reservations');
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
    return NextResponse.json({ ok: true, released: data ?? 0 }, { headers: NO_STORE });
  }

  if (body.action === 'sync') {
    const { data: products } = await guard.svc.from('products').select('id');
    for (const p of products || []) {
      await guard.svc.rpc('sync_product_stock', { p_product: p.id });
    }
    return NextResponse.json({ ok: true, synced: products?.length ?? 0 }, { headers: NO_STORE });
  }

  if (body.action === 'adjust') {
    const variantId = String(body.variantId || '');
    const delta = Math.floor(Number(body.delta) || 0);
    if (!variantId || delta === 0) {
      return NextResponse.json({ error: 'Indica la variante y la cantidad.' }, { status: 400 });
    }

    const { data, error } = await guard.svc.rpc('adjust_stock', {
      p_variant: variantId,
      p_delta: delta,
      p_reason: body.reason || 'manual',
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });

    const { data: variant } = await guard.svc
      .from('product_variants')
      .select('product_id')
      .eq('id', variantId)
      .maybeSingle();

    if (variant?.product_id) await guard.svc.rpc('sync_product_stock', { p_product: variant.product_id });

    return NextResponse.json({ ok: true, stock: data }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Acción desconocida.' }, { status: 400 });
}
