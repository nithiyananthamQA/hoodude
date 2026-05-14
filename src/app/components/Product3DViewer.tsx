import { Suspense, useEffect, useRef, useMemo, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Html, useProgress, Decal, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Minus, Plus, Maximize2, Sparkles, Move } from "lucide-react";

/** Single source of truth for the default model path. */
export const DEFAULT_MODEL_PATH = "/3d/white-tshirt.glb";

interface DecalTransform {
  position: [number, number, number];
  /** Explicit Euler [x, y, z] for the projection cube's orientation. We
   *  used to pass a single number and rely on drei's auto-orient to align
   *  the cube with the closest vertex normal, but on our authored GLBs
   *  the chest-area vertex normals point in unexpected directions (seam
   *  averaging quirks), so the cube ended up oriented sideways and the
   *  projection missed the front face. Passing an explicit Euler lets us
   *  hard-orient the cube to face the right way out of the garment. */
  rotation: [number, number, number];
  /** Vector scale: [width, height, depth-of-projection]. The depth is how
   *  far through the mesh the projection cube extends; keep it small so a
   *  front-placed decal doesn't also paint the back side of the garment. */
  scale: [number, number, number];
}

/**
 * Public layer shape used by the customize page. Each placement can hold one
 * layer; the viewer renders all visible layers as separate <Decal> children
 * so users can have e.g. a small logo on the chest AND a big graphic on the
 * back at the same time.
 */
export interface DesignLayer {
  id: string;
  placementId: string;
  imageUrl: string;
  source: "ai" | "upload" | "stock" | "text";
  /** Optional scale override; falls back to placement preset. */
  scale?: number;
  /** Drag-positioned point on the body mesh (overrides the placement preset). */
  customPosition?: [number, number, number];
  /** In-plane rotation around the surface normal, in radians.
   *  Single scalar — drei auto-orients to the surface, this just twists it. */
  customRotation?: number;
  hidden?: boolean;
}

/**
 * Placement preset in normalised body-space:
 * - xN: -1 = left edge, 0 = center, +1 = right edge of the body bbox X-range
 * - yN: 0 = hem (bottom), 1 = collar (top) of the body bbox Y-range
 * - zN: -1 = back, +1 = front of the body bbox Z-range
 * - scaleN: fraction of the body bbox X-width to occupy
 *
 * The viewer resolves these to absolute mesh-local coordinates at render
 * time using the actual body bbox so the same presets work across all our
 * authored GLBs (white-tshirt, hood, zipper-hood, knitted-jacket), each of
 * which has slightly different absolute coordinates.
 */
interface PlacementPreset {
  xN: number;      // [-1, 1]
  yN: number;      // [0, 1]
  zN: -1 | 1;      // back or front
  scaleN: number;  // fraction of body width
  /** Optional in-plane rotation around the surface normal (radians). */
  rollZ?: number;
}

const PLACEMENT_PRESETS: Record<string, PlacementPreset> = {
  // Four zones, simple and obvious. Two-color trim (collar/cuffs/hem) is a
  // separate body+trim color system — not a design placement.
  //
  // yN values are tuned for our authored garments:
  //   1.0 = top of bbox (collar / hood top)
  //   0.85+ = neck opening (no fabric — avoid)
  //   0.66 = chest line (sweet spot for front + back design)
  //   0.30 = waist
  //   0.0 = hem
  //
  // For sleeves, xN of ±0.65 lands roughly at the upper-arm sleeve area
  // (between the shoulder and the cuff). The decal's auto-orient picks the
  // outward-facing normal of the nearest sleeve vertex, so the decal lays
  // flat on the sleeve surface even without precise positioning.
  front_chest:  { xN:  0,    yN: 0.66, zN:  1, scaleN: 0.42 },
  back:         { xN:  0,    yN: 0.66, zN: -1, scaleN: 0.55 },
  left_sleeve:  { xN:  0.65, yN: 0.78, zN:  1, scaleN: 0.18 },
  right_sleeve: { xN: -0.65, yN: 0.78, zN:  1, scaleN: 0.18 },
};

export function getPlacementPreset(id?: string): PlacementPreset | null {
  if (!id) return null;
  return PLACEMENT_PRESETS[id] ?? null;
}

interface BodyBounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

/** Resolve a placement to absolute mesh-local coordinates using ONLY the
 *  body bbox. No raycasting — raycasts were missing for 3 of 4 placements
 *  on the authored GLBs (the rays passed through the neck opening or
 *  glanced off the curved sleeve). This bbox-only path always produces a
 *  valid position, and DecalGeometry's cube projection is forgiving
 *  enough that small position offsets still capture the surface. */
