import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  add: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "hoodude.cart.v1";

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeLineId(productId: string, color: string, size: string) {
  return `${productId}::${color}::${size}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items,
      subtotal,
      itemCount,
      add(item) {
        const id = item.id ?? makeLineId(item.productId, item.color, item.size);
        setItems((prev) => {
          const existing = prev.find((p) => p.id === id);
          if (existing) {
            return prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + item.quantity } : p));
          }
          return [...prev, { ...item, id }];
        });
      },
      remove(id) {
        setItems((prev) => prev.filter((p) => p.id !== id));
      },
      updateQuantity(id, quantity) {
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => (p.id === id ? { ...p, quantity } : p))
        );
      },
      clear() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
