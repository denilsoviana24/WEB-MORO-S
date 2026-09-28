'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LETTERS = ['M', 'O', 'R', 'O', '’', 'S'];

export default function Intro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mostrar solo una vez por sesión
    try {
      if (sessionStorage.getItem('moros-intro-seen')) return;
    } catch {
      // sessionStorage no disponible, mostrar igual
    }
    setShow(true);
    // Bloquear scroll durante la intro
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      setShow(false);
      document.body.style.overflow = '';
      try {
        sessionStorage.setItem('moros-intro-seen', '1');
      } catch {
        // ignorar
      }
    }, 3200);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, []);

  const skip = () => {
    setShow(false);
    document.body.style.overflow = '';
    try {
      sessionStorage.setItem('moros-intro-seen', '1');
    } catch {
      // ignorar
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden"
          exit={{ y: '-100%', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
        >
          {/* Glow de fondo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />

          {/* Hamburguesa corriendo de izquierda al centro */}
          <motion.div
            initial={{ x: '-60vw', rotate: -10 }}
            animate={{ x: 0, rotate: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-7xl sm:text-8xl"
          >
            <motion.span
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 0.35, repeat: 4, ease: 'easeInOut' }}
              className="block"
            >
              🍔
            </motion.span>
            {/* Humo de velocidad */}
            <motion.span
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: [0, 1, 0], x: -60 }}
              transition={{ duration: 1.1 }}
              className="absolute top-1/2 -left-10 text-3xl"
            >
              💨
            </motion.span>
          </motion.div>

          {/* Letras MORO'S apareciendo una por una */}
          <div className="relative z-10 mt-4 flex items-end gap-1">
            {LETTERS.map((l, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                transition={{ delay: 1.1 + i * 0.12, duration: 0.5, type: 'spring', bounce: 0.5 }}
                className="text-5xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent"
              >
                {l}
              </motion.span>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.5 }}
            className="relative z-10 mt-2 text-xs sm:text-sm font-bold tracking-[0.35em] uppercase text-zinc-400"
          >
            Comidas Rápidas · Tulcán
          </motion.p>

          {/* Barra de carga */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.1, duration: 1.6, ease: 'easeInOut' }}
            className="relative z-10 mt-8 h-1 w-48 origin-left rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
          />

          <button
            onClick={skip}
            className="absolute bottom-6 text-xs font-bold text-zinc-500 hover:text-amber-400 transition-colors"
          >
            Saltar intro →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
