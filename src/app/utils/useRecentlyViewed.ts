import { useEffect, useState } from "react";

const STORAGE_KEY = "hoodude.recently_viewed.v1";
const MAX = 8;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/**
 * Returns the most-recently-viewed product IDs (newest first).
 * Components can also call `record(id)` to append a view.
 */
export function useRecentlyViewed(): {
  ids: string[];
  record: (id: string) => void;
  clear: () => void;
} {
  const [ids, setIds] = useState<string[]>(() => read());

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIds(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const record = (id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX);
      write(next);
      return next;
    });
  };

  const clear = () => {
    setIds([]);
    write([]);
  };

  return { ids, record, clear };
}
