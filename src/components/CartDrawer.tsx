'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, MapPin, Store, User, Phone, FileText, Tag, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { RESTAURANT_INFO } from '@/data/menuData';
import CheckoutPayment from '@/components/CheckoutPayment';
import OrderTicket, { type OrderData } from '@/components/OrderTicket';
import { addLoyaltyStamp } from '@/lib/loyalty';
import { STAMPS_GOAL } from '@/data/loyaltyData';
import { friesRain } from '@/lib/friesRain';
import { useAuth } from '@/context/AuthContext';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [step, setStep] = useState<'cart' | 'pay'>('cart');
  const [ticket, setTicket] = useState<OrderData | null>(null);
  // Cupones
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponMsg('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setDiscount(0);
        setCouponCode(null);
        setCouponMsg(data?.error || 'Cupón no válido.');
        return;
      }
      setDiscount(Number(data.discount) || 0);
      setCouponCode(data.code);
      setCouponMsg(`¡Cupón aplicado! ${data.label}`);
    } catch {
      setCouponMsg('No se pudo validar el cupón. Intenta de nuevo.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setDiscount(0);
    setCouponInput('');
    setCouponMsg('');
  };

  // Al abrir el carrito, siempre empezar en el paso del pedido
  useEffect(() => {
    if (isCartOpen) setStep('cart');
  }, [isCartOpen]);

  // Pedido completado: la tienda ya lo guardó en Supabase + sello; aquí solo refrescamos
  const { user, refreshProfile } = useAuth();
  const handleOrderComplete = async (
    order: OrderData,
    result?: { stamps?: number | null; completed?: boolean }
  ) => {
    if (user) {
      await refreshProfile();
      if (result?.completed) friesRain();
    } else {
      const { completed } = addLoyaltyStamp(STAMPS_GOAL);
      if (completed) friesRain();
    }
    setTicket(order);
    clearCart();
    removeCoupon();
    setIsCartOpen(false);
  };

  if (ticket) {
    return <OrderTicket order={ticket} onClose={() => setTicket(null)} />;
  }

  if (!isCartOpen) return null;

  const handleContinueToPay = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) return;

    if (!customerName) {
      alert('Por favor, ingresa tu nombre para personalizar tu pedido.');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress) {
      alert('Por favor, ingresa tu dirección en Tulcán para la entrega.');
      return;
    }

    // Ir al paso de pago (aquí eliges: efectivo, transferencia o tarjeta)
    setStep('pay');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 text-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-5 border-b border-zinc-900 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">Tu Pedido</h2>
                <p className="text-xs text-zinc-400">
                  {totalItems === 0 ? 'Tu carrito está vacío' : `${totalItems} producto(s) seleccionados`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Cart Items & Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {step === 'pay' ? (
              <CheckoutPayment
                cart={cart}
                subtotal={subtotal}
                discount={discount}
                couponCode={couponCode}
                deliveryType={deliveryType}
                customerName={customerName}
                customerPhone={customerPhone}
                deliveryAddress={deliveryAddress}
                orderNotes={orderNotes}
                onBack={() => setStep('cart')}
                onOrderComplete={handleOrderComplete}
              />
            ) : cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto" />
                <h3 className="text-base font-bold text-zinc-300">Aún no has agregado productos</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Navega por nuestro menú y agrega tus platos y combos favoritos.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-orange-600 text-zinc-950 font-black px-5 py-2.5 rounded-xl text-xs"
                >
                  Explorar Menú
                </button>
              </div>
            ) : (
              <>
                {/* List of Cart Items */}
                <div className="space-y-3">
                  {cart.map((item) => {
                    const price = item.selectedOption ? item.selectedOption.price : item.product.price;
                    const itemTotal = price * item.quantity;
                    const optionSize = item.selectedOption?.size;

                    return (
                      <div
                        key={`${item.product.id}-${optionSize || ''}`}
                        className="flex gap-3 bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-2xl relative group"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.product.id, optionSize)}
                              className="text-zinc-500 hover:text-red-400 p-1"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {optionSize && (
                            <span className="text-[10px] text-amber-400 font-semibold block">
                              Tamaño: {optionSize}
                            </span>
                          )}

                          {item.notes && (
                            <span className="text-[10px] text-zinc-400 italic block truncate">
                              &quot;{item.notes}&quot;
                            </span>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-black text-amber-400">
                              ${itemTotal.toFixed(2)}
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1, optionSize)}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1, optionSize)}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cupón de descuento */}
                <div className="pt-4 border-t border-zinc-900 space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Cupón de descuento:
                  </label>
                  {couponCode ? (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        {couponCode} · -${discount.toFixed(2)}
                      </span>
                      <button onClick={removeCoupon} className="text-[11px] text-zinc-400 hover:text-red-400 font-bold">
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Ej. MOROS10"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 uppercase tracking-wider"
                        />
                      </div>
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-black px-4 rounded-xl text-xs transition-colors"
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                  )}
                  {couponMsg && (
                    <p className={`text-[11px] font-semibold ${couponCode ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {couponMsg}
                    </p>
                  )}
                </div>

                {/* Delivery Type Selector */}
                <div className="space-y-3 pt-4 border-t border-zinc-900">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Modalidad del Pedido:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        deliveryType === 'delivery'
                          ? 'bg-orange-600/20 border-orange-500 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Domicilio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                        deliveryType === 'pickup'
                          ? 'bg-orange-600/20 border-orange-500 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Retiro en Local</span>
                    </button>
                  </div>
                </div>

                {/* Customer Details Form */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Datos del Cliente:
                  </label>

                  {/* Name */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Tu Nombre (Ej. Mateo)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      placeholder="Teléfono Celular (Ej. 0961290493)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Delivery Address (if Delivery) */}
                  {deliveryType === 'delivery' && (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="Dirección / Barrio en Tulcán (Ej. Av. Veintimilla)"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Notas adicionales (Ej. Traer cambio de $20)"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer */}
          {cart.length > 0 && step === 'cart' && (
            <div className="p-5 border-t border-zinc-900 bg-zinc-900/60 space-y-4">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Cupón {couponCode}:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Costo de envío:</span>
                  <span className="text-emerald-400 font-bold">
                    {deliveryType === 'delivery' ? 'A convenir con repartidor' : 'Gratis'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                  <span>Total estimado:</span>
                  <span className="text-amber-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleContinueToPay}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,85,0,0.35)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
              >
                <span>CONTINUAR AL PAGO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
