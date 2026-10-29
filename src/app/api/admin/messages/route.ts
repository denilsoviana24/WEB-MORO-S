import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/** Admin · Mensajes del formulario de contacto. */

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const { data, error } = await guard.svc
    .from('contactos')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ messages: data || [] }, { headers: NO_STORE });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const { error } = await guard.svc.from('contactos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
