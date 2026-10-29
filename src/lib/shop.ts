/**
 * Tipos y cálculos de la tienda (equivalente a WooCommerce).
 * Compartido por servidor y navegador: NO importar aquí nada de Node.
 */

export interface ProductOption {
  size: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  category: string;
  price: number;
  sale_price: number | null;
  sku: string | null;
  stock: number | null;
  low_stock: number;
  active: boolean;
  featured: boolean;
  badge: string | null;
  image: string;
  options: ProductOption[];
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  amount: number;
  min_total: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export const ORDER_STATUSES: { id: OrderStatus; label: string; color: string }[] = [
  { id: 'pending', label: 'Pendiente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'confirmed', label: 'Confirmado', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  { id: 'preparing', label: 'En preparación', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  { id: 'delivering', label: 'En camino', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  { id: 'completed', label: 'Entregado', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { id: 'cancelled', label: 'Cancelado', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
];

/** Precio de venta real: si hay oferta y es menor, gana la oferta. */
export function effectivePrice(p: Pick<Product, 'price' | 'sale_price'>): number {
  const price = Number(p.price) || 0;
  const sale = p.sale_price === null || p.sale_price === undefined ? null : Number(p.sale_price);
  return sale !== null && sale > 0 && sale < price ? sale : price;
}

/** ¿El producto tiene descuento activo? */
export function hasSale(p: Pick<Product, 'price' | 'sale_price'>): boolean {
  return effectivePrice(p) < Number(p.price);
}

export function stockState(p: Pick<Product, 'stock' | 'low_stock'>): 'unlimited' | 'out' | 'low' | 'ok' {
  if (p.stock === null || p.stock === undefined) return 'unlimited';
  if (p.stock <= 0) return 'out';
  if (p.stock <= (p.low_stock ?? 5)) return 'low';
  return 'ok';
}

/** Descuento de un cupón sobre un subtotal (nunca supera el subtotal). */
export function computeDiscount(
  coupon: Pick<Coupon, 'type' | 'amount'> | null,
  subtotal: number
): number {
  if (!coupon) return 0;
  const base = Math.max(0, Number(subtotal) || 0);
  const amount = Number(coupon.amount) || 0;
  const raw = coupon.type === 'percent' ? (base * amount) / 100 : amount;
  return Math.round(Math.min(raw, base) * 100) / 100;
}

/** Motivo por el que un cupón no aplica (null = aplica). */
export function couponProblem(
  coupon: Coupon | null,
  subtotal: number
): string | null {
  if (!coupon) return 'Cupón no válido.';
  if (!coupon.active) return 'Este cupón ya no está activo.';
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return 'Este cupón caducó.';
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return 'Este cupón ya alcanzó su límite de usos.';
  }
  if (subtotal < Number(coupon.min_total || 0)) {
    return `Este cupón aplica desde $${Number(coupon.min_total).toFixed(2)}.`;
  }
  return null;
}

export function couponLabel(coupon: Pick<Coupon, 'type' | 'amount'>): string {
  return coupon.type === 'percent'
    ? `${Number(coupon.amount)}% de descuento`
    : `$${Number(coupon.amount).toFixed(2)} de descuento`;
}
