'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, MENU_ITEMS, MenuItem } from '@/data/menuData';
import MenuCard from './MenuCard';
import ProductModal from './ProductModal';
import Reveal from './Reveal';
import { Search, Utensils, ChevronDown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function MenuSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);
  // Carrusel: una categoría a la vez
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return MENU_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const grouped = useMemo(() => {
    return CATEGORIES.filter((c) => c.id !== 'todos')
      .map((cat) => ({
        cat,
        items: MENU_ITEMS.filter((item) => item.category === cat.id),
      }))
      .filter((g) => g.items.length > 0);
  }, []);

  const activeGroup = grouped[activeCatIndex] || grouped[0];

  const prevCat = () =>
    setActiveCatIndex((i) => (i - 1 + grouped.length) % grouped.length);
  const nextCat = () => setActiveCatIndex((i) => (i + 1) % grouped.length);

  const scrollRow = (dir: 1 | -1) => {
    rowRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  // Reset scroll del carrusel al cambiar de categoría
  React.useEffect(() => {
    rowRef.current?.scrollTo({ left: 0 });
  }, [activeCatIndex]);

  return (
    <section id="menu" className="py-16 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">02 — Nuestro menú oficial</p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-1 rounded-full text-xs font-black text-amber-400">
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>CARRUSEL POR CATEGORÍAS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Sabor Exquisito en <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Cada Bocado</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Desliza entre categorías con las flechas y recorre sus platos en carrusel.
          </p>
        </Reveal>

        {/* Buscador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 backdrop-blur-md">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar (ej. Broaster, Moro's, BBQ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>
          {!searchQuery && (
            <p className="text-xs font-bold text-zinc-400">
              {activeCatIndex + 1} / {grouped.length} categorías
            </p>
          )}
        </div>

        {searchFiltered ? (
          searchFiltered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchFiltered.map((item) => (
                <MenuCard key={item.id} item={item} onOpenModal={(s) => setActiveModalItem(s)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-zinc-900/50 rounded-3xl border border-zinc-800/80 p-8 space-y-4">
              <Sparkles className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-xl font-bold text-white">No se encontraron productos</h3>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                No encontramos coincidencias para &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-orange-600 text-zinc-950 font-black px-4 py-2 rounded-xl text-xs"
              >
                Ver Todo el Menú
              </button>
            </div>
          )
        ) : (
          <>
            {/* Selector de categorías */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-4 scrollbar-none snap-x">
              {grouped.map((g, i) => (
                <button
                  key={g.cat.id}
                  onClick={() => setActiveCatIndex(i)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                    i === activeCatIndex
                      ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(255,85,0,0.3)] scale-105'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{g.cat.icon}</span>
                  <span>{g.cat.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      i === activeCatIndex ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {g.items.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Cabecera de categoría activa con flechas */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeGroup.cat.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl px-5 sm:px-7 py-5 mb-6"
              >
                <button
                  onClick={prevCat}
                  aria-label="Categoría anterior"
                  className="shrink-0 p-3 rounded-2xl bg-zinc-950 border border-zinc-700 text-amber-400 hover:border-amber-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center min-w-0">
                  <p className="text-3xl">{activeGroup.cat.icon}</p>
                  <h3 className="font-black text-white text-xl sm:text-2xl">{activeGroup.cat.name}</h3>
                  <p className="text-zinc-400 text-xs mt-1">{activeGroup.cat.description}</p>
                </div>
                <button
                  onClick={nextCat}
                  aria-label="Siguiente categoría"
                  className="shrink-0 p-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 hover:scale-105 transition-transform"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Carrusel de platos */}
            <div className="relative">
              <div className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={() => scrollRow(-1)}
                  aria-label="Platos anteriores"
                  className="p-2.5 rounded-full bg-zinc-900 border border-zinc-700 text-white hover:border-orange-500 shadow-xl"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={() => scrollRow(1)}
                  aria-label="Platos siguientes"
                  className="p-2.5 rounded-full bg-zinc-900 border border-zinc-700 text-white hover:border-orange-500 shadow-xl"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeGroup.cat.id + '-row'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  ref={rowRef}
                  className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none px-1"
                >
                  {activeGroup.items.map((item) => (
                    <div key={item.id} className="snap-start shrink-0 w-[85%] sm:w-[300px]">
                      <MenuCard item={item} onOpenModal={(s) => setActiveModalItem(s)} />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-2 text-center text-xs text-zinc-500 font-semibold">
              ← Desliza para ver todos los platos de {activeGroup.cat.name} →
            </p>

            {/* Puntos de categorías */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {grouped.map((g, i) => (
                <button
                  key={g.cat.id}
                  onClick={() => setActiveCatIndex(i)}
                  aria-label={g.cat.name}
                  className={`h-2 rounded-full transition-all ${
                    i === activeCatIndex ? 'w-8 bg-gradient-to-r from-orange-600 to-amber-400' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveCatIndex((i) => (i + 1) % grouped.length)}
              className="mt-6 mx-auto flex items-center gap-2 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors"
            >
              Ver siguiente categoría: {grouped[(activeCatIndex + 1) % grouped.length].cat.name}
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </>
        )}

        <ProductModal item={activeModalItem} onClose={() => setActiveModalItem(null)} />
      </div>
    </section>
  );
}
