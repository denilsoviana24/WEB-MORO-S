'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2, PartyPopper, Ticket } from 'lucide-react';
import Reveal from './Reveal';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'not-configured';

const MESSAGES: Record<Exclude<Status, 'idle' | 'loading'>, string> = {
  success: '¡Suscripción lista! Revisa tu correo y usa tu cupón 👇',
  error: 'Ups, algo falló. Intenta de nuevo en un momento.',
  'not-configured': 'El newsletter se activará muy pronto. ¡Vuelve pronto! 🚀',
};

export default function NewsletterSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading' || status === 'success') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.subscribed) {
        setStatus('success');
      } else if (data?.error === 'NOT_CONFIGURED') {
        setStatus('not-configured');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="newsletter" className="py-16 bg-zinc-950 relative overflow-hidden border-y border-zinc-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-orange-600/10 rounded-full blur-[110px]" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <Reveal>
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">
            Newsletter Moro&apos;s
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider mt-2 mb-3">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Promos en tu correo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Recibe las promos{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              antes que nadie
            </span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-3">
            Suscríbete y te avisamos de combos exclusivos, 2x1 y descuentos del Club Moro&apos;s. Sin spam, solo sabor. 🍔
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-black">
                <PartyPopper className="w-5 h-5" />
                <span>{MESSAGES.success}</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-dashed border-amber-500/50 bg-zinc-950/70 px-5 py-3">
                <Ticket className="w-5 h-5 text-amber-400" />
                <code className="text-amber-400 font-black tracking-[0.2em] text-lg">MOROS10</code>
              </div>
              <p className="text-zinc-400 text-xs mt-3">
                10% OFF en tu pedido mayor a $5. Menciónalo en caja o por WhatsApp.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 shrink-0"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{status === 'loading' ? 'Enviando…' : 'Quiero promos'}</span>
              </button>
            </form>
          )}

          {(status === 'error' || status === 'not-configured') && (
            <p className="mt-3 text-xs font-bold text-amber-400">{MESSAGES[status]}</p>
          )}
          {status !== 'success' && (
            <p className="mt-3 text-[11px] text-zinc-600">
              Al suscribirte aceptas recibir promociones de Moro&apos;s. Date de baja cuando quieras.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
