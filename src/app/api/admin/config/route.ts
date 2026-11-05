import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Admin · Configuración central de la tienda:
 * settings (moneda base, redondeo, reservas), currencies, taxes, shipping.
 */
const NO_STORE = { 'Cache-Control': 'no-store' };

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const [settings, currencies, taxes, zones, methods] = await Promise.all([
    guard.svc.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    guard.svc.from('currencies').select('*').order('code'),
    guard.svc.from('tax_rates').select('*').order('priority'),
    guard.svc.from('shipping_zones').select('*').order('sort_order'),
    guard.svc.from('shipping_methods').select('*').order('sort_order'),
  ]);

  return NextResponse.json(
    {
      settings: settings.data ?? null,
      currencies: currencies.data || [],
      taxes: taxes.data || [],
      zones: zones.data || [],
      methods: methods.data || [],
    },
    { headers: NO_STORE }
  );
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const resource = String(body.resource || '');

  if (resource === 'currency') {
    const code = String(body.code || '').trim().toUpperCase();
    if (code.length !== 3) return NextResponse.json({ error: 'El código debe tener 3 letras (USD, EUR…).' }, { status: 400 });
    const { data, error } = await guard.svc
      .from('currencies')
      .insert({
        code,
        name: String(body.name || code),
        symbol: String(body.symbol || '$'),
        rate: num(body.rate, 1),
        decimals: Math.max(0, Math.min(4, Math.floor(num(body.decimals, 2)))),
        symbol_position: body.symbol_position === 'after' ? 'after' : 'before',
        active: body.active !== false,
        is_default: Boolean(body.is_default),
      })
      .select('*')
      .single();
    if (error) {
      const msg = error.message.includes('duplicate') ? 'Esa moneda ya existe.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ currency: data }, { headers: NO_STORE });
  }

  if (resource === 'tax') {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Ponle nombre al impuesto.' }, { status: 400 });
    const { data, error } = await guard.svc
      .from('tax_rates')
      .insert({
        name,
        rate: Math.max(0, Math.min(100, num(body.rate))),
        country: body.country ? String(body.country) : 'EC',
        region: body.region ? String(body.region) : null,
        is_default: Boolean(body.is_default),
        active: body.active !== false,
        priority: Math.floor(num(body.priority)),
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ tax: data }, { headers: NO_STORE });
  }

  if (resource === 'zone') {
    const { data, error } = await guard.svc
      .from('shipping_zones')
      .insert({
        name: String(body.name || 'Zona').trim(),
        regions: Array.isArray(body.regions) ? body.regions : [],
        active: body.active !== false,
        sort_order: Math.floor(num(body.sort_order)),
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ zone: data }, { headers: NO_STORE });
  }

  if (resource === 'method') {
    const zoneId = body.zone_id ? String(body.zone_id) : null;
    const { data, error } = await guard.svc
      .from('shipping_methods')
      .insert({
        zone_id: zoneId,
        name: String(body.name || 'Envío').trim(),
        type: ['flat', 'free', 'per_item'].includes(String(body.type)) ? body.type : 'flat',
        cost: Math.max(0, num(body.cost)),
        per_item: Math.max(0, num(body.per_item)),
        free_over: body.free_over === null || body.free_over === '' ? null : Math.max(0, num(body.free_over)),
        min_total: Math.max(0, num(body.min_total)),
        eta: body.eta ? String(body.eta) : null,
        active: body.active !== false,
        sort_order: Math.floor(num(body.sort_order)),
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ method: data }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Recurso desconocido.' }, { status: 400 });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const resource = String(body.resource || '');

  if (resource === 'settings') {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const map: Record<string, 'string' | 'number' | 'boolean'> = {
      store_name: 'string',
      base_currency: 'string',
      currency_decimals: 'number',
      rounding_mode: 'string',
      rounding_step: 'number',
      prices_include_tax: 'boolean',
      default_tax_rate_id: 'string',
      reserve_minutes: 'number',
      low_stock_threshold: 'number',
      checkout_min_total: 'number',
    };
    for (const [key, kind] of Object.entries(map)) {
      if (body[key] === undefined) continue;
      if (kind === 'boolean') patch[key] = Boolean(body[key]);
      else if (kind === 'number') patch[key] = num(body[key]);
      else patch[key] = body[key] === null || body[key] === '' ? null : String(body[key]);
    }

    const { data, error } = await guard.svc.from('store_settings').update(patch).eq('id', 1).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ settings: data }, { headers: NO_STORE });
  }

  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  if (resource === 'currency') {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = String(body.name);
    if (body.symbol !== undefined) patch.symbol = String(body.symbol);
    if (body.rate !== undefined) patch.rate = num(body.rate, 1);
    if (body.decimals !== undefined) patch.decimals = Math.max(0, Math.min(4, Math.floor(num(body.decimals, 2))));
    if (body.symbol_position !== undefined) patch.symbol_position = body.symbol_position === 'after' ? 'after' : 'before';
    if (body.active !== undefined) patch.active = Boolean(body.active);
    if (body.is_default !== undefined) patch.is_default = Boolean(body.is_default);
    const { data, error } = await guard.svc.from('currencies').update(patch).eq('code', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ currency: data }, { headers: NO_STORE });
  }

  if (resource === 'tax') {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = String(body.name);
    if (body.rate !== undefined) patch.rate = Math.max(0, Math.min(100, num(body.rate)));
    if (body.is_default !== undefined) patch.is_default = Boolean(body.is_default);
    if (body.active !== undefined) patch.active = Boolean(body.active);
    if (body.priority !== undefined) patch.priority = Math.floor(num(body.priority));
    const { data, error } = await guard.svc.from('tax_rates').update(patch).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ tax: data }, { headers: NO_STORE });
  }

  if (resource === 'method') {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = String(body.name);
    if (body.type !== undefined) patch.type = body.type;
    if (body.cost !== undefined) patch.cost = Math.max(0, num(body.cost));
    if (body.per_item !== undefined) patch.per_item = Math.max(0, num(body.per_item));
    if (body.free_over !== undefined) patch.free_over = body.free_over === null || body.free_over === '' ? null : num(body.free_over);
    if (body.eta !== undefined) patch.eta = body.eta || null;
    if (body.active !== undefined) patch.active = Boolean(body.active);
    const { data, error } = await guard.svc.from('shipping_methods').update(patch).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ method: data }, { headers: NO_STORE });
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

  const table =
    resource === 'currency' ? 'currencies'
    : resource === 'tax' ? 'tax_rates'
    : resource === 'zone' ? 'shipping_zones'
    : resource === 'method' ? 'shipping_methods'
    : null;

  if (!table) return NextResponse.json({ error: 'Recurso desconocido.' }, { status: 400 });

  const key = resource === 'currency' ? 'code' : 'id';
  const { error } = await guard.svc.from(table).delete().eq(key, id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
