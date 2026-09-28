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
  const [openCategory, setOpenCategory] = useState<string | null>(null);
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

  const toggleCategory = (catId: string) => {
    setOpenCategory((prev) => (prev === catId ? null : catId));
  };

  return (
    <section id="menu" className="py-16 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">02 — Nuestro menú oficial</p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-1 rounded-full text-xs font-black text-amber-400">
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>CATEGORÍAS DESPLEGABLES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Sabor Exquisito en <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Cada Bocado</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Toca una categoría para desplegar sus platos con animación. Selecciona tus favoritos y ordénalos por WhatsApp.
          </p>
        </Reveal>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 backdrop-blur-md">
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
              {grouped.length} categorías disponibles
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
                No encontramos coincidencias para "{searchQuery}".
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
            {/* Horizontal Category Tabs - Accordion Triggers */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-6 scrollbar-none snap-x">
              {grouped.map((g, i) => (
                <button
                  key={g.cat.id}
                  onClick={() => toggleCategory(g.cat.id)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border relative ${
                    openCategory === g.cat.id
                      ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(255,85,0,0.3)] scale-105'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{g.cat.icon}</span>
                  <span>{g.cat.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      openCategory === g.cat.id ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {g.items.length}
                  </span>
                  {/* Chevron indicator */}
                  <motion.div
                    animate={{ rotate: openCategory === g.cat.id ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="w-4 h-4 text-amber-400"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>
              ))}
            </div>

            {/* Accordion Content Panels */}
            <div className="space-y-4">
              {grouped.map((g) => {
                const isOpen = openCategory === g.cat.id;
                return (
                  <motion.div
                    key={g.cat.id}
                    layout
                    className="overflow-hidden"
                  >
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden"
                        >
                          {/* Category Header Inside Panel */}
                          <div className="px-6 sm:px-8 py-5 border-b border-zinc-800 bg-zinc-950/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl sm:text-3xl">{g.cat.icon}</span>
                                <div>
                                  <h3 className="font-black text-white text-xl sm:text-2xl">{g.cat.name}</h3>
                                  <p className="text-zinc-400 text-xs mt-0.5">{g.cat.description}</p>
                                </div>
                              </div>
                              <span className="bg-zinc-900 border border-zinc-700 text-amber-400 text-xs font-black px-3 py-1 rounded-full">
                                {g.items.length} platos disponibles
                              </span>
                            </div>
                          </div>

                          {/* Products Grid */}
                          <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              <AnimatePresence>
                                {g.items.map((item, index) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                  >
                                    <MenuCard
                                      item={item}
                                      onOpenModal={(s) => setActiveModalItem(s)}
                                    />
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* No category selected message */}
            <AnimatePresence mode="wait">
              {!openCategory && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-16 bg-zinc-900/50 rounded-3xl border border-zinc-800/80 p-8 space-y-4"
                >
                  <Sparkles className="w-12 h-12 text-zinc-600 mx-auto" />
                  <h3 className="text-xl font-bold text-white">Elige una categoría</h3>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                    Toca cualquier categoría arriba para ver sus platos con animación.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Modal for item details */}
        <ProductModal
          item={activeModalItem}
          onClose={() => setActiveModalItem(null)}
        />
      </div>
    </section>
  );
}