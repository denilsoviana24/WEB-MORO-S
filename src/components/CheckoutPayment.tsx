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
  KUSHKI_PUBLIC_KEY,
  KUSHKI_ENV,
  KUSHKI_PAYMENT_LINK,
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

/* --- Kushki: tokenización de la tarjeta en el navegador --- */
interface KushkiTokenResponse {
  token?: string;
  code?: string;
  message?: string;
}

interface KushkiInstance {
  requestToken: (body: unknown, callback: (res: KushkiTokenResponse) => void) => void;
}

type KushkiWindow = Window & {
  Kushki?: new (options: { merchantId: string; inTestEnvironment: boolean }) => KushkiInstance;
};

const KUSHKI_SCRIPT = 'https://cdn.kushkipagos.com/kushki.min.js';

function loadKushkiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Sin navegador.'));
    if ((window as KushkiWindow).Kushki) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${KUSHKI_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Kushki.')));
      return;
    }

    const script = document.createElement('script');
    script.src = KUSHKI_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Kushki.'));
    document.head.appendChild(script);
  });
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCardNumber = (value: string) =>
  onlyDigits(value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

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

  /* --- Pasarelas realmente disponibles (las decide el servidor) --- */
  const [gateways, setGateways] = useState<{ mercadoPago: boolean; kushki: boolean } | null>(null);
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
  });

  useEffect(() => {
    let alive = true;
    fetch('/api/pagos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setGateways({ mercadoPago: Boolean(d?.mercadoPago), kushki: Boolean(d?.kushki) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const mercadoPagoReady = gateways
    ? gateways.mercadoPago || Boolean(MERCADOPAGO_LINK)
    : Boolean(MERCADOPAGO_LINK);
  const kushkiReady = gateways
    ? gateways.kushki || Boolean(KUSHKI_PAYMENT_LINK)
    : Boolean(KUSHKI_PUBLIC_KEY || KUSHKI_PAYMENT_LINK);
  /** true = formulario de tarjeta dentro de la web; false = link de cobro de Kushki. */
  const kushkiInline = Boolean(gateways?.kushki);

  const methods = useMemo(
    () =>
      PAYMENT_METHODS.filter((pm) => {
        if (pm.id === 'card') return mercadoPagoReady;
        if (pm.id === 'kushki') return kushkiReady;
        return true;
      }),
    [mercadoPagoReady, kushkiReady]
  );

  useEffect(() => {
    if (!methods.some((m) => m.id === method)) setMethod(methods[0]?.id || 'cash');
  }, [methods, method]);

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
          comboId: item.comboId || null,
          qty: item.quantity,
        }))
        .filter((i) => Boolean(i.variantId || i.comboId)),
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
  const buildMessage = (extra?: string) => {
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
    if (extra) message += extra;
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

  const openWhatsApp = (extra?: string) => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    window.open(
      `https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=${encodeURIComponent(buildMessage(extra))}`,
      '_blank'
    );
  };

  /* --- Tarjeta: Kushki.js tokeniza en el navegador --- */
  const tokenizeCard = async (): Promise<string> => {
    const number = onlyDigits(card.number);
    const month = onlyDigits(card.expiryMonth);
    const year = onlyDigits(card.expiryYear);
    const cvc = onlyDigits(card.cvc);

    if (number.length < 13) throw new Error('Revisa el número de la tarjeta.');
    if (!card.name.trim()) throw new Error('Escribe el nombre del titular.');
    if (!month || Number(month) < 1 || Number(month) > 12) throw new Error('Mes de caducidad inválido.');
    if (year.length < 2) throw new Error('Año de caducidad inválido.');
    if (cvc.length < 3) throw new Error('Revisa el código CVC.');

    await loadKushkiScript();
    const KushkiCtor = (window as KushkiWindow).Kushki;
    if (!KushkiCtor) throw new Error('No se pudo cargar Kushki. Revisa tu conexión.');

    const kushki = new KushkiCtor({
      merchantId: KUSHKI_PUBLIC_KEY,
      inTestEnvironment: KUSHKI_ENV !== 'production',
    });

    const response = await new Promise<KushkiTokenResponse>((resolve) => {
      kushki.requestToken(
        {
          amount: Math.round(totalToPay * 100) / 100,
          currency: 'USD',
          card: {
            name: card.name.trim(),
            number,
            cvc,
            expiryMonth: month.padStart(2, '0'),
            expiryYear: year.slice(-2),
          },
        },
        resolve
      );
    });

    if (!response?.token) {
      throw new Error(response?.message || 'No pudimos validar la tarjeta. Revisa los datos.');
    }
    return response.token;
  };

  /* --- Confirmar pedido --- */
  const completeOrder = async () => {
    setPayError('');

    // Mercado Pago abre otra pestaña: se abre ya para que el navegador no la bloquee.
    const payWindow = method === 'card' ? window.open('', '_blank') : null;
    const closePayWindow = () => {
      try {
        payWindow?.close();
      } catch {
        // sin problema
      }
    };

    setPlacing(true);

    const draftNumber = createOrderNumber();
    let finalNumber = draftNumber;
    let finalTotal = totalToPay;
    let orderId: string | null = null;
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
            comboId: item.comboId,
            id: item.comboId ? undefined : item.product.id,
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
          closePayWindow();
          setPayError(data?.error || 'No pudimos registrar tu pedido.');
          setPlacing(false);
          return;
        }
        setPayError('Guardando pedido en modo WhatsApp…');
      }

      finalNumber = data.order?.order_number || draftNumber;
      orderId = data.order?.id || null;
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

    /* --- Cobro en línea --- */
    let paidLine = '';

    if (method === 'kushki' && kushkiInline) {
      if (!orderId) {
        closePayWindow();
        setPayError('No pudimos registrar tu pedido para el cobro. Intenta de nuevo.');
        setPlacing(false);
        return;
      }

      try {
        const token = await tokenizeCard();
        const res = await fetch('/api/pagos/kushki', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, orderId }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result?.approved) {
          throw new Error(result?.message || 'La tarjeta fue rechazada. Prueba con otra tarjeta.');
        }
        paidLine = `*Pago:* ✅ APROBADO${result?.ticket ? ` · Ref. ${result.ticket}` : ''}\n`;
      } catch (err) {
        closePayWindow();
        setPayError(err instanceof Error ? err.message : 'No pudimos cobrar la tarjeta.');
        setPlacing(false);
        return;
      }
    } else if (method === 'kushki' && KUSHKI_PAYMENT_LINK) {
      window.open(KUSHKI_PAYMENT_LINK, '_blank');
      paidLine = '*Pago:* 💠 Completa el cobro en el enlace de Kushki que se abrió.\n';
    } else if (method === 'card') {
      const items = (
        serverItems ||
        cart.map((item) => ({
          name: item.product.name,
          detail: item.variant?.label || item.selectedOption?.size || item.notes,
          qty: item.quantity,
          price: item.variant?.price ?? item.selectedOption?.price ?? item.product.price,
        }))
      ).map((i) => ({ title: i.name, quantity: i.qty, unit_price: Number(i.price) }));

      let url = '';

      if (orderId) {
        try {
          const res = await fetch('/api/pagos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              total: finalTotal,
              customerName: name,
              customerPhone: phone,
              deliveryType,
              deliveryAddress: [address, reference].filter(Boolean).join(' · '),
              orderNotes: notes,
              orderId,
              orderNumber: finalNumber,
            }),
          });
          const data = await res.json().catch(() => ({}));
          url = data?.init_point || data?.sandbox_init_point || '';
        } catch {
          url = '';
        }
      }

      if (!url) url = MERCADOPAGO_LINK;

      if (url) {
        if (payWindow) payWindow.location.href = url;
        else window.open(url, '_blank');
        paidLine = '*Pago:* 💳 Mercado Pago · termina el pago en la pestaña abierta.\n';
      } else {
        closePayWindow();
        setPayError('Mercado Pago no está disponible ahora. Coordinamos el pago por WhatsApp.');
      }
    }

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

    if (method !== 'card') closePayWindow();

    openWhatsApp(paidLine || undefined);
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
            {methods.map((pm) => (
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

          {method === 'card' && (
            <p className="text-[11px] text-zinc-500">
              Tu pedido queda guardado y se abre Mercado Pago para pagar con tarjeta, débito o saldo. El pedido se
              confirma solo cuando el pago se aprueba.
            </p>
          )}

          {method === 'kushki' && kushkiInline && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" /> Datos de la tarjeta
              </p>
              <input
                className={input}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="Número de tarjeta"
                value={card.number}
                onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
              />
              <input
                className={input}
                autoComplete="cc-name"
                placeholder="Nombre del titular"
                value={card.name}
                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className={input}
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  placeholder="MM"
                  maxLength={2}
                  value={card.expiryMonth}
                  onChange={(e) => setCard((c) => ({ ...c, expiryMonth: onlyDigits(e.target.value).slice(0, 2) }))}
                />
                <input
                  className={input}
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  placeholder="AA"
                  maxLength={2}
                  value={card.expiryYear}
                  onChange={(e) => setCard((c) => ({ ...c, expiryYear: onlyDigits(e.target.value).slice(0, 2) }))}
                />
                <input
                  className={input}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="CVC"
                  maxLength={4}
                  value={card.cvc}
                  onChange={(e) => setCard((c) => ({ ...c, cvc: onlyDigits(e.target.value).slice(0, 4) }))}
                />
              </div>
              <p className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <ShieldCheck className="w-3 h-3" /> Cobro seguro con Kushki. No guardamos los datos de tu tarjeta.
              </p>
              {KUSHKI_ENV !== 'production' && (
                <p className="text-[10px] font-semibold text-amber-400">Modo de prueba de Kushki activo.</p>
              )}
            </div>
          )}

          {method === 'kushki' && !kushkiInline && KUSHKI_PAYMENT_LINK && (
            <a
              href={KUSHKI_PAYMENT_LINK}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-xs font-bold text-amber-400 underline"
            >
              Pagar ahora en Kushki
            </a>
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
            {placing
              ? method === 'kushki' && kushkiInline
                ? 'COBRANDO TARJETA…'
                : 'PROCESANDO PEDIDO…'
              : `CONFIRMAR PEDIDO · ${money(totalToPay)}`}
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
