'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Acceso rápido al panel. Solo se dibuja para la cuenta del dueño
 * (profiles.is_admin = true). Un cliente normal nunca lo ve.
 */
export default function AdminShortcut() {
  const { isAdmin } = useAuth();
  const pathname = usePathname();

  if (!isAdmin || pathname?.startsWith('/admin')) return null;

  return (
    <Link
      href="/admin"
      title="Panel de administración"
      className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full border border-amber-500/40 bg-zinc-950/90 px-3.5 py-2.5 text-xs font-black text-amber-400 shadow-lg shadow-black/40 backdrop-blur transition-colors hover:bg-amber-500 hover:text-zinc-950"
    >
      <LayoutDashboard className="h-4 w-4" />
      <span className="hidden sm:inline">Panel</span>
    </Link>
  );
}
