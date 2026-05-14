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
 * renders them as a small, restrained row UNDER the primary "You may also
 * like" section. Smaller cards + quiet heading so it visually reads as
 * "your browse history footer" rather than competing with the recommendation
 * rail above it. Renders nothing if there's nothing new to show.
 */
export default function RecentlyViewedRail({
  excludeId,
  limit = 6,
  title = "Recently viewed",
}: Props) {
  const navigate = useNavigate();
  const { ids } = useRecentlyViewed();

  const items: Product[] = ids
    .filter((id) => id !== excludeId)
    .map((id) => findProduct(id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, limit);

  // Need at least 2 items to be worth showing as a "history" rail.
  if (items.length < 2) return null;

  return (
    <section className="mt-16 pt-8 border-t border-black/[0.06]">
      {/* Eyebrow-style heading — deliberately smaller than RelatedRail's
          primary heading so users can tell at a glance this is the
          secondary, browse-history section. */}
      <div className="flex items-baseline justify-between mb-5">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fg-faint">
          {title}
        </h4>
        <span className="text-[10px] text-fg-faint tabular-nums">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>
      {/* Smaller, denser grid (6 cols on desktop vs 5) to differentiate
          from the chunky RelatedRail cards above. No swatches, no hover
          tilt — quiet, scrollable thumbnails. */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/product/${p.id}`)}
            className="text-left group"
          >
            <div className="aspect-square overflow-hidden mb-2 bg-[#f5f5f5] rounded-sm">
              <Image
                src={p.image}
                alt={p.name}
                sizes="(min-width: 1024px) 16vw, 33vw"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-[12px] text-fg-mute group-hover:text-fg tracking-tight leading-snug truncate">
              {p.name}
            </p>
            <span className="text-[12px] text-fg-mute font-medium tabular-nums">
              {formatPrice(p.price)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
