'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Plus, Minus, Package, Clock, History, AlertTriangle, Truck } from 'lucide-react';
import { adminFetch, shortDate } from '@/lib/adminClient';

interface StockRow {
  id: string;
  product_name: string;
  sku: string | null;
  title: string;
  stock: number | null;
  reserved: number;
  available: number;
  manage_stock: boolean;
  dropship: boolean;
  supplier: string | null;
}

interface Reservation {
  id: string;
  variant_id: string;
  qty: number;
  expires_at: string;
  released: boolean;
}

interface Movement {
  id: string;
  variant_id: string | null;
  delta: number;
  reason: string;
  created_at: string;
}

export default function StockPanel() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{ variants: StockRow[]; reservations: Reservation[]; movements: Movement[] }>(
        '/api/admin/stock'
      );
      setRows(data.variants);
      setReservations(data.reservations);
      setMovements(data.movements);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const adjust = async (variantId: string, delta: number) => {
    setError('');
    try {
      await adminFetch('/api/admin/stock', {
        method: 'POST',
        body: JSON.stringify({ action: 'adjust', variantId, delta, reason: delta > 0 ? 'entrada' : 'salida' }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ajustar.');
    }
  };

  const expire = async () => {
    try {
      const res = await adminFetch<{ released: number }>('/api/admin/stock', {
        method: 'POST',
        body: JSON.stringify({ action: 'expire' }),
      });
      await load();
      if (res.released === 0) setError('No había reservas caducadas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo liberar.');
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.product_name.toLowerCase().includes(term) ||
        (r.sku || '').toLowerCase().includes(term) ||
        (r.supplier || '').toLowerCase().includes(term)
    );
  }, [rows, q]);

  const totals = useMemo(() => {
    const out = rows.filter((r) => r.manage_stock && r.available <= 0).length;
    const low = rows.filter((r) => r.manage_stock && r.available > 0 && r.available <= 5).length;
    const reserved = rows.reduce((s, r) => s + (Number(r.reserved) || 0), 0);
    const dropship = rows.filter((r) => r.dropship).length;
    return { out, low, reserved, dropship, total: rows.length };
  }, [rows]);

  const input =
    'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Inventario</h2>
          <p className="text-xs text-zinc-400">Stock físico, reservado y disponible por variante.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expire}
            className="flex items-center gap-2 text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
            title="Liberar reservas vencidas"
          >
            <Clock className="w-3.5 h-3.5" /> Liberar caducadas
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Variantes', value: totals.total, icon: <Package className="w-4 h-4" />, tint: 'text-sky-400' },
          { label: 'Stock bajo', value: totals.low, icon: <AlertTriangle className="w-4 h-4" />, tint: 'text-amber-400' },
          { label: 'Agotadas', value: totals.out, icon: <AlertTriangle className="w-4 h-4" />, tint: 'text-red-400' },
          { label: 'Unidades reservadas', value: totals.reserved, icon: <Clock className="w-4 h-4" />, tint: 'text-violet-400' },
        ].map((c) => (
          <div key={c.label} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <div className={`${c.tint} mb-2`}>{c.icon}</div>
            <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">{c.label}</p>
            <p className="text-2xl font-black text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <input className={input} placeholder="Buscar por producto, SKU o proveedor…" value={q} onChange={(e) => setQ(e.target.value)} />

      {loading ? (
        <p className="text-sm text-zinc-400">Cargando inventario…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-3">Producto / SKU</th>
                <th className="px-3 py-3">Físico</th>
                <th className="px-3 py-3">Reservado</th>
                <th className="px-3 py-3">Disponible</th>
                <th className="px-3 py-3 text-right">Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((r) => (
                <tr key={r.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
                  <td className="px-3 py-2">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      {r.product_name}
                      {r.dropship && (
                        <span className="text-[9px] font-black text-sky-400 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded">
                          DROPSHIP
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {r.sku || '—'} {r.title && r.title !== 'Único' ? `· ${r.title}` : ''}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-zinc-200">{r.manage_stock ? r.stock : '∞'}</td>
                  <td className="px-3 py-2 text-violet-400">{r.reserved}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-black ${
                        !r.manage_stock ? 'text-zinc-500' : r.available <= 0 ? 'text-red-400' : r.available <= 5 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {r.manage_stock ? r.available : '∞'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => adjust(r.id, -1)}
                        disabled={!r.manage_stock || (r.stock || 0) <= 0}
                        className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 disabled:opacity-30"
                        title="Quitar 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => adjust(r.id, 1)}
                        disabled={!r.manage_stock}
                        className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 disabled:opacity-30"
                        title="Sumar 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
          <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" /> Reservas activas ({reservations.length})
          </h3>
          {reservations.length === 0 ? (
            <p className="text-xs text-zinc-500">No hay stock reservado en este momento.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[11px] text-zinc-300">
                  <span>
                    {rows.find((x) => x.id === r.variant_id)?.sku || 'Variante'} · {r.qty} u.
                  </span>
                  <span className="text-zinc-500">vence {shortDate(r.expires_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
          <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" /> Últimos movimientos
          </h3>
          {movements.length === 0 ? (
            <p className="text-xs text-zinc-500">Todavía no hay movimientos registrados.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-300">
                    {rows.find((x) => x.id === m.variant_id)?.sku || 'Variante'}{' '}
                    <span className="text-zinc-500">({m.reason})</span>
                  </span>
                  <span className={m.delta >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {m.delta >= 0 ? '+' : ''}
                    {m.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totals.dropship > 0 && (
        <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" /> {totals.dropship} variante(s) marcadas como dropshipping.
        </p>
      )}
    </div>
  );
}
