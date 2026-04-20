export type StockStatus = "Ready Stock" | "Make to Order";
export type FitType = "Regular" | "Oversized" | "Drop Shoulder";
export type NeckType = "Round Neck" | "Collar Neck" | "V-Neck" | "Hooded";
export type SizeCode = "S" | "M" | "L" | "XL" | "XXL";

export type PrintType =
  | "DTF"
  | "Vinyl"
  | "Screen - Plastisol"
  | "Screen - Khadi"
  | "Screen - High Density"
  | "Screen - CMYK"
  | "Screen - Pigment"
  | "All Over Print";

export interface ColorOption {
  name: string;
  hex: string;
  stock: StockStatus;
}

export interface SizeChartRow {
  size: SizeCode;
  chest: number;
  length: number;
}

export interface Product {
  id: string;
  name: string;
  category: "T-Shirts" | "Polo" | "Shirts" | "Hoodies" | "Jackets" | "Sweatshirts";
  fabric: string;
  gsm: number;
  fit: FitType;
  neck: NeckType;
  price: number;
  moq: number;
  sizes: SizeCode[];
  colors: ColorOption[];
  printing: PrintType[];
  sizeChart: SizeChartRow[];
  description: string;
  stock: StockStatus;
  image: string;
  gallery?: string[];
  modelPath?: string;
}

export interface PricingTier {
  rule: string;
  adjustment: number;
}

export const PRICING_TIERS: PricingTier[] = [
  { rule: "Below 50 pcs", adjustment: 10 },
  { rule: "50 – 100 pcs", adjustment: 0 },
  { rule: "Above 100 pcs", adjustment: -5 },
];

export const BULK_NOTES = {
  moq: "Bulk orders: minimum 25 pieces per color for custom printing.",
  mixSize: "Mix of sizes is allowed within the same color.",
  below50: "Orders below 50 pcs are charged an additional $10 per piece.",
  above100: "Orders above 100 pcs receive a $5 per piece bulk discount.",
};

export function priceFor(product: Product, quantity: number): number {
  if (quantity < 50) return product.price + 10;
  if (quantity > 100) return product.price - 5;
  return product.price;
}

const STANDARD_CHART: SizeChartRow[] = [
  { size: "S", chest: 38, length: 27 },
  { size: "M", chest: 40, length: 28 },
  { size: "L", chest: 42, length: 29 },
  { size: "XL", chest: 44, length: 30 },
  { size: "XXL", chest: 46, length: 31 },
];

const OVERSIZED_CHART: SizeChartRow[] = [
  { size: "S", chest: 42, length: 28 },
  { size: "M", chest: 44, length: 29 },
  { size: "L", chest: 46, length: 30 },
  { size: "XL", chest: 48, length: 31 },
  { size: "XXL", chest: 50, length: 32 },
];

const UNSPLASH = (id: string, w = 1000) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

