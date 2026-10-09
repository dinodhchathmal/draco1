"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = { variantId: string; productId: string; slug: string; name: string; size: string; color: string; price: number; quantity: number; image: string };
type CartContextValue = { items: CartItem[]; add: (item: CartItem) => void; remove: (variantId: string) => void; setQuantity: (variantId: string, quantity: number) => void; clear: () => void; count: number };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem("draco-cart") ?? "[]")); } catch { setItems([]); } setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem("draco-cart", JSON.stringify(items)); }, [items, ready]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (item) => setItems((current) => { const found = current.find((x) => x.variantId === item.variantId); return found ? current.map((x) => x.variantId === item.variantId ? { ...x, quantity: Math.min(x.quantity + item.quantity, 10) } : x) : [...current, item]; }),
    remove: (variantId) => setItems((current) => current.filter((x) => x.variantId !== variantId)),
    setQuantity: (variantId, quantity) => setItems((current) => current.map((x) => x.variantId === variantId ? { ...x, quantity: Math.max(1, Math.min(10, quantity)) } : x)),
    clear: () => setItems([]), count: items.reduce((sum, item) => sum + item.quantity, 0),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider"); return value; }
