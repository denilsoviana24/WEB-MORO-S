import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

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
  created_at: string;
}

function tierOf(orders: number): { id: string; name: string; icon: string } {
  if (orders >= 15) return { id: 'oro', name: 'Moro Oro', icon: '🥇' };
  if (orders >= 7) return { id: 'plata', name: 'Moro Plata', icon: '🥈' };
  if (orders >= 1) return { id: 'bronce', name: 'Moro Bronce', icon: '🥉' };
  return { id: 'nuevo', name: 'Nuevo', icon: '✨' };
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const [profilesRes, ordersRes, redemptionsRes] = await Promise.all([
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
  ]);

  const profiles = (profilesRes.data || []) as ProfileRow[];
  const orders = (ordersRes.data || []) as OrderRow[];
  const redemptions = (redemptionsRes.data || []) as RedemptionRow[];

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
      tier: tierOf(valid.length),
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
      redemptions: redemptions.map((r) => ({
        ...r,
        customer: profiles.find((p) => p.id === r.user_id)?.name || 'Cliente',
        email: profiles.find((p) => p.id === r.user_id)?.email || '',
      })),
      stats: {
        members: members.length,
        newThisMonth: members.filter((m) => new Date(m.createdAt).getTime() >= monthStart).length,
        stampsInCards: members.reduce((s, m) => s + m.stamps, 0),
        rewardsRedeemed: redemptions.length,
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
