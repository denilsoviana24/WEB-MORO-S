'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Ticket, Power } from 'lucide-react';
import { adminFetch, money, shortDate } from '@/lib/adminClient';
import { couponLabel, type Coupon } from '@/lib/shop';

export default function CouponsPanel() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    amount: '',
    min_total: '',
    max_uses: '',
    expires_at: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{ coupons: Coupon[] }>('/api/admin/coupons');
      setCoupons(data.coupons);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setSaving(true);
    setError('');
    try {
      await adminFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          amount: Number(form.amount),
          min_total: Number(form.min_total) || 0,
          max_uses: form.max_uses === '' ? null : Number(form.max_uses),
          expires_at: form.expires_at || null,
          active: true,
        }),
      });
      setForm({ code: '', type: 'percent', amount: '', min_total: '', max_uses: '', expires_at: '' });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el cupón.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon) => {
    try {
      await adminFetch('/api/admin/coupons', {
        method: 'PATCH',
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`¿Borrar el cupón ${c.code}?`)) return;
    try {
      await adminFetch(`/api/admin/coupons?id=${c.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.');
    }
  };

  const input =
    'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';
  const label = 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Cupones</h2>
          <p className="text-xs text-zinc-400">{coupons.length} cupón(es)</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3 py-2 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Nuevo cupón
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {showForm && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={label}>Código *</label>
              <input
                className={`${input} uppercase`}
                placeholder="MOROS10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className={label}>Tipo</label>
              <select
                className={input}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className={label}>Descuento *</label>
              <input
                className={input}
                type="number"
                step="0.01"
                placeholder={form.type === 'percent' ? '10' : '1.50'}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Compra mínima ($)</label>
              <input
                className={input}
                type="number"
                step="0.01"
                placeholder="0"
                value={form.min_total}
                onChange={(e) => setForm({ ...form, min_total: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Usos máximos</label>
              <input
                className={input}
                type="number"
                placeholder="Vacío = ilimitado"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Caduca el</label>
              <input
                className={input}
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              onClick={create}
              disabled={saving || !form.code || !form.amount}
              className="px-4 py-2 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? 'Creando…' : 'Crear cupón'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Cargando cupones…</p>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Ticket className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-bold">Sin cupones todavía</p>
          <p className="text-xs text-zinc-500 mt-1">Crea uno y tus clientes podrán usarlo en el carrito.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => {
            const expired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
            const usedUp = c.max_uses !== null && c.used_count >= c.max_uses;
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3"
              >
                <span className="font-black text-amber-400 tracking-wider">{c.code}</span>
                <span className="text-xs text-zinc-300">{couponLabel(c)}</span>
                {Number(c.min_total) > 0 && (
                  <span className="text-[11px] text-zinc-500">desde {money(c.min_total)}</span>
                )}
                <span className="text-[11px] text-zinc-500">
                  usos: {c.used_count}
                  {c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                </span>
                {c.expires_at && (
                  <span className={`text-[11px] ${expired ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                    {expired ? 'caducado' : `hasta ${shortDate(c.expires_at)}`}
                  </span>
                )}
                {usedUp && <span className="text-[11px] text-red-400 font-bold">sin usos</span>}

                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => toggle(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      c.active
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                    title="Activar / desactivar"
                  >
                    <Power className="w-3 h-3 inline mr-1" />
                    {c.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                    title="Borrar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
