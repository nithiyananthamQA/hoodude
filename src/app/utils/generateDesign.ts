import { env } from "./env";
import { geminiGenerateContent } from "./gemini";

export interface DesignGenInput {
  prompt: string;
  /** Optional category context (e.g. "Hoodies") to nudge composition. */
  category?: string;
  /** Placement slot — "chest_left", "back", etc. — affects the prompt so the
   *  composition fits the area. */
  placement?: string;
}

export interface DesignGenResult {
  imageDataUrl: string;
  text?: string;
  /** Which provider actually returned the image — useful for analytics. */
  source: "gemini" | "pollinations";
}

/**
 * Always true — even when Gemini's key is missing or its quota is exhausted,
 * we fall back to Pollinations.ai which is free and key-less. The prompt bar
 * is always usable.
 */
export const isDesignGenConfigured = () => true;

/**
 * Once Gemini errors (quota, auth, anything), we don't retry it for the rest
 * of this session — it's near-certainly going to error again. Pollinations
 * takes over silently. State is module-scoped so it persists across calls
 * within the SPA but resets on full page reload (in case quota recovers).
 */
let geminiBlockedThisSession = false;

/**
 * Text-to-image. Tries Gemini first (best quality when paid quota is
 * available), falls back to Pollinations.ai (free Stable Diffusion-based
 * service, no API key needed) the instant Gemini fails. The user never sees
 * the failure path — the AI bar just produces an image.
 */
export async function generateDesign(input: DesignGenInput): Promise<DesignGenResult> {
  if (!geminiBlockedThisSession && env.get("VITE_GEMINI_API_KEY")) {
    try {
      return await viaGemini(input);
    } catch (err) {
      // Block Gemini for this session — its quota is exhausted, the key is
      // bad, or the model name is gone. Pollinations from here on out.
      geminiBlockedThisSession = true;
      if (import.meta.env.DEV) {
        console.info("[design] gemini unavailable, switching to pollinations:", err instanceof Error ? err.message : err);
      }
    }
  }
  return viaPollinations(input);
}

async function viaGemini({ prompt, category, placement }: DesignGenInput): Promise<DesignGenResult> {
  const fullPrompt = buildPrompt(prompt, category, placement);
  const parts = await geminiGenerateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 0.8,
    },
  });
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) {
    const fallback = parts.find((p) => p.text)?.text;
    throw new Error(fallback || "No image returned.");
  }
  return {
    imageDataUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    text: parts.find((p) => p.text)?.text,
    source: "gemini",
  };
}

async function viaPollinations({ prompt, category, placement }: DesignGenInput): Promise<DesignGenResult> {
  const fullPrompt = buildPrompt(prompt, category, placement);
  const url = pollinationsUrl(fullPrompt, {
    width: 1024,
    height: 1024,
    seed: Math.floor(Math.random() * 1_000_000),
  });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Couldn't generate that. Try a different prompt.");
  }
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("Couldn't generate that. Try a different prompt.");
  }
  const dataUrl = await blobToDataUrl(blob);
  return { imageDataUrl: dataUrl, source: "pollinations" };
}

/**
 * Build a Pollinations.ai image URL for the given prompt + seed. Centralized
 * so both the live design generator and the Stock library go through one
 * place — single point to swap host or add params.
 */
export function pollinationsUrl(
  prompt: string,
  options: { width?: number; height?: number; seed?: number; model?: string } = {},
): string {
  const params = new URLSearchParams({
    width: String(options.width ?? 512),
    height: String(options.height ?? 512),
    model: options.model ?? "flux",
    seed: String(options.seed ?? Math.floor(Math.random() * 1_000_000)),
    nologo: "true",
    private: "true",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildPrompt(userPrompt: string, category?: string, placement?: string): string {
  const sizeNote = placementSizeHint(placement);
  return [
    `A clean, print-ready graphic design for ${category ? category.toLowerCase() : "apparel"}.`,
    `Concept: ${userPrompt.trim()}.`,
    `An isolated graphic only — no model, no garment, no person.`,
    `Centered composition with breathing room around the edges. ${sizeNote}`,
    `Solid white background.`,
    `High contrast, bold silhouette, suitable for screen-print or DTG.`,
    `Square aspect ratio.`,
  ].join(" ");
}

function placementSizeHint(placement?: string): string {
  if (!placement) return "";
  if (placement.includes("chest_left") || placement.includes("sleeve")) {
    return "Compact — small placement, must read as a tight badge or icon.";
  }
  if (placement === "large_center" || placement === "back") {
    return "Bold — large placement, the design can fill the area with detail.";
  }
  if (placement.startsWith("label")) {
    return "Minimal — label-sized placement; treat as a tiny logo lockup.";
  }
  return "";
}
