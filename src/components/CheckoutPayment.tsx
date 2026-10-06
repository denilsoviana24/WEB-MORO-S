'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Send,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import type { CartItem } from '@/context/CartContext';
import { RESTAURANT_INFO } from '@/data/menuData';
import { createOrderNumber, type OrderData } from '@/components/OrderTicket';
import {
  PAYMENT_METHODS,
  BANK_ACCOUNT,
  MERCADOPAGO_LINK,
  KUSHKI_PAYMENT_LINK,
  KUSHKI_PUBLIC_KEY,
  KUSHKI_ENV,
  DEUNA_LINK,
  DEUNA_QR,
  type PaymentMethodId,
} from '@/data/paymentData';

interface CheckoutPaymentProps {
  cart: CartItem[];
  subtotal: number;
  deliveryType: 'pickup' | 'delivery';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  orderNotes: string;
  onBack: () => void;
  onOrderComplete: (order: OrderData) => void;
}

const METHOD_LABEL: Record<PaymentMethodId, string> = {
  cash: 'Efectivo (paga al recibir / en local)',
  transfer: 'Transferencia bancaria',
  card: 'Tarjeta en línea (Mercado Pago)',
  kushki: 'Tarjeta en línea (Kushki)',
  deuna: 'DeUna (Banco Pichincha)',
};

interface KushkiInstance {
  requestToken: (
    params: Record<string, unknown>,
    cb: (res: { token?: string; message?: string }) => void
  ) => void;
}

function loadKushkiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { Kushki?: unknown }).Kushki) return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdn.kushkipagos.com/kushki.min.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('cdn'));
    document.head.appendChild(s);
  });
}

function getKushki(publicId: string): KushkiInstance | null {
  const K = (
    window as unknown as {
      Kushki?: new (cfg: { merchantId: string; inTestEnvironment: boolean }) => KushkiInstance;
    }
  ).Kushki;
  if (!K) return null;
  try {
    return new K({ merchantId: publicId, inTestEnvironment: KUSHKI_ENV !== 'production' });
  } catch {
    return null;
  }
}

