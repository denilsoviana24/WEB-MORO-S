'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LETTERS = ['M', 'O', 'R', 'O', '’', 'S'];

export default function Intro() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eatenCount, setEatenCount] = useState(0);
  const [chomp, setChomp] = useState(false);

  const eating = progress >= 100;

  useEffect(() => {
    try {
      if (sessionStorage.getItem('moros-intro-seen')) return;
    } catch {
      // ignorar
    }
    setShow(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Carga 0 → 100
  useEffect(() => {
    if (!show || progress >= 100) return;
    const t = setTimeout(() => {
      setProgress((p) => Math.min(100, p + Math.floor(Math.random() * 9) + 4));
    }, 110);
    return () => clearTimeout(t);
  }, [show, progress]);

  // La hamburguesa se come las letras una por una (de derecha a izquierda)
  useEffect(() => {
    if (!show || !eating || eatenCount >= LETTERS.length) return;
    setChomp(true);
    const t = setTimeout(() => {
      setEatenCount((c) => c + 1);
      setChomp(false);
    }, 320);
    return () => clearTimeout(t);
  }, [show, eating, eatenCount]);

  // Salir cuando termina de comer
  useEffect(() => {
    if (!show || eatenCount < LETTERS.length) return;
    const t = setTimeout(() => {
      setShow(false);
      document.body.style.overflow = '';
      try {
        sessionStorage.setItem('moros-intro-seen', '1');
      } catch {
        // ignorar
      }
    }, 700);
    return () => clearTimeout(t);
  }, [show, eatenCount]);

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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden px-4"
          exit={{ y: '-100%', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />

          {/* Hamburguesa gigante */}
          <motion.div
            animate={
              eating
                ? { x: [0, -8, 8, 0], scale: chomp ? [1, 1.25, 0.95, 1.1] : 1 }
                : { y: [0, -12, 0] }
            }
            transition={eating ? { duration: 0.32 } : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 text-8xl sm:text-9xl leading-none"
          >
            🍔
            {eating && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-2 -right-6 text-3xl"
              >
                😋
              </motion.span>
            )}
          </motion.div>

          {/* Porcentaje de carga */}
          {!eating ? (
            <div className="relative z-10 mt-6 text-center">
              <p className="text-5xl font-black text-white tabular-nums">{progress}%</p>
              <p className="mt-1 text-[11px] font-bold tracking-[0.35em] uppercase text-zinc-400">
                Cargando sabor…
              </p>
              <div className="mt-4 h-2 w-56 mx-auto rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="relative z-10 mt-6 text-center">
              {/* Letras que van siendo comidas */}
              <div className="flex items-end justify-center gap-1 min-h-[4rem]">
                {LETTERS.map((l, i) => {
                  const eaten = i >= LETTERS.length - eatenCount;
                  return (
                    <AnimatePresence key={i} mode="popLayout">
                      {!eaten && (
                        <motion.span
                          exit={{ scale: 0, y: -30, opacity: 0, rotate: 20 }}
                          transition={{ duration: 0.25 }}
                          className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent"
                        >
                          {l}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  );
                })}
                {eatenCount >= LETTERS.length && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-5xl sm:text-6xl font-black text-amber-400"
                  >
                    ¡Ñam! 😋
                  </motion.span>
                )}
              </div>
              <p className="mt-2 text-[11px] font-bold tracking-[0.35em] uppercase text-zinc-400">
                La hamburguesa se comió a Moro&apos;s
              </p>
            </div>
          )}

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
