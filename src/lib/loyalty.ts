/**
 * Sellos de la tarjeta fiel compartidos entre el carrito y la sección Club Moro's.
 * Se guardan en el celular (localStorage) y se sincronizan con un evento.
 */

export const LOYALTY_KEY = 'moros_loyalty_stamps';
export const LOYALTY_EVENT = 'moros:loyalty-updated';

export function getLoyaltyStamps(goal: number): number {
  try {
    const saved = parseInt(localStorage.getItem(LOYALTY_KEY) || '0', 10);
    if (isNaN(saved)) return 0;
    return Math.min(Math.max(saved, 0), goal);
  } catch {
    return 0;
  }
}

function notify() {
  try {
    window.dispatchEvent(new Event(LOYALTY_EVENT));
  } catch {
    // ignorar (SSR)
  }
}

/** Suma 1 sello (tope: goal). Devuelve el total y si se acaba de completar. */
export function addLoyaltyStamp(goal: number): { stamps: number; completed: boolean } {
  const current = getLoyaltyStamps(goal);
  if (current >= goal) return { stamps: current, completed: false };
  const next = current + 1;
  try {
    localStorage.setItem(LOYALTY_KEY, String(next));
  } catch {
    // ignorar
  }
  notify();
  return { stamps: next, completed: next === goal };
}

export function resetLoyaltyStamps() {
  try {
    localStorage.setItem(LOYALTY_KEY, '0');
  } catch {
    // ignorar
  }
  notify();
}
