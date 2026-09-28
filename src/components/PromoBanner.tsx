'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, PlusCircle, ChevronDown } from 'lucide-react';
import { PROMOTIONS, MENU_ITEMS } from '@/data/menuData';
import { useCart } from '@/context/CartContext';
import { flyToCartFromEvent, flyToCart } from '@/lib/flyToCart';
import Reveal from './Reveal';

// Relación manual promo -> productos del menú
const RELATED: Record<string, string[]> = {
  'promo-1': ['burger-moros', 'bebida-gaseosas', 'salchipapa-clasica'],
  'promo-2': ['papi-completa-broaster', 'broaster-1', 'bebida-gaseosas'],
  'promo-3': ['mixto-bbq', 'alitas-bbq', 'costillas-bbq'],
};

export default function PromoBanner() {
  const { addToCart } = useCart();
  const [openId, setOpenId] = useState<string | null>('promo-1');

  const handleAddPromo = (promoId: string, e?: React.MouseEvent, image?: string) => {
    const fallback: Record<string, string> = {
      'promo-1': 'burger-moros',
      'promo-2': 'papi-completa-broaster',
      'promo-3': 'mixto-bbq',
    };
    const item =
      MENU_ITEMS.find((i) => i.id === fallback[promoId]) || MENU_ITEMS[0];
    if (e) flyToCartFromEvent(e, image || item.image);
    else flyToCart(item.image, window.innerWidth / 2, window.innerHeight / 2);
    addToCart(item);
  };

  return (
    <section id="promos" className="py-12 bg-[#F5EBD9] border-y border-[#14532D]/15 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">01 — Ofertas de la semana</p>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider mt-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ofertas de la semana</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Promociones <span className="text-orange-500">Destacadas</span>
            </h2>
          </div>
          <p className="text-zinc-400 text-sm max-w-md mt-2 md:mt-0">
            Toca cada promoción para desplegar lo que incluye y sus productos relacionados.
          </p>
        </Reveal>

        {/* Acordeón por grupos */}
        <div className="space-y-4">
          {PROMOTIONS.map((promo) => {
            const isOpen = openId === promo.id;
            const related = (RELATED[promo.id] || [])
              .map((id) => MENU_ITEMS.find((m) => m.id === id))
              .filter(Boolean);

            return (
              <div
                key={promo.id}
                className={`rounded-3xl border overflow-hidden transition-colors ${
                  isOpen ? 'border-orange-500/50 bg-zinc-950' : 'border-zinc-800 bg-zinc-950/60'
                }`}
              >
                {/* Cabecera clicable: sin textos tapados */}
                <button
                  onClick={() => setOpenId(isOpen ? null : promo.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-7 py-5 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 font-black text-[11px] px-3 py-1 rounded-full">
                      {promo.badge}
                    </span>
                    <span className="font-extrabold text-white text-base sm:text-lg truncate">
                      {promo.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="bg-zinc-900 border border-amber-400/50 px-3 py-1 rounded-xl text-amber-400 font-black">
                      ${promo.price.toFixed(2)}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-orange-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-5 sm:px-7 pb-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Imagen + info */}
                        <div className="relative h-52 w-full rounded-2xl overflow-hidden bg-zinc-900">
                          <Image
                            src={promo.image}
                            alt={promo.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                          <p className="absolute bottom-3 left-3 right-3 text-zinc-300 text-xs leading-relaxed">
                            {promo.subtitle}
                          </p>
                        </div>
                        <div className="flex flex-col justify-between gap-4">
                          <div>
                            <p className="text-zinc-500 text-[11px] font-semibold flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-orange-500" />
                              <span>{promo.validity}</span>
                            </p>
                            <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-amber-400">
                              Incluye / Relacionados — clic para agregar:
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {related.map((item) => (
                                <button
                                  key={item!.id}
                                  onClick={(e) => {
                                    flyToCartFromEvent(e, item!.image);
                                    addToCart(item!);
                                  }}
                                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-orange-500 rounded-xl px-3 py-2 text-xs font-bold text-white transition-colors"
                                >
                                  <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
                                  <span>{item!.name} · ${item!.price.toFixed(2)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleAddPromo(promo.id, e, promo.image)}
                            className="w-full bg-orange-600/10 hover:bg-orange-600 border border-orange-500/40 text-orange-400 hover:text-zinc-950 font-black py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>{promo.buttonText} · ${promo.price.toFixed(2)}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
