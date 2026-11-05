'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingBag, Check, MessageSquare, ExternalLink, AlertTriangle } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import { flyToCartFromEvent } from '@/lib/flyToCart';
import { formatMoney, variantPrice, variantLabel, type Variant } from '@/lib/catalog';

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ProductModal({ item, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const { variantsFor, currency, settings } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ size: string; price: number } | undefined>(
    item?.options && item.options.length > 0 ? item.options[0] : undefined
  );
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  const variants = useMemo<Variant[]>(() => (item ? variantsFor(item.id) : []), [item, variantsFor]);
  const isVariable = variants.length > 1 || (variants.length === 1 && Object.keys(variants[0].attributes || {}).length > 0);

  const attributeNames = useMemo(() => {
    const names: string[] = [];
    variants.forEach((v) => {
      Object.keys(v.attributes || {}).forEach((n) => {
        if (!names.includes(n)) names.push(n);
      });
    });
    return names;
  }, [variants]);

  const valuesByAttribute = useMemo(() => {
    const map: Record<string, string[]> = {};
    attributeNames.forEach((name) => {
      map[name] = [];
      variants.forEach((v) => {
        const value = v.attributes?.[name];
        if (value && !map[name].includes(value)) map[name].push(value);
      });
    });
    return map;
  }, [attributeNames, variants]);

  if (!item) return null;

  const money = (n: number) =>
    formatMoney(n, currency ? { symbol: currency.symbol, symbol_position: currency.symbol_position, decimals: currency.decimals } : null);

  const selectedVariant =
    isVariable && Object.keys(selection).length === attributeNames.length
      ? variants.find(
          (v) => attributeNames.every((name) => (v.attributes || {})[name] === selection[name])
        ) || null
      : null;

  const stockOf = (v: Variant | null) => {
    if (!v || !v.manage_stock) return Infinity;
    return Math.max(0, (Number(v.stock) || 0) - (Number(v.reserved) || 0));
  };

  const free = stockOf(selectedVariant);
  const outOfStock = Boolean(selectedVariant) && free !== Infinity && free <= 0 && selectedVariant?.backorders === 'no';
  const needsSelection = isVariable && !selectedVariant;

  const unitPrice = selectedVariant ? variantPrice(selectedVariant) : selectedOption ? selectedOption.price : item.price;
  const totalPrice = unitPrice * quantity;

  const canAdd = !needsSelection && !outOfStock;

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!canAdd) return;
    const imageUrl = selectedVariant?.image || item.image;
    flyToCartFromEvent(e, imageUrl);

    if (selectedVariant && isVariable) {
      addToCart(
        item,
        quantity,
        undefined,
        notes,
        {
          id: selectedVariant.id,
          label: variantLabel(selectedVariant.attributes),
          price: variantPrice(selectedVariant),
          sku: selectedVariant.sku,
        }
      );
    } else {
      addToCart(item, quantity, selectedOption, notes);
    }

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 600);
  };

  const isExternal = (item as MenuItem & { type?: string }).type === 'external';
  const extUrl = (item as MenuItem & { externalUrl?: string | null }).externalUrl;
  const extText = (item as MenuItem & { buttonText?: string | null }).buttonText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white p-2 rounded-full transition-colors"
          aria-label="Cerrar Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative aspect-[16/9] w-full bg-zinc-950">
          <Image src={selectedVariant?.image || item.image} alt={item.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />
          {item.badge && (
            <span className="absolute top-4 left-4 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              {item.badge}
            </span>
          )}
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <h2 className="text-2xl font-black text-white">{item.name}</h2>
            <p className="text-zinc-300 text-sm leading-relaxed mt-2">{item.description}</p>
          </div>

          {/* Variantes reales (atributos) */}
          {isVariable && (
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              {attributeNames.map((name) => (
                <div key={name} className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">{name}</label>
                  <div className="flex flex-wrap gap-2">
                    {valuesByAttribute[name].map((value) => {
                      const active = selection[name] === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setSelection((prev) => ({ ...prev, [name]: value }))}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? 'bg-orange-500/20 border-orange-500 text-amber-400'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedVariant?.sku && (
                <p className="text-[11px] text-zinc-500">
                  SKU: <span className="font-mono text-zinc-300">{selectedVariant.sku}</span>
                </p>
              )}
            </div>
          )}

          {/* Presentaciones heredadas (productos simples con tamaños) */}
          {!isVariable && item.options && item.options.length > 0 && (
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
                    <span className="text-white font-extrabold">{money(opt.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsSelection && (
            <p className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              Elige {attributeNames.join(' y ')} para continuar.
            </p>
          )}

          {outOfStock && (
            <p className="flex items-center gap-2 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Esa combinación está agotada.
            </p>
          )}

          {selectedVariant && free !== Infinity && free > 0 && free <= (settings?.low_stock_threshold ?? 5) && (
            <p className="text-[11px] font-bold text-amber-400">
              {free === 1 ? '¡Última unidad disponible!' : `Quedan ${free} unidades de esta combinación.`}
            </p>
          )}

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

          {!isExternal && (
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
          )}
        </div>

        <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-400 font-semibold block">{isExternal ? 'Precio' : 'Total'}</span>
            <span className="text-2xl font-black text-amber-400">{money(totalPrice)}</span>
          </div>

          {isExternal ? (
            <a
              href={extUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-zinc-950 shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              <span>{extText || 'Comprar en tienda externa'}</span>
            </a>
          ) : (
            <button
              onClick={(e) => handleAddToCart(e)}
              disabled={!canAdd}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all ${
                added
                  ? 'bg-emerald-500 text-zinc-950'
                  : !canAdd
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
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
                  <span>{outOfStock ? 'Agotado' : 'Agregar al Pedido'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
