import { LOYALTY_TIERS, STAMPS_GOAL, STAMPS_REWARD } from '@/data/loyaltyData';

/** Configuración del Club Moro's que el dueño puede editar desde el panel. */

export interface ClubTier {
  id: string;
  name: string;
  icon: string;
  visits: string;
  color: string;
  border: string;
  dish: { name: string; tag: string; image: string };
  benefits: string[];
}

export interface ClubConfig {
  stampsGoal: number;
  autoStamp: boolean;
  reward: { code: string; title: string; description: string };
  levels: { bronze: number; silver: number; gold: number };
  section: { title: string; highlight: string; subtitle: string; note: string };
  tiers: ClubTier[];
}

export const CLUB_FALLBACK: ClubConfig = {
  stampsGoal: STAMPS_GOAL,
  autoStamp: true,
  reward: {
    code: STAMPS_REWARD.code,
    title: STAMPS_REWARD.title,
    description: STAMPS_REWARD.description,
  },
  levels: { bronze: 1, silver: 7, gold: 15 },
  section: {
    title: 'Mientras más vienes,',
    highlight: 'más ganas',
    subtitle:
      'Junta sellos en tu tarjeta fiel con cada visita y sube de nivel para desbloquear descuentos, regalos y promos exclusivas.',
    note: 'Muestra tu tarjeta en el local para sellar tu visita. Cada pedido en la web suma 1 sello automáticamente 🍟. Al completar los sellos reclamas tu premio.',
  },
  tiers: LOYALTY_TIERS,
};

function str(value: unknown, fallback: string): string {
  const s = typeof value === 'string' ? value.trim() : '';
  return s || fallback;
}

function num(value: unknown, fallback: number, min = 0, max = 999): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Une los niveles guardados con los de fábrica (conserva colores y completa campos). */
export function normalizeTiers(raw: unknown): ClubTier[] {
  const list = Array.isArray(raw) ? raw : [];
  return LOYALTY_TIERS.map((base, i) => {
    const found =
      list.find((t) => t && typeof t === 'object' && (t as { id?: string }).id === base.id) ||
      list[i];
    const t = (found || {}) as Partial<ClubTier>;

    const dish = (t.dish || {}) as Partial<ClubTier['dish']>;
    const benefits = Array.isArray(t.benefits)
      ? t.benefits.map((b) => String(b).trim()).filter(Boolean)
      : base.benefits;

    return {
      id: base.id,
      name: str(t.name, base.name),
      icon: str(t.icon, base.icon),
      visits: str(t.visits, base.visits),
      color: str(t.color, base.color),
      border: str(t.border, base.border),
      dish: {
        name: str(dish.name, base.dish.name),
        tag: str(dish.tag, base.dish.tag),
        image: str(dish.image, base.dish.image),
      },
      benefits: benefits.length ? benefits : base.benefits,
    };
  });
}

/** Fila de Supabase → configuración lista para la web. */
export function configFromRow(row: Record<string, unknown> | null | undefined): ClubConfig {
  if (!row) return CLUB_FALLBACK;

  return {
    stampsGoal: num(row.stamps_goal, CLUB_FALLBACK.stampsGoal, 1, 100),
    autoStamp: row.auto_stamp !== false,
    reward: {
      code: str(row.reward_code, CLUB_FALLBACK.reward.code),
      title: str(row.reward_title, CLUB_FALLBACK.reward.title),
      description: str(row.reward_description, CLUB_FALLBACK.reward.description),
    },
    levels: {
      bronze: num(row.bronze_orders, CLUB_FALLBACK.levels.bronze, 0, 999),
      silver: num(row.silver_orders, CLUB_FALLBACK.levels.silver, 0, 999),
      gold: num(row.gold_orders, CLUB_FALLBACK.levels.gold, 0, 999),
    },
    section: {
      title: str(row.section_title, CLUB_FALLBACK.section.title),
      highlight: str(row.section_highlight, CLUB_FALLBACK.section.highlight),
      subtitle: str(row.section_subtitle, CLUB_FALLBACK.section.subtitle),
      note: str(row.section_note, CLUB_FALLBACK.section.note),
    },
    tiers: normalizeTiers(row.tiers),
  };
}

let cached: { at: number; value: ClubConfig } | null = null;
const TTL = 30_000;

/** Configuración pública del club (con caché de 30 s para no repetir la llamada). */
export async function getClubConfig(force = false): Promise<ClubConfig> {
  if (!force && cached && Date.now() - cached.at < TTL) return cached.value;

  try {
    const res = await fetch('/api/club', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { config?: ClubConfig };
    cached = { at: Date.now(), value: data.config || CLUB_FALLBACK };
    return cached.value;
  } catch {
    return CLUB_FALLBACK;
  }
}

export function clearClubConfigCache() {
  cached = null;
}
