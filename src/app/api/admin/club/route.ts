import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { normalizeTiers } from '@/lib/clubConfig';

/**
 * Admin · Club Moro's.
 * Miembros, visitas, sellos, nivel, premios canjeados y uso de promociones.
 */
const NO_STORE = { 'Cache-Control': 'no-store' };

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  stamps: number;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

interface OrderRow {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  total: number;
  discount: number;
  coupon_code: string | null;
  status: string;
  created_at: string;
}

interface RedemptionRow {
  id: string;
  user_id: string;
  reward_code: string;
  reward_title: string;
  stamps_used: number;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Levels {
  bronze: number;
  silver: number;
  gold: number;
}

function tierOf(orders: number, levels: Levels): { id: string; name: string; icon: string } {
  if (orders >= levels.gold) return { id: 'oro', name: 'Moro Oro', icon: '🥇' };
  if (orders >= levels.silver) return { id: 'plata', name: 'Moro Plata', icon: '🥈' };
  if (orders >= levels.bronze) return { id: 'bronce', name: 'Moro Bronce', icon: '🥉' };
  return { id: 'nuevo', name: 'Nuevo', icon: '✨' };
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const [profilesRes, ordersRes, redemptionsRes, settingsRes] = await Promise.all([
    guard.svc
      .from('profiles')
      .select('id,email,name,stamps,total_orders,total_spent,created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    guard.svc
      .from('orders')
      .select('id,user_id,customer_name,customer_phone,total,discount,coupon_code,status,created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    guard.svc
      .from('redemptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    guard.svc.from('club_settings').select('*').eq('id', 1).maybeSingle(),
  ]);

  const profiles = (profilesRes.data || []) as ProfileRow[];
  const orders = (ordersRes.data || []) as OrderRow[];
  const redemptions = (redemptionsRes.data || []) as RedemptionRow[];
  const settingsRow = (settingsRes.data || null) as Record<string, unknown> | null;

  const levels: Levels = {
    bronze: Number(settingsRow?.bronze_orders ?? 1),
    silver: Number(settingsRow?.silver_orders ?? 7),
    gold: Number(settingsRow?.gold_orders ?? 15),
  };
  const goal = Number(settingsRow?.stamps_goal ?? 20) || 20;

  const byUser = new Map<string, OrderRow[]>();
  for (const order of orders) {
    if (!order.user_id) continue;
    const list = byUser.get(order.user_id) || [];
    list.push(order);
    byUser.set(order.user_id, list);
  }

  const redemptionsByUser = new Map<string, RedemptionRow[]>();
  for (const r of redemptions) {
    const list = redemptionsByUser.get(r.user_id) || [];
    list.push(r);
    redemptionsByUser.set(r.user_id, list);
  }

  const members = profiles.map((p) => {
    const own = byUser.get(p.id) || [];
    const valid = own.filter((o) => o.status !== 'cancelled');
    const last = valid[0] || null;
    const couponsUsed = valid.filter((o) => o.coupon_code).length;
    const discountSaved = valid.reduce((s, o) => s + Number(o.discount || 0), 0);
    const reds = redemptionsByUser.get(p.id) || [];

    return {
      id: p.id,
      name: p.name || 'Sin nombre',
      email: p.email,
      stamps: Number(p.stamps) || 0,
      tier: tierOf(valid.length, levels),
      orders: valid.length,
      totalOrders: Number(p.total_orders) || 0,
      spent: Math.round(Number(p.total_spent || 0) * 100) / 100,
      lastOrderAt: last?.created_at || null,
      lastOrderTotal: last ? Number(last.total) : null,
      couponsUsed,
      discountSaved: Math.round(discountSaved * 100) / 100,
      rewards: reds.length,
      createdAt: p.created_at,
      recentOrders: valid.slice(0, 5).map((o) => ({
        id: o.id,
        number: null,
        total: Number(o.total),
        coupon: o.coupon_code,
        status: o.status,
        createdAt: o.created_at,
      })),
      redemptions: reds.map((r) => ({
        code: r.reward_code,
        title: r.reward_title,
        stamps: r.stamps_used,
        createdAt: r.created_at,
      })),
    };
  });

  /* Compras sin cuenta: se agrupan por teléfono (o nombre si no hay). */
  const guestMap = new Map<
    string,
    {
      key: string;
      name: string;
      phone: string;
      orders: number;
      spent: number;
      couponsUsed: number;
      discountSaved: number;
      firstOrderAt: string;
      lastOrderAt: string;
      lastTotal: number;
      coupons: string[];
    }
  >();

  for (const order of orders) {
    if (order.user_id && profiles.some((p) => p.id === order.user_id)) continue;
    if (order.status === 'cancelled') continue;

    const phone = String(order.customer_phone || '').replace(/[^0-9]/g, '');
    const name = String(order.customer_name || '').trim() || 'Cliente';
    const key = phone || `n:${name.toLowerCase()}`;

    const prev = guestMap.get(key);
    if (prev) {
      prev.orders += 1;
      prev.spent += Number(order.total || 0);
      prev.discountSaved += Number(order.discount || 0);
      if (order.coupon_code) {
        prev.couponsUsed += 1;
        if (!prev.coupons.includes(order.coupon_code)) prev.coupons.push(order.coupon_code);
      }
      if (new Date(order.created_at).getTime() > new Date(prev.lastOrderAt).getTime()) {
        prev.lastOrderAt = order.created_at;
        prev.lastTotal = Number(order.total || 0);
      }
    } else {
      guestMap.set(key, {
        key,
        name,
        phone: order.customer_phone || '',
        orders: 1,
        spent: Number(order.total || 0),
        couponsUsed: order.coupon_code ? 1 : 0,
        discountSaved: Number(order.discount || 0),
        firstOrderAt: order.created_at,
        lastOrderAt: order.created_at,
        lastTotal: Number(order.total || 0),
        coupons: order.coupon_code ? [order.coupon_code] : [],
      });
    }
  }

  const guests = [...guestMap.values()]
    .map((g) => ({
      ...g,
      spent: Math.round(g.spent * 100) / 100,
      discountSaved: Math.round(g.discountSaved * 100) / 100,
    }))
    .sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());

  const couponUses = orders
    .filter((o) => o.coupon_code && o.status !== 'cancelled')
    .slice(0, 150)
    .map((o) => {
      const member = profiles.find((p) => p.id === o.user_id);
      return {
        id: o.id,
        code: o.coupon_code,
        customer: member?.name || o.customer_name || 'Cliente',
        email: member?.email || '',
        phone: o.customer_phone || '',
        discount: Number(o.discount || 0),
        total: Number(o.total || 0),
        guest: !member,
        createdAt: o.created_at,
      };
    });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return NextResponse.json(
    {
      members,
      guests,
      couponUses,
      settings: settingsRow,
      goal,
      levels,
      redemptions: redemptions.map((r) => ({
        ...r,
        delivered: Boolean(r.delivered_at),
        customer: profiles.find((p) => p.id === r.user_id)?.name || 'Cliente',
        email: profiles.find((p) => p.id === r.user_id)?.email || '',
      })),
      stats: {
        members: members.length,
        newThisMonth: members.filter((m) => new Date(m.createdAt).getTime() >= monthStart).length,
        stampsInCards: members.reduce((s, m) => s + m.stamps, 0),
        rewardsRedeemed: redemptions.length,
        rewardsPending: redemptions.filter((r) => !r.delivered_at).length,
        couponsUsed: couponUses.length,
        discountGiven: Math.round(couponUses.reduce((s, c) => s + c.discount, 0) * 100) / 100,
        membersWithOrders: members.filter((m) => m.orders > 0).length,
        guests: guests.length,
        guestOrders: guests.reduce((s, g) => s + g.orders, 0),
        guestSpent: Math.round(guests.reduce((s, g) => s + g.spent, 0) * 100) / 100,
        totalOrders: orders.filter((o) => o.status !== 'cancelled').length,
      },
    },
    { headers: NO_STORE }
  );
}

/**
 * PATCH /api/admin/club
 * action = 'settings'   → reglas, premio, niveles y textos de la web
 * action = 'member'     → sellos o nombre de un cliente
 * action = 'redemption' → marcar/desmarcar un premio como entregado
 */
export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || '');

  /* ---------- Reglas y textos del club ---------- */
  if (action === 'settings') {
    const input = (body.settings || {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    const setInt = (key: string, min: number, max: number) => {
      if (input[key] === undefined) return;
      const n = Number(input[key]);
      if (!Number.isFinite(n)) return;
      patch[key] = Math.min(max, Math.max(min, Math.round(n)));
    };
    const setText = (key: string, max: number) => {
      if (input[key] === undefined) return;
      const value = String(input[key]).slice(0, max).trim();
      if (value) patch[key] = value;
    };

    setInt('stamps_goal', 1, 100);
    setInt('bronze_orders', 0, 999);
    setInt('silver_orders', 0, 999);
    setInt('gold_orders', 0, 999);
    setText('reward_code', 40);
    setText('reward_title', 140);
    setText('reward_description', 400);
    setText('section_title', 120);
    setText('section_highlight', 60);
    setText('section_subtitle', 300);
    setText('section_note', 400);

    if (input.auto_stamp !== undefined) patch.auto_stamp = Boolean(input.auto_stamp);
    if (input.tiers !== undefined) patch.tiers = normalizeTiers(input.tiers);

    const { data, error } = await guard.svc
      .from('club_settings')
      .update(patch)
      .eq('id', 1)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
    return NextResponse.json({ settings: data }, { headers: NO_STORE });
  }

  /* ---------- Sellos / nombre de un cliente ---------- */
  if (action === 'member') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Falta el cliente.' }, { status: 400 });

    const { data: settingsRow } = await guard.svc
      .from('club_settings')
      .select('stamps_goal')
      .eq('id', 1)
      .maybeSingle();
    const goal = Number(settingsRow?.stamps_goal ?? 20) || 20;

    const patch: Record<string, unknown> = {};
    if (body.stamps !== undefined) {
      const n = Number(body.stamps);
      if (!Number.isFinite(n)) return NextResponse.json({ error: 'Sellos inválidos.' }, { status: 400 });
      patch.stamps = Math.min(goal, Math.max(0, Math.round(n)));
    }
    if (body.name !== undefined) {
      const name = String(body.name).trim().slice(0, 40);
      if (!name) return NextResponse.json({ error: 'El nombre no puede quedar vacío.' }, { status: 400 });
      patch.name = name;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 });
    }

    const { data, error } = await guard.svc
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select('id,email,name,stamps,total_orders,total_spent,created_at')
      .single();

    if (error) {
      const msg = error.message.includes('duplicate') ? 'Ese nombre ya está en uso.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400, headers: NO_STORE });
    }
    return NextResponse.json({ member: data }, { headers: NO_STORE });
  }

  /* ---------- Premio entregado ---------- */
  if (action === 'redemption') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Falta el premio.' }, { status: 400 });

    const delivered = body.delivered !== false;
    const { data, error } = await guard.svc
      .from('redemptions')
      .update({ delivered_at: delivered ? new Date().toISOString() : null })
      .eq('id', id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE });
    return NextResponse.json({ redemption: { ...data, delivered } }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Acción desconocida.' }, { status: 400 });
}
