import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
const Product3DViewer = lazy(() => import("./Product3DViewer"));
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { findProduct, products } from "./products";
import type { Product, SizeCode } from "./products";
import SiteHeader from "./SiteHeader";
import PageHead, { productSchema, breadcrumbSchema } from "./PageHead";
import SiteFooter from "./SiteFooter";
import NotFoundPage from "./NotFoundPage";
import ProductSpecs from "./product/ProductSpecs";
import ProductTabs from "./product/ProductTabs";
import PurchasePanel from "./product/PurchasePanel";
import RelatedRail from "./product/RelatedRail";
import SizeChartModal from "./product/SizeChartModal";
import MobileBuyBar from "./product/MobileBuyBar";
import RecentlyViewedRail from "./product/RecentlyViewedRail";
import ImmersiveControls from "./product/ImmersiveControls";
import Image from "./ui/Image";
import Skeleton from "./ui/Skeleton";
import { useCart } from "../store/CartContext";
import { useWishlist } from "../store/WishlistContext";
import { track } from "../utils/analytics";
import { useRecentlyViewed } from "../utils/useRecentlyViewed";

interface ProductPageProps {
  onOpenCart: () => void;
}

export default function ProductPage({ onOpenCart }: ProductPageProps) {
  const [params] = useSearchParams();
  const { id: routeId } = useParams<{ id?: string }>();
  const product = useMemo(
    () => findProduct(routeId ?? params.get("id")),
    [routeId, params],
  );

  if (!product) return <NotFoundPage onOpenCart={onOpenCart} />;

  return <ProductDetail product={product} onOpenCart={onOpenCart} />;
}

