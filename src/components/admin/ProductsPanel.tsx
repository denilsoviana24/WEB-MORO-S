'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Download, X, Save, Package } from 'lucide-react';
import { adminFetch, money } from '@/lib/adminClient';
import { CATEGORIES } from '@/data/menuData';
import { stockState, type Product, type ProductOption } from '@/lib/shop';

interface FormState {
  id?: string;
  name: string;
  category: string;
  price: string;
  sale_price: string;
  stock: string;
  low_stock: string;
  sku: string;
  image: string;
  description: string;
  badge: string;
  active: boolean;
  featured: boolean;
  optionsText: string;
}

const EMPTY: FormState = {
  name: '',
  category: 'broaster',
  price: '',
  sale_price: '',
  stock: '',
  low_stock: '5',
  sku: '',
  image: '',
  description: '',
  badge: '',
  active: true,
  featured: false,
  optionsText: '',
};

function parseOptions(text: string): ProductOption[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [size, price] = part.split(':');
      return { size: (size || '').trim(), price: Number(String(price || '').replace(',', '.')) || 0 };
    })
    .filter((o) => o.size);
}

function optionsToText(options: ProductOption[]): string {
  return (options || []).map((o) => `${o.size}:${o.price}`).join(', ');
}

export default function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{ products: Product[] }>('/api/admin/products');
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => setForm({ ...EMPTY });

  const openEdit = (p: Product) =>
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      price: String(p.price),
      sale_price: p.sale_price === null ? '' : String(p.sale_price),
      stock: p.stock === null ? '' : String(p.stock),
      low_stock: String(p.low_stock ?? 5),
      sku: p.sku ?? '',
      image: p.image ?? '',
      description: p.description ?? '',
      badge: p.badge ?? '',
      active: p.active,
      featured: p.featured,
      optionsText: optionsToText(p.options || []),
    });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        name: form.name,
        category: form.category,
        price: Number(form.price) || 0,
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        stock: form.stock === '' ? null : Number(form.stock),
        low_stock: Number(form.low_stock) || 5,
        sku: form.sku,
        image: form.image,
        description: form.description,
        badge: form.badge,
        active: form.active,
        featured: form.featured,
        options: parseOptions(form.optionsText),
      };
      await adminFetch('/api/admin/products', {
        method: form.id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setForm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`¿Borrar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await adminFetch(`/api/admin/products?id=${p.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.');
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await adminFetch('/api/admin/products', {
        method: 'PATCH',
        body: JSON.stringify({ id: p.id, active: !p.active }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  const importMenu = async () => {
    try {
      const res = await adminFetch<{ ok: boolean; error?: string; imported?: number }>(
        '/api/admin/products/seed',
        { method: 'POST' }
      );
      if (!res.ok) setError(res.error || 'No se pudo importar.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar.');
    }
  };

  const input =
    'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';
  const label = 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Productos</h2>
          <p className="text-xs text-zinc-400">{products.length} en el catálogo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={importMenu}
            className="flex items-center gap-2 text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
            title="Copia el menú actual de la web a la tienda"
          >
            <Download className="w-3.5 h-3.5" /> Importar menú
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Nuevo producto
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Cargando productos…</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-bold">Tu tienda está vacía</p>
          <p className="text-xs text-zinc-500 mt-1">
            Pulsa <strong>Importar menú</strong> para traer los platos actuales, o crea uno nuevo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">Precio</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Visible</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((p) => {
                const st = stockState(p);
                return (
                  <tr key={p.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
                    <td className="px-3 py-3">
                      <p className="font-bold text-white">{p.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {p.category}
                        {p.featured ? ' · destacado' : ''}
                        {p.sale_price ? ' · oferta' : ''}
                      </p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-black text-amber-400">{money(p.price)}</span>
                      {p.sale_price !== null && p.sale_price !== undefined && (
                        <span className="block text-[11px] text-emerald-400">Oferta: {money(p.sale_price)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {st === 'unlimited' ? (
                        <span className="text-zinc-500">Ilimitado</span>
                      ) : st === 'out' ? (
                        <span className="text-red-400 font-black">Agotado</span>
                      ) : st === 'low' ? (
                        <span className="text-amber-400 font-bold">{p.stock} (bajo)</span>
                      ) : (
                        <span className="text-zinc-200">{p.stock}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          p.active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {p.active ? 'Visible' : 'Oculto'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(p)}
                          className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                          title="Borrar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de producto */}
      {form && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white">{form.id ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={() => setForm(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={label}>Nombre *</label>
                <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className={label}>Categoría</label>
                <select
                  className={input}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c.id !== 'todos').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div>
                <label className={label}>SKU / código</label>
                <input className={input} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>

              <div>
                <label className={label}>Precio normal *</label>
                <input
                  className={input}
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div>
                <label className={label}>Precio de oferta</label>
                <input
                  className={input}
                  type="number"
                  step="0.01"
                  placeholder="Vacío = sin oferta"
                  value={form.sale_price}
                  onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                />
              </div>

              <div>
                <label className={label}>Stock</label>
                <input
                  className={input}
                  type="number"
                  placeholder="Vacío = ilimitado"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>

              <div>
                <label className={label}>Aviso stock bajo</label>
                <input
                  className={input}
                  type="number"
                  value={form.low_stock}
                  onChange={(e) => setForm({ ...form, low_stock: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className={label}>Imagen (URL)</label>
                <input
                  className={input}
                  placeholder="https://… o /images/plato.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className={label}>Descripción</label>
                <textarea
                  className={input}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className={label}>Etiqueta</label>
                <input
                  className={input}
                  placeholder="Popular, Oferta…"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                />
              </div>

              <div>
                <label className={label}>Tamaños (opcional)</label>
                <input
                  className={input}
                  placeholder="Personal:2.50, Grande:3.50"
                  value={form.optionsText}
                  onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-amber-500"
                />
                Visible en la tienda
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="accent-amber-500"
                />
                Destacado
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setForm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name || !form.price}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
