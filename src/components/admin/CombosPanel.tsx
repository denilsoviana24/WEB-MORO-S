'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, X, Save, Loader2, Package, Percent, CalendarClock } from 'lucide-react';
import { adminFetch, money, shortDate } from '@/lib/adminClient';
import type { Variant } from '@/lib/catalog';

interface ProductRow {
  id: string;
  name: string;
}

interface ComboItem {
  id?: string;
  variant_id: string;
  qty: number;
}

interface ComboRow {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  image: string;
  discount_percent: number;
  fixed_price: number | null;
  badge: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  items: ComboItem[];
}

interface FormState {
  id?: string;
  name: string;
  description: string;
  image: string;
  discount: string;
  fixed_price: string;
  badge: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
  items: ComboItem[];
}

const EMPTY: FormState = {
  name: '',
  description: '',
  image: '',
  discount: '15',
  fixed_price: '',
  badge: '',
  active: true,
  starts_at: '',
  ends_at: '',
  items: [],
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function CombosPanel() {
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [pickVariant, setPickVariant] = useState('');
  const [pickQty, setPickQty] = useState('1');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [c, p, v] = await Promise.all([
        adminFetch<{ combos: ComboRow[] }>('/api/admin/combos'),
        adminFetch<{ products: ProductRow[] }>('/api/admin/products'),
        adminFetch<{ variants: Variant[] }>('/api/admin/catalog?resource=variants'),
      ]);
      setCombos(c.combos);
      setProducts(p.products);
      setVariants(v.variants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const variantLabel = useMemo(() => {
    const nameById = new Map(products.map((p) => [p.id, p.name]));
    const map = new Map<string, string>();
    variants.forEach((v) => {
      const base = nameById.get(v.product_id) || 'Producto';
      map.set(v.id, `${base}${v.title && v.title !== 'Único' ? ` — ${v.title}` : ''} (${v.sku || 'sin SKU'})`);
    });
    return map;
  }, [products, variants]);

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        name: form.name,
        description: form.description,
        image: form.image,
        discount_percent: Number(form.discount) || 0,
        fixed_price: form.fixed_price === '' ? null : Number(form.fixed_price),
        badge: form.badge,
        active: form.active,
        starts_at: toIso(form.starts_at),
        ends_at: toIso(form.ends_at),
        items: form.items.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
      };
      await adminFetch('/api/admin/combos', {
        method: form.id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setForm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (combo: ComboRow) => {
    if (!confirm(`¿Borrar el combo "${combo.name}"?`)) return;
    try {
      await adminFetch(`/api/admin/combos?id=${combo.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.');
    }
  };

  const toggle = async (combo: ComboRow) => {
    try {
      await adminFetch('/api/admin/combos', {
        method: 'PATCH',
        body: JSON.stringify({ id: combo.id, active: !combo.active }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  const addItem = () => {
    if (!form || !pickVariant) return;
    if (form.items.some((i) => i.variant_id === pickVariant)) {
      setError('Ese producto ya está en el combo; cambia la cantidad.');
      return;
    }
    setForm({ ...form, items: [...form.items, { variant_id: pickVariant, qty: Math.max(1, Number(pickQty) || 1) }] });
    setPickVariant('');
    setPickQty('1');
    setError('');
  };

  const input =
    'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';
  const label = 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1';

  if (loading) return <p className="text-sm text-zinc-400">Cargando combos…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Combos</h2>
          <p className="text-xs text-zinc-400">
            Agrupa productos con descuento y vigencia. Al venderse se descuenta el stock de cada componente.
          </p>
        </div>
        <button
          onClick={() => setForm({ ...EMPTY, items: [] })}
          className="flex items-center gap-2 text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3 py-2 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Nuevo combo
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>
      )}

      {combos.length === 0 ? (
        <div className="text-center py-14 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-bold">Todavía no hay combos</p>
          <p className="text-xs text-zinc-500 mt-1">Crea uno con 2 o más productos y un % de descuento.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {combos.map((c) => {
            const live =
              c.active &&
              (!c.starts_at || new Date(c.starts_at).getTime() <= Date.now()) &&
              (!c.ends_at || new Date(c.ends_at).getTime() >= Date.now());
            return (
              <div key={c.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center gap-3">
                <div className="min-w-[180px]">
                  <p className="font-black text-white text-sm">{c.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {c.items.length} producto(s)
                    {c.fixed_price ? ` · precio fijo ${money(Number(c.fixed_price))}` : ` · ${c.discount_percent}% OFF`}
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                    live
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {live ? 'Vigente' : c.active ? 'Fuera de fechas' : 'Inactivo'}
                </span>

                {c.starts_at && <span className="text-[10px] text-zinc-500">desde {shortDate(c.starts_at)}</span>}
                {c.ends_at && <span className="text-[10px] text-zinc-500">hasta {shortDate(c.ends_at)}</span>}

                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => toggle(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      c.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {c.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() =>
                      setForm({
                        id: c.id,
                        name: c.name,
                        description: c.description || '',
                        image: c.image || '',
                        discount: String(c.discount_percent ?? 0),
                        fixed_price: c.fixed_price === null ? '' : String(c.fixed_price),
                        badge: c.badge || '',
                        active: c.active,
                        starts_at: toLocalInput(c.starts_at),
                        ends_at: toLocalInput(c.ends_at),
                        items: c.items.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
                      })
                    }
                    className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(c)} className="p-2 rounded-lg text-zinc-400 hover:text-red-400" title="Borrar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-5 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white">{form.id ? 'Editar combo' : 'Nuevo combo'}</h3>
              <button onClick={() => setForm(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={label}>Nombre *</label>
                <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Combo Familiar" />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Descripción</label>
                <textarea className={input} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Imagen (URL)</label>
                <input className={input} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
              </div>

              <div>
                <label className={label}>Descuento (%)</label>
                <input className={input} type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div>
                <label className={label}>Precio fijo (opcional)</label>
                <input className={input} type="number" step="0.01" value={form.fixed_price} onChange={(e) => setForm({ ...form, fixed_price: e.target.value })} placeholder="Vacío = usar %" />
              </div>

              <div>
                <label className={label}>
                  <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Desde</span>
                </label>
                <input className={input} type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <label className={label}>Hasta</label>
                <input className={input} type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>

              <div>
                <label className={label}>Etiqueta</label>
                <input className={input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Ej. Combo Familia" />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 mt-6">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-amber-500" />
                Activo
              </label>
            </div>

            {/* Componentes */}
            <div className="mt-5 border-t border-zinc-800 pt-4">
              <h4 className="font-black text-white text-sm mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" /> Productos del combo
              </h4>

              {form.items.length === 0 ? (
                <p className="text-xs text-zinc-500 mb-2">Añade los productos que incluye.</p>
              ) : (
                <div className="space-y-1.5 mb-3">
                  {form.items.map((item) => (
                    <div key={item.variant_id} className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
                      <span className="text-zinc-200 flex-1 truncate">{variantLabel.get(item.variant_id) || 'Producto'}</span>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            items: form.items.map((i) =>
                              i.variant_id === item.variant_id ? { ...i, qty: Math.max(1, Number(e.target.value) || 1) } : i
                            ),
                          })
                        }
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                      <button
                        onClick={() => setForm({ ...form, items: form.items.filter((i) => i.variant_id !== item.variant_id) })}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid sm:grid-cols-[1fr_90px_auto] gap-2">
                <select className={input} value={pickVariant} onChange={(e) => setPickVariant(e.target.value)}>
                  <option value="">Elegir producto…</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {variantLabel.get(v.id)}
                    </option>
                  ))}
                </select>
                <input className={input} type="number" min="1" value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
                <button
                  onClick={addItem}
                  disabled={!pickVariant}
                  className="px-3 py-2 rounded-xl text-xs font-black text-zinc-950 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setForm(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={busy || !form.name || form.items.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar combo
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
        <Percent className="w-3 h-3" /> El precio del combo se calcula con la suma de sus productos menos el descuento.
      </p>
    </div>
  );
}
