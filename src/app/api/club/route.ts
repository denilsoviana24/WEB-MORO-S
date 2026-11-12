import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';
import { configFromRow } from '@/lib/clubConfig';

/**
 * GET /api/club
 * Configuración pública del Club Moro's (meta de sellos, premio,
 * niveles y textos de la sección), editable desde el panel.
 */
export async function GET() {
  const svc = serviceClient();
  if (!svc) {
    return NextResponse.json(
      { config: configFromRow(null) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const { data } = await svc.from('club_settings').select('*').eq('id', 1).maybeSingle();
    return NextResponse.json(
      { config: configFromRow(data) },
      { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } }
    );
  } catch {
    return NextResponse.json(
      { config: configFromRow(null) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
