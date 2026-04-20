import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Search, Heart, ShoppingBag, User, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../store/CartContext";
import { useWishlist } from "../store/WishlistContext";
import { useAuth } from "../store/AuthContext";
import { products } from "./products";

interface SiteHeaderProps {
  onOpenCart: () => void;
}

const NAV_CATEGORIES = ["T-Shirts", "Shirts", "Polo", "Hoodies", "Sweatshirts", "Jackets"];

export default function SiteHeader({ onOpenCart }: SiteHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCatalogue = location.pathname === "/shop";
  
  const { itemCount } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const results = query.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <>
      <header className="sticky top-0 z-[90] bg-white/80 backdrop-blur-xl border-b border-black/5 h-[76px] flex items-center">
        <div className="relative flex items-center justify-between w-full px-8">
          
          {/* Nav & Logo Left-aligned block */}
          <div className="flex items-center h-full">
             <AnimatePresence mode="popLayout">
               {!isCatalogue && (
                  <motion.nav 
                    initial={{ opacity: 0, filter: "blur(4px)", x: -20 }}
                    animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                    exit={{ opacity: 0, filter: "blur(4px)", x: -20 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center gap-1.5 mr-10 relative"
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {NAV_CATEGORIES.map((item) => (
                      <button
                        key={item}
                        onMouseEnter={() => setHoveredItem(item)}
                        onClick={() => navigate(`/shop?category=${encodeURIComponent(item)}`)}
                        className={`relative px-4 py-2 text-[12px] font-bold tracking-tight transition-colors duration-300 ${
                          hoveredItem === item ? "text-black" : "text-black/40"
                        }`}
                      >
                        <span className="relative z-10">{item}</span>
                        {hoveredItem === item && (
                          <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 bg-black/5 rounded-full"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </motion.nav>
               )}
             </AnimatePresence>

             {/* Smart Animated Logo */}
             <motion.div
               layout
               transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
               className={`flex items-center cursor-pointer z-10 ${
                 isCatalogue ? "relative" : "absolute left-1/2 -translate-x-1/2"
               }`}
               onClick={() => navigate("/")}
             >
               <img alt="HOODUDE" className="h-[42px] brightness-0" src="/image.png" />
             </motion.div>
          </div>

          {/* Actions - Right aligned */}
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="group relative p-2.5 text-black hover:bg-black/5 rounded-full transition-all cursor-pointer"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => navigate("/wishlist")}
              aria-label="Wishlist"
              className="group relative p-2.5 text-black hover:bg-black/5 rounded-full transition-all cursor-pointer"
            >
              <Heart size={20} strokeWidth={1.5} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white leading-none">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              aria-label="Cart"
              className="group relative p-2.5 text-black hover:bg-black/5 rounded-full transition-all cursor-pointer"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#fa5d42] text-[10px] font-bold text-white shadow ring-2 ring-white leading-none">
                  {itemCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 bg-black/10 mx-2" />

            <button
              onClick={() => navigate(isAuthenticated ? "/account" : "/login")}
              className="group flex items-center gap-2 p-1 pl-1 pr-3 text-black hover:bg-black hover:text-white border border-black/5 hover:border-black rounded-full transition-all cursor-pointer"
            >
              <div className="size-8 rounded-full bg-black/5 group-hover:bg-white/20 flex items-center justify-center overflow-hidden">
                <User size={18} strokeWidth={2} />
              </div>
              <span className="text-[13px] font-bold">
                {isAuthenticated ? user?.name.split(" ")[0] : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col"
          >
            <div className="flex items-center gap-4 px-8 py-6 border-b border-black/5">
              <Search size={22} strokeWidth={1.5} className="text-black/40" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search catalog specimens…"
                className="flex-1 text-[18px] bg-transparent outline-none font-medium text-black"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center"
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              {!query.trim() && (
                <div className="max-w-[720px] mx-auto">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 mb-4">
                    Quick Access
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {NAV_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/shop?category=${encodeURIComponent(c)}`);
                        }}
                        className="px-4 py-2 rounded-full border border-black/10 text-[13px] font-medium hover:border-black transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {query.trim() && results.length === 0 && (
                <div className="text-center py-20 text-black/40 text-[14px]">
                  No results for "{query}"
                </div>
              )}

              {results.length > 0 && (
                <div className="max-w-[720px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                        navigate(`/product?id=${p.id}`);
                      }}
                      className="text-left group"
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#f5f5f5] mb-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <p className="text-[13px] font-medium leading-tight">{p.name}</p>
                      <p className="text-[12px] text-[#fa5d42] font-semibold">{formatPrice(p.price)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
