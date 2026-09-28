'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, MENU_ITEMS, MenuItem } from '@/data/menuData';
import MenuCard from './MenuCard';
import ProductModal from './ProductModal';
import Reveal from './Reveal';
import { Search, Utensils, ChevronDown, Sparkles } from 'lucide-react';

export default function MenuSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);
  // Acordeón por categorías: primera abierta por defecto
  const [openCategories, setOpenCategories] = useState<string[]>(['broaster']);

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const expandAll = () => setOpenCategories(CATEGORIES.filter((c) => c.id !== 'todos').map((c) => c.id));
  const collapseAll = () => setOpenCategories([]);

  // Si hay búsqueda, mostrar plano filtrado. Si no, agrupado por categoría.
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
    return CATEGORIES.filter((c) => c.id !== 'todos').map((cat) => ({
      cat,
      items: MENU_ITEMS.filter((item) => item.category === cat.id),
    })).filter((g) => g.items.length > 0);
  }, []);

  return (
    <section id="menu" className="py-16 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">02 — Nuestro menú oficial</p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-1 rounded-full text-xs font-black text-amber-400">
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>DESPLIEGUE POR CATEGORÍAS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Sabor Exquisito en <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Cada Bocado</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Toca cada categoría para desplegar sus platos. Selecciona tus favoritos y ordénalos por WhatsApp.
          </p>
        </Reveal>

        {/* Search + Expand controls */}
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
            <div className="flex items-center gap-2 text-xs font-bold">
              <button onClick={expandAll} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 hover:border-amber-400 transition-colors">
                Abrir todas
              </button>
              <button onClick={collapseAll} className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                Cerrar todas
              </button>
            </div>
          )}
        </div>

        {/* Modo búsqueda: grid plano */}
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
          /* Modo acordeón por categorías */
          <div className="space-y-4">
            {grouped.map(({ cat, items }) => {
              const isOpen = openCategories.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  className={`rounded-3xl border overflow-hidden transition-colors ${
                    isOpen ? 'border-orange-500/50 bg-zinc-900/60' : 'border-zinc-800 bg-zinc-900/40'
                  }`}
                >
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-7 py-5 text-left hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{cat.icon}</span>
                      <div>
                        <h3 className="font-black text-white text-lg sm:text-xl">{cat.name}</h3>
                        <p className="text-zinc-400 text-xs mt-0.5">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-black bg-zinc-950 border border-zinc-700 text-amber-400 px-3 py-1 rounded-full">
                        {items.length} platos
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
                        <div className="px-5 sm:px-7 pb-7 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {items.map((item) => (
                            <MenuCard
                              key={item.id}
                              item={item}
                              onOpenModal={(selected) => setActiveModalItem(selected)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
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
