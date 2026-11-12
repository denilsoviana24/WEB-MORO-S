'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Sparkles, Clock, Check, AlertTriangle, Percent } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/catalog';

interface Component {
  variantId: string;
  qty: number;
  name: string;
  variant: string;
  image: string | null;
}

interface ComboCard {
  id: string;
  name: string;
  description: string;
  image: string;
  badge: string | null;
  discount_percent: number;
  price: number;
  regular: number;
  saving: number;
  percent: number;
  available: number | null;
  ends_at: string | null;
  components: Component[];
}

export default function CombosSection() {
  const { addCombo } = useCart();
  const [combos, setCombos] = useState<ComboCard[]>([]);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/combos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setCombos(Array.isArray(d.combos) ? d.combos : []))
      .catch(() => setCombos([]));
  }, []);

  if (!combos.length) return null;

  const handleAdd = (combo: ComboCard) => {
    if (combo.available !== null && combo.available <= 0) return;
    addCombo({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      image: combo.image,
      price: combo.price,
      regular: combo.regular,
      percent: combo.percent,
      badge: combo.badge,
      ends_at: combo.ends_at,
    });
    setAdded(combo.id);
    setTimeout(() => setAdded(null), 1200);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });

  return (
    <section id="combos" className="py-14 bg-zinc-950 border-y border-zinc-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_55%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">Combos Moro&apos;s</p>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Arma tu combo y <span className="text-orange-500">ahorra</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Productos juntos, precio especial. Disponibles por tiempo limitado.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full">
            <Percent className="w-3.5 h-3.5" /> Descuento incluido
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {combos.map((combo) => {
            const soldOut = combo.available !== null && combo.available <= 0;
            const isAdded = added === combo.id;

            return (
              <div
                key={combo.id}
                className="group rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[16/9] bg-zinc-900">
                  {combo.image ? (
                    <Image src={combo.image} alt={combo.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                      <Sparkles className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                  <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 text-[11px] font-black px-3 py-1 rounded-full">
                    {combo.badge || `-${combo.percent}%`}
                  </span>

                  {combo.available !== null && combo.available > 0 && combo.available <= 5 && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-black text-amber-300 bg-zinc-950/85 border border-amber-500/40 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Últimos {combo.available}
                    </span>
                  )}

                  {soldOut && (
                    <span className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 text-red-400 font-black text-sm uppercase tracking-widest">
                      Agotado
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-black text-white text-lg leading-tight">{combo.name}</h3>
                  {combo.description && (
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{combo.description}</p>
                  )}

                  <ul className="mt-3 space-y-1">
                    {combo.components.map((c) => (
                      <li key={c.variantId} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                        <span className="text-amber-400 font-black">{c.qty}x</span>
                        <span className="truncate">{c.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <span className="block text-[10px] text-zinc-500 line-through">
                        {formatMoney(combo.regular, null)}
                      </span>
                      <span className="text-2xl font-black text-amber-400">{formatMoney(combo.price, null)}</span>
                      <span className="block text-[10px] text-emerald-400 font-bold">
                        Ahorras {formatMoney(combo.saving, null)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAdd(combo)}
                      disabled={soldOut}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                        soldOut
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 active:scale-95'
                      }`}
                    >
                      {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {isAdded ? '¡Agregado!' : 'Agregar'}
                    </button>
                  </div>

                  {combo.ends_at && (
                    <p className="mt-3 flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="w-3 h-3" /> Promo válida hasta {formatDate(combo.ends_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
