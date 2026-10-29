'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ChevronDown, MapPin, Store, Phone, Printer } from 'lucide-react';
import { adminFetch, money, shortDate } from '@/lib/adminClient';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/shop';

interface OrderRow {
  id: string;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  subtotal?: number;
  discount?: number;
  coupon_code?: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_type: string;
  delivery_address: string;
  payment_method: string;
  order_notes: string;
  items: { name: string; detail?: string; qty: number; price: number }[];
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const qs = filter ? `?status=${filter}` : '';
      const data = await adminFetch<{ orders: OrderRow[] }>(`/api/admin/orders${qs}`);
      setOrders(data.orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await adminFetch('/api/admin/orders', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
    }
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => (map[o.status] = (map[o.status] || 0) + 1));
    return map;
  }, [orders]);

  const select =
    'bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Pedidos</h2>
          <p className="text-xs text-zinc-400">
            {orders.length} pedido(s){filter ? ' con este estado' : ' recientes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className={select} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Cargando pedidos…</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <p className="text-sm text-zinc-300 font-bold">Aún no hay pedidos</p>
          <p className="text-xs text-zinc-500 mt-1">Los pedidos de la web aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const statusMeta = ORDER_STATUSES.find((s) => s.id === o.status) || ORDER_STATUSES[0];
            const isOpen = open === o.id;
            const itemsTotal = (o.items || []).reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
            return (
              <div key={o.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setOpen(isOpen ? null : o.id)}
                    className="flex items-center gap-2 text-left flex-1 min-w-[180px]"
                  >
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <div>
                      <p className="text-sm font-black text-white">{o.order_number}</p>
                      <p className="text-[11px] text-zinc-400">
                        {shortDate(o.created_at)} · {o.customer_name || 'Cliente'}
                      </p>
                    </div>
                  </button>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusMeta.color}`}>
                    {statusMeta.label}
                  </span>

                  <span className="text-sm font-black text-amber-400">{money(o.total)}</span>

                  <select
                    className={select}
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isOpen && (
                  <div className="border-t border-zinc-800 p-4 grid md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-2 text-zinc-300">
                        {o.delivery_type === 'delivery' ? (
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                        ) : (
                          <Store className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {o.delivery_type === 'delivery' ? 'Domicilio' : 'Retiro en local'}
                        {o.delivery_address ? ` · ${o.delivery_address}` : ''}
                      </p>
                      {o.customer_phone && (
                        <p className="flex items-center gap-2 text-zinc-300">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <a href={`tel:${o.customer_phone}`} className="hover:underline">
                            {o.customer_phone}
                          </a>
                        </p>
                      )}
                      <p className="text-zinc-400">Pago: <strong className="text-zinc-200">{o.payment_method}</strong></p>
                      {o.order_notes && <p className="text-zinc-400 italic">Notas: {o.order_notes}</p>}
                    </div>

                    <div>
                      <div className="space-y-1">
                        {(o.items || []).map((i, idx) => (
                          <div key={idx} className="flex justify-between gap-2 text-zinc-300">
                            <span>
                              {i.qty}x {i.name}
                              {i.detail ? <span className="text-zinc-500"> ({i.detail})</span> : null}
                            </span>
                            <span className="whitespace-nowrap">{money(Number(i.price) * Number(i.qty))}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-zinc-800 mt-2 pt-2 space-y-1">
                        <div className="flex justify-between text-zinc-400">
                          <span>Subtotal</span>
                          <span>{money(o.subtotal ?? itemsTotal)}</span>
                        </div>
                        {Number(o.discount) > 0 && (
                          <div className="flex justify-between text-emerald-400 font-bold">
                            <span>Cupón {o.coupon_code || ''}</span>
                            <span>-{money(o.discount || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-white">
                          <span>Total</span>
                          <span>{money(o.total)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
