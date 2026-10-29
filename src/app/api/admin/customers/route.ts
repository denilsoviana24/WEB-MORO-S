import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/** Admin · Clientes: listar, buscar y ajustar sellos / permisos. */

const NO_STORE = { 'Cache-Control': 'no-store' };

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  stamps: number;
  total_orders: number;
  total_spent: number;
  is_admin: boolean;
  created_at: string;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();

  let query = guard.svc
    .from('profiles')
    .select('id,email,name,stamps,total_orders,total_spent,is_admin,created_at')
    .order('created_at', { ascending: false })
    .limit(300);

  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });

  const { data: redemptions } = await guard.svc
    .from('redemptions')
    .select('id,user_id,reward_code,reward_title,stamps_used,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json(
    { customers: (data || []) as ProfileRow[], redemptions: redemptions || [] },
    { headers: NO_STORE }
  );
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    stamps?: number;
    add_stamp?: boolean;
    is_admin?: boolean;
  };

  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const patch: Record<string, unknown> = {};

  if (body.stamps !== undefined) {
    patch.stamps = Math.max(0, Math.min(20, Math.floor(Number(body.stamps) || 0)));
  }

  if (body.add_stamp) {
    const { data: current } = await guard.svc.from('profiles').select('stamps').eq('id', id).maybeSingle();
    patch.stamps = Math.min(20, (Number(current?.stamps) || 0) + 1);
  }

  if (body.is_admin !== undefined) {
    if (id === guard.userId && body.is_admin === false) {
      return NextResponse.json(
        { error: 'No puedes quitarte a ti mismo el permiso de administrador.' },
        { status: 400 }
      );
    }
    patch.is_admin = Boolean(body.is_admin);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 });
  }

  const { data, error } = await guard.svc
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('id,email,name,stamps,total_orders,total_spent,is_admin,created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
  return NextResponse.json({ customer: data }, { headers: NO_STORE });
}
