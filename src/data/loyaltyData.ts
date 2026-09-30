export interface LoyaltyTier {
  id: string;
  name: string;
  icon: string;
  visits: string;
  color: string;
  border: string;
  benefits: string[];
}

export interface LoyaltyPromo {
  id: string;
  code: string;
  title: string;
  description: string;
  badge: string;
}

export const STAMPS_GOAL = 20;

export const STAMPS_REWARD = {
  title: 'Papi Completa Moro’s GRATIS',
  description:
    'Completa todos los sellos de tu tarjeta fiel y reclama una Papi Completa Moro’s totalmente gratis en el local.',
  code: 'MOROS-FIEL-20',
};

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'bronce',
    name: 'Moro Bronce',
    icon: '🥉',
    visits: '1 - 6 visitas',
    color: 'from-amber-700 via-amber-600 to-yellow-700',
    border: 'border-amber-700/50',
    benefits: [
      'Tarjeta fiel con sellos por visita',
      'Bebida gratis en tu cumpleaños',
      'Acceso a promos de la semana',
    ],
  },
  {
    id: 'plata',
    name: 'Moro Plata',
    icon: '🥈',
    visits: '7 - 14 visitas',
    color: 'from-zinc-400 via-zinc-300 to-zinc-500',
    border: 'border-zinc-400/50',
    benefits: [
      'Todo lo de Bronce',
      '10% OFF todos los martes',
      'Papas extra gratis en combos',
    ],
  },
  {
    id: 'oro',
    name: 'Moro Oro',
    icon: '🥇',
    visits: '15+ visitas',
    color: 'from-yellow-500 via-amber-400 to-orange-500',
    border: 'border-amber-400/60',
    benefits: [
      'Todo lo de Plata',
      '15% OFF todos los días',
      'Postre o bebida gratis cada mes',
      'Atención prioritaria en reservas',
    ],
  },
];

export const LOYALTY_PROMOS: LoyaltyPromo[] = [
  {
    id: 'fiel-10',
    code: 'MOROS10',
    title: '10% OFF por ser fiel',
    description:
      'Menciona este código en caja o por WhatsApp y recibe 10% de descuento en tu pedido mayor a $5.',
    badge: 'Toda la semana',
  },
  {
    id: 'fiel-2x1',
    code: 'MOROS2X1',
    title: '2x1 en Hamburguesa Sencilla',
    description:
      'Todos los miércoles: pide una Hamburguesa Sencilla y la segunda va por la casa.',
    badge: 'Solo miércoles',
  },
  {
    id: 'fiel-cumple',
    code: 'MOROSCUMPLE',
    title: 'Regalo de cumpleaños',
    description:
      'En tu cumpleaños presenta tu cédula y recibe una bebida + postre gratis con cualquier combo.',
    badge: 'Tu cumpleaños',
  },
];
