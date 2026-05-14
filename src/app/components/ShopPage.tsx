import { ChevronRight, Check } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { products } from "./products";
import SiteHeader from "./SiteHeader";
import PageHead, { itemListSchema, breadcrumbSchema } from "./PageHead";
import SiteFooter from "./SiteFooter";
import { useWishlist } from "../store/WishlistContext";
import ProductCard from "./ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ShopPageProps {
  onOpenCart: () => void;
}

type SortId = "featured" | "priceAsc" | "priceDesc" | "newest";

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "priceAsc", label: "Price: Low to High" },
  { id: "priceDesc", label: "Price: High to Low" },
  { id: "newest", label: "Newest" },
];

export default function ShopPage({ onOpenCart }: ShopPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "all";
  const activeSize = searchParams.get("size") ?? "all";
  const inStockOnly = searchParams.get("stock") === "in";
  const sort = (searchParams.get("sort") as SortId) ?? "featured";
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const availability = inStockOnly ? ["In stock"] : [];

  const updateParams = (next: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        Object.entries(next).forEach(([k, v]) => {
          if (v === null || v === "" || v === "all") params.delete(k);
          else params.set(k, v);
        });
        return params;
      },
      { replace: true }
    );
  };

  const setActiveCategory = (cat: string) => updateParams({ category: cat });
  const setActiveSize = (sz: string) => updateParams({ size: sz });
  const setSort = (s: SortId) => updateParams({ sort: s === "featured" ? null : s });

  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();

  const filtered = useMemo(() => {
    let base = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.neck.toLowerCase().includes(q) ||
        p.fit.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== "all") {
       base = base.filter(p => {
         const cat = activeCategory.toLowerCase();
         if (cat === "round neck") return p.neck === "Round Neck";
         if (cat === "polo") return p.category === "Polo";
         if (cat === "hoodie") return p.category === "Hoodies";
         if (cat === "sweatshirt") return p.category === "Sweatshirts";
         if (cat === "oversized") return p.fit === "Oversized";
         return p.category.toLowerCase().includes(cat);
       });
    }

    if (activeSize !== "all") {
       base = base.filter(p => p.sizes.includes(activeSize as any));
    }

    if (availability.length > 0) {
      base = base.filter(p => {
        if (availability.includes("In stock")) return p.stock === "Ready Stock";
        if (availability.includes("Out of stock")) return p.stock === "Make to Order";
        return true;
      });
    }

    if (sort === "priceAsc") base.sort((a, b) => a.price - b.price);
    else if (sort === "priceDesc") base.sort((a, b) => b.price - a.price);
    else if (sort === "newest") base.reverse();
    return base;
  }, [activeCategory, activeSize, availability, sort, searchQuery]);

  const resetFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const toggleAvailability = (_status: string) => {
    updateParams({ stock: inStockOnly ? null : "in" });
  };

  return (
    <div
      className="min-h-screen bg-white text-black selection:bg-brand selection:text-white"
     
    >
      <PageHead
        title={activeCategory === "all" ? "Shop" : activeCategory.replace(/^\w/, (c) => c.toUpperCase())}
        description={`Browse ${filtered.length} pieces from the HOODUDE collection.`}
        canonical={activeCategory === "all" ? "/shop" : `/shop?category=${encodeURIComponent(activeCategory)}`}
        jsonLd={[
          itemListSchema({
            name: activeCategory === "all" ? "HOODUDE Collection" : activeCategory,
            items: filtered.slice(0, 24).map((p) => ({
              name: p.name,
              path: `/product/${p.id}`,
              image: p.image,
              price: p.price,
            })),
          }),
          breadcrumbSchema(
            activeCategory === "all"
              ? [
                  { name: "Home", path: "/" },
                  { name: "Shop", path: "/shop" },
                ]
              : [
                  { name: "Home", path: "/" },
                  { name: "Shop", path: "/shop" },
                  { name: activeCategory, path: `/shop?category=${encodeURIComponent(activeCategory)}` },
                ]
          ),
        ]}
      />
      <SiteHeader onOpenCart={onOpenCart} />

      <main className="w-full pt-12 pb-24">
        {/* Breadcrumbs & Title */}
        <div className="px-5 md:px-10 mb-12">
          <div className="flex items-center gap-2 text-[13px] text-black/40 mb-10">
            <button onClick={() => navigate("/")} className="hover:text-black transition-colors">
              Home
            </button>
            <ChevronRight size={14} className="text-black/20" />
            <span className="text-black font-medium">Shop</span>
          </div>

          {searchQuery && (
            <div className="mb-6 flex items-center gap-3 text-[13px]">
              <span className="text-black/50">Search results for</span>
              <span className="px-3 h-7 inline-flex items-center rounded-full bg-black text-white font-medium">
                "{searchQuery}"
              </span>
              <button
                onClick={() => updateParams({ q: null })}
                className="text-black/50 hover:text-black underline underline-offset-4"
              >
                Clear search
              </button>
            </div>
          )}

          <div className="flex items-end justify-between gap-6">
            <div>
              <h1
                className="text-[48px] md:text-[64px] text-ink tracking-[-2px] leading-[1] capitalize"
                style={{ fontWeight: 600 }}
              >
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : activeCategory === "all"
                    ? "Our Collection"
                    : activeCategory}
              </h1>
              <p className="text-[14px] text-black/40 mt-4 tracking-tight">
                Displaying {filtered.length} curated pieces available for order.
              </p>
            </div>
            
            <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
              <SelectTrigger className="!h-auto !w-auto !min-w-0 !border-0 !bg-transparent !shadow-none !rounded-none !px-0 !py-1 !gap-1.5 text-[13px] font-medium text-black/65 hover:text-black focus:!ring-0 focus-visible:!ring-0 data-[state=open]:text-black">
                <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-black/40">Sort by</span>
                  <SelectValue placeholder="Featured" />
                </span>
              </SelectTrigger>
              <SelectContent
                align="end"
                sideOffset={10}
                className="min-w-[220px] rounded-2xl border-black/10 bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.16)]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.id}
                    value={opt.id}
                    className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-black/65 cursor-pointer data-[highlighted]:bg-black/5 data-[highlighted]:text-black data-[state=checked]:bg-black data-[state=checked]:text-white focus:bg-black/5 focus:text-black"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Global Filter Bar */}
        <section className="sticky top-20 z-40 bg-white/85 backdrop-blur-md border-y border-black/5 px-5 md:px-10 py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            {/* Categories — primary nav */}
            <div className="flex flex-wrap items-center gap-1">
              {["all", "round neck", "polo", "hoodie", "sweatshirt", "oversized"].map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors capitalize ${
                      isActive
                        ? "bg-black text-white"
                        : "text-black/55 hover:text-black hover:bg-black/[0.04]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Refinements — quiet right cluster */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35 mr-2.5">
                  Size
                </span>
                {["S", "M", "L", "XL", "XXL", "3XL"].map((sz) => {
                  const isActive = activeSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setActiveSize(sz === activeSize ? "all" : sz)}
                      className={`size-11 md:size-9 flex items-center justify-center rounded-full text-[12px] md:text-[11px] font-semibold transition-colors ${
                        isActive
                          ? "bg-black text-white"
                          : "text-black/45 hover:bg-black/[0.06] hover:text-black"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => toggleAvailability("In stock")}
                className={`flex items-center gap-2 h-9 px-3.5 rounded-full text-[12px] font-medium transition-colors ${
                  availability.includes("In stock")
                    ? "bg-black text-white"
                    : "text-black/55 hover:bg-black/[0.04] hover:text-black"
                }`}
              >
                {availability.includes("In stock") && (
                  <Check size={12} strokeWidth={2.5} />
                )}
                In stock only
              </button>

              <button
                onClick={resetFilters}
                className="text-[12px] font-medium text-black/40 hover:text-black transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Full Width Grid */}
        <section className="px-5 md:px-10 py-12">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-[#f5f5f5] rounded-[32px] border border-black/5 mx-5 md:mx-10">
              <span className="text-[14px] text-black/40 font-medium tracking-tight">Zero matches found in this protocol.</span>
              <button
                onClick={resetFilters}
                className="mt-6 px-10 py-4 rounded-full bg-ink text-white text-[13px] font-semibold hover:bg-brand transition-all"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-16">
              {filtered.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx % 5) * 0.05 }}
                >
                  <ProductCard
                    variant="shop"
                    product={p}
                    saved={inWishlist(p.id)}
                    onClick={() => navigate(`/product/${p.id}`)}
                    onToggleSave={() => toggleWishlist(p.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
