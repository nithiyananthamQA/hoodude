/**
 * Thin wrappers around remote endpoints that are only wired once the
 * corresponding VITE_* env var is set. Until then they resolve to a
 * "simulated success" so local demos still work.
 */

const endpoint = (key: string) =>
  (import.meta.env[key] as string | undefined)?.trim();

const safePost = async <T = unknown>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; data?: T; error?: string }> => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json().catch(() => null)) as T;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
};

export const subscribeNewsletter = async (email: string) => {
  const url = endpoint("VITE_NEWSLETTER_ENDPOINT");
  if (!url) {
    if (import.meta.env.DEV) {
      console.info("[newsletter] no VITE_NEWSLETTER_ENDPOINT — simulating success for", email);
    }
    return { ok: true as const };
  }
  return safePost(url, { email });
};

export const submitContact = async (payload: {
  name: string;
  email: string;
  message: string;
}) => {
  const url = endpoint("VITE_CONTACT_ENDPOINT");
  if (!url) {
    if (import.meta.env.DEV) {
      console.info("[contact] no VITE_CONTACT_ENDPOINT — simulating success");
    }
    return { ok: true as const };
  }
  return safePost(url, payload);
};

export const startCheckout = async (payload: {
  items: Array<{ id: string; qty: number }>;
  email?: string;
}) => {
  const url = endpoint("VITE_CHECKOUT_ENDPOINT");
  if (!url) {
    if (import.meta.env.DEV) {
      console.info("[checkout] no VITE_CHECKOUT_ENDPOINT — simulating success");
    }
    return { ok: true as const, url: "/checkout?demo=1" };
  }
  return safePost<{ url?: string }>(url, payload);
};
