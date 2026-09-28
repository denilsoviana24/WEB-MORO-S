'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingBag, Check, MessageSquare } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { useCart } from '@/context/CartContext';
import { flyToCartFromEvent } from '@/lib/flyToCart';

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ProductModal({ item, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ size: string; price: number } | undefined>(
    item?.options && item.options.length > 0 ? item.options[0] : undefined
  );
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  if (!item) return null;

  const currentPrice = selectedOption ? selectedOption.price : item.price;
  const totalPrice = currentPrice * quantity;

  const handleAddToCart = (e: React.MouseEvent) => {
    flyToCartFromEvent(e, item.image);
    addToCart(item, quantity, selectedOption, notes);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white p-2 rounded-full transition-colors"
          aria-label="Cerrar Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image */}
        <div className="relative aspect-[16/9] w-full bg-zinc-950">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />
          {item.badge && (
            <span className="absolute top-4 left-4 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              {item.badge}
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <h2 className="text-2xl font-black text-white">{item.name}</h2>
            <p className="text-zinc-300 text-sm leading-relaxed mt-2">
              {item.description}
            </p>
          </div>

          {/* Size / Variant Options if available */}
          {item.options && item.options.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Selecciona la Presentación / Tamaño:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.options.map((opt) => (
                  <button
                    key={opt.size}
                    onClick={() => setSelectedOption(opt)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedOption?.size === opt.size
                        ? 'bg-orange-500/20 border-orange-500 text-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span>{opt.size}</span>
                    <span className="text-white font-extrabold">${opt.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Notes */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
              <span>Instrucciones Especiales (Opcional):</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Sin cebolla, salsa de piña extra, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cantidad:</span>
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-white text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer / Add Button */}
        <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-400 font-semibold block">Total</span>
            <span className="text-2xl font-black text-amber-400">${totalPrice.toFixed(2)}</span>
          </div>

          <button
            onClick={(e) => handleAddToCart(e)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all ${
              added
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check className="w-5 h-5" />
                <span>¡Agregado al Pedido!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>Agregar al Pedido</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
