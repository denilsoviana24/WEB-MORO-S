'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, MENU_ITEMS, MenuItem } from '@/data/menuData';

type Props = {
  openId: string | null;
  onSelect: (id: string) => void;
  onOpenProduct: (item: MenuItem, catId: string) => void;
};

export default function MenuGalaxy({ openId, onSelect, onOpenProduct }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const groups = useMemo(
    () =>
      CATEGORIES.filter((c) => c.id !== 'todos')
        .map((cat) => ({
          cat,
          items: MENU_ITEMS.filter((m) => m.category === cat.id),
        }))
        .filter((g) => g.items.length > 0),
    []
  );

  const n = groups.length;

  // Posición de cada categoría en la órbita (% del contenedor)
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: 50 + 33 * Math.cos(a), y: 50 + 33 * Math.sin(a), a };
  };

  // Estrellas de fondo (deterministas)
  const bgStars = useMemo(
    () =>
      Array.from({ length: 150 }, (_, i) => {
        const a = ((i * 137.508) % 360) * (Math.PI / 180);
        const r = 3 + ((i * 29) % 47);
        const big = i % 11 === 0;
        return {
          left: `${50 + r * Math.cos(a)}%`,
          top: `${50 + r * Math.sin(a)}%`,
          size: big ? 3 + ((i * 7) % 3) : 1 + ((i * 7) % 2),
          dur: 1.6 + ((i * 13) % 30) / 10,
          delay: ((i * 17) % 40) / 10,
          glow: big,
        };
      }),
    []
  );

  // Estrellas-producto alrededor de una categoría
  const itemOffset = (gi: number, j: number, m: number) => {
    const { a } = pos(gi);
    const spread = Math.min(150, 55 * (m - 1) + 50);
    const step = m > 1 ? spread / (m - 1) : 0;
    const deg = -spread / 2 + j * step;
    const rad = 56;
    const ang = a + (deg * Math.PI) / 180;
    return { dx: Math.cos(ang) * rad, dy: Math.sin(ang) * rad };
  };

  const reveal = () => setRevealed(true);

  return (
    <div
      onMouseEnter={reveal}
      onTouchStart={reveal}
      onClick={reveal}
      className="relative mx-auto mb-8 h-[520px] sm:h-[660px] lg:h-[760px] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#020103] cursor-pointer"
    >
      {/* Halo central de la galaxia */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(255,170,60,0.28), rgba(255,100,20,0.12) 45%, transparent 75%)',
        }}
      />

      {/* Disco galáctico inclinado */}
      <div
        className="absolute left-1/2 top-1/2 w-[135%] h-[52%] rounded-[50%] blur-2xl opacity-70 pointer-events-none"
        style={{
          transform: 'translate(-50%, -50%) rotate(-14deg)',
          background:
            'radial-gradient(ellipse at center, rgba(255,200,90,0.35), rgba(255,110,20,0.18) 40%, transparent 70%)',
        }}
      />

      {/* Brazos espirales girando */}
      <div className="absolute inset-0 animate-spin pointer-events-none" style={{ animationDuration: '90s' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-[150%] h-[46%] rounded-[50%] blur-3xl"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 60 + 15}deg)`,
              background: `radial-gradient(ellipse at 28% 50%, rgba(255,150,40,${i === 0 ? 0.4 : 0.26}), transparent 55%), radial-gradient(ellipse at 74% 50%, rgba(255,80,20,${i === 1 ? 0.36 : 0.22}), transparent 55%)`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 animate-spin pointer-events-none" style={{ animationDuration: '140s', animationDirection: 'reverse' }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-[125%] h-[36%] rounded-[50%] blur-3xl opacity-80"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 90 + 55}deg)`,
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(255,220,120,0.3), transparent 60%)',
            }}
          />
        ))}
      </div>

      {/* Estrellas de fondo */}
      {bgStars.map((s, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-white animate-pulse pointer-events-none ${
            s.glow ? 'shadow-[0_0_10px_2px_rgba(255,220,150,0.8)]' : ''
          }`}
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Órbitas + nodos de categoría */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {groups.map((g, i) => {
          const p = pos(i);
          const active = openId === g.cat.id;
          return (
            <line
              key={g.cat.id}
              x1={50}
              y1={50}
              x2={p.x}
              y2={p.y}
              stroke={active ? 'rgba(251,191,36,0.75)' : 'rgba(255,255,255,0.14)'}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="4 6"
              style={{
                opacity: revealed ? 1 : 0,
                transition: `opacity 0.6s ease ${0.15 + i * 0.07}s`,
              }}
            />
          );
        })}
      </svg>

      {/* Núcleo central: Hamburguesa completa Moro's (clic = expandir productos) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-72 sm:h-72 rounded-full blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,190,80,0.55), transparent 65%)' }}
        />
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            reveal();
            setExpandAll((v) => !v);
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          whileTap={{ scale: 0.9 }}
          title={expandAll ? 'Contraer productos' : 'Toca para ver todos los productos'}
          aria-label="Hamburguesa Moro's: mostrar todos los productos"
          className="relative block w-28 h-28 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-amber-300/80 shadow-[0_0_100px_30px_rgba(255,150,40,0.55)] focus:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=70"
            alt="Hamburguesa completa Moro's"
            className="w-full h-full object-cover"
          />
        </motion.button>
        <p className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-400/40 bg-zinc-950/90 px-3 py-1 text-[10px] font-black text-amber-300 pointer-events-none">
          🍔 Tócame: {expandAll ? 'ocultar productos' : 'ver todos los productos'}
        </p>
      </div>

      {/* Nodos: categorías como estrellas */}
      {groups.map((g, i) => {
        const p = pos(i);
        const active = openId === g.cat.id;
        const showItems = revealed && (expandAll || hoverId === g.cat.id || active);
        return (
          <motion.div
            key={g.cat.id}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.2 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.15 + i * 0.07 }}
            className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onMouseEnter={() => setHoverId(g.cat.id)}
            onMouseLeave={() => setHoverId((h) => (h === g.cat.id ? null : h))}
          >
            {/* Estrella de categoría */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(g.cat.id);
              }}
              onFocus={() => setHoverId(g.cat.id)}
              onBlur={() => setHoverId((h) => (h === g.cat.id ? null : h))}
              aria-label={`Categoría ${g.cat.name}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center focus:outline-none"
            >
              {/* halo */}
              <span
                className={`absolute w-10 h-10 rounded-full blur-md transition-all ${
                  active ? 'bg-amber-400/70 scale-125' : 'bg-orange-500/40 group-hover:scale-125'
                }`}
              />
              {/* punto */}
              <span
                className={`relative block w-3.5 h-3.5 rounded-full transition-all ${
                  active
                    ? 'bg-amber-300 shadow-[0_0_18px_4px_rgba(251,191,36,0.8)] scale-125'
                    : 'bg-white shadow-[0_0_12px_2px_rgba(255,180,60,0.6)] group-hover:bg-amber-300'
                }`}
              />
              {/* etiqueta */}
              <span
                className={`mt-3 flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black backdrop-blur-sm transition-colors ${
                  active
                    ? 'bg-orange-500 text-zinc-950 border-amber-300'
                    : 'bg-zinc-950/85 text-zinc-200 border-zinc-700 group-hover:border-amber-400 group-hover:text-amber-300'
                }`}
              >
                <span>{g.cat.icon}</span>
                <span>{g.cat.name}</span>
                <span className="text-[9px] px-1 rounded-full bg-zinc-900 text-amber-400">{g.items.length}</span>
              </span>
            </button>

            {/* Constelación: productos como estrellas */}
            <AnimatePresence>
              {showItems &&
                g.items.map((item, j) => {
                  const off = itemOffset(i, j, g.items.length);
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{ opacity: 1, scale: 1, x: off.dx, y: off.dy }}
                      exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 220,
                        damping: 16,
                        delay: j * 0.06,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProduct(item, g.cat.id);
                      }}
                      title={`${item.name} · ver en el menú`}
                      className="group/star absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    >
                      <span className="block w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400/70 shadow-[0_0_16px_rgba(255,170,40,0.55)] transition-transform group-hover/star:scale-125 bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || '/images/hero.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </span>
                      <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 opacity-0 group-hover/star:opacity-100 transition-opacity whitespace-nowrap rounded-full border border-amber-400/40 bg-zinc-950/95 px-2 py-0.5 text-[9px] font-black text-amber-300">
                        {item.name} · ${item.price}
                      </span>
                    </motion.button>
                  );
                })}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Pista inicial */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            exit={{ opacity: 0 }}
            className="absolute left-1/2 bottom-6 -translate-x-1/2 rounded-full border border-amber-500/30 bg-zinc-950/80 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-amber-400 backdrop-blur-sm"
          >
            ✨ Pasa el mouse por la galaxia
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
