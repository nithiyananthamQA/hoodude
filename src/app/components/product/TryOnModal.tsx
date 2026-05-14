import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Sparkles, Download, RefreshCw, AlertCircle, Move, RotateCcw } from "lucide-react";
import {
  generateTryOn,
  isAITryOnConfigured,
  prefetchProductImage,
  type InlinePart,
} from "../../utils/tryOn";

interface Props {
  open: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  productCategory?: string;
}

type Stage =
  | { kind: "idle" }
  | { kind: "uploaded"; file: File; preview: string }
  | { kind: "generating"; file: File; preview: string }
  | { kind: "result"; resultUrl: string; sourcePreview: string }
  | { kind: "error"; message: string; preview?: string; file?: File }
  | { kind: "compose"; preview: string };

const aiAvailable = isAITryOnConfigured();

export default function TryOnModal({
  open,
  onClose,
  productName,
  productImage,
  productCategory,
}: Props) {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Pre-warm the product image while the user is uploading theirs. Drops
  // ~1–2s off the perceived call time when they hit Generate.
  const productPartRef = useRef<InlinePart | null>(null);

  // Fresh state on every reopen + restart pre-warm.
  useEffect(() => {
    if (!open) {
      setStage({ kind: "idle" });
      productPartRef.current = null;
      return;
    }
    let cancelled = false;
    prefetchProductImage(productImage).then((part) => {
      if (!cancelled) productPartRef.current = part;
    });
    return () => {
      cancelled = true;
    };
  }, [open, productImage]);

  // Body scroll lock + Escape close.
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

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setStage({ kind: "uploaded", file, preview: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const runTryOn = async (file: File, preview: string) => {
    setStage({ kind: "generating", file, preview });
    try {
      const result = await generateTryOn({
        personFile: file,
        productUrl: productImage,
        productImagePart: productPartRef.current ?? undefined,
        productCategory,
        productName,
      });
      setStage({ kind: "result", resultUrl: result.imageDataUrl, sourcePreview: preview });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again.";
      setStage({ kind: "error", message, preview, file });
    }
  };

  const downloadResult = () => {
    if (stage.kind !== "result") return;
    const a = document.createElement("a");
    a.href = stage.resultUrl;
    a.download = `hoodude-tryon-${slugify(productName)}.png`;
    a.click();
  };

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
          aria-label="Try on"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[1100px] max-h-[92vh] bg-white rounded-3xl overflow-hidden flex flex-col shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between px-6 md:px-10 py-6 border-b border-black/5">
              <div>
                <span className="block text-eyebrow uppercase tracking-[0.22em] text-fg-faint mb-1.5">
                  {aiAvailable ? "AI try-on" : "See the fit"}
                </span>
                <h2 className="text-h2 font-semibold tracking-tight text-fg leading-none">
                  {stage.kind === "result" ? "Looks good." : "Try it on."}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close try-on"
                className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-auto bg-[#fafafa]">
              {stage.kind === "idle" && (
                <Idle onPickClick={() => fileInputRef.current?.click()} />
              )}
              {stage.kind === "uploaded" && (
                <Uploaded
                  preview={stage.preview}
                  productImage={productImage}
                  productName={productName}
                  onGenerate={() => runTryOn(stage.file, stage.preview)}
                  onChange={() => fileInputRef.current?.click()}
                  aiAvailable={aiAvailable}
                />
              )}
              {stage.kind === "generating" && (
                <Generating preview={stage.preview} />
              )}
              {stage.kind === "result" && (
                <Result
                  before={stage.sourcePreview}
                  after={stage.resultUrl}
                  onDownload={downloadResult}
                  onRedo={() => fileInputRef.current?.click()}
                />
              )}
              {stage.kind === "error" && (
                <ErrorState
                  message={stage.message}
                  preview={stage.preview}
                  onRetry={() => fileInputRef.current?.click()}
                  onUseComposite={
                    stage.preview
                      ? () => setStage({ kind: "compose", preview: stage.preview! })
                      : undefined
                  }
                />
              )}
              {stage.kind === "compose" && (
                <ComposeStage
                  preview={stage.preview}
                  productImage={productImage}
                  productName={productName}
                  onChange={() => fileInputRef.current?.click()}
                  onSaved={(resultUrl) =>
                    setStage({ kind: "result", resultUrl, sourcePreview: stage.preview })
                  }
                />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = ""; // allow re-upload of the same file
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Idle({ onPickClick }: { onPickClick: () => void }) {
  return (
    <div className="h-full min-h-[440px] flex items-center justify-center p-10">
      <button
        onClick={onPickClick}
        className="group flex flex-col items-center gap-5 p-12 md:p-16 border border-dashed border-black/15 rounded-2xl bg-white hover:border-black/40 transition-colors"
      >
        <div className="size-16 rounded-full bg-black/[0.04] group-hover:bg-black/[0.08] flex items-center justify-center transition-colors">
          <Upload size={26} strokeWidth={1.4} className="text-fg-mute" />
        </div>
        <div className="text-center max-w-[340px]">
          <span className="block text-fg font-semibold text-[16px] mb-1.5">Upload your photo</span>
          <span className="block text-fg-mute text-meta leading-relaxed">
            A full-body or torso shot in good light works best. We'll generate a preview of you wearing the piece.
          </span>
        </div>
      </button>
    </div>
  );
}

function Uploaded({
  preview,
  productImage,
  productName,
  onGenerate,
  onChange,
  aiAvailable,
}: {
  preview: string;
  productImage: string;
  productName: string;
  onGenerate: () => void;
  onChange: () => void;
  aiAvailable: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 p-6 md:p-10 items-stretch min-h-[440px]">
      <Tile label="You" image={preview} />
      <div className="flex md:flex-col items-center justify-center gap-3 text-fg-faint">
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium">+</span>
      </div>
      <Tile label={productName} image={productImage} />
      <div className="md:col-span-3 flex items-center justify-between gap-4 pt-4 border-t border-black/5">
        <button
          onClick={onChange}
          className="text-meta text-fg-mute hover:text-fg font-medium underline underline-offset-4 decoration-black/15 hover:decoration-black transition-colors"
        >
          Use a different photo
        </button>
        <button
          onClick={onGenerate}
          disabled={!aiAvailable}
          className="h-12 px-6 rounded-full bg-black text-white text-meta font-semibold flex items-center gap-2 hover:bg-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={aiAvailable ? "Generate AI try-on" : "Add VITE_GEMINI_API_KEY to enable"}
        >
          <Sparkles size={14} strokeWidth={1.8} />
          {aiAvailable ? "Generate try-on" : "AI not configured"}
        </button>
      </div>
    </div>
  );
}

function Tile({ label, image }: { label: string; image: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#f5f5f5]">
        <img src={image} alt={label} className="w-full h-full object-cover" />
      </div>
      <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">{label}</span>
    </div>
  );
}

const PROGRESS_PHASES = [
  "Reading your photo",
  "Studying the garment",
  "Composing the fit",
  "Adding finishing details",
] as const;

function Generating({ preview }: { preview: string }) {
  const [phase, setPhase] = useState(0);

  // Step through phases on a slight stagger so the wait feels intentional
  // instead of frozen. Loops on the last phase if Gemini takes longer than
  // expected — never resets to 0, never finishes (real completion swaps
  // the whole component out).
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => Math.min(p + 1, PROGRESS_PHASES.length - 1));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[440px] flex flex-col items-center justify-center gap-6 p-10">
      <div className="relative aspect-[3/4] w-full max-w-[280px] rounded-2xl overflow-hidden bg-[#f5f5f5]">
        <img src={preview} alt="" className="w-full h-full object-cover opacity-40" />
        {/* Sweeping shimmer over the photo while we wait. Reads as "scanning". */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full animate-skeleton-shimmer pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="size-10 rounded-full border-2 border-black border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-eyebrow uppercase tracking-[0.22em] text-fg block"
          >
            {PROGRESS_PHASES[phase]}
          </motion.span>
        </AnimatePresence>
        <p className="text-meta text-fg-faint max-w-[320px]">
          Usually 8–15 seconds. Don't refresh.
        </p>
      </div>
    </div>
  );
}

function Result({
  before,
  after,
  onDownload,
  onRedo,
}: {
  before: string;
  after: string;
  onDownload: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="p-6 md:p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">Before</span>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#f5f5f5]">
            <img src={before} alt="Original" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">After</span>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#f5f5f5] relative">
            <img src={after} alt="Try-on result" className="w-full h-full object-cover" />
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-medium uppercase tracking-[0.18em] text-fg flex items-center gap-1.5">
              <Sparkles size={10} strokeWidth={2} className="text-brand" />
              AI-generated
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-black/5 flex-wrap">
        <p className="text-caption text-fg-faint max-w-[400px]">
          AI composite — for visual reference only. Real fit may vary.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onRedo}
            className="h-12 px-5 rounded-full border border-black/10 text-meta font-medium flex items-center gap-2 hover:border-black transition-colors"
          >
            <RefreshCw size={13} strokeWidth={1.8} />
            New photo
          </button>
          <button
            onClick={onDownload}
            className="h-12 px-5 rounded-full bg-black text-white text-meta font-semibold flex items-center gap-2 hover:bg-brand transition-colors"
          >
            <Download size={13} strokeWidth={1.8} />
            Save look
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  preview,
  onRetry,
  onUseComposite,
}: {
  message: string;
  preview?: string;
  onRetry: () => void;
  onUseComposite?: () => void;
}) {
  return (
    <div className="min-h-[440px] flex flex-col items-center justify-center gap-6 p-10 text-center">
      {preview && (
        <div className="aspect-[3/4] w-full max-w-[200px] rounded-2xl overflow-hidden bg-[#f5f5f5] opacity-50">
          <img src={preview} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex flex-col items-center gap-3 max-w-[440px]">
        <AlertCircle size={26} strokeWidth={1.4} className="text-fg-mute" />
        <h3 className="text-fg font-semibold text-[16px]">AI try-on is busy right now.</h3>
        <p className="text-fg-mute text-meta leading-relaxed">{message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onUseComposite && (
          <button
            onClick={onUseComposite}
            className="h-12 px-6 rounded-full bg-fg text-white text-meta font-semibold flex items-center gap-2 hover:bg-brand transition-colors"
          >
            <Move size={14} strokeWidth={1.8} />
            Use composite tool
          </button>
        )}
        <button
          onClick={onRetry}
          className="h-12 px-6 rounded-full border border-black/10 text-meta text-fg-mute hover:border-fg hover:text-fg transition-colors font-medium"
        >
          Try a different photo
        </button>
      </div>
    </div>
  );
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const DEFAULT_TX: Transform = { x: 0, y: 0, scale: 1 };

/**
 * Manual composite tool — drag the product image onto the user's photo,
 * scale it, save the result. Always works (zero network), used as fallback
 * when AI try-on is rate-limited.
 */
function ComposeStage({
  preview,
  productImage,
  productName,
  onChange,
  onSaved,
}: {
  preview: string;
  productImage: string;
  productName: string;
  onChange: () => void;
  onSaved: (resultUrl: string) => void;
}) {
  const [tx, setTx] = useState<Transform>(DEFAULT_TX);
  const stageRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: tx.x,
      baseY: tx.y,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTx((t) => ({ ...t, x: dragRef.current!.baseX + dx, y: dragRef.current!.baseY + dy }));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  const save = async () => {
    const photoEl = photoRef.current;
    if (!photoEl) return;
    const photoImg = await loadImage(preview);
    const productImg = await loadImage(productImage);
    const canvas = document.createElement("canvas");
    canvas.width = photoImg.width;
    canvas.height = photoImg.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(photoImg, 0, 0);

    // Map on-screen transform back to the photo's natural resolution
    const ratio = photoImg.width / photoEl.clientWidth;
    const baseProductW = photoEl.clientWidth * 0.4;
    const productW = baseProductW * tx.scale * ratio;
    const productH = (productImg.height / productImg.width) * productW;
    const cx = canvas.width / 2 + tx.x * ratio - productW / 2;
    const cy = canvas.height / 2 + tx.y * ratio - productH / 2;
    ctx.drawImage(productImg, cx, cy, productW, productH);

    onSaved(canvas.toDataURL("image/png"));
  };

  return (
    <div className="flex flex-col h-full min-h-[440px]">
      <div ref={stageRef} className="flex-1 relative bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
        <img
          ref={photoRef}
          src={preview}
          alt="Your photo"
          className="max-w-full max-h-full object-contain"
        />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute touch-none cursor-grab active:cursor-grabbing"
          style={{
            left: "50%",
            top: "50%",
            width: "40%",
            transform: `translate(-50%, -50%) translate(${tx.x}px, ${tx.y}px) scale(${tx.scale})`,
          }}
        >
          <img
            src={productImage}
            alt={productName}
            draggable={false}
            className="w-full h-auto select-none pointer-events-none"
          />
        </div>
      </div>

      <footer className="border-t border-black/5 px-6 md:px-10 py-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-eyebrow uppercase tracking-[0.18em] text-fg-faint shrink-0">
            Scale
          </span>
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.01}
            value={tx.scale}
            onChange={(e) => setTx((t) => ({ ...t, scale: Number(e.target.value) }))}
            className="flex-1 accent-black"
            aria-label="Adjust product scale"
          />
          <button
            onClick={() => setTx(DEFAULT_TX)}
            aria-label="Reset position"
            title="Reset"
            className="size-10 rounded-full border border-black/10 hover:border-fg flex items-center justify-center transition-colors"
          >
            <RotateCcw size={14} strokeWidth={1.6} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onChange}
            className="h-11 px-5 rounded-full border border-black/10 text-meta font-medium text-fg-mute hover:border-fg hover:text-fg transition-colors"
          >
            New photo
          </button>
          <button
            onClick={save}
            className="h-11 px-5 rounded-full bg-fg text-white text-meta font-semibold flex items-center gap-2 hover:bg-brand transition-colors"
          >
            <Download size={14} strokeWidth={1.8} />
            Save look
          </button>
        </div>
      </footer>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
