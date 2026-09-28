'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Flame, ChevronRight, ShoppingBag, ArrowDown } from 'lucide-react';
import { RESTAURANT_INFO, MENU_ITEMS } from '@/data/menuData';
import { useCart } from '@/context/CartContext';

const LEFT_DISH = MENU_ITEMS.find((m) => m.id === 'broaster-1')?.image || '/images/hero.jpg';
const CENTER_DISH = '/images/hero.jpg';
const RIGHT_DISH = MENU_ITEMS.find((m) => m.id === 'mixto-bbq')?.image || '/images/hero.jpg';

export default function Hero() {
  const { setIsCartOpen } = useCart();
  const ref = useRef<HTMLElement>(null);

  // Mouse 3D parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  const leftX = useTransform(sx, (v) => v * -60);
  const leftY = useTransform(sy, (v) => v * -40);
  const leftRY = useTransform(sx, (v) => v * 30);
  const centerX = useTransform(sx, (v) => v * 40);
  const centerY = useTransform(sy, (v) => v * 25);
  const rightX = useTransform(sx, (v) => v * 60);
  const rightY = useTransform(sy, (v) => v * 40);
  const rightRY = useTransform(sx, (v) => v * -30);
  const titleX = useTransform(sx, (v) => v * 22);
  const glowX = useTransform(sx, (v) => v * 80);

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
      {/* Fondo estrellado + glow que sigue el mouse */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 30% 70%, rgba(255,255,255,0.35), transparent), radial-gradient(1.5px 1.5px at 70% 25%, rgba(251,191,36,0.5), transparent), radial-gradient(1px 1px at 85% 60%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 50% 40%, rgba(255,255,255,0.25), transparent)',
          }}
        />
        <motion.div style={{ x: glowX }} className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-orange-600/25 to-amber-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex items-center justify-between text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-400">
        <span className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Sabor en movimiento · Tulcán
        </span>
        <span className="hidden sm:block text-amber-400/90">17:00 — 23:00 · Todos los días</span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 text-center" style={{ transformStyle: 'preserve-3d' }}>
        {/* Titulares con profundidad 3D */}
        <motion.div style={{ x: titleX }}>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-white uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            Crujiente
          </h1>
          <p className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight uppercase text-stroke-amber">
            Jugoso
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight uppercase">
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(255,120,0,0.35)]">Irresistible</span>
          </h1>
        </motion.div>

        {/* Escena 3D: 3 platos flotantes */}
        <div className="mt-4 relative h-64 sm:h-80" style={{ transformStyle: 'preserve-3d' }}>
          {/* Plato izquierda */}
          <motion.div
            style={{ x: leftX, y: leftY, rotateY: leftRY, z: -60 }}
            className="absolute left-[2%] sm:left-[12%] top-8 w-32 h-32 sm:w-48 sm:h-48"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <Image src={LEFT_DISH} alt="Pollo Broaster" fill className="object-cover" />
            </motion.div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black tracking-widest text-zinc-300 border border-white/20 px-3 py-1 rounded bg-zinc-950/70 backdrop-blur">
              ∟ BROASTER ∏
            </span>
          </motion.div>

          {/* Plato centro (protagonista) */}
          <motion.div
            style={{ x: centerX, y: centerY, z: 80 }}
            className="absolute left-1/2 -translate-x-1/2 top-0 w-56 h-56 sm:w-80 sm:h-80"
          >
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-4 border-amber-400/70 shadow-[0_30px_90px_rgba(255,120,0,0.45)]"
            >
              <Image src={CENTER_DISH} alt="Combo Moro's" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />
            </motion.div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-950/95 border border-amber-400/50 rounded-full px-4 py-2 text-xs font-black text-amber-400 shadow-xl">
              DESDE $1.25
            </span>
          </motion.div>

          {/* Plato derecha */}
          <motion.div
            style={{ x: rightX, y: rightY, rotateY: rightRY, z: -60 }}
            className="absolute right-[2%] sm:right-[12%] top-8 w-32 h-32 sm:w-48 sm:h-48"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <Image src={RIGHT_DISH} alt="Mixto BBQ" fill className="object-cover" />
            </motion.div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black tracking-widest text-zinc-300 border border-white/20 px-3 py-1 rounded bg-zinc-950/70 backdrop-blur">
              ∟ BBQ ∏
            </span>
          </motion.div>
        </div>

        <p className="mt-8 max-w-2xl mx-auto text-zinc-300 text-sm sm:text-lg leading-relaxed">
          Pollo Broaster crocante, Hamburguesa Moro&apos;s gigante, Papi Completas y Costillas BBQ.
          <span className="text-amber-400 font-bold"> El plato, antes del primer bocado.</span>
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
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

        <p className="mt-6 text-[11px] font-bold tracking-widest uppercase text-zinc-500">
          Mueve el mouse — los platos flotan en 3D
        </p>

        <button
          onClick={() => setIsCartOpen(true)}
          className="mt-3 text-xs font-bold text-zinc-500 hover:text-amber-400 transition-colors inline-flex items-center gap-2"
        >
          <ArrowDown className="w-4 h-4" />
          Desliza para descubrir el sabor
        </button>
      </div>
    </section>
  );
}
