import { Suspense, useEffect, useRef, useMemo, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Html, useProgress, Decal, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Minus, Plus, Maximize2, Sparkles, Move } from "lucide-react";

/** Single source of truth for the default model path. */
export const DEFAULT_MODEL_PATH = "/3d/white-tshirt.glb";

interface DecalTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

function getPlacementProps(id?: string): DecalTransform | null {
  switch (id) {
    case "chest_left":       return { position: [0.11, 0.07, 0.15], rotation: [0, 0, 0], scale: 0.14 };
    case "chest_center":     return { position: [0, 0.09, 0.15], rotation: [0, 0, 0], scale: 0.18 };
    case "large_center":     return { position: [0, -0.05, 0.15], rotation: [0, 0, 0], scale: 0.35 };
    case "back":             return { position: [0, 0, -0.165], rotation: [0, Math.PI, 0], scale: 0.38 };
    case "sleeve_left_top":  return { position: [0.24, 0.08, 0.05], rotation: [0, Math.PI / 2.5, 0], scale: 0.12 };
    case "sleeve_right_top": return { position: [-0.24, 0.08, 0.05], rotation: [0, -Math.PI / 2.5, 0], scale: 0.12 };
    default: return null;
  }
}

interface ModelProps {
  colorHex: string;
  modelPath: string;
  activePlacement?: string;
  uploadTexture: THREE.Texture;
  /** When set, overrides the placement preset (only position+rotation; scale
   *  comes from the active placement so the design doesn't resize on drag). */
  customDecal: { position: [number, number, number]; rotation: [number, number, number] } | null;
  /** Fired when user drags the design across the body mesh. */
  onCustomDecalChange: (t: { position: [number, number, number]; rotation: [number, number, number] }) => void;
  /** Toggles whether drag-to-position is allowed (only when there's a real
   *  design — otherwise the placeholder is fixed to the active placement). */
  enableDrag: boolean;
  /** Notifies parent so OrbitControls can be paused while dragging. */
  onDragChange: (dragging: boolean) => void;
}

