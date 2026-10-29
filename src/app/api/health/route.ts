import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/health
 * Comprueba que la web y la base de datos (Supabase) estén vivas.
 * También lo usa el cron diario de Vercel para evitar que Supabase
 * pause el proyecto por inactividad (plan gratis: pausa a los 7 días).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let db = 'not-configured';
  let detail = '';

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const started = Date.now();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const ms = Date.now() - started;
      db = error ? 'error' : 'ok';
      detail = error ? error.message.slice(0, 200) : `${ms}ms`;
    } catch (err) {
      db = 'unreachable';
      detail = err instanceof Error ? err.message.slice(0, 200) : 'unknown';
    }
  }

  return NextResponse.json(
    {
      ok: db === 'ok',
      db,
      detail,
      checkedAt: new Date().toISOString(),
    },
    { status: db === 'ok' ? 200 : 503 }
  );
}
