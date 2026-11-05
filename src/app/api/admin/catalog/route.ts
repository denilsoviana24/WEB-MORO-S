import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { buildMatrix, buildSku } from '@/lib/catalog';

/**
 * Admin · Catálogo avanzado.
 * resource = attributes | variants | product
 * - attributes: atributos y sus valores (talla, color, material…)
 * - variants: SKU único por combinación, precio, stock, dropshipping
 * - product: tipo (simple/variable/grouped/external), impuesto, atributos
 */
const NO_STORE = { 'Cache-Control': 'no-store' };

function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const resource = url.searchParams.get('resource') || 'variants';
  const productId = url.searchParams.get('productId');

  if (resource === 'attributes') {
    const [attrs, terms] = await Promise.all([
      guard.svc.from('attributes').select('*').order('sort_order'),
      guard.svc.from('attribute_terms').select('*').order('sort_order'),
    ]);
    const list = (attrs.data || []).map((a) => ({
      ...a,
      terms: (terms.data || []).filter((t) => t.attribute_id === a.id),
    }));
    return NextResponse.json({ attributes: list }, { headers: NO_STORE });
  }

  if (resource === 'variants') {
    let query = guard.svc.from('product_variants').select('*').order('sort_order').order('sku');
    if (productId) query = query.eq('product_id', productId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
    return NextResponse.json({ variants: data || [] }, { headers: NO_STORE });
  }

  if (resource === 'product' && productId) {
    const { data, error } = await guard.svc.from('products').select('*').eq('id', productId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
    return NextResponse.json({ product: data }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Recurso desconocido.' }, { status: 400 });
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const resource = String(body.resource || '');

  /* --- Atributo con sus valores --- */
  if (resource === 'attributes') {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Ponle nombre al atributo.' }, { status: 400 });

    const { data: attr, error } = await guard.svc
      .from('attributes')
      .insert({
        name,
        slug: slugify(name),
        input_type: ['select', 'color', 'text'].includes(String(body.input_type)) ? body.input_type : 'select',
        sort_order: Math.floor(num(body.sort_order)),
      })
      .select('*')
      .single();

    if (error) {
      const msg = error.message.includes('duplicate') ? 'Ya existe un atributo con ese nombre.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const values = Array.isArray(body.terms) ? (body.terms as string[]) : [];
    if (values.filter(Boolean).length) {
      await guard.svc.from('attribute_terms').insert(
        values
          .filter(Boolean)
          .map((v, i) => ({ attribute_id: attr.id, value: String(v), slug: slugify(String(v)), sort_order: i }))
      );
    }

    return NextResponse.json({ attribute: attr }, { headers: NO_STORE });
  }

  /* --- Variante manual --- */
  if (resource === 'variants') {
    const productId = String(body.product_id || '');
    if (!productId) return NextResponse.json({ error: 'Falta el producto.' }, { status: 400 });

    const payload = {
      product_id: productId,
      sku: body.sku ? String(body.sku).trim().toUpperCase() : null,
      title: String(body.title || '').trim() || 'Variante',
      attributes: (body.attributes as Record<string, string>) || {},
      price: num(body.price),
      sale_price: body.sale_price === null || body.sale_price === '' ? null : num(body.sale_price),
      stock: Math.max(0, Math.floor(num(body.stock))),
      manage_stock: body.manage_stock !== false,
      backorders: ['no', 'notify', 'yes'].includes(String(body.backorders)) ? body.backorders : 'no',
      weight: num(body.weight),
      image: body.image ? String(body.image) : null,
      dropship: Boolean(body.dropship),
      supplier: body.supplier ? String(body.supplier) : null,
      active: body.active !== false,
    };

    const { data, error } = await guard.svc.from('product_variants').insert(payload).select('*').single();
    if (error) {
      const msg = error.message.includes('duplicate') ? 'Ese SKU ya existe. Usa otro.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    await guard.svc.rpc('sync_product_stock', { p_product: productId });
    return NextResponse.json({ variant: data }, { headers: NO_STORE });
  }

  /* --- Generar matriz de variantes --- */
  if (resource === 'generate') {
    const productId = String(body.product_id || '');
    const optionsRaw = Array.isArray(body.options) ? (body.options as { name: string; values: string[] }[]) : [];
    if (!productId) return NextResponse.json({ error: 'Falta el producto.' }, { status: 400 });

    const { data: product } = await guard.svc.from('products').select('id,name,slug,price').eq('id', productId).maybeSingle();
    if (!product) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 400 });

    const matrix = buildMatrix(optionsRaw);
    if (!matrix.length) return NextResponse.json({ error: 'Agrega al menos un valor.' }, { status: 400 });

    const basePrice = num(body.base_price, Number(product.price));
    const stock = Math.max(0, Math.floor(num(body.stock)));
    const manageStock = body.manage_stock !== false;

    const rows = matrix.map((combo, index) => ({
      product_id: productId,
      sku: buildSku(product.slug || product.name, combo) + (index === 0 ? '' : `-${index + 1}`),
      title: Object.values(combo).join(' / ') || 'Único',
      attributes: combo,
      price: basePrice,
      stock,
      manage_stock: manageStock,
      sort_order: index,
      active: true,
    }));

    const { data: existing } = await guard.svc
      .from('product_variants')
      .select('id,attributes')
      .eq('product_id', productId);

    // No duplicar combinaciones existentes
    const seen = new Set(
      (existing || []).map((v) => JSON.stringify(v.attributes || {}))
    );
    const fresh = rows.filter((r) => !seen.has(JSON.stringify(r.attributes)));

    if (!fresh.length) {
      return NextResponse.json({ ok: true, created: 0, message: 'Todas las combinaciones ya existían.' }, { headers: NO_STORE });
    }

    const { data, error } = await guard.svc.from('product_variants').insert(fresh).select('id,sku');
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await guard.svc.from('products').update({ type: 'variable' }).eq('id', productId);
    await guard.svc.rpc('sync_product_stock', { p_product: productId });

    return NextResponse.json({ ok: true, created: data?.length ?? 0, variants: data }, { headers: NO_STORE });
  }

  /* --- Tipo y atributos del producto --- */
  if (resource === 'product') {
    const productId = String(body.id || '');
    if (!productId) return NextResponse.json({ error: 'Falta el producto.' }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.type !== undefined) {
      patch.type = ['simple', 'variable', 'grouped', 'external'].includes(String(body.type)) ? body.type : 'simple';
    }
    if (body.tax_rate_id !== undefined) patch.tax_rate_id = body.tax_rate_id || null;
    if (body.manage_stock !== undefined) patch.manage_stock = Boolean(body.manage_stock);
    if (body.backorders !== undefined) patch.backorders = body.backorders;
    if (body.dropship !== undefined) patch.dropship = Boolean(body.dropship);
    if (body.supplier !== undefined) patch.supplier = body.supplier || null;
    if (body.weight !== undefined) patch.weight = num(body.weight);
    if (body.external_url !== undefined) patch.external_url = body.external_url || null;
    if (body.button_text !== undefined) patch.button_text = body.button_text || null;
    if (body.grouped_ids !== undefined) patch.grouped_ids = body.grouped_ids || [];
    if (body.attribute_ids !== undefined) patch.attribute_ids = body.attribute_ids || [];

    const { data, error } = await guard.svc.from('products').update(patch).eq('id', productId).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ product: data }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Recurso desconocido.' }, { status: 400 });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const resource = String(body.resource || '');
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  if (resource === 'attributes') {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) {
      patch.name = String(body.name).trim();
      patch.slug = slugify(String(body.name));
    }
    if (body.input_type !== undefined) patch.input_type = body.input_type;

    const { data, error } = await guard.svc.from('attributes').update(patch).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (Array.isArray(body.terms)) {
      await guard.svc.from('attribute_terms').delete().eq('attribute_id', id);
      const values = (body.terms as string[]).filter(Boolean);
      if (values.length) {
        await guard.svc.from('attribute_terms').insert(
          values.map((v, i) => ({ attribute_id: id, value: String(v), slug: slugify(String(v)), sort_order: i }))
        );
      }
    }
    return NextResponse.json({ attribute: data }, { headers: NO_STORE });
  }

  if (resource === 'variants') {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.sku !== undefined) patch.sku = body.sku ? String(body.sku).trim().toUpperCase() : null;
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.attributes !== undefined) patch.attributes = body.attributes;
    if (body.price !== undefined) patch.price = num(body.price);
    if (body.sale_price !== undefined) {
      patch.sale_price = body.sale_price === null || body.sale_price === '' ? null : num(body.sale_price);
    }
    if (body.stock !== undefined) patch.stock = Math.max(0, Math.floor(num(body.stock)));
    if (body.manage_stock !== undefined) patch.manage_stock = Boolean(body.manage_stock);
    if (body.backorders !== undefined) patch.backorders = body.backorders;
    if (body.weight !== undefined) patch.weight = num(body.weight);
    if (body.image !== undefined) patch.image = body.image || null;
    if (body.dropship !== undefined) patch.dropship = Boolean(body.dropship);
    if (body.supplier !== undefined) patch.supplier = body.supplier || null;
    if (body.active !== undefined) patch.active = Boolean(body.active);

    const { data, error } = await guard.svc
      .from('product_variants')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      const msg = error.message.includes('duplicate') ? 'Ese SKU ya existe.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (data?.product_id) await guard.svc.rpc('sync_product_stock', { p_product: data.product_id });
    return NextResponse.json({ variant: data }, { headers: NO_STORE });
  }

  if (resource === 'product') {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ['type', 'tax_rate_id', 'manage_stock', 'backorders', 'dropship', 'supplier', 'weight', 'external_url', 'button_text', 'grouped_ids', 'attribute_ids']) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    const { data, error } = await guard.svc.from('products').update(patch).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ product: data }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Recurso desconocido.' }, { status: 400 });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const resource = url.searchParams.get('resource') || '';
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  if (resource === 'attributes') {
    const { error } = await guard.svc.from('attributes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  if (resource === 'variants') {
    const { data } = await guard.svc.from('product_variants').select('product_id').eq('id', id).maybeSingle();
    const { error } = await guard.svc.from('product_variants').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (data?.product_id) await guard.svc.rpc('sync_product_stock', { p_product: data.product_id });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Recurso desconocido.' }, { status: 400 });
}
