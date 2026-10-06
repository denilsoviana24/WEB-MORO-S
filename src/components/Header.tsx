'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Phone, Menu, X, Clock, MapPin, MessageCircle, User, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { RESTAURANT_INFO } from '@/data/menuData';
import Logo from '@/components/Logo';

export default function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, profile, signOut, setAuthModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(true);

  useEffect(() => {
    const checkOpenStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      // Open between 17:00 and 23:00
      setIsOpenNow(currentHour >= RESTAURANT_INFO.openHour && currentHour < RESTAURANT_INFO.closeHour);
    };
    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 transition-all shadow-xl">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-zinc-950 text-xs font-bold py-1.5 px-4 text-center flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <MapPin className="w-3.5 h-3.5" />
          <span>{RESTAURANT_INFO.address}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{RESTAURANT_INFO.schedule}</span>
          </div>
          <a
            href={`tel:${RESTAURANT_INFO.whatsappNumbers[0]}`}
            className="flex items-center gap-1 hover:underline font-black"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{RESTAURANT_INFO.phone}</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500/80 shadow-[0_0_15px_rgba(255,85,0,0.4)] group-hover:scale-105 transition-transform bg-zinc-900">
            <Logo className="h-12 w-12" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl sm:text-2xl text-white tracking-wide group-hover:text-orange-400 transition-colors">
              MORO&apos;S
            </span>
            <span className="text-xs font-medium text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
              <span>Comidas Rápidas</span>
              <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            </span>
          </div>
        </Link>

        {/* Status Badge Desktop */}
        <div className="hidden lg:flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full py-1.5 px-3.5 text-xs font-semibold">
          <span className={`w-2.5 h-2.5 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`}></span>
          <span className={isOpenNow ? 'text-emerald-400' : 'text-zinc-400'}>
            {isOpenNow ? '¡ABIERTO AHORA! (17:00 - 23:00)' : 'CERRADO (Abre 17:00)'}
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 font-medium text-sm text-zinc-300">
          <Link href="/" className="hover:text-orange-400 transition-colors">
            Inicio
          </Link>
          <Link href="/#menu" className="hover:text-orange-400 transition-colors">
            Menú
          </Link>
          <Link href="/#promos" className="hover:text-orange-400 transition-colors flex items-center gap-1 text-amber-400">
            <span>🔥</span> Promociones
          </Link>
          <Link href="/promociones#club-moros" className="hover:text-orange-400 transition-colors flex items-center gap-1">
            <span>⭐</span> Club Moro&apos;s
          </Link>
          <Link href="/#nosotros" className="hover:text-orange-400 transition-colors">
            Nosotros
          </Link>
          <Link href="/#contacto" className="hover:text-orange-400 transition-colors">
            Contacto
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Cuenta / Login */}
          <div className="relative">
            <button
              onClick={() => (user ? setAccountOpen((v) => !v) : setAuthModalOpen(true))}
              className={`h-10 rounded-xl bg-zinc-900 border hover:border-orange-500 font-black flex items-center justify-center transition-all ${
                user ? 'border-emerald-500/50 px-2.5 gap-2' : 'w-10 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              aria-label={user ? 'Mi cuenta' : 'Entrar a mi cuenta'}
              title={user ? `Ingresado como @${profile?.name || ''}` : 'Entrar / Crear cuenta'}
            >
              {user ? (
                <>
                  <span className="relative w-7 h-7 shrink-0 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-950 text-sm flex items-center justify-center">
                    {((profile?.name || user.email || 'M')[0] || 'M').toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                  </span>
                  <span className="text-xs font-black text-white max-w-[110px] truncate">
                    @{(profile?.name || (user.email || '').split('@')[0] || 'cliente').toLowerCase()}
                  </span>
                </>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {user && accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="min-w-0">
                  <p className="font-black text-white text-sm truncate">@{profile?.name || 'cliente'}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                </div>
                <div className="bg-zinc-950 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400">Mis sellos 🍟</span>
                  <span className="text-sm font-black text-amber-400">{profile?.stamps ?? 0}/20</span>
                </div>
                <Link
                  href="/promociones#club-moros"
                  onClick={() => setAccountOpen(false)}
                  className="block text-center text-xs font-black bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-xl transition-colors"
                >
                  Ver mi tarjeta fiel
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    setAccountOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-400 py-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp Direct Quick Action */}
          <a
            href={`https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=Hola%20Moro's!%20Quiero%20hacer%20un%20pedido`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          {/* Cart Trigger Pill Button */}
          <button
            id="cart-button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-zinc-950 font-black px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:scale-105 active:scale-95 transition-all"
            aria-label="Ver Pedido"
          >
            <ShoppingBag className="w-5 h-5 text-zinc-950" />
            <span className="hidden sm:inline">Mi Pedido</span>
            {totalItems > 0 && (
              <span className="bg-zinc-950 text-orange-400 text-xs font-black rounded-full h-5 w-5 flex items-center justify-center border border-amber-400/50">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            aria-label="Abrir Menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950/95 border-b border-zinc-800 px-4 pt-4 pb-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estado del local</span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${isOpenNow ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400'}`}>
              {isOpenNow ? 'ABIERTO AHORA' : 'CERRADO (Abre 17:00)'}
            </span>
          </div>
          <nav className="flex flex-col gap-3 font-semibold text-zinc-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-900 hover:text-orange-400"
            >
              Inicio
            </Link>
            <Link
              href="/#menu"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-900 hover:text-orange-400"
            >
              Menú Completo
            </Link>
            <Link
              href="/#promos"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-900 text-amber-400 flex items-center justify-between"
            >
              <span>Promociones Especiales</span>
              <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-300">🔥 Descuentos</span>
            </Link>
            <Link
              href="/promociones#club-moros"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-900 hover:text-orange-400"
            >
              ⭐ Club Moro&apos;s (Clientes Fieles)
            </Link>
            <Link
              href="/#nosotros"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-900 hover:text-orange-400"
            >
              Sobre Moro's
            </Link>
            <Link
              href="/#contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-900 hover:text-orange-400"
            >
              Ubicación y Contacto
            </Link>
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=Hola%20Moro's!%20Quiero%20hacer%20un%20pedido`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 text-sm shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Pedir por WhatsApp (0961290493)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
