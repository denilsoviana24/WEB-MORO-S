import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { stockState, type Product } from '@/lib/shop';

/** Admin · Resumen: ventas de hoy/mes, pedidos por estado, top productos y stock bajo. */

interface OrderItem {
  id?: string;
  name?: string;
  qty?: number;
  price?: number;
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.res;

  const { data: orders, error } = await guard.svc
    .from('orders')
    .select('id,total,status,created_at,items')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const valid = (orders || []).filter((o) => o.status !== 'cancelled');

  const salesToday = valid
    .filter((o) => new Date(o.created_at).getTime() >= startToday)
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const salesMonth = valid
    .filter((o) => new Date(o.created_at).getTime() >= startMonth)
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const ordersToday = valid.filter((o) => new Date(o.created_at).getTime() >= startToday).length;

  const byStatus: Record<string, number> = {};
  (orders || []).forEach((o) => {
    byStatus[o.status || 'pending'] = (byStatus[o.status || 'pending'] || 0) + 1;
  });

  // Top productos (por unidades vendidas)
  const counter = new Map<string, { name: string; qty: number; revenue: number }>();
  valid.forEach((o) => {
    const items = Array.isArray(o.items) ? (o.items as OrderItem[]) : [];
    items.forEach((i) => {
      const name = i.name || 'Producto';
      const qty = Number(i.qty) || 0;
      const revenue = (Number(i.price) || 0) * qty;
      const prev = counter.get(name) || { name, qty: 0, revenue: 0 };
      counter.set(name, { name, qty: prev.qty + qty, revenue: prev.revenue + revenue });
    });
  });
  const topProducts = [...counter.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Stock bajo
  const { data: products } = await guard.svc.from('products').select('*').eq('active', true);
  const lowStock = (products || [])
    .map((p) => p as Product)
    .filter((p) => {
      const st = stockState(p);
      return st === 'low' || st === 'out';
    })
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock, state: stockState(p) }));

  return NextResponse.json({
    salesToday: Math.round(salesToday * 100) / 100,
    salesMonth: Math.round(salesMonth * 100) / 100,
    ordersToday,
    totalOrders: (orders || []).length,
    byStatus,
    topProducts,
    lowStock,
  });
}
