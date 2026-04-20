import { useNavigate } from "react-router";
import { ShoppingBag, X, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../store/CartContext";
import { formatPrice } from "../utils/currency";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREE_SHIPPING_THRESHOLD = 100;

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { items, subtotal, itemCount, remove, updateQuantity } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 8;
  const total = subtotal + shipping;

  const goToCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[440px] bg-white z-[101] shadow-2xl flex flex-col"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag size={22} strokeWidth={1.5} />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-[#fa5d42] text-white text-[10px] font-bold flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <h2
                  className="text-[22px] font-bold tracking-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Your Bag
                </h2>
              </div>
              <button
                onClick={onClose}
                className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {items.length > 0 && (
              <div className="px-8 pb-4">
                <div className="text-[12px] text-black/60 mb-2">
                  {remaining > 0 ? (
                    <>
                      Add <span className="font-bold text-black">{formatPrice(remaining)}</span>{" "}
                      more for free shipping
                    </>
                  ) : (
                    <span className="font-bold text-[#fa5d42]">
                      ✓ Free shipping unlocked
                    </span>
                  )}
                </div>
                <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#fa5d42] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-8 flex flex-col gap-6 pb-6">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 gap-4">
                  <div className="size-20 rounded-full bg-black/5 flex items-center justify-center">
                    <ShoppingBag size={28} strokeWidth={1.3} className="text-black/30" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[16px] font-bold">Your bag is empty</p>
                    <p className="text-[13px] text-black/50">
                      Explore new arrivals and add a piece.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/shop");
                    }}
                    className="mt-2 px-6 h-11 bg-black text-white rounded-full text-[13px] font-bold hover:bg-[#fa5d42] transition-colors"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="size-24 rounded-xl bg-[#f5f5f5] border border-black/5 overflow-hidden shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <h3 className="text-[14px] font-bold text-black mb-1 truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-black/50 font-medium">
                          <span
                            className="size-3 rounded-full border border-black/10"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <span>{item.color}</span>
                          <span className="text-black/20">·</span>
                          <span>Size {item.size}</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex items-center border border-black/10 rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="size-7 flex items-center justify-center text-black/60 hover:bg-black hover:text-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-[12px] font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="size-7 flex items-center justify-center text-black/60 hover:bg-black hover:text-white transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-bold tabular-nums">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => remove(item.id)}
                            className="text-black/30 hover:text-[#fa5d42] transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 border-t border-black/5 bg-[#fafafa]">
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-black/50 font-medium">Subtotal</span>
                    <span className="font-bold text-black tabular-nums">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-black/50 font-medium">Shipping</span>
                    <span
                      className={`font-bold tabular-nums ${
                        shipping === 0 ? "text-[#fa5d42] uppercase text-[11px] tracking-wider" : ""
                      }`}
                    >
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[16px] pt-3 border-t border-black/10">
                    <span className="font-bold tracking-tight">Total</span>
                    <span className="font-bold tracking-tight tabular-nums">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={goToCheckout}
                  className="w-full bg-black text-white h-[56px] rounded-full flex items-center justify-between px-8 font-bold hover:bg-[#fa5d42] transition-all group active:scale-[0.98]"
                >
                  <span>Checkout</span>
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <p className="text-center text-[10px] text-black/40 mt-3 font-medium uppercase tracking-widest">
                  Taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
