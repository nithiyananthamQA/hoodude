import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Smartphone, Box } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  modelPath: string;
  productName: string;
}

/**
 * AR is OS-level (iOS Quick Look + Android Scene Viewer + WebXR). Desktop
 * browsers literally cannot enter AR — there's no runtime. The premium move
 * is to detect that and show a QR code so the user can hop their phone in.
 *
 * On mobile (or any device that reports `canActivateAR`), we surface a big
 * "Open in AR" button that fires `model-viewer.activateAR()` directly. The
 * model-viewer element itself is hidden — we use it only as the bridge.
 */
export default function ARModal({ open, onClose, modelPath, productName }: Props) {
  const modelViewerRef = useRef<HTMLModelViewerElement | null>(null);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [pageUrl, setPageUrl] = useState<string>("");

  // Check support after the model has loaded. canActivateAR is only truthy
  // once model-viewer has mounted + handshakes with the OS.
  useEffect(() => {
    if (!open) return;
    setPageUrl(window.location.href);

    let cancelled = false;
    const tick = () => {
      const el = modelViewerRef.current;
      if (cancelled) return;
      if (el && el.canActivateAR !== undefined) {
        setArSupported(Boolean(el.canActivateAR));
      } else {
        setTimeout(tick, 200);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const launch = () => {
    modelViewerRef.current?.activateAR().catch(() => {
      setArSupported(false);
    });
  };

  // Public QR — no dependency, no key. Encodes the current URL so the
  // user's phone lands on the same product page and can tap AR there.
  const qrUrl = pageUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(pageUrl)}`
    : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Augmented reality"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[560px] bg-white rounded-3xl overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between px-8 pt-7 pb-6">
              <div>
                <span className="block text-eyebrow uppercase tracking-[0.22em] text-fg-faint mb-1.5">
                  Augmented reality
                </span>
                <h2 className="text-h2 font-semibold tracking-tight text-fg leading-none">
                  See it in your space.
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close AR"
                className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </header>

            <div className="px-8 pb-8">
              {arSupported === null && (
                <Loading />
              )}
              {arSupported === true && (
                <SupportedView onLaunch={launch} productName={productName} />
              )}
              {arSupported === false && (
                <UnsupportedView qrUrl={qrUrl} />
              )}
            </div>

            {/* Hidden model-viewer that bridges to OS-level AR. */}
            <model-viewer
              ref={modelViewerRef as unknown as React.RefObject<HTMLElement>}
              src={modelPath}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              ar-placement="floor"
              loading="eager"
              reveal="manual"
              alt={`${productName} — AR`}
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                opacity: 0,
                pointerEvents: "none",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-3 py-8">
      <div className="size-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
      <span className="text-meta text-fg-mute">Checking AR support…</span>
    </div>
  );
}

function SupportedView({ onLaunch, productName }: { onLaunch: () => void; productName: string }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-fg-mute leading-relaxed">
        Place the {productName} in your room at real scale. Walk around it. Move it where you want it.
      </p>
      <button
        onClick={onLaunch}
        className="h-14 w-full rounded-full bg-black text-white text-meta font-semibold flex items-center justify-center gap-3 hover:bg-brand transition-colors"
      >
        <Box size={16} strokeWidth={1.8} />
        Open in AR
      </button>
      <p className="text-caption text-fg-faint text-center">
        Uses iOS Quick Look or Android Scene Viewer. Requires camera permission.
      </p>
    </div>
  );
}

function UnsupportedView({ qrUrl }: { qrUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.04] text-fg-mute text-caption">
        <Smartphone size={13} strokeWidth={1.6} />
        AR works on phones, not desktops
      </div>
      <p className="text-body text-fg-mute leading-relaxed max-w-[400px]">
        Scan this with your phone to open the product page there — then tap{" "}
        <span className="text-fg font-semibold">AR</span> to place it in your room.
      </p>
      {qrUrl && (
        <div className="p-4 bg-white border border-black/10 rounded-2xl">
          <img
            src={qrUrl}
            alt="QR code to open product page on mobile"
            width={240}
            height={240}
            className="block"
          />
        </div>
      )}
      <p className="text-caption text-fg-faint">
        iOS Safari · Android Chrome · WebXR-compatible browsers.
      </p>
    </div>
  );
}
