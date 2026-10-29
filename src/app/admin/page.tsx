'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Ticket, LogIn, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StatsPanel from '@/components/admin/StatsPanel';
import ProductsPanel from '@/components/admin/ProductsPanel';
import OrdersPanel from '@/components/admin/OrdersPanel';
import CouponsPanel from '@/components/admin/CouponsPanel';

type Tab = 'resumen' | 'productos' | 'pedidos' | 'cupones';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'productos', label: 'Productos', icon: <Package className="w-4 h-4" /> },
  { id: 'pedidos', label: 'Pedidos', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'cupones', label: 'Cupones', icon: <Ticket className="w-4 h-4" /> },
];

export default function AdminPage() {
  const { user, profile, authLoading, isAdmin, setAuthModalOpen, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('resumen');

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-zinc-400">Verificando sesión…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white">Panel de administración</h1>
          <p className="text-xs text-zinc-400 mt-2">
            Inicia sesión con la cuenta del dueño para administrar productos, pedidos y cupones.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 font-black py-3 rounded-2xl text-sm"
          >
            <LogIn className="w-4 h-4" /> Iniciar sesión
          </button>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mt-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la web
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-zinc-400">Verificando permisos…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white">Acceso restringido</h1>
          <p className="text-xs text-zinc-400 mt-2">
            Esta sección es solo para el administrador de la página. La cuenta{' '}
            <strong className="text-zinc-200">{user.email}</strong> no tiene permisos.
          </p>
          <button
            onClick={signOut}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black py-3 rounded-2xl text-sm"
          >
            <LogIn className="w-4 h-4 rotate-180" /> Cambiar de cuenta
          </button>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mt-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la web
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">Moro&apos;s · Tienda</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Panel de administración</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Sesión: <span className="text-zinc-200 font-bold">{profile?.name || user.email}</span>
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Ver la web
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-4 sm:p-6">
        {tab === 'resumen' && <StatsPanel />}
        {tab === 'productos' && <ProductsPanel />}
        {tab === 'pedidos' && <OrdersPanel />}
        {tab === 'cupones' && <CouponsPanel />}
      </div>

      <p className="text-[11px] text-zinc-600 text-center mt-6">
        Si ves &quot;FORBIDDEN&quot;, esta cuenta no es administradora. Usa la cuenta del dueño o define
        ADMIN_EMAILS en Vercel.
      </p>
    </div>
  );
}
