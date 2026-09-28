'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Flame, ChevronRight, ShoppingBag, ArrowDown } from 'lucide-react';
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
          className="block h-12 w-4 rounded-full bg-white/25 blur-md"
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
      className="relative overflow-hidden bg-zinc-950 border-b border-zinc-900"
      style={{ perspective: 1200 }}
    >
      {/* Blobs frescos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600/20 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
        <motion.div style={{ x: titleX }}>
          <p className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.3em] uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full">
            🌿 Sabor en movimiento · Tulcán · 17:00 — 23:00
          </p>
          <h1 className="mt-5 font-black tracking-tight text-white leading-[0.95] text-5xl sm:text-7xl lg:text-8xl">
            Crujiente
          </h1>
          <p className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight uppercase text-stroke-amber">
            Jugoso
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight uppercase">
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Irresistible</span>
          </h1>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#menu"
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(255,85,0,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>VER MENÚ Y PEDIR</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=Hola%20Moro's!%20Deseo%20hacer%20un%20pedido`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 font-bold px-7 py-4 rounded-2xl transition-all"
            >
              📲 Pedir por WhatsApp
            </a>
          </div>

          <p className="mt-4 text-[11px] font-bold tracking-widest uppercase text-zinc-500">
            Mueve el mouse — los platos flotan en 3D
          </p>
          <div className="mt-4 w-24 mx-auto">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full overflow-hidden">
              <div className="h-full w-full animate-scroll-line" />
            </div>
          </div>
          <p className="mt-1 text-[10px] font-medium tracking-widest uppercase text-zinc-600">
            Desliza para descubrir el sabor
          </p>
        </motion.div>

        {/* 3 platos */}
        <div className="mt-6 relative h-72 sm:h-96" style={{ transformStyle: 'preserve-3d' }}>
          <motion.div style={{ x: leftX, y: leftY }} className="absolute left-0 sm:left-[4%] top-10 w-36 h-36 sm:w-60 sm:h-60">
            <Steam />
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(255,120,0,0.3)]"
            >
              <Image src={LEFT_DISH} alt="Pollo Broaster" fill className="object-cover" />
            </motion.div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-black tracking-[0.25em] text-zinc-300 bg-zinc-950/70 border border-white/20 px-3 py-1 rounded-full">
              ∟ BROASTER ∏
            </span>
          </motion.div>

          <motion.div style={{ x: centerX, y: centerY }} className="absolute left-1/2 -translate-x-1/2 top-0 w-60 h-60 sm:w-96 sm:h-96">
            <Steam />
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-4 border-amber-400/70 shadow-[0_25px_70px_rgba(255,120,0,0.45)]"
            >
              <Image src={CENTER_DISH} alt="Combo Moro's" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
            </motion.div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-950/95 border border-amber-400/50 rounded-full px-4 py-2 text-xs font-black text-amber-400 shadow-xl">
              DESDE $1.25
            </span>
          </motion.div>

          <motion.div style={{ x: rightX, y: rightY }} className="absolute right-0 sm:right-[4%] top-10 w-36 h-36 sm:w-60 sm:h-60">
            <Steam />
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(255,120,0,0.3)]"
            >
              <Image src={RIGHT_DISH} alt="Mixto BBQ" fill className="object-cover" />
            </motion.div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-black tracking-[0.25em] text-zinc-300 bg-zinc-950/70 border border-white/20 px-3 py-1 rounded-full">
              ∟ BBQ ∏
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}