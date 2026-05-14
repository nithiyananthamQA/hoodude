import { Check, Truck } from "lucide-react";
import { motion } from "motion/react";
import { formatPrice } from "../../utils/currency";

interface Props {
  subtotal: number;
  threshold?: number;
}

/**
 * Tiny progress meter that lifts AOV by surfacing the free-shipping
 * threshold above the fold (not buried in the cart drawer). Industry
 * benchmark: 5–15% AOV lift when this is visible on PDP, not just in cart.
 */
export default function FreeShippingMeter({ subtotal, threshold = 100 }: Props) {
  const unlocked = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="flex flex-col gap-2 py-3 px-4 rounded-lg bg-black/[0.03]">
      <div className="flex items-center gap-2 text-[12px] text-fg">
        {unlocked ? (
          <>
            <Check size={14} strokeWidth={2.4} className="text-[#10b981]" />
            <span className="font-medium">Free shipping unlocked.</span>
          </>
        ) : (
          <>
            <Truck size={13} strokeWidth={1.6} className="text-fg-mute" />
            <span>
              Add <span className="font-semibold">{formatPrice(remaining)}</span> for free shipping.
            </span>
          </>
        )}
      </div>
      <div className="h-px bg-black/10 relative overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-y-0 left-0 ${unlocked ? "bg-[#10b981]" : "bg-black"}`}
        />
      </div>
    </div>
  );
}
