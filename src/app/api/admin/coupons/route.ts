import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/** Admin · Cupones: listar, crear, editar y borrar. */

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clean(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (body.code !== undefined) out.code = String(body.code).trim().toUpperCase();
  if (body.type !== undefined) out.type = body.type === 'fixed' ? 'fixed' : 'percent';
  if (body.amount !== undefined) out.amount = Math.max(0.01, num(body.amount));
  if (body.min_total !== undefined) out.min_total = Math.max(0, num(body.min_total));
  if (body.max_uses !== undefined) {
    out.max_uses = body.max_uses === null || body.max_uses === '' ? null : Math.max(1, Math.floor(num(body.max_uses)));
  }
  if (body.expires_at !== undefined) {
    out.expires_at = body.expires_at ? new Date(String(body.expires_at)).toISOString() : null;
  }
  if (body.active !== undefined) out.active = Boolean(body.active);
  return out;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const { data, error } = await guard.svc
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = clean(body);
  if (!payload.code) return NextResponse.json({ error: 'Escribe el código del cupón.' }, { status: 400 });
  if (!payload.amount || Number(payload.amount) <= 0) {
    return NextResponse.json({ error: 'El descuento debe ser mayor a 0.' }, { status: 400 });
  }
  if (payload.type === 'percent' && Number(payload.amount) > 100) {
    return NextResponse.json({ error: 'Un porcentaje no puede pasar de 100%.' }, { status: 400 });
  }

  const { data, error } = await guard.svc.from('coupons').insert(payload).select('*').single();
  if (error) {
    const msg = error.message.includes('duplicate') ? 'Ya existe un cupón con ese código.' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ coupon: data });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const payload = clean(body);
  const { data, error } = await guard.svc
    .from('coupons')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const { error } = await guard.svc.from('coupons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
