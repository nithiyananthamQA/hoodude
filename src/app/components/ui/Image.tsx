import { useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt: string;
  /** Widths (px) used to build the srcset. Defaults cover phone → desktop → retina. */
  widths?: number[];
  /** Disable the soft fade-in (e.g. for above-the-fold hero images). */
  noFade?: boolean;
};

export const DEFAULT_WIDTHS = [400, 600, 800, 1200, 1600, 2000];

const UNSPLASH_HOST = "images.unsplash.com";
const SHOPIFY_HOST_RE = /(?:^|\.)cdn\.shopify\.com$/;

/**
 * Returns a width-rewritten URL for known image hosts. Unknown hosts get the
 * URL unchanged — they still work, they just don't get a srcset.
 */
export function resize(src: string, width: number): string {
  try {
    const url = new URL(src);
    if (url.hostname === UNSPLASH_HOST) {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", "80");
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      return url.toString();
    }
    if (SHOPIFY_HOST_RE.test(url.hostname)) {
      url.searchParams.set("width", String(width));
      return url.toString();
    }
    return src;
  } catch {
    return src;
  }
}

export function isTransformable(src: string): boolean {
  try {
    const host = new URL(src).hostname;
    return host === UNSPLASH_HOST || SHOPIFY_HOST_RE.test(host);
  } catch {
    return false;
  }
}

/**
 * Build a srcset string for the given source. Returns undefined for unknown
 * hosts (so the caller can omit srcSet entirely).
 */
export function buildSrcSet(src: string, widths: number[] = DEFAULT_WIDTHS): string | undefined {
  if (!isTransformable(src)) return undefined;
  return widths.map((w) => `${resize(src, w)} ${w}w`).join(", ");
}

export function Image({
  src,
  alt,
  widths = DEFAULT_WIDTHS,
  noFade,
  className,
  style,
  loading = "lazy",
  decoding = "async",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  onLoad,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const transformable = isTransformable(src);
  const srcSet = transformable
    ? widths.map((w) => `${resize(src, w)} ${w}w`).join(", ")
    : undefined;
  const finalSrc = transformable ? resize(src, widths[Math.floor(widths.length / 2)]) : src;

  return (
    <img
      {...rest}
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={className}
      style={
        noFade
          ? style
          : {
              ...style,
              transition: "opacity 280ms ease",
              opacity: loaded ? 1 : 0,
              backgroundColor: loaded ? undefined : "rgb(243 244 246)",
            }
      }
    />
  );
}

export default Image;
