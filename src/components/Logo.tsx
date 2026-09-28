'use client';

import React, { useState } from 'react';

// Rutas del logo real (el usuario debe guardar su imagen como public/logo-moros.png)
const CANDIDATES = ['/logo-moros.png', '/logo-moros.jpg', '/logo.png', '/logo.jpg'];

function BadgeFallback() {
  return (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <circle cx="32" cy="32" r="29" fill="#0c0a09" stroke="#F04E23" strokeWidth="3" />
        <path d="M14 22 Q32 10 50 22" stroke="#F04E23" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="18" r="1.6" fill="#D9F24F" />
        <circle cx="32" cy="16" r="1.6" fill="#D9F24F" />
        <circle cx="40" cy="18" r="1.6" fill="#D9F24F" />
        <text x="32" y="40" textAnchor="middle" fontSize="14" fontWeight="900" fill="#F04E23" fontFamily="Arial, sans-serif">
          MORO&apos;S
        </text>
        <text x="32" y="50" textAnchor="middle" fontSize="7" fontStyle="italic" fill="#FFF9F0" fontFamily="Georgia, serif">
          Comidas rápidas
        </text>
      </svg>
    </span>
  );
}

export default function Logo({ className = 'h-12 w-12' }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`relative overflow-hidden rounded-full ${className}`}>
        <BadgeFallback />
      </span>
    );
  }

  return (
    <span className={`relative block overflow-hidden rounded-full bg-zinc-950 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CANDIDATES[idx]}
        alt="Moro's Comidas Rápidas Logo"
        className="h-full w-full object-cover"
        onError={() => {
          if (idx + 1 < CANDIDATES.length) setIdx(idx + 1);
          else setFailed(true);
        }}
      />
    </span>
  );
}
