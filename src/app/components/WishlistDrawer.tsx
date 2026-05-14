import { useNavigate } from "react-router";
import { Heart, X, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWishlist } from "../store/WishlistContext";
import { useCart } from "../store/CartContext";
import { products } from "./products";
import { formatPrice } from "../utils/currency";
import { useFocusTrap } from "../utils/useFocusTrap";
import Image from "./ui/Image";

const PANEL_TRANSITION = {
  duration: 0.55,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

export default function WishlistDrawer() {
  const navigate = useNavigate();
  const { ids, remove, isOpen, closeWishlist } = useWishlist();
  const { add, openCart } = useCart();
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen, closeWishlist);

  const wishlistProducts = products.filter((p) => ids.includes(p.id));

  const addToBag = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      color: product.colors[0].name,
      colorHex: product.colors[0].hex,
      size: product.sizes[0],
      price: product.price,
      quantity: 1,
    });
    closeWishlist();
    openCart();
  };

  const goToProduct = (id: string) => {
    closeWishlist();
    navigate(`/product/${id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeWishlist}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Wishlist"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={PANEL_TRANSITION}
            className="fixed top-0 right-0 h-full w-screen sm:w-auto sm:min-w-[380px] sm:max-w-[25vw] bg-white z-[101] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Heart size={22} strokeWidth={1.5} />
                  {wishlistProducts.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-black text-white text-[10px] font-semibold flex items-center justify-center">
                      {wishlistProducts.length}
                    </span>
                  )}
                </div>
                <h2 className="text-[22px] font-semibold tracking-tight">
                  Wishlist
                </h2>
              </div>
              <button
                onClick={closeWishlist}
                className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                aria-label="Close wishlist"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {wishlistProducts.length === 0 ? (
                <div className="flex-1 h-full flex flex-col items-center justify-center text-center py-16 gap-4">
                  <div className="size-20 rounded-full bg-black/5 flex items-center justify-center">
                    <Heart size={28} strokeWidth={1.3} className="text-black/30" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[16px] font-semibold">Nothing saved yet</p>
                    <p className="text-[13px] text-black/50 max-w-[280px]">
                      Tap the heart on any product to save it for later.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      closeWishlist();
                      navigate("/shop");
                    }}
                    className="mt-2 px-6 h-11 bg-black text-white rounded-full text-[13px] font-semibold hover:bg-brand transition-colors"
                  >
                    Shop new arrivals
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {wishlistProducts.map((p) => (
                    <div key={p.id} className="flex gap-4 group">
                      <div
                        onClick={() => goToProduct(p.id)}
                        className="size-24 bg-[#f5f5f5] border border-black/5 overflow-hidden shrink-0 cursor-pointer"
                      >
                        <Image
                          src={p.image}
                          alt={p.name}
                          sizes="96px"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div>
                          <h3 className="text-[14px] font-semibold text-black mb-1 truncate">
                            {p.name}
                          </h3>
                          <p className="text-[11px] text-black/50 uppercase tracking-wider">
                            {p.category}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold tabular-nums">
                            {formatPrice(p.price)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => addToBag(p.id)}
                              className="px-4 h-8 bg-black text-white rounded-full text-[11px] font-semibold flex items-center gap-1.5 hover:bg-brand transition-colors"
                            >
                              <ShoppingBag size={11} strokeWidth={2} />
                              Add to bag
                            </button>
                            <button
                              onClick={() => remove(p.id)}
                              className="text-black/30 hover:text-brand transition-colors"
                              aria-label="Remove from wishlist"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
