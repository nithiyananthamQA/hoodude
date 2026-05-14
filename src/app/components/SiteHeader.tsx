import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Search, Heart, ShoppingBag, User, X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../store/CartContext";
import { useWishlist } from "../store/WishlistContext";
import { useAuth } from "../store/AuthContext";
import { products } from "./products";
import { formatPrice } from "../utils/currency";
import { NAV_CATEGORIES, categoryHref } from "../utils/nav";
import { track } from "../utils/analytics";
import Image from "./ui/Image";

interface SiteHeaderProps {
  onOpenCart: () => void;
}

export default function SiteHeader({ onOpenCart }: SiteHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCatalogue = location.pathname === "/shop";
  
  const { itemCount } = useCart();
  const { ids: wishlistIds, openWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Debounce-track the search query so we don't fire one event per keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const t = setTimeout(() => {
      track("search", { query: trimmed, query_length: trimmed.length });
    }, 600);
    return () => clearTimeout(t);
  }, [query]);

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
      <header className="sticky top-0 z-[90] bg-white border-b border-black/5 h-[76px] flex items-center">
        <div className="relative flex items-center justify-between w-full px-8">
          
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="md:hidden p-2.5 text-black hover:bg-black/5 rounded-full transition-colors"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          {/* Nav & Logo Left-aligned block */}
          <div className="flex items-center h-full">
             <AnimatePresence mode="popLayout">
               {!isCatalogue && (
                  <motion.nav
                    initial={{ opacity: 0, filter: "blur(4px)", x: -20 }}
                    animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                    exit={{ opacity: 0, filter: "blur(4px)", x: -20 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="hidden md:flex items-center gap-1.5 mr-10 relative"
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {NAV_CATEGORIES.map((item) => (
                      <button
                        key={item}
                        onMouseEnter={() => setHoveredItem(item)}
                        onClick={() => navigate(categoryHref(item))}
                        className={`relative px-4 py-2 text-[12px] font-semibold tracking-tight transition-colors duration-300 ${
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

          {/* Actions - Right aligned. On mobile we keep only wishlist + cart
              visible; search moves into the drawer's top input, and sign-in
              becomes a row in the drawer body. */}
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="group relative p-2.5 text-black hover:bg-black/5 rounded-full transition-all cursor-pointer hidden md:inline-flex"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            <button
              onClick={openWishlist}
              aria-label="Wishlist"
              className="group relative p-2.5 text-black hover:bg-black/5 rounded-full transition-all cursor-pointer"
            >
              <Heart size={20} strokeWidth={1.5} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white leading-none">
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
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white shadow ring-2 ring-white leading-none">
                  {itemCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 bg-black/10 mx-2 hidden md:block" />

            <button
              onClick={() => navigate(isAuthenticated ? "/account" : "/login")}
              className="hidden md:flex group items-center gap-2 p-1 pl-1 pr-3 text-black hover:bg-black hover:text-white border border-black/5 hover:border-black rounded-full transition-all cursor-pointer"
            >
              <div className="size-8 rounded-full bg-black/5 group-hover:bg-white/20 flex items-center justify-center overflow-hidden">
                <User size={18} strokeWidth={2} />
              </div>
              <span className="text-[13px] font-semibold">
                {isAuthenticated ? user?.name.split(" ")[0] : "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </header>
      <span id="main-content" tabIndex={-1} aria-hidden="true" className="sr-only" />

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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    const q = query.trim();
                    setSearchOpen(false);
                    setQuery("");
                    navigate(`/shop?q=${encodeURIComponent(q)}`);
                  }
                }}
                placeholder="Search catalog specimens… (press Enter for all results)"
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 mb-4">
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
                <div className="max-w-[720px] mx-auto py-12 text-center">
                  <p className="text-fg-mute text-[15px] mb-2">
                    Nothing matched <span className="text-fg font-semibold">"{query}"</span>.
                  </p>
                  <p className="text-fg-faint text-[13px] mb-8">
                    Try one of these instead.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {NAV_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                          navigate(`/shop?category=${encodeURIComponent(c)}`);
                        }}
                        className="px-4 py-2 rounded-full border border-black/10 text-[13px] font-medium hover:border-black transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fg-faint mb-4">
                    Or browse popular
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                          navigate(`/product/${p.id}`);
                        }}
                        className="text-left group"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-[#f5f5f5] mb-2">
                          <Image
                            src={p.image}
                            alt={p.name}
                            sizes="(min-width: 768px) 240px, 50vw"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <p className="text-[13px] font-medium leading-tight">{p.name}</p>
                        <p className="text-[12px] text-fg-mute">{formatPrice(p.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <div className="max-w-[720px] mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] text-black/50">
                      {results.length} match{results.length === 1 ? "" : "es"}
                    </p>
                    <button
                      onClick={() => {
                        const q = query.trim();
                        setSearchOpen(false);
                        setQuery("");
                        navigate(`/shop?q=${encodeURIComponent(q)}`);
                      }}
                      className="text-[12px] font-semibold underline underline-offset-4 hover:text-brand"
                    >
                      See all results in shop →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                        navigate(`/product/${p.id}`);
                      }}
                      className="text-left group"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-[#f5f5f5] mb-2">
                        <Image
                          src={p.image}
                          alt={p.name}
                          sizes="(min-width: 768px) 240px, 50vw"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <p className="text-[13px] font-medium leading-tight">{p.name}</p>
                      <p className="text-[12px] text-brand font-semibold">{formatPrice(p.price)}</p>
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] md:hidden"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 left-0 h-full w-[85vw] max-w-[360px] bg-white z-[151] shadow-2xl flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/5">
                <img alt="HOODUDE" className="h-[36px] brightness-0" src="/image.png" />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close navigation"
                  className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Search affordance — opens the full search overlay. */}
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  setSearchOpen(true);
                }}
                className="mx-6 mt-5 mb-2 flex items-center gap-3 px-4 py-3 rounded-full bg-black/[0.04] hover:bg-black/[0.07] text-fg-mute transition-colors"
              >
                <Search size={16} strokeWidth={1.6} />
                <span className="text-meta">Search the catalogue</span>
              </button>

              <div className="flex-1 overflow-y-auto">
                <span className="block px-6 mt-5 mb-2 text-eyebrow uppercase tracking-[0.22em] text-fg-faint">
                  Shop
                </span>
                <nav className="flex flex-col">
                  {NAV_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        navigate(categoryHref(item));
                        setMobileNavOpen(false);
                      }}
                      className="px-6 py-3.5 text-left text-[15px] font-medium text-fg hover:bg-black/[0.03] transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      navigate("/shop");
                      setMobileNavOpen(false);
                    }}
                    className="px-6 py-3.5 text-left text-[15px] font-medium text-fg-mute hover:bg-black/[0.03] hover:text-fg transition-colors"
                  >
                    Shop everything →
                  </button>
                </nav>

                <span className="block px-6 mt-6 mb-2 text-eyebrow uppercase tracking-[0.22em] text-fg-faint">
                  Account
                </span>
                <nav className="flex flex-col pb-6">
                  <button
                    onClick={() => {
                      navigate(isAuthenticated ? "/account" : "/login");
                      setMobileNavOpen(false);
                    }}
                    className="flex items-center gap-3 px-6 py-3.5 text-left text-[15px] font-medium text-fg hover:bg-black/[0.03] transition-colors"
                  >
                    <User size={16} strokeWidth={1.6} className="text-fg-mute" />
                    {isAuthenticated ? user?.name.split(" ")[0] : "Sign in / Sign up"}
                  </button>
                  <button
                    onClick={() => {
                      navigate("/wishlist");
                      setMobileNavOpen(false);
                    }}
                    className="flex items-center gap-3 px-6 py-3.5 text-left text-[15px] font-medium text-fg hover:bg-black/[0.03] transition-colors"
                  >
                    <Heart size={16} strokeWidth={1.6} className="text-fg-mute" />
                    Wishlist
                    {wishlistIds.length > 0 && (
                      <span className="ml-auto text-meta text-fg-faint tabular-nums">
                        {wishlistIds.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
