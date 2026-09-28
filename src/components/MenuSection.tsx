'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, MENU_ITEMS, MenuItem } from '@/data/menuData';
import MenuCard from './MenuCard';
import Reveal from './Reveal';
import ProductModal from './ProductModal';
import { Search, Utensils, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function MenuSection() {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'todos' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <section id="menu" className="py-16 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">02 — Nuestro menú oficial</p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-1 rounded-full text-xs font-black text-amber-400">
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>NUESTRO MENÚ OFICIAL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Sabor Exquisito en <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Cada Bocado</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Explora nuestra variedad de platos preparados con insumos frescos al instante. Selecciona tus favoritos y ordénalos por WhatsApp.
          </p>
        </Reveal>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar (ej. Broaster, Moro's, BBQ, Salchipapa)..."
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

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-400 font-semibold hidden sm:inline">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="default">Recomendados Moro's</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>

        {/* Category Scrollable Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 scrollbar-none snap-x">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'todos'
                ? MENU_ITEMS.length
                : MENU_ITEMS.filter((item) => item.category === cat.id).length;

            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(255,85,0,0.3)] scale-105'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isSelected ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.07 }}
              >
                <MenuCard
                  item={item}
                  onOpenModal={(selected) => setActiveModalItem(selected)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/50 rounded-3xl border border-zinc-800/80 p-8 space-y-4">
            <Sparkles className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No se encontraron productos</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              No encontramos coincidencias para &quot;{searchQuery}&quot;. Intenta buscar con otro término.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
              }}
              className="bg-orange-600 text-zinc-950 font-black px-4 py-2 rounded-xl text-xs"
            >
              Ver Todo el Menú
            </button>
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
