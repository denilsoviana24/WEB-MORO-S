'use client';

import React from 'react';
import Reveal from './Reveal';

const STEPS = [
  {
    n: '01',
    tag: 'Elige',
    title: 'El plato antes del primer bocado',
    desc: 'Explora la carta con fotos reales, precios claros y badges de lo más pedido. Sin apps, directo en tu navegador.',
  },
  {
    n: '02',
    tag: 'Personaliza',
    title: 'Disección de ingredientes',
    desc: 'Cada plato se abre por capas: porción, extras, tamaño de bebida. Transparencia hasta el último detalle.',
  },
  {
    n: '03',
    tag: 'Pide',
    title: 'La voz de Moro’s por WhatsApp',
    desc: 'Tu pedido llega armado al WhatsApp 0961290493. Confirmas y en minutos está en tu mesa o para llevar.',
  },
];

export default function ExperienceSection() {
  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">La experiencia</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white">
            Un pedido. Tres capas <span className="text-orange-500">de sabor.</span>
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            Inspirado en menús inmersivos: ver, entender y pedir sin fricción.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="group h-full bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-7 transition-all hover:-translate-y-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-stroke">{s.n}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full">
                    {s.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-white group-hover:text-orange-400 transition-colors">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
