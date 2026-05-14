export const NAV_CATEGORIES = [
  "T-Shirts",
  "Shirts",
  "Polo",
  "Hoodies",
  "Sweatshirts",
  "Jackets",
] as const;

export type NavCategory = (typeof NAV_CATEGORIES)[number];

export const categoryHref = (cat: NavCategory | string) =>
  `/shop?category=${encodeURIComponent(cat)}`;
