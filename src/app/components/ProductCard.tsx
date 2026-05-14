import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { products } from "./products";
import { formatPrice } from "../utils/currency";
import { buildSrcSet } from "./ui/Image";
import Tilt3D from "./ui/Tilt3D";

type Product = (typeof products)[number];

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  variant?: "compact" | "shop";
  saved?: boolean;
  onToggleSave?: () => void;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
};

export default function ProductCard({
  product,
  onClick,
  variant = "compact",
  saved = false,
  onToggleSave,
}: ProductCardProps) {
  const images = product.gallery?.length ? product.gallery : [product.image];
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const hasMultiple = images.length > 1;

  const step = (e: React.MouseEvent, dir: -1 | 1) => {
    e.stopPropagation();
    setDirection(dir);
    setIdx((i) => (i + dir + images.length) % images.length);
  };

  const isShop = variant === "shop";
  const arrowSize = isShop ? "size-9" : "size-8";
  const arrowIcon = isShop ? 16 : 16;
  const dotActive = isShop ? "w-5" : "w-4";
  const cardMargin = isShop ? "mb-[20px]" : "mb-[9px]";
  const titleSize = isShop ? "text-[16px]" : "text-[15px]";
  const titleWeight = isShop ? "font-medium line-clamp-2 leading-tight" : "font-medium";
  const priceSize = isShop ? "text-[16px] font-semibold" : "text-[15px] font-semibold";
  const colorDot = isShop ? "size-2" : "size-3";

  return (
    <div className="cursor-pointer group" onClick={onClick}>
      <Tilt3D
        max={4}
        gloss
        className={`aspect-[3/4] overflow-hidden ${cardMargin} bg-[#f5f5f5] relative will-change-transform`}
      >
        <div className={`absolute inset-0 ${isShop ? "transition-transform duration-1000 group-hover:scale-110" : "group-hover:scale-105 transition-transform duration-500"}`}>
          <AnimatePresence custom={direction} initial={false}>
            <motion.img
              key={idx}
              src={images[idx]}
              srcSet={buildSrcSet(images[idx])}
              sizes={isShop ? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" : "(min-width: 1024px) 20vw, 50vw"}
              alt={`${product.name} — view ${idx + 1}`}
              loading="lazy"
              decoding="async"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
        </div>

        {product.stock === "Make to Order" && (
          <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1.5 rounded-full">
            Made to order
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              onClick={(e) => step(e, -1)}
              aria-label="Previous image"
              className={`absolute left-2 top-1/2 -translate-y-1/2 ${arrowSize} rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10`}
            >
              <ChevronLeft size={arrowIcon} strokeWidth={2} />
            </button>
            <button
              onClick={(e) => step(e, 1)}
              aria-label="Next image"
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${arrowSize} rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10`}
            >
              <ChevronRight size={arrowIcon} strokeWidth={2} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === idx ? `${dotActive} bg-white` : "w-1 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className={`absolute top-4 right-4 size-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
              saved
                ? "bg-brand text-white"
                : "bg-white/90 text-black hover:bg-brand hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100"
            }`}
          >
            <Heart size={16} className={saved ? "fill-white" : ""} />
          </button>
        )}
      </Tilt3D>

      {isShop ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h3 className={`${titleSize} text-black tracking-tight ${titleWeight}`}>
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {product.colors.slice(0, 3).map((c) => (
                <div
                  key={c.name}
                  className={`${colorDot} rounded-full border border-black/5`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
          <p className={`${priceSize} text-black tabular-nums`}>
            {formatPrice(product.price)}
          </p>
        </div>
      ) : (
        <>
          <p className={`${titleSize} text-black tracking-tight leading-snug mb-1 ${titleWeight}`}>
            {product.name}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className={`${priceSize} text-black tabular-nums`}>
              {formatPrice(product.price)}
            </span>
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className={`${colorDot} rounded-full border border-black/10`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-black/50 font-medium ml-0.5">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
