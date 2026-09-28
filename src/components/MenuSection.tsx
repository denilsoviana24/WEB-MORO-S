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
  // Plato destacado giratorio dentro de cada categoría
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
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

  const prevCat = () => {
    setActiveCatIndex((i) => (i - 1 + grouped.length) % grouped.length);
    setShowcaseIndex(0);
  };
  const nextCat = () => {
    setActiveCatIndex((i) => (i + 1) % grouped.length);
    setShowcaseIndex(0);
  };

  // Girar y cambiar al siguiente plato
  const spinToNextDish = () => {
    if (spinning) return;
    setSpinning(true);
    setTimeout(() => {
      setShowcaseIndex((i) => (i + 1) % (activeGroup?.items.length || 1));
      setTimeout(() => setSpinning(false), 350);
    }, 250);
  };

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
                  onClick={() => { setActiveCatIndex(i); setShowcaseIndex(0); }}
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

            {/* Cabecera estilo Foodluck por categoría: texto elegante + plato circular con órbita */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeGroup.cat.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-[#0c0a09] px-6 sm:px-10 py-8 mb-6"
              >
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Texto elegante izquierda */}
                  <div className="text-center md:text-left">
                    <p className="font-serif italic text-amber-400/90 text-sm">Moro&apos;s · {activeGroup.cat.icon} {activeGroup.items.length} platos</p>
                    <h3 className="mt-2 font-serif text-3xl sm:text-4xl text-white leading-tight">{activeGroup.cat.name}</h3>
                    <p className="mt-3 text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto md:mx-0">
                      {activeGroup.cat.description}
                    </p>
                    <div className="mt-5 flex items-center justify-center md:justify-start gap-3">
                      <button
                        onClick={prevCat}
                        aria-label="Categoría anterior"
                        className="p-2.5 rounded-full bg-zinc-900 border border-zinc-700 text-amber-400 hover:border-amber-400 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rowRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs px-6 py-3 rounded-full shadow-[0_0_25px_rgba(255,150,0,0.35)] transition-all"
                      >
                        Ver platos ↓
                      </button>
                      <button
                        onClick={nextCat}
                        aria-label="Siguiente categoría"
                        className="p-2.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 hover:scale-105 transition-transform"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Plato circular GIRATORIO: al señalarlo gira y cambia al siguiente */}
                  <div className="relative mx-auto w-56 h-56 sm:w-72 sm:h-72">
                    <div className="absolute inset-0 rounded-full border border-amber-400/30" />
                    <div className="absolute inset-4 rounded-full border border-dashed border-amber-400/20" />
                    <motion.button
                      onMouseEnter={spinToNextDish}
                      onClick={spinToNextDish}
                      animate={{ rotate: spinning ? 360 : 0, scale: spinning ? 0.92 : 1 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      title="Toca o pasa el mouse para ver otro plato"
                      className="absolute inset-8 rounded-full overflow-hidden border-2 border-amber-400/40 shadow-[0_0_50px_rgba(255,150,0,0.3)] bg-zinc-900 cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={activeGroup.items[showcaseIndex % activeGroup.items.length]?.id}
                        src={activeGroup.items[showcaseIndex % activeGroup.items.length]?.image || '/images/hero.jpg'}
                        alt={activeGroup.items[showcaseIndex % activeGroup.items.length]?.name || activeGroup.cat.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-zinc-950/0 hover:bg-zinc-950/30 transition-colors">
                        <span className="opacity-0 hover:opacity-100 text-[11px] font-black bg-zinc-950/90 text-amber-400 px-3 py-1.5 rounded-full border border-amber-400/50">
                          ↻ Girar para otro plato
                        </span>
                      </span>
                    </motion.button>
                    {/* Nombre del plato destacado */}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap max-w-[240px] truncate bg-zinc-950 border border-amber-400/50 text-amber-400 text-[11px] font-black px-3 py-1 rounded-full">
                      {activeGroup.items[showcaseIndex % activeGroup.items.length]?.name}
                    </span>
                    {/* Mini platos clicables para saltar directo */}
                    {activeGroup.items.slice(0, 3).map((mini, mi) => (
                      <button
                        key={mini.id}
                        onClick={() => {
                          setShowcaseIndex(mi % activeGroup.items.length);
                        }}
                        title={mini.name}
                        className={`absolute w-12 h-12 rounded-full overflow-hidden border-2 shadow-xl bg-zinc-900 transition-all hover:scale-110 ${
                          (showcaseIndex % activeGroup.items.length) === mi
                            ? 'border-amber-400'
                            : 'border-zinc-950'
                        }`}
                        style={{
                          top: ['6%', '42%', '74%'][mi],
                          left: ['74%', '88%', '70%'][mi],
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mini.image} alt={mini.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-950 border border-amber-400/50 text-amber-400 text-[11px] font-black px-3 py-1 rounded-full hidden">
                      {activeGroup.cat.icon} {activeGroup.items.length} platos
                    </span>
                  </div>
                </div>
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
                  onClick={() => { setActiveCatIndex(i); setShowcaseIndex(0); }}
                  aria-label={g.cat.name}
                  className={`h-2 rounded-full transition-all ${
                    i === activeCatIndex ? 'w-8 bg-gradient-to-r from-orange-600 to-amber-400' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => { setActiveCatIndex((i) => (i + 1) % grouped.length); setShowcaseIndex(0); }}
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
