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
    .select('id');

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, imported: data?.length ?? rows.length });
}
