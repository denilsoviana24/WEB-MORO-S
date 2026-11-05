'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Wand2, X, Save, Boxes, Loader2 } from 'lucide-react';
import { adminFetch, money } from '@/lib/adminClient';
import type { Attribute, Variant } from '@/lib/catalog';

interface ProductRow {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  price: number;
  attribute_ids: string[] | null;
}

interface VariantForm {
  id?: string;
  sku: string;
  title: string;
  price: string;
  sale_price: string;
  stock: string;
  dropship: boolean;
  supplier: string;
  active: boolean;
}

const EMPTY_VARIANT: VariantForm = {
  sku: '',
  title: '',
  price: '',
  sale_price: '',
  stock: '0',
  dropship: false,
  supplier: '',
  active: true,
};

export default function CatalogPanel() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [attrName, setAttrName] = useState('');
  const [attrValues, setAttrValues] = useState('');

  const [form, setForm] = useState<VariantForm | null>(null);

  const [genOpen, setGenOpen] = useState(false);
  const [genAttrs, setGenAttrs] = useState<string[]>([]);
  const [genValues, setGenValues] = useState<Record<string, string[]>>({});
  const [genPrice, setGenPrice] = useState('');
  const [genStock, setGenStock] = useState('0');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [p, a] = await Promise.all([
        adminFetch<{ products: ProductRow[] }>('/api/admin/products'),
        adminFetch<{ attributes: Attribute[] }>('/api/admin/catalog?resource=attributes'),
      ]);
      setProducts(p.products);
      setAttributes(a.attributes);
      if (!productId && p.products.length) setProductId(p.products[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (pid: string) => {
    if (!pid) return;
    try {
      const data = await adminFetch<{ variants: Variant[] }>(`/api/admin/catalog?resource=variants&productId=${pid}`);
      setVariants(data.variants);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (productId) loadVariants(productId);
  }, [productId]);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  const createAttribute = async () => {
    if (!attrName.trim()) return;
    setBusy(true);
    setError('');
    try {
      await adminFetch('/api/admin/catalog', {
        method: 'POST',
        body: JSON.stringify({
          resource: 'attributes',
          name: attrName,
          terms: attrValues.split(',').map((v) => v.trim()).filter(Boolean),
        }),
      });
      setAttrName('');
      setAttrValues('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAttribute = async (id: string) => {
    if (!confirm('¿Borrar este atributo y sus valores?')) return;
    try {
      await adminFetch(`/api/admin/catalog?resource=attributes&id=${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.');
    }
  };

  const saveVariant = async () => {
    if (!form || !productId) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        resource: 'variants',
        product_id: productId,
        id: form.id,
        sku: form.sku,
        title: form.title || 'Variante',
        price: Number(form.price) || 0,
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        stock: Number(form.stock) || 0,
        dropship: form.dropship,
        supplier: form.supplier,
        active: form.active,
      };
      await adminFetch('/api/admin/catalog', {
        method: form.id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setForm(null);
      await loadVariants(productId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const deleteVariant = async (v: Variant) => {
    if (!confirm(`¿Borrar la variante ${v.sku || v.title}?`)) return;
    try {
      await adminFetch(`/api/admin/catalog?resource=variants&id=${v.id}`, { method: 'DELETE' });
      await loadVariants(productId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.');
    }
  };

  const generate = async () => {
    if (!productId) return;
    const options = genAttrs
      .map((name) => ({ name, values: genValues[name] || [] }))
      .filter((o) => o.values.length);
    if (!options.length) {
      setError('Selecciona al menos un atributo con valores.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await adminFetch<{ ok: boolean; created: number }>('/api/admin/catalog', {
        method: 'POST',
        body: JSON.stringify({
          resource: 'generate',
          product_id: productId,
          options,
          base_price: Number(genPrice) || product?.price || 0,
          stock: Number(genStock) || 0,
        }),
      });
      setGenOpen(false);
      setGenAttrs([]);
      setGenValues({});
      await loadVariants(productId);
      if (res.created === 0) setError('Todas esas combinaciones ya existían.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar.');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';
  const label = 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1';

  if (loading) return <p className="text-sm text-zinc-400">Cargando catálogo…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Catálogo y variantes</h2>
          <p className="text-xs text-zinc-400">
            Atributos, combinaciones y un SKU único por variante física.
          </p>
        </div>
        <select className={`${input} max-w-xs`} value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Atributos */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
        <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-amber-400" /> Atributos
        </h3>

        <div className="flex flex-wrap gap-2 mb-3">
          {attributes.length === 0 && <p className="text-xs text-zinc-500">Aún no hay atributos.</p>}
          {attributes.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-2 bg-zinc-950 border border-zinc-700 rounded-full pl-3 pr-2 py-1 text-[11px] text-zinc-200"
            >
              <strong className="text-amber-400">{a.name}</strong>
              <span className="text-zinc-500">{a.terms.map((t) => t.value).join(' · ')}</span>
              <button onClick={() => deleteAttribute(a.id)} className="text-zinc-500 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-2">
          <input className={input} placeholder="Atributo (Talla, Color…)" value={attrName} onChange={(e) => setAttrName(e.target.value)} />
          <input className={input} placeholder="Valores separados por coma (S, M, L)" value={attrValues} onChange={(e) => setAttrValues(e.target.value)} />
          <button
            onClick={createAttribute}
            disabled={busy || !attrName.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>
      </div>

      {/* Variantes del producto */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-black text-white text-sm">
          Variantes de {product?.name || 'producto'}{' '}
          <span className="text-zinc-500 font-normal">({variants.length})</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setGenOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
          >
            <Wand2 className="w-3.5 h-3.5" /> Generar combinaciones
          </button>
          <button
            onClick={() => setForm({ ...EMPTY_VARIANT })}
            className="flex items-center gap-2 text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Variante
          </button>
        </div>
      </div>

      {variants.length === 0 ? (
        <p className="text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center">
          Este producto no tiene variantes. Genera combinaciones o crea una manualmente.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Combinación</th>
                <th className="px-3 py-3">Precio</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Reservado</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {variants.map((v) => (
                <tr key={v.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-300">{v.sku || '—'}</td>
                  <td className="px-3 py-2 text-zinc-200">
                    {Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(' · ') || v.title}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-black text-amber-400">{money(Number(v.price))}</span>
                    {v.sale_price !== null && v.sale_price !== undefined && (
                      <span className="block text-[10px] text-emerald-400">Oferta {money(Number(v.sale_price))}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-200">{v.manage_stock ? v.stock : '∞'}</td>
                  <td className="px-3 py-2 text-zinc-400">{v.reserved}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() =>
                          setForm({
                            id: v.id,
                            sku: v.sku || '',
                            title: v.title,
                            price: String(v.price),
                            sale_price: v.sale_price === null ? '' : String(v.sale_price),
                            stock: String(v.stock ?? 0),
                            dropship: v.dropship,
                            supplier: v.supplier || '',
                            active: v.active,
                          })
                        }
                        className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteVariant(v)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal variante */}
      {form && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white">{form.id ? 'Editar variante' : 'Nueva variante'}</h3>
              <button onClick={() => setForm(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={label}>SKU único</label>
                <input className={input} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="MOR-CAMISA-ROJO-M" />
              </div>
              <div className="col-span-2">
                <label className={label}>Nombre / combinación</label>
                <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Rojo / M" />
              </div>
              <div>
                <label className={label}>Precio</label>
                <input className={input} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className={label}>Oferta</label>
                <input className={input} type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
              </div>
              <div>
                <label className={label}>Stock</label>
                <input className={input} type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className={label}>Proveedor (dropshipping)</label>
                <input className={input} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Opcional" />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <input type="checkbox" checked={form.dropship} onChange={(e) => setForm({ ...form, dropship: e.target.checked })} className="accent-amber-500" />
                Dropshipping
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-amber-500" />
                Activa
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setForm(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700">
                Cancelar
              </button>
              <button
                onClick={saveVariant}
                disabled={busy || !form.price}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal generar matriz */}
      {genOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 my-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-white">Generar combinaciones</h3>
              <button onClick={() => setGenOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mb-3">
              Elige atributos y sus valores. Se creará una variante con SKU propio por cada combinación.
            </p>

            <div className="space-y-3">
              {attributes.map((a) => {
                const selected = genAttrs.includes(a.name);
                return (
                  <div key={a.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGenAttrs((prev) => [...prev, a.name]);
                            setGenValues((prev) => ({ ...prev, [a.name]: a.terms.map((t) => t.value) }));
                          } else {
                            setGenAttrs((prev) => prev.filter((n) => n !== a.name));
                          }
                        }}
                        className="accent-amber-500"
                      />
                      {a.name}
                    </label>
                    {selected && (
                      <input
                        className={`${input} mt-2`}
                        value={(genValues[a.name] || []).join(', ')}
                        onChange={(e) =>
                          setGenValues((prev) => ({
                            ...prev,
                            [a.name]: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                          }))
                        }
                        placeholder="Valores separados por coma"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className={label}>Precio base</label>
                <input className={input} type="number" step="0.01" value={genPrice} onChange={(e) => setGenPrice(e.target.value)} placeholder={String(product?.price ?? 0)} />
              </div>
              <div>
                <label className={label}>Stock inicial</label>
                <input className={input} type="number" value={genStock} onChange={(e) => setGenStock(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setGenOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700">
                Cancelar
              </button>
              <button
                onClick={generate}
                disabled={busy || !genAttrs.length}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
