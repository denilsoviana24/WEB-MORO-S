'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Smile, UtensilsCrossed, ConciergeBell, Truck, Send, MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import Reveal from './Reveal';
import { Review, getReviews, submitReview } from '@/lib/supabaseClient';

const KEYS = ['atencion', 'producto', 'servicio', 'entrega'] as const;
type Key = (typeof KEYS)[number];

const LABELS: { key: Key; label: string; icon: React.ReactNode }[] = [
  { key: 'atencion', label: 'Atención', icon: <Smile className="w-4 h-4 text-amber-400" /> },
  { key: 'producto', label: 'Producto', icon: <UtensilsCrossed className="w-4 h-4 text-orange-400" /> },
  { key: 'servicio', label: 'Servicio', icon: <ConciergeBell className="w-4 h-4 text-amber-400" /> },
  { key: 'entrega', label: 'Entrega a domicilio', icon: <Truck className="w-4 h-4 text-emerald-400" /> },
];

const LOCAL_KEY = 'moros-resenas';

function loadLocal(): Review[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as Review[];
  } catch {
    return [];
  }
}

function StarInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: React.ReactNode;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-800/70 last:border-0">
      <span className="text-sm font-bold text-zinc-200">{label}</span>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onFocus={() => setHover(s)}
            onBlur={() => setHover(0)}
            aria-label={`${label}: ${s} estrellas`}
            className="transition-transform hover:scale-125 focus:outline-none"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                s <= shown ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniStars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
      ))}
    </span>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratings, setRatings] = useState<Record<Key, number>>({
    atencion: 0,
    producto: 0,
    servicio: 0,
    entrega: 0,
  });
  const [nombre, setNombre] = useState('');
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const remote = await getReviews();
      if (!alive) return;
      if (remote.length > 0) {
        setReviews(remote);
      } else {
        setReviews(loadLocal());
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const averages = useMemo(() => {
    const total = reviews.length;
    const avg: Record<Key, number> = { atencion: 0, producto: 0, servicio: 0, entrega: 0 };
    if (total === 0) return { total, avg, global: 0 };
    KEYS.forEach((k) => {
      avg[k] = reviews.reduce((sum, r) => sum + (Number(r[k]) || 0), 0) / total;
    });
    const global = KEYS.reduce((s, k) => s + avg[k], 0) / KEYS.length;
    return { total, avg, global };
  }, [reviews]);

  const allRated = KEYS.every((k) => ratings[k] > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allRated) {
      setError('Califica las 4 categorías con estrellas para enviar.');
      return;
    }
    setSending(true);
    const payload: Omit<Review, 'id' | 'created_at'> = {
      nombre: nombre.trim() || 'Cliente',
      ...ratings,
      comentario: comentario.trim(),
    };
    const ok = await submitReview(payload);
    const newReview: Review = {
      ...payload,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    if (!ok) {
      const local = [newReview, ...loadLocal()].slice(0, 50);
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
      } catch {
        // ignorar
      }
    }
    setReviews((prev) => [newReview, ...prev]);
    setRatings({ atencion: 0, producto: 0, servicio: 0, entrega: 0 });
    setNombre('');
    setComentario('');
    setSending(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <section id="resenas" className="py-16 bg-zinc-950 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <Reveal className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400">04 — Opiniones de clientes</p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-1 rounded-full text-xs font-black text-amber-400">
            <MessageSquareHeart className="w-4 h-4 text-orange-500" />
            <span>CALIFICA TU EXPERIENCIA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Tu Opinión <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Nos Hace Mejorar</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Califica la atención, el producto, el servicio y la entrega a domicilio. Tus estrellas se promedian con las de otros clientes.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Formulario de calificación */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm"
          >
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Deja tu calificación
            </h3>

            <div className="mt-4">
              {LABELS.map((l) => (
                <StarInput
                  key={l.key}
                  label={
                    <span className="flex items-center gap-2">
                      {l.icon}
                      {l.label}
                    </span>
                  }
                  value={ratings[l.key]}
                  onChange={(v) => setRatings((r) => ({ ...r, [l.key]: v }))}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Cuéntanos cómo te fue (opcional)"
                rows={1}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>

            {error && <p className="mt-3 text-xs font-bold text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-zinc-950 font-black text-sm px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(255,85,0,0.35)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando…' : 'ENVIAR CALIFICACIÓN'}
            </button>

            <AnimatePresence>
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center justify-center gap-2 text-xs font-black text-emerald-400"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Gracias! Tu calificación fue registrada.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Resultados */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Promedio general</p>
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-5xl font-black text-white tabular-nums">
                    {averages.global.toFixed(1)}
                  </span>
                  <span className="mb-2 text-xs font-bold text-zinc-500">/ 5</span>
                </div>
                <MiniStars value={averages.global} />
                <p className="mt-1 text-[11px] font-bold text-zinc-500">
                  {averages.total} {averages.total === 1 ? 'calificación' : 'calificaciones'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {LABELS.map((l) => (
                <div key={l.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    {l.icon}
                    {l.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-32 h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                        style={{ width: `${(averages.avg[l.key] / 5) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-black text-amber-400 tabular-nums">
                      {averages.avg[l.key].toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-800">
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">
                Últimas opiniones
              </p>
              {reviews.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Sé el primero en calificar nuestra atención, producto, servicio y entrega. ✨
                </p>
              ) : (
                <ul className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                  {reviews.slice(0, 10).map((r) => {
                    const global =
                      KEYS.reduce((s, k) => s + (Number(r[k]) || 0), 0) / KEYS.length;
                    return (
                      <li key={r.id} className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-white truncate">
                            {r.nombre || 'Cliente'}
                          </span>
                          <MiniStars value={global} />
                        </div>
                        {r.comentario && (
                          <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{r.comentario}</p>
                        )}
                        <p className="mt-1.5 text-[10px] font-bold text-zinc-600">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString('es-EC', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
