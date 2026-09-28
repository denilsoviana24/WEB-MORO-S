'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Flame, ChevronRight, ShoppingBag, ArrowDown } from 'lucide-react';
import { RESTAURANT_INFO } from '@/data/menuData';
import { useCart } from '@/context/CartContext';

export default function Hero() {
  const { setIsCartOpen } = useCart();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Parallax tipo BanhMi: el plato baja, los titulares se abren
  const dishY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const wordLeftX = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const wordRightX = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-zinc-950 border-b border-zinc-900">
      {/* Glow editorial estilo FloatMenu */}
      <motion.div style={{ opacity: glowOpacity }} className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-orange-600/25 to-amber-500/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] bg-orange-600/10 rounded-full blur-[110px]" />
      </motion.div>

      {/* Etiqueta superior estilo FloatMenu */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex items-center justify-between text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-400">
        <span className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
          Sabor en movimiento · Tulcán
        </span>
        <span className="hidden sm:block text-amber-400/90">17:00 — 23:00 · Todos los días</span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 text-center">
        {/* Titular gigante estilo BanhMi */}
        <motion.h1 style={{ x: wordLeftX }} className="text-[15vw] sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white uppercase">
          Crujiente
        </motion.h1>
        <div className="relative inline-block">
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="text-[15vw] sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight uppercase text-stroke-amber"
          >
            Jugoso
          </motion.p>
          {/* Plato flotante central */}
          <motion.div
            style={{ y: dishY }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-44 h-44 sm:w-64 sm:h-64 lg:w-80 lg:h-80"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/40 to-amber-400/10 blur-2xl" />
              <div className="animate-float relative w-full h-full rounded-full overflow-hidden border-4 border-amber-400/70 shadow-[0_0_80px_rgba(255,120,0,0.45)]">
                <Image
                  src="/images/hero.jpg"
                  alt="Hamburguesa Moro's"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Ingredientes flotantes */}
              <span style={{ ['--float-rot' as string]: '-12deg' }} className="animate-float absolute -left-6 top-6 bg-zinc-950/90 border border-zinc-700 rounded-2xl px-3 py-2 text-2xl shadow-xl">🍗</span>
              <span style={{ ['--float-rot' as string]: '10deg' }} className="animate-float-delayed absolute -right-4 top-1/3 bg-zinc-950/90 border border-zinc-700 rounded-2xl px-3 py-2 text-2xl shadow-xl">🍟</span>
              <span style={{ ['--float-rot' as string]: '6deg' }} className="animate-float absolute -bottom-2 left-8 bg-zinc-950/90 border border-amber-400/50 rounded-2xl px-3 py-2 text-xs font-black text-amber-400 shadow-xl">DESDE $1.25</span>
              {/* Sello giratorio */}
              <div className="animate-spin-slower absolute -top-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 text-zinc-950 flex items-center justify-center text-center text-[10px] font-black leading-tight shadow-xl">
                ★ SABOR<br />MORO&apos;S ★
              </div>
            </motion.div>
          </motion.div>
        </div>
        <motion.h1 style={{ x: wordRightX }} className="text-[15vw] sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight uppercase">
          <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Irresistible</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-8 max-w-2xl mx-auto text-zinc-300 text-sm sm:text-lg leading-relaxed"
        >
          Pollo Broaster crocante, Hamburguesa Moro&apos;s gigante, Papi Completas y Costillas BBQ.
          <span className="text-amber-400 font-bold"> El plato, antes del primer bocado.</span>
        </motion.p>

        {/* CTAs */}
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

        {/* Stats estilo FloatMenu */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          {[
            { value: '+32', label: 'platos en carta' },
            { value: '3×', label: 'porciones generosas' },
            { value: '0', label: 'apps por descargar' },
            { value: '<15 min', label: 'preparación al instante' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-l border-zinc-800 pl-4"
            >
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-zinc-400 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="mt-6 text-xs font-bold text-zinc-500 hover:text-amber-400 transition-colors inline-flex items-center gap-2"
        >
          <ArrowDown className="w-4 h-4 animate-bounce" />
          Desliza para descubrir el sabor
        </button>
      </div>
    </section>
  );
}
