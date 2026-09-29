'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SRC = '/images/hero.jpg';
const IMG = 1024;

// Caja de la hamburguesa dentro de hero.jpg (coordenadas de la imagen original)
const BX = 246;
const BY = 388;
const BW = 304;
const BH = 352;

// Tamaño en pantalla del recorte
const W = 340;
const S = W / BW;
const H = Math.round(BH * S);

type Layer = {
  t: number;   // offset vertical dentro de la caja (px de imagen original)
  h: number;   // alto de la tira (px de imagen original)
  label: string;
  dx: number;
  dy: number;
  r: number;
};

const LAYERS: Layer[] = [
  { t: 0, h: 92, label: 'Pan brioche', dx: -80, dy: -240, r: -14 },
  { t: 92, h: 68, label: 'Huevo frito', dx: 180, dy: -130, r: 16 },
  { t: 160, h: 37, label: 'Tocino crocante', dx: -220, dy: -50, r: -22 },
  { t: 197, h: 83, label: 'Doble carne + queso', dx: 200, dy: 70, r: 14 },
  { t: 280, h: 42, label: 'Tomate y lechuga', dx: -190, dy: 160, r: -12 },
  { t: 322, h: 30, label: 'Pan inferior', dx: 90, dy: 260, r: 10 },
];

export default function Intro() {
  const [show, setShow] = useState(false);
  const [boom, setBoom] = useState(false);
  const [bgOut, setBgOut] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('moros-burger-intro')) return;
    } catch {
      // ignorar
    }
    setShow(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const finish = () => {
    setShow(false);
    document.body.style.overflow = '';
    try {
      sessionStorage.setItem('moros-burger-intro', '1');
    } catch {
      // ignorar
    }
  };

  // Secuencia: entra la hamburguesa → explota → aparece el inicio
  useEffect(() => {
    if (!show || boom) return;
    const t1 = setTimeout(() => setBoom(true), 1300);
    const t2 = setTimeout(() => setBgOut(true), 1500);
    const t3 = setTimeout(finish, 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4"
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
          {/* Fondo */}
          <motion.div
            className="absolute inset-0 bg-zinc-950"
            animate={{ opacity: bgOut ? 0 : 1 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
          />

          {/* Resplandor tras la hamburguesa */}
          <motion.div
            animate={{ opacity: bgOut ? 0 : 1, scale: boom ? 1.4 : 1 }}
            transition={{ duration: 0.6 }}
            className="absolute w-[480px] h-[480px] bg-orange-600/25 rounded-full blur-[120px] pointer-events-none"
          />

          {/* Destello del golpe */}
          {boom && (
            <motion.div
              initial={{ opacity: 0.55 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 bg-amber-300/40 pointer-events-none"
            />
          )}

          {/* Hamburguesa real que se arma y explota */}
          <div className="scale-[0.58] sm:scale-75 md:scale-100">
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 210, damping: 15 }}
              className="relative"
              style={{ width: W, height: H }}
            >
              {LAYERS.map((l, i) => (
                <motion.div
                  key={l.label}
                  className="absolute left-0"
                  style={{
                    top: l.t * S,
                    width: W,
                    height: l.h * S,
                    backgroundImage: `url(${SRC})`,
                    backgroundSize: `${IMG * S}px ${IMG * S}px`,
                    backgroundPosition: `${-BX * S}px ${-(BY + l.t) * S}px`,
                  }}
                  animate={
                    boom
                      ? {
                          x: l.dx,
                          y: l.dy,
                          rotate: l.r,
                          opacity: 0,
                          filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.6))',
                        }
                      : {
                          x: 0,
                          y: 0,
                          rotate: 0,
                          opacity: 1,
                          filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))',
                        }
                  }
                  transition={{
                    duration: 0.85,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.035,
                    opacity: { duration: 0.5, delay: boom ? 0.32 + i * 0.035 : 0 },
                  }}
                >
                  <span
                    style={{ opacity: boom ? 1 : 0, transition: 'opacity 0.3s ease 0.28s' }}
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-amber-400 bg-zinc-950/85 border border-amber-400/50 px-2.5 py-1 rounded-full"
                  >
                    {l.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <button
            onClick={finish}
            className="absolute bottom-6 text-xs font-bold text-zinc-500 hover:text-amber-400 transition-colors"
          >
            Saltar intro →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
