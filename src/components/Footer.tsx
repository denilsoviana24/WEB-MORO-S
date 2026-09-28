'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle, Heart } from 'lucide-react';
import { RESTAURANT_INFO } from '@/data/menuData';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-900">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 bg-zinc-900">
                <Image
                  src="/logo-moros.png"
                  alt="Moro's Comidas Rápidas Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl text-white tracking-wide">
                  MORO&apos;S
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Comidas Rápidas
                </span>
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-zinc-400">
              El rincón gastronómico más popular de Tulcán. Pollo broaster, hamburguesas especiales, papi mixtas y costillas BBQ preparadas al momento.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {RESTAURANT_INFO.whatsappNumbers.map((num) => (
                <a
                  key={num}
                  href={`https://wa.me/593${num.substring(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-zinc-900 border border-zinc-800 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-bold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{num}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/#menu" className="hover:text-orange-400 transition-colors">
                  Menú Completo (Broaster, Burguers, BBQ)
                </Link>
              </li>
              <li>
                <Link href="/#promos" className="hover:text-orange-400 transition-colors text-amber-400">
                  Promociones Activas
                </Link>
              </li>
              <li>
                <Link href="/#nosotros" className="hover:text-orange-400 transition-colors">
                  Sobre Moro's
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="hover:text-orange-400 transition-colors">
                  Ubicación y Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-4">
              Visítanos
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>{RESTAURANT_INFO.address}, Tulcán, Ecuador</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{RESTAURANT_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{RESTAURANT_INFO.email}</span>
              </li>
            </ul>
          </div>

          {/* Hours Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock className="w-5 h-5" />
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">
                Horario de Atención
              </h4>
            </div>
            <p className="text-xs text-zinc-300 font-bold">
              {RESTAURANT_INFO.schedule}
            </p>
            <p className="text-[11px] text-zinc-500">
              Servicio de mesa, para llevar y entregas a domicilio en Tulcán.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} Moro&apos;s Comidas Rápidas - Tulcán, Ecuador. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1">
            <span>Creado con</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>para Moro&apos;s</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
