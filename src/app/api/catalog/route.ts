import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';

/**
 * GET /api/catalog
 * Todo el catálogo en una sola llamada: productos, variantes, atributos,
 * monedas, impuestos, envíos y configuración de la tienda.
 */
export async function GET() {
  const svc = serviceClient();
  if (!svc) {
    return NextResponse.json(
      { products: [], variants: [], attributes: [], taxes: [], currencies: [], shipping: [], settings: null, source: 'none' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const [products, variants, attributes, terms, taxes, currencies, settings, zones, methods] = await Promise.all([
      svc.from('products').select('*').eq('active', true).order('sort_order').order('name'),
      svc.from('product_variants').select('*').eq('active', true).order('sort_order'),
      svc.from('attributes').select('*').order('sort_order'),
      svc.from('attribute_terms').select('*').order('sort_order'),
      svc.from('tax_rates').select('*').eq('active', true).order('priority'),
      svc.from('currencies').select('*').eq('active', true),
      svc.from('store_settings').select('*').eq('id', 1).maybeSingle(),
      svc.from('shipping_zones').select('*').eq('active', true).order('sort_order'),
      svc.from('shipping_methods').select('*').eq('active', true).order('sort_order'),
    ]);

    const attrList = (attributes.data || []).map((a) => ({
      ...a,
      terms: (terms.data || []).filter((t) => t.attribute_id === a.id),
    }));

    return NextResponse.json(
      {
        products: products.data || [],
        variants: variants.data || [],
        attributes: attrList,
        taxes: taxes.data || [],
        currencies: currencies.data || [],
        settings: settings.data ?? null,
        shipping: { zones: zones.data || [], methods: methods.data || [] },
        source: products.error ? 'error' : 'db',
        detail: products.error?.message,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return NextResponse.json(
      { products: [], variants: [], attributes: [], taxes: [], currencies: [], shipping: [], settings: null, source: 'error', detail: String(err) },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
