import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';
import {
  computeDiscount,
  couponProblem,
  type Coupon,
} from '@/lib/shop';
import {
  lineTotals,
  roundMoney,
  taxRateFor,
  variantPrice,
  available,
  convert,
  type Currency,
  type RoundingMode,
  type StoreSettings,
  type TaxRate,
  type Variant,
} from '@/lib/catalog';

/**
 * POST /api/checkout/quote
 * Totales dinámicos por AJAX: impuestos, envío y cupón.
 * Nunca confía en los precios del navegador: recalcula todo.
 */
interface Incoming {
  items?: { variantId?: string; qty?: number }[];
  shippingMethodId?: string | null;
  deliveryType?: 'pickup' | 'delivery';
  region?: string;
  couponCode?: string | null;
  currency?: string;
}

const SETTINGS_DEFAULT: StoreSettings = {
  store_name: "Moro's",
  base_currency: 'USD',
  currency_decimals: 2,
  rounding_mode: 'half_up',
  rounding_step: 0.01,
  prices_include_tax: false,
  default_tax_rate_id: null,
  reserve_minutes: 20,
  low_stock_threshold: 5,
  checkout_min_total: 0,
};

export async function POST(req: Request) {
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: 'Tienda no configurada.' }, { status: 501 });

  let body: Incoming;
  try {
    body = (await req.json()) as Incoming;
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida.' }, { status: 400 });
  }

  const rows = (body.items || []).filter((i) => i.variantId && Number(i.qty) > 0);
  if (!rows.length) return NextResponse.json({ ok: false, error: 'Carrito vacío.' }, { status: 400 });

  const ids = rows.map((r) => String(r.variantId));
  const [{ data: variants }, { data: settingsRow }, { data: taxes }, { data: currencies }, { data: methods }, { data: zones }] =
    await Promise.all([
      svc.from('product_variants').select('*').in('id', ids),
      svc.from('store_settings').select('*').eq('id', 1).maybeSingle(),
      svc.from('tax_rates').select('*').eq('active', true),
      svc.from('currencies').select('*').eq('active', true),
      svc.from('shipping_methods').select('*').eq('active', true).order('sort_order'),
      svc.from('shipping_zones').select('*').eq('active', true),
    ]);

  const settings: StoreSettings = { ...SETTINGS_DEFAULT, ...(settingsRow || {}) };
  const taxList = (taxes || []) as TaxRate[];
  const variantMap = new Map<string, Variant>((variants || []).map((v) => [v.id, v as Variant]));
  const productIds = [...new Set((variants || []).map((v) => v.product_id))];
  const { data: products } = productIds.length
    ? await svc.from('products').select('id,name,tax_rate_id,active').in('id', productIds)
    : { data: [] as { id: string; name: string; tax_rate_id: string | null; active: boolean }[] };
  const productMap = new Map((products || []).map((p) => [p.id, p]));

  const currencyCode = body.currency || settings.base_currency;
  const currency = ((currencies || []) as Currency[]).find((c) => c.code === currencyCode) || null;
  const mode = settings.rounding_mode as RoundingMode;

  const lines = [];
  let subtotal = 0;
  let taxTotal = 0;
  let itemsQty = 0;
  let weight = 0;
  const warnings: string[] = [];

  for (const row of rows) {
    const variant = variantMap.get(String(row.variantId));
    if (!variant) {
      warnings.push('Un producto de tu carrito ya no está disponible.');
      continue;
    }
    const product = productMap.get(variant.product_id);
    if (product && product.active === false) {
      warnings.push(`"${product.name}" ya no está disponible.`);
      continue;
    }

    const qty = Math.max(1, Math.floor(Number(row.qty) || 1));
    const unit = variantPrice(variant);
    const rate = taxRateFor(product?.tax_rate_id, taxList, settings);
    const totals = lineTotals({ price: unit, qty, taxRate: rate }, settings.prices_include_tax, mode, settings.rounding_step);

    subtotal = roundMoney(subtotal + totals.net, mode, settings.rounding_step);
    taxTotal = roundMoney(taxTotal + totals.tax, mode, settings.rounding_step);
    itemsQty += qty;
    weight += Number(variant.weight || 0) * qty;

    const free = available({
      manage: variant.manage_stock,
      stock: Number(variant.stock) || 0,
      reserved: Number(variant.reserved) || 0,
      backorders: variant.backorders,
    });
    if (free !== Infinity && free < qty) {
      warnings.push(
        free <= 0
          ? 'Un producto de tu carrito está agotado.'
          : `Solo quedan ${free} unidades de un producto de tu carrito.`
      );
    }

    lines.push({
      variantId: variant.id,
      productId: variant.product_id,
      name: product?.name || variant.title || 'Producto',
      variant: variant.title,
      attributes: variant.attributes,
      sku: variant.sku,
      qty,
      unitPrice: roundMoney(convert(unit, currency), mode, settings.rounding_step),
      taxRate: rate,
      net: roundMoney(convert(totals.net, currency), mode, settings.rounding_step),
      tax: roundMoney(convert(totals.tax, currency), mode, settings.rounding_step),
      gross: roundMoney(convert(totals.gross, currency), mode, settings.rounding_step),
      available: free === Infinity ? null : free,
    });
  }

  // Envío
  const region = (body.region || '').trim().toLowerCase();
  const zoneIds = new Set(
    (zones || [])
      .filter((z) => {
        const regions = Array.isArray(z.regions) ? (z.regions as string[]) : [];
        if (!regions.length) return true;
        if (!region) return true;
        return regions.some((r) => String(r).toLowerCase() === region);
      })
      .map((z) => z.id)
  );

  const shippingOptions = (methods || [])
    .filter((m) => !m.zone_id || zoneIds.has(m.zone_id))
    .filter((m) => subtotal >= Number(m.min_total || 0))
    .map((m) => {
      let cost = Number(m.cost) || 0;
      if (m.type === 'free') cost = 0;
      if (m.type === 'per_item') cost = cost + Number(m.per_item || 0) * itemsQty;
      if (m.free_over !== null && m.free_over !== undefined && subtotal >= Number(m.free_over)) cost = 0;
      return {
        id: m.id,
        name: m.name,
        type: m.type,
        eta: m.eta,
        cost: roundMoney(convert(cost, currency), mode, settings.rounding_step),
      };
    });

  if (body.deliveryType === 'pickup' && !shippingOptions.some((o) => o.cost === 0)) {
    shippingOptions.unshift({ id: 'pickup', name: 'Retiro en local', type: 'free', eta: '15-20 min', cost: 0 });
  }

  const chosen =
    shippingOptions.find((o) => o.id === body.shippingMethodId) ||
    (body.deliveryType === 'pickup' ? shippingOptions.find((o) => o.cost === 0) : null) ||
    shippingOptions[0] ||
    null;

  // Cupón
  let couponDiscount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;
  if (body.couponCode) {
    const { data: couponRow } = await svc
      .from('coupons')
      .select('*')
      .ilike('code', String(body.couponCode).trim())
      .maybeSingle();

    if (!couponRow) {
      couponError = 'Ese cupón no existe.';
    } else {
      const coupon = couponRow as Coupon;
      const problem = couponProblem(coupon, subtotal);
      if (problem) {
        couponError = problem;
      } else {
        couponDiscount = computeDiscount(coupon, subtotal);
        couponCode = coupon.code;
      }
    }
  }

  const shippingCost = chosen?.cost ?? 0;
  const taxableBase = Math.max(0, subtotal - couponDiscount);
  const taxRatio = subtotal > 0 ? taxableBase / subtotal : 1;
  const finalTax = roundMoney(convert(taxTotal * (settings.prices_include_tax ? taxRatio : 1), currency), mode, settings.rounding_step);
  const totalNet = roundMoney(convert(subtotal - couponDiscount, currency), mode, settings.rounding_step);
  const total = roundMoney(
    settings.prices_include_tax ? totalNet + shippingCost : totalNet + finalTax + shippingCost,
    mode,
    settings.rounding_step
  );

  return NextResponse.json(
    {
      ok: true,
      currency: {
        code: currency?.code || settings.base_currency,
        symbol: currency?.symbol || '$',
        position: currency?.symbol_position || 'before',
        decimals: currency?.decimals ?? settings.currency_decimals,
      },
      lines,
      shippingOptions,
      shipping: chosen,
      coupon: { code: couponCode, discount: roundMoney(convert(couponDiscount, currency), mode, settings.rounding_step), error: couponError },
      totals: {
        itemsQty,
        subtotal: roundMoney(convert(subtotal, currency), mode, settings.rounding_step),
        discount: roundMoney(convert(couponDiscount, currency), mode, settings.rounding_step),
        tax: finalTax,
        shipping: shippingCost,
        total,
        pricesIncludeTax: settings.prices_include_tax,
      },
      warnings,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
