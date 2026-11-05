import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/** Admin · Productos: listar, crear, editar y borrar. */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clean(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (body.name !== undefined) out.name = String(body.name).trim();
  if (body.slug !== undefined) out.slug = String(body.slug).trim() || null;
  if (body.description !== undefined) out.description = String(body.description);
  if (body.category !== undefined) out.category = String(body.category).trim() || 'otros';
  if (body.price !== undefined) out.price = num(body.price);
  if (body.sale_price !== undefined) {
    const sp = body.sale_price === null || body.sale_price === '' ? null : num(body.sale_price);
    out.sale_price = sp && sp > 0 ? sp : null;
  }
  if (body.sku !== undefined) out.sku = String(body.sku).trim() || null;
  if (body.stock !== undefined) {
    out.stock = body.stock === null || body.stock === '' ? null : Math.max(0, Math.floor(num(body.stock)));
  }
  if (body.low_stock !== undefined) out.low_stock = Math.max(0, Math.floor(num(body.low_stock, 5)));
  if (body.active !== undefined) out.active = Boolean(body.active);
  if (body.featured !== undefined) out.featured = Boolean(body.featured);
  if (body.badge !== undefined) out.badge = String(body.badge).trim() || null;
  if (body.image !== undefined) out.image = String(body.image).trim();
  if (body.options !== undefined) {
    const opts = Array.isArray(body.options) ? body.options : [];
    out.options = opts
      .filter((o) => o && typeof o === 'object')
      .map((o) => ({
        size: String((o as { size?: unknown }).size || '').trim(),
        price: num((o as { price?: unknown }).price),
      }))
      .filter((o) => o.size);
  }
  if (body.sort_order !== undefined) out.sort_order = Math.floor(num(body.sort_order));
  return out;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const { data, error } = await guard.svc
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = clean(body);
  if (!payload.name) {
    return NextResponse.json({ error: 'El producto necesita un nombre.' }, { status: 400 });
  }
  payload.slug = payload.slug || slugify(String(payload.name));

  const { data, error } = await guard.svc.from('products').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Cada producto nace con su variante por defecto (el stock vive en las variantes).
  if (data) {
    const stock = data.stock === null || data.stock === undefined ? 0 : Number(data.stock);
    await guard.svc.from('product_variants').insert({
      product_id: data.id,
      sku: data.sku || `MOR-${String(data.id).slice(0, 8).toUpperCase()}`,
      title: 'Único',
      attributes: {},
      price: Number(data.price) || 0,
      sale_price: data.sale_price === null ? null : Number(data.sale_price),
      stock,
      manage_stock: data.stock !== null && data.stock !== undefined,
      active: true,
    });
    if (data.stock !== null && data.stock !== undefined) {
      await guard.svc.rpc('sync_product_stock', { p_product: data.id });
    }
  }

  return NextResponse.json({ product: data });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const payload = clean(body);
  payload.updated_at = new Date().toISOString();

  const { data, error } = await guard.svc
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Mantiene sincronizada la variante única (precio y stock) de productos simples.
  if (data) {
    const { data: variants } = await guard.svc
      .from('product_variants')
      .select('id,attributes')
      .eq('product_id', id);

    const single = (variants || []).filter((v) => Object.keys(v.attributes || {}).length === 0);
    if (variants && variants.length === 1 && single.length === 1) {
      const patch: Record<string, unknown> = {};
      if (payload.price !== undefined) patch.price = Number(payload.price);
      if (payload.sale_price !== undefined) patch.sale_price = payload.sale_price;
      if (payload.stock !== undefined) {
        patch.stock = payload.stock === null ? 0 : Number(payload.stock);
        patch.manage_stock = payload.stock !== null;
      }
      if (payload.sku !== undefined) patch.sku = payload.sku;
      if (Object.keys(patch).length) {
        await guard.svc.from('product_variants').update(patch).eq('id', single[0].id);
      }
    }
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const { error } = await guard.svc.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
