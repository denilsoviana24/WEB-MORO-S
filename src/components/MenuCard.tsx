'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Eye, Flame, Check } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { useCart } from '@/context/CartContext';
import { flyToCartFromEvent } from '@/lib/flyToCart';

interface MenuCardProps {
  item: MenuItem;
  onOpenModal: (item: MenuItem) => void;
}

export default function MenuCard({ item, onOpenModal }: MenuCardProps) {
  const { addToCart, cart } = useCart();
  const [addedAnimation, setAddedAnimation] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState(item.image);

  // Check how many of this item is currently in cart
  const cartCount = cart
    .filter((cartItem) => cartItem.product.id === item.id)
    .reduce((sum, ci) => sum + ci.quantity, 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToCartFromEvent(e, imgSrc);
    addToCart(item);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  return (
    <div
      onClick={() => onOpenModal(item)}
      className="group relative bg-zinc-900/90 border border-zinc-800/90 hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_20px_40px_rgba(255,85,0,0.25)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Product Image */}
        <div className="relative aspect-[4/3] w-full bg-zinc-950 overflow-hidden">
          <Image
            src={imgSrc}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-108 transition-transform duration-500"
            onError={() => {
              if (imgSrc !== '/images/hero.jpg') setImgSrc('/images/hero.jpg');
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />

          {/* Badge if available */}
          {item.badge && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
              {item.badge}
            </span>
          )}

          {/* Cart Quantity Indicator */}
          {cartCount > 0 && (
            <span className="absolute top-3 right-3 bg-amber-400 text-zinc-950 text-xs font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-md">
              {cartCount}
            </span>
          )}

          {/* Quick View Hover Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950/40 backdrop-blur-xs">
            <span className="bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>Ver Detalle</span>
            </span>
          </div>
        </div>

        {/* Info Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-extrabold text-white text-base sm:text-lg group-hover:text-orange-400 transition-colors leading-snug">
              {item.name}
            </h3>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 min-h-[32px]">
            {item.description}
          </p>
        </div>
      </div>

      {/* Footer / Price & Action */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Precio</span>
          <span className="text-lg sm:text-xl font-black text-amber-400 tracking-tight">
            ${item.price.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleQuickAdd}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            addedAnimation
              ? 'bg-emerald-500 text-zinc-950 scale-105'
              : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 shadow-md active:scale-95'
          }`}
        >
          {addedAnimation ? (
            <>
              <Check className="w-4 h-4" />
              <span>¡Agregado!</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
