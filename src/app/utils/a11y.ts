// Accessibility utilities for keyboard navigation, focus management, announcements

/**
 * Announce dynamic content updates to screen readers.
 * Use for toast notifications, async results, form validation.
 */
export function announce(message: string, polite = false) {
  const region = document.getElementById("aria-live-region") || (() => {
    const el = document.createElement("div");
    el.id = "aria-live-region";
    el.setAttribute("aria-live", polite ? "polite" : "assertive");
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    document.body.appendChild(el);
    return el;
  })();
  region.textContent = message;
}

/**
 * Focus management helper. Call after modals open, route changes, or dynamic
 * content insertion so focus isn't lost in the DOM.
 */
export function focusElement(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);
  if (el) {
    el.focus();
    // If it's a contenteditable or input, select all text
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.select?.();
    }
  }
}

/**
 * Trap focus inside a container (for modals, drawers). Call on mount with
 * container ref and cleanup function on unmount.
 */
export function trapFocus(container: HTMLElement, onEscape?: () => void) {
  const focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector)
  );
  if (!focusables.length) return () => {};

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onEscape?.();
      return;
    }
    if (e.key !== "Tab") return;

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  };

  container.addEventListener("keydown", handleKeydown);
  first.focus();

  return () => {
    container.removeEventListener("keydown", handleKeydown);
  };
}

/**
 * Skip link helper — reveals a hidden "Skip to main content" link that lets
 * keyboard users jump past navigation. Mount on the page root.
 */
export function createSkipLink(targetSelector = "main") {
  const link = document.createElement("a");
  link.href = `#${targetSelector}`;
  link.textContent = "Skip to main content";
  link.className =
    "sr-only focus:not-sr-only fixed top-0 left-0 z-[10000] px-4 py-2 bg-black text-white";
  document.body.insertBefore(link, document.body.firstChild);
  return link;
}
