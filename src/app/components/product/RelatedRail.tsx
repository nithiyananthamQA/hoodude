import { useRef } from "react";
import { useNavigate } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import type { Product } from "../products";
import { formatPrice } from "../../utils/currency";
import Image from "../ui/Image";
import Tilt3D from "../ui/Tilt3D";

interface Props {
  items: Product[];
}

export default function RelatedRail({ items }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Heading drifts up as the rail enters view, then continues past so the
  // section feels alive even when it's mostly off-screen.
  const headingY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={ref} className="mt-16">
      <motion.div
        style={{ y: headingY }}
        className="flex items-end justify-between mb-5"
      >
        <h3
          className="text-[22px] text-black tracking-tight"
          style={{ fontWeight: 600 }}
        >
          You may also like
        </h3>
        <button
          onClick={() => navigate("/shop")}
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-black/55 hover:text-black transition-colors"
        >
          View all →
        </button>
      </motion.div>
      <div className="grid grid-cols-5 gap-3 mb-10">
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 28, clipPath: "inset(15% 0% 15% 0%)" }}
            whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ delay: i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="cursor-pointer group"
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <Tilt3D max={4} className="aspect-[3/4] overflow-hidden mb-[9px] bg-[#f5f5f5] will-change-transform">
              <Image
                src={p.image}
                alt={p.name}
                sizes="(min-width: 1024px) 20vw, 50vw"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Tilt3D>
            <p className="text-[14px] text-black tracking-tight leading-snug mb-1 font-medium">
              {p.name}
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] text-black font-semibold tabular-nums">
                {formatPrice(p.price)}
              </span>
              <div className="flex items-center gap-1">
                {p.colors.slice(0, 4).map((c) => (
                  <span
                    key={c.name}
                    title={c.name}
                    className="size-3 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {p.colors.length > 4 && (
                  <span className="text-[10px] text-black/50 font-medium ml-0.5">
                    +{p.colors.length - 4}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
