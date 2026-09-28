'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Clock, MapPin, ChevronRight, Star, Award, ShieldCheck, ShoppingBag } from 'lucide-react';
import { RESTAURANT_INFO } from '@/data/menuData';
import { useCart } from '@/context/CartContext';

export default function Hero() {
  const { setIsCartOpen } = useCart();

  return (
    <section className="relative overflow-hidden bg-zinc-950 pt-8 pb-16 lg:py-24 border-b border-zinc-900">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-orange-600/20 to-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 rounded-full px-4 py-1.5 text-xs font-black text-amber-400 backdrop-blur-md">
              <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
              <span>SABOR ECOLÓGICO Y FRESCO EN TULCÁN</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              ¡El Auténtico Sabor de <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent">Moro&apos;s</span>!
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Pollo Broaster crocante, Hamburguesas gigantes Moro's, Papi Completas y jugosas Costillas BBQ. 
              <span className="text-amber-400 font-bold"> ¡Calidad premium, porciones generosas y precios desde $1.25!</span>
            </p>

            {/* Quick Location Badge */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-zinc-400 pt-1">
              <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span>{RESTAURANT_INFO.address}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{RESTAURANT_INFO.schedule}</span>
              </div>
            </div>

            {/* Call To Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="#menu"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(255,85,0,0.4)] hover:scale-105 active:scale-95 transition-all text-base"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>VER MENÚ Y PEDIR</span>
                <ChevronRight className="w-5 h-5" />
              </Link>

              <a
                href={`https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=Hola%20Moro's!%20Deseo%20hacer%20un%20pedido`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 font-bold px-7 py-4 rounded-2xl transition-all text-base"
              >
                <span>📲 Pedir por WhatsApp</span>
              </a>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-900 max-w-xl mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start text-orange-400 mb-1">
                  <Star className="w-4 h-4 fill-orange-400" />
                  <Star className="w-4 h-4 fill-orange-400" />
                  <Star className="w-4 h-4 fill-orange-400" />
                  <Star className="w-4 h-4 fill-orange-400" />
                  <Star className="w-4 h-4 fill-orange-400" />
                </div>
                <p className="text-xs text-zinc-400 font-medium">Favorito de Tulcán</p>
              </div>
              <div className="text-center lg:text-left border-x border-zinc-800 px-2">
                <div className="text-sm font-black text-white">100% Fresco</div>
                <p className="text-xs text-zinc-400 font-medium">Ingredientes del día</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-sm font-black text-amber-400">Rápido Servicio</div>
                <p className="text-xs text-zinc-400 font-medium">Para llevar o mesa</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Card glow container */}
              <div className="relative rounded-3xl p-2 bg-gradient-to-b from-orange-500/40 via-zinc-800/60 to-zinc-900/80 border border-zinc-700/50 shadow-2xl backdrop-blur-xl group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950">
                  <Image
                    src="/images/hero.jpg"
                    alt="Hamburguesa Moro's y Combo Broaster"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                  {/* Floating Price Pill */}
                  <div className="absolute top-4 right-4 bg-zinc-950/90 border border-amber-400/50 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
                    <span className="text-xs text-zinc-400 uppercase font-bold">Desde</span>
                    <span className="text-xl font-black text-amber-400">$1.25</span>
                  </div>

                  {/* Floating Top Dish Tag */}
                  <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/90 border border-zinc-800 backdrop-blur-md p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">Combo Insignia</span>
                      <h3 className="font-extrabold text-white text-base">Hamburguesa Moro's + Papas + Gaseosa</h3>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(true)}
                      className="bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-black px-3.5 py-2 rounded-lg transition-colors"
                    >
                      $3.50
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