function resolvePlacement(
  id: string | undefined,
  bounds: BodyBounds | null,
): DecalTransform | null {
  if (!id || !bounds) return null;
  const preset = getPlacementPreset(id);
  if (!preset) return null;

  const sizeX = bounds.max.x - bounds.min.x;
  const sizeY = bounds.max.y - bounds.min.y;
  const sizeZ = bounds.max.z - bounds.min.z;
  const cx = (bounds.min.x + bounds.max.x) / 2;

  const isSleeve = id === "left_sleeve" || id === "right_sleeve";

  // Y position — preset.yN is 0..1 normalised from the bbox bottom (hem) to top.
  const yPos = bounds.min.y + preset.yN * sizeY;

  // X / Z position depends on which face the placement targets:
  //   - Front chest:  cube faces +Z, sits just in front of the front surface
  //   - Back:         cube faces -Z, sits just behind the back surface
  //   - Sleeves:      cube faces ±X, sits just outside the sleeve cuff
  // The Euler rotation hard-orients the cube's local +Z axis along the
  // surface normal direction. This avoids drei's auto-orient picking a
  // wrong-direction vertex normal on chest-seam vertices.
  let xPos: number;
  let zPos: number;
  let rotation: [number, number, number];
  const zOvershoot = sizeZ * 0.1;
  const xOvershoot = sizeX * 0.06;

  // ⚠️ Rotation values are COUNTER-INTUITIVE for DecalGeometry. The "rotation"
  // is the projector cube's orientation, and clipping rejects triangles whose
  // winding/normals don't match the projection direction. Front-facing
  // triangles need a projector rotated 180° around Y (so the cube's effective
  // forward direction matches the surface-normal direction at the chest).
  // Back-facing triangles need the opposite. The "Back works, Front doesn't"
  // symptom was the original Front rotation `[0,0,0]` being wrong.
  if (isSleeve) {
    xPos = cx + preset.xN * (sizeX / 2 + xOvershoot);
    // Sleeves project along ±X. The body center Z (0 for these GLBs) is a
    // safe Z to anchor at since the sleeve geometry passes through there.
    zPos = 0;
    // Sleeve rotations inverted vs my earlier guess — left sleeve cube
    // points toward -X (into the body), right sleeve toward +X.
    rotation = preset.xN > 0
      ? [0, -Math.PI / 2, preset.rollZ ?? 0]   // left sleeve
      : [0,  Math.PI / 2, preset.rollZ ?? 0];  // right sleeve
  } else if (preset.zN === 1) {
    // Front chest: projector positioned in front, rotated 180° around Y so
    // its +Z effective direction matches the front-face normal direction.
    xPos = cx + preset.xN * (sizeX / 2);
    zPos = bounds.max.z + zOvershoot;
    rotation = [0, Math.PI, preset.rollZ ?? 0];
  } else {
    // Back: projector positioned behind, identity rotation (its +Z naturally
    // matches the back-face normal direction in this GLB's coordinate frame).
    xPos = cx + preset.xN * (sizeX / 2);
    zPos = bounds.min.z - zOvershoot;
    rotation = [0, 0, preset.rollZ ?? 0];
  }

  // Cube width/height — bbox-fraction-based so decals stay proportional
  // across different garments.
  const width = sizeX * preset.scaleN;
  // Cube depth — KEEP THIS SMALL. Large depths cause DecalGeometry clipping
  // failures on thin cloth meshes (the cube extends past the fabric on both
  // sides and the projection produces no triangles). 0.02 = 2cm of model
  // space, enough for fabric thickness without crossing to the other side.
  const depth = 0.02;

  return {
    position: [xPos, yPos, zPos],
    rotation,
    scale: [width, width, depth],
  };
}

/** Legacy export retained for callers that only check "is this on the back?".
 *  Callers that actually render a decal should use `resolvePlacement` so
 *  coordinates match the actual body mesh's bbox. */
export function getPlacementProps(id?: string): DecalTransform | null {
  const preset = getPlacementPreset(id);
  if (!preset) return null;
  return {
    position: [preset.xN * 0.15, 0.05, preset.zN === 1 ? 0.15 : -0.15],
    rotation: [0, preset.zN === 1 ? 0 : Math.PI, preset.rollZ ?? 0],
    scale: [0.2, 0.2, 0.15],
  };
}

