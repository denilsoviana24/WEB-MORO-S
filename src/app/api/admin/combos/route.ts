import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/** Admin · Combos: crear, editar, activar y borrar. */
const NO_STORE = { 'Cache-Control': 'no-store' };

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

interface IncomingItem {
  variant_id?: string;
  qty?: number;
}

function cleanItems(items: unknown): { variant_id: string; qty: number }[] {
  if (!Array.isArray(items)) return [];
  return (items as IncomingItem[])
    .filter((i) => i && i.variant_id)
    .map((i) => ({ variant_id: String(i.variant_id), qty: Math.max(1, Math.floor(num(i.qty, 1))) }));
}

function clean(body: Record<string, unknown>) {
  const out: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) out.name = String(body.name).trim();
  if (body.slug !== undefined) out.slug = String(body.slug).trim() || null;
  if (body.description !== undefined) out.description = String(body.description);
  if (body.image !== undefined) out.image = String(body.image);
  if (body.discount_percent !== undefined) out.discount_percent = Math.max(0, Math.min(100, num(body.discount_percent)));
  if (body.fixed_price !== undefined) {
    out.fixed_price = body.fixed_price === null || body.fixed_price === '' ? null : Math.max(0, num(body.fixed_price));
  }
  if (body.badge !== undefined) out.badge = String(body.badge).trim() || null;
  if (body.active !== undefined) out.active = Boolean(body.active);
  if (body.starts_at !== undefined) out.starts_at = body.starts_at ? new Date(String(body.starts_at)).toISOString() : null;
  if (body.ends_at !== undefined) out.ends_at = body.ends_at ? new Date(String(body.ends_at)).toISOString() : null;
  if (body.sort_order !== undefined) out.sort_order = Math.floor(num(body.sort_order));
  return out;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const [combos, items] = await Promise.all([
    guard.svc.from('combos').select('*').order('sort_order').order('created_at', { ascending: false }),
    guard.svc.from('combo_items').select('*'),
  ]);

  const list = (combos.data || []).map((c) => ({
    ...c,
    items: (items.data || []).filter((i) => i.combo_id === c.id),
  }));

  return NextResponse.json({ combos: list }, { headers: NO_STORE });
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = clean(body);

  if (!payload.name) return NextResponse.json({ error: 'Ponle nombre al combo.' }, { status: 400 });
  payload.slug = payload.slug || slugify(String(payload.name));

  const items = cleanItems(body.items);
  if (!items.length) return NextResponse.json({ error: 'El combo necesita al menos un producto.' }, { status: 400 });

  const { data: combo, error } = await guard.svc.from('combos').insert(payload).select('*').single();
  if (error) {
    const msg = error.message.includes('duplicate') ? 'Ya existe un combo con ese nombre.' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { error: itemsError } = await guard.svc
    .from('combo_items')
    .insert(items.map((i) => ({ combo_id: combo.id, variant_id: i.variant_id, qty: i.qty })));

  if (itemsError) {
    await guard.svc.from('combos').delete().eq('id', combo.id);
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  return NextResponse.json({ combo }, { headers: NO_STORE });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const payload = clean(body);
  if (body.slug !== undefined && !payload.slug) payload.slug = null;

  const { data: combo, error } = await guard.svc.from('combos').update(payload).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.items !== undefined) {
    const items = cleanItems(body.items);
    await guard.svc.from('combo_items').delete().eq('combo_id', id);
    if (items.length) {
      await guard.svc.from('combo_items').insert(items.map((i) => ({ combo_id: id, variant_id: i.variant_id, qty: i.qty })));
    }
  }

  return NextResponse.json({ combo }, { headers: NO_STORE });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const { error } = await guard.svc.from('combos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
