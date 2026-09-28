'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingItem {
  id: number;
  image: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

let flyId = 0;

function getCartTarget(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const el = document.getElementById('cart-button');
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth - 60, y: 60 };
}

export default function FlyToCart() {
  const [items, setItems] = useState<FlyingItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        image: string;
        fromX: number;
        fromY: number;
      };
      const target = getCartTarget();
      const id = ++flyId;
      setItems((prev) => [...prev, { id, image: detail.image, fromX: detail.fromX, fromY: detail.fromY, toX: target.x, toY: target.y }]);
      // Limpiar después de la animación
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 900);
    };
    window.addEventListener('moros:fly-to-cart', handler);
    return () => window.removeEventListener('moros:fly-to-cart', handler);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[150]">
      <AnimatePresence>
        {items.map((item) => {
          const dx = item.toX - item.fromX;
          const dy = item.toY - item.fromY;
          return (
            <motion.div
              key={item.id}
              initial={{ x: item.fromX - 32, y: item.fromY - 32, scale: 1, opacity: 1, rotate: 0, filter: 'blur(0px)' }}
              animate={{
                x: [item.fromX - 32, item.fromX - 32 + dx * 0.5, item.toX - 16],
                y: [item.fromY - 32, item.fromY - 32 + dy * 0.5 - 90, item.toY - 16],
                scale: [1, 0.7, 0.15],
                opacity: [1, 1, 0.2],
                rotate: [0, 20, 40],
                filter: ['blur(0px)', 'blur(1px)', 'blur(6px)'],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                className="h-16 w-16 rounded-full border-2 border-amber-400 object-cover shadow-[0_0_25px_rgba(255,150,0,0.6)]"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
