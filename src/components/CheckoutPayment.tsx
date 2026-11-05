'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  CreditCard,
  User,
  MapPin,
  Truck,
  Store,
  Wallet,
  AlertCircle,
  Tag,
} from 'lucide-react';
import type { CartItem } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { RESTAURANT_INFO } from '@/data/menuData';
import { createOrderNumber, type OrderData } from '@/components/OrderTicket';
import { formatMoney } from '@/lib/catalog';
import {
  PAYMENT_METHODS,
  BANK_ACCOUNT,
  MERCADOPAGO_LINK,
  DEUNA_LINK,
  DEUNA_QR,
  type PaymentMethodId,
} from '@/data/paymentData';

interface CheckoutPaymentProps {
  cart: CartItem[];
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  deliveryType: 'pickup' | 'delivery';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  orderNotes: string;
  onBack: () => void;
  onOrderComplete: (order: OrderData, result?: { stamps?: number | null; completed?: boolean }) => void;
}

const METHOD_LABEL: Record<PaymentMethodId, string> = {
  cash: 'Efectivo (paga al recibir / en local)',
  transfer: 'Transferencia bancaria',
  card: 'Tarjeta en línea (Mercado Pago)',
  kushki: 'Tarjeta en línea (Kushki)',
  deuna: 'DeUna (Banco Pichincha)',
};

interface QuoteLine {
  variantId: string;
  name: string;
  variant: string;
  qty: number;
  unitPrice: number;
  net: number;
  tax: number;
  taxRate: number;
  available: number | null;
}

interface ShippingOption {
  id: string;
  name: string;
  type: string;
  eta: string | null;
  cost: number;
}

interface Quote {
  currency: { code: string; symbol: string; position: string; decimals: number };
  lines: QuoteLine[];
  shippingOptions: ShippingOption[];
  shipping: ShippingOption | null;
  coupon: { code: string | null; discount: number; error: string | null };
  totals: {
    itemsQty: number;
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    pricesIncludeTax: boolean;
  };
  warnings: string[];
}

const STEPS = [
  { id: 1, label: 'Datos', icon: <User className="w-4 h-4" /> },
  { id: 2, label: 'Entrega', icon: <MapPin className="w-4 h-4" /> },
  { id: 3, label: 'Envío', icon: <Truck className="w-4 h-4" /> },
  { id: 4, label: 'Pago', icon: <Wallet className="w-4 h-4" /> },
];

