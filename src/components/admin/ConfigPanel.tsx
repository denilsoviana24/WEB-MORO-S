'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Save, Loader2, Coins, Percent, Truck, SlidersHorizontal } from 'lucide-react';
import { adminFetch, money } from '@/lib/adminClient';
import type { Currency, ShippingMethod, StoreSettings, TaxRate } from '@/lib/catalog';

interface Zone {
  id: string;
  name: string;
  active: boolean;
}

export default function ConfigPanel() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [taxes, setTaxes] = useState<TaxRate[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '$', rate: '1', decimals: '2' });
  const [newTax, setNewTax] = useState({ name: '', rate: '' });
  const [newMethod, setNewMethod] = useState({
    name: '',
    type: 'flat' as 'flat' | 'free' | 'per_item',
    cost: '',
    per_item: '',
    free_over: '',
    eta: '',
  });
  const [editMethod, setEditMethod] = useState<{
    id: string;
    name: string;
    type: 'flat' | 'free' | 'per_item';
    cost: string;
    per_item: string;
    free_over: string;
    eta: string;
    active: boolean;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{
        settings: StoreSettings | null;
        currencies: Currency[];
        taxes: TaxRate[];
        zones: Zone[];
        methods: ShippingMethod[];
      }>('/api/admin/config');
      setSettings(data.settings);
      setCurrencies(data.currencies);
      setTaxes(data.taxes);
      setZones(data.zones);
      setMethods(data.methods);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  const saveSettings = async (patch: Partial<StoreSettings>) => {
    setBusy(true);
    setError('');
    try {
      const res = await adminFetch<{ settings: StoreSettings }>('/api/admin/config', {
        method: 'PATCH',
        body: JSON.stringify({ resource: 'settings', ...patch }),
      });
      setSettings(res.settings);
      flash('Configuración guardada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const addCurrency = async () => {
    setBusy(true);
    setError('');
    try {
      await adminFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ resource: 'currency', ...newCurrency, rate: Number(newCurrency.rate), decimals: Number(newCurrency.decimals) }),
      });
      setNewCurrency({ code: '', name: '', symbol: '$', rate: '1', decimals: '2' });
      await load();
      flash('Moneda añadida.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo añadir.');
    } finally {
      setBusy(false);
    }
  };

  const addTax = async () => {
    setBusy(true);
    setError('');
    try {
      await adminFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ resource: 'tax', name: newTax.name, rate: Number(newTax.rate), is_default: taxes.length === 0 }),
      });
      setNewTax({ name: '', rate: '' });
      await load();
      flash('Impuesto añadido.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo añadir.');
    } finally {
      setBusy(false);
    }
  };

  const addMethod = async () => {
    setBusy(true);
    setError('');
    try {
      await adminFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({
          resource: 'method',
          zone_id: zones[0]?.id || null,
          name: newMethod.name,
          type: newMethod.type,
          cost: Number(newMethod.cost) || 0,
          per_item: Number(newMethod.per_item) || 0,
          free_over: newMethod.free_over === '' ? null : Number(newMethod.free_over),
          eta: newMethod.eta,
        }),
      });
      setNewMethod({ name: '', type: 'flat', cost: '', per_item: '', free_over: '', eta: '' });
      await load();
      flash('Método de envío añadido.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo añadir.');
    } finally {
      setBusy(false);
    }
  };

  const saveMethod = async () => {
    if (!editMethod) return;
    setBusy(true);
    setError('');
    try {
      await adminFetch('/api/admin/config', {
        method: 'PATCH',
        body: JSON.stringify({
          resource: 'method',
          id: editMethod.id,
          name: editMethod.name,
          type: editMethod.type,
          cost: Number(editMethod.cost) || 0,
          per_item: Number(editMethod.per_item) || 0,
          free_over: editMethod.free_over === '' ? null : Number(editMethod.free_over),
          eta: editMethod.eta,
          active: editMethod.active,
        }),
      });
      setEditMethod(null);
      await load();
      flash('Método de envío actualizado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';
  const label = 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1';

  if (loading) return <p className="text-sm text-zinc-400">Cargando configuración…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-white">Impuestos, monedas y envíos</h2>
        <p className="text-xs text-zinc-400">Todo desde una configuración central para toda la tienda.</p>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>
      )}
      {saved && (
        <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">{saved}</p>
      )}

      {/* Configuración general */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
        <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Reglas de precio
        </h3>

        {settings && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={label}>Moneda base</label>
              <select
                className={input}
                value={settings.base_currency}
                onChange={(e) => saveSettings({ base_currency: e.target.value })}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Redondeo</label>
              <select
                className={input}
                value={settings.rounding_mode}
                onChange={(e) => saveSettings({ rounding_mode: e.target.value as StoreSettings['rounding_mode'] })}
              >
                <option value="half_up">Normal (0.5 sube)</option>
                <option value="up">Siempre hacia arriba</option>
                <option value="down">Siempre hacia abajo</option>
                <option value="half_even">Bancario (par)</option>
                <option value="none">Sin redondeo</option>
              </select>
            </div>
            <div>
              <label className={label}>Paso de redondeo</label>
              <input
                className={input}
                type="number"
                step="0.01"
                defaultValue={settings.rounding_step}
                onBlur={(e) => saveSettings({ rounding_step: Number(e.target.value) || 0.01 })}
              />
            </div>
            <div>
              <label className={label}>Impuesto por defecto</label>
              <select
                className={input}
                value={settings.default_tax_rate_id || ''}
                onChange={(e) => saveSettings({ default_tax_rate_id: e.target.value || null })}
              >
                <option value="">Sin impuesto</option>
                {taxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Reserva de stock (min)</label>
              <input
                className={input}
                type="number"
                defaultValue={settings.reserve_minutes}
                onBlur={(e) => saveSettings({ reserve_minutes: Number(e.target.value) || 20 })}
              />
            </div>
            <div>
              <label className={label}>Aviso de stock bajo</label>
              <input
                className={input}
                type="number"
                defaultValue={settings.low_stock_threshold}
                onBlur={(e) => saveSettings({ low_stock_threshold: Number(e.target.value) || 5 })}
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 sm:col-span-3">
              <input
                type="checkbox"
                checked={settings.prices_include_tax}
                onChange={(e) => saveSettings({ prices_include_tax: e.target.checked })}
                className="accent-amber-500"
              />
              Los precios ya incluyen impuestos
            </label>
          </div>
        )}
      </div>

      {/* Monedas */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
        <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" /> Monedas
        </h3>

        <div className="space-y-1.5 mb-3">
          {currencies.map((c) => (
            <div key={c.code} className="flex items-center gap-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
              <strong className="text-amber-400 w-12">{c.code}</strong>
              <span className="text-zinc-300 flex-1">{c.name}</span>
              <span className="text-zinc-500">{c.symbol}</span>
              <span className="text-zinc-400">×{c.rate}</span>
              <button
                onClick={async () => {
                  await adminFetch(`/api/admin/config?resource=currency&id=${c.code}`, { method: 'DELETE' });
                  await load();
                }}
                className="text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-6 gap-2">
          <input className={input} placeholder="USD" value={newCurrency.code} onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })} />
          <input className={`${input} sm:col-span-2`} placeholder="Dólar" value={newCurrency.name} onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })} />
          <input className={input} placeholder="$" value={newCurrency.symbol} onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })} />
          <input className={input} type="number" step="0.0001" placeholder="Tasa" value={newCurrency.rate} onChange={(e) => setNewCurrency({ ...newCurrency, rate: e.target.value })} />
          <button
            onClick={addCurrency}
            disabled={busy || newCurrency.code.length !== 3}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>
      </div>

      {/* Impuestos */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
        <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
          <Percent className="w-4 h-4 text-amber-400" /> Impuestos
        </h3>

        <div className="space-y-1.5 mb-3">
          {taxes.map((t) => (
            <div key={t.id} className="flex items-center gap-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
              <strong className="text-zinc-100 flex-1">{t.name}</strong>
              <span className="text-amber-400 font-black">{t.rate}%</span>
              {t.is_default && <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">DEFECTO</span>}
              <button
                onClick={async () => {
                  await adminFetch(`/api/admin/config?resource=tax&id=${t.id}`, { method: 'DELETE' });
                  await load();
                }}
                className="text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-2">
          <input className={`${input} sm:col-span-2`} placeholder="Ej. IVA 15%" value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} />
          <div className="flex gap-2">
            <input className={input} type="number" step="0.01" placeholder="15" value={newTax.rate} onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })} />
            <button
              onClick={addTax}
              disabled={busy || !newTax.name || !newTax.rate}
              className="px-3 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Envíos */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
        <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-400" /> Métodos de envío
        </h3>

        <div className="space-y-2 mb-3">
          {methods.map((m) => {
            const editing = editMethod?.id === m.id;

            if (editing && editMethod) {
              return (
                <div key={m.id} className="bg-zinc-950 border border-amber-500/40 rounded-xl p-3 space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className={label}>Nombre</label>
                      <input className={input} value={editMethod.name} onChange={(e) => setEditMethod({ ...editMethod, name: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Tipo</label>
                      <select
                        className={input}
                        value={editMethod.type}
                        onChange={(e) => setEditMethod({ ...editMethod, type: e.target.value as 'flat' | 'free' | 'per_item' })}
                      >
                        <option value="flat">Tarifa fija</option>
                        <option value="free">Gratis</option>
                        <option value="per_item">Costo + por ítem</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Costo</label>
                      <input className={input} type="number" step="0.01" value={editMethod.cost} onChange={(e) => setEditMethod({ ...editMethod, cost: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Extra por ítem</label>
                      <input className={input} type="number" step="0.01" value={editMethod.per_item} onChange={(e) => setEditMethod({ ...editMethod, per_item: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Gratis desde</label>
                      <input className={input} type="number" step="0.01" placeholder="Sin límite" value={editMethod.free_over} onChange={(e) => setEditMethod({ ...editMethod, free_over: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Tiempo estimado</label>
                      <input className={input} placeholder="30-45 min" value={editMethod.eta} onChange={(e) => setEditMethod({ ...editMethod, eta: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <input type="checkbox" checked={editMethod.active} onChange={(e) => setEditMethod({ ...editMethod, active: e.target.checked })} className="accent-amber-500" />
                      Activo
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => setEditMethod(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700">
                        Cancelar
                      </button>
                      <button
                        onClick={saveMethod}
                        disabled={busy || !editMethod.name}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" /> Guardar
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                <strong className="text-zinc-100">{m.name}</strong>
                <span className="text-zinc-500">{m.type === 'free' ? 'Gratis' : m.type === 'per_item' ? 'Por ítem' : 'Tarifa fija'}</span>
                <span className="text-zinc-300">{money(Number(m.cost))}</span>
                {Number(m.per_item) > 0 && <span className="text-zinc-500">+ {money(Number(m.per_item))}/ítem</span>}
                {m.free_over ? <span className="text-emerald-400">gratis desde {money(Number(m.free_over))}</span> : null}
                {m.eta && <span className="text-zinc-500">{m.eta}</span>}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await adminFetch('/api/admin/config', {
                        method: 'PATCH',
                        body: JSON.stringify({ resource: 'method', id: m.id, active: !m.active }),
                      });
                      await load();
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      m.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {m.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() =>
                      setEditMethod({
                        id: m.id,
                        name: m.name,
                        type: m.type,
                        cost: String(m.cost ?? 0),
                        per_item: String(m.per_item ?? 0),
                        free_over: m.free_over === null || m.free_over === undefined ? '' : String(m.free_over),
                        eta: m.eta || '',
                        active: m.active,
                      })
                    }
                    className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Borrar el método "${m.name}"?`)) return;
                      await adminFetch(`/api/admin/config?resource=method&id=${m.id}`, { method: 'DELETE' });
                      await load();
                    }}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {methods.length === 0 && (
            <p className="text-xs text-zinc-500">No hay métodos de envío. Añade al menos uno.</p>
          )}
        </div>

        <div className="grid sm:grid-cols-6 gap-2">
          <input className={`${input} sm:col-span-2`} placeholder="Domicilio" value={newMethod.name} onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })} />
          <select
            className={input}
            value={newMethod.type}
            onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value as 'flat' | 'free' | 'per_item' })}
          >
            <option value="flat">Tarifa fija</option>
            <option value="free">Gratis</option>
            <option value="per_item">Costo + por ítem</option>
          </select>
          <input className={input} type="number" step="0.01" placeholder="Costo" value={newMethod.cost} onChange={(e) => setNewMethod({ ...newMethod, cost: e.target.value })} />
          <input className={input} type="number" step="0.01" placeholder="Gratis desde" value={newMethod.free_over} onChange={(e) => setNewMethod({ ...newMethod, free_over: e.target.value })} />
          <button
            onClick={addMethod}
            disabled={busy || !newMethod.name}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
        <Save className="w-3 h-3" /> Los cambios se guardan al salir de cada campo o al pulsar los botones.
      </p>
    </div>
  );
}
