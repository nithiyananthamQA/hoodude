import { env } from "./env";

/**
 * Centralized Gemini image-model resolution. Google has renamed this model
 * twice already (preview → preview-image-generation → flash-image); centralizing
 * here means every renamed-again incident is a single-file fix. Both tryOn
 * and generateDesign call through here.
 *
 * Resolution order:
 *   1. VITE_GEMINI_IMAGE_MODEL env override (escape hatch when Google renames)
 *   2. Hardcoded fallback chain — try each until one returns non-404
 */
const MODEL_FALLBACKS = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-image-preview",
] as const;

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> } }>;
}

export interface GeminiImagePart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

/**
 * Make a generateContent call against the Gemini image model. Tries the env
 * override first, then walks the fallback chain on 404.
 *
 * Failure handling, in order:
 *   - 404 on a candidate → silently try the next model
 *   - 429 (rate limit) → parse retryDelay from the body; if < 15s, sleep and
 *     retry once. Otherwise throw a humanized "try in N seconds" message.
 *   - Any other error → throw a short, human-readable message. The raw API
 *     JSON never touches the UI.
 */
export async function geminiGenerateContent(body: object): Promise<GeminiImagePart[]> {
  const apiKey = env.get("VITE_GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("AI is not configured for this site yet.");
  }

  const override = env.get("VITE_GEMINI_IMAGE_MODEL");
  const candidates = override ? [override, ...MODEL_FALLBACKS] : [...MODEL_FALLBACKS];

  for (const model of candidates) {
    const url = `${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await callOnce(url, body, /* allowRetry */ true);

    // 404 → wrong model name, try the next candidate
    if (res === "MODEL_404") continue;

    return res;
  }

  throw new Error("AI service is briefly unavailable. Try again in a moment.");
}

/**
 * Single Gemini call with built-in 429 retry. Returns either the parts array,
 * or the sentinel "MODEL_404" so the outer loop knows to advance.
 */
async function callOnce(
  url: string,
  body: object,
  allowRetry: boolean,
): Promise<GeminiImagePart[] | "MODEL_404"> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 404) return "MODEL_404";

  if (res.status === 429) {
    const text = await res.text().catch(() => "");
    const retryMs = parseRetryDelayMs(text);
    if (allowRetry && retryMs != null && retryMs < 15_000) {
      await sleep(retryMs + 250);
      return callOnce(url, body, /* allowRetry */ false);
    }
    const seconds = retryMs ? Math.ceil(retryMs / 1000) : null;
    throw new Error(
      seconds
        ? `Too many requests right now — try again in ${seconds}s.`
        : "Too many requests right now — try again in a moment.",
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error("AI service authorization failed. Check the API key in .env.local.");
  }

  if (!res.ok) {
    if (res.status >= 500) {
      throw new Error("AI service is busy. Try again in a moment.");
    }
    throw new Error("Couldn't reach the AI service. Try again.");
  }

  const json = (await res.json()) as GeminiResponse;
  return json?.candidates?.[0]?.content?.parts ?? [];
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Pull the retryDelay (in milliseconds) out of a Gemini 429 body. Body shape:
 * { error: { details: [..., { "@type": "...RetryInfo", retryDelay: "11s" }] } }
 */
function parseRetryDelayMs(rawBody: string): number | null {
  try {
    const json = JSON.parse(rawBody);
    const details: Array<{ "@type"?: string; retryDelay?: string }> =
      json?.error?.details ?? [];
    const retryInfo = details.find((d) => d["@type"]?.includes("RetryInfo"));
    if (!retryInfo?.retryDelay) return null;
    const match = retryInfo.retryDelay.match(/^(\d+(?:\.\d+)?)s$/);
    if (!match) return null;
    return Math.ceil(parseFloat(match[1]) * 1000);
  } catch {
    return null;
  }
}
