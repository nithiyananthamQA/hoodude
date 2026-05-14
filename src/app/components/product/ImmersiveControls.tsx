import { useState } from "react";
import { Box, Glasses, User } from "lucide-react";
import VRModal from "./VRModal";
import TryOnModal from "./TryOnModal";
import ARModal from "./ARModal";
import { track } from "../../utils/analytics";
import type { Product } from "../products";

interface Props {
  colorHex: string;
  modelPath: string;
  productName: string;
  productImage: string;
  productCategory?: Product["category"];
}

/**
 * Floating glass pill rendered over the 3D viewer with three immersive
 * affordances: AR (Quick Look / Scene Viewer / WebXR), VR (immersive
 * fullscreen 3D), Try-on (Gemini-powered AI try-on).
 *
 * Each button opens a focused modal — no inline state, no overlapping
 * surfaces. Modals own their lifecycle.
 */
export default function ImmersiveControls({
  colorHex,
  modelPath,
  productName,
  productImage,
  productCategory,
}: Props) {
  const [arOpen, setArOpen] = useState(false);
  const [vrOpen, setVrOpen] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  return (
    <>
      <div className="absolute top-4 right-4 z-10 pointer-events-auto flex flex-col gap-1.5">
        <ControlTile
          label="AR"
          icon={<Box size={17} strokeWidth={1.5} />}
          onClick={() => {
            track("ar_launch_attempt", { product: productName });
            setArOpen(true);
          }}
        />
        <ControlTile
          label="VR"
          icon={<Glasses size={17} strokeWidth={1.5} />}
          onClick={() => {
            track("vr_open", { product: productName });
            setVrOpen(true);
          }}
        />
        <ControlTile
          label="Try on"
          icon={<User size={17} strokeWidth={1.5} />}
          accent
          onClick={() => {
            track("tryon_open", { product: productName });
            setTryOnOpen(true);
          }}
        />
      </div>

      <ARModal
        open={arOpen}
        onClose={() => setArOpen(false)}
        modelPath={modelPath}
        productName={productName}
      />

      <VRModal
        open={vrOpen}
        onClose={() => setVrOpen(false)}
        colorHex={colorHex}
        modelPath={modelPath}
        productName={productName}
      />

      <TryOnModal
        open={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
        productName={productName}
        productImage={productImage}
        productCategory={productCategory}
      />
    </>
  );
}

function ControlTile({
  label,
  icon,
  onClick,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Adds a subtle dot to flag this tile as AI-powered (used by Try-on). */
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group relative flex flex-col items-center justify-center gap-1.5 w-[64px] py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-black/5 hover:bg-fg hover:border-fg btn-press transition-[background,border-color,transform] duration-200 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
    >
      {accent && (
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 size-1.5 rounded-full bg-brand"
        />
      )}
      <span className="text-fg group-hover:text-white transition-colors">{icon}</span>
      <span className="text-[9px] uppercase tracking-[0.22em] font-medium text-fg-mute group-hover:text-white/80 transition-colors">
        {label}
      </span>
    </button>
  );
}
