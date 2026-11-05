import { NextResponse } from 'next/server';
import { serviceClient, optionalUser } from '@/lib/adminAuth';
import { computeDiscount, couponProblem, type Coupon } from '@/lib/shop';
import {
  available,
  lineTotals,
  roundMoney,
  taxRateFor,
  variantPrice,
  type Currency,
  type RoundingMode,
  type StoreSettings,
  type TaxRate,
  type Variant,
} from '@/lib/catalog';
import { STAMPS_GOAL } from '@/data/loyaltyData';

/**
 * POST /api/orders
 * Crea un pedido real:
 *  - recalcula precios, impuestos y envío en el servidor
 *  - reserva inventario atómicamente (stock físico - reservado)
 *  - aplica cupón y cuenta su uso
 *  - suma el sello del Club Moro's si hay sesión
 */
interface IncomingItem {
  variantId?: string;
  id?: string;
  detail?: string;
  qty?: number;
}

interface Body {
  number?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryType?: 'pickup' | 'delivery';
  deliveryAddress?: string;
  addressReference?: string;
  region?: string;
  paymentMethod?: string;
  notes?: string;
  items?: IncomingItem[];
  couponCode?: string | null;
  currency?: string;
  shippingMethodId?: string | null;
}

function orderNumber(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `MOROS-${stamp}-${rnd}`;
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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida.' }, { status: 400 });
  }

  const rawItems = (body.items || []).filter((i) => (Number(i.qty) || 0) > 0 && (i.variantId || i.id));
  if (!rawItems.length) return NextResponse.json({ ok: false, error: 'El carrito está vacío.' }, { status: 400 });

  const user = await optionalUser(req);

  /* 1) Resolver variantes y productos ---------------------------- */
  const variantIds = rawItems.map((i) => i.variantId).filter(Boolean) as string[];
  const productIds = rawItems.map((i) => i.id).filter(Boolean) as string[];

  const [{ data: variantRows }, { data: productRows }, { data: settingsRow }, { data: taxes }, { data: currencies }] =
    await Promise.all([
      variantIds.length ? svc.from('product_variants').select('*').in('id', variantIds) : Promise.resolve({ data: [] }),
      productIds.length ? svc.from('products').select('*').in('id', productIds) : Promise.resolve({ data: [] }),
      svc.from('store_settings').select('*').eq('id', 1).maybeSingle(),
      svc.from('tax_rates').select('*').eq('active', true),
      svc.from('currencies').select('*').eq('active', true),
    ]);

  const settings: StoreSettings = { ...SETTINGS_DEFAULT, ...(settingsRow || {}) };
  const taxList = (taxes || []) as TaxRate[];
  const variantMap = new Map<string, Variant>((variantRows || []).map((v) => [v.id, v as Variant]));
  const productMap = new Map((productRows || []).map((p) => [p.id, p]));

  // Compatibilidad: carritos antiguos sin variante → variante por defecto del producto
  for (const raw of rawItems) {
    if (raw.variantId || !raw.id) continue;
    const { data: def } = await svc
      .from('product_variants')
      .select('*')
      .eq('product_id', raw.id)
      .eq('active', true)
      .order('sort_order')
      .limit(1)
      .maybeSingle();
    if (def) variantMap.set(def.id, def as Variant);
  }

  /* 2) Precios, impuestos y disponibilidad ----------------------- */
  const mode = settings.rounding_mode as RoundingMode;
  const lines: {
    variantId: string;
    productId: string;
    name: string;
    detail?: string;
    attributes: Record<string, string>;
    sku: string | null;
    qty: number;
    price: number;
    taxRate: number;
    subtotal: number;
    tax: number;
    dropship: boolean;
    supplier: string | null;
  }[] = [];

  for (const raw of rawItems) {
    let variant = raw.variantId ? variantMap.get(raw.variantId) : undefined;
    if (!variant && raw.id) {
      // primera variante activa del producto
      variant = [...variantMap.values()].find((v) => v.product_id === raw.id);
    }
    if (!variant) {
      return NextResponse.json(
        { ok: false, error: `"${raw.detail || 'Un producto'}" ya no está disponible.`, code: 'NOT_FOUND' },
        { status: 409 }
      );
    }

    const product = productMap.get(variant.product_id);
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Un producto de tu pedido ya no existe.' }, { status: 409 });
    }
    if (product.active === false || variant.active === false) {
      return NextResponse.json(
        { ok: false, error: `"${product.name}" ya no está disponible.` },
        { status: 409 }
      );
    }
    if (product.type === 'external') {
      return NextResponse.json(
        { ok: false, error: `"${product.name}" se compra en otra tienda.` },
        { status: 409 }
      );
    }

    const qty = Math.max(1, Math.floor(Number(raw.qty) || 1));

    // Precio: variante > opción heredada > producto
    const option = Array.isArray(product.options)
      ? (product.options as { size: string; price: number }[]).find((o) => o.size === raw.detail)
      : undefined;
    const unit = option ? Number(option.price) : variantPrice(variant);

    const free = available({
      manage: variant.manage_stock,
      stock: Number(variant.stock) || 0,
      reserved: Number(variant.reserved) || 0,
      backorders: variant.backorders,
    });
    if (variant.manage_stock && variant.backorders === 'no' && free < qty) {
      return NextResponse.json(
        {
          ok: false,
          error: free <= 0 ? `"${product.name}" está agotado.` : `Solo quedan ${free} de "${product.name}".`,
          code: 'OUT_OF_STOCK',
        },
        { status: 409 }
      );
    }

    const rate = taxRateFor(product.tax_rate_id, taxList, settings);
    const totals = lineTotals({ price: unit, qty, taxRate: rate }, settings.prices_include_tax, mode, settings.rounding_step);

    lines.push({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      detail: raw.detail || Object.values(variant.attributes || {}).join(' / ') || undefined,
      attributes: variant.attributes || {},
      sku: variant.sku,
      qty,
      price: unit,
      taxRate: rate,
      subtotal: totals.net,
      tax: totals.tax,
      dropship: Boolean(variant.dropship || product.dropship),
      supplier: variant.supplier || product.supplier || null,
    });
  }

  const subtotal = roundMoney(lines.reduce((s, l) => s + l.subtotal, 0), mode, settings.rounding_step);
  const taxTotal = roundMoney(lines.reduce((s, l) => s + l.tax, 0), mode, settings.rounding_step);

  if (settings.checkout_min_total > 0 && subtotal < settings.checkout_min_total) {
    return NextResponse.json(
      { ok: false, error: `El mínimo de compra es $${Number(settings.checkout_min_total).toFixed(2)}.` },
      { status: 400 }
    );
  }

  /* 3) Cupón ----------------------------------------------------- */
  let coupon: Coupon | null = null;
  let discount = 0;
  let couponCode: string | null = null;

  if (body.couponCode) {
    const { data } = await svc.from('coupons').select('*').ilike('code', String(body.couponCode).trim()).maybeSingle();
    if (data) {
      const c = data as Coupon;
      const problem = couponProblem(c, subtotal);
      if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
      coupon = c;
      discount = computeDiscount(c, subtotal);
      couponCode = c.code;
    }
  }

  /* 4) Envío ----------------------------------------------------- */
  const itemsQty = lines.reduce((s, l) => s + l.qty, 0);
  let shippingCost = 0;
  let shippingName: string | null = null;

  if (body.deliveryType !== 'pickup' && body.shippingMethodId) {
    const { data: method } = await svc
      .from('shipping_methods')
      .select('*')
      .eq('id', body.shippingMethodId)
      .eq('active', true)
      .maybeSingle();

    if (!method) {
      return NextResponse.json({ ok: false, error: 'Ese método de envío ya no está disponible.' }, { status: 409 });
    }
    shippingName = method.name;
    shippingCost = Number(method.cost) || 0;
    if (method.type === 'free') shippingCost = 0;
    if (method.type === 'per_item') shippingCost += Number(method.per_item || 0) * itemsQty;
    if (method.free_over !== null && method.free_over !== undefined && subtotal >= Number(method.free_over)) {
      shippingCost = 0;
    }
  } else if (body.deliveryType === 'pickup') {
    shippingName = 'Retiro en local';
  }

  const total = roundMoney(
    settings.prices_include_tax ? subtotal - discount + shippingCost : subtotal - discount + taxTotal + shippingCost,
    mode,
    settings.rounding_step
  );

  /* 5) Moneda ---------------------------------------------------- */
  const currencyCode = body.currency || settings.base_currency;
  const currency = ((currencies || []) as Currency[]).find((c) => c.code === currencyCode);
  const rate = Number(currency?.rate) || 1;

  /* 6) Pedido + reserva de stock -------------------------------- */
  const number = String(body.number || '').trim() || orderNumber();
  const expiresAt = new Date(Date.now() + settings.reserve_minutes * 60_000).toISOString();

  const { data: inserted, error: insertError } = await svc
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      order_number: number,
      items: lines.map((l) => ({
        variantId: l.variantId,
        id: l.productId,
        name: l.name,
        detail: l.detail,
        attributes: l.attributes,
        sku: l.sku,
        qty: l.qty,
        price: roundMoney(l.price * rate, mode, settings.rounding_step),
        taxRate: l.taxRate,
        tax: roundMoney(l.tax * rate, mode, settings.rounding_step),
        dropship: l.dropship,
        supplier: l.supplier,
      })),
      subtotal: roundMoney(subtotal * rate, mode, settings.rounding_step),
      discount: roundMoney(discount * rate, mode, settings.rounding_step),
      tax_total: roundMoney(taxTotal * rate, mode, settings.rounding_step),
      shipping_total: roundMoney(shippingCost * rate, mode, settings.rounding_step),
      shipping_method: shippingName,
      coupon_code: couponCode,
      currency: currencyCode,
      total: roundMoney(total * rate, mode, settings.rounding_step),
      status: 'pending',
      payment_status: 'pending',
      stock_state: 'reserved',
      reserved_until: expiresAt,
      delivery_type: body.deliveryType === 'pickup' ? 'pickup' : 'delivery',
      payment_method: String(body.paymentMethod || ''),
      customer_name: String(body.customerName || ''),
      customer_phone: String(body.customerPhone || ''),
      delivery_address: [body.deliveryAddress, body.addressReference].filter(Boolean).join(' · '),
      order_notes: String(body.notes || ''),
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el pedido.' }, { status: 500 });
  }

  const reservations: string[] = [];
  for (const line of lines) {
    const variant = variantMap.get(line.variantId);
    // Los productos sin control de inventario no reservan unidades.
    if (!variant || !variant.manage_stock) continue;

    const { data: resId, error: resError } = await svc.rpc('reserve_stock', {
      p_variant: line.variantId,
      p_qty: line.qty,
      p_minutes: settings.reserve_minutes,
      p_order: inserted.id,
    });

    if (resError || !resId) {
      // Deshacer todo y borrar el pedido
      for (const id of reservations) await svc.rpc('release_reservation', { p_reservation: id });
      await svc.from('orders').delete().eq('id', inserted.id);
      return NextResponse.json(
        { ok: false, error: `Se agotó "${line.name}" mientras comprabas.`, code: 'OUT_OF_STOCK' },
        { status: 409 }
      );
    }
    reservations.push(resId as string);
  }

  /* 7) Cupón, sellos y perfil ----------------------------------- */
  if (coupon) {
    await svc
      .from('coupons')
      .update({ used_count: (coupon.used_count || 0) + 1 })
      .eq('id', coupon.id);
  }

  let stamps: number | null = null;
  let completed = false;
  if (user) {
    const { data: prof } = await svc
      .from('profiles')
      .select('stamps,total_orders,total_spent')
      .eq('id', user.id)
      .maybeSingle();

    if (prof) {
      const current = Number(prof.stamps) || 0;
      const next = Math.min(current + 1, STAMPS_GOAL);
      completed = next === STAMPS_GOAL && current < STAMPS_GOAL;
      stamps = next;
      await svc
        .from('profiles')
        .update({
          stamps: next,
          total_orders: (Number(prof.total_orders) || 0) + 1,
          total_spent: roundMoney((Number(prof.total_spent) || 0) + total * rate, mode, settings.rounding_step),
        })
        .eq('id', user.id);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      order: inserted,
      subtotal: roundMoney(subtotal * rate, mode, settings.rounding_step),
      discount: roundMoney(discount * rate, mode, settings.rounding_step),
      tax: roundMoney(taxTotal * rate, mode, settings.rounding_step),
      shipping: roundMoney(shippingCost * rate, mode, settings.rounding_step),
      total: roundMoney(total * rate, mode, settings.rounding_step),
      currency: currencyCode,
      stamps,
      completed,
      coupon: couponCode,
      reservations,
      reservedUntil: expiresAt,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
