'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [go, setGo] = useState(false);

  // Las palabras entran cuando termina (o se salta) la intro
  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem('moros-intro-seen');
    } catch {
      // ignorar
    }
    if (seen) {
      setGo(true);
      return;
    }
    const onIntroDone = () => setGo(true);
    window.addEventListener('moros:intro-done', onIntroDone);
    const fallback = setTimeout(() => setGo(true), 7000);
    return () => {
      window.removeEventListener('moros:intro-done', onIntroDone);
      clearTimeout(fallback);
    };
  }, []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 18 });
  const sy = useSpring(my, { stiffness: 55, damping: 18 });

  const titleX = useTransform(sx, (v) => v * 18);
  const titleY = useTransform(sy, (v) => v * 8);

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
      {/* Fondo: fachada del local */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-fachada.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/75 to-zinc-950/95" />
        <div className="absolute inset-0 bg-zinc-950/35" />
      </div>

      {/* Blobs de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600/20 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-20 sm:pt-24 sm:pb-24 text-center">
        <motion.div style={{ x: titleX, y: titleY }}>
          <motion.p
            initial={{ y: -50, opacity: 0 }}
            animate={go ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 12 }}
            className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.3em] uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full"
          >
            🌿 Sabor en movimiento · Tulcán · 17:00 — 23:00
          </motion.p>
          <motion.h1
            initial={{ x: '-60vw', opacity: 0, rotate: -8 }}
            animate={go ? { x: 0, opacity: 1, rotate: 0 } : { x: '-60vw', opacity: 0, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 80, damping: 10, mass: 0.9, delay: 0.15 }}
            className="mt-5 font-black tracking-tight text-white leading-[0.95] text-5xl sm:text-7xl lg:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          >
            Crujiente
          </motion.h1>
          <motion.p
            initial={{ x: '60vw', opacity: 0, rotate: 8 }}
            animate={go ? { x: 0, opacity: 1, rotate: 0 } : { x: '60vw', opacity: 0, rotate: 8 }}
            transition={{ type: 'spring', stiffness: 80, damping: 10, mass: 0.9, delay: 0.4 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight uppercase text-stroke-amber drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          >
            Jugoso
          </motion.p>
          <motion.h1
            initial={{ y: '45vh', opacity: 0, scale: 1.35 }}
            animate={go ? { y: 0, opacity: 1, scale: 1 } : { y: '45vh', opacity: 0, scale: 1.35 }}
            transition={{ type: 'spring', stiffness: 80, damping: 10, mass: 0.9, delay: 0.65 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          >
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Irresistible</span>
          </motion.h1>

          {/* Botón VER MENÚ */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={go ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 110, damping: 13, delay: 0.95 }}
            className="mt-10"
          >
            <Link
              href="#menu"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-zinc-950 font-black text-sm sm:text-base px-9 py-4 rounded-2xl shadow-[0_0_35px_rgba(255,85,0,0.45)] hover:scale-105 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              VER MENÚ
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
