'use client';

import React from 'react';

interface MarqueeProps {
  items: string[];
  fast?: boolean;
  outline?: boolean;
}

export default function Marquee({ items, fast = false, outline = false }: MarqueeProps) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[#14532D]/15 bg-[#14532D] py-4 select-none">
      <div className={`flex w-max items-center gap-8 whitespace-nowrap ${fast ? 'animate-marquee-fast' : 'animate-marquee'}`}>
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-8">
            {row.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-8">
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight uppercase ${
                    outline && i % 2 === 1 ? 'text-[#D9F24F]' : 'text-white'
                  }`}
                >
                  {item}
                </span>
                <span className="text-[#D9F24F] text-xl">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
