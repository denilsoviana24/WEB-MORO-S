import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { MENU_ITEMS } from '@/data/menuData';

/**
 * POST /api/admin/products/seed
 * Importa el menú actual de la web como productos de la tienda.
 * Solo si la tabla está vacía (o con ?force=1 para actualizar).
 */
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const force = new URL(req.url).searchParams.get('force') === '1';

  const { count } = await guard.svc
    .from('products')
    .select('id', { count: 'exact', head: true });

  if ((count ?? 0) > 0 && !force) {
    return NextResponse.json({
      ok: false,
      error: `Ya existen ${count} productos. Usa "Importar de nuevo" si quieres actualizarlos.`,
      count,
    });
  }

  const rows = MENU_ITEMS.map((item, index) => ({
    name: item.name,
    slug: item.id,
    description: item.description,
    category: item.category,
    price: item.price,
    sale_price: null,
    stock: null,
    low_stock: 5,
    active: true,
    featured: Boolean(item.popular),
    badge: item.badge ?? null,
    image: item.image,
    options: (item.options ?? []).map((o) => ({ size: o.size, price: o.price })),
    sort_order: index,
  }));

  const { data, error } = await guard.svc
    .from('products')
    .upsert(rows, { onConflict: 'slug' })
    .select('id,sku,price,sale_price,stock');

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  // Variante por defecto para cada producto (el inventario vive en las variantes).
  try {
    const { data: existing } = await guard.svc.from('product_variants').select('product_id');
    const withVariant = new Set((existing || []).map((v) => v.product_id));
    const missing = (data || [])
      .filter((p) => !withVariant.has(p.id))
      .map((p) => ({
        product_id: p.id,
        sku: p.sku || `MOR-${String(p.id).slice(0, 8).toUpperCase()}`,
        title: 'Único',
        attributes: {},
        price: Number(p.price) || 0,
        sale_price: p.sale_price === null ? null : Number(p.sale_price),
        stock: Number(p.stock) || 0,
        manage_stock: p.stock !== null && p.stock !== undefined,
        active: true,
      }));

    if (missing.length) await guard.svc.from('product_variants').insert(missing);
  } catch {
    // Si la migración de catálogo aún no se ejecutó, el menú igual queda importado.
  }

  return NextResponse.json({ ok: true, imported: data?.length ?? rows.length });
}
