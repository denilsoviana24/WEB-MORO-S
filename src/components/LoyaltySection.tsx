'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Copy, Check, Gift, Stamp, Ticket } from 'lucide-react';
import Reveal from './Reveal';
import { friesRain } from '@/lib/friesRain';
import { getLoyaltyStamps, addLoyaltyStamp, resetLoyaltyStamps, LOYALTY_EVENT } from '@/lib/loyalty';
import {
  LOYALTY_TIERS,
  LOYALTY_PROMOS,
  STAMPS_GOAL,
  STAMPS_REWARD,
} from '@/data/loyaltyData';

export default function LoyaltySection() {
  const [stamps, setStamps] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  // Carga inicial + se actualiza solo cuando el carrito suma un sello
  useEffect(() => {
    setStamps(getLoyaltyStamps(STAMPS_GOAL));
    const refresh = () => setStamps(getLoyaltyStamps(STAMPS_GOAL));
    window.addEventListener(LOYALTY_EVENT, refresh);
    return () => window.removeEventListener(LOYALTY_EVENT, refresh);
  }, []);

  const unlocked = stamps >= STAMPS_GOAL;

  const addStamp = () => {
    const { stamps: next, completed } = addLoyaltyStamp(STAMPS_GOAL);
    setStamps(next);
    if (completed) friesRain();
  };

  const claimReward = () => {
    resetLoyaltyStamps();
    setStamps(0);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // portapapeles no disponible, igual mostramos confirmación
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section id="club-moros" className="py-16 bg-zinc-950 border-y border-zinc-900 relative overflow-hidden">
      {/* brillo de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-10">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">
            02 — Club Moro&apos;s
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider mt-2 mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Clientes fieles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Mientras más vienes, <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">más ganas</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-3">
            Junta sellos en tu tarjeta fiel con cada visita y sube de nivel para desbloquear descuentos, regalos y promos exclusivas.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Tarjeta fiel */}
          <Reveal className="h-full">
            <div className="h-full rounded-3xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stamp className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-white text-lg">Mi Tarjeta Fiel</h3>
                </div>
                <span className="text-xs font-bold text-zinc-400">
                  {stamps}/{STAMPS_GOAL} sellos
                </span>
              </div>

              {/* progreso */}
              <div className="mt-3 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400"
                  animate={{ width: `${(stamps / STAMPS_GOAL) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                />
              </div>

              {/* sellos */}
              <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
                {Array.from({ length: STAMPS_GOAL }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={i < stamps ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    className={`aspect-square rounded-2xl border flex items-center justify-center text-2xl ${
                      i < stamps
                        ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(255,180,0,0.25)]'
                        : 'bg-zinc-900 border-zinc-800 grayscale opacity-50'
                    }`}
                  >
                    🍟
                  </motion.div>
                ))}
              </div>

              <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
                Cada pedido en la web suma 1 sello automáticamente 🍟. En el local, pide al personal que selle tu tarjeta. Al completar los {STAMPS_GOAL} sellos reclamas tu premio.
              </p>

              <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={addStamp}
                  disabled={stamps >= STAMPS_GOAL}
                  className="flex-1 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-zinc-950 font-black text-sm px-5 py-3 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {stamps >= STAMPS_GOAL ? '¡Tarjeta completa! 🎉' : 'Sumar sello de mi visita'}
                </button>
                {stamps > 0 && !unlocked && (
                  <button
                    onClick={() => {
                      resetLoyaltyStamps();
                      setStamps(0);
                    }}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-300 px-3 py-2"
                  >
                    Reiniciar
                  </button>
                )}
              </div>

              {/* premio desbloqueado */}
              <AnimatePresence>
                {unlocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                      <Gift className="w-4 h-4" />
                      <span>¡Premio desbloqueado!</span>
                    </div>
                    <p className="text-white font-bold text-sm mt-1">{STAMPS_REWARD.title}</p>
                    <p className="text-zinc-400 text-xs mt-1">{STAMPS_REWARD.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-amber-400 font-black text-sm text-center tracking-widest">
                        {STAMPS_REWARD.code}
                      </code>
                      <button
                        onClick={() => copyCode(STAMPS_REWARD.code)}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                        title="Copiar código"
                      >
                        {copied === STAMPS_REWARD.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={claimReward}
                      className="mt-3 w-full text-xs font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      Ya reclamé mi premio → empezar nueva tarjeta
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Niveles + cupones */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LOYALTY_TIERS.map((tier, i) => (
                <Reveal key={tier.id} delay={i * 0.1} className="h-full">
                  <div className={`h-full rounded-3xl border ${tier.border} bg-zinc-900/70 p-5`}>
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {tier.icon}
                    </div>
                    <h3 className="mt-3 font-black text-white">{tier.name}</h3>
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{tier.visits}</p>
                    <ul className="mt-3 space-y-1.5">
                      {tier.benefits.map((b) => (
                        <li key={b} className="text-xs text-zinc-300 flex gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-5 h-5 text-orange-400" />
                  <h3 className="font-black text-white">Cupones del club</h3>
                </div>
                <div className="space-y-3">
                  {LOYALTY_PROMOS.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-dashed border-amber-500/40 bg-zinc-950/70 p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-sm">{promo.title}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            {promo.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{promo.description}</p>
                      </div>
                      <button
                        onClick={() => copyCode(promo.code)}
                        className="shrink-0 flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 transition-colors"
                        title="Copiar código"
                      >
                        <code className="text-amber-400 font-black text-xs tracking-widest">{promo.code}</code>
                        {copied === promo.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
