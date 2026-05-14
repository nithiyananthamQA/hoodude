import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowUp, X } from "lucide-react";

interface Props {
  onSubmit: (prompt: string) => void;
  busy: boolean;
  /** Last generated design URL — when present we show a small status chip
   *  with a "Clear" affordance. */
  generatedUrl?: string | null;
  onClear?: () => void;
  /** Surface inline error from the last generation attempt. */
  error?: string | null;
}

const SUGGESTIONS = [
  "Bold typographic logo",
  "Vintage band tour graphic",
  "Minimal Japanese ink mark",
  "Geometric sun emblem",
];

/**
 * Floating glass prompt bar — bottom-center of the customize workspace.
 * Single input + send button + four suggestion chips above. Designed to
 * read as a focused tool, not a chatbot — there's no transcript, no
 * threading, just one shot at a time.
 */
export default function PromptBar({
  onSubmit,
  busy,
  generatedUrl,
  onClear,
  error,
}: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K focuses the bar from anywhere on the page — power-user move.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full lg:w-[min(720px,calc(100%-3rem))] pointer-events-none">
      {/* Suggestion chips — fade out once a design is in flight or rendered. */}
      <AnimatePresence>
        {!busy && !generatedUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap justify-center gap-2 pointer-events-auto"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setValue(s);
                  inputRef.current?.focus();
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-black/5 text-meta text-fg-mute hover:text-fg hover:border-black/15 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status chip when a design is rendered. */}
      <AnimatePresence>
        {generatedUrl && !busy && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-fg text-white text-meta pointer-events-auto"
          >
            <Sparkles size={11} strokeWidth={2} className="text-brand" />
            <span>Design applied to selected placement</span>
            {onClear && (
              <button
                onClick={onClear}
                aria-label="Clear design"
                className="size-4 rounded-full hover:bg-white/15 flex items-center justify-center -mr-1"
              >
                <X size={10} strokeWidth={2} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline error */}
      <AnimatePresence>
        {error && !busy && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="px-3 py-1.5 rounded-full bg-white/95 border border-black/10 text-meta text-fg pointer-events-auto"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The bar itself. */}
      <div
        className={`flex items-center gap-3 pl-5 pr-1.5 py-1.5 w-full bg-white/95 backdrop-blur-xl border rounded-full shadow-[0_8px_32px_-12px_rgba(0,0,0,0.16)] transition-colors pointer-events-auto ${
          busy ? "border-black/15" : "border-black/[0.06]"
        }`}
      >
        <Sparkles size={16} strokeWidth={1.6} className="text-brand shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onInputKey}
          disabled={busy}
          placeholder={busy ? "Generating your design…" : "Describe a design and I'll make it"}
          className="flex-1 bg-transparent outline-none text-body text-fg placeholder:text-fg-faint disabled:cursor-not-allowed h-9"
          aria-label="Describe a design"
        />
        <kbd className="hidden md:inline-flex items-center px-2 py-1 rounded-md bg-black/[0.04] text-[10px] font-medium uppercase tracking-[0.18em] text-fg-faint">
          ⌘K
        </kbd>
        <button
          onClick={submit}
          disabled={busy || !value.trim()}
          aria-label="Generate design"
          className="size-9 rounded-full bg-fg text-white flex items-center justify-center shrink-0 hover:bg-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed btn-press-sm"
        >
          {busy ? (
            <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <ArrowUp size={15} strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}
