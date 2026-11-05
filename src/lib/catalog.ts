/**
 * Núcleo del catálogo: variantes, SKU, dinero, monedas, impuestos y stock.
 * Solo utilidades puras: se puede importar en servidor y navegador.
 */

export type ProductType = 'simple' | 'variable' | 'grouped' | 'external';
export type Backorders = 'no' | 'notify' | 'yes';
export type RoundingMode = 'none' | 'up' | 'down' | 'half_up' | 'half_even';

export interface StoreSettings {
  store_name: string;
  base_currency: string;
  currency_decimals: number;
  rounding_mode: RoundingMode;
  rounding_step: number;
  prices_include_tax: boolean;
  default_tax_rate_id: string | null;
  reserve_minutes: number;
  low_stock_threshold: number;
  checkout_min_total: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  decimals: number;
  symbol_position: 'before' | 'after';
  active: boolean;
  is_default: boolean;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  country: string | null;
  region: string | null;
  is_default: boolean;
  active: boolean;
  priority: number;
}

export interface AttributeTerm {
  id: string;
  attribute_id: string;
  value: string;
  slug: string;
  sort_order: number;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  input_type: 'select' | 'color' | 'text';
  sort_order: number;
  terms: AttributeTerm[];
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string | null;
  title: string;
  attributes: Record<string, string>;
  price: number;
  sale_price: number | null;
  stock: number | null;
  reserved: number;
  manage_stock: boolean;
  backorders: Backorders;
  weight: number;
  image: string | null;
  dropship: boolean;
  supplier: string | null;
  active: boolean;
}

export interface ShippingMethod {
  id: string;
  zone_id: string | null;
  name: string;
  type: 'flat' | 'free' | 'per_item';
  cost: number;
  per_item: number;
  free_over: number | null;
  min_total: number;
  eta: string | null;
  active: boolean;
  sort_order: number;
}

/* ---------------------------------------------------------------- */
/* Dinero                                                           */
/* ---------------------------------------------------------------- */

/** Redondea según la política de la tienda (paso y modo configurables). */
export function roundMoney(value: number, mode: RoundingMode = 'half_up', step = 0.01, decimals = 2): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const s = step > 0 ? step : 0.01;

  let rounded: number;
  if (mode === 'none') {
    rounded = n;
  } else {
    const units = n / s;
    switch (mode) {
      case 'up':
        rounded = Math.ceil(units) * s;
        break;
      case 'down':
        rounded = Math.floor(units) * s;
        break;
      case 'half_even': {
        const floor = Math.floor(units);
        const diff = units - floor;
        const base = diff > 0.5 ? floor + 1 : diff < 0.5 ? floor : floor % 2 === 0 ? floor : floor + 1;
        rounded = base * s;
        break;
      }
      default:
        rounded = Math.round(units) * s;
    }
  }
  const f = Math.pow(10, decimals);
  return Math.round(rounded * f) / f;
}

/** Convierte de la moneda base a la moneda indicada. */
export function convert(amount: number, currency: Currency | null | undefined): number {
  if (!currency) return Number(amount) || 0;
  const rate = Number(currency.rate) || 1;
  return (Number(amount) || 0) * rate;
}

export function formatMoney(
  amount: number,
  currency: Pick<Currency, 'symbol' | 'symbol_position' | 'decimals'> | null,
  fallbackSymbol = '$'
): string {
  const decimals = currency?.decimals ?? 2;
  const symbol = currency?.symbol || fallbackSymbol;
  const n = Number(amount) || 0;
  const value = n.toFixed(decimals);
  return currency?.symbol_position === 'after' ? `${value} ${symbol}` : `${symbol}${value}`;
}

/* ---------------------------------------------------------------- */
/* Impuestos                                                        */
/* ---------------------------------------------------------------- */

export interface LineInput {
  price: number;
  qty: number;
  taxRate: number; // porcentaje, ej. 15
}

export interface LineTotals {
  net: number;
  tax: number;
  gross: number;
}

/**
 * Calcula una línea con o sin impuestos incluidos en el precio.
 * Con `pricesIncludeTax` el precio ya lleva el IVA y se desglosa.
 */
