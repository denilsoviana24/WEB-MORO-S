'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { adminFetch, money } from '@/lib/adminClient';
import { ORDER_STATUSES } from '@/lib/shop';

interface Stats {
  salesToday: number;
  salesMonth: number;
  ordersToday: number;
  totalOrders: number;
  byStatus: Record<string, number>;
  topProducts: { name: string; qty: number; revenue: number }[];
  lowStock: { id: string; name: string; stock: number | null; state: string }[];
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await adminFetch<Stats>('/api/admin/stats'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-sm text-zinc-400">Cargando resumen…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!stats) return null;

  const cards = [
    { icon: <DollarSign className="w-5 h-5" />, label: 'Ventas de hoy', value: money(stats.salesToday), tint: 'text-emerald-400' },
    { icon: <ShoppingBag className="w-5 h-5" />, label: 'Pedidos de hoy', value: String(stats.ordersToday), tint: 'text-sky-400' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Ventas del mes', value: money(stats.salesMonth), tint: 'text-amber-400' },
    { icon: <Package className="w-5 h-5" />, label: 'Pedidos totales', value: String(stats.totalOrders), tint: 'text-violet-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Resumen de la tienda</h2>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <div className={`${c.tint} mb-2`}>{c.icon}</div>
            <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">{c.label}</p>
            <p className="text-2xl font-black text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
          <h3 className="font-black text-white text-sm mb-3">Pedidos por estado</h3>
          <div className="space-y-2">
            {ORDER_STATUSES.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-full border font-bold ${s.color}`}>{s.label}</span>
                <span className="font-black text-white">{stats.byStatus[s.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
          <h3 className="font-black text-white text-sm mb-3">Más vendidos</h3>
          {stats.topProducts.length === 0 ? (
            <p className="text-xs text-zinc-500">Todavía no hay ventas registradas.</p>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 truncate">
                    <span className="text-amber-400 font-black mr-1">#{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-zinc-400 whitespace-nowrap ml-2">
                    {p.qty} u. · <strong className="text-white">{money(p.revenue)}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <h3 className="font-black text-amber-400 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Inventario bajo
          </h3>
          <div className="space-y-1.5">
            {stats.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-200">{p.name}</span>
                <span className={p.state === 'out' ? 'text-red-400 font-black' : 'text-amber-400 font-bold'}>
                  {p.state === 'out' ? 'AGOTADO' : `${p.stock} unidades`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
