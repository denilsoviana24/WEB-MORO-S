'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, ChevronRight, ShoppingBag, ArrowDown } from 'lucide-react';
import { RESTAURANT_INFO } from '@/data/menuData';
import { useCart } from '@/context/CartContext';

export default function Hero() {
  const { setIsCartOpen } = useCart();

  return (
    <section className="relative overflow-hidden bg-zinc-950 border-b border-zinc-900">
      {/* Glow editorial fijo, sin parallax */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-orange-600/25 to-amber-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Etiqueta superior */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex items-center justify-between text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-400">
        <span className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Sabor en movimiento · Tulcán
        </span>
        <span className="hidden sm:block text-amber-400/90">17:00 — 23:00 · Todos los días</span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 text-center">
        {/* Titular gigante estático */}
        <h1 className="text-[15vw] sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white uppercase">
          Crujiente
        </h1>
        <div className="relative inline-block">
          <p className="text-[15vw] sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight uppercase text-stroke-amber">
            Jugoso
          </p>
          {/* Plato central ESTÁTICO, sin flotación ni parallax */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative w-44 h-44 sm:w-64 sm:h-64 lg:w-80 lg:h-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/40 to-amber-400/10 blur-2xl" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-amber-400/70 shadow-[0_0_80px_rgba(255,120,0,0.45)]">
                <Image
                  src="/images/hero.jpg"
                  alt="Hamburguesa Moro's"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Etiqueta fija de precio, sin animación */}
              <span className="absolute -bottom-2 left-8 bg-zinc-950/90 border border-amber-400/50 rounded-2xl px-3 py-2 text-xs font-black text-amber-400 shadow-xl">
                DESDE $1.25
              </span>
            </div>
          </div>
        </div>
        <h1 className="text-[15vw] sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight uppercase">
          <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Irresistible</span>
        </h1>

        <p className="mt-8 max-w-2xl mx-auto text-zinc-300 text-sm sm:text-lg leading-relaxed">
          Pollo Broaster crocante, Hamburguesa Moro&apos;s gigante, Papi Completas y Costillas BBQ.
          <span className="text-amber-400 font-bold"> El plato, antes del primer bocado.</span>
        </p>

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

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          {[
            { value: '+32', label: 'platos en carta' },
            { value: '3×', label: 'porciones generosas' },
            { value: '0', label: 'apps por descargar' },
            { value: '<15 min', label: 'preparación al instante' },
          ].map((s) => (
            <div key={s.label} className="border-l border-zinc-800 pl-4">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-zinc-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="mt-6 text-xs font-bold text-zinc-500 hover:text-amber-400 transition-colors inline-flex items-center gap-2"
        >
          <ArrowDown className="w-4 h-4" />
          Desliza para descubrir el sabor
        </button>
      </div>
    </section>
  );
}
