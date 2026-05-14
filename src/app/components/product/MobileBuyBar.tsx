import { ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import type { Product, SizeCode } from "../products";
import { formatPrice } from "../../utils/currency";

interface Props {
  product: Product;
  selectedColor: string;
  selectedSize: SizeCode;
  onAddToCart: () => void;
  justAdded: boolean;
}

/**
 * Sticky bottom bar visible only on mobile (<lg). Always present from page
 * load — mobile users need a one-tap path to "Add to bag" without scrolling.
 * Gating it on a scroll-past observer used to leave new visitors with no
 * visible CTA on first paint, which is the wrong tradeoff for conversion.
 */
export default function MobileBuyBar({
  product,
  selectedColor,
  selectedSize,
  onAddToCart,
  justAdded,
}: Props) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      className="lg:hidden fixed bottom-0 inset-x-0 z-[80] bg-white/95 backdrop-blur-xl border-t border-black/10"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[14px] font-semibold text-fg truncate leading-tight">
            {product.name}
          </span>
          <span className="text-[12px] text-fg-mute leading-tight">
            {selectedColor} · {selectedSize} · {formatPrice(product.price)}
          </span>
        </div>
        <button
          onClick={onAddToCart}
          className="shrink-0 h-12 px-5 bg-black text-white rounded-full text-[13px] font-semibold uppercase tracking-[0.12em] flex items-center gap-2 btn-press transition-transform"
        >
          <ShoppingBag size={14} strokeWidth={1.8} />
          {justAdded ? "Added" : "Add"}
        </button>
      </div>
    </motion.div>
  );
}
