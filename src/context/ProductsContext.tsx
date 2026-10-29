'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MENU_ITEMS, type MenuItem } from '@/data/menuData';
import { effectivePrice, type Product } from '@/lib/shop';

export interface StoreProduct extends MenuItem {
  /** Precio antes de la oferta (para mostrar tachado). */
  originalPrice?: number;
  /** Stock disponible (null = ilimitado). */
  stock?: number | null;
  lowStock?: number;
  sku?: string | null;
}

interface ProductsContextType {
  products: StoreProduct[];
  loading: boolean;
  /** true cuando el catálogo viene de la base de datos (tienda real). */
  live: boolean;
  refresh: () => Promise<void>;
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
  };
}

function fromStatic(): StoreProduct[] {
  return MENU_ITEMS.map((item) => ({ ...item, stock: null }));
}

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>(fromStatic());
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      if (data?.source === 'db' && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products.map((p: Product) => fromDb(p)));
        setLive(true);
      } else {
        setProducts(fromStatic());
        setLive(false);
      }
    } catch {
      setProducts(fromStatic());
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const value = useMemo(() => ({ products, loading, live, refresh: load }), [products, loading, live]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts debe usarse dentro de ProductsProvider');
  return ctx;
}
