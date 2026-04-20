import { Suspense, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Html, useProgress, Decal } from "@react-three/drei";
import * as THREE from "three";

interface ModelProps {
  colorHex: string;
  modelPath: string;
  activePlacement?: string;
  uploadTexture: THREE.CanvasTexture;
}

function Model({ colorHex, modelPath, activePlacement, uploadTexture }: ModelProps) {
  const { nodes, scene } = useGLTF(modelPath) as any;
  const groupRef = useRef<THREE.Group>(null!);

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

  const getPlacementProps = (id: string) => {
    switch (id) {
      case "chest_left":      return { position: [0.11, 0.07, 0.15], rotation: [0, 0, 0], scale: 0.14 };
      case "chest_center":    return { position: [0, 0.09, 0.15], rotation: [0, 0, 0], scale: 0.18 };
      case "large_center":    return { position: [0, -0.05, 0.15], rotation: [0, 0, 0], scale: 0.35 };
      case "back":            return { position: [0, 0, -0.165], rotation: [0, Math.PI, 0], scale: 0.38 };
      case "sleeve_left_top": return { position: [0.24, 0.08, 0.05], rotation: [0, Math.PI / 2.5, 0], scale: 0.12 };
      case "sleeve_right_top":return { position: [-0.24, 0.08, 0.05], rotation: [0, -Math.PI / 2.5, 0], scale: 0.12 };
      default: return null;
    }
  };

  const decalProps = activePlacement ? getPlacementProps(activePlacement) : null;

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

function CameraRig({ activePlacement }: { activePlacement?: string }) {
  const { camera } = useThree();
  
  useFrame((state, delta) => {
    let targetPos = new THREE.Vector3(0, 0, 2.5);
    
    if (activePlacement === "back") {
      targetPos.set(0, 0, -2.5);
    } else if (activePlacement?.includes("sleeve_left")) {
      targetPos.set(1.8, 0.4, 1.2);
    } else if (activePlacement?.includes("sleeve_right")) {
      targetPos.set(-1.8, 0.4, 1.2);
    }

    state.camera.position.lerp(targetPos, 0.1);
    state.camera.lookAt(0, 0, 0);
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
}

function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="size-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">{progress.toFixed(0)}%</span>
      </div>
    </Html>
  );
}

export default function Product3DViewer({
  colorHex,
  modelPath = "/3d/white-tshirt.glb",
  showControlsLayout = true,
  activePlacement,
}: Product3DViewerProps) {
  
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

  return (
    <div className="w-full h-full relative group bg-[#fafafa]">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} shadows dpr={[1, 2]}>
        <Suspense fallback={<CanvasLoader />}>
          <Center top>
            <Model
              colorHex={colorHex}
              modelPath={modelPath}
              activePlacement={activePlacement}
              uploadTexture={uploadTexture}
            />
          </Center>
          <CameraRig activePlacement={activePlacement} />
          <OrbitControls 
            makeDefault 
            enablePan={false}
            minDistance={1.5}
            maxDistance={4}
          />
        </Suspense>
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
      </Canvas>

      {showControlsLayout && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl border border-white/20 text-[11px] uppercase font-black tracking-[0.2em] text-white flex items-center gap-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
            <span>Interact</span>
          </div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload("/3d/white-tshirt.glb");
