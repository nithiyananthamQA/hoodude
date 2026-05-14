type EnvKey =
  | "VITE_SHOPIFY_STORE_DOMAIN"
  | "VITE_SHOPIFY_STOREFRONT_TOKEN"
  | "VITE_USE_SHOPIFY"
  | "VITE_ANALYTICS_ENABLED"
  | "VITE_PLAUSIBLE_DOMAIN"
  | "VITE_NEWSLETTER_ENDPOINT"
  | "VITE_CONTACT_ENDPOINT"
  | "VITE_CHECKOUT_ENDPOINT"
  | "VITE_GEMINI_API_KEY"
  | "VITE_GEMINI_IMAGE_MODEL";

const read = (key: EnvKey): string | undefined => {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
};

export const env = {
  get: read,
  require(key: EnvKey): string {
    const v = read(key);
    if (!v) throw new Error(`Missing required env var: ${key}`);
    return v;
  },
  bool(key: EnvKey, fallback = false): boolean {
    const v = read(key);
    if (v == null) return fallback;
    const lower = v.toLowerCase();
    return lower === "1" || lower === "true" || lower === "yes";
  },
};

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;
