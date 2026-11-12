import { NextResponse } from 'next/server';
import { serviceClient, optionalUser } from '@/lib/adminAuth';
import { computeDiscount, couponProblem, type Coupon } from '@/lib/shop';
import {
  available,
  comboAvailable,
  comboIsLive,
  comboPrice,
  lineTotals,
  roundMoney,
  taxRateFor,
  variantPrice,
  type Combo,
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
 *  - recalcula precios, impuestos, envío y combos en el servidor
 *  - reserva inventario atómicamente (incluye los componentes de cada combo)
 *  - aplica cupón y cuenta su uso
 *  - suma el sello del Club Moro's si hay sesión
 */
interface IncomingItem {
  variantId?: string;
  comboId?: string;
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

interface Line {
  variantId?: string;
  comboId?: string;
  productId?: string;
  name: string;
  detail?: string;
  attributes?: Record<string, string>;
  sku?: string | null;
  qty: number;
  price: number;
  regular?: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  dropship: boolean;
  supplier: string | null;
  components?: { variantId: string; qty: number; name?: string }[];
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

  const rawItems = (body.items || []).filter(
    (i) => (Number(i.qty) || 0) > 0 && (i.variantId || i.comboId || i.id)
  );
  if (!rawItems.length) return NextResponse.json({ ok: false, error: 'El carrito está vacío.' }, { status: 400 });

  const user = await optionalUser(req);

  /* 1) Combos declarados ---------------------------------------- */
  const comboIds = [...new Set(rawItems.map((i) => i.comboId).filter(Boolean) as string[])];
  const [{ data: comboRows }, { data: settingsRow }, { data: taxes }, { data: currencies }] = await Promise.all([
    comboIds.length ? svc.from('combos').select('*').in('id', comboIds) : Promise.resolve({ data: [] }),
    svc.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    svc.from('tax_rates').select('*').eq('active', true),
    svc.from('currencies').select('*').eq('active', true),
  ]);

  const settings: StoreSettings = { ...SETTINGS_DEFAULT, ...(settingsRow || {}) };
  const mode = settings.rounding_mode as RoundingMode;
  const taxList = (taxes || []) as TaxRate[];
  const combos = (comboRows || []) as Combo[];

  const { data: comboItems } = comboIds.length
    ? await svc.from('combo_items').select('*').in('combo_id', comboIds)
    : { data: [] as { combo_id: string; variant_id: string; qty: number }[] };

  /* 2) Variantes y productos ------------------------------------ */
  const explicitVariantIds = rawItems.map((i) => i.variantId).filter(Boolean) as string[];
  const explicitProductIds = rawItems.map((i) => i.id).filter(Boolean) as string[];
  const comboVariantIds = (comboItems || []).map((i) => i.variant_id);

  const allVariantIds = [...new Set([...explicitVariantIds, ...comboVariantIds])];
  const { data: variantData } = allVariantIds.length
    ? await svc.from('product_variants').select('*').in('id', allVariantIds)
    : { data: [] as Variant[] };
  const variantMap = new Map<string, Variant>((variantData || []).map((v) => [v.id, v as Variant]));

  const productIds = [
    ...new Set([...explicitProductIds, ...[...variantMap.values()].map((v) => v.product_id)]),
  ];
  const { data: productData } = productIds.length
    ? await svc.from('products').select('*').in('id', productIds)
    : { data: [] };

  const productRows = (productData || []) as {
    id: string;
    name: string;
    price: number;
    sale_price: number | null;
    stock: number | null;
    options: { size: string; price: number }[] | null;
    active: boolean;
    tax_rate_id: string | null;
    type: string;
    dropship: boolean | null;
    supplier: string | null;
  }[];
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  /* 3) Armar líneas (productos y combos) ------------------------ */
  const lines: Line[] = [];

  for (const raw of rawItems) {
    const qty = Math.max(1, Math.floor(Number(raw.qty) || 1));

    /* --- Combo --- */
    if (raw.comboId) {
      const combo = combos.find((c) => c.id === raw.comboId);
      if (!combo || !comboIsLive(combo)) {
        return NextResponse.json({ ok: false, error: 'Un combo de tu pedido ya no está vigente.' }, { status: 409 });
      }

      const own = (comboItems || []).filter((i) => i.combo_id === combo.id);
      if (!own.length) {
        return NextResponse.json({ ok: false, error: `El combo "${combo.name}" no tiene productos.` }, { status: 409 });
      }

      const components = own.map((i) => {
        const v = variantMap.get(i.variant_id);
        const p = v ? productMap.get(v.product_id) : undefined;
        const free = v
          ? available({
              manage: v.manage_stock,
              stock: Number(v.stock) || 0,
              reserved: Number(v.reserved) || 0,
              backorders: v.backorders,
            })
          : 0;
        return {
          variantId: i.variant_id,
          qty: Number(i.qty) || 1,
          price: v ? variantPrice(v) : 0,
          name: p?.name || 'Producto',
          available: free,
        };
      });

      const totals = comboPrice(
        components,
        Number(combo.discount_percent) || 0,
        combo.fixed_price === null ? null : Number(combo.fixed_price)
      );
      const free = comboAvailable(components.map((c) => ({ available: c.available, qty: c.qty })));

      if (free !== Infinity && free < qty) {
        return NextResponse.json(
          {
            ok: false,
            error: free <= 0 ? `El combo "${combo.name}" está agotado.` : `Solo quedan ${free} del combo "${combo.name}".`,
            code: 'OUT_OF_STOCK',
          },
          { status: 409 }
        );
      }

      const rate = taxRateFor(null, taxList, settings);
      const lt = lineTotals({ price: totals.price, qty, taxRate: rate }, settings.prices_include_tax, mode, settings.rounding_step);

      lines.push({
        comboId: combo.id,
        name: combo.name,
        detail: components.map((c) => `${c.qty}x ${c.name}`).join(' + '),
        qty,
        price: totals.price,
        regular: totals.regular,
        taxRate: rate,
        subtotal: lt.net,
        tax: lt.tax,
        dropship: false,
        supplier: null,
        components: components.map((c) => ({ variantId: c.variantId, qty: c.qty * qty, name: c.name })),
      });
      continue;
    }

    /* --- Producto / variante --- */
    let variant = raw.variantId ? variantMap.get(raw.variantId) : undefined;
    if (!variant && raw.id) variant = [...variantMap.values()].find((v) => v.product_id === raw.id);
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
      return NextResponse.json({ ok: false, error: `"${product.name}" ya no está disponible.` }, { status: 409 });
    }
    if (product.type === 'external') {
      return NextResponse.json({ ok: false, error: `"${product.name}" se compra en otra tienda.` }, { status: 409 });
    }

    const option = Array.isArray(product.options)
      ? product.options.find((o) => o.size === raw.detail)
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

  /* 4) Cupón ----------------------------------------------------- */
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

  /* 5) Envío ----------------------------------------------------- */
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

  /* 6) Moneda ---------------------------------------------------- */
  const currencyCode = body.currency || settings.base_currency;
  const currency = ((currencies || []) as Currency[]).find((c) => c.code === currencyCode);
  const rate = Number(currency?.rate) || 1;

  /* 7) Pedido + reserva de stock -------------------------------- */
  const number = String(body.number || '').trim() || orderNumber();
  const expiresAt = new Date(Date.now() + settings.reserve_minutes * 60_000).toISOString();

  const { data: inserted, error: insertError } = await svc
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      order_number: number,
      items: lines.map((l) => ({
        variantId: l.variantId,
        comboId: l.comboId,
        components: l.components,
        id: l.productId,
        name: l.name,
        detail: l.detail,
        attributes: l.attributes,
        sku: l.sku,
        qty: l.qty,
        price: roundMoney(l.price * rate, mode, settings.rounding_step),
        regular: l.regular ? roundMoney(l.regular * rate, mode, settings.rounding_step) : undefined,
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
  const reserveOne = async (variantId: string, qty: number, label: string) => {
    const variant = variantMap.get(variantId);
    if (!variant || !variant.manage_stock) return true;

    const { data: resId, error: resError } = await svc.rpc('reserve_stock', {
      p_variant: variantId,
      p_qty: qty,
      p_minutes: settings.reserve_minutes,
      p_order: inserted.id,
    });
    if (resError || !resId) return label;
    reservations.push(resId as string);
    return true;
  };

  for (const line of lines) {
    if (line.comboId) {
      for (const comp of line.components || []) {
        const ok = await reserveOne(comp.variantId, comp.qty, line.name);
        if (ok !== true) {
          for (const id of reservations) await svc.rpc('release_reservation', { p_reservation: id });
          await svc.from('orders').delete().eq('id', inserted.id);
          return NextResponse.json(
            { ok: false, error: `Se agotó un producto del combo "${line.name}".`, code: 'OUT_OF_STOCK' },
            { status: 409 }
          );
        }
      }
    } else if (line.variantId) {
      const ok = await reserveOne(line.variantId, line.qty, line.name);
      if (ok !== true) {
        for (const id of reservations) await svc.rpc('release_reservation', { p_reservation: id });
        await svc.from('orders').delete().eq('id', inserted.id);
        return NextResponse.json(
          { ok: false, error: `Se agotó "${line.name}" mientras comprabas.`, code: 'OUT_OF_STOCK' },
          { status: 409 }
        );
      }
    }
  }

  /* 8) Cupón, sellos y perfil ----------------------------------- */
  if (coupon) {
    await svc.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
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
