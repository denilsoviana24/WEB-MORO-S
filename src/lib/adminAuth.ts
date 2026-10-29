import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Utilidades de servidor para la tienda.
 * Usan la clave de servicio (nunca se expone al navegador).
 */

export function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Correos con permiso de administración (env o el correo de pedidos). */
export function adminEmails(): string[] {
  const raw = [process.env.ADMIN_EMAILS, process.env.ORDERS_EMAIL, process.env.GMAIL_USER]
    .filter(Boolean)
    .join(',');
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

type AdminOk = { ok: true; svc: SupabaseClient; userId: string; email: string };
type AdminFail = { ok: false; res: NextResponse };

export async function requireAdmin(req: Request): Promise<AdminOk | AdminFail> {
  const svc = serviceClient();
  if (!svc) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 501 }),
    };
  }

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) {
    return { ok: false, res: NextResponse.json({ error: 'NO_SESSION' }, { status: 401 }) };
  }

  const { data, error } = await svc.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, res: NextResponse.json({ error: 'NO_SESSION' }, { status: 401 }) };
  }

  const email = (data.user.email || '').toLowerCase();
  let isAdmin = adminEmails().includes(email);

  if (!isAdmin) {
    const { data: prof } = await svc
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .maybeSingle();
    isAdmin = prof?.is_admin === true;
  }

  if (!isAdmin) {
    return { ok: false, res: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) };
  }

  return { ok: true, svc, userId: data.user.id, email };
}

/** Sesión opcional (para pedidos de invitados). */
export async function optionalUser(req: Request): Promise<{ id: string; email: string } | null> {
  const svc = serviceClient();
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!svc || !token) return null;
  const { data } = await svc.auth.getUser(token);
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email || '' };
}
