import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { CartItem } from "./CartContext";
import { track } from "../utils/analytics";

export interface Order {
  id: string;
  placedAt: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    name: string;
    line1: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  email: string;
}

interface OrderContextValue {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "placedAt" | "status">) => Order;
  getOrder: (id: string) => Order | undefined;
  clear: () => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);
const STORAGE_KEY = "hoodude.orders.v1";

function readStorage(): Order[] {
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

function makeOrderId() {
  const date = new Date();
  const ts = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `HD-${ts}-${rand}`;
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => readStorage());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      /* ignore */
    }
  }, [orders]);

  const value = useMemo<OrderContextValue>(
    () => ({
      orders,
      addOrder: (order) => {
        const fullOrder: Order = {
          ...order,
          id: makeOrderId(),
          placedAt: new Date().toISOString(),
          status: "Processing",
        };
        setOrders((prev) => [fullOrder, ...prev]);
        track("purchase", {
          order_id: fullOrder.id,
          subtotal: fullOrder.subtotal,
          shipping: fullOrder.shipping,
          discount: fullOrder.discount,
          total: fullOrder.total,
          item_count: fullOrder.items.reduce((sum, i) => sum + i.quantity, 0),
        });
        return fullOrder;
      },
      getOrder: (id) => orders.find((o) => o.id === id),
      clear: () => setOrders([]),
    }),
    [orders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
}
