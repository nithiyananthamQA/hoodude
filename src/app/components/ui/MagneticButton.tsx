import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { useMagnetic } from "../../utils/useMagnetic";

interface Props extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  children: ReactNode;
  strength?: number;
  // Inner pull is smaller than outer so the label drifts a touch less than the
  // button — gives the impression of weight inside.
  innerStrength?: number;
}

/**
 * Button with subtle cursor pull. The wrapper tracks the real bounds and
 * drifts toward the cursor; the inner span drifts a smaller amount so the
 * label visually trails the body — a small detail that feels expensive.
 */
export default function MagneticButton({
  children,
  className,
  strength = 0.25,
  innerStrength = 0.4,
  ...rest
}: Props) {
  const outer = useMagnetic<HTMLButtonElement>({ strength, radius: 1.4 });
  const inner = useMagnetic<HTMLSpanElement>({ strength: innerStrength, radius: 1.4 });

  return (
    <motion.button
      ref={outer.ref}
      style={{ x: outer.x, y: outer.y }}
      className={className}
      {...rest}
    >
      <motion.span
        ref={inner.ref}
        style={{ x: inner.x, y: inner.y, display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
