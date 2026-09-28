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

function DecorativeBurger() {
  return (
    <motion.div
      className="pointer-events-none fixed right-4 top-1/2 -translate-y-1/2 z-[5] hidden lg:block"
      style={{ perspective: 800 }}
      initial={{ opacity: 0, x: 100, rotateY: -30 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative w-48 h-48 sm:w-64 sm:h-64" style={{ transformStyle: 'preserve-3d' }}>
        {/* Sombra proyectada en el suelo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-black/20 rounded-full blur-2xl" style={{ transform: 'translateZ(-20px)' }} />
        
        {/* Humo sutil que sube */}
        <div className="pointer-events-none absolute top-[-40px] left-1/2 -translate-x-1/2 flex gap-1" style={{ transform: 'translateZ(40px)' }}>
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              animate={{ 
                y: [0, -80], 
                opacity: [0, 0.18, 0], 
                scale: [0.6, 1.2],
                x: [(i - 1.5) * 8, (i - 1.5) * 20]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
              className="block h-10 w-5 rounded-full bg-white/15 blur-lg"
            />
          ))}
        </div>

        {/* Burger apilada con capas realistas */}
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Pan superior (golden bun con semillas) */}
          <div className="absolute bottom-[62%] left-1/2 -translate-x-1/2 w-full h-10 sm:h-12 rounded-t-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border border-amber-600/50 shadow-[0_4px_20px_rgba(180,120,40,0.4)]" style={{ transform: 'translateZ(35px) rotateX(5deg)' }}>
            <div className="absolute inset-0 overflow-hidden rounded-t-2xl opacity-30">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2220%22 cy=%2220%22 r=%222%22 fill=%22%238B5A2B%22/%3E%3Ccircle cx=%2270%22 cy=%2230%22 r=%221.5%22 fill=%22%238B5A2B%22/%3E%3Ccircle cx=%2240%22 cy=%2260%22 r=%222%22 fill=%22%238B5A2B%22/%3E%3Ccircle cx=%2285%22 cy=%2275%22 r=%221%22 fill=%22%238B5A2B%22/%3E%3C/svg%3E')] bg-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-200/30 to-transparent" />
          </div>

          {/* Cebolla */}
          <div className="absolute bottom-[56%] left-1/2 -translate-x-1/2 w-[92%] h-3 sm:h-4 rounded-none bg-gradient-to-b from-white/80 via-amber-100 to-amber-200 border-t border-amber-300/50" style={{ transform: 'translateZ(28px) rotateX(3deg)' }} />
          
          {/* Tomate */}
          <div className="absolute bottom-[53%] left-1/2 -translate-x-1/2 w-[94%] h-4 sm:h-5 rounded-none bg-gradient-to-b from-red-500 via-red-600 to-red-700 border-t border-red-400/50 shadow-[0_2px_8px_rgba(180,30,30,0.3)]" style={{ transform: 'translateZ(22px) rotateX(2deg)' }} />
          
          {/* Lechuga (ondulada) */}
          <div className="absolute bottom-[49%] left-1/2 -translate-x-1/2 w-[98%] h-5 sm:h-6 rounded-none bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700" style={{ transform: 'translateZ(15px) rotateX(1deg)' }}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-emerald-400/50" style={{ clipPath: 'polygon(0% 100%, 8% 0%, 16% 100%, 24% 0%, 32% 100%, 40% 0%, 48% 100%, 56% 0%, 64% 100%, 72% 0%, 80% 100%, 88% 0%, 92% 100%, 100% 0%)' }} />
            </div>
          </div>

          {/* Queso derretido (con gotas) */}
          <div className="absolute bottom-[45%] left-1/2 -translate-x-1/2 w-[102%] h-4 sm:h-5 rounded-none bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 shadow-[0_3px_12px_rgba(220,180,40,0.4)]" style={{ transform: 'translateZ(8px)' }}>
            <div className="absolute bottom-0 left-[10%] w-2 h-1.5 bg-amber-300/60 rounded-full blur-sm" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            <div className="absolute bottom-0 left-[35%] w-1.5 h-1 bg-amber-300/60 rounded-full blur-sm" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            <div className="absolute bottom-0 right-[20%] w-2 h-1.5 bg-amber-300/60 rounded-full blur-sm" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
          </div>

          {/* Carne jugosa */}
          <div className="absolute bottom-[41%] left-1/2 -translate-x-1/2 w-[96%] h-7 sm:h-8 rounded-none bg-gradient-to-b from-amber-900 via-stone-800 to-amber-950 border-t border-amber-800/50 shadow-[0_4px_16px_rgba(60,30,10,0.5)]" style={{ transform: 'translateZ(0px)' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-700/20 to-transparent" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.3%22/%3E%3C/svg%3E")' }} />
          </div>

          {/* Pan inferior */}
          <div className="absolute bottom-[34%] left-1/2 -translate-x-1/2 w-full h-7 sm:h-8 rounded-b-2xl bg-gradient-to-t from-amber-500 via-amber-600 to-amber-700 border border-amber-800/50 shadow-[0_8px_24px_rgba(120,70,20,0.5)]" style={{ transform: 'translateZ(-8px) rotateX(-3deg)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/20 to-transparent" />
          </div>

          {/* Brillo especular en el pan superior */}
          <div className="absolute bottom-[70%] left-[15%] w-8 h-3 bg-white/20 rounded-full blur-2xl" style={{ transform: 'translateZ(40px)' }} />
        </div>

        {/* Resplandor ambiental alrededor */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/10 via-transparent to-transparent blur-3xl" style={{ transform: 'translateZ(-30px)' }} />
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

        {/* Hamburguesa decorativa lateral */}
        <DecorativeBurger />

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