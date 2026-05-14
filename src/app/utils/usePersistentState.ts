import { useEffect, useState } from "react";

/**
 * Drop-in replacement for useState that persists to localStorage under a key.
 * Survives page reloads, route changes, and accidental navigation.
 */
export function usePersistentState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [key, state]);

  return [state, setState];
}
