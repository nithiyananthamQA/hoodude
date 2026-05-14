import { useRef, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  // Max degrees of rotation at the edges. Keep small (4–8) for premium feel.
  max?: number;
  // Subtle scale on hover. 1 = none.
  scale?: number;
  // When true, paints a soft moving gloss following the cursor.
  gloss?: boolean;
  style?: CSSProperties;
}

/**
 * 3D-tilt wrapper. Mouse position drives rotateX / rotateY through a spring,
 * giving cards a subtle parallax feel. Disabled under reduced motion and on
 * touch (no `pointermove` from a finger sustaining hover).
 *
 * Wrap a card-shaped element. The wrapper does NOT add a background — child
 * styles its own surface.
 */
export default function Tilt3D({
  children,
  className,
  max = 6,
  scale = 1,
  gloss = false,
  style,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 220,
    damping: 22,
    mass: 0.5,
  });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 220,
    damping: 22,
    mass: 0.5,
  });

  // Gloss follows cursor in screen-space across the surface.
  const glossX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glossY = useTransform(py, [0, 1], ["0%", "100%"]);
  const glossBg = useMotionTemplate`radial-gradient(circle at ${glossX} ${glossY}, rgba(255,255,255,0.45), transparent 45%)`;

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileHover={{ scale }}
      transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
        ...style,
      }}
      className={`relative ${className ?? ""}`}
    >
      <div style={{ transform: "translateZ(0)" }} className="absolute inset-0">
        {children}
        {gloss && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: glossBg }}
          />
        )}
      </div>
    </motion.div>
  );
}
