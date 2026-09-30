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
};

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

  const handleCardPay = async () => {
    setPayError('');
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

      {/* Panel: tarjeta */}
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
    </div>
  );
}
