import confetti from 'canvas-confetti';

type ConfettiFn = {
  (opts: Record<string, unknown>): void;
  shapeFromText: (opts: { text: string; scalar?: number }) => Record<string, unknown>;
};

const anyConfetti = confetti as unknown as ConfettiFn;

/**
 * Lluvia de mini papitas fritas 🍟
 * @param x posición horizontal normalizada (0 - 1), por defecto arriba-centro
 * @param y posición vertical normalizada (0 - 1)
 */
export function friesRain(x = 0.5, y = 0.15) {
  const fry = anyConfetti.shapeFromText({ text: '🍟', scalar: 2 });
  const shapes = [fry];

  const base = {
    shapes,
    scalar: 1.6,
    ticks: 240,
    gravity: 1.1,
    decay: 0.93,
    disableForReducedMotion: true,
    zIndex: 9999,
  };

  // Explosión inicial desde el punto del clic
  anyConfetti({ ...base, particleCount: 40, spread: 100, startVelocity: 35, origin: { x, y } });

  // Lluvia continua desde arriba en oleadas
  const waves = [
    { delay: 150, x: 0.2 },
    { delay: 300, x: 0.5 },
    { delay: 450, x: 0.8 },
    { delay: 600, x: 0.35 },
    { delay: 750, x: 0.65 },
  ];

  waves.forEach(({ delay, x: wx }) => {
    window.setTimeout(() => {
      anyConfetti({
        ...base,
        particleCount: 22,
        spread: 60,
        startVelocity: 18,
        angle: 270,
        origin: { x: wx, y: -0.05 },
      });
    }, delay);
  });
}