function ProductDetail({ product, onOpenCart }: { product: Product; onOpenCart: () => void }) {
  const navigate = useNavigate();
  const { add } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const { record: recordRecentlyViewed } = useRecentlyViewed();

  const [selectedSize, setSelectedSize] = useState<SizeCode>(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Anchor ref for the mobile sticky buy bar — bar appears once the gallery
  // has scrolled past the top of the viewport.
  const galleryAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedSize(product.sizes[0]);
    setSelectedColor(product.colors[0].name);
    setJustAdded(false);
    track("view_product", {
      product_id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
    });
    recordRecentlyViewed(product.id);
  }, [product.id]);

  const images =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];

  const activeColor =
    product.colors.find((c) => c.name === selectedColor) ?? product.colors[0];

  const wishlisted = inWishlist(product.id);

  const handleAddToCart = () => {
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      color: selectedColor,
      colorHex: activeColor.hex,
      size: selectedSize,
      price: product.price,
      quantity: 1,
      maxStock: product.stock === "Make to Order" ? 25 : 10,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    onOpenCart();
  };

  const similarProducts = useMemo(() => {
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.category === product.category
    );
    const others = products.filter(
      (p) => p.id !== product.id && p.category !== product.category
    );
    return [...sameCategory, ...others].slice(0, 5);
  }, [product.id, product.category]);

  const productUrl = `/product/${product.id}`;
  const heroImage = product.gallery?.[0] ?? product.image;

  return (
    <div id="main-content" className="min-h-screen bg-white">
      <PageHead
        title={product.name}
        description={product.description}
        image={heroImage}
        type="product"
        canonical={productUrl}
        jsonLd={[
          productSchema({
            name: product.name,
            description: product.description,
            image: product.gallery?.length ? product.gallery : [product.image],
            price: product.price,
            sku: product.id,
            url: productUrl,
            inStock: product.stock === "Ready Stock",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: product.category, path: `/shop?category=${encodeURIComponent(product.category)}` },
            { name: product.name, path: productUrl },
          ]),
        ]}
      />
      <SiteHeader onOpenCart={onOpenCart} />

      <div className="w-full px-8 md:px-16 pt-8 pb-16">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT — sticky details */}
          <aside className="col-span-12 order-3 lg:order-none lg:col-span-4 lg:sticky lg:top-[100px] lg:self-start flex flex-col gap-10">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-[13px] text-black/55 hover:text-black transition-colors w-fit"
            >
              <ChevronLeft size={14} strokeWidth={2} />
              Back
            </button>

            <h1
              className="text-[48px] leading-[0.95] tracking-tight uppercase"
              style={{ fontWeight: 600 }}
            >
              {product.name}
            </h1>

            <p className="text-[15px] text-black/65 leading-relaxed">
              {product.description}
            </p>

            <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px] pt-8 border-t border-black/10">
              <dt className="text-black/40 uppercase tracking-[0.12em] text-[11px] font-medium">Fabric</dt>
              <dd className="text-black">{product.fabric}</dd>
              <dt className="text-black/40 uppercase tracking-[0.12em] text-[11px] font-medium">Weight</dt>
              <dd className="text-black">{product.gsm} GSM</dd>
              <dt className="text-black/40 uppercase tracking-[0.12em] text-[11px] font-medium">Fit</dt>
              <dd className="text-black">{product.fit}</dd>
              <dt className="text-black/40 uppercase tracking-[0.12em] text-[11px] font-medium">Sizes</dt>
              <dd className="text-black">{product.sizes[0]}–{product.sizes[product.sizes.length - 1]}</dd>
            </dl>
          </aside>

          {/* CENTER — gallery: horizontal snap-scroll carousel on mobile,
              vertical strip on desktop. Edge-to-edge on mobile via negative
              margins so slides extend past the page padding. */}
          <div ref={galleryAnchorRef} className="col-span-12 order-1 lg:order-none lg:col-span-4 -mx-8 md:-mx-16 lg:mx-0">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-8 md:px-16 lg:px-0 lg:flex-col lg:overflow-visible lg:snap-none">
              {product.modelPath && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="aspect-[3/4] overflow-hidden bg-[#f5f5f5] relative w-[calc(100vw-4rem)] md:w-[calc(100vw-8rem)] shrink-0 snap-center lg:w-auto lg:shrink"
                >
                  <Suspense fallback={<Skeleton tone="paper" className="absolute inset-0" />}>
                    <Product3DViewer
                      colorHex={activeColor.hex}
                      modelPath={product.modelPath}
                      showControlsLayout={false}
                    />
                  </Suspense>
                  <ImmersiveControls
                    colorHex={activeColor.hex}
                    modelPath={product.modelPath}
                    productName={product.name}
                    productImage={product.image}
                    productCategory={product.category}
                  />
                </motion.div>
              )}
              {images.map((src, i) => (
                <motion.div
                  key={`${product.id}-${i}`}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="aspect-[3/4] overflow-hidden bg-[#f5f5f5] w-[calc(100vw-4rem)] md:w-[calc(100vw-8rem)] shrink-0 snap-center lg:w-auto lg:shrink"
                >
                  <Image
                    src={src}
                    alt={`${product.name} — view ${i + 1}`}
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    noFade={i === 0}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — sticky purchase */}
          <PurchasePanel
            product={product}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            justAdded={justAdded}
            onAddToCart={handleAddToCart}
            onCustomize={() => navigate("/customize?id=" + product.id)}
            wishlisted={wishlisted}
            onToggleWishlist={() => toggleWishlist(product.id)}
            onShowSizeChart={() => setShowSizeChart(true)}
            onShipping={() => navigate("/shipping")}
          />
        </div>

        <ProductSpecs />
        <ProductTabs />
        {/* "You may also like" comes FIRST — a new visitor hasn't viewed
            anything yet, so the priority is showing items related to the
            current product. Recently-viewed is a smaller, footer-style
            history rail at the bottom, visually distinct from this section. */}
        <RelatedRail items={similarProducts} />
        <RecentlyViewedRail excludeId={product.id} />
      </div>

      <SiteFooter />

      <MobileBuyBar
        product={product}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        onAddToCart={handleAddToCart}
        justAdded={justAdded}
      />

      {showSizeChart && (
        <SizeChartModal product={product} onClose={() => setShowSizeChart(false)} />
      )}
    </div>
  );
}
