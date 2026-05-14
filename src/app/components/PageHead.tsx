import { Helmet } from "react-helmet-async";

interface PageHeadProps {
  title: string;
  description?: string;
  /** OG image URL — absolute or root-relative. Defaults to brand image. */
  image?: string;
  /** Page type for OG (`website` for most, `product` for PDP). */
  type?: "website" | "product" | "article";
  /** Canonical path (e.g. `/shop`). Auto-resolves to absolute. */
  canonical?: string;
  /** Inline JSON-LD object(s). Stringified into a script tag. */
  jsonLd?: object | object[];
  /** Set to true for pages that shouldn't be indexed (e.g. account, checkout). */
  noindex?: boolean;
}

const SITE_NAME = "HOODUDE";
const DEFAULT_OG_IMAGE = "/hero-team.png";

const origin = (() => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
})();

const absolute = (path: string) => {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function PageHead({
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  canonical,
  jsonLd,
  noindex,
}: PageHeadProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
  const ogImage = absolute(image);
  const url = canonical ? absolute(canonical) : (typeof window !== "undefined" ? window.location.href : "");
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {url && <link rel="canonical" href={url} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {/* Structured data */}
      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

/**
 * Build a Schema.org Product JSON-LD object. Pass to PageHead's jsonLd prop.
 */
export function productSchema(input: {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  currency?: string;
  sku?: string;
  brand?: string;
  url?: string;
  inStock?: boolean;
}): object {
  const images = Array.isArray(input.image) ? input.image : [input.image];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: images.map(absolute),
    brand: { "@type": "Brand", name: input.brand ?? SITE_NAME },
    sku: input.sku,
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency ?? "USD",
      availability: input.inStock === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: input.url ? absolute(input.url) : undefined,
    },
  };
}

/**
 * Build a Schema.org BreadcrumbList JSON-LD. Items are ordered top → leaf.
 */
export function breadcrumbSchema(items: Array<{ name: string; path: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

/**
 * Site-wide brand identity. Mount once (typically on the homepage). Powers
 * Google's Knowledge Panel and merchant verification.
 */
export function organizationSchema(input: {
  legalName?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactEmail?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: input.legalName ?? SITE_NAME,
    url: origin || undefined,
    logo: input.logo ? absolute(input.logo) : absolute("/image.png"),
    description: input.description,
    sameAs: input.sameAs,
    contactPoint: input.contactEmail
      ? {
          "@type": "ContactPoint",
          email: input.contactEmail,
          contactType: "customer support",
        }
      : undefined,
  };
}

/**
 * WebSite schema with optional SearchAction. With SearchAction, Google can
 * render a sitelinks search box for branded queries.
 */
export function websiteSchema(input: {
  searchUrlTemplate?: string;
} = {}): object {
  const search = input.searchUrlTemplate;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: origin || undefined,
    potentialAction: search
      ? {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: absolute(search) },
          "query-input": "required name=search_term_string",
        }
      : undefined,
  };
}

/**
 * Schema.org ItemList for catalog/collection pages. Each item is summarized.
 */
export function itemListSchema(input: {
  name: string;
  items: Array<{ name: string; path: string; image?: string; price?: number }>;
  currency?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListElement: input.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(item.path),
      name: item.name,
      image: item.image ? absolute(item.image) : undefined,
      offers: item.price !== undefined
        ? {
            "@type": "Offer",
            price: item.price,
            priceCurrency: input.currency ?? "USD",
          }
        : undefined,
    })),
  };
}
