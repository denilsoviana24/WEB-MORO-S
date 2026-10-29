import { NextResponse } from 'next/server';
import { serviceClient, optionalUser } from '@/lib/adminAuth';
import { computeDiscount, couponProblem, effectivePrice, type Coupon, type Product } from '@/lib/shop';
import { STAMPS_GOAL } from '@/data/loyaltyData';

/**
 * POST /api/orders
 * Crea un pedido de la tienda:
 *  - recalcula precios en el servidor (nunca confía en el navegador)
 *  - valida y descuenta inventario
 *  - aplica cupón y cuenta su uso
 *  - suma el sello del Club Moro's si hay sesión
 */
interface IncomingItem {
  id?: string;
  name?: string;
  detail?: string;
  qty?: number;
}

function orderNumber(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `MOROS-${stamp}-${rnd}`;
}

export async function POST(req: Request) {
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: 'Tienda no configurada.' }, { status: 501 });

  let body: {
    number?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryType?: 'pickup' | 'delivery';
    deliveryAddress?: string;
    paymentMethod?: string;
    notes?: string;
    items?: IncomingItem[];
    couponCode?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida.' }, { status: 400 });
  }

  const rawItems = (body.items || []).filter((i) => (Number(i.qty) || 0) > 0);
  if (!rawItems.length) {
    return NextResponse.json({ ok: false, error: 'El carrito está vacío.' }, { status: 400 });
  }

  const user = await optionalUser(req);

  // 1) Productos reales desde la base
  const ids = rawItems.map((i) => String(i.id || '')).filter(Boolean);
  const { data: dbProducts, error: prodError } = await svc
    .from('products')
    .select('*')
    .in('id', ids);
  if (prodError) {
    return NextResponse.json({ ok: false, error: 'No se pudieron leer los productos.' }, { status: 500 });
  }
  const byId = new Map<string, Product>();
  (dbProducts || []).forEach((p) => byId.set((p as Product).id, p as Product));

  // 2) Precios recalculados + stock
  const items: {
    id: string;
    name: string;
    detail?: string;
    qty: number;
    price: number;
    subtotal: number;
  }[] = [];

  for (const raw of rawItems) {
    const id = String(raw.id || '');
    const product = byId.get(id);
    if (!product || !product.active) {
      return NextResponse.json(
        { ok: false, error: `"${raw.name || 'Un producto'}" ya no está disponible.` },
        { status: 409 }
      );
    }

    const qty = Math.max(1, Math.floor(Number(raw.qty) || 1));
    const option = (product.options || []).find((o) => o.size === raw.detail);
    const price = option ? Number(option.price) : effectivePrice(product);

    if (product.stock !== null && product.stock !== undefined && product.stock < qty) {
      return NextResponse.json(
        {
          ok: false,
          error: `Solo quedan ${Math.max(0, product.stock)} de "${product.name}".`,
          code: 'OUT_OF_STOCK',
        },
        { status: 409 }
      );
    }

    items.push({
      id,
      name: product.name,
      detail: raw.detail,
      qty,
      price,
      subtotal: Math.round(price * qty * 100) / 100,
    });
  }

  const subtotal = Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;

  // 3) Cupón
  let coupon: Coupon | null = null;
  let discount = 0;
  let couponCode: string | null = null;

  if (body.couponCode) {
    const { data } = await svc
      .from('coupons')
      .select('*')
      .ilike('code', String(body.couponCode).trim())
      .maybeSingle();

    if (data) {
      const c = data as Coupon;
      const problem = couponProblem(c, subtotal);
      if (problem) {
        return NextResponse.json({ ok: false, error: problem }, { status: 400 });
      }
      coupon = c;
      discount = computeDiscount(c, subtotal);
      couponCode = c.code;
    }
  }

  const total = Math.round((subtotal - discount) * 100) / 100;

  // 4) Inventario
  for (const item of items) {
    const product = byId.get(item.id);
    if (!product || product.stock === null || product.stock === undefined) continue;
    const { data: okStock, error: stockError } = await svc.rpc('decrement_stock', {
      p_id: item.id,
      p_qty: item.qty,
    });
    if (stockError || okStock !== true) {
      return NextResponse.json(
        { ok: false, error: `Se agotó "${item.name}" mientras comprabas.`, code: 'OUT_OF_STOCK' },
        { status: 409 }
      );
    }
  }

  // 5) Pedido
  const number = String(body.number || '').trim() || orderNumber();
  const { data: inserted, error: insertError } = await svc
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      order_number: number,
      items,
      subtotal,
      discount,
      coupon_code: couponCode,
      total,
      status: 'pending',
      delivery_type: body.deliveryType === 'pickup' ? 'pickup' : 'delivery',
      payment_method: String(body.paymentMethod || ''),
      customer_name: String(body.customerName || ''),
      customer_phone: String(body.customerPhone || ''),
      delivery_address: String(body.deliveryAddress || ''),
      order_notes: String(body.notes || ''),
    })
    .select('*')
    .single();

  if (insertError) {
    // Si falló el pedido, devolvemos el stock reservado
    for (const item of items) {
      const product = byId.get(item.id);
      if (product && product.stock !== null && product.stock !== undefined) {
        await svc.rpc('restore_stock', { p_id: item.id, p_qty: item.qty });
      }
    }
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el pedido.' }, { status: 500 });
  }

  // 6) Uso del cupón
  if (coupon) {
    await svc
      .from('coupons')
      .update({ used_count: (coupon.used_count || 0) + 1 })
      .eq('id', coupon.id);
  }

  // 7) Club Moro's (sello)
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
          total_spent: Math.round(((Number(prof.total_spent) || 0) + total) * 100) / 100,
        })
        .eq('id', user.id);
    }
  }

  return NextResponse.json({
    ok: true,
    order: inserted,
    subtotal,
    discount,
    total,
    stamps,
    completed,
    coupon: couponCode,
  });
}