export default function CheckoutPayment({
  cart,
  subtotal,
  deliveryType,
  customerName,
  customerPhone,
  deliveryAddress,
  orderNotes,
  onBack,
  onOrderComplete,
}: CheckoutPaymentProps) {
  const [method, setMethod] = useState<PaymentMethodId>('cash');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  // Formulario de tarjeta (Kushki)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpMM, setCardExpMM] = useState('');
  const [cardExpYY, setCardExpYY] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [qrOk, setQrOk] = useState(true);

  const buildMessage = (extra?: string) => {
    let message = `*🍔 NUEVO PEDIDO - MORO'S COMIDAS RÁPIDAS*\n`;
    message += `-----------------------------------------\n`;
    message += `*Cliente:* ${customerName}\n`;
    if (customerPhone) message += `*Teléfono:* ${customerPhone}\n`;
    message += `*Tipo de Pedido:* ${deliveryType === 'delivery' ? '🛵 ENTREGA A DOMICILIO' : '📍 RETIRO EN LOCAL'}\n`;
    if (deliveryType === 'delivery') message += `*Dirección:* ${deliveryAddress}\n`;
    message += `*Método de pago:* ${METHOD_LABEL[method]}\n`;
    message += `\n*DETALLE DEL PEDIDO:*\n`;
    cart.forEach((item, index) => {
      const optionText = item.selectedOption ? ` (${item.selectedOption.size})` : '';
      const price = item.selectedOption ? item.selectedOption.price : item.product.price;
      message += `${index + 1}. *${item.quantity}x ${item.product.name}*${optionText} - $${(price * item.quantity).toFixed(2)}\n`;
      if (item.notes) message += `   _Nota: ${item.notes}_\n`;
    });
    if (orderNotes) message += `\n*Notas Generales:* ${orderNotes}\n`;
    message += `-----------------------------------------\n`;
    message += `*TOTAL A PAGAR:* $${subtotal.toFixed(2)}\n`;
    message += `-----------------------------------------\n`;
    if (extra) message += `${extra}\n`;
    message += `¡Gracias por preferir Moro's! Quedo a la espera de su confirmación.`;
    return message;
  };

  const openWhatsApp = (message: string) => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    window.open(
      `https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  // Arma el pedido, lo envía por WhatsApp y genera el comprobante
  const completeOrder = (extra?: string) => {
    const order: OrderData = {
      number: createOrderNumber(),
      timestamp: Date.now(),
      customerName,
      customerPhone,
      deliveryType,
      deliveryAddress,
      paymentMethod: METHOD_LABEL[method],
      items: cart.map((item) => ({
        name: item.product.name,
        detail: item.selectedOption?.size || item.notes,
        qty: item.quantity,
        price: item.selectedOption ? item.selectedOption.price : item.product.price,
      })),
      notes: orderNotes,
      total: Number(subtotal.toFixed(2)),
    };
    openWhatsApp(buildMessage(extra));
    onOrderComplete(order);
  };

  const copyField = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignorar
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCardPay = async () => {    setPayError('');
    // Plan A: link de pago fijo configurado por el dueño
    if (MERCADOPAGO_LINK) {
      window.open(MERCADOPAGO_LINK, '_blank');
      return;
    }
    // Plan B: crear preferencia dinámica en el servidor
    setPaying(true);
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            title: item.selectedOption
              ? `${item.product.name} (${item.selectedOption.size})`
              : item.product.name,
            quantity: item.quantity,
            unit_price: item.selectedOption ? item.selectedOption.price : item.product.price,
          })),
          total: Number(subtotal.toFixed(2)),
          customerName,
          customerPhone,
          deliveryType,
          deliveryAddress,
          orderNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        if (data?.error === 'NOT_CONFIGURED') {
          setPayError(
            'El pago con tarjeta aún no está activado. Completa tu pedido por WhatsApp y coordinamos el pago. 🙏'
          );
        } else {
          setPayError('No se pudo iniciar el pago. Intenta de nuevo o usa otro método.');
        }
        return;
      }
      window.location.href = data.init_point;
    } catch {
      setPayError('Error de conexión. Revisa tu internet o usa otro método de pago.');
    } finally {
      setPaying(false);
    }
  };

  // Pago con tarjeta vía Kushki (link rápido o cobro integrado)
  const handleKushkiPay = async () => {
    setPayError('');
    if (KUSHKI_PAYMENT_LINK) {
      window.open(KUSHKI_PAYMENT_LINK, '_blank');
      return;
    }
    if (!KUSHKI_PUBLIC_KEY) {
      setPayError('El pago con Kushki aún no está activado. Completa tu pedido por WhatsApp y coordinamos el pago. 🙏');
      return;
    }
    const num = cardNumber.replace(/\D/g, '');
    if (cardName.trim().length < 3) {
      setPayError('Escribe el nombre que aparece en la tarjeta.');
      return;
    }
    if (num.length < 13 || num.length > 19) {
      setPayError('El número de tarjeta no es válido.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])$/.test(cardExpMM)) {
      setPayError('Mes de vencimiento inválido (01 a 12).');
      return;
    }
    if (!/^\d{2}$/.test(cardExpYY)) {
      setPayError('Año de vencimiento inválido (2 dígitos, Ej. 28).');
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvc)) {
      setPayError('Código de seguridad inválido.');
      return;
    }
    setPaying(true);
    try {
      await loadKushkiScript();
      const kushki = getKushki(KUSHKI_PUBLIC_KEY);
      if (!kushki) throw new Error('init');
      const token: string = await new Promise((resolve, reject) => {
        kushki.requestToken(
          {
            amount: Number(subtotal.toFixed(2)),
            currency: 'USD',
            card: {
              name: cardName.trim(),
              number: num,
              cvc: cardCvc,
              expiryMonth: cardExpMM,
              expiryYear: cardExpYY,
            },
          },
          (res) => (res.token ? resolve(res.token) : reject(new Error(res.message || 'token')))
        );
      });
      const r = await fetch('/api/pagos/kushki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, amount: Number(subtotal.toFixed(2)) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.approved) {
        setPayError(d?.message || 'La tarjeta fue rechazada. Verifica los datos o usa otro método.');
        return;
      }
      completeOrder(`✅ Pago aprobado con tarjeta vía Kushki${d.ticket ? ` (Ticket ${d.ticket})` : ''}.`);
    } catch {
      setPayError('No se pudo procesar la tarjeta. Revisa los datos o usa otro método.');
    } finally {
      setPaying(false);
    }
  };

  const cardInputCls =
    'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al pedido</span>
      </button>

      <div>
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
          1. Elige cómo pagar:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMethod(m.id);
                setPayError('');
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                method === m.id
                  ? 'bg-orange-600/20 border-orange-500 shadow-[0_0_15px_rgba(255,85,0,0.25)]'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <span className={`text-[11px] font-black leading-tight ${method === m.id ? 'text-amber-400' : 'text-zinc-300'}`}>
                {m.name}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1.5">
          {PAYMENT_METHODS.find((m) => m.id === method)?.description}
        </p>
      </div>

      {/* Panel: transferencia */}
      {method === 'transfer' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            2. Transfiere ${subtotal.toFixed(2)} a:
          </p>
          {[
            { key: 'bank', label: 'Banco', value: BANK_ACCOUNT.bank },
            { key: 'type', label: 'Tipo', value: BANK_ACCOUNT.accountType },
            { key: 'number', label: 'Cuenta', value: BANK_ACCOUNT.accountNumber },
            { key: 'holder', label: 'Titular', value: BANK_ACCOUNT.holder },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{f.label}</p>
                <p className="text-xs font-bold text-white truncate">{f.value}</p>
              </div>
              <button
                type="button"
                onClick={() => copyField(f.key, f.value)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                title="Copiar"
              >
                {copied === f.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Panel: Mercado Pago */}
      {method === 'card' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Pago 100% seguro con Mercado Pago. Acepta débito, crédito y más.</span>
          </div>
          {payError && (
            <p className="mt-3 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              {payError}
            </p>
          )}
        </div>
      )}

      {/* Panel: Kushki */}
      {method === 'kushki' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Pago 100% seguro con Kushki. Acepta débito, crédito y más.</span>
          </div>

          {!KUSHKI_PAYMENT_LINK && KUSHKI_PUBLIC_KEY && (
            <>
              <input
                type="text"
                placeholder="Nombre en la tarjeta"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className={cardInputCls}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Número de tarjeta"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(
                    e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
                  )
                }
                className={cardInputCls}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={cardExpMM}
                  onChange={(e) => setCardExpMM(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className={cardInputCls}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="AA"
                  value={cardExpYY}
                  onChange={(e) => setCardExpYY(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className={cardInputCls}
                />
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="CVC"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={cardInputCls}
                />
              </div>
              {KUSHKI_ENV !== 'production' && (
                <p className="text-[11px] text-zinc-500">🧪 Modo pruebas: usa una tarjeta de test de Kushki.</p>
              )}
            </>
          )}

          {payError && (
            <p className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              {payError}
            </p>
          )}
        </div>
      )}

      {/* Panel: DeUna */}
      {method === 'deuna' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3 text-center">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Paga ${subtotal.toFixed(2)} con tu app DeUna 📱
          </p>
          {qrOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={DEUNA_QR}
              alt="QR DeUna Moro's"
              onError={() => setQrOk(false)}
              className="w-40 h-40 mx-auto rounded-2xl border border-zinc-700 object-cover bg-white"
            />
          )}
          {DEUNA_LINK ? (
            <a
              href={DEUNA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black py-3 px-4 rounded-2xl text-sm transition-all"
            >
              ABRIR MI LINK DEUNA
            </a>
          ) : (
            <p className="text-[11px] text-zinc-500">
              Escanea el QR del local con tu app DeUna y envíanos el comprobante 👇
            </p>
          )}
        </div>
      )}

      {/* Botón de confirmación según método */}
      {method === 'cash' && (
        <button
          type="button"
          onClick={() => completeOrder()}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Send className="w-4 h-4" />
          <span>CONFIRMAR Y PEDIR POR WHATSAPP</span>
        </button>
      )}

      {method === 'transfer' && (
        <button
          type="button"
          onClick={() => completeOrder('🧾 Ya realicé la transferencia, envío el comprobante.')}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Send className="w-4 h-4" />
          <span>YA TRANSFERÍ — ENVIAR COMPROBANTE</span>
        </button>
      )}

      {method === 'card' && (
        <button
          type="button"
          onClick={handleCardPay}
          disabled={paying}
          className="w-full bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,130,246,0.35)] hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-60"
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          <span>{paying ? 'CONECTANDO…' : `PAGAR $${subtotal.toFixed(2)} CON TARJETA`}</span>
        </button>
      )}

      {method === 'kushki' && (
        <button
          type="button"
          onClick={handleKushkiPay}
          disabled={paying}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-60"
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          <span>{paying ? 'PROCESANDO…' : `PAGAR $${subtotal.toFixed(2)} CON KUSHKI`}</span>
        </button>
      )}

      {method === 'deuna' && (
        <button
          type="button"
          onClick={() => completeOrder('📱 Pagado con DeUna, envío el comprobante.')}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Send className="w-4 h-4" />
          <span>YA PAGUÉ CON DEUNA — ENVIAR COMPROBANTE</span>
        </button>
      )}
    </div>
  );
}
