/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_STORE_DOMAIN?: string;
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN?: string;
  readonly VITE_USE_SHOPIFY?: string;
  readonly VITE_ANALYTICS_ENABLED?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_NEWSLETTER_ENDPOINT?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_CHECKOUT_ENDPOINT?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_IMAGE_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "figma:asset/*" {
  const content: string;
  export default content;
}

// Google model-viewer custom element. Registered globally via the script
// tag in index.html. Surface as a JSX intrinsic with the props we use.
declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        "ios-src"?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "ar-placement"?: "floor" | "wall";
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string | number;
        exposure?: string | number;
        poster?: string;
        "environment-image"?: string;
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "interaction" | "manual";
      },
      HTMLElement
    >;
  }
}

interface HTMLModelViewerElement extends HTMLElement {
  activateAR: () => Promise<void>;
  canActivateAR: boolean;
}
