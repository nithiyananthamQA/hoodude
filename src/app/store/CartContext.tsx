import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { track } from "../utils/analytics";

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
  maxStock?: number;
}

const DEFAULT_STOCK_CAP = 10;

interface CartContextValue {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
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
  const [isOpen, setIsOpen] = useState(false);

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
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      add(item) {
        const id = item.id ?? makeLineId(item.productId, item.color, item.size);
        const cap = item.maxStock ?? DEFAULT_STOCK_CAP;
        setItems((prev) => {
          const existing = prev.find((p) => p.id === id);
          const currentQty = existing?.quantity ?? 0;
          const desiredQty = currentQty + item.quantity;
          const finalQty = Math.min(desiredQty, cap);
          // Confirmation is the caller's responsibility — they're the surface
          // the user is looking at. CartContext stays silent so we don't pile
          // a toast on top of their inline UI.
          if (existing) {
            return prev.map((p) => (p.id === id ? { ...p, quantity: finalQty } : p));
          }
          return [...prev, { ...item, id, quantity: finalQty, maxStock: cap }];
        });
        track("add_to_cart", {
          product_id: item.productId,
          name: item.name,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        });
      },
      remove(id) {
        const removed = items.find((p) => p.id === id);
        setItems((prev) => prev.filter((p) => p.id !== id));
        if (removed) {
          track("remove_from_cart", {
            product_id: removed.productId,
            name: removed.name,
            quantity: removed.quantity,
          });
        }
      },
      updateQuantity(id, quantity) {
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => {
                if (p.id !== id) return p;
                const cap = p.maxStock ?? DEFAULT_STOCK_CAP;
                return { ...p, quantity: Math.min(quantity, cap) };
              })
        );
        track("update_cart_quantity", { line_id: id, quantity });
      },
      clear() {
        setItems([]);
      },
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
