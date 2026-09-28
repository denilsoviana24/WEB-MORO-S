'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem } from '@/data/menuData';

export interface CartItem {
  product: MenuItem;
  quantity: number;
  selectedOption?: { size: string; price: number };
  notes?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: MenuItem, quantity?: number, option?: { size: string; price: number }, notes?: string) => void;
  removeFromCart: (productId: string, optionSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, optionSize?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('moros_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
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
    notes?: string
  ) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedOption?.size === option?.size
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        if (notes) newCart[existingIndex].notes = notes;
        return newCart;
      } else {
        return [...prevCart, { product, quantity, selectedOption: option, notes }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, optionSize?: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(item.product.id === productId && item.selectedOption?.size === optionSize)
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, optionSize?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, optionSize);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId && item.selectedOption?.size === optionSize) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.selectedOption ? item.selectedOption.price : item.product.price;
    return sum + itemPrice * item.quantity;
  }, 0);

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