interface RenderedLayer {
  id: string;
  placementId: string;
  texture: THREE.Texture;
  /** Optional user-applied overrides; Model resolves the rest from the
   *  body-mesh bbox at render time so coordinates work universally. */
  customPosition?: [number, number, number];
  /** In-plane roll (single radian scalar). */
  customRotation?: number;
  customScale?: number;
}

interface ModelProps {
  colorHex: string;
  /** Optional second color for trim meshes (collar/cuffs/hem/seams). When
   *  omitted the trim is painted with `colorHex` so there's no visual change
   *  for callers that don't opt in. */
  trimColorHex?: string | null;
  modelPath: string;
  activePlacement?: string;
  /** Placeholder texture shown when no layer exists for the active placement. */
  uploadTexture: THREE.Texture;
  /** All layers to render. Each will be drawn as its own <Decal>. */
  layers: RenderedLayer[];
  /** When set, overrides the active layer's preset position/rotation. */
  customDecal: { position: [number, number, number] } | null;
  /** Fired when user drags the design across the body mesh. Only the
   *  position is transmitted; rotation comes from drei's auto-orient. */
  onCustomDecalChange: (t: { position: [number, number, number] }) => void;
  /** Toggles whether drag-to-position is allowed (only when there's a real
   *  design — otherwise the placeholder is fixed to the active placement). */
  enableDrag: boolean;
  /** Notifies parent so OrbitControls can be paused while dragging. */
  onDragChange: (dragging: boolean) => void;
  /** Wheel-over-body resizes the active layer. Delta is multiplicative. */
  onActiveLayerScale: (factor: number) => void;
  /** Shift-drag rotates the active layer in-plane. Delta is radians. */
  onActiveLayerRotate: (deltaRadians: number) => void;
}