export default function CheckoutPayment({
  cart,
  subtotal,
  discount = 0,
  couponCode = null,
  deliveryType: initialDelivery,
  customerName: initialName,
  customerPhone: initialPhone,
  deliveryAddress: initialAddress,
  orderNotes: initialNotes,
  onBack,
  onOrderComplete,
}: CheckoutPaymentProps) {
  const { variantsFor, currency } = useProducts();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>(initialDelivery);
  const [address, setAddress] = useState(initialAddress);
  const [reference, setReference] = useState('');
  const [region, setRegion] = useState('Tulcán');
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethodId>('cash');
  const [notes, setNotes] = useState(initialNotes);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [payError, setPayError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const money = (n: number) =>
    formatMoney(
      n,
      quote
        ? { symbol: quote.currency.symbol, symbol_position: quote.currency.position === 'after' ? 'after' : 'before', decimals: quote.currency.decimals }
        : currency
        ? { symbol: currency.symbol, symbol_position: currency.symbol_position, decimals: currency.decimals }
        : null
    );

  /* --- Items para el servidor (variante real de cada línea) --- */
  const quoteItems = useMemo(
    () =>
      cart
        .map((item) => ({
          variantId: item.variant?.id || variantsFor(item.product.id)[0]?.id || null,
          qty: item.quantity,
        }))
        .filter((i): i is { variantId: string; qty: number } => Boolean(i.variantId)),
    [cart, variantsFor]
  );

  /* --- Totales dinámicos (impuestos + envío) por AJAX --- */
  const loadQuote = useCallback(async () => {
    if (!quoteItems.length) return;
    setQuoting(true);
    try {
      const res = await fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: quoteItems,
          deliveryType,
          region,
          shippingMethodId,
          couponCode,
          currency: currency?.code,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setQuote(data);
        const ids = (data.shippingOptions || []).map((o: { id: string }) => o.id);
        if (data.shipping?.id && (!shippingMethodId || !ids.includes(shippingMethodId))) {
          setShippingMethodId(data.shipping.id);
        }
      }
    } catch {
      // se conserva el cálculo local
    } finally {
      setQuoting(false);
    }
  }, [quoteItems, deliveryType, region, shippingMethodId, couponCode, currency?.code]);

  useEffect(() => {
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteItems.length, deliveryType, region, shippingMethodId, couponCode]);

  // Al cambiar entre domicilio y retiro, se vuelve a elegir el método correcto.
  useEffect(() => {
    setShippingMethodId(null);
  }, [deliveryType]);

  const totals = quote?.totals;
  const localDiscount = Math.max(0, Number(discount) || 0);
  const displaySubtotal = totals?.subtotal ?? subtotal;
  const displayDiscount = totals?.discount ?? localDiscount;
  const displayTax = totals?.tax ?? 0;
  const displayShipping = totals?.shipping ?? 0;
  const totalToPay =
    totals?.total ?? Math.max(0, Math.round((subtotal - localDiscount) * 100) / 100);

  const stepError = (field: string) => errors[field];

  /* --- Validación asíncrona por paso --- */
  const validateStep = async (current: number): Promise<boolean> => {
    const data = {
      customerName: name,
      customerPhone: phone,
      email,
      deliveryType,
      deliveryAddress: address,
      addressReference: reference,
      region,
      shippingMethodId,
      paymentMethod: METHOD_LABEL[method],
    };

    const stepName = current === 1 ? 'personal' : current === 2 ? 'address' : current === 3 ? 'shipping' : 'payment';

    setValidating(true);
    setErrors({});
    try {
      const res = await fetch('/api/checkout/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepName, data }),
      });
      const json = await res.json();
      if (!json.ok) {
        setErrors(json.errors || {});
        return false;
      }
      return true;
    } catch {
      setErrors({ _: 'No pudimos validar. Revisa tu conexión.' });
      return false;
    } finally {
      setValidating(false);
    }
  };

  const next = async () => {
    const ok = await validateStep(step);
    if (ok) setStep((s) => Math.min(4, s + 1));
  };

  const back = () => {
    setErrors({});
    if (step === 1) onBack();
    else setStep((s) => s - 1);
  };

  /* --- Mensaje de WhatsApp --- */
  const buildMessage = () => {
    let message = `*🍔 NUEVO PEDIDO - MORO'S COMIDAS RÁPIDAS*\n`;
    message += `-----------------------------------------\n`;
    message += `*Cliente:* ${name}\n`;
    if (phone) message += `*Teléfono:* ${phone}\n`;
    if (email) message += `*Correo:* ${email}\n`;
    message += `*Tipo de Pedido:* ${deliveryType === 'delivery' ? '🛵 ENTREGA A DOMICILIO' : '📍 RETIRO EN LOCAL'}\n`;
    if (deliveryType === 'delivery') {
      message += `*Dirección:* ${address}${reference ? ` (${reference})` : ''}\n`;
      message += `*Ciudad/Sector:* ${region}\n`;
    }
    message += `*Método de pago:* ${METHOD_LABEL[method]}\n`;
    message += `\n*DETALLE DEL PEDIDO:*\n`;

    cart.forEach((item, index) => {
      const label = item.variant?.label || (item.selectedOption ? item.selectedOption.size : '');
      const price = item.variant?.price ?? item.selectedOption?.price ?? item.product.price;
      message += `${index + 1}. *${item.quantity}x ${item.product.name}*${label ? ` (${label})` : ''} - ${money(price * item.quantity)}\n`;
      if (item.notes) message += `   _Nota: ${item.notes}_\n`;
    });

    if (notes) message += `\n*Notas Generales:* ${notes}\n`;
    message += `-----------------------------------------\n`;
    if (displayDiscount > 0) {
      message += `*Subtotal:* ${money(displaySubtotal)}\n`;
      message += `*Cupón ${couponCode || ''}:* -${money(displayDiscount)}\n`;
    }
    if (displayTax > 0) message += `*IVA:* ${money(displayTax)}\n`;
    if (displayShipping > 0) message += `*Envío:* ${money(displayShipping)}\n`;
    message += `*TOTAL A PAGAR:* ${money(totalToPay)}\n`;
    message += `-----------------------------------------\n`;
    message += `¡Gracias por tu pedido! 🍟`;
    return message;
  };

  const openWhatsApp = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    window.open(
      `https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=${encodeURIComponent(buildMessage())}`,
      '_blank'
    );
  };

  /* --- Confirmar pedido --- */
  const completeOrder = async () => {
    setPayError('');
    setPlacing(true);

    const draftNumber = createOrderNumber();
    let finalNumber = draftNumber;
    let finalTotal = totalToPay;
    let serverItems: OrderData['items'] | null = null;
    let stamps: number | null = null;
    let completed = false;
    let serverTotals: { subtotal?: number; discount?: number; tax?: number; shipping?: number } = {};

    try {
      const session = supabaseClient ? (await supabaseClient.auth.getSession()).data.session : null;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          number: draftNumber,
          items: cart.map((item) => ({
            variantId: item.variant?.id,
            id: item.product.id,
            detail: item.variant?.label || item.selectedOption?.size || item.notes,
            qty: item.quantity,
          })),
          customerName: name,
          customerPhone: phone,
          deliveryType,
          deliveryAddress: address,
          addressReference: reference,
          region,
          paymentMethod: METHOD_LABEL[method],
          notes,
          couponCode,
          currency: quote?.currency.code || currency?.code,
          shippingMethodId,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        const businessError = res.status === 400 || res.status === 409;
        if (businessError) {
          setPayError(data?.error || 'No pudimos registrar tu pedido.');
          setPlacing(false);
          return;
        }
        setPayError('Guardando pedido en modo WhatsApp…');
      }

      finalNumber = data.order?.order_number || draftNumber;
      finalTotal = Number(data.total) || totalToPay;
      stamps = typeof data.stamps === 'number' ? data.stamps : null;
      completed = Boolean(data.completed);

      // Totales autoritativos del servidor para la factura
      serverTotals = {
        subtotal: Number.isFinite(Number(data.subtotal)) ? Number(data.subtotal) : undefined,
        discount: Number.isFinite(Number(data.discount)) ? Number(data.discount) : undefined,
        tax: Number.isFinite(Number(data.tax)) ? Number(data.tax) : undefined,
        shipping: Number.isFinite(Number(data.shipping)) ? Number(data.shipping) : undefined,
      };

      if (Array.isArray(data.order?.items)) {
        serverItems = data.order.items.map((i: { name: string; detail?: string; qty: number; price: number }) => ({
          name: i.name,
          detail: i.detail,
          qty: i.qty,
          price: Number(i.price),
        }));
      }
    } catch {
      setPayError('Sin conexión con la tienda. Tu pedido se enviará por WhatsApp.');
    }

    // Pasarela externa (si está configurada)
    if (method === 'card' && MERCADOPAGO_LINK) window.open(MERCADOPAGO_LINK, '_blank');
    if (method === 'deuna' && DEUNA_LINK) window.open(DEUNA_LINK, '_blank');

    const order: OrderData = {
      number: finalNumber,
      timestamp: Date.now(),
      customerName: name,
      customerPhone: phone,
      deliveryType,
      deliveryAddress: [address, reference].filter(Boolean).join(' · '),
      paymentMethod: METHOD_LABEL[method],
      items:
        serverItems ||
        cart.map((item) => ({
          name: item.product.name,
          detail: item.variant?.label || item.selectedOption?.size || item.notes,
          qty: item.quantity,
          price: item.variant?.price ?? item.selectedOption?.price ?? item.product.price,
        })),
      notes,
      subtotal: serverTotals.subtotal ?? displaySubtotal,
      discount: serverTotals.discount ?? displayDiscount,
      couponCode,
      tax: serverTotals.tax ?? displayTax,
      shipping: serverTotals.shipping ?? displayShipping,
      currency: quote?.currency.code || currency?.code,
      total: finalTotal,
    };

    openWhatsApp();
    onOrderComplete(order, { stamps, completed });

    try {
      fetch('/api/pedido-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: order.number,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryType: order.deliveryType,
          deliveryAddress: order.deliveryAddress,
          paymentMethod: order.paymentMethod,
          items: order.items,
          notes: order.notes,
          total: order.total,
          subtotal: order.subtotal,
          couponCode,
          discount: order.discount,
          tax: order.tax,
          shipping: order.shipping,
          shippingMethod: quote?.shipping?.name || (deliveryType === 'pickup' ? 'Retiro en local' : null),
        }),
      }).catch(() => {});
    } catch {
      // el pedido ya salió por WhatsApp
    }

    setPlacing(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const input =
    'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors';
  const label = 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5';
  const errorText = 'text-[11px] font-semibold text-red-400 mt-1';

  return (
    <div className="space-y-5">
      {/* Progreso del embudo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Paso {step} de 4
          </span>
          <button onClick={back} className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> {step === 1 ? 'Volver al carrito' : 'Atrás'}
          </button>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
                step === s.id
                  ? 'bg-amber-500 text-zinc-950'
                  : step > s.id
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-zinc-900 text-zinc-500'
              }`}
            >
              {step > s.id ? <Check className="w-4 h-4" /> : s.icon}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PASO 1 · Datos personales */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className={label}>Nombre completo *</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María Pérez" />
            {stepError('customerName') && <p className={errorText}>{stepError('customerName')}</p>}
          </div>
          <div>
            <label className={label}>Teléfono / WhatsApp *</label>
            <input
              className={input}
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0961290493"
            />
            {stepError('customerPhone') && <p className={errorText}>{stepError('customerPhone')}</p>}
          </div>
          <div>
            <label className={label}>Correo (opcional)</label>
            <input
              className={input}
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
            {stepError('email') && <p className={errorText}>{stepError('email')}</p>}
          </div>
        </div>
      )}

      {/* PASO 2 · Entrega */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-colors ${
                deliveryType === 'delivery'
                  ? 'bg-orange-500/15 border-orange-500 text-amber-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <Truck className="w-5 h-5" /> A domicilio
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-colors ${
                deliveryType === 'pickup'
                  ? 'bg-orange-500/15 border-orange-500 text-amber-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <Store className="w-5 h-5" /> Retiro en local
            </button>
          </div>

          {deliveryType === 'delivery' && (
            <>
              <div>
                <label className={label}>Dirección *</label>
                <input
                  className={input}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, sector"
                />
                {stepError('deliveryAddress') && <p className={errorText}>{stepError('deliveryAddress')}</p>}
              </div>
              <div>
                <label className={label}>Referencia</label>
                <input
                  className={input}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej. frente al parque, casa de dos pisos"
                />
              </div>
              <div>
                <label className={label}>Ciudad / sector *</label>
                <input className={input} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Tulcán" />
                {stepError('region') && <p className={errorText}>{stepError('region')}</p>}
              </div>
            </>
          )}

          {deliveryType === 'pickup' && (
            <p className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
              Recoges tu pedido en <strong className="text-zinc-200">{RESTAURANT_INFO.address}</strong>
            </p>
          )}

          <div>
            <label className={label}>Notas del pedido</label>
            <input className={input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
      )}

      {/* PASO 3 · Envío */}
      {step === 3 && (
        <div className="space-y-2">
          {quoting && <p className="text-[11px] text-zinc-500">Calculando opciones…</p>}

          {deliveryType === 'pickup' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-3 text-xs text-emerald-400 font-bold">
              Retiro en local · sin costo
            </div>
          ) : (quote?.shippingOptions?.length ?? 0) === 0 ? (
            <p className="text-xs text-zinc-400">No hay métodos de envío disponibles. Elige retiro en local.</p>
          ) : (
            quote?.shippingOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setShippingMethodId(opt.id)}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-colors ${
                  shippingMethodId === opt.id
                    ? 'bg-orange-500/15 border-orange-500'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-white">{opt.name}</p>
                  {opt.eta && <p className="text-[11px] text-zinc-400">{opt.eta}</p>}
                </div>
                <span className="font-black text-amber-400">{opt.cost === 0 ? 'Gratis' : money(opt.cost)}</span>
              </button>
            ))
          )}

          {stepError('shippingMethodId') && <p className={errorText}>{stepError('shippingMethodId')}</p>}
        </div>
      )}

      {/* PASO 4 · Pago + resumen */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-1.5 text-xs">
            {quoting && <p className="text-[11px] text-zinc-500">Actualizando totales…</p>}
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-bold text-white">{money(displaySubtotal)}</span>
            </div>
            {displayDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {couponCode}
                </span>
                <span>-{money(displayDiscount)}</span>
              </div>
            )}
            {displayTax > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>IVA</span>
                <span>{money(displayTax)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Envío</span>
              <span>{displayShipping === 0 ? 'Gratis' : money(displayShipping)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-800 text-base font-black text-white">
              <span>Total</span>
              <span className="text-amber-400">{money(totalToPay)}</span>
            </div>
          </div>

          {quote?.warnings?.map((w, i) => (
            <p key={i} className="flex items-start gap-2 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {w}
            </p>
          ))}

          <div className="space-y-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setMethod(pm.id)}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-colors ${
                  method === pm.id
                    ? 'bg-orange-500/15 border-orange-500'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-bold text-white">{METHOD_LABEL[pm.id]}</span>
                {method === pm.id ? <Check className="w-4 h-4 text-amber-400" /> : <CreditCard className="w-4 h-4 text-zinc-500" />}
              </button>
            ))}
          </div>

          {method === 'transfer' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1.5 text-xs">
              <p className="text-zinc-400">Transfiere a:</p>
              <p className="font-bold text-white">{BANK_ACCOUNT.bank}</p>
              <p className="text-zinc-300">Cuenta: {BANK_ACCOUNT.accountNumber}</p>
              <p className="text-zinc-300">Titular: {BANK_ACCOUNT.holder}</p>
              <button
                onClick={() => copy(BANK_ACCOUNT.accountNumber, 'account')}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400"
              >
                {copied === 'account' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copiar número de cuenta
              </button>
            </div>
          )}

          {method === 'deuna' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs space-y-2">
              <p className="text-zinc-300">Paga con DeUna al {RESTAURANT_INFO.phone}</p>
              {DEUNA_LINK && (
                <a href={DEUNA_LINK} target="_blank" rel="noreferrer" className="text-amber-400 font-bold underline">
                  Abrir enlace de pago DeUna
                </a>
              )}
              {DEUNA_QR && <img src={DEUNA_QR} alt="QR DeUna" className="w-40 rounded-lg" />}
            </div>
          )}

          {(method === 'card' || method === 'kushki') && (
            <p className="text-[11px] text-zinc-500">
              Al confirmar se abrirá la pasarela segura para completar el pago con tarjeta.
            </p>
          )}

          {payError && (
            <p className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              {payError}
            </p>
          )}

          <button
            onClick={completeOrder}
            disabled={placing}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-zinc-950 shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-transform"
          >
            {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {placing ? 'ENVIANDO PEDIDO…' : `CONFIRMAR PEDIDO · ${money(totalToPay)}`}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
            <ShieldCheck className="w-3 h-3" /> Compra protegida · Te confirmamos por WhatsApp
          </p>
        </div>
      )}

      {errors._ && <p className={errorText}>{errors._}</p>}

      {/* Botón continuar (pasos 1-3) */}
      {step < 4 && (
        <button
          onClick={next}
          disabled={validating}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-zinc-950 shadow-lg disabled:opacity-60"
        >
          {validating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          {validating ? 'VALIDANDO…' : 'CONTINUAR'}
        </button>
      )}
    </div>
  );
}
