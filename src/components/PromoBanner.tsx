'use client';

import React from 'react';
import Image from 'next/image';
import { Flame, Sparkles, PlusCircle } from 'lucide-react';
import { PROMOTIONS, MENU_ITEMS } from '@/data/menuData';
import { useCart } from '@/context/CartContext';

export default function PromoBanner() {
  const { addToCart } = useCart();

  const handleAddPromo = (promoId: string) => {
    // Find matching menu item or add first matching item
    const matchingItem = MENU_ITEMS.find((item) =>
      item.id.toLowerCase().includes(promoId.replace('promo-', '')) ||
      item.name.toLowerCase().includes('moro') ||
      item.name.toLowerCase().includes('bbq')
    ) || MENU_ITEMS[0];

    addToCart(matchingItem);
  };

  return (
    <section id="promos" className="py-12 bg-zinc-900/60 border-y border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>OFERTAS DE LA SEMANA</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Promociones <span className="text-orange-500">Destacadas</span>
            </h2>
          </div>
          <p className="text-zinc-400 text-sm max-w-md mt-2 md:mt-0">
            Aprovecha nuestros combos especiales preparados con porciones abundantes y el toque secreto de Moro's.
          </p>
        </div>

        {/* Promo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROMOTIONS.map((promo) => (
            <div
              key={promo.id}
              className="group relative bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Image Container */}
                <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  
                  {/* Badge */}
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 font-black text-xs px-3 py-1 rounded-full shadow-lg">
                    {promo.badge}
                  </span>

                  {/* Price Tag */}
                  <div className="absolute bottom-3 right-3 bg-zinc-950/90 border border-amber-400/50 px-3 py-1 rounded-xl text-amber-400 font-black text-lg backdrop-blur-md">
                    ${promo.price.toFixed(2)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-extrabold text-white text-lg group-hover:text-orange-400 transition-colors">
                    {promo.title}
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed mt-2">
                    {promo.subtitle}
                  </p>
                  <p className="text-zinc-500 text-[11px] font-semibold mt-3 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>{promo.validity}</span>
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleAddPromo(promo.id)}
                  className="w-full bg-orange-600/10 hover:bg-orange-600 border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:text-zinc-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{promo.buttonText}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
