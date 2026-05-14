import { useEffect, useRef, useState } from "react";
import { track } from "./analytics";

const SESSION_KEY = "hoodude.session_id.v1";
const ASSIGNMENT_KEY = "hoodude.experiments.v1";

/**
 * Stable per-browser session ID. Survives reloads but not localStorage clears.
 * Used as the bucketing seed so a user always sees the same variant on return.
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "ssr";
  }
}

/**
 * Deterministic hash of a string → integer in [0, 2^32). FNV-1a is fast,
 * dependency-free, and good enough for variant bucketing (not for security).
 */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function readAssignments(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ASSIGNMENT_KEY);
    return raw ? (JSON.parse(raw) ?? {}) : {};
  } catch {
    return {};
  }
}

function writeAssignments(map: Record<string, string>) {
  try {
    window.localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/**
 * Assign a variant for the given experiment key. Deterministic per-browser:
 * the same session always lands in the same bucket. Persists assignments
 * across reloads so the variant never flips mid-session.
 */
export function assignVariant<T extends string>(key: string, variants: readonly T[]): T {
  if (variants.length === 0) {
    throw new Error(`assignVariant("${key}"): variants array is empty`);
  }
  const cached = readAssignments();
  const existing = cached[key];
  if (existing && variants.includes(existing as T)) return existing as T;

  const session = getSessionId();
  const bucket = hash32(`${session}:${key}`) % variants.length;
  const variant = variants[bucket];

  cached[key] = variant;
  writeAssignments(cached);
  return variant;
}

/**
 * One-line override: `?exp=hero_v2:treatment` in the URL forces a variant for
 * the current session. Useful for sharing experiment previews internally.
 */
export function readExperimentOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const value of params.getAll("exp")) {
      const [key, variant] = value.split(":");
      if (key && variant) out[key.trim()] = variant.trim();
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * useExperiment("hero_v2", ["control", "treatment"]) → "control" | "treatment".
 *
 * - Same browser always gets the same variant (deterministic bucketing).
 * - Fires `experiment_assigned` once per (key + variant) per session.
 * - Fires `experiment_exposed` on every render where the result is used.
 * - URL override: `?exp=hero_v2:treatment` forces a variant.
 */
export function useExperiment<T extends string>(
  key: string,
  variants: readonly T[],
): T {
  const overrideRef = useRef<string | undefined>(undefined);
  if (overrideRef.current === undefined) {
    const overrides = readExperimentOverrides();
    overrideRef.current = overrides[key];
  }

  const [variant] = useState<T>(() => {
    const override = overrideRef.current;
    if (override && variants.includes(override as T)) return override as T;
    return assignVariant(key, variants);
  });

  // Fire assignment event once per session per (key,variant). Exposure event
  // fires on every render — use that for funnel-attribution downstream.
  useEffect(() => {
    track("experiment_assigned", { key, variant, override: !!overrideRef.current });
    track("experiment_exposed", { key, variant });
    // Intentionally only on mount; subsequent re-renders shouldn't re-emit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return variant;
}