function Model({
  colorHex,
  trimColorHex,
  modelPath,
  activePlacement,
  uploadTexture,
  layers,
  customDecal,
  onCustomDecalChange,
  enableDrag,
  onDragChange,
  onActiveLayerScale,
  onActiveLayerRotate,
}: ModelProps) {
  const { nodes, scene } = useGLTF(modelPath) as any;
  const groupRef = useRef<THREE.Group>(null!);
  const draggingRef = useRef(false);

  // Identify the body mesh + capture its bounding box. Pure bbox math is
  // used to derive placement positions — no raycasting, because raycasts
  // were missing for 3 of 4 placements on our authored GLBs (the rays
  // went through the neck opening or glanced off the curved sleeve).
  const { bodyMeshName, bodyBounds } = useMemo(() => {
    const entries = Object.entries(nodes) as Array<[string, any]>;
    const meshes = entries.filter(([, n]) => n?.isMesh && n.geometry);
    if (meshes.length === 0) return { bodyMeshName: null, bodyBounds: null };
    const score = (name: string, node: any) => {
      const lc = name.toLowerCase();
      let s = node.geometry?.attributes?.position?.count ?? 0;
      if (lc.includes("cloth")) s *= 4;
      if (lc.includes("shirt") || lc.includes("body") || lc.includes("garment") || lc.includes("fabric")) s *= 4;
      if (lc.includes("trim") || lc.includes("seam") || lc.includes("zipper") || lc.includes("button") || lc.includes("label")) s *= 0.05;
      return s;
    };
    let best = meshes[0];
    let bestScore = score(meshes[0][0], meshes[0][1]);
    for (let i = 1; i < meshes.length; i++) {
      const s = score(meshes[i][0], meshes[i][1]);
      if (s > bestScore) { best = meshes[i]; bestScore = s; }
    }
    const bestNode = best[1];
    bestNode.geometry.computeBoundingBox?.();
    // Authored GLBs frequently have inconsistent / broken normals on the
    // sleeve and chest regions (UV seam averaging quirks during export).
    // DecalGeometry's clipping uses normals to reject triangles, so bad
    // normals cause silent decal failures. Recompute fresh normals once
    // here so every triangle has a reliable outward-facing normal.
    bestNode.geometry.computeVertexNormals?.();
    bestNode.geometry.normalizeNormals?.();
    const box = bestNode.geometry.boundingBox as THREE.Box3 | null;
    if (!box) return { bodyMeshName: best[0], bodyBounds: null };
    const bounds: BodyBounds = { min: box.min.clone(), max: box.max.clone() };
    return { bodyMeshName: best[0], bodyBounds: bounds };
  }, [nodes]);

  // Update color. Body and trim are repainted independently so users can have
  // (e.g.) a black shirt with a red collar / cuffs. Falls back to colorHex on
  // every mesh when trimColorHex isn't provided.
  useEffect(() => {
    const body = new THREE.Color(colorHex);
    const trim = new THREE.Color(trimColorHex ?? colorHex);
    scene.traverse((c: any) => {
      if (!c.isMesh || !c.material) return;
      const isBody = c.name === bodyMeshName;
      const target = isBody ? body : trim;
      c.material.color.set(target);
      if (c.material.metalness !== undefined) c.material.metalness = 0;
      if (c.material.roughness !== undefined) c.material.roughness = 0.5;
      c.material.needsUpdate = true;
    });
  }, [colorHex, trimColorHex, scene, bodyMeshName]);

  // Reset cursor when dragging is disabled (e.g. design cleared mid-drag).
  useEffect(() => {
    if (!enableDrag) document.body.style.cursor = "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [enableDrag]);

  // Convert a raycast hit to a local-space position. We deliberately don't
  // return rotation from the drag — drei's Decal auto-orients to the
  // closest vertex normal so the projection always lays flat on the curved
  // surface, regardless of where we drop the position. Letting drag also
  // set rotation caused the design to tilt unexpectedly as users moved it.
  const transformFromHit = (e: ThreeEvent<PointerEvent>) => {
    if (!e.face) return null;
    const localPoint = e.object.worldToLocal(e.point.clone());
    return {
      position: [localPoint.x, localPoint.y, localPoint.z] as [number, number, number],
    };
  };

  // Pointer-drag bookkeeping. We use refs (not state) for "is the user
  // currently rotating with shift held?" because we don't need re-renders
  // mid-drag — only the final-state notifications matter.
  const rotatingRef = useRef(false);
  const lastPointerXRef = useRef(0);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!enableDrag) return;
    e.stopPropagation();
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);

    // Shift-click → rotate mode. Plain click → move mode. The rotate mode
    // converts horizontal pointer travel to radians of in-plane rotation.
    const isShift = (e.nativeEvent as PointerEvent).shiftKey;
    if (isShift) {
      rotatingRef.current = true;
      lastPointerXRef.current = e.clientX;
      onDragChange(true);
      document.body.style.cursor = "ew-resize";
      return;
    }

    draggingRef.current = true;
    onDragChange(true);
    document.body.style.cursor = "grabbing";
    const t = transformFromHit(e);
    if (t) onCustomDecalChange(t);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (rotatingRef.current) {
      e.stopPropagation();
      const dx = e.clientX - lastPointerXRef.current;
      lastPointerXRef.current = e.clientX;
      // 200px of horizontal travel = one full rotation (2π). Feels natural
      // on both desktop trackpads and mobile finger sweeps.
      const delta = (dx / 200) * Math.PI * 2;
      if (delta !== 0) onActiveLayerRotate(delta);
      return;
    }
    if (!draggingRef.current) return;
    e.stopPropagation();
    const t = transformFromHit(e);
    if (t) onCustomDecalChange(t);
  };

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    if (rotatingRef.current) {
      rotatingRef.current = false;
      onDragChange(false);
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
      document.body.style.cursor = enableDrag ? "grab" : "auto";
      return;
    }
    if (!draggingRef.current) return;
    draggingRef.current = false;
    onDragChange(false);
    (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = enableDrag ? "grab" : "auto";
  };

  const handlePointerOver = () => {
    if (enableDrag && !draggingRef.current && !rotatingRef.current) document.body.style.cursor = "grab";
  };
  const handlePointerOut = () => {
    if (!draggingRef.current && !rotatingRef.current) document.body.style.cursor = "auto";
  };

  // Wheel-over-body resizes the active layer. Stops the event from also
  // dolly-ing the camera (OrbitControls would otherwise eat it).
  const handleWheel = (e: ThreeEvent<WheelEvent>) => {
    if (!enableDrag) return;
    e.stopPropagation();
    // Scroll up = bigger, scroll down = smaller. 1.05/0.95 = ~5% per tick.
    const factor = e.deltaY < 0 ? 1.05 : 0.95;
    onActiveLayerScale(factor);
  };

  // Debug mode: append ?debug=1 to the URL to visualise the projector cubes
  // as red wireframes. Reveals decal direction + clipping volume at a glance.
  const debugMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

  return (
    <group ref={groupRef}>
      {/* Debug: render every placement's projector cube as a red wireframe
          so we can see where each one is positioned and which way it faces. */}
      {debugMode && bodyBounds && (
        <>
          {(["front_chest", "back", "left_sleeve", "right_sleeve"] as const).map((id) => {
            const preset = resolvePlacement(id, bodyBounds);
            if (!preset) return null;
            return (
              <mesh key={`debug-${id}`} position={preset.position} rotation={preset.rotation}>
                <boxGeometry args={preset.scale} />
                <meshBasicMaterial wireframe color={id === "front_chest" ? "#ff0000" : id === "back" ? "#00ff00" : id === "left_sleeve" ? "#0000ff" : "#ffff00"} />
              </mesh>
            );
          })}
        </>
      )}
      {Object.entries(nodes).map(([name, node]: [string, any]) => {
        if (!node.isMesh) return null;
        const isBody = name === bodyMeshName;
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
            onWheel={isBody ? handleWheel : undefined}
          >
            {isBody && layers.map((layer) => {
              const preset = resolvePlacement(layer.placementId, bodyBounds);
              if (!preset) return null;
              const isActive = layer.placementId === activePlacement;
              const finalPos = (isActive && customDecal?.position) ?? layer.customPosition ?? preset.position;
              // Rotation: preset gives the cube's base orientation (so it
              // faces the right way out of the garment). User's customRotation
              // is in-plane Z-roll layered on top of that base orientation.
              const userRoll = layer.customRotation ?? 0;
              const finalRot: [number, number, number] = [
                preset.rotation[0],
                preset.rotation[1],
                preset.rotation[2] + userRoll,
              ];
              // User-applied scale slider value (single number) replaces the
              // visible width/height but keeps the preset's projection depth
              // so the back-bleed protection isn't lost when resizing.
              const finalScale: [number, number, number] = layer.customScale !== undefined
                ? [layer.customScale, layer.customScale, preset.scale[2]]
                : preset.scale;
              return (
                <Decal
                  key={layer.id}
                  position={finalPos as any}
                  rotation={finalRot as any}
                  scale={finalScale as any}
                  map={layer.texture}
                >
                  <meshStandardMaterial
                    map={layer.texture}
                    transparent
                    polygonOffset
                    polygonOffsetFactor={-1}
                    depthTest
                    depthWrite={false}
                    side={THREE.DoubleSide}
                  />
                </Decal>
              );
            })}

            {/* When there's no layer for the active placement, render a faded
                placeholder so the user knows where the design will land. */}
            {isBody && activePlacement && !layers.some(l => l.placementId === activePlacement) && (() => {
              const preset = resolvePlacement(activePlacement, bodyBounds);
              if (!preset) return null;
              return (
                <Decal
                  position={preset.position as any}
                  rotation={preset.rotation as any}
                  scale={preset.scale as any}
                  map={uploadTexture}
                >
                  <meshStandardMaterial
                    map={uploadTexture}
                    transparent
                    opacity={0.55}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    depthTest
                    depthWrite={false}
                    side={THREE.DoubleSide}
                  />
                </Decal>
              );
            })()}
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
  if (placement === "left_sleeve") return new THREE.Vector3(1.8, 0.3, 1.2);
  if (placement === "right_sleeve") return new THREE.Vector3(-1.8, 0.3, 1.2);
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
  /** Optional second color for trim meshes. See Model's trimColorHex prop. */
  trimColorHex?: string | null;
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
   * bar to apply a generated design onto the active placement. Legacy
   * single-layer API — prefer `layers` for multi-placement customization.
   */
  designImageUrl?: string | null;
  /**
   * Full multi-placement layer stack. Each entry renders as a separate
   * <Decal> on the body mesh. Overrides `designImageUrl` when provided.
   */
  layers?: DesignLayer[];
  /**
   * Fired when the user drags the active layer across the body mesh. Lets
   * the parent persist the new position/rotation back into the layer model.
   */
  onLayerDrag?: (placementId: string, t: { position: [number, number, number] }) => void;
  /** Fired on wheel-over-body for the active layer. `factor` is multiplicative
   *  (e.g. 1.05 = grow 5%, 0.95 = shrink 5%). Parent clamps to sensible bounds. */
  onLayerScale?: (placementId: string, factor: number) => void;
  /** Fired on shift-drag rotation. `deltaRadians` is incremental. */
  onLayerRotate?: (placementId: string, deltaRadians: number) => void;
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
  trimColorHex,
  modelPath = DEFAULT_MODEL_PATH,
  showControlsLayout = true,
  activePlacement,
  cinematic = false,
  zoom,
  resetSignal,
  designImageUrl,
  layers,
  onLayerDrag,
  onLayerScale,
  onLayerRotate,
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

  // Effective layer list — if the parent uses the new `layers` API we honour
  // that directly; otherwise we synthesise a single layer from the legacy
  // `designImageUrl` prop so existing callers (PDP gallery) keep working.
  const effectiveLayers = useMemo<DesignLayer[]>(() => {
    if (layers && layers.length > 0) return layers.filter((l) => !l.hidden);
    if (designImageUrl) {
      return [{
        id: "legacy-single",
        placementId: activePlacement ?? "chest_center",
        imageUrl: designImageUrl,
        source: "ai",
      }];
    }
    return [];
  }, [layers, designImageUrl, activePlacement]);

  // Cache of THREE.Texture instances keyed by source URL so we don't
  // re-decode the same image when the user switches placements. Old textures
  // are disposed when their URL leaves the cache (URL change or unmount).
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const [textureVersion, setTextureVersion] = useState(0);

  useEffect(() => {
    const cache = textureCacheRef.current;
    const wanted = new Set(effectiveLayers.map((l) => l.imageUrl));
    // Dispose textures no longer referenced by any layer.
    for (const [url, tex] of cache) {
      if (!wanted.has(url)) {
        tex.dispose();
        cache.delete(url);
      }
    }
    // Load any wanted URLs we haven't cached yet.
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    let pending = 0;
    for (const url of wanted) {
      if (cache.has(url)) continue;
      pending++;
      loader.load(
        url,
        (tex) => {
          if (cancelled) { tex.dispose(); return; }
          tex.anisotropy = 16;
          tex.colorSpace = THREE.SRGBColorSpace;
          cache.set(url, tex);
          setTextureVersion((v) => v + 1);
        },
        undefined,
        (err) => {
          if (import.meta.env.DEV) console.error("[Product3DViewer] texture load failed", url, err);
        },
      );
    }
    if (pending === 0) setTextureVersion((v) => v + 1); // trigger re-render when cache shrinks
    return () => { cancelled = true; };
  }, [effectiveLayers]);

  // Dispose remaining textures on unmount.
  useEffect(() => () => {
    const cache = textureCacheRef.current;
    for (const tex of cache.values()) tex.dispose();
    cache.clear();
  }, []);

  // Resolve effective layers into renderable form (with texture + per-layer
  // overrides). The Model component does the final coord resolution against
  // its body-mesh bbox so coordinates work across all 4 authored GLBs.
  const renderedLayers = useMemo<RenderedLayer[]>(() => {
    void textureVersion; // dep so we re-resolve when textures finish loading
    const cache = textureCacheRef.current;
    return effectiveLayers
      .map((l) => {
        const tex = cache.get(l.imageUrl);
        if (!tex) return null;
        return {
          id: l.id,
          placementId: l.placementId,
          texture: tex,
          customPosition: l.customPosition,
          customRotation: l.customRotation,
          customScale: l.scale,
        } as RenderedLayer;
      })
      .filter((x): x is RenderedLayer => x !== null);
  }, [effectiveLayers, textureVersion]);

  // Free-form decal positioning. When the user drags the design across the
  // body mesh we override the placement preset's position only — rotation
  // is auto-oriented to the surface normal by drei's Decal, so drag never
  // tilts the design unexpectedly. User in-plane roll is on the layer.
  const [customDecal, setCustomDecal] = useState<{
    position: [number, number, number];
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
              trimColorHex={trimColorHex}
              modelPath={modelPath}
              activePlacement={activePlacement}
              uploadTexture={uploadTexture}
              layers={renderedLayers}
              customDecal={customDecal}
              onCustomDecalChange={(t) => {
                setCustomDecal(t);
                setHasMovedDecal(true);
                if (activePlacement && onLayerDrag) onLayerDrag(activePlacement, t);
              }}
              enableDrag={!!activePlacement && renderedLayers.some((l) => l.placementId === activePlacement)}
              onDragChange={setIsDraggingDecal}
              onActiveLayerScale={(factor) => {
                if (activePlacement && onLayerScale) onLayerScale(activePlacement, factor);
              }}
              onActiveLayerRotate={(delta) => {
                if (activePlacement && onLayerRotate) onLayerRotate(activePlacement, delta);
              }}
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

      {/* Design-drag hint — appears once a design is applied to the active
          placement and the user hasn't moved it yet. Cleanly disappears the
          moment they drag. */}
      {renderedLayers.some((l) => l.placementId === activePlacement) && !hasMovedDecal && (
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
