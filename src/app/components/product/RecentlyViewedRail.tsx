import { useNavigate } from "react-router";
import { useRecentlyViewed } from "../../utils/useRecentlyViewed";
import { findProduct } from "../products";
import type { Product } from "../products";
import { formatPrice } from "../../utils/currency";
import Image from "../ui/Image";

interface Props {
  /** Hide a specific product (e.g. the one currently being viewed). */
  excludeId?: string;
  /** Visible cap. */
  limit?: number;
  /** Section title. */
  title?: string;
}

/**
 * Re-engagement rail. Reads the localStorage trail of viewed products and
 * renders them as a small, restrained row. Renders nothing if there's only
 * one or zero relevant products — keeps the surface clean for new visitors.
 */
export default function RecentlyViewedRail({
  excludeId,
  limit = 5,
  title = "Recently viewed",
}: Props) {
  const navigate = useNavigate();
  const { ids } = useRecentlyViewed();

  const items: Product[] = ids
    .filter((id) => id !== excludeId)
    .map((id) => findProduct(id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, limit);

  if (items.length < 2) return null;

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between mb-5">
        <h3 className="text-[14px] font-medium uppercase tracking-[0.18em] text-fg-faint">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/product/${p.id}`)}
            className="text-left group"
          >
            <div className="aspect-[3/4] overflow-hidden mb-[9px] bg-[#f5f5f5]">
              <Image
                src={p.image}
                alt={p.name}
                sizes="(min-width: 1024px) 20vw, 50vw"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-[14px] text-fg tracking-tight leading-snug mb-1 font-medium">
              {p.name}
            </p>
            <span className="text-[14px] text-fg font-semibold tabular-nums">
              {formatPrice(p.price)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
