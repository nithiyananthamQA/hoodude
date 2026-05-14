import { ArrowLeft, Sparkles, Upload, Image as ImageIcon, Type, Layers, ChevronRight, ShoppingBag, Minus, Plus, RotateCw, Box, Glasses, User, X, Undo2, Redo2, Save, Share2, Heart } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Suspense, useEffect, useMemo, useRef, useState, Component, ReactNode, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { findProduct, products } from "./products";
import type { SizeCode } from "./products";
import type { Product3DViewerHandle, DesignLayer } from "./Product3DViewer";
const Product3DViewer = lazy(() => import("./Product3DViewer"));
// Inlined so we don't pull the 3D module into this page's static graph. The
// canonical value still lives in Product3DViewer.tsx; keep them in sync.
const DEFAULT_MODEL_PATH = "/3d/white-tshirt.glb";
import PageHead from "./PageHead";
import NotFoundPage from "./NotFoundPage";
import PromptBar from "./customize/PromptBar";
import ARModal from "./product/ARModal";
import VRModal from "./product/VRModal";
import TryOnModal from "./product/TryOnModal";
import { generateDesign, isDesignGenConfigured, pollinationsUrl } from "../utils/generateDesign";
import { track } from "../utils/analytics";
import { useCart } from "../store/CartContext";
import { toast } from "sonner";

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
  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.error("[Product3DViewer]", error);
  }
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
  const [params] = useSearchParams();
  // Fall back to the first available product when no `?id=` is provided so
  // the page is reachable from /customize directly (e.g. from a nav link).
  // Without this fallback, `findProduct` returns undefined and the entire
  // component crashes before render.
  const product = useMemo(
    () => findProduct(params.get("id")) ?? products[0],
    [params],
  );

  // Defensive guard — if products[] is somehow empty in a future state, we
  // render the 404 instead of crashing on `product.colors[0].name`.
  if (!product) return <NotFoundPage onOpenCart={onOpenCart} />;

  return <CustomizePageInner product={product} onOpenCart={onOpenCart} />;
}

type Product = ReturnType<typeof findProduct> extends infer T ? Exclude<T, undefined> : never;

