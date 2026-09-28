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
          animate={{ y: [0, -46], opacity: [0, 0.7, 0], scale: [0.8, 1.3] }}
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
      className="relative overflow-hidden bg-[#05070f] border-b border-zinc-900"
      style={{ perspective: 1200 }}
    >
      {/* Cielo estrellado + flores inferiores */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 8% 18%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 22% 65%, rgba(255,255,255,0.4), transparent), radial-gradient(1.5px 1.5px at 45% 12%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 68% 30%, rgba(147,197,253,0.6), transparent), radial-gradient(1px 1px at 82% 55%, rgba(255,255,255,0.45), transparent), radial-gradient(1px 1px at 55% 80%, rgba(251,191,36,0.4), transparent)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-amber-600/20 via-orange-500/5 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
        <motion.div style={{ x: titleX }}>
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-300">
            Sabor inmersivo · Experiencia Moro&apos;s
          </p>
          {/* Titular serif estilo FloatMenu */}
          <h1 className="mt-5 font-serif text-white leading-[1.02] text-5xl sm:text-7xl lg:text-8xl">
            El plato, <em className="italic font-light">antes</em>
            <br />
            <em className="italic font-light text-zinc-200">del primer bocado.</em>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-zinc-300 text-sm sm:text-base leading-relaxed">
            Transformamos la carta de Tulcán en una experiencia inmersiva. Mira, antoja
            y pide tu plato en 3D — Pollo Broaster, Hamburguesa Moro&apos;s y Costillas BBQ,
            porción generosa y precio justo. Sin descargar ninguna app.
          </p>

          {/* Botones outline tipo Book a Demo / Watch Film */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#menu"
              className="w-full sm:w-auto rounded-full border border-white/30 hover:border-amber-400/70 hover:bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Ver el menú
            </Link>
            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=Hola%20Moro's!%20Deseo%20hacer%20un%20pedido`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-full border border-white/30 hover:border-emerald-400/70 hover:bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-all"
            >
              Pedir por WhatsApp →
            </a>
          </div>
        </motion.div>

        {/* 3 platos holográficos */}
        <div className="mt-6 relative h-72 sm:h-96" style={{ transformStyle: 'preserve-3d' }}>
          {/* Izquierda */}
          <motion.div style={{ x: leftX, y: leftY }} className="absolute left-0 sm:left-[4%] top-10 w-36 h-36 sm:w-60 sm:h-60">
            <Steam />
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border border-cyan-200/40 shadow-[0_0_60px_rgba(103,232,249,0.25)]"
            >
              <Image src={LEFT_DISH} alt="Pollo Broaster" fill className="object-cover" />
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-cyan-100/30" />
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/15 via-transparent to-white/10" />
            </motion.div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.25em] text-zinc-300 border-x border-y border-white/20 px-3 py-1 bg-zinc-950/60 backdrop-blur">
              ∟ BROASTER ∏
            </span>
          </motion.div>

          {/* Centro */}
          <motion.div style={{ x: centerX, y: centerY }} className="absolute left-1/2 -translate-x-1/2 top-0 w-60 h-60 sm:w-96 sm:h-96">
            <Steam />
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border-2 border-amber-200/40 shadow-[0_0_90px_rgba(251,191,36,0.3)]"
            >
              <Image src={CENTER_DISH} alt="Combo Moro's" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
            </motion.div>
          </motion.div>

          {/* Derecha con wireframe */}
          <motion.div style={{ x: rightX, y: rightY }} className="absolute right-0 sm:right-[4%] top-10 w-36 h-36 sm:w-60 sm:h-60">
            <Steam />
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full h-full rounded-full overflow-hidden border border-cyan-200/40 shadow-[0_0_60px_rgba(103,232,249,0.22)]"
            >
              <Image src={RIGHT_DISH} alt="Mixto BBQ" fill className="object-cover" />
              {/* retícula wireframe */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(103,232,249,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.35) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tl from-cyan-300/10 via-transparent to-white/10" />
            </motion.div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.25em] text-zinc-300 border border-white/20 px-3 py-1 bg-zinc-950/60 backdrop-blur">
              ∟ BBQ ∏
            </span>
          </motion.div>
        </div>

        <p className="mt-4 text-[11px] font-bold tracking-widest uppercase text-zinc-500">
          Mueve el mouse — los platos flotan en 3D
        </p>
        <a href="#menu" className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-amber-400 transition-colors">
          <ArrowDown className="w-4 h-4" />
          Desliza para descubrir el sabor
        </a>
      </div>
    </section>
  );
}
