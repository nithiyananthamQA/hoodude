import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Trap focus inside a container while it's open. Closes on Escape via onClose.
 * Returns the previously focused element on unmount/close.
 */
export function useFocusTrap<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void
) {
  const containerRef = useRef<T | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocus.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusables[0];
    if (first) first.focus({ preventScroll: true });

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previousFocus.current?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  return containerRef;
}
