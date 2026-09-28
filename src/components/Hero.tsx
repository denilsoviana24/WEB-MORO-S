'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { RESTAURANT_INFO, MENU_ITEMS } from '@/data/menuData';

const WATERMARKS = [
  { id: 'broaster-1', left: '4%', top: '8%', size: 'w-44 h-44 sm:w-64 sm:h-64', dur: 9, dx: 24 },
  { id: 'burger-moros', left: '72%', top: '6%', size: 'w-48 h-48 sm:w-72 sm:h-72', dur: 11, dx: -28 },
  { id: 'mixto-bbq', left: '12%', top: '58%', size: 'w-40 h-40 sm:w-60 sm:h-60', dur: 10, dx: 20 },
  { id: 'papi-completa-moros', left: '68%', top: '60%', size: 'w-44 h-44 sm:w-64 sm:h-64', dur: 12, dx: -22 },
  { id: 'hot-dog-especial', left: '40%', top: '38%', size: 'w-36 h-36 sm:w-52 sm:h-52', dur: 8, dx: 16 },
];

function Smoke({ wide = false }: { wide?: boolean }) {
  return (
    <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [10, -60], opacity: [0, 0.55, 0], scale: [0.7, 1.5], x: [0, (i - 1.5) * 10] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
          className={`block rounded-full bg-white blur-lg ${wide ? 'h-16 w-6' : 'h-12 w-4'}`}
        />
      ))}
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });

  const bgX = useTransform(sx, (v) => v * -30);
  const bgY = useTransform(sy, (v) => v * -20);
  const fgX = useTransform(sx, (v) => v * 16);

  const onMouseMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative overflow-hidden bg-[#FFF9F0] border-b border-[#14532D]/15"
    >
      {/* Blobs frescos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D9F24F]/40 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-[#14532D]/10 rounded-full blur-[110px]" />
      </div>

      {/* MARCA DE AGUA: platos atrás, moviéndose, con humo */}
      <motion.div style={{ x: bgX, y: bgY }} className="pointer-events-none absolute inset-0" aria-hidden>
        {WATERMARKS.map((w) => {
          const item = MENU_ITEMS.find((m) => m.id === w.id);
          if (!item) return null;
          return (
            <motion.div
              key={w.id}
              className={`absolute ${w.size}`}
              style={{ left: w.left, top: w.top }}
              animate={{ x: [0, w.dx, 0], y: [0, -18, 0], rotate: [0, 4, 0] }}
              transition={{ duration: w.dur, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Smoke wide />
              <div className="relative w-full h-full rounded-full overflow-hidden opacity-25 blur-[1px] border-4 border-white shadow-[0_20px_60px_rgba(20,83,45,0.2)]">
                <Image src={item.image} alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-[#FFF9F0]/25" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* FRENTE: solo el nombre MORO'S */}
      <motion.div style={{ x: fgX }} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">
        <p className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.35em] uppercase text-[#14532D] bg-[#D9F24F]/60 border border-[#14532D]/20 px-4 py-1.5 rounded-full">
          🌿 Comidas rápidas · Tulcán
        </p>
        <h1 className="mt-6 font-black tracking-tight text-[#14301F] leading-[0.9] text-[22vw] sm:text-8xl lg:text-9xl drop-shadow-[0_12px_35px_rgba(20,83,45,0.18)]">
          MORO&apos;S
        </h1>
        <p className="mt-4 font-serif italic text-xl sm:text-2xl text-[#14532D]">
          El auténtico sabor de Tulcán — 17:00 a 23:00
        </p>
        <p className="mt-4 max-w-xl mx-auto text-[#14301F]/65 text-sm sm:text-base leading-relaxed">
          Broaster crocante, hamburguesas gigantes, papi completas y BBQ.
          Todo fresco, generoso y al instante.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#menu"
            className="w-full sm:w-auto rounded-full bg-[#14532D] hover:bg-[#0c3a20] px-8 py-3.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(20,83,45,0.3)] transition-all"
          >
            Ver el menú
          </Link>
          <a
            href={`https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=Hola%20Moro's!%20Deseo%20hacer%20un%20pedido`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto rounded-full bg-[#F04E23] hover:bg-[#d63f18] px-8 py-3.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(240,78,35,0.3)] transition-all"
          >
            Pedir por WhatsApp →
          </a>
        </div>

        <a href="#menu" className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-[#14532D]/70 hover:text-[#F04E23] transition-colors">
          <ArrowDown className="w-4 h-4" />
          Desliza para descubrir el sabor
        </a>
      </motion.div>
    </section>
  );
}
