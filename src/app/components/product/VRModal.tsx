import { lazy, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const Product3DViewer = lazy(() => import("../Product3DViewer"));

interface Props {
  open: boolean;
  onClose: () => void;
  colorHex: string;
  modelPath: string;
  productName: string;
}

/**
 * Fullscreen immersive 3D view. The "VR" affordance for a streetwear PDP
 * where most users don't have a headset. Black backdrop, the 3D model fills
 * the viewport, free orbit. WebXR session can be added later if the brand
 * targets headset-equipped users.
 */
export default function VRModal({ open, onClose, colorHex, modelPath, productName }: Props) {
  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} — immersive 3D view`}
        >
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <Product3DViewer
                colorHex={colorHex}
                modelPath={modelPath}
                showControlsLayout={false}
                cinematic
              />
            </Suspense>
          </div>

          {/* Top chrome — close button + label */}
          <div className="absolute top-0 inset-x-0 p-6 flex items-start justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <span className="text-white/40 text-[10px] font-medium uppercase tracking-[0.3em] block mb-1">
                Immersive view
              </span>
              <span className="text-white text-[15px] font-medium">{productName}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close immersive view"
              className="pointer-events-auto size-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-[10px] uppercase tracking-[0.25em] font-medium pointer-events-none">
            Drag to rotate · ESC to close
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
