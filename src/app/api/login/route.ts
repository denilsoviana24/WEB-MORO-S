import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendVarietyEmail } from '@/lib/emails';

/**
 * POST /api/login
 * Entrada con USUARIO o CORREO + contraseña.
 * Si escriben usuario, el servidor lo convierte a su correo de forma
 * privada (el correo nunca sale del servidor).
 *
 * Requiere en .env.local y Vercel (SOLO servidor, sin NEXT_PUBLIC_):
 *   SUPABASE_SERVICE_KEY=...  (Settings → API → service_role)
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 501 });
  }

  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const identifier = String(body.identifier || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!identifier || password.length < 1) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  let email = identifier;
  const svc = serviceKey ? createClient(url, serviceKey) : null;
  if (!identifier.includes('@')) {
    // Entró con usuario: resolver correo en el servidor
    if (!svc) {
      return NextResponse.json({ error: 'NEEDS_SERVICE_KEY' }, { status: 501 });
    }
    const { data } = await svc.from('profiles').select('email').eq('name', identifier).single();
    if (!data?.email) {
      return NextResponse.json({ error: 'INVALID' }, { status: 401 });
    }
    email = data.email as string;
  }

  const anon = createClient(url, anonKey);
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json({ error: 'INVALID' }, { status: 401 });
  }

  // Variedad por correo si hace 7+ días que no entraba (nunca bloquea el login)
  try {
    if (svc) {
      const { data: prof } = await svc
        .from('profiles')
        .select('last_variety_email_at')
        .eq('id', data.user.id)
        .single();
      const last = prof?.last_variety_email_at ? new Date(prof.last_variety_email_at).getTime() : 0;
      if (Date.now() - last > 7 * 24 * 3600 * 1000) {
        const metaName = (data.user.user_metadata as { name?: string })?.name || '';
        const sent = await sendVarietyEmail(email, metaName, 'comeback');
        if (sent) {
          await svc
            .from('profiles')
            .update({ last_variety_email_at: new Date().toISOString() })
            .eq('id', data.user.id);
        }
      }
    }
  } catch {
    // ignorar
  }

  return NextResponse.json({ session: data.session, user: data.user });
}
