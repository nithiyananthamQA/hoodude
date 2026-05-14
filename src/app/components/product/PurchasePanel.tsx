import { ShoppingBag, Truck, Ruler, Heart, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { Product, SizeCode } from "../products";
import { formatPrice } from "../../utils/currency";
import { useCart } from "../../store/CartContext";
import FreeShippingMeter from "./FreeShippingMeter";

interface Props {
  product: Product;
  selectedColor: string;
  onSelectColor: (name: string) => void;
  selectedSize: SizeCode;
  onSelectSize: (size: SizeCode) => void;
  justAdded: boolean;
  onAddToCart: () => void;
  onCustomize: () => void;
  wishlisted: boolean;
  onToggleWishlist: () => void;
  onShowSizeChart: () => void;
  onShipping: () => void;
}

export default function PurchasePanel({
  product,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  justAdded,
  onAddToCart,
  onCustomize,
  wishlisted,
  onToggleWishlist,
  onShowSizeChart,
  onShipping,
}: Props) {
  const { subtotal } = useCart();
  return (
    <aside className="col-span-12 order-2 lg:order-none lg:col-span-4 lg:sticky lg:top-[100px] lg:self-start flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[32px] font-semibold tabular-nums leading-none">
          {formatPrice(product.price)}
        </span>
        <div className="flex items-center gap-2 text-[12px] text-black/50">
          <div className="size-1.5 rounded-full bg-[#10b981]" />
          <span>Ships in 24h</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
            Color
          </span>
          <span className="text-[12px] text-black/55">{selectedColor}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((color) => {
            const isActive = selectedColor === color.name;
            return (
              <button
                key={color.name}
                onClick={() => onSelectColor(color.name)}
                title={color.name}
                className={`size-10 md:size-8 rounded-full transition-all p-0.5 ${
                  isActive
                    ? "ring-2 ring-black ring-offset-1"
                    : "border border-black/15 hover:border-black/40"
                }`}
              >
                <span
                  className="block w-full h-full rounded-full"
                  style={{ backgroundColor: color.hex }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
          Size
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {product.sizes.map((size) => {
            const isActive = selectedSize === size;
            return (
              <button
                key={size}
                onClick={() => onSelectSize(size)}
                className={`h-11 rounded-md text-[14px] font-medium transition-colors border ${
                  isActive
                    ? "bg-black border-black text-white"
                    : "bg-white border-black/15 text-black/70 hover:border-black/40"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <FreeShippingMeter subtotal={subtotal} />

      <div className="flex flex-col gap-2.5">
        <button
          onClick={onAddToCart}
          className="relative w-full h-12 bg-black text-white rounded-md text-[14px] font-medium tracking-tight hover:bg-[#1a1a1a] active:bg-black transition-colors flex items-center justify-center gap-2.5 overflow-hidden"
        >
          <ShoppingBag
            size={16}
            strokeWidth={1.7}
            className="shrink-0"
          />
          <motion.span
            key={justAdded ? "added" : "add"}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {justAdded ? "Added to cart" : "Add to cart"}
          </motion.span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCustomize}
            className="h-11 rounded-md border border-black/15 text-[13px] font-medium tracking-tight text-black/75 hover:border-black hover:text-black transition-colors"
          >
            Customize
          </button>
          <button
            onClick={onToggleWishlist}
            className={`h-11 rounded-md border flex items-center justify-center gap-1.5 text-[13px] font-medium tracking-tight transition-colors ${
              wishlisted
                ? "border-black text-black bg-black/[0.03]"
                : "border-black/15 text-black/75 hover:border-black hover:text-black"
            }`}
          >
            <Heart size={13} strokeWidth={1.7} className={wishlisted ? "fill-black" : ""} />
            {wishlisted ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-col border-t border-black/10 pt-4">
        <button
          onClick={onShowSizeChart}
          className="flex items-center justify-between py-3 text-[14px] text-black/70 hover:text-black transition-colors group"
        >
          <span className="flex items-center gap-2">
            <Ruler size={13} strokeWidth={1.6} />
            Size Guide
          </span>
          <ArrowRight
            size={13}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
        <button
          onClick={onShipping}
          className="flex items-center justify-between py-3 text-[14px] text-black/70 hover:text-black transition-colors group border-t border-black/5"
        >
          <span className="flex items-center gap-2">
            <Truck size={13} strokeWidth={1.6} />
            Shipping & Returns
          </span>
          <ArrowRight
            size={13}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
    </aside>
  );
}
