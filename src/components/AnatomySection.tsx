'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from './Reveal';

const LAYERS = [
  { label: 'Pan artesanal', emoji: '🍞', side: 'left', y: '8%' },
  { label: 'Carne jugosa + queso', emoji: '🧀', side: 'right', y: '28%' },
  { label: 'Tocino + jamón + huevo', emoji: '🥓', side: 'left', y: '48%' },
  { label: 'Vegetales frescos', emoji: '🥬', side: 'right', y: '66%' },
  { label: 'Papas + gaseosa incluida', emoji: '🍟', side: 'left', y: '84%' },
];

export default function AnatomySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-4, 4]);

  return (
    <section ref={ref} className="py-20 bg-zinc-900/50 border-y border-zinc-800/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">Anatomía</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white">
            Descubre el equilibrio <span className="text-orange-500">de la Moro&apos;s</span>
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            La hamburguesa estrella $3.50, capa por capa, como se desarma en tu boca.
          </p>
        </Reveal>

        <div className="mt-12 relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Plato central con parallax */}
          <motion.div style={{ y: imgY, rotate }} className="relative mx-auto w-72 h-72 sm:w-96 sm:h-96">
            <div className="absolute inset-0 rounded-full bg-orange-600/20 blur-[80px]" />
            <div className="animate-float relative w-full h-full rounded-full overflow-hidden border-4 border-zinc-700 shadow-2xl">
              <Image
                src="/images/hero.jpg"
                alt="Anatomía Hamburguesa Moro's"
                fill
                className="object-cover"
              />
            </div>
            <span className="absolute inset-0 rounded-full border border-dashed border-amber-400/30 animate-spin-slower" />
          </motion.div>

          {/* Capas flotantes */}
          <div className="relative space-y-4">
            {LAYERS.map((l, i) => (
              <Reveal key={l.label} delay={i * 0.08}>
                <div
                  className={`flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 shadow-lg hover:border-orange-500/50 transition-colors ${
                    l.side === 'right' ? 'sm:ml-10' : 'sm:mr-10'
                  }`}
                >
                  <span className="text-2xl">{l.emoji}</span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">Capa {i + 1}</p>
                    <p className="font-bold text-white">{l.label}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
