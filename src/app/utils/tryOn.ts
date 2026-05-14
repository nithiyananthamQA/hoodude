import { env } from "./env";
import { geminiGenerateContent } from "./gemini";

export interface InlinePart {
  inlineData: { mimeType: string; data: string };
}

export interface TryOnInput {
  /** The user's photo (browser File from file input). */
  personFile: File;
  /** Public URL of the product image (Unsplash, Shopify CDN, etc.). */
  productUrl: string;
  /** Pre-encoded product image part. If provided, skips re-fetching the URL.
   *  Use `prefetchProductImage(url)` to warm this up while the user is
   *  picking their photo — shaves 1–2s off the perceived call time. */
  productImagePart?: InlinePart;
  /** Used to tune the prompt — different garments need different language. */
  productCategory?: string;
  /** Free-text product name for context. */
  productName?: string;
}

export interface TryOnResult {
  /** data:image/png;base64,... — drop directly into <img src>. */
  imageDataUrl: string;
  /** Optional model commentary, if Gemini returns it. */
  text?: string;
}

export const isAITryOnConfigured = () => Boolean(env.get("VITE_GEMINI_API_KEY"));

/**
 * Send the user's photo + the product image to Gemini 2.5 Flash Image and
 * ask the model to generate a "wearing this" composite. Returns the first
 * image part from the response.
 *
 * Notes / honest limits:
 * - Gemini's image edits are decent but not specialist (a dedicated VTON
 *   model like fal.ai's IDM-VTON is the gold standard). Quality varies by
 *   pose/lighting/garment type.
 * - We pass mime type and base64 inlineData rather than URL refs so the
 *   model definitely sees the bytes (no fetch dependency on Google's side).
 */
export async function generateTryOn({
  personFile,
  productUrl,
  productImagePart,
  productCategory,
  productName,
}: TryOnInput): Promise<TryOnResult> {
  // Use the pre-warmed product encoding when available; otherwise fetch + encode.
  const [personData, productData] = await Promise.all([
    fileToInlinePart(personFile),
    productImagePart ? Promise.resolve(productImagePart) : urlToInlinePart(productUrl),
  ]);

  const prompt = buildPrompt({ productCategory, productName });

  const parts = await geminiGenerateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, personData, productData],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 0.4,
    },
  });

  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) {
    const fallback = parts.find((p) => p.text)?.text;
    throw new Error(
      fallback
        ? `Try-on declined: ${fallback}`
        : "Gemini didn't return an image. Try a clearer full-body photo.",
    );
  }

  const text = parts.find((p) => p.text)?.text;
  return {
    imageDataUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    text,
  };
}

function buildPrompt(input: { productCategory?: string; productName?: string }): string {
  const garmentDescriptor = describeGarment(input.productCategory);
  const productLine = input.productName ? ` named "${input.productName}"` : "";
  return [
    // Set the role and the inputs explicitly — Gemini is more reliable when
    // it knows what each image is.
    `Task: virtual garment try-on.`,
    `Image 1: a real photo of a person (the customer).`,
    `Image 2: a reference photo of a ${garmentDescriptor}${productLine}. Treat the garment in image 2 as the source of color, fabric, pattern, print, cut, and details — IGNORE the model wearing it; the customer in image 1 should be the only person in the output.`,
    ``,
    `Goal: produce a single new photograph in which the customer (image 1) is wearing the exact garment (color, pattern, print, fit, length, neckline, sleeves, any graphic on it) from image 2.`,
    ``,
    `Strict requirements:`,
    `1. Keep the customer's face, hair, skin tone, body proportions, and pose 100% unchanged.`,
    `2. Keep the customer's original background, lighting direction, and camera angle 100% unchanged.`,
    `3. Replace whatever the customer is currently wearing on the relevant body region with the garment from image 2. Do not layer the garment on top of their existing clothing — replace it cleanly so it looks like they put it on.`,
    `4. The garment must drape and fit naturally on the customer's body — match shoulders, chest, sleeve length, hemline. Add realistic fabric folds and shadows that respect the customer's lighting.`,
    `5. If the garment in image 2 has a print, logo, or graphic, transfer it faithfully — same colors, same placement on the customer's body, same scale relative to chest size.`,
    `6. Match the photographic realism of image 1 — grain, color temperature, shadow softness. The result must look like a real photograph of the customer, not a 3D render or paste-on.`,
    `7. Do not add any new people, accessories, props, or background elements.`,
    ``,
    `Output: a single high-resolution image. No text, no caption, no watermark.`,
  ].join("\n");
}

function describeGarment(category?: string): string {
  switch (category) {
    case "Hoodies": return "hooded sweatshirt";
    case "T-Shirts": return "t-shirt";
    case "Polo": return "polo shirt";
    case "Shirts": return "button-up shirt";
    case "Jackets": return "jacket";
    case "Sweatshirts": return "sweatshirt";
    default: return "garment";
  }
}

async function fileToInlinePart(file: File): Promise<{ inlineData: { mimeType: string; data: string } }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return inlineDataFromDataUrl(dataUrl);
}

async function urlToInlinePart(url: string): Promise<InlinePart> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't fetch product image: ${res.status}`);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return inlineDataFromDataUrl(dataUrl);
}

/**
 * Fire this when the try-on modal opens — by the time the user has picked
 * their photo, the product image is already encoded and ready to ship to
 * Gemini. Returns null on failure so the caller can fall back to live fetch.
 */
export async function prefetchProductImage(url: string): Promise<InlinePart | null> {
  try {
    return await urlToInlinePart(url);
  } catch {
    return null;
  }
}

function inlineDataFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Failed to parse data URL.");
  return { inlineData: { mimeType: match[1], data: match[2] } };
}
