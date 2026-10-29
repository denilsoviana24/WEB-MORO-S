import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/products
 * Catálogo público de la tienda (solo productos activos).
 * Si la base no responde, el sitio usa el menú estático de respaldo.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ products: [], source: 'none' });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ products: [], source: 'error', detail: error.message }, { status: 200 });
    }
    return NextResponse.json(
      { products: data ?? [], source: 'db' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return NextResponse.json(
      { products: [], source: 'error', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 200 }
    );
  }
}
