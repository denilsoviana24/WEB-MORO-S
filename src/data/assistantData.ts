import { MENU_ITEMS, PROMOTIONS, RESTAURANT_INFO, type MenuItem } from '@/data/menuData';

/** Platos marcados como populares en la carta. */
export function getPopular(count = 3): MenuItem[] {
  const popular = MENU_ITEMS.filter((i) => i.popular);
  const rest = MENU_ITEMS.filter((i) => !i.popular);
  return [...popular, ...rest].slice(0, count);
}

/** Los más económicos de la carta. */
export function getCheapest(count = 3): MenuItem[] {
  return [...MENU_ITEMS].sort((a, b) => a.price - b.price).slice(0, count);
}

/** Platos de una o varias categorías. */
export function getByCategory(catIds: string[], count = 3): MenuItem[] {
  return MENU_ITEMS.filter((i) => catIds.includes(i.category)).slice(0, count);
}

/** Ideales para compartir / buen hambre. */
export function getToShare(count = 3): MenuItem[] {
  const ids = ['papi-completa-moros', 'mixto-bbq', 'burger-moros', 'picadita-moros', 'costillas-bbq'];
  const picked = ids
    .map((id) => MENU_ITEMS.find((i) => i.id === id))
    .filter((i): i is MenuItem => !!i);
  return picked.slice(0, count);
}

export function findItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((i) => i.id === id);
}

/** Palabras del cliente -> categorías del menú. */
export const CATEGORY_KEYWORDS: { words: string[]; cats: string[] }[] = [
  { words: ['broaster', 'presa', 'crocante'], cats: ['broaster'] },
  { words: ['pollo', 'crispeta', 'gallina', 'chicharron'], cats: ['broaster', 'gallina', 'picaditas'] },
  { words: ['hamburguesa', 'burger', 'burguer'], cats: ['hamburguesas'] },
  { words: ['perro', 'hot dog', 'salchicha'], cats: ['hot-dog', 'salchipapas'] },
  { words: ['papa', 'salchipapa', 'completa', 'mixta'], cats: ['salchipapas', 'papi-completas', 'papi-mixtas'] },
  { words: ['bbq', 'costilla', 'alita', 'ahumado'], cats: ['bbq'] },
  { words: ['bebida', 'jugo', 'gaseosa', 'cola', 'batido', 'cafe', 'aromatica', 'te'], cats: ['bebidas'] },
  { words: ['picadita', 'picada'], cats: ['picaditas'] },
];

export function isOpenNow(): boolean {
  const h = new Date().getHours();
  return h >= RESTAURANT_INFO.openHour && h < RESTAURANT_INFO.closeHour;
}

export function scheduleText(): string {
  return `Atendemos ${RESTAURANT_INFO.schedule} (${RESTAURANT_INFO.openHour}:00 a ${RESTAURANT_INFO.closeHour}:00).`;
}

export { PROMOTIONS, RESTAURANT_INFO };
