'use client';

import React from 'react';
import Reveal from './Reveal';

const ERAS = [
  {
    year: '17:00',
    title: 'La llegada',
    desc: 'Se encienden las freidoras en Av. Veintimilla. El olor a broaster avisa que Moro’s abrió.',
  },
  {
    year: '19:00',
    title: 'El renacer',
    desc: 'La hora pico: Papi Completas, BBQ y Hamburguesa Moro’s salen al instante, porciones generosas.',
  },
  {
    year: '23:00',
    title: 'Leyenda local',
    desc: 'Cierre con clientes felices. El sabor de Tulcán que vuelve cada noche, de lunes a domingo.',
  },
];

export default function StoryTimeline() {
  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">Nuestra historia en una noche</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white">
            De antojo callejero a <span className="text-orange-500">ícono de Tulcán</span>
          </h2>
        </Reveal>

        <div className="mt-12 flex gap-5 overflow-x-auto pb-4 snap-x scrollbar-none">
          {ERAS.map((e, i) => (
            <Reveal key={e.year} delay={i * 0.1} className="snap-start shrink-0 w-[85%] sm:w-[380px]">
              <div className="h-full bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-7 hover:border-amber-400/50 transition-colors">
                <span className="text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                  {e.year}
                </span>
                <h3 className="mt-3 text-xl font-extrabold text-white">{e.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{e.desc}</p>
                <div className="mt-5 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-amber-400 rounded-full"
                    style={{ width: `${(i + 1) * 33}%` }}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500 font-semibold">← Desliza horizontal para ver la evolución →</p>
      </div>
    </section>
  );
}
