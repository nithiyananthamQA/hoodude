import { ArrowLeft, Sparkles, Upload, Image as ImageIcon, Type, Layers, ChevronRight, ShoppingBag, Minus, Plus, RotateCw, Palette } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Suspense, useMemo, useState, Component, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { findProduct } from "./products";
import Product3DViewer from "./Product3DViewer";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error("[Product3DViewer]", error); }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface CustomizePageProps {
  onOpenCart: () => void;
}

type ToolId = "ai" | "upload" | "stock" | "text" | "layers";

export default function CustomizePage({ onOpenCart }: CustomizePageProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const product = useMemo(() => findProduct(params.get("id")), [params]);

  const [activeTool, setActiveTool] = useState<ToolId>("ai");
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(product.moq || 25);
  const [zoom, setZoom] = useState(100);
  const [resetSignal, setResetSignal] = useState(0);

  const placements = [
    { id: "chest_left", label: "Left chest" },
    { id: "chest_center", label: "Center chest" },
    { id: "large_center", label: "Large center", badge: "New", badgeType: "primary" },
    { id: "sleeve_left_top", label: "Left sleeve top" },
    { id: "sleeve_right_top", label: "Right sleeve top" },
    { id: "back", label: "Back", badges: [{ text: "DTG", type: "default" }, { text: "New", type: "primary" }] },
    { id: "label_outside", label: "Outside label", badges: [{ text: "DTG", type: "default" }] },
    { id: "label_inside", label: "Inside label", badges: [{ text: "DTG", type: "default" }] },
  ];
  const [activePlacement, setActivePlacement] = useState(placements[0].id);

  const activeColor = product.colors.find((c) => c.name === selectedColor) ?? product.colors[0];
  const totalPrice = product.price * quantity;

  const sidebarTools: { id: ToolId; icon: ReactNode; label: string }[] = [
    { id: "ai", icon: <Sparkles size={20} strokeWidth={2} />, label: "AI" },
    { id: "upload", icon: <Upload size={20} strokeWidth={2} />, label: "Upload" },
    { id: "stock", icon: <ImageIcon size={20} strokeWidth={2} />, label: "Stock" },
    { id: "text", icon: <Type size={20} strokeWidth={2} />, label: "Text" },
    { id: "layers", icon: <Layers size={20} strokeWidth={2} />, label: "Layers" },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col items-center py-6 px-4 z-50 shrink-0">
        <div className="flex flex-col items-center gap-8 w-[64px] bg-white/80 backdrop-blur-xl border border-black/5 rounded-[32px] py-6 shadow-2xl shadow-black/5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 group"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>

          <div className="w-full flex flex-col items-center gap-2 px-1">
            {sidebarTools.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-full transition-all duration-500 cursor-pointer group ${
                    isActive 
                      ? "bg-black text-white shadow-lg shadow-black/20" 
                      : "text-black/30 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <div className="transition-transform duration-500 group-hover:scale-110">
                    {tool.icon}
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -left-1 w-1 h-4 bg-black rounded-full"
                      initial={false}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-black/5 w-8 flex justify-center">
            <button className="text-black/20 hover:text-black transition-colors">
              <Palette size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-[72px] border-b border-black/5 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3 text-[13px] min-w-0">
            <button onClick={() => navigate("/")} className="text-black/40 hover:text-black transition-colors whitespace-nowrap">Home</button>
            <ChevronRight size={14} className="text-black/20 shrink-0" />
            <span className="font-bold text-black truncate">{product.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-[13px] font-bold text-black/40 hover:text-black px-4 transition-colors">
              Save Draft
            </button>
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-5 h-10 bg-black text-white rounded-full text-[13px] font-bold shadow-lg shadow-black/10 hover:bg-[#333] transition-all"
            >
              <ShoppingBag size={16} />
              Add to Cart · ${totalPrice.toLocaleString()}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-[#fafafa] relative flex flex-col">
          <AnimatePresence>
            {(activePlacement === 'back' || activePlacement.startsWith('label')) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#0369a1] text-white overflow-hidden"
              >
                <div className="px-8 py-2 flex items-center gap-3 text-[11px] font-medium">
                  <div className="size-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px]">i</span>
                  </div>
                  <span>This placement will be printed using <strong>DTG (Direct to Garment)</strong>. Your main design on the front will be embroidered.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-[56px] bg-white border-b border-black/[0.04] flex items-center px-8 relative z-20">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 -mx-2 px-2 scroll-smooth">
              {placements.map((p) => {
                const isActive = activePlacement === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePlacement(p.id)}
                    className={`relative flex items-center gap-2.5 px-4 py-2 rounded-full text-[12px] font-bold tracking-tight transition-all duration-300 shrink-0 whitespace-nowrap group ${
                      isActive 
                        ? "text-black bg-black/[0.04]" 
                        : "text-black/40 hover:text-black hover:bg-black/[0.02]"
                    }`}
                  >
                    <span className="relative z-10">{p.label}</span>
                    
                    {(p.badge || p.badges) && (
                      <div className="flex items-center gap-1">
                        {p.badge && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                            p.badgeType === "primary" ? "bg-[#fa5d42] text-white" : "bg-black/10 text-black/60"
                          }`}>
                            {p.badge}
                          </span>
                        )}
                        {p.badges?.map((b) => (
                          <span key={b.text} className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                            b.type === "primary" ? "bg-[#fa5d42] text-white" : "bg-black/10 text-black/60"
                          }`}>
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 border border-black/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-8">
            <ModelErrorBoundary>
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="size-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-black/20">Initializing Lab</span>
                  </div>
                }
              >
                <Product3DViewer
                  colorHex={activeColor.hex}
                  modelPath={product.modelPath}
                  showControlsLayout={false}
                  zoom={zoom}
                  resetSignal={resetSignal}
                  activePlacement={activePlacement}
                />
              </Suspense>
            </ModelErrorBoundary>


            {/* Float Controls */}
            <div className="absolute bottom-10 right-10 bg-white/80 backdrop-blur-md border border-black/5 rounded-full p-1.5 shadow-2xl flex items-center gap-2 z-10">
              <div className="flex items-center bg-black/5 rounded-full px-1">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="size-8 flex items-center justify-center rounded-full hover:bg-black/5"><Minus size={16} /></button>
                <span className="text-[12px] font-bold w-12 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(400, z + 10))} className="size-8 flex items-center justify-center rounded-full hover:bg-black/5"><Plus size={16} /></button>
              </div>
              <div className="h-5 w-px bg-black/10" />
              <button onClick={() => { setZoom(100); setResetSignal((n) => n + 1); }} className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-bold text-black/60 hover:bg-black/5"><RotateCw size={14} /> Reset</button>
            </div>

            {/* Editorial Spec Card */}
            <div className="absolute bottom-8 left-8 bg-white rounded-[20px] shadow-2xl shadow-black/[0.08] w-[280px] overflow-hidden z-10 border border-black/[0.04]">
              <div
                className="h-[88px] relative overflow-hidden"
                style={{ backgroundColor: activeColor.hex }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div className="flex flex-col leading-none">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1"
                      style={{ color: activeColor.hex === "#ffffff" || activeColor.hex === "#fff" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)" }}
                    >
                      Selected
                    </span>
                    <span
                      className="text-[15px] font-bold tracking-tight"
                      style={{ color: activeColor.hex === "#ffffff" || activeColor.hex === "#fff" ? "#000" : "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
                    >
                      {activeColor.name}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: activeColor.hex === "#ffffff" || activeColor.hex === "#fff" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)" }}
                  >
                    {activeColor.hex}
                  </span>
                </div>
              </div>

              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  {product.colors.map((c) => {
                    const isActive = selectedColor === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        title={c.name}
                        className={`relative flex-1 h-7 rounded-md transition-all duration-200 ${
                          isActive ? "ring-2 ring-black ring-offset-2 ring-offset-white" : "hover:scale-[1.05]"
                        }`}
                        style={{ backgroundColor: c.hex, border: "1px solid rgba(0,0,0,0.08)" }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mx-4 my-2 h-px bg-black/[0.06]" />

              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/30">Size</span>
                <div className="flex items-center gap-1">
                  {product.sizes.map((s) => {
                    const isActive = selectedSize === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`h-7 min-w-7 px-2 rounded-md text-[11px] font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-black text-white"
                            : "text-black/40 hover:text-black hover:bg-black/[0.04]"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mx-4 h-px bg-black/[0.06]" />

              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex flex-col leading-tight">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/30">Units</span>
                  <span className="text-[9px] text-black/30 font-medium">MOQ · {product.moq}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(product.moq, q - 1))}
                    disabled={quantity <= product.moq}
                    className="size-6 flex items-center justify-center rounded-full border border-black/10 text-black/60 hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black/60 disabled:hover:border-black/10"
                  >
                    <Minus size={12} strokeWidth={2.5} />
                  </button>
                  <span
                    className="text-[20px] font-bold tabular-nums text-black min-w-[40px] text-center leading-none"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="size-6 flex items-center justify-center rounded-full border border-black/10 text-black/60 hover:bg-black hover:text-white hover:border-black transition-all"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
