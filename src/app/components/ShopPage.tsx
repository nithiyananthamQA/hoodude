import { ChevronRight, SlidersHorizontal, Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { products } from "./products";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useWishlist } from "../store/WishlistContext";
import { formatPrice } from "../utils/currency";
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
  const urlCategory = searchParams.get("category");
  
  const [activeCategory, setActiveCategory] = useState<string>(urlCategory ?? "all");
  const [activeSize, setActiveSize] = useState<string>("all");
  const [availability, setAvailability] = useState<string[]>([]);
  const [sort, setSort] = useState<SortId>("featured");
  
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();

  useEffect(() => {
    setActiveCategory(urlCategory ?? "all");
  }, [urlCategory]);

  const filtered = useMemo(() => {
    let base = [...products];

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
  }, [activeCategory, activeSize, availability, sort]);

  const resetFilters = () => {
    setActiveCategory("all");
    setActiveSize("all");
    setAvailability([]);
    setSearchParams({});
  };

  const toggleAvailability = (status: string) => {
    setAvailability(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [status]
    );
  };

  return (
    <div
      className="min-h-screen bg-white text-black selection:bg-[#fa5d42] selection:text-white"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
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

          <div className="flex items-end justify-between gap-6">
            <div>
              <h1
                className="text-[48px] md:text-[64px] text-[#0e0e0e] tracking-[-2px] leading-[1] capitalize"
                style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700 }}
              >
                {activeCategory === "all" ? "Our Collection" : activeCategory}
              </h1>
              <p className="text-[14px] text-black/40 mt-4 tracking-tight">
                Displaying {filtered.length} curated pieces available for order.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-black/40" />
                <span className="text-[13px] text-black/50 font-medium">Sort by</span>
                <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
                  <SelectTrigger
                    size="sm"
                    className="h-9 min-w-[180px] rounded-lg border-black/10 bg-white text-[13px] font-medium text-black shadow-sm hover:border-black/20 focus:ring-2 focus:ring-black/10 focus:ring-offset-0 data-[placeholder]:text-black/40"
                  >
                    <SelectValue placeholder="Featured" />
                  </SelectTrigger>
                  <SelectContent
                    align="end"
                    className="min-w-[200px] rounded-lg border-black/10 bg-white p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.id}
                        value={opt.id}
                        className="rounded-md px-2.5 py-2 text-[13px] font-medium text-black/70 data-[highlighted]:bg-black/5 data-[highlighted]:text-black data-[state=checked]:text-black focus:bg-black/5 focus:text-black"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <section className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-y border-black/5 px-5 md:px-10 py-5">
           <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                 {/* Categories Horizontal */}
                 <div className="flex items-center gap-2">
                    {["all", "round neck", "polo", "hoodie", "sweatshirt", "oversized"].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all capitalize ${
                          activeCategory === cat ? "bg-black text-white" : "text-black/40 hover:text-black"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>

                 <div className="w-px h-6 bg-black/5" />

                 {/* Sizes */}
                 <div className="flex items-center gap-1.5">
                    {["S", "M", "L", "XL", "XXL", "3XL"].map(sz => (
                      <button 
                        key={sz}
                        onClick={() => setActiveSize(sz === activeSize ? "all" : sz)}
                        className={`size-10 flex items-center justify-center rounded-full text-[11px] font-bold transition-all border ${
                          activeSize === sz ? "bg-black text-white border-black" : "bg-transparent text-black/20 border-black/5 hover:border-black/20"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                 </div>
                 
                 <div className="w-px h-6 bg-black/5" />

                 {/* Availability */}
                 <div className="flex items-center gap-2">
                    {["In stock", "Out of stock"].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => toggleAvailability(opt)}
                        className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all border ${
                          availability.includes(opt) ? "bg-black text-white border-black" : "bg-white text-black/40 border-black/5"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={resetFilters}
                className="text-[10px] font-bold tracking-widest uppercase text-[#fa5d42] hover:opacity-70 transition-all underline underline-offset-4"
              >
                Reset filters
              </button>
           </div>
        </section>

        {/* Full Width Grid */}
        <section className="px-5 md:px-10 py-12">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-[#fafafa] rounded-[32px] border border-black/5 mx-5 md:mx-10">
              <span className="text-[14px] text-black/40 font-medium tracking-tight">Zero matches found in this protocol.</span>
              <button
                onClick={resetFilters}
                className="mt-6 px-10 py-4 rounded-full bg-[#0e0e0e] text-white text-[13px] font-bold hover:bg-[#fa5d42] transition-all"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-16">
              {filtered.map((p, idx) => {
                const saved = inWishlist(p.id);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx % 5 * 0.05 }}
                    className="cursor-pointer group"
                    onClick={() => navigate(`/product?id=${p.id}`)}
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden mb-[20px] bg-[#f5f5f5] relative">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(p.id);
                        }}
                        className={`absolute top-4 right-4 size-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          saved
                            ? "bg-[#fa5d42] text-white"
                            : "bg-white/90 text-black hover:bg-[#fa5d42] hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <Heart
                          size={16}
                          className={saved ? "fill-white" : ""}
                        />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                         <h3 className="text-[16px] text-black tracking-tight font-medium line-clamp-2 leading-tight">
                           {p.name}
                         </h3>
                         <div className="flex items-center gap-1.5 mt-1">
                            {p.colors.slice(0, 3).map((c) => (
                              <div
                                key={c.name}
                                className="size-2 rounded-full border border-black/5"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                         </div>
                      </div>
                      <p className="text-[16px] text-black font-black tabular-nums">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
