import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

interface Options {
  // How far the element drifts toward the cursor at the edge of its bounds.
  // Higher = more pull. Keep small (0.2–0.4) for premium subtlety.
  strength?: number;
  // Hover radius multiplier — element starts pulling when cursor enters
  // bounding box scaled by this. 1 = exact rect, 1.5 = soft halo.
  radius?: number;
}

/**
 * Magnetic cursor pull. Returns a ref to attach to the target and two motion
 * values (x, y) for `style={{ x, y }}` on the same node — or on a child that
 * should drift visually while the ref tracks the real bounds.
 *
 * Honors prefers-reduced-motion: returns no-op zero values.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(opts: Options = {}) {
  const { strength = 0.3, radius = 1 } = opts;
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const halfW = (rect.width * radius) / 2;
      const halfH = (rect.height * radius) / 2;
      if (Math.abs(dx) > halfW || Math.abs(dy) > halfH) {
        x.set(0);
        y.set(0);
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        x.set(dx * strength);
        y.set(dy * strength);
      });
    };
    const reset = () => {
      x.set(0);
      y.set(0);
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    el.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerleave", reset);
      cancelAnimationFrame(raf);
    };
  }, [reduce, strength, radius, x, y]);

  return { ref, x: sx, y: sy };
}
