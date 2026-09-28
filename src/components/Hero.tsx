'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { RESTAURANT_INFO, MENU_ITEMS } from '@/data/menuData';

const LEFT_DISH = MENU_ITEMS.find((m) => m.id === 'broaster-1')?.image || '/images/hero.jpg';
const CENTER_DISH = '/images/hero.jpg';
const RIGHT_DISH = MENU_ITEMS.find((m) => m.id === 'mixto-bbq')?.image || '/images/hero.jpg';

function Steam() {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -46], opacity: [0, 0.5, 0], scale: [0.8, 1.3] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
          className="block h-12 w-4 rounded-full bg-[#14532D]/15 blur-md"
        />
      ))}
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 18 });
  const sy = useSpring(my, { stiffness: 55, damping: 18 });

  const leftX = useTransform(sx, (v) => v * -55);
  const leftY = useTransform(sy, (v) => v * -35);
  const centerX = useTransform(sx, (v) => v * 35);
  const centerY = useTransform(sy, (v) => v * 22);
  const rightX = useTransform(sx, (v) => v * 55);
  const rightY = useTransform(sy, (v) => v * 35);
  const titleX = useTransform(sx, (v) => v * 18);

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
      style={{ perspective: 1200 }}
    >
      {/* Blobs frescos verdes/lima */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D9F24F]/40 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-[#14532D]/10 rounded-full blur-[110px]" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#F5EBD9] to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
        <motion.div style={{ x: titleX }}>
          <p className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.3em] uppercase text-[#14532D] bg-[#D9F24F]/60 border border-[#14532D]/20 px-4 py-1.5 rounded-full">
            🌿 Sabor fresco · Tulcán · 17:00 — 23:00
          </p>
          <h1 className="mt-5 font-serif text-[#14301F] leading-[1.02] text-5xl sm:text-7xl lg:text-8xl">
            El plato, <em className="italic font-light text-[#14532D]">antes</em>
            <br />
            <em className="italic font-light">del primer bocado.</em>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-[#14301F]/70 text-sm sm:text-base leading-relaxed">
            Pollo Broaster crocante, Hamburguesa Moro&apos;s gigante y Costillas BBQ con
            ingredientes frescos del día. Porción generosa y precio justo.
            Sin descargar ninguna app.
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
        </motion.div>

        {/* 3 platos */}
        <div className="mt-6 relative h-72 sm:h-96" style={{ transformStyle: 'preserve-3d' }}>
          <motion.div style={{ x: leftX, y: leftY }} className="absolute left-0 sm:left-[4%] top-10 w-36 h-36 sm:w-60 sm:h-60">
            <Steam />
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(20,83,45,0.25)]"
            >
              <Image src={LEFT_DISH} alt="Pollo Broaster" fill className="object-cover" />
            </motion.div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-black tracking-[0.25em] text-[#14532D] bg-[#D9F24F] px-3 py-1 rounded-full">
              ∟ BROASTER ∏
            </span>
          </motion.div>

          <motion.div style={{ x: centerX, y: centerY }} className="absolute left-1/2 -translate-x-1/2 top-0 w-60 h-60 sm:w-96 sm:h-96">
            <Steam />
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-4 border-[#14532D] shadow-[0_25px_70px_rgba(20,83,45,0.3)]"
            >
              <Image src={CENTER_DISH} alt="Combo Moro's" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
            </motion.div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#F04E23] text-white text-xs font-black px-4 py-2 rounded-full shadow-xl">
              DESDE $1.25
            </span>
          </motion.div>

          <motion.div style={{ x: rightX, y: rightY }} className="absolute right-0 sm:right-[4%] top-10 w-36 h-36 sm:w-60 sm:h-60">
            <Steam />
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(20,83,45,0.25)]"
            >
              <Image src={RIGHT_DISH} alt="Mixto BBQ" fill className="object-cover" />
            </motion.div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-black tracking-[0.25em] text-[#14532D] bg-[#D9F24F] px-3 py-1 rounded-full">
              ∟ BBQ ∏
            </span>
          </motion.div>
        </div>

        <p className="mt-4 text-[11px] font-bold tracking-widest uppercase text-[#14532D]/60">
          Mueve el mouse — los platos flotan en 3D
        </p>
        <a href="#menu" className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#14532D] hover:text-[#F04E23] transition-colors">
          <ArrowDown className="w-4 h-4" />
          Desliza para descubrir el sabor
        </a>
      </div>
    </section>
  );
}
