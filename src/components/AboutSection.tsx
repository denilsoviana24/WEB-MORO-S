'use client';

import React from 'react';
import Image from 'next/image';
import { Award, ShieldCheck, HeartHandshake, Sparkles, MapPin } from 'lucide-react';
import { RESTAURANT_INFO } from '@/data/menuData';

export default function AboutSection() {
  return (
    <section id="nosotros" className="py-20 bg-zinc-950 border-t border-zinc-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Image Mosaic */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 group">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                  alt="Moro's Comidas Rápidas Restaurante"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
              </div>

              {/* Floating Highlight Card */}
              <div className="absolute bottom-6 left-6 right-6 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm sm:text-base">El Sabor Favorito de Tulcán</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Ubicados estratégicamente cerca de la Casa China en Tulcán.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Principles */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-3.5 py-1 rounded-full text-xs font-black text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>NUESTRA HISTORIA</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Más que Comida Rápida, <span className="text-orange-500">Una Experiencia Inolvidable</span>
            </h2>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              En <strong className="text-white">Moro&apos;s Comidas Rápidas</strong> nacimos con una misión clara: ofrecer a los jóvenes, familias y trabajadores de Tulcán platillos generosos, preparados al instante con el mejor sazón y los precios más justos de la ciudad.
            </p>

            <p className="text-zinc-400 text-sm leading-relaxed">
              Desde nuestro icónico <strong className="text-amber-400">Pollo Broaster super crocante</strong> hasta nuestras <strong className="text-amber-400">Papi Completas y Costillas BBQ</strong>, cada receta está diseñada para satisfacer el paladar más exigente con rapidez y frescura garantizada.
            </p>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-white text-xs sm:text-sm">Frescura Diaria</h4>
                  <p className="text-zinc-400 text-[11px] mt-1">Ingredientes seleccionados día a día.</p>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-white text-xs sm:text-sm">Atención Amigable</h4>
                  <p className="text-zinc-400 text-[11px] mt-1">Servicio cálido y preparado con esmero.</p>
                </div>
              </div>
            </div>

            {/* Location Tag */}
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span>{RESTAURANT_INFO.address}, Tulcán, Ecuador</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
