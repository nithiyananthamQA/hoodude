import { useEffect } from "react";
import { X } from "lucide-react";
import type { Product } from "../products";

interface Props {
  product: Product;
  onClose: () => void;
}

export default function SizeChartModal({ product, onClose }: Props) {
  // Close on Escape — the rest of the close handling is the backdrop click.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Size guide"
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-[0_24px_48px_-16px_rgba(0,0,0,0.12)] overflow-hidden font-sans"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors z-10"
          aria-label="Close size guide"
        >
          <X size={16} strokeWidth={1.5} className="text-black/40" />
        </button>

        <div className="p-7">
          <div className="text-center mb-6">
            <h3 className="text-[18px] font-semibold text-black tracking-tight mb-1">
              Size Guide
            </h3>
            <p className="text-[11px] text-black/40 uppercase tracking-[0.15em]">
              Measurements in inches
            </p>
          </div>

          <div className="flex flex-col">
            <div className="grid grid-cols-3 pb-3 border-b border-[#f4f4f4] text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40">
              <span className="pl-2">Size</span>
              <span className="text-center">Chest</span>
              <span className="text-right pr-2">Length</span>
            </div>

            <div className="pt-1">
              {product.sizeChart.map((row) => (
                <div
                  key={row.size}
                  className="grid grid-cols-3 py-3 px-2 text-[13px] font-medium text-black hover:bg-[#f5f5f5] transition-colors rounded-md group"
                >
                  <span className="text-black/50 group-hover:text-black transition-colors">
                    {row.size}
                  </span>
                  <span className="text-center">{row.chest}"</span>
                  <span className="text-right">{row.length}"</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#f4f4f4]">
            <p className="text-[11px] text-black/40 leading-relaxed text-center max-w-[320px] mx-auto">
              Standard industry tolerance of +/- 0.5" applies. Measure a
              favorite tee flat for comparison.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
