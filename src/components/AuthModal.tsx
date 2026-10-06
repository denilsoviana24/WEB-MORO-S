'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, signIn, signUp, supabaseReady } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const close = () => {
    setAuthModalOpen(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim() || !password) {
      setError('Completa correo y contraseña.');
      return;
    }
    if (tab === 'register' && !name.trim()) {
      setError('Cuéntanos tu nombre para tu tarjeta fiel. 😊');
      return;
    }
    setLoading(true);
    const res = tab === 'login' ? await signIn(email, password) : await signUp(name, email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccess(res.message);
    window.setTimeout(close, 1600);
  };

  const inputCls =
    'w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="relative w-full sm:max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl"
          >
            <div className="p-5 border-b border-zinc-900 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">Club Moro’s</h2>
                  <p className="text-xs text-zinc-400">Guarda tus puntos en tu cuenta ⭐</p>
                </div>
              </div>
              <button
                onClick={close}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-4">
                {(
                  [
                    { id: 'login', label: 'Entrar', icon: LogIn },
                    { id: 'register', label: 'Crear cuenta', icon: UserPlus },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTab(t.id);
                      setError('');
                      setSuccess('');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all ${
                      tab === t.id ? 'bg-orange-600 text-zinc-950' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {!supabaseReady && (
                <p className="mb-3 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                  El login se activará cuando el dueño conecte Supabase. Tus sellos se guardan en este equipo por ahora.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {tab === 'register' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{loading ? 'Un momento…' : tab === 'login' ? 'ENTRAR A MI CUENTA' : 'CREAR MI CUENTA'}</span>
                </button>
              </form>

              <p className="mt-3 text-center text-[11px] text-zinc-500">
                Con tu cuenta, tus sellos y pedidos se guardan aunque cambies de celular. 🍟
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
