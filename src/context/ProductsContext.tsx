'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MENU_ITEMS, type MenuItem } from '@/data/menuData';
import { effectivePrice, type Product } from '@/lib/shop';
import type { Currency, StoreSettings, TaxRate, Variant } from '@/lib/catalog';

export interface StoreProduct extends MenuItem {
  /** Precio antes de la oferta (para mostrar tachado). */
  originalPrice?: number;
  /** Stock disponible (null = ilimitado). */
  stock?: number | null;
  lowStock?: number;
  sku?: string | null;
  type?: string;
  externalUrl?: string | null;
  buttonText?: string | null;
  dropship?: boolean;
  taxRateId?: string | null;
}

interface CatalogState {
  products: StoreProduct[];
  variants: Variant[];
  settings: StoreSettings | null;
  currencies: Currency[];
  taxes: TaxRate[];
}

interface ProductsContextType extends CatalogState {
  loading: boolean;
  /** true cuando el catálogo viene de la base de datos (tienda real). */
  live: boolean;
  refresh: () => Promise<void>;
  /** Variantes activas de un producto. */
  variantsFor: (productId: string) => Variant[];
  /** Moneda activa para mostrar. */
  currency: Currency | null;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

function fromDb(row: Product): StoreProduct {
  const price = effectivePrice(row);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description || '',
    price,
    image: row.image || '/images/hero.jpg',
    popular: row.featured,
    badge: row.badge ?? undefined,
    options: Array.isArray(row.options) ? row.options : [],
    originalPrice: price < Number(row.price) ? Number(row.price) : undefined,
    stock: row.stock,
    lowStock: row.low_stock,
    sku: row.sku,
    type: (row as Product & { type?: string }).type || 'simple',
    externalUrl: (row as Product & { external_url?: string }).external_url ?? null,
    buttonText: (row as Product & { button_text?: string }).button_text ?? null,
    dropship: Boolean((row as Product & { dropship?: boolean }).dropship),
    taxRateId: (row as Product & { tax_rate_id?: string }).tax_rate_id ?? null,
  };
}

function fromStatic(): StoreProduct[] {
  return MENU_ITEMS.map((item) => ({ ...item, stock: null, type: 'simple' }));
}

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CatalogState>({
    products: fromStatic(),
    variants: [],
    settings: null,
    currencies: [],
    taxes: [],
  });
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      const data = await res.json();

      if (data?.source === 'db' && Array.isArray(data.products) && data.products.length > 0) {
        setState({
          products: data.products.map((p: Product) => fromDb(p)),
          variants: Array.isArray(data.variants) ? data.variants : [],
          settings: data.settings ?? null,
          currencies: Array.isArray(data.currencies) ? data.currencies : [],
          taxes: Array.isArray(data.taxes) ? data.taxes : [],
        });
        setLive(true);
      } else {
        setState({ products: fromStatic(), variants: [], settings: null, currencies: [], taxes: [] });
        setLive(false);
      }
    } catch {
      setState({ products: fromStatic(), variants: [], settings: null, currencies: [], taxes: [] });
      setLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const variantsFor = useCallback(
    (productId: string) => state.variants.filter((v) => v.product_id === productId && v.active !== false),
    [state.variants]
  );

  const currency = useMemo(() => {
    if (!state.currencies.length) return null;
    return state.currencies.find((c) => c.is_default) || state.currencies[0];
  }, [state.currencies]);

  const value = useMemo(
    () => ({ ...state, loading, live, refresh: load, variantsFor, currency }),
    [state, loading, live, load, variantsFor, currency]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts debe usarse dentro de ProductsProvider');
  return ctx;
}
