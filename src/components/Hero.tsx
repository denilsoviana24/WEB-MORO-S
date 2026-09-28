'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Flame, ChevronRight, ShoppingBag } from 'lucide-react';
import { RESTAURANT_INFO, MENU_ITEMS } from '@/data/menuData';

const LEFT_DISH = MENU_ITEMS.find((m) => m.id === 'broaster-1')?.image || '/images/hero.jpg';
const CENTER_DISH = '/images/hero.jpg';
const RIGHT_DISH = MENU_ITEMS.find((m) => m.id === 'mixto-bbq')?.image || '/images/hero.jpg';

// Imagen de hamburguesa realista (Unsplash - hamburguesa gourmet apetitosa)
const BURGER_IMAGE = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80';

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

function HeroBurger() {
  return (
    <motion.div
      className="pointer-events-none fixed right-6 top-1/2 -translate-y-1/2 z-[5] hidden lg:block"
      initial={{ opacity: 0, x: 120, rotateY: -25, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
      transition={{ duration: 1.4, delay: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-64 h-64 sm:w-80 sm:h-80" style={{ transformStyle: 'preserve-3d' }}>
        {/* Sombra proyectada realista en el suelo */}
        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-40 h-10 bg-black/25 rounded-full blur-3xl" style={{ transform: 'translateZ(-40px)' }} />
        
        {/* Resplandor ambiental cálido detrás */}
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-tr from-amber-400/15 via-transparent to-transparent blur-3xl" style={{ transform: 'translateZ(-30px)' }} />

        {/* Hamburguesa real con humo */}
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Humo sutil saliendo - 5 columnas finas */}
          <div className="pointer-events-none absolute top-[-30px] left-1/2 -translate-x-1/2 flex gap-1.5" style={{ transform: 'translateZ(50px)' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                animate={{ 
                  y: [0, -100], 
                  opacity: [0, 0.12, 0], 
                  scale: [0.5, 1.1],
                  x: [(i - 2) * 6, (i - 2) * 14]
                }}
                transition={{ duration: 5, repeat: Infinity, delay: i * 1.1, ease: 'easeOut' }}
                className="block h-14 w-6 rounded-full bg-white/10 blur-xl"
              />
            ))}
          </div>

          {/* Imagen de la hamburguesa real */}
          <div className="relative w-full h-full" style={{ transform: 'perspective(1000px) rotateY(-8deg) rotateX(3deg)' }}>
            <div className="absolute inset-0 rounded-[50%] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5),_0_0_60px_rgba(255,140,0,0.25)] ring-1 ring-amber-300/20">
              <Image
                src={BURGER_IMAGE}
                alt="Hamburguesa Moro's recién hecha"
                fill
                className="object-cover object-center"
                priority
              />
              {/* Brillo superior sutil */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
              {/* Oscurecimiento bordes para profundidad */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
            </div>
            
            {/* Etiqueta flotante "RECIÉN HECHA" */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-950/95 backdrop-blur-sm border border-amber-400/40 text-amber-300 text-[10px] font-black tracking-widest px-4 py-2 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
            >
              🔥 RECIÉN HECHA
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
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
      {/* Blobs de fondo */}
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

        {/* Hamburguesa decorativa lateral */}
        <HeroBurger />

        {/* 3 platos flotantes */}
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