'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, X, XCircle } from 'lucide-react';

/**
 * Mensaje al volver de Mercado Pago (?pago=exitoso|pendiente|fallido).
 * La confirmación real del pago la hace el webhook en el servidor.
 */
const STATES = {
  exitoso: {
    icon: CheckCircle2,
    title: '¡Pago aprobado!',
    text: 'Recibimos tu pago. Te confirmamos el pedido por WhatsApp en un momento.',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  pendiente: {
    icon: Clock,
    title: 'Pago en proceso',
    text: 'Mercado Pago todavía está procesando el pago. Apenas se apruebe, tu pedido queda confirmado.',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  fallido: {
    icon: XCircle,
    title: 'El pago no se completó',
    text: 'No pudimos confirmar el pago. Tu pedido quedó guardado: puedes reintentar o escribirnos por WhatsApp.',
    className: 'border-red-500/40 bg-red-500/10 text-red-300',
  },
} as const;

type PagoState = keyof typeof STATES;

export default function PaymentReturnBanner() {
  const [state, setState] = useState<PagoState | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('pago');
    if (!param || !(param in STATES)) return;

    setState(param as PagoState);

    // Limpia el parámetro para que no reaparezca al recargar.
    const url = new URL(window.location.href);
    url.searchParams.delete('pago');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, []);

  if (!state) return null;

  const view = STATES[state];
  const Icon = view.icon;

  return (
    <div className="fixed left-1/2 bottom-4 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${view.className}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">{view.title}</p>
          <p className="text-[11px] leading-snug opacity-90">{view.text}</p>
        </div>
        <button
          onClick={() => setState(null)}
          aria-label="Cerrar aviso"
          className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
