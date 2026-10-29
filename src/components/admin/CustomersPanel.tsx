'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, RotateCcw, ShieldCheck, ShieldOff, Users, Gift, RefreshCw } from 'lucide-react';
import { adminFetch, money, shortDate } from '@/lib/adminClient';

interface Customer {
  id: string;
  email: string;
  name: string;
  stamps: number;
  total_orders: number;
  total_spent: number;
  is_admin: boolean;
  created_at: string;
}

interface Redemption {
  id: string;
  user_id: string;
  reward_code: string;
  reward_title: string;
  stamps_used: number;
  created_at: string;
}

export default function CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (search = q) => {
    setLoading(true);
    setError('');
    try {
      const qs = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
      const data = await adminFetch<{ customers: Customer[]; redemptions: Redemption[] }>(
        `/api/admin/customers${qs}`
      );
      setCustomers(data.customers);
      setRedemptions(data.redemptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setError('');
    try {
      await adminFetch('/api/admin/customers', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...body }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  const names = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.name || c.email));
    return map;
  }, [customers]);

  const input =
    'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Clientes</h2>
          <p className="text-xs text-zinc-400">{customers.length} cuenta(s) registradas</p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className={`${input} pl-9`}
            placeholder="Buscar por nombre o correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(q)}
          />
        </div>
        <button
          onClick={() => load(q)}
          className="px-4 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Cargando clientes…</p>
      ) : customers.length === 0 ? (
        <div className="text-center py-14 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-bold">Sin clientes todavía</p>
          <p className="text-xs text-zinc-500 mt-1">Aquí aparecerán las cuentas del Club Moro&apos;s.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Club</th>
                <th className="px-3 py-3">Pedidos</th>
                <th className="px-3 py-3">Gastado</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {customers.map((c) => (
                <tr key={c.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
                  <td className="px-3 py-3">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      {c.name || 'Sin nombre'}
                      {c.is_admin && (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-zinc-500">{c.email}</p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-amber-400 font-black">{c.stamps ?? 0}</span>
                    <span className="text-zinc-500"> / 20</span>
                  </td>
                  <td className="px-3 py-3 text-zinc-300">{c.total_orders ?? 0}</td>
                  <td className="px-3 py-3 text-zinc-300">{money(c.total_spent ?? 0)}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => patch(c.id, { add_stamp: true })}
                        title="Sumar 1 sello"
                        className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => patch(c.id, { stamps: 0 })}
                        title="Reiniciar sellos"
                        className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => patch(c.id, { is_admin: !c.is_admin })}
                        title={c.is_admin ? 'Quitar administrador' : 'Hacer administrador'}
                        className={`p-2 rounded-lg ${
                          c.is_admin
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {c.is_admin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
        <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" /> Premios canjeados
        </h3>
        {redemptions.length === 0 ? (
          <p className="text-xs text-zinc-500">Todavía nadie ha canjeado un premio.</p>
        ) : (
          <div className="space-y-1.5">
            {redemptions.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-zinc-200">
                  <strong className="text-amber-400">{r.reward_code}</strong> · {r.reward_title}
                </span>
                <span className="text-zinc-500">
                  {names.get(r.user_id) || 'Cliente'} · {shortDate(r.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
