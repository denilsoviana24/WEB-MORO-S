'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function BurgerCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 400, damping: 35, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 400, damping: 35, mass: 0.6 });
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Solo en PC con mouse real, no en celular
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const t = e.target as HTMLElement | null;
      setHovering(!!t?.closest?.('a, button, input, textarea, select, [role="button"]'));
    };
    const leave = () => setVisible(false);

    window.addEventListener('mousemove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[200]"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
    >
      <motion.div
        animate={{
          scale: hovering ? 1.6 : 1,
          rotate: hovering ? -12 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
      >
        🍔
      </motion.div>
    </motion.div>
  );
}