function Model({
  colorHex,
  modelPath,
  activePlacement,
  uploadTexture,
  customDecal,
  onCustomDecalChange,
  enableDrag,
  onDragChange,
}: ModelProps) {
  const { nodes, scene } = useGLTF(modelPath) as any;
  const groupRef = useRef<THREE.Group>(null!);
  const draggingRef = useRef(false);

  // Update color
  useEffect(() => {
    const color = new THREE.Color(colorHex);
    scene.traverse((c: any) => {
      if (c.isMesh && c.material) {
        c.material.color.set(color);
        if (c.material.metalness !== undefined) c.material.metalness = 0;
        if (c.material.roughness !== undefined) c.material.roughness = 0.5;
        c.material.needsUpdate = true;
      }
    });
  }, [colorHex, scene]);

  // Reset cursor when dragging is disabled (e.g. design cleared mid-drag).
  useEffect(() => {
    if (!enableDrag) document.body.style.cursor = "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [enableDrag]);

  // Decal sourcing — custom drag position wins over placement preset, but the
  // scale stays whatever the active placement defines so the design doesn't
  // unexpectedly resize when dragged.
  const placementProps = getPlacementProps(activePlacement);
  const decalProps: DecalTransform | null = customDecal
    ? {
        position: customDecal.position,
        rotation: customDecal.rotation,
        scale: placementProps?.scale ?? 0.22,
      }
    : placementProps;

  // Convert a raycast hit to a (localPosition, localRotation) tuple. The
  // rotation aligns the decal's local Z with the surface normal at the hit
  // point so the projection lays flat against the curve of the shirt.
  const transformFromHit = (e: ThreeEvent<PointerEvent>) => {
    if (!e.face) return null;
    const localPoint = e.object.worldToLocal(e.point.clone());
    // e.face.normal is in geometry local space — same space the Decal lives in.
    const normal = e.face.normal.clone();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    const euler = new THREE.Euler().setFromQuaternion(q);
    return {
      position: [localPoint.x, localPoint.y, localPoint.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
    };
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!enableDrag) return;
    e.stopPropagation();
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    onDragChange(true);
    document.body.style.cursor = "grabbing";
    const t = transformFromHit(e);
    if (t) onCustomDecalChange(t);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    const t = transformFromHit(e);
    if (t) onCustomDecalChange(t);
  };

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    onDragChange(false);
    (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = enableDrag ? "grab" : "auto";
  };

  const handlePointerOver = () => {
    if (enableDrag && !draggingRef.current) document.body.style.cursor = "grab";
  };
  const handlePointerOut = () => {
    if (!draggingRef.current) document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef}>
      {Object.entries(nodes).map(([name, node]: [string, any]) => {
        if (!node.isMesh) return null;

        // Very permissive body detection
        const isBody = name.toLowerCase().includes('shirt') ||
                       name.toLowerCase().includes('body') ||
                       name.toLowerCase().includes('fabric') ||
                       name.includes('Object_4') ||
                       name.includes('Mesh') ||
                       name.toLowerCase().includes('garment');

        return (
          <mesh
            key={name}
            geometry={node.geometry}
            material={node.material}
            renderOrder={1}
            castShadow
            receiveShadow
            onPointerDown={isBody ? handlePointerDown : undefined}
            onPointerMove={isBody ? handlePointerMove : undefined}
            onPointerUp={isBody ? endDrag : undefined}
            onPointerCancel={isBody ? endDrag : undefined}
            onPointerLeave={isBody ? endDrag : undefined}
            onPointerOver={isBody ? handlePointerOver : undefined}
            onPointerOut={isBody ? handlePointerOut : undefined}
          >
            {isBody && decalProps && (
              <Decal
                position={decalProps.position as any}
                rotation={decalProps.rotation as any}
                scale={decalProps.scale as any}
                map={uploadTexture}
              >
                <meshStandardMaterial
                  map={uploadTexture}
                  transparent
                  polygonOffset
                  polygonOffsetFactor={-10}
                  depthTest={true}
                />
              </Decal>
            )}
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Pure function that maps a placement (or no placement) to its default camera
 * position. Single source of truth — used by CameraRig (placement changes)
 * and by resetView (Reset button).
 */
function placementCameraPosition(
  placement: string | undefined,
  cinematic: boolean,
): THREE.Vector3 {
  if (placement === "back") return new THREE.Vector3(0, 0, cinematic ? -2.6 : -2.4);
  if (placement?.includes("sleeve_left")) return new THREE.Vector3(1.8, 0.3, 1.2);
  if (placement?.includes("sleeve_right")) return new THREE.Vector3(-1.8, 0.3, 1.2);
  return new THREE.Vector3(0, cinematic ? 0.1 : 0, cinematic ? 2.6 : 2.4);
}

function CameraRig({
  activePlacement,
  cinematic,
}: { activePlacement?: string; cinematic: boolean }) {
  // Only animate the camera when activePlacement *changes* — never every
  // frame. The previous version lerped on every frame, which fought
  // OrbitControls: the user drags, the rig yanks the camera back, drag dies.
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const prevPlacementRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (activePlacement === prevPlacementRef.current) return;
    prevPlacementRef.current = activePlacement;
    if (!activePlacement) {
      targetRef.current = null;
      return;
    }
    targetRef.current = placementCameraPosition(activePlacement, cinematic);
  }, [activePlacement, cinematic]);

  useFrame((state) => {
    const target = targetRef.current;
    if (!target) return;
    state.camera.position.lerp(target, 0.1);
    state.camera.lookAt(0, 0, 0);
    // Stop animating once the camera is settled. Hands the control back to
    // OrbitControls without further interference.
    if (state.camera.position.distanceTo(target) < 0.01) {
      targetRef.current = null;
    }
  });

  return null;
}

interface Product3DViewerProps {
  colorHex: string;
  modelPath?: string;
  showControlsLayout?: boolean;
  zoom?: number;
  resetSignal?: number;
  activePlacement?: string;
  /**
   * Cinematic mode for the immersive (VR) view: HDRI environment, slow
   * auto-rotate, contact shadow on the ground, lower exposure for drama.
   * Off by default (PDP gallery uses the simpler studio look).
   */
  cinematic?: boolean;
  /**
   * Optional image URL (data URL or http) to use as the decal texture in
   * place of the default "Upload design" placeholder. Used by the AI prompt
   * bar to apply a generated design onto the active placement.
   */
  designImageUrl?: string | null;
}

/** Imperative API exposed via ref. Lets the parent grab a PNG snapshot of the
 * current 3D scene — used by the customize-page Try-On flow so the AI gets
 * the user's *customized* shirt as the source garment, not the marketing photo. */
export interface Product3DViewerHandle {
  snapshot: () => string | null;
}

function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="size-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-black/60">{progress.toFixed(0)}%</span>
      </div>
    </Html>
  );
}

const Product3DViewer = forwardRef<Product3DViewerHandle, Product3DViewerProps>(function Product3DViewer({
  colorHex,
  modelPath = DEFAULT_MODEL_PATH,
  showControlsLayout = true,
  activePlacement,
  cinematic = false,
  zoom,
  resetSignal,
  designImageUrl,
}, ref) {
  // Wrapper ref — used to find the underlying canvas DOM for snapshots.
  const wrapperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const canvas = wrapperRef.current?.querySelector("canvas");
      if (!canvas) return null;
      try {
        return canvas.toDataURL("image/png");
      } catch {
        // toDataURL throws if the canvas is "tainted" by cross-origin textures;
        // returning null lets the caller fall back to product.image.
        return null;
      }
    },
  }), []);

  const uploadTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath(); ctx.arc(256, 256, 240, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = "#111"; ctx.setLineDash([20, 15]);
    ctx.beginPath(); ctx.arc(256, 256, 230, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = "#111"; ctx.textAlign = "center"; ctx.font = "bold 34px sans-serif";
    ctx.fillText("Upload design", 256, 310);
    ctx.fillText("or drop here", 256, 360);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  // When the parent supplies a design image (e.g. from the AI prompt bar),
  // load it as a Three texture and feed it to the Decal in place of the
  // default placeholder. Texture lifecycle is tied to the URL — we dispose
  // the old one whenever a new design lands.
  const [designTexture, setDesignTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!designImageUrl) {
      setDesignTexture((prev) => {
        prev?.dispose();
        return null;
      });
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    loader.load(
      designImageUrl,
      (tex) => {
        tex.anisotropy = 16;
        // Premultiplied alpha so transparent edges blend cleanly on the garment
        tex.colorSpace = THREE.SRGBColorSpace;
        setDesignTexture((prev) => {
          prev?.dispose();
          return tex;
        });
      },
      undefined,
      (err) => {
        if (import.meta.env.DEV) {
          console.error("[Product3DViewer] design texture load failed", err);
        }
      },
    );
  }, [designImageUrl]);

  const activeDecalTexture = designTexture ?? uploadTexture;

  // Free-form decal placement. When the user drags the design across the
  // shirt, we override the placement preset with a custom (position, rotation)
  // computed from the raycast hit. Reset whenever the design changes (new
  // upload) or the user picks a different placement preset.
  const [customDecal, setCustomDecal] = useState<{
    position: [number, number, number];
    rotation: [number, number, number];
  } | null>(null);
  const [isDraggingDecal, setIsDraggingDecal] = useState(false);
  const [hasMovedDecal, setHasMovedDecal] = useState(false);

  useEffect(() => {
    setCustomDecal(null);
    setHasMovedDecal(false);
  }, [activePlacement, designImageUrl]);

  const bgClass = cinematic ? "bg-[#0a0a0a]" : "bg-[#f5f5f5]";

  // Imperative camera control. We expose +/-/fit/detail buttons that animate
  // the camera distance via rAF — far smoother than wheel-tick zoom and key
  // to the "feel the fabric" experience.
  const controlsRef = useRef<any>(null);
  const animatingRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Keep OrbitControls in sync with drag state so camera doesn't rotate while
  // the user is positioning the decal.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.enabled = !isDraggingDecal;
  }, [isDraggingDecal]);

  const DEFAULT_DISTANCE = cinematic ? 2.6 : 2.4;
  const DETAIL_DISTANCE = 0.8; // close enough to read fabric weave
  const MIN_DISTANCE = 0.5;
  const MAX_DISTANCE = cinematic ? 4 : 3.2;

  const animateToDistance = useCallback((targetDistance: number) => {
    const camera = controlsRef.current?.object;
    if (!camera) return;
    const start = performance.now();
    const startDist = camera.position.length();
    const clamped = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetDistance));
    const duration = 480;
    animatingRef.current = true;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      // easeOutExpo — soft-landing curve, premium feel
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const dist = startDist + (clamped - startDist) * eased;
      const dir = camera.position.clone().normalize();
      camera.position.copy(dir.multiplyScalar(dist));
      controlsRef.current?.update();
      if (t < 1) requestAnimationFrame(tick);
      else animatingRef.current = false;
    };
    requestAnimationFrame(tick);
    setHasInteracted(true);
  }, [MIN_DISTANCE, MAX_DISTANCE]);

  const stepZoom = useCallback((factor: number) => {
    const camera = controlsRef.current?.object;
    if (!camera) return;
    animateToDistance(camera.position.length() * factor);
  }, [animateToDistance]);

  /**
   * Full view reset — animates camera position AND target back to the
   * placement-aware default. Restores rotation, distance, and look-at point
   * in one motion. This is what "Reset" actually means; just resetting the
   * distance leaves the user staring at the back of the shirt.
   */
  const resetView = useCallback(() => {
    const camera = controlsRef.current?.object;
    const target = controlsRef.current?.target;
    if (!camera || !target) return;
    const startPos = camera.position.clone();
    const startTarget = target.clone();
    const endPos = placementCameraPosition(activePlacement, cinematic);
    const endTarget = new THREE.Vector3(0, 0, 0);

    const start = performance.now();
    const duration = 600;
    animatingRef.current = true;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      camera.position.lerpVectors(startPos, endPos, eased);
      target.lerpVectors(startTarget, endTarget, eased);
      controlsRef.current?.update();
      if (t < 1) requestAnimationFrame(tick);
      else animatingRef.current = false;
    };
    requestAnimationFrame(tick);
  }, [activePlacement, cinematic]);

  // External zoom percentage prop (e.g. CustomizePage's zoom UI).
  // 100% = default distance; 200% = closer (half distance); 50% = farther.
  const lastZoomRef = useRef(zoom);
  useEffect(() => {
    if (zoom == null || zoom === lastZoomRef.current) return;
    lastZoomRef.current = zoom;
    if (controlsRef.current) {
      animateToDistance(DEFAULT_DISTANCE * (100 / zoom));
    }
  }, [zoom, DEFAULT_DISTANCE, animateToDistance]);

  // External reset signal (counter from parent). Each increment fires a
  // full view reset — rotation back to default, distance back to default.
  const lastResetRef = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal == null) {
      lastResetRef.current = resetSignal;
      return;
    }
    if (resetSignal === lastResetRef.current) return;
    lastResetRef.current = resetSignal;
    resetView();
  }, [resetSignal, resetView]);

  return (
    <div ref={wrapperRef} className={`w-full h-full relative group ${bgClass}`}>
      <Canvas
        camera={{ position: [0, cinematic ? 0.1 : 0, cinematic ? 2.6 : 2.4], fov: cinematic ? 32 : 38 }}
        shadows
        dpr={[1, 2]}
        // preserveDrawingBuffer lets the parent grab the canvas as a PNG via
        // toDataURL — required for the Try-On snapshot bridge. Slight memory
        // cost; negligible for one viewer at a time.
        gl={{ toneMappingExposure: cinematic ? 0.85 : 1.0, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<CanvasLoader />}>
          {/* `Center` (no `top`) centers the model on the origin so the camera
              looking at (0,0,0) frames the middle of the shirt — not its
              collar. Tighter FOV (38) reads more telephoto and avoids the
              edge-distortion that wide-angle gives on a frontal product shot. */}
          <Center>
            <Model
              colorHex={colorHex}
              modelPath={modelPath}
              activePlacement={activePlacement}
              uploadTexture={activeDecalTexture}
              customDecal={customDecal}
              onCustomDecalChange={(t) => {
                setCustomDecal(t);
                setHasMovedDecal(true);
              }}
              enableDrag={!!designImageUrl}
              onDragChange={setIsDraggingDecal}
            />
          </Center>
          <CameraRig activePlacement={activePlacement} cinematic={cinematic} />

          {cinematic && (
            <>
              {/* Studio HDRI for realistic specular reflections. `studio`
                  preset gives a neutral 4-light softbox feel — premium,
                  not gimmicky. */}
              <Environment preset="studio" background={false} />
              {/* Soft ground shadow grounds the model in space. */}
              <ContactShadows position={[0, -0.6, 0]} opacity={0.45} scale={4} blur={2.8} far={1.5} />
            </>
          )}

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            // Zoom enabled in BOTH gallery + cinematic — fabric inspection is
            // the digital "feel the cotton" moment for a heavyweight basics
            // brand. Pinch on touch always works; wheel zoom on desktop too.
            enableZoom
            zoomSpeed={0.7}
            zoomToCursor
            // Auto-rotate is disruptive when the user wants to inspect. We
            // pause it the moment they interact with the toolbar.
            autoRotate={cinematic && !hasInteracted}
            autoRotateSpeed={0.6}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.6}
            // Pull min way in. At 0.5 the camera reads weave-level detail on
            // a model with proper textures; on a flat-shaded GLB the user at
            // least gets close-up geometry inspection.
            minDistance={MIN_DISTANCE}
            maxDistance={MAX_DISTANCE}
            onStart={() => setHasInteracted(true)}
          />
        </Suspense>
        {/* Studio-style 3-light setup. Key from front-right, fill from front-
            left, soft rim from behind. Reads as boutique product photography. */}
        <ambientLight intensity={cinematic ? 0.35 : 0.55} />
        <directionalLight position={[3, 4, 5]} intensity={cinematic ? 0.9 : 1.1} castShadow />
        <directionalLight position={[-3, 2, 4]} intensity={cinematic ? 0.5 : 0.6} />
        <pointLight position={[0, 2, -3]} intensity={cinematic ? 0.6 : 0.4} />
      </Canvas>

      {showControlsLayout && (
        <>
          {/* Zoom toolbar — bottom-left of the viewer. Mirrors the rail on
              the right for compositional balance. */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-xl border border-black/5 rounded-full p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]">
            <ZoomBtn
              label="Zoom out"
              onClick={() => stepZoom(1.35)}
              icon={<Minus size={14} strokeWidth={1.8} />}
            />
            <ZoomBtn
              label="Reset view"
              onClick={resetView}
              icon={<Maximize2 size={13} strokeWidth={1.8} />}
            />
            <ZoomBtn
              label="Zoom in"
              onClick={() => stepZoom(1 / 1.35)}
              icon={<Plus size={14} strokeWidth={1.8} />}
            />
            <span className="w-px h-4 bg-black/10 mx-1" />
            <ZoomBtn
              label="Fabric detail"
              onClick={() => animateToDistance(DETAIL_DISTANCE)}
              icon={<Sparkles size={13} strokeWidth={1.8} />}
              accent
            />
          </div>

          {/* First-time hint, fades after first interaction. */}
          {!hasInteracted && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none lg:hidden">
              <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-fg-faint bg-white/80 backdrop-blur px-3 py-1.5 rounded-full">
                Pinch to zoom · Drag to rotate
              </span>
            </div>
          )}
        </>
      )}

      {/* Design-drag hint — appears once a design is applied and the user
          hasn't moved it yet. Cleanly disappears the moment they drag. */}
      {!!designImageUrl && !hasMovedDecal && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fg/90 backdrop-blur text-white text-[10px] uppercase tracking-[0.22em] font-medium"
        >
          <Move size={11} strokeWidth={2} />
          Drag the design to move
        </div>
      )}
    </div>
  );
});

export default Product3DViewer;

useGLTF.preload(DEFAULT_MODEL_PATH);

function ZoomBtn({
  label,
  icon,
  onClick,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative size-8 rounded-full flex items-center justify-center transition-colors btn-press-sm ${
        accent
          ? "text-fg hover:bg-brand/10"
          : "text-fg-mute hover:bg-black/5 hover:text-fg"
      }`}
    >
      {icon}
      {accent && (
        <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1 rounded-full bg-brand" />
      )}
    </button>
  );
}