export function lineTotals(
  line: LineInput,
  pricesIncludeTax: boolean,
  mode: RoundingMode = 'half_up',
  step = 0.01
): LineTotals {
  const qty = Math.max(0, Number(line.qty) || 0);
  const price = Number(line.price) || 0;
  const rate = Math.max(0, Number(line.taxRate) || 0) / 100;
  const gross = roundMoney(price * qty, mode, step);

  if (rate <= 0) return { net: gross, tax: 0, gross };

  if (pricesIncludeTax) {
    const net = roundMoney(gross / (1 + rate), mode, step);
    return { net, tax: roundMoney(gross - net, mode, step), gross };
  }
  const net = gross;
  return { net, tax: roundMoney(gross * rate, mode, step), gross: roundMoney(gross + net * rate, mode, step) };
}

/** Tasa aplicable a un producto: la suya o la global por defecto. */
export function taxRateFor(
  taxRateId: string | null | undefined,
  taxes: TaxRate[],
  settings: Pick<StoreSettings, 'default_tax_rate_id'>
): number {
  const byId = taxRateId ? taxes.find((t) => t.id === taxRateId) : null;
  const chosen = byId || taxes.find((t) => t.id === settings.default_tax_rate_id) || taxes.find((t) => t.is_default);
  return Number(chosen?.rate) || 0;
}

/* ---------------------------------------------------------------- */
/* Stock                                                            */
/* ---------------------------------------------------------------- */

export interface StockInfo {
  manage: boolean;
  stock: number;
  reserved: number;
  backorders: Backorders;
}

export type StockState = 'unlimited' | 'out' | 'low' | 'ok';

/** Disponible real = stock físico - reservado. */
export function available(info: StockInfo): number {
  if (!info.manage) return Infinity;
  return Math.max(0, (Number(info.stock) || 0) - (Number(info.reserved) || 0));
}

export function stockState(info: StockInfo, lowThreshold = 5): StockState {
  if (!info.manage) return 'unlimited';
  const free = available(info);
  if (free <= 0) return info.backorders === 'no' ? 'out' : 'low';
  if (free <= lowThreshold) return 'low';
  return 'ok';
}

export function canSell(info: StockInfo, qty: number): boolean {
  if (!info.manage) return true;
  if (info.backorders === 'yes') return true;
  return available(info) >= qty;
}

/* ---------------------------------------------------------------- */
/* Variantes                                                        */
/* ---------------------------------------------------------------- */

/** Precio efectivo de una variante (oferta si es menor). */
export function variantPrice(v: Pick<Variant, 'price' | 'sale_price'>): number {
  const price = Number(v.price) || 0;
  const sale = v.sale_price === null || v.sale_price === undefined ? null : Number(v.sale_price);
  return sale !== null && sale > 0 && sale < price ? sale : price;
}

export function variantLabel(attributes: Record<string, string>): string {
  const parts = Object.entries(attributes || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  return parts.length ? parts.join(' · ') : 'Único';
}

/** ¿Todas las opciones de la variante están entre las elegidas? */
export function matchesSelection(attributes: Record<string, string>, selection: Record<string, string>): boolean {
  return Object.entries(attributes || {}).every(([key, value]) => {
    const chosen = selection[key];
    return !chosen || chosen === value;
  });
}

/** Encuentra la variante exacta para la selección. */
export function findVariant(variants: Variant[], selection: Record<string, string>): Variant | null {
  const keys = Object.keys(selection).filter((k) => selection[k]);
  return (
    variants.find(
      (v) =>
        v.active &&
        keys.every((k) => (v.attributes || {})[k] === selection[k]) &&
        Object.keys(v.attributes || {}).length === keys.length
    ) || null
  );
}

/** SKU legible y determinista: MOR-<producto>-<combinación>. */
export function buildSku(productSlug: string, attributes: Record<string, string>): string {
  const base = (productSlug || 'prod')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 14);
  const suffix = Object.values(attributes || {})
    .filter(Boolean)
    .map((v) => String(v).toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 5))
    .join('-');
  return suffix ? `MOR-${base}-${suffix}` : `MOR-${base}`;
}

/** Producto cartesiano de atributos → matriz de variantes. */
export function buildMatrix(
  options: { name: string; values: string[] }[]
): Record<string, string>[] {
  const clean = options.filter((o) => o.name.trim() && o.values.filter(Boolean).length);
  if (!clean.length) return [{}];

  return clean.reduce<Record<string, string>[]>(
    (acc, opt) => {
      const values = opt.values.filter(Boolean);
      const next: Record<string, string>[] = [];
      for (const combo of acc) {
        for (const value of values) next.push({ ...combo, [opt.name.trim()]: value });
      }
      return next;
    },
    [{}]
  );
}
