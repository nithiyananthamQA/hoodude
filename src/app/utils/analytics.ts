import { env, isDev } from "./env";

export type AnalyticsEvent =
  | "view_landing"
  | "view_shop"
  | "view_product"
  | "view_cart"
  | "view_wishlist"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "update_cart_quantity"
  | "add_to_wishlist"
  | "remove_from_wishlist"
  | "begin_checkout"
  | "purchase"
  | "sign_in"
  | "sign_up"
  | "sign_out"
  | "newsletter_signup"
  | "contact_submit"
  | "experiment_assigned"
  | "experiment_exposed"
  | "ar_launch_attempt"
  | "vr_open"
  | "tryon_open"
  | "design_prompt_submit"
  | "design_generated"
  | "customize_add_to_cart"
  | "customize_save_draft";

type EventProps = Record<string, string | number | boolean | null | undefined>;

const enabled = env.bool("VITE_ANALYTICS_ENABLED");
const plausibleDomain = env.get("VITE_PLAUSIBLE_DOMAIN");

const log = (...args: unknown[]) => {
  if (isDev) console.info("[analytics]", ...args);
};

export const track = (event: AnalyticsEvent, props: EventProps = {}) => {
  log(event, props);
  if (!enabled) return;
  // Plausible — fire-and-forget custom event. Loaded via script in index.html
  // when a domain is configured; gracefully no-ops if the script isn't there.
  if (plausibleDomain && typeof window !== "undefined") {
    const w = window as unknown as { plausible?: (e: string, opts?: { props: EventProps }) => void };
    w.plausible?.(event, { props });
  }
};

export const identify = (userId: string, traits: EventProps = {}) => {
  log("identify", userId, traits);
  // Hook a real provider here when one is chosen.
};

export const trackPageView = (path: string) => {
  log("page_view", { path });
  // Plausible auto-tracks SPA pageviews when the script is loaded with the
  // hash/pageview extension; this hook is here for explicit calls if needed.
};
