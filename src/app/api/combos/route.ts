import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';
import {
  available,
  comboAvailable,
  comboIsLive,
  comboPrice,
  variantPrice,
  type Combo,
  type Variant,
} from '@/lib/catalog';

/**
 * GET /api/combos
 * Combos vigentes (activos y dentro de sus fechas), con precio,
 * ahorro y unidades disponibles según el stock de sus componentes.
 */
export async function GET() {
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ combos: [] }, { headers: { 'Cache-Control': 'no-store' } });

  try {
    const { data: rows } = await svc.from('combos').select('*').eq('active', true).order('sort_order');
    const live = (rows || []).filter((c) => comboIsLive(c as Combo));
    if (!live.length) return NextResponse.json({ combos: [] }, { headers: { 'Cache-Control': 'no-store' } });

    const ids = live.map((c) => c.id);
    const { data: items } = await svc.from('combo_items').select('*').in('combo_id', ids);
    const variantIds = [...new Set((items || []).map((i) => i.variant_id))];

    const { data: variants } = variantIds.length
      ? await svc.from('product_variants').select('*').in('id', variantIds)
      : { data: [] as Variant[] };

    const productIds = [...new Set((variants || []).map((v) => v.product_id))];
    const { data: products } = productIds.length
      ? await svc.from('products').select('id,name,image,tax_rate_id').in('id', productIds)
      : { data: [] as { id: string; name: string; image: string | null }[] };

    const vMap = new Map<string, Variant>((variants || []).map((v) => [v.id, v as Variant]));
    const pMap = new Map((products || []).map((p) => [p.id, p]));

    const combos = live.map((combo) => {
      const own = (items || []).filter((i) => i.combo_id === combo.id);
      const components = own.map((i) => {
        const v = vMap.get(i.variant_id);
        const p = v ? pMap.get(v.product_id) : undefined;
        const free = v
          ? available({
              manage: v.manage_stock,
              stock: Number(v.stock) || 0,
              reserved: Number(v.reserved) || 0,
              backorders: v.backorders,
            })
          : 0;
        return {
          variantId: i.variant_id,
          qty: i.qty,
          price: v ? variantPrice(v) : 0,
          name: p?.name || 'Producto',
          variant: v?.title || '',
          image: p?.image || null,
          available: free,
        };
      });

      const totals = comboPrice(components, Number(combo.discount_percent) || 0, combo.fixed_price === null ? null : Number(combo.fixed_price));
      const stock = comboAvailable(components.map((c) => ({ available: c.available, qty: c.qty })));

      return {
        ...combo,
        components,
        price: totals.price,
        regular: totals.regular,
        saving: totals.saving,
        percent: totals.percent,
        available: stock === Infinity ? null : stock,
      };
    });

    return NextResponse.json({ combos }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { combos: [], detail: err instanceof Error ? err.message : 'error' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