export const products: Product[] = [
  {
    id: "round-neck-180",
    name: "Classic Round Neck Tee",
    category: "T-Shirts",
    fabric: "100% Cotton Bio Washed",
    gsm: 180,
    fit: "Regular",
    neck: "Round Neck",
    price: 145,
    moq: 25,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#0E0E0E", stock: "Ready Stock" },
      { name: "White", hex: "#FFFFFF", stock: "Ready Stock" },
      { name: "Navy", hex: "#0F1F3D", stock: "Ready Stock" },
      { name: "Olive", hex: "#4F5D2F", stock: "Make to Order" },
      { name: "Maroon", hex: "#5A1A1A", stock: "Make to Order" },
    ],
    printing: ["DTF", "Vinyl", "Screen - Plastisol", "Screen - Pigment", "All Over Print"],
    sizeChart: STANDARD_CHART,
    description:
      "Classic round-neck tee in bio-washed cotton — soft hand-feel, pre-shrunk, perfect for everyday wear and bulk branding.",
    stock: "Ready Stock",
    image: UNSPLASH("1521572163474-6864f9cf17ab"),
    gallery: [
      UNSPLASH("1521572163474-6864f9cf17ab"),
      UNSPLASH("1583743814966-8936f5b7be1a"),
      UNSPLASH("1618354691373-d851c5c3a990"),
    ],
    modelPath: "/3d/white-tshirt.glb",
  },
  {
    id: "oversized-220",
    name: "Oversized Drop Shoulder Tee",
    category: "T-Shirts",
    fabric: "PC Cotton (Poly-Cotton Blend)",
    gsm: 220,
    fit: "Oversized",
    neck: "Round Neck",
    price: 245,
    moq: 25,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Jet Black", hex: "#0A0A0A", stock: "Ready Stock" },
      { name: "Sand", hex: "#D6C6A8", stock: "Ready Stock" },
      { name: "Sage", hex: "#9AAE8E", stock: "Make to Order" },
      { name: "Lavender", hex: "#B6A5CE", stock: "Make to Order" },
    ],
    printing: [
      "DTF",
      "Vinyl",
      "Screen - Plastisol",
      "Screen - Khadi",
      "Screen - High Density",
      "Screen - CMYK",
      "All Over Print",
    ],
    sizeChart: OVERSIZED_CHART,
    description:
      "Heavy-weight 220 GSM oversized tee with drop shoulders and a relaxed boxy silhouette — the streetwear staple for premium brands.",
    stock: "Ready Stock",
    image: UNSPLASH("1576566588028-4147f3842f27"),
    gallery: [
      UNSPLASH("1576566588028-4147f3842f27"),
      UNSPLASH("1503341455253-b2e723bb3dbb"),
      UNSPLASH("1620799140408-edc6dcb6d633"),
    ],
    modelPath: "/3d/white-tshirt.glb",
  },
  {
    id: "polo-collar-200",
    name: "Matty Pique Polo",
    category: "Polo",
    fabric: "Matty Pique 100% Cotton",
    gsm: 200,
    fit: "Regular",
    neck: "Collar Neck",
    price: 225,
    moq: 25,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#FFFFFF", stock: "Ready Stock" },
      { name: "Navy", hex: "#142850", stock: "Ready Stock" },
      { name: "Bottle Green", hex: "#065535", stock: "Make to Order" },
      { name: "Royal Blue", hex: "#1F4FB0", stock: "Make to Order" },
    ],
    printing: ["DTF", "Vinyl", "Screen - Plastisol", "Screen - Pigment"],
    sizeChart: STANDARD_CHART,
    description:
      "Corporate-ready polo in matty pique — breathable, structured collar, clean finish. Ideal for uniforms and brand merchandise.",
    stock: "Ready Stock",
    image: UNSPLASH("1586363104862-3a5e2ab60d99"),
    gallery: [
      UNSPLASH("1586363104862-3a5e2ab60d99"),
      UNSPLASH("1624378439575-d8705ad7ae80"),
      UNSPLASH("1620012253295-c15cc3e65df4"),
    ],
  },
  {
    id: "hoodie-fleece-320",
    name: "Premium Fleece Hoodie",
    category: "Hoodies",
    fabric: "Brushed Fleece (Cotton-Poly)",
    gsm: 320,
    fit: "Oversized",
    neck: "Hooded",
    price: 545,
    moq: 25,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Charcoal", hex: "#2B2B2B", stock: "Ready Stock" },
      { name: "Beige", hex: "#D7C4A3", stock: "Ready Stock" },
      { name: "Forest", hex: "#1F3A2E", stock: "Make to Order" },
      { name: "Mustard", hex: "#C99A2E", stock: "Make to Order" },
    ],
    printing: [
      "DTF",
      "Vinyl",
      "Screen - Plastisol",
      "Screen - High Density",
      "Screen - CMYK",
      "All Over Print",
    ],
    sizeChart: OVERSIZED_CHART,
    description:
      "320 GSM brushed fleece hoodie with a plush inner loop, kangaroo pocket and reinforced drawcord hood — built for winter drops.",
    stock: "Make to Order",
    image: UNSPLASH("1556821840-3a63f95609a7"),
    gallery: [
      UNSPLASH("1556821840-3a63f95609a7"),
      UNSPLASH("1552374196-c4e7ffc6e126"),
      UNSPLASH("1620799140188-3b2a02fd9a77"),
    ],
    modelPath: "/3d/hood.glb",
  },
  {
    id: "zipper-hoodie-340",
    name: "Full-Zip Tech Hoodie",
    category: "Hoodies",
    fabric: "Brushed Fleece with YKK Zip",
    gsm: 340,
    fit: "Regular",
    neck: "Hooded",
    price: 645,
    moq: 25,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Jet Black", hex: "#0A0A0A", stock: "Ready Stock" },
      { name: "Off White", hex: "#F2F0EA", stock: "Ready Stock" },
      { name: "Storm Grey", hex: "#54595F", stock: "Make to Order" },
      { name: "Deep Navy", hex: "#15223A", stock: "Make to Order" },
    ],
    printing: [
      "DTF",
      "Vinyl",
      "Screen - Plastisol",
      "Screen - High Density",
      "All Over Print",
    ],
    sizeChart: OVERSIZED_CHART,
    description:
      "Full-zip hoodie with a clean technical silhouette — metal YKK zip, lined hood with contrast drawcords, and ribbed cuffs. A modern staple for capsule drops.",
    stock: "Ready Stock",
    image: UNSPLASH("1620799140408-edc6dcb6d633"),
    gallery: [
      UNSPLASH("1620799140408-edc6dcb6d633"),
      UNSPLASH("1614093302611-8efc4de12407"),
      UNSPLASH("1578587018452-892bacefd3f2"),
    ],
    modelPath: "/3d/zipper-hood.glb",
  },
  {
    id: "dropshoulder-300",
    name: "Drop Shoulder Sweatshirt",
    category: "Sweatshirts",
    fabric: "Terry Cotton Loopknit",
    gsm: 300,
    fit: "Drop Shoulder",
    neck: "Round Neck",
    price: 425,
    moq: 25,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Stone", hex: "#B7B2A6", stock: "Ready Stock" },
      { name: "Black", hex: "#0E0E0E", stock: "Ready Stock" },
      { name: "Rust", hex: "#B5552A", stock: "Make to Order" },
    ],
    printing: [
      "DTF",
      "Screen - Plastisol",
      "Screen - Khadi",
      "Screen - High Density",
      "All Over Print",
    ],
    sizeChart: OVERSIZED_CHART,
    description:
      "Loopknit terry sweatshirt with a relaxed drop-shoulder silhouette — ideal base garment for heavyweight streetwear labels.",
    stock: "Ready Stock",
    image: UNSPLASH("1572495641004-28421ae29ed4"),
    gallery: [
      UNSPLASH("1572495641004-28421ae29ed4"),
      UNSPLASH("1620799140408-edc6dcb6d633"),
      UNSPLASH("1614093302611-8efc4de12407"),
    ],
  },
  {
    id: "knitted-varsity-500",
    name: "Knitted Varsity Jacket",
    category: "Jackets",
    fabric: "Chunky Cable-Knit Wool Blend",
    gsm: 500,
    fit: "Regular",
    neck: "Collar Neck",
    price: 895,
    moq: 20,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Cream", hex: "#EFE7D6", stock: "Ready Stock" },
      { name: "Camel", hex: "#B08657", stock: "Ready Stock" },
      { name: "Charcoal", hex: "#323232", stock: "Make to Order" },
    ],
    printing: ["DTF", "Vinyl", "Screen - Plastisol"],
    sizeChart: STANDARD_CHART,
    description:
      "Heavyweight cable-knit varsity jacket with ribbed hem and cuffs — archival silhouette reinterpreted in a chunky wool blend.",
    stock: "Make to Order",
    image: UNSPLASH("1551028719-00167b16eac5"),
    gallery: [
      UNSPLASH("1551028719-00167b16eac5"),
      UNSPLASH("1548883354-94bcfe321cbb"),
      UNSPLASH("1614093302611-8efc4de12407"),
    ],
    modelPath: "/3d/knitted-jacket.glb",
  },
  {
    id: "flannel-shirt-180",
    name: "Checkered Flannel Shirt",
    category: "Shirts",
    fabric: "Brushed Cotton Twill",
    gsm: 180,
    fit: "Regular",
    neck: "Collar Neck",
    price: 345,
    moq: 30,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Red/Black", hex: "#8B0000", stock: "Ready Stock" },
      { name: "Green/Navy", hex: "#004D40", stock: "Ready Stock" },
    ],
    printing: ["DTF", "Vinyl"],
    sizeChart: STANDARD_CHART,
    description:
      "Soft brushed cotton flannel with a classic checkered pattern. Double-needle stitching and button-down collar.",
    stock: "Ready Stock",
    image: UNSPLASH("1596755094514-f87e34085b2c"),
    gallery: [
      UNSPLASH("1596755094514-f87e34085b2c"),
      UNSPLASH("1620799140188-3b2a02fd9a77"),
      UNSPLASH("1503341455253-b2e723bb3dbb"),
    ],
  },
  {
    id: "bomber-jacket-350",
    name: "Urban Stealth Bomber",
    category: "Jackets",
    fabric: "Water-Resistant Nylon",
    gsm: 350,
    fit: "Regular",
    neck: "Round Neck",
    price: 745,
    moq: 20,
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Olive Drab", hex: "#3B4232", stock: "Ready Stock" },
      { name: "Pitch Black", hex: "#000000", stock: "Ready Stock" },
    ],
    printing: ["DTF", "Vinyl"],
    sizeChart: STANDARD_CHART,
    description:
      "Minimalist bomber jacket with orange inner lining, utility arm pocket and ribbed cuffs. Water-resistant and wind-proof.",
    stock: "Make to Order",
    image: UNSPLASH("1548883354-94bcfe321cbb"),
    gallery: [
      UNSPLASH("1548883354-94bcfe321cbb"),
      UNSPLASH("1551028719-00167b16eac5"),
      UNSPLASH("1578587018452-892bacefd3f2"),
    ],
  },
];

export function findProduct(id: string | null | undefined): Product {
  return products.find((p) => p.id === id) ?? products[0];
}
