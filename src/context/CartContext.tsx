'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem } from '@/data/menuData';

export interface CartVariant {
  id: string;
  label: string;
  price: number;
  sku?: string | null;
}

export interface CartItem {
  product: MenuItem;
  quantity: number;
  selectedOption?: { size: string; price: number };
  variant?: CartVariant;
  notes?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: MenuItem,
    quantity?: number,
    option?: { size: string; price: number },
    notes?: string,
    variant?: CartVariant
  ) => void;
  removeFromCart: (productId: string, optionSize?: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, optionSize?: string, variantId?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const sameLine = (item: CartItem, productId: string, optionSize?: string, variantId?: string) =>
  item.product.id === productId &&
  (variantId ? item.variant?.id === variantId : (item.selectedOption?.size ?? undefined) === optionSize && !item.variant);

/** Precio unitario de una línea del carrito. */
export function cartItemPrice(item: CartItem): number {
  if (item.variant) return Number(item.variant.price) || 0;
  if (item.selectedOption) return Number(item.selectedOption.price) || 0;
  return Number(item.product.price) || 0;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('moros_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error('Error parsing cart from localStorage:', e);
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('moros_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cart]);

  const addToCart = (
    product: MenuItem,
    quantity = 1,
    option?: { size: string; price: number },
    notes?: string,
    variant?: CartVariant
  ) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) =>
        sameLine(item, product.id, option?.size, variant?.id)
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        if (notes) newCart[existingIndex].notes = notes;
        return newCart;
      }
      return [...prevCart, { product, quantity, selectedOption: option, variant, notes }];
    });
    setTimeout(() => setIsCartOpen(true), 750);
  };

  const removeFromCart = (productId: string, optionSize?: string, variantId?: string) => {
    setCart((prevCart) => prevCart.filter((item) => !sameLine(item, productId, optionSize, variantId)));
  };

  const updateQuantity = (productId: string, quantity: number, optionSize?: string, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, optionSize, variantId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        sameLine(item, productId, optionSize, variantId) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + cartItemPrice(item) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