function CustomizePageInner({
  product,
  onOpenCart,
}: {
  product: Product;
  onOpenCart: () => void;
}) {
  const navigate = useNavigate();
  const { add: addToCart } = useCart();

  const [activeTool, setActiveTool] = useState<ToolId>("ai");
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  // Trim color picker — independent of body color. `null` means "match body"
  // which keeps the legacy one-color appearance for users who don't engage.
  const [trimColor, setTrimColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(product.moq || 25);
  const [zoom, setZoom] = useState(100);
  const [resetSignal, setResetSignal] = useState(0);

  // Per-placement design layers. Each placement holds at most one layer;
  // applying a new design to a placement replaces its previous layer.
  const [layers, setLayersRaw] = useState<DesignLayer[]>([]);

  // ─── Undo / redo history ─────────────────────────────────────────────
  // We snapshot the layers array on every committed change. Continuous
  // gestures (wheel-resize, shift-rotate, drag-move) push one frame per
  // event, which gives the user fine-grained step-back. Stack is capped at
  // 60 entries so memory doesn't grow unbounded for long sessions.
  const historyRef = useRef<DesignLayer[][]>([[]]);
  const historyIndexRef = useRef(0);
  const [historyVersion, setHistoryVersion] = useState(0);
  const HISTORY_MAX = 60;

  const setLayers = (next: React.SetStateAction<DesignLayer[]>) => {
    setLayersRaw((prev) => {
      const resolved = typeof next === "function" ? (next as (p: DesignLayer[]) => DesignLayer[])(prev) : next;
      // Drop any "future" frames (post-undo edit) before appending.
      const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
      truncated.push(resolved);
      // Cap the stack — keep the most recent HISTORY_MAX frames.
      const capped = truncated.length > HISTORY_MAX
        ? truncated.slice(truncated.length - HISTORY_MAX)
        : truncated;
      historyRef.current = capped;
      historyIndexRef.current = capped.length - 1;
      setHistoryVersion((v) => v + 1);
      return resolved;
    });
  };

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;
  void historyVersion; // keep the derived booleans fresh

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setLayersRaw(historyRef.current[historyIndexRef.current]);
    setHistoryVersion((v) => v + 1);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setLayersRaw(historyRef.current[historyIndexRef.current]);
    setHistoryVersion((v) => v + 1);
  };
  const [designBusy, setDesignBusy] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const aiAvailable = isDesignGenConfigured();

  /** Upsert a layer at the active placement. Replaces an existing layer at
   *  the same placement so users get the obvious "newest wins" behaviour. */
  const applyLayerAtActivePlacement = (
    imageUrl: string,
    source: DesignLayer["source"],
  ) => {
    setLayers((prev) => {
      const without = prev.filter((l) => l.placementId !== activePlacement);
      const layer: DesignLayer = {
        id: `${activePlacement}-${Date.now()}`,
        placementId: activePlacement,
        imageUrl,
        source,
      };
      return [...without, layer];
    });
  };

  /** Single representative image for the cart thumbnail / draft summary. */
  const primaryDesignUrl: string | null = layers[layers.length - 1]?.imageUrl ?? null;

  // Immersive view modals (mirrored from PDP)
  const [arOpen, setArOpen] = useState(false);
  const [vrOpen, setVrOpen] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  // Snapshot the 3D viewer at try-on time so the AI sees the customized
  // shirt (with the user's design applied) — not the marketing photo.
  const viewer3DRef = useRef<Product3DViewerHandle>(null);
  const [tryOnImage, setTryOnImage] = useState<string>(product.image);

  const openTryOn = () => {
    // Use the rendered 3D scene only when the customer has actually applied
    // a design. Otherwise the marketing photo is sharper and more useful to
    // the model.
    const snapshot = layers.length > 0 ? viewer3DRef.current?.snapshot() : null;
    setTryOnImage(snapshot ?? product.image);
    setTryOnOpen(true);
  };

  // Tool panel state — when activeTool is "ai" the panel hides (the prompt
  // bar at the bottom is the AI surface); for other tools the panel shows.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        applyLayerAtActivePlacement(reader.result, "upload");
        track("design_generated", { product: product.name, source: "upload" });
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop file upload onto the workspace. Hovering an image file
  // anywhere over the 3D viewer surfaces a drop overlay; releasing applies
  // it as the decal at whichever placement is currently active. Removes the
  // need to open the Upload tool first.
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setDropError("Drop an image file (PNG, JPG, SVG).");
      setTimeout(() => setDropError(null), 3500);
      return;
    }
    handleFileSelected(file);
  };

  const applyTextDesign = (text: string, weight: 400 | 500 | 600, dark: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dark ? "#0a0a0a" : "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = text.split("\n").filter((l) => l.length > 0);
    if (lines.length === 0) return;
    // Auto-size so the longest line spans ~80% of the canvas
    let fontSize = 220;
    ctx.font = `${weight} ${fontSize}px Poppins, sans-serif`;
    const longest = lines.reduce((a, b) => (b.length > a.length ? b : a));
    while (fontSize > 40 && ctx.measureText(longest).width > canvas.width * 0.82) {
      fontSize -= 8;
      ctx.font = `${weight} ${fontSize}px Poppins, sans-serif`;
    }
    const lineHeight = fontSize * 1.15;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });

    // For dark text on white we keep as-is; for white text on white we
    // re-fill the bg dark so the text is visible on the model.
    if (!dark) {
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const octx = out.getContext("2d")!;
      octx.fillStyle = "#0a0a0a";
      octx.fillRect(0, 0, out.width, out.height);
      octx.drawImage(canvas, 0, 0);
      applyLayerAtActivePlacement(out.toDataURL("image/png"), "text");
    } else {
      applyLayerAtActivePlacement(canvas.toDataURL("image/png"), "text");
    }
    track("design_generated", { product: product.name, source: "text" });
  };

  const applyStockDesign = (url: string) => {
    applyLayerAtActivePlacement(url, "stock");
    track("design_generated", { product: product.name, source: "stock" });
  };

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

  // ─── Pricing model (Slice 5) ───────────────────────────────────────────
  // Mirrors common screen-print / embroidery / DTG markups. Surcharges are
  // additive on top of the base product price; quantity multiplies the
  // per-unit total, not the surcharges (a 12-unit order pays for printing
  // 12 times). Two-color trim is a one-time setup fee.
  const PLACEMENT_SURCHARGE: Record<string, number> = {
    chest_left: 4,
    chest_center: 4,
    large_center: 6,
    back: 8,
    sleeve_left_top: 4,
    sleeve_right_top: 4,
    label_outside: 3,
    label_inside: 3,
  };
  const TRIM_SURCHARGE = trimColor ? 3 : 0;

  const layerSurchargesPerUnit = layers
    .filter((l) => !l.hidden)
    .reduce((sum, l) => sum + (PLACEMENT_SURCHARGE[l.placementId] ?? 0), 0);
  const perUnitPrice = product.price + layerSurchargesPerUnit;
  const subtotalDesigns = perUnitPrice * quantity;
  const totalPrice = subtotalDesigns + TRIM_SURCHARGE;

  // Itemised breakdown for the popover. Built once per render off the same
  // data the total is built from so they're guaranteed in sync.
  const priceLines = useMemo(() => {
    const lines: Array<{ label: string; amount: number; note?: string }> = [
      { label: "Base", amount: product.price * quantity, note: `${quantity} × $${product.price}` },
    ];
    if (layerSurchargesPerUnit > 0) {
      const visible = layers.filter((l) => !l.hidden);
      visible.forEach((l) => {
        const ph = placements.find((p) => p.id === l.placementId);
        const surcharge = PLACEMENT_SURCHARGE[l.placementId] ?? 0;
        if (surcharge > 0) {
          lines.push({
            label: ph?.label ?? l.placementId,
            amount: surcharge * quantity,
            note: `$${surcharge} × ${quantity}`,
          });
        }
      });
    }
    if (TRIM_SURCHARGE > 0) {
      lines.push({ label: "Two-color trim setup", amount: TRIM_SURCHARGE, note: "one-time" });
    }
    return lines;
  }, [product.price, quantity, layers, layerSurchargesPerUnit, TRIM_SURCHARGE, placements]);

  const [breakdownOpen, setBreakdownOpen] = useState(false);

  // ─── Saved designs library (Slice 6) ─────────────────────────────────
  // Designs are stored in localStorage under a global key keyed by a short
  // id. Same browser → loads instantly. Different device → we show a clear
  // "this design isn't available on this device" message because we don't
  // have a backend yet.
  type SavedDesignRecord = {
    id: string;
    productId: string;
    name: string;
    color: string;
    trimColor: string | null;
    size: string;
    quantity: number;
    placement: string;
    layers: DesignLayer[];
    thumbnail: string | null;
    savedAt: string;
  };
  const SAVED_KEY = "hoodude.savedDesigns.v1";

  const readSavedDesigns = (): SavedDesignRecord[] => {
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [savedDesigns, setSavedDesigns] = useState<SavedDesignRecord[]>(() => readSavedDesigns());
  const [libraryOpen, setLibraryOpen] = useState(false);

  const generateShortId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const saveCurrentDesign = (name?: string) => {
    const id = generateShortId();
    const thumbnail = viewer3DRef.current?.snapshot() ?? null;
    const record: SavedDesignRecord = {
      id,
      productId: product.id,
      name: name || `${product.name} · ${new Date().toLocaleDateString()}`,
      color: activeColor.name,
      trimColor,
      size: selectedSize,
      quantity,
      placement: activePlacement,
      layers,
      thumbnail,
      savedAt: new Date().toISOString(),
    };
    const next = [record, ...readSavedDesigns()].slice(0, 30); // cap to 30 saves
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      setSavedDesigns(next);
      track("customize_save_design", { product_id: product.id, layer_count: layers.length });
      toast.success("Design saved to your library", {
        description: "Find it under 'My designs' on this device.",
      });
      return id;
    } catch {
      toast.error("Couldn't save", { description: "Storage is full. Remove old designs first." });
      return null;
    }
  };

  const loadSavedDesign = (record: SavedDesignRecord) => {
    if (record.productId !== product.id) {
      toast.error("Different product", {
        description: "That saved design was for a different garment.",
      });
      return;
    }
    if (product.colors.some((c) => c.name === record.color)) setSelectedColor(record.color);
    if (record.trimColor && product.colors.some((c) => c.name === record.trimColor)) {
      setTrimColor(record.trimColor);
    } else if (!record.trimColor) {
      setTrimColor(null);
    }
    if (product.sizes.includes(record.size as SizeCode)) setSelectedSize(record.size as SizeCode);
    if (typeof record.quantity === "number" && record.quantity > 0) setQuantity(record.quantity);
    if (placements.some((p) => p.id === record.placement)) setActivePlacement(record.placement);
    setLayers(record.layers);
    setLibraryOpen(false);
    toast.success(`Loaded "${record.name}"`);
  };

  const removeSavedDesign = (id: string) => {
    const next = readSavedDesigns().filter((r) => r.id !== id);
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      setSavedDesigns(next);
    } catch { /* ignore */ }
  };

  // Share URL — encodes the saved-design id in a query param so reload-by-
  // link works on the same device. Auto-loads on mount if the id resolves
  // to a saved record.
  const shareCurrentDesign = async () => {
    const id = saveCurrentDesign();
    if (!id) return;
    const url = `${window.location.origin}/customize?id=${product.id}&d=${id}`;
    try {
      // Native share sheet on mobile; falls back to clipboard otherwise.
      if (navigator.share) {
        await navigator.share({ title: "My HOODUDE design", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied", {
          description: "Same-browser shares only — open the link on this device to restore the design.",
        });
      }
    } catch {
      // User cancelled share — keep the design saved, that's still useful.
    }
  };

  // On mount, if URL has ?d=<id>, try to load that saved design.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const sharedId = sp.get("d");
    if (!sharedId) return;
    const record = readSavedDesigns().find((r) => r.id === sharedId);
    if (record && record.productId === product.id) {
      loadSavedDesign(record);
    } else if (sharedId) {
      toast("Design not on this device", {
        description: "Shared designs are saved locally. Open the link on the device where you created it.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const DRAFT_KEY = `hoodude.customize.draft.${product.id}`;

  // Restore a saved draft once, on first mount for this product.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        color?: string;
        trimColor?: string | null;
        size?: string;
        quantity?: number;
        placement?: string;
        // New (multi-layer) format
        layers?: DesignLayer[];
        // Legacy (single-design) format — kept for back-compat with drafts
        // saved before slice-1 introduced per-placement layers.
        designUrl?: string | null;
      };
      if (draft.color && product.colors.some((c) => c.name === draft.color)) {
        setSelectedColor(draft.color);
      }
      if (draft.trimColor && product.colors.some((c) => c.name === draft.trimColor)) {
        setTrimColor(draft.trimColor);
      }
      if (draft.size && product.sizes.includes(draft.size as SizeCode)) {
        setSelectedSize(draft.size as SizeCode);
      }
      if (typeof draft.quantity === "number" && draft.quantity > 0) {
        setQuantity(draft.quantity);
      }
      if (draft.placement && placements.some((p) => p.id === draft.placement)) {
        setActivePlacement(draft.placement);
      }
      if (Array.isArray(draft.layers) && draft.layers.length > 0) {
        // New draft format — multiple per-placement layers preserved verbatim.
        setLayers(draft.layers as DesignLayer[]);
      } else if (draft.designUrl) {
        // Legacy draft format from before multi-layer support — fall back to a
        // single layer at the saved placement.
        setLayers([{
          id: `${draft.placement ?? activePlacement}-legacy`,
          placementId: draft.placement ?? activePlacement,
          imageUrl: draft.designUrl,
          source: "upload",
        }]);
      }
      toast("Draft restored", {
        description: "We brought back your last customization for this product.",
      });
    } catch {
      /* corrupt draft — ignore */
    }
    // Intentionally only on mount per product.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleAddToCart = () => {
    const hasCustom = layers.length > 0;
    addToCart({
      // Each customized variant is its own cart line. Including a custom-
      // suffix when there's at least one design ensures multiple distinct
      // customizations of the same product/color/size stack as separate lines.
      id: hasCustom
        ? `${product.id}::${activeColor.name}::${selectedSize}::custom-${Date.now()}`
        : undefined,
      productId: product.id,
      name: hasCustom ? `${product.name} · Custom` : product.name,
      image: primaryDesignUrl ?? product.image,
      color: activeColor.name,
      colorHex: activeColor.hex,
      size: selectedSize,
      // Per-unit price includes placement print surcharges so the cart
      // reflects what the user saw on the customize page. Trim setup is
      // a one-time fee — folded into the first unit so the cart total
      // still matches the customize total exactly.
      price: perUnitPrice + (TRIM_SURCHARGE > 0 && quantity > 0 ? TRIM_SURCHARGE / quantity : 0),
      quantity,
      maxStock: product.stock === "Make to Order" ? 200 : 50,
    });
    track("customize_add_to_cart", {
      product_id: product.id,
      placement: activePlacement,
      has_design: hasCustom,
      layer_count: layers.length,
      quantity,
    });
    toast.success("Added to bag", {
      description: `${product.name} · ${activeColor.name} · ${selectedSize} · ×${quantity}${hasCustom ? ` · ${layers.length} design${layers.length === 1 ? "" : "s"}` : ""}`,
    });
    onOpenCart();
  };

  const handleSaveDraft = () => {
    try {
      const draft = {
        productId: product.id,
        color: activeColor.name,
        trimColor,
        size: selectedSize,
        quantity,
        placement: activePlacement,
        layers,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      track("customize_save_draft", { product_id: product.id, layer_count: layers.length });
      toast.success("Draft saved", {
        description: "Pick up where you left off next time you open this product.",
      });
    } catch {
      toast.error("Couldn't save draft", { description: "Storage is full or blocked." });
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (designBusy) return;
    track("design_prompt_submit", {
      product: product.name,
      placement: activePlacement,
      prompt_length: prompt.length,
    });
    setDesignBusy(true);
    setDesignError(null);
    try {
      const result = await generateDesign({
        prompt,
        category: product.category,
        placement: activePlacement,
      });
      applyLayerAtActivePlacement(result.imageDataUrl, "ai");
      track("design_generated", { product: product.name, placement: activePlacement });
      // Auto-switch the sidebar to AI so the user knows where the design came
      // from. Subtle context-cue.
      setActiveTool("ai");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't generate that design.";
      setDesignError(message);
    } finally {
      setDesignBusy(false);
    }
  };

  /** Remove only the layer at the active placement (per-placement clear). */
  const clearActivePlacementLayer = () => {
    setLayers((prev) => prev.filter((l) => l.placementId !== activePlacement));
    setDesignError(null);
  };

  /** Remove a specific layer by id (used by the Layers panel). */
  const removeLayer = (layerId: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== layerId));
  };

  /** Toggle a layer's visibility without removing it (Layers panel eye icon). */
  const toggleLayerHidden = (layerId: string) => {
    setLayers((prev) => prev.map((l) => l.id === layerId ? { ...l, hidden: !l.hidden } : l));
  };

  /** Clear every layer at once. */
  const clearAllLayers = () => {
    setLayers([]);
    setDesignError(null);
  };

  /** Selecting a layer in the Layers panel switches the active placement to it. */
  const selectLayer = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer) setActivePlacement(layer.placementId);
  };

  /** Backward-compat alias used by older call sites in this file. */
  const clearDesign = clearActivePlacementLayer;

  // ─── Per-layer transform editing (Slice 2) ────────────────────────────
  // The "active layer" is the one at the current placement. These handlers
  // mutate just that layer.
  const MIN_SCALE = 0.04;
  const MAX_SCALE = 0.8;

  const updateActiveLayer = (mutator: (l: DesignLayer) => DesignLayer) => {
    setLayers((prev) =>
      prev.map((l) => (l.placementId === activePlacement ? mutator(l) : l)),
    );
  };

  const scaleActiveLayer = (factor: number) => {
    updateActiveLayer((l) => {
      const current = l.scale ?? 0.2;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, current * factor));
      return { ...l, scale: next };
    });
  };

  const setActiveLayerScale = (scale: number) => {
    updateActiveLayer((l) => ({ ...l, scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)) }));
  };

  const rotateActiveLayer = (deltaRadians: number) => {
    updateActiveLayer((l) => {
      const [rx, ry, rz] = l.customRotation ?? [0, 0, 0];
      // We rotate around the surface-normal axis (local Z of the decal) so
      // it's an "in-plane" rotation from the user's perspective.
      return { ...l, customRotation: [rx, ry, rz + deltaRadians] };
    });
  };

  const setActiveLayerRotation = (radians: number) => {
    updateActiveLayer((l) => {
      const [rx, ry] = l.customRotation ?? [0, 0, 0];
      return { ...l, customRotation: [rx, ry, radians] };
    });
  };

  /** Snap the active layer back to the placement's preset position/scale/rotation. */
  const resetActiveLayerTransform = () => {
    updateActiveLayer((l) => ({
      ...l,
      customPosition: undefined,
      customRotation: undefined,
      scale: undefined,
    }));
  };

  // The currently-edited layer (if any) and its effective transform values
  // for the floating Properties panel.
  const activeLayer = layers.find((l) => l.placementId === activePlacement) ?? null;

  // ─── Keyboard shortcuts ────────────────────────────────────────────────
  // Cmd/Ctrl+Z = undo · Cmd/Ctrl+Shift+Z (or Cmd/Ctrl+Y) = redo
  // Delete/Backspace on the canvas (not in a text input) = remove active layer
  // R = reset active layer's transform
  // 1..8 = jump to placement at that index
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when the user is typing in any input/textarea/contentEditable so
      // we don't fight the prompt bar or text-design field.
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;

      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();

      if (mod && k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && ((k === "z" && e.shiftKey) || k === "y")) {
        e.preventDefault();
        redo();
        return;
      }
      if ((k === "delete" || k === "backspace") && activeLayer) {
        e.preventDefault();
        removeLayer(activeLayer.id);
        return;
      }
      if (k === "r" && activeLayer && !mod) {
        e.preventDefault();
        resetActiveLayerTransform();
        return;
      }
      // Number keys 1..8 jump to placement at that index.
      const n = parseInt(k, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= placements.length && !mod) {
        e.preventDefault();
        setActivePlacement(placements[n - 1].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer?.id, placements.length]);

  const sidebarTools: { id: ToolId; icon: ReactNode; label: string }[] = [
    { id: "ai", icon: <Sparkles size={17} strokeWidth={1.6} />, label: "AI" },
    { id: "upload", icon: <Upload size={17} strokeWidth={1.6} />, label: "Upload" },
    { id: "stock", icon: <ImageIcon size={17} strokeWidth={1.6} />, label: "Stock" },
    { id: "text", icon: <Type size={17} strokeWidth={1.6} />, label: "Text" },
    { id: "layers", icon: <Layers size={17} strokeWidth={1.6} />, label: "Layers" },
  ];

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <PageHead title="Customize" description="Design your own HOODUDE piece — pick fabric, colors and prints." noindex />
      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col items-center py-6 px-4 z-50 shrink-0">
        <div className="flex flex-col items-center w-[72px] bg-white/95 backdrop-blur-xl border border-black/5 rounded-3xl py-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="size-9 rounded-full bg-fg text-white flex items-center justify-center hover:bg-brand btn-press-sm transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={1.8} />
          </button>

          <div className="w-9 h-px bg-black/10 my-4" />

          <div className="w-full flex flex-col items-center gap-0.5 px-2">
            {sidebarTools.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  aria-label={tool.label}
                  aria-pressed={isActive}
                  className={`group w-full flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-colors duration-200 ${
                    isActive
                      ? "bg-fg text-white"
                      : "text-fg-faint hover:bg-black/[0.04] hover:text-fg"
                  }`}
                >
                  <span>{tool.icon}</span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-medium">
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── TOOL PANEL (DESKTOP) — slides in from the left when a non-AI
           tool is active, slides back out to nothing on close. AI uses the
           bottom prompt bar so its panel is empty. ── */}
      <AnimatePresence initial={false}>
        {activeTool !== "ai" && (
          <motion.div
            key="tool-panel-desktop"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block overflow-hidden shrink-0"
          >
            <div className="w-[260px] h-full">
              <ToolPanel
                activeTool={activeTool}
                product={product}
                designUrl={primaryDesignUrl}
                layers={layers}
                placements={placements}
                activePlacement={activePlacement}
                onSelectLayer={selectLayer}
                onToggleLayerHidden={toggleLayerHidden}
                onRemoveLayer={removeLayer}
                onClearAllLayers={clearAllLayers}
                onUpload={handleUploadClick}
                onApplyStock={applyStockDesign}
                onApplyText={applyTextDesign}
                onClearDesign={clearActivePlacementLayer}
                onClose={() => setActiveTool("ai")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOOL PANEL (MOBILE) — bottom sheet variant. Slides up from the
           bottom edge to cover the bottom UI when a non-AI tool is active. ── */}
      <AnimatePresence>
        {activeTool !== "ai" && (
          <>
            <motion.div
              key="tool-panel-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm"
              onClick={() => setActiveTool("ai")}
              aria-hidden="true"
            />
            <motion.div
              key="tool-panel-mobile"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-3xl shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.18)] max-h-[80vh] overflow-y-auto"
              role="dialog"
              aria-label={`${activeTool} tool`}
            >
              {/* iOS-style grab handle */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-black/5 z-10">
                <div className="flex items-center justify-center pt-2 pb-1">
                  <span className="w-10 h-1 rounded-full bg-black/15" />
                </div>
              </div>
              <ToolPanel
                activeTool={activeTool}
                product={product}
                designUrl={primaryDesignUrl}
                layers={layers}
                placements={placements}
                activePlacement={activePlacement}
                onSelectLayer={selectLayer}
                onToggleLayerHidden={toggleLayerHidden}
                onRemoveLayer={removeLayer}
                onClearAllLayers={clearAllLayers}
                onUpload={handleUploadClick}
                onApplyStock={applyStockDesign}
                onApplyText={applyTextDesign}
                onClearDesign={clearActivePlacementLayer}
                onClose={() => setActiveTool("ai")}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hidden file input for the Upload tool. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
          e.target.value = "";
        }}
      />

      {/* ── MAIN WORKSPACE ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-[60px] border-b border-black/5 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2.5 text-meta min-w-0">
            <button
              onClick={() => navigate("/")}
              className="text-fg-faint hover:text-fg transition-colors whitespace-nowrap"
            >
              Home
            </button>
            <ChevronRight size={13} className="text-fg-faint shrink-0" />
            <span className="font-semibold text-fg truncate">{product.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo / Redo — keyboard shortcuts (Cmd/Ctrl+Z and Shift) also
                trigger these. Buttons are disabled-styled when their stack
                edge is hit so users get visual feedback. */}
            <div className="flex items-center mr-1 rounded-full bg-black/[0.04] p-0.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo (Cmd+Z)"
                title="Undo (Cmd+Z)"
                className="size-8 rounded-full flex items-center justify-center text-fg-mute enabled:hover:text-fg enabled:hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Undo2 size={14} strokeWidth={1.8} />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo (Cmd+Shift+Z)"
                title="Redo (Cmd+Shift+Z)"
                className="size-8 rounded-full flex items-center justify-center text-fg-mute enabled:hover:text-fg enabled:hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Redo2 size={14} strokeWidth={1.8} />
              </button>
            </div>
            <button
              onClick={() => setLibraryOpen(true)}
              aria-label="My designs library"
              title={`My designs (${savedDesigns.length})`}
              className="hidden md:flex items-center gap-1.5 text-meta font-medium text-fg-mute hover:text-fg px-3 h-9 rounded-full transition-colors"
            >
              <Heart size={13} strokeWidth={1.8} />
              My designs
              {savedDesigns.length > 0 && (
                <span className="text-caption text-fg-faint tabular-nums">({savedDesigns.length})</span>
              )}
            </button>
            <button
              onClick={() => saveCurrentDesign()}
              aria-label="Save design to your library"
              title="Save design"
              className="hidden md:flex items-center gap-1.5 text-meta font-medium text-fg-mute hover:text-fg px-3 h-9 rounded-full transition-colors"
            >
              <Save size={13} strokeWidth={1.8} />
              Save
            </button>
            <button
              onClick={shareCurrentDesign}
              aria-label="Share design link"
              title="Share design"
              className="hidden md:flex items-center gap-1.5 text-meta font-medium text-fg-mute hover:text-fg px-3 h-9 rounded-full transition-colors"
            >
              <Share2 size={13} strokeWidth={1.8} />
              Share
            </button>
            <button
              onClick={handleSaveDraft}
              className="text-meta font-medium text-fg-mute hover:text-fg px-3 h-9 rounded-full transition-colors"
            >
              Save Draft
            </button>
            <div className="relative">
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-5 h-9 bg-fg text-white rounded-full text-meta font-semibold hover:bg-brand transition-colors btn-press"
              >
                <ShoppingBag size={14} strokeWidth={1.8} />
                Add to bag · ${totalPrice.toLocaleString()}
              </button>
              {(layerSurchargesPerUnit > 0 || TRIM_SURCHARGE > 0) && (
                <button
                  onClick={() => setBreakdownOpen((v) => !v)}
                  aria-label="Price breakdown"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full mt-1 text-caption text-fg-mute hover:text-fg underline underline-offset-4 whitespace-nowrap"
                >
                  {breakdownOpen ? "Hide breakdown" : "Price breakdown"}
                </button>
              )}
              <AnimatePresence>
                {breakdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-8 z-40 w-[280px] bg-white border border-black/5 rounded-2xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.16)] p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] uppercase tracking-[0.22em] font-semibold text-fg-faint">
                        Order total
                      </span>
                      <button
                        onClick={() => setBreakdownOpen(false)}
                        className="size-6 rounded-full hover:bg-black/5 flex items-center justify-center text-fg-mute hover:text-fg"
                        aria-label="Close"
                      >
                        <X size={12} strokeWidth={1.8} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 text-meta">
                      {priceLines.map((line, i) => (
                        <div key={i} className="flex items-baseline justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-fg truncate">{line.label}</span>
                            {line.note && (
                              <span className="text-caption text-fg-faint">{line.note}</span>
                            )}
                          </div>
                          <span className="text-fg tabular-nums">${line.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t border-black/10 mt-2 pt-2 flex items-baseline justify-between font-semibold text-fg">
                        <span>Total</span>
                        <span className="tabular-nums">${totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-[#f5f5f5] relative flex flex-col">
          {/* Contextual print-method note. Surfaces only on placements where
              the print technique differs from the front (DTG instead of the
              standard embroidery). Black bar, white text — visible without
              shouting, on-brand instead of alert-blue. */}
          <AnimatePresence>
            {(activePlacement === 'back' || activePlacement.startsWith('label')) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-fg text-white overflow-hidden"
              >
                <div className="px-8 py-2.5 flex items-center gap-3">
                  <div className="size-4 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                    <span className="text-[9px] leading-none italic font-serif">i</span>
                  </div>
                  <span className="text-meta leading-snug">
                    Printed with <span className="font-semibold">DTG (Direct to Garment)</span>. Your main front design will be embroidered separately.
                  </span>
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
                    className={`relative flex items-center gap-2.5 px-4 py-2 rounded-full text-[12px] font-semibold tracking-tight transition-all duration-300 shrink-0 whitespace-nowrap group ${
                      isActive 
                        ? "text-black bg-black/[0.04]" 
                        : "text-black/40 hover:text-black hover:bg-black/[0.02]"
                    }`}
                  >
                    <span className="relative z-10">{p.label}</span>
                    
                    {(p.badge || p.badges) && (
                      <div className="flex items-center gap-1">
                        {p.badge && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wider ${
                            p.badgeType === "primary" ? "bg-brand text-white" : "bg-black/10 text-black/60"
                          }`}>
                            {p.badge}
                          </span>
                        )}
                        {p.badges?.map((b) => (
                          <span key={b.text} className={`px-1.5 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wider ${
                            b.type === "primary" ? "bg-brand text-white" : "bg-black/10 text-black/60"
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
          <div
            className="flex-1 relative flex items-center justify-center p-8"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <ModelErrorBoundary>
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="size-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-black/20">Initializing Lab</span>
                  </div>
                }
              >
                <Product3DViewer
                  ref={viewer3DRef}
                  colorHex={activeColor.hex}
                  trimColorHex={trimColor ? (product.colors.find((c) => c.name === trimColor)?.hex ?? null) : null}
                  modelPath={product.modelPath}
                  showControlsLayout={false}
                  zoom={zoom}
                  resetSignal={resetSignal}
                  activePlacement={activePlacement}
                  layers={layers}
                  onLayerDrag={(placementId, t) => {
                    // Persist drag-position back into the layer. We preserve
                    // any existing customRotation roll (Z) so rotate-then-move
                    // doesn't reset the user's rotation.
                    setLayers((prev) =>
                      prev.map((l) => {
                        if (l.placementId !== placementId) return l;
                        const existingRoll = l.customRotation?.[2] ?? 0;
                        return {
                          ...l,
                          customPosition: t.position,
                          customRotation: [t.rotation[0], t.rotation[1], existingRoll] as [number, number, number],
                        };
                      }),
                    );
                  }}
                  onLayerScale={(_placementId, factor) => scaleActiveLayer(factor)}
                  onLayerRotate={(_placementId, delta) => rotateActiveLayer(delta)}
                />
              </Suspense>
            </ModelErrorBoundary>

            {/* ── PROPERTIES PANEL ──
                Floating right-side panel for fine-tuning the active layer.
                Appears only when there's a layer at the active placement so
                it never confuses first-time users with empty controls. */}
            <AnimatePresence>
              {activeLayer && (
                <motion.div
                  key="props"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-4 right-4 z-30 w-[252px] bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] uppercase tracking-[0.3em] font-medium text-fg-faint mb-0.5">
                        Properties
                      </span>
                      <h4 className="text-[13px] font-semibold text-fg leading-tight">
                        {placements.find((p) => p.id === activePlacement)?.label ?? "Layer"}
                      </h4>
                    </div>
                    <button
                      onClick={resetActiveLayerTransform}
                      className="text-caption text-fg-mute hover:text-fg underline underline-offset-4"
                      title="Reset position, rotation and scale to placement default"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Scale slider — wheel-over-body also drives this. */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-fg-mute">Size</span>
                      <span className="text-caption text-fg tabular-nums">
                        {Math.round(((activeLayer.scale ?? 0.2) / 0.2) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={MIN_SCALE}
                      max={MAX_SCALE}
                      step={0.005}
                      value={activeLayer.scale ?? 0.2}
                      onChange={(e) => setActiveLayerScale(parseFloat(e.target.value))}
                      className="w-full accent-black h-1 cursor-pointer"
                      aria-label="Layer size"
                    />
                  </div>

                  {/* Rotation slider — Shift-drag on the model also drives this. */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-fg-mute">Rotation</span>
                      <span className="text-caption text-fg tabular-nums">
                        {Math.round(((activeLayer.customRotation?.[2] ?? 0) * 180) / Math.PI)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-Math.PI}
                      max={Math.PI}
                      step={Math.PI / 90}
                      value={activeLayer.customRotation?.[2] ?? 0}
                      onChange={(e) => setActiveLayerRotation(parseFloat(e.target.value))}
                      className="w-full accent-black h-1 cursor-pointer"
                      aria-label="Layer rotation"
                    />
                  </div>

                  <div className="border-t border-black/5 pt-3 -mx-1">
                    <p className="text-[10px] leading-relaxed text-fg-faint px-1">
                      <span className="font-semibold text-fg-mute">Tip:</span> drag on the model to move ·{" "}
                      <kbd className="px-1 py-0.5 rounded bg-black/5 text-[9px]">Shift</kbd> + drag to rotate · scroll to resize
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drag-and-drop overlay — shows the moment the user drags an
                image file over the workspace. Clearly affords "drop here". */}
            <AnimatePresence>
              {isDraggingFile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-4 z-40 rounded-2xl border-2 border-dashed border-fg bg-white/85 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                >
                  <div className="flex flex-col items-center gap-3 text-fg">
                    <div className="size-14 rounded-full bg-fg text-white flex items-center justify-center">
                      <Upload size={22} strokeWidth={1.6} />
                    </div>
                    <span className="text-h3 font-semibold tracking-tight">Drop to apply</span>
                    <span className="text-meta text-fg-mute">
                      Image will land at the active placement. Drag to move it after.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reject feedback — surfaces briefly when a non-image is dropped. */}
            <AnimatePresence>
              {dropError && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-fg text-white text-meta shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] pointer-events-none"
                >
                  {dropError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom UI stack — ConfigDock + PromptBar in one flex column,
                centered horizontally. Coordinated as a unit so they can
                never collide regardless of how the prompt suggestions wrap. */}
            <div className="absolute bottom-4 lg:bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 lg:gap-4 pointer-events-none w-full lg:w-auto px-3 lg:px-0">
              <ConfigDock
                product={product}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                trimColor={trimColor}
                onSelectTrimColor={setTrimColor}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAR={() => setArOpen(true)}
                onVR={() => setVrOpen(true)}
                onTryOn={openTryOn}
              />

              {aiAvailable && (
                <PromptBar
                  onSubmit={handlePromptSubmit}
                  busy={designBusy}
                  generatedUrl={primaryDesignUrl}
                  onClear={clearActivePlacementLayer}
                  error={designError}
                />
              )}

              {/* Mobile tools bar — pinned below ConfigDock + PromptBar on
                  mobile only. Replaces the desktop left rail. AI is the
                  default; tapping any other tool opens the bottom sheet. */}
              <div className="lg:hidden flex items-center gap-1 bg-white/95 backdrop-blur-xl border border-black/5 rounded-full p-1 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)] pointer-events-auto">
                {sidebarTools.map((tool) => {
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      aria-label={tool.label}
                      aria-pressed={isActive}
                      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-colors duration-200 ${
                        isActive
                          ? "bg-fg text-white"
                          : "text-fg-mute hover:bg-black/[0.04] hover:text-fg"
                      }`}
                    >
                      {tool.icon}
                      <span className="text-[8px] uppercase tracking-[0.18em] font-medium">
                        {tool.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom controls — top-right of the viewer, completely out of the
                prompt bar's path. The bottom row belongs to the prompt bar
                alone (with its suggestion chips). */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xl border border-black/5 rounded-full p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] flex items-center z-10">
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                aria-label="Zoom out"
                className="size-8 rounded-full text-fg-mute hover:bg-black/[0.04] hover:text-fg flex items-center justify-center transition-colors btn-press-sm"
              >
                <Minus size={14} strokeWidth={1.8} />
              </button>
              <span className="text-meta tabular-nums w-11 text-center text-fg font-medium">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(400, z + 10))}
                aria-label="Zoom in"
                className="size-8 rounded-full text-fg-mute hover:bg-black/[0.04] hover:text-fg flex items-center justify-center transition-colors btn-press-sm"
              >
                <Plus size={14} strokeWidth={1.8} />
              </button>
              <span className="w-px h-4 bg-black/10 mx-1.5" />
              <button
                onClick={() => { setZoom(100); setResetSignal((n) => n + 1); }}
                aria-label="Reset view"
                className="flex items-center gap-1.5 pl-2.5 pr-3 h-8 rounded-full text-meta text-fg-mute hover:bg-black/[0.04] hover:text-fg transition-colors btn-press-sm"
              >
                <RotateCw size={12} strokeWidth={1.8} />
                Reset
              </button>
            </div>

          </div>
        </div>
      </main>


      <ARModal
        open={arOpen}
        onClose={() => setArOpen(false)}
        modelPath={product.modelPath ?? DEFAULT_MODEL_PATH}
        productName={product.name}
      />
      <VRModal
        open={vrOpen}
        onClose={() => setVrOpen(false)}
        colorHex={activeColor.hex}
        modelPath={product.modelPath ?? DEFAULT_MODEL_PATH}
        productName={product.name}
      />
      <TryOnModal
        open={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
        productName={product.name}
        productImage={tryOnImage}
        productCategory={product.category}
      />

      {/* ── MY DESIGNS LIBRARY ──
          Side drawer listing all designs the user has saved locally. Per-row
          actions: Load (replaces current state), Remove. Header note clarifies
          this is device-local storage so users don't expect cross-device sync. */}
      <AnimatePresence>
        {libraryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setLibraryOpen(false)}
              className="fixed inset-0 bg-black/40 z-[80]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-label="My designs"
              className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-[81] shadow-2xl flex flex-col"
            >
              <header className="flex items-center justify-between px-6 py-5 border-b border-black/5 shrink-0">
                <div>
                  <span className="block text-[9px] uppercase tracking-[0.3em] font-medium text-fg-faint mb-0.5">
                    Library
                  </span>
                  <h3 className="text-[18px] font-semibold tracking-tight text-fg">
                    My designs
                  </h3>
                </div>
                <button
                  onClick={() => setLibraryOpen(false)}
                  aria-label="Close library"
                  className="size-9 rounded-full hover:bg-black/5 flex items-center justify-center text-fg-mute hover:text-fg transition-colors"
                >
                  <X size={16} strokeWidth={1.6} />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-6">
                {savedDesigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
                    <Heart size={26} strokeWidth={1.4} className="text-fg-faint" />
                    <p className="text-meta text-fg-mute leading-relaxed max-w-[260px]">
                      No saved designs yet. Build something, then tap{" "}
                      <span className="font-semibold text-fg">Save</span> to keep it here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-caption text-fg-faint leading-relaxed mb-1">
                      Designs are saved on this device. To share with someone else, use the
                      Share button — they'll need to open the link on the same device for it
                      to load (no backend yet).
                    </p>
                    {savedDesigns.map((record) => {
                      const isCurrentProduct = record.productId === product.id;
                      return (
                        <div
                          key={record.id}
                          className={`flex gap-3 p-3 rounded-2xl border transition-colors ${
                            isCurrentProduct
                              ? "border-black/10 hover:border-black/40"
                              : "border-black/5 opacity-60"
                          }`}
                        >
                          <div className="size-16 rounded-xl overflow-hidden bg-[#f5f5f5] border border-black/5 shrink-0">
                            {record.thumbnail ? (
                              <img src={record.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-fg-faint">
                                <Layers size={18} strokeWidth={1.4} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <p className="text-meta font-semibold text-fg truncate">{record.name}</p>
                            <p className="text-caption text-fg-faint">
                              {record.color}{record.trimColor ? ` + ${record.trimColor} trim` : ""} ·{" "}
                              {record.size} · ×{record.quantity} ·{" "}
                              {record.layers.length} design{record.layers.length === 1 ? "" : "s"}
                            </p>
                            <p className="text-caption text-fg-faint mt-0.5">
                              {new Date(record.savedAt).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => loadSavedDesign(record)}
                                disabled={!isCurrentProduct}
                                className="text-meta font-semibold text-fg hover:text-brand transition-colors underline underline-offset-4 disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
                              >
                                {isCurrentProduct ? "Load" : "Different product"}
                              </button>
                              <button
                                onClick={() => removeSavedDesign(record.id)}
                                className="text-meta text-fg-mute hover:text-red-500 transition-colors underline underline-offset-4 ml-auto"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────── ConfigDock ───────────────────────
   Single floating glass pill above the prompt bar. Holds color,
   size, qty, and AR/VR/Try-on in one horizontal strip — collapses
   what was previously a 300px right rail into a 560px floating
   surface so the canvas dominates. */

interface ConfigDockProps {
  product: Product;
  selectedColor: string;
  onSelectColor: (name: string) => void;
  /** When null the trim matches the body. */
  trimColor: string | null;
  onSelectTrimColor: (name: string | null) => void;
  selectedSize: string;
  onSelectSize: (size: SizeCode) => void;
  quantity: number;
  onQuantityChange: (q: number | ((prev: number) => number)) => void;
  onAR: () => void;
  onVR: () => void;
  onTryOn: () => void;
}

function ConfigDock({
  product,
  selectedColor,
  onSelectColor,
  trimColor,
  onSelectTrimColor,
  selectedSize,
  onSelectSize,
  quantity,
  onQuantityChange,
  onAR,
  onVR,
  onTryOn,
}: ConfigDockProps) {
  const [trimOpen, setTrimOpen] = useState(false);
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="pointer-events-auto max-w-full"
    >
      {/* On mobile the dock is wider than the viewport — let it scroll
          horizontally rather than overflow or shrink-clip controls. */}
      <div className="flex items-center gap-3 px-3 py-2 bg-white/95 backdrop-blur-xl border border-black/[0.06] rounded-full shadow-[0_12px_32px_-12px_rgba(0,0,0,0.12)] overflow-x-auto no-scrollbar max-w-full">
        {/* Color — bigger swatches on mobile for tap accuracy */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {product.colors.map((c) => {
            const isActive = selectedColor === c.name;
            return (
              <button
                key={c.name}
                onClick={() => onSelectColor(c.name)}
                aria-label={c.name}
                aria-pressed={isActive}
                title={c.name}
                className={`size-8 lg:size-7 rounded-full transition-[box-shadow,transform] duration-200 btn-press-sm shrink-0 ${
                  isActive
                    ? "ring-2 ring-fg ring-offset-2 ring-offset-white"
                    : "hover:ring-1 hover:ring-black/20 hover:ring-offset-1 hover:ring-offset-white"
                }`}
                style={{ backgroundColor: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
              />
            );
          })}
          {/* Trim color toggle — small "+" puck that opens a popover with the
              same swatches mapped to the trim. Engages a two-tone garment
              without cluttering the primary color row. */}
          <button
            onClick={() => setTrimOpen((v) => !v)}
            aria-label="Trim color"
            aria-pressed={trimOpen}
            title={trimColor ? `Trim: ${trimColor}` : "Add trim color"}
            className={`size-8 lg:size-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              trimColor
                ? "ring-2 ring-fg ring-offset-2 ring-offset-white"
                : "bg-black/[0.04] hover:bg-black/[0.08]"
            }`}
            style={trimColor ? {
              backgroundColor: product.colors.find((c) => c.name === trimColor)?.hex ?? "#000",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            } : undefined}
          >
            {!trimColor && <span className="text-fg-faint text-[12px] font-semibold leading-none">+</span>}
          </button>
          <AnimatePresence>
            {trimOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-full left-0 mb-2 z-40 bg-white border border-black/5 rounded-2xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.16)] p-3 flex flex-col gap-2 w-[220px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.22em] font-semibold text-fg-faint">
                    Trim color
                  </span>
                  {trimColor && (
                    <button
                      onClick={() => { onSelectTrimColor(null); setTrimOpen(false); }}
                      className="text-[10px] text-fg-mute hover:text-fg underline underline-offset-4"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {product.colors.map((c) => {
                    const isActive = trimColor === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => { onSelectTrimColor(c.name); setTrimOpen(false); }}
                        aria-label={c.name}
                        title={c.name}
                        className={`size-7 rounded-full transition-[box-shadow] duration-150 ${
                          isActive
                            ? "ring-2 ring-fg ring-offset-2 ring-offset-white"
                            : "hover:ring-1 hover:ring-black/20 hover:ring-offset-1 hover:ring-offset-white"
                        }`}
                        style={{ backgroundColor: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
                      />
                    );
                  })}
                </div>
                <p className="text-[10px] text-fg-faint leading-relaxed">
                  Paints collar, cuffs, hem and seams independently of the body.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DockDivider />

        {/* Size */}
        <div className="flex items-center gap-0.5 shrink-0">
          {product.sizes.map((s) => {
            const isActive = selectedSize === s;
            return (
              <button
                key={s}
                onClick={() => onSelectSize(s)}
                aria-pressed={isActive}
                className={`h-8 lg:h-7 min-w-[32px] lg:min-w-[28px] px-2 rounded-md text-meta font-medium transition-colors duration-200 shrink-0 ${
                  isActive
                    ? "bg-fg text-white"
                    : "text-fg-mute hover:bg-black/[0.04] hover:text-fg"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        <DockDivider />

        {/* Qty */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onQuantityChange((q) => Math.max(product.moq, q - 1))}
            disabled={quantity <= product.moq}
            aria-label="Decrease quantity"
            className="size-7 lg:size-6 rounded-full border border-black/10 text-fg-mute hover:bg-fg hover:text-white hover:border-fg transition-colors disabled:opacity-30 flex items-center justify-center btn-press-sm shrink-0"
          >
            <Minus size={12} strokeWidth={2} />
          </button>
          <span className="text-meta tabular-nums text-fg font-medium min-w-[28px] text-center shrink-0">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange((q) => q + 1)}
            aria-label="Increase quantity"
            className="size-7 lg:size-6 rounded-full border border-black/10 text-fg-mute hover:bg-fg hover:text-white hover:border-fg transition-colors flex items-center justify-center btn-press-sm shrink-0"
          >
            <Plus size={12} strokeWidth={2} />
          </button>
        </div>

        <DockDivider />

        {/* Preview */}
        <div className="flex items-center gap-0.5 shrink-0">
          <DockBtn icon={<Box size={14} strokeWidth={1.6} />} label="AR" onClick={onAR} />
          <DockBtn icon={<Glasses size={14} strokeWidth={1.6} />} label="VR" onClick={onVR} />
          <DockBtn icon={<User size={14} strokeWidth={1.6} />} label="Try on" onClick={onTryOn} accent />
        </div>
      </div>
    </motion.div>
  );
}

function DockDivider() {
  return <span className="w-px h-5 bg-black/10 self-stretch my-auto shrink-0" />;
}

function DockBtn({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative size-9 lg:size-8 rounded-full text-fg-mute hover:text-fg hover:bg-black/[0.04] transition-colors flex items-center justify-center btn-press-sm shrink-0"
    >
      {icon}
      {accent && (
        <span aria-hidden="true" className="absolute top-1 right-1 size-1 rounded-full bg-brand" />
      )}
    </button>
  );
}

/* ─────────────────────── ToolPanel ───────────────────────
   Contextual panel for the active left-rail tool. Hidden when
   activeTool === "ai" (the bottom prompt bar handles AI). */

const TOOL_TITLES: Record<ToolId, string> = {
  ai: "AI",
  upload: "Upload",
  stock: "Stock",
  text: "Text",
  layers: "Layers",
};

interface ToolPanelProps {
  activeTool: ToolId;
  product: Product;
  designUrl: string | null;
  layers: DesignLayer[];
  placements: Array<{ id: string; label: string }>;
  activePlacement: string;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerHidden: (layerId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  onClearAllLayers: () => void;
  onUpload: () => void;
  onApplyStock: (url: string) => void;
  onApplyText: (text: string, weight: 400 | 500 | 600, dark: boolean) => void;
  onClearDesign: () => void;
  onClose: () => void;
}

function ToolPanel({
  activeTool,
  designUrl,
  layers,
  placements,
  activePlacement,
  onSelectLayer,
  onToggleLayerHidden,
  onRemoveLayer,
  onClearAllLayers,
  onUpload,
  onApplyStock,
  onApplyText,
  onClearDesign,
  onClose,
}: ToolPanelProps) {
  // Visibility is owned by the AnimatePresence wrapper in CustomizePage —
  // this component just always renders its content. AI gets an empty
  // shell because its surface is the bottom prompt bar.
  if (activeTool === "ai") return null;

  return (
    <div className="flex flex-col w-full lg:w-[260px] lg:h-full bg-white lg:border-r lg:border-black/5">
      <header className="flex items-center justify-between px-5 py-4 border-b border-black/5">
        <div>
          <span className="block text-[9px] uppercase tracking-[0.3em] font-medium text-fg-faint mb-0.5">
            Tool
          </span>
          <h3 className="text-[15px] font-semibold tracking-tight text-fg">
            {TOOL_TITLES[activeTool]}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="size-8 rounded-full hover:bg-black/[0.04] flex items-center justify-center text-fg-mute hover:text-fg transition-colors"
        >
          <X size={15} strokeWidth={1.6} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTool === "upload" && <UploadPanel onUpload={onUpload} designUrl={designUrl} onClear={onClearDesign} />}
        {activeTool === "stock" && <StockPanel onApply={onApplyStock} />}
        {activeTool === "text" && <TextPanel onApply={onApplyText} />}
        {activeTool === "layers" && (
          <LayersPanel
            layers={layers}
            placements={placements}
            activePlacement={activePlacement}
            onSelect={onSelectLayer}
            onToggleHidden={onToggleLayerHidden}
            onRemove={onRemoveLayer}
            onClearAll={onClearAllLayers}
          />
        )}
      </div>
    </div>
  );
}

function UploadPanel({
  onUpload,
  designUrl,
  onClear,
}: {
  onUpload: () => void;
  designUrl: string | null;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onUpload}
        className="group flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border border-dashed border-black/15 hover:border-fg hover:bg-black/[0.02] transition-colors"
      >
        <span className="size-11 rounded-full bg-black/[0.04] group-hover:bg-fg group-hover:text-white text-fg-mute flex items-center justify-center transition-colors">
          <Upload size={18} strokeWidth={1.6} />
        </span>
        <span className="text-meta font-medium text-fg">Choose an image</span>
        <span className="text-caption text-fg-faint">PNG, JPG · up to 10MB</span>
      </button>

      {designUrl && (
        <div className="flex flex-col gap-2">
          <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">Current</span>
          <div className="aspect-square rounded-xl overflow-hidden bg-[#f5f5f5] border border-black/5 relative">
            <img src={designUrl} alt="" className="w-full h-full object-contain" />
          </div>
          <button
            onClick={onClear}
            className="text-meta text-fg-mute hover:text-fg underline underline-offset-4 decoration-black/15 hover:decoration-black self-start transition-colors"
          >
            Remove design
          </button>
        </div>
      )}
    </div>
  );
}

const STOCK_LIBRARY: Array<{ id: string; label: string; prompt: string; seed: number }> = [
  { id: "s1", label: "Vintage typography", prompt: "vintage typography wordmark reading WORN IN, distressed serif, monochrome, isolated", seed: 11001 },
  { id: "s2", label: "Mountain emblem", prompt: "minimal geometric mountain emblem, single line, monochrome, isolated badge", seed: 11002 },
  { id: "s3", label: "Sun mark", prompt: "minimal sun mark, japanese ink style, single round circle with rays, monochrome", seed: 11003 },
  { id: "s4", label: "Skull crest", prompt: "small geometric skull crest, line drawing, minimal, monochrome streetwear", seed: 11004 },
  { id: "s5", label: "Rose line art", prompt: "single line art rose, minimal continuous line, monochrome, centered", seed: 11005 },
  { id: "s6", label: "Tour back graphic", prompt: "vintage band tour back graphic, list of tour cities below large arched type, monochrome", seed: 11006 },
];

const stockUrl = (prompt: string, seed: number) =>
  pollinationsUrl(prompt, { seed, width: 512, height: 512 });

function StockPanel({ onApply }: { onApply: (url: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-meta text-fg-mute leading-relaxed">
        Curated graphics. Click any to apply to the active placement.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {STOCK_LIBRARY.map((item) => {
          const url = stockUrl(item.prompt, item.seed);
          return (
            <button
              key={item.id}
              onClick={() => onApply(url)}
              aria-label={item.label}
              className="group flex flex-col gap-1.5"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-[#f5f5f5] border border-black/5 group-hover:border-fg transition-colors">
                <img
                  src={url}
                  alt={item.label}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <span className="text-caption text-fg-faint group-hover:text-fg transition-colors text-left line-clamp-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextPanel({
  onApply,
}: {
  onApply: (text: string, weight: 400 | 500 | 600, dark: boolean) => void;
}) {
  const [text, setText] = useState("WORN\nIN");
  const [weight, setWeight] = useState<400 | 500 | 600>(600);
  const [dark, setDark] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">Words</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Type something — line breaks supported"
          className="w-full px-3 py-2.5 rounded-lg border border-black/10 focus:border-fg outline-none text-meta text-fg placeholder:text-fg-faint resize-none transition-colors bg-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">Weight</span>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { v: 400 as const, label: "Regular" },
            { v: 500 as const, label: "Medium" },
            { v: 600 as const, label: "Semibold" },
          ]).map((opt) => (
            <button
              key={opt.v}
              onClick={() => setWeight(opt.v)}
              className={`h-9 rounded-md text-caption transition-colors ${
                weight === opt.v
                  ? "bg-fg text-white"
                  : "bg-transparent text-fg-mute hover:bg-black/[0.04] hover:text-fg"
              }`}
              style={{ fontWeight: opt.v }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">Color</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setDark(true)}
            className={`h-9 rounded-md text-caption transition-colors flex items-center justify-center gap-2 ${
              dark
                ? "bg-fg text-white"
                : "bg-transparent text-fg-mute hover:bg-black/[0.04] hover:text-fg border border-black/10"
            }`}
          >
            <span className="size-2.5 rounded-full bg-fg" />
            Black ink
          </button>
          <button
            onClick={() => setDark(false)}
            className={`h-9 rounded-md text-caption transition-colors flex items-center justify-center gap-2 ${
              !dark
                ? "bg-fg text-white"
                : "bg-transparent text-fg-mute hover:bg-black/[0.04] hover:text-fg border border-black/10"
            }`}
          >
            <span className="size-2.5 rounded-full bg-white border border-black/15" />
            White ink
          </button>
        </div>
      </div>

      <button
        onClick={() => onApply(text, weight, dark)}
        disabled={!text.trim()}
        className="h-11 rounded-full bg-fg text-white text-meta font-semibold hover:bg-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-1"
      >
        Apply text
      </button>
    </div>
  );
}

function LayersPanel({
  layers,
  placements,
  activePlacement,
  onSelect,
  onToggleHidden,
  onRemove,
  onClearAll,
}: {
  layers: DesignLayer[];
  placements: Array<{ id: string; label: string }>;
  activePlacement: string;
  onSelect: (layerId: string) => void;
  onToggleHidden: (layerId: string) => void;
  onRemove: (layerId: string) => void;
  onClearAll: () => void;
}) {
  if (layers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-12">
        <Layers size={22} strokeWidth={1.4} className="text-fg-faint" />
        <p className="text-meta text-fg-mute leading-relaxed max-w-[220px]">
          No designs yet. Pick a placement, then add a design with AI, Upload, Stock or Text.
        </p>
      </div>
    );
  }
  const labelFor = (id: string) => placements.find((p) => p.id === id)?.label ?? id;
  const sourceLabel: Record<DesignLayer["source"], string> = {
    ai: "AI",
    upload: "Upload",
    stock: "Stock",
    text: "Text",
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-eyebrow uppercase tracking-[0.22em] text-fg-faint">
          {layers.length} layer{layers.length === 1 ? "" : "s"}
        </span>
        {layers.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-caption text-fg-mute hover:text-fg underline underline-offset-4"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {layers.map((layer) => {
          const isActive = layer.placementId === activePlacement;
          return (
            <div
              key={layer.id}
              className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                isActive ? "border-fg bg-black/[0.02]" : "border-black/10 hover:border-black/30"
              } ${layer.hidden ? "opacity-50" : ""}`}
            >
              <button
                onClick={() => onSelect(layer.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                title={`Edit ${labelFor(layer.placementId)}`}
              >
                <div className="size-11 rounded-lg overflow-hidden bg-[#f5f5f5] border border-black/5 shrink-0">
                  <img src={layer.imageUrl} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-meta font-medium text-fg leading-tight truncate">
                    {labelFor(layer.placementId)}
                  </p>
                  <p className="text-caption text-fg-faint">
                    {sourceLabel[layer.source]}{isActive ? " · editing" : ""}
                  </p>
                </div>
              </button>
              <button
                onClick={() => onToggleHidden(layer.id)}
                aria-label={layer.hidden ? "Show layer" : "Hide layer"}
                title={layer.hidden ? "Show" : "Hide"}
                className="size-7 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-fg-mute hover:text-fg transition-colors shrink-0"
              >
                <span aria-hidden className="text-[14px] leading-none">
                  {layer.hidden ? "○" : "●"}
                </span>
              </button>
              <button
                onClick={() => onRemove(layer.id)}
                aria-label="Remove layer"
                title="Remove"
                className="size-7 rounded-full hover:bg-red-500/10 flex items-center justify-center text-fg-mute hover:text-red-500 transition-colors shrink-0"
              >
                <X size={13} strokeWidth={1.8} />
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-caption text-fg-faint mt-1 leading-relaxed">
        Tap a layer to switch to that placement. Hide / remove individually, or Clear all to start over.
      </p>
    </div>
  );
}
