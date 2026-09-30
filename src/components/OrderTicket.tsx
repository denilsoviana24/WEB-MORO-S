'use client';

import React from 'react';
import { Printer, X, Store, Bike, PartyPopper } from 'lucide-react';

export interface TicketItem {
  name: string;
  detail?: string;
  qty: number;
  price: number;
}

export interface OrderData {
  number: string;
  timestamp: number;
  customerName: string;
  customerPhone: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress: string;
  paymentMethod: string;
  items: TicketItem[];
  notes: string;
  total: number;
}

/** Número de pedido secuencial: MOROS-0001, MOROS-0002… */
export function createOrderNumber(): string {
  try {
    const seq = (parseInt(localStorage.getItem('moros_order_seq') || '0', 10) || 0) + 1;
    localStorage.setItem('moros_order_seq', String(seq));
    return `MOROS-${String(seq).padStart(4, '0')}`;
  } catch {
    return `MOROS-${Date.now().toString().slice(-6)}`;
  }
}

export function formatOrderDate(ts: number): string {
  return new Date(ts).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface OrderTicketProps {
  order: OrderData;
  onClose: () => void;
}

export default function OrderTicket({ order, onClose }: OrderTicketProps) {
  const isPickup = order.deliveryType === 'pickup';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm ticket-actions" onClick={onClose} />

      <div className="relative w-full max-w-sm my-auto">
        {/* Encabezado de éxito (solo pantalla) */}
        <div className="ticket-actions text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-sm px-4 py-2 rounded-full">
            <PartyPopper className="w-4 h-4" />
            <span>¡Pedido enviado por WhatsApp!</span>
          </div>
          <p className="text-zinc-400 text-xs mt-2">
            {isPickup
              ? 'Presenta este comprobante en el local para retirar tu pedido.'
              : 'Guarda este comprobante para recibir tu pedido.'}
          </p>
        </div>

        {/* Papel del ticket (esto es lo que se imprime) */}
        <div id="order-ticket" className="bg-white text-zinc-900 rounded-lg shadow-2xl overflow-hidden">
          {/* Cabecera */}
          <div className="bg-zinc-950 text-center px-5 pt-5 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-moros.jpg"
              alt="Moro's"
              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-orange-500"
            />
            <p className="text-white font-black text-lg tracking-wide mt-2">MORO&apos;S</p>
            <p className="text-amber-400 text-[11px] font-bold uppercase tracking-widest">Comidas Rápidas · Tulcán</p>
            <p className="text-zinc-400 text-[10px] mt-1">Av. Veintimilla y Pasaje Atahualpa · 0961290493</p>
          </div>

          <div className="px-5 py-4 font-mono text-[13px] leading-relaxed">
            <p className="text-center font-black text-base tracking-widest">COMPROBANTE DE PEDIDO</p>

            <div className="mt-2 text-center bg-amber-100 border-2 border-dashed border-amber-500 rounded-lg py-2">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">N° de pedido</p>
              <p className="font-black text-2xl tracking-widest">{order.number}</p>
            </div>

            <div className="mt-3 flex justify-center">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  isPickup ? 'bg-zinc-900 text-amber-400' : 'bg-emerald-600 text-white'
                }`}
              >
                {isPickup ? <Store className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                <span>{isPickup ? 'Retiro en local' : 'Entrega a domicilio'}</span>
              </span>
            </div>

            <div className="border-t border-dashed border-zinc-300 my-3" />

            <p><span className="text-zinc-500">Fecha:</span> <strong>{formatOrderDate(order.timestamp)}</strong></p>
            <p><span className="text-zinc-500">Cliente:</span> <strong>{order.customerName}</strong></p>
            {order.customerPhone && (
              <p><span className="text-zinc-500">Teléfono:</span> <strong>{order.customerPhone}</strong></p>
            )}
            {!isPickup && order.deliveryAddress && (
              <p><span className="text-zinc-500">Dirección:</span> <strong>{order.deliveryAddress}</strong></p>
            )}
            <p><span className="text-zinc-500">Pago:</span> <strong>{order.paymentMethod}</strong></p>

            <div className="border-t border-dashed border-zinc-300 my-3" />

            {order.items.map((item, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between gap-2">
                  <span className="font-bold">{item.qty}x {item.name}</span>
                  <span className="font-bold whitespace-nowrap">${(item.price * item.qty).toFixed(2)}</span>
                </div>
                {item.detail && <p className="text-zinc-500 text-[11px]">({item.detail})</p>}
              </div>
            ))}

            {order.notes && (
              <p className="mt-1 text-[11px] text-zinc-600 italic">Notas: {order.notes}</p>
            )}

            <div className="border-t border-dashed border-zinc-300 my-3" />

            <div className="flex justify-between items-center">
              <span className="font-black text-base">TOTAL</span>
              <span className="font-black text-2xl">${order.total.toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-zinc-300 my-3" />

            <p className="text-center text-[11px] text-zinc-600">
              {isPickup
                ? 'Muestra tu N° de pedido en caja para retirar. ¡Te esperamos! 🍔'
                : 'El repartidor coordinará la entrega por WhatsApp. ¡Buen provecho! 🛵'}
            </p>
            <p className="text-center font-bold text-[11px] mt-1">¡Gracias por preferir Moro&apos;s!</p>
          </div>
        </div>

        {/* Acciones (solo pantalla) */}
        <div className="ticket-actions mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-sm py-3 rounded-2xl transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-sm py-3 rounded-2xl transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
