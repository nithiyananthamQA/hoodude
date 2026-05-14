import type { CSSProperties, HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** When true, renders a shimmer animation across the surface. */
  shimmer?: boolean;
  /** Override the default neutral fill. */
  tone?: "neutral" | "paper" | "ink";
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-[rgb(243,244,246)]",
  paper: "bg-[rgb(247,247,247)]",
  ink: "bg-[rgb(20,20,20)]",
};

/**
 * Editorial-style skeleton: a flat tone block, optional shimmer pass.
 * Skeletons signal "the layout is ready, content arriving" — spinners signal
 * "loading." Premium UIs use the former, never the latter.
 */
export default function Skeleton({
  shimmer = true,
  tone = "neutral",
  className = "",
  style,
  ...rest
}: Props) {
  return (
    <div
      {...rest}
      className={`relative overflow-hidden ${TONES[tone]} ${className}`}
      style={style}
    >
      {shimmer && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full animate-skeleton-shimmer pointer-events-none"
          style={
            {
              backgroundImage:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            } as CSSProperties
          }
        />
      )}
    </div>
  );
}
