import { Star, ArrowRight, Send, Truck, RotateCcw, Leaf, ShieldCheck, Check } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { products } from "./products";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { formatPrice } from "../utils/currency";

const imgContent = "/chuttersnap-wN6kUEqZT_c-unsplash.jpg";

interface LandingPageProps {
  onOpenCart: () => void;
}

function ProductCard({
  product,
  onClick,
}: {
  product: (typeof products)[number];
  onClick: () => void;
}) {
  return (
    <div className="cursor-pointer group" onClick={onClick}>
      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-[9px] bg-[#f5f5f5]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <p className="text-[15px] text-black tracking-tight leading-snug mb-1 font-medium">
        {product.name}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] text-black font-bold tabular-nums">
          {formatPrice(product.price)}
        </span>
        <div className="flex items-center gap-1">
          {product.colors.slice(0, 4).map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="size-3 rounded-full border border-black/10"
              style={{ backgroundColor: c.hex }}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[10px] text-black/50 font-medium ml-0.5">
              +{product.colors.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GalleryMarquee() {
  const images = [
    "https://ybeclothing.com/cdn/shop/files/Frame_1484.png?v=1772380512&width=1000",
    "https://ybeclothing.com/cdn/shop/files/Frame_1485.png?v=1772380512&width=1000",
    "https://ybeclothing.com/cdn/shop/files/Frame_1486.png?v=1772380512&width=1000",
    "https://ybeclothing.com/cdn/shop/files/Frame_1488.png?v=1772380511&width=1000",
    "https://ybeclothing.com/cdn/shop/files/Frame_1483.png?v=1772380512&width=1000",
    "https://ybeclothing.com/cdn/shop/files/Frame_1487.png?v=1772380512&width=1000",
    "https://ybeclothing.com/cdn/shop/files/Frame_1489.png?v=1772380511&width=1000",
  ];

  return (
    <div className="py-24 bg-white overflow-hidden border-y border-black/5">
       <div className="flex whitespace-nowrap animate-marquee-banner hover:[animation-play-state:paused] cursor-pointer">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="flex gap-3 px-[6px]">
                {images.map((img, idx) => (
                   <div key={idx} className="w-[400px] h-[500px] rounded-lg overflow-hidden bg-[#fafafa]">
                      <img 
                        src={img} 
                        alt="Gallery" 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105" 
                      />
                   </div>
                ))}
             </div>
          ))}
       </div>
    </div>
  );
}

function WatchAndBuy() {
  const influencerContent = [
    {
      id: 1,
      thumbnail: "https://cdn.shopify.com/s/files/1/0667/2141/5366/files/preview_images/a3a93df9a21a488984c52d52ddec0513.thumbnail.0000000000.jpg?v=1773682462",
      username: "@hoodude",
      caption: "From desk to the block..."
    },
    {
      id: 2,
      thumbnail: "https://cdn.shopify.com/s/files/1/0667/2141/5366/files/preview_images/5e0a3bcf49ec4050820615d176b65ade.thumbnail.0000000000.jpg?v=1773682447",
      username: "@hoodude",
      caption: "When life shows 404 error..."
    },
    {
      id: 3,
      thumbnail: "https://cdn.shopify.com/s/files/1/0667/2141/5366/files/preview_images/7f229dab1f564e34ac3db813aceb1c55.thumbnail.0000000000.jpg?v=1773682456",
      username: "@hoodude",
      caption: "Beyond trends. Beyond rules."
    },
    {
      id: 4,
      thumbnail: "https://cdn.shopify.com/s/files/1/0667/2141/5366/files/preview_images/1c368af0a9bf438993b9c248a2aa2b68.thumbnail.0000000000.jpg?v=1773682462",
      username: "@hoodude",
      caption: "Stealing the spotlight..."
    },
    {
      id: 5,
      thumbnail: "https://cdn.shopify.com/s/files/1/0667/2141/5366/files/preview_images/8ed90dd850f14bd9b70471f2e75551e5.thumbnail.0000000000.jpg?v=1773682462",
      username: "@hoodude",
      caption: "For women who own the streets..."
    },
    {
       id: 6,
       thumbnail: "https://cdn.shopify.com/s/files/1/0667/2141/5366/files/preview_images/aad9268085894398853f282df8977a45.thumbnail.0000000000.jpg?v=1773682455",
       username: "@hoodude",
       caption: "Control + Z my life..."
    }
  ];

  return (
    <section className="px-8 py-20 bg-white">
      <div className="flex flex-col gap-2 mb-12">
        <h2 className="text-[32px] font-bold tracking-tight text-black" style={{ fontFamily: '"Poppins", sans-serif' }}>
          Watch & Buy
        </h2>
        <p className="text-[14px] text-black/50 font-medium tracking-tight">
          Shop the trendiest collection loved by our influencers
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
        {influencerContent.map((item) => (
          <div key={item.id} className="min-w-[280px] md:min-w-[320px] group cursor-pointer">
            <div className="aspect-[9/16] rounded-lg overflow-hidden relative mb-4 bg-[#f5f5f5]">
              <img 
                src={item.thumbnail} 
                alt="Social" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                 <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                    <site-icon name="play" className="text-white" />
                 </div>
                 <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">{item.username}</p>
                 <p className="text-white/80 text-[13px] line-clamp-1">{item.caption}</p>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#fa5d42]">Shop the fit</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CouponSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const coupons = [
    {
      id: 1,
      badge: "OFFER VALID TILL TODAY",
      title: "200 OFF on CAPS",
      desc: "Instant ₹200 off on all caps - grab the deal before it’s gone",
      code: "CAP200",
      img: "https://ybeclothing.com/cdn/shop/files/CAP200_990c49f3-016f-4ffe-8ff5-bf9ad74929db.png?v=1773684056&width=100",
    },
    {
      id: 2,
      badge: "EXPIRING TODAY",
      title: "FLAT ₹200 OFF",
      desc: "Instant ₹200 off on all orders - grab the deal before it’s gone",
      code: "FLAT200",
      img: "https://ybeclothing.com/cdn/shop/files/FLAT200.png?v=1773683921&width=100",
    },
    {
      id: 3,
      badge: "EXPIRING TODAY",
      title: "FLAT ₹400 OFF",
      desc: "Instant ₹400 off on all orders - grab the deal before it’s gone",
      code: "FLAT400",
      img: "https://ybeclothing.com/cdn/shop/files/FLAT400.png?v=1773683922&width=100",
    },
    {
      id: 4,
      badge: "EXPIRING TODAY",
      title: "BUY 2 GET A CAP FREE",
      desc: "Buy any 2 products and get 1 cap free. Add the cap to your cart.",
      code: "FREECAP",
      img: "https://ybeclothing.com/cdn/shop/files/FREECAP.png?v=1773683922&width=100",
    },
  ];

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="pt-24 pb-12 bg-white">
      <div className="max-w-[1440px] mx-auto px-8 md:px-16">
        <div className="flex items-end justify-between mb-12">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-[#fa5d42] tracking-[0.2em] uppercase">Limited Time Deals</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Active Coupons</h2>
            <p className="text-[15px] text-black/50 font-medium max-w-[500px]">Grab our most exclusive offers before they expire. Valid for a limited time only.</p>
          </div>
          <button className="text-[12px] font-bold uppercase tracking-widest text-black/40 hover:text-[#fa5d42] transition-colors hover:underline">Explore Offer Zone</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {coupons.map(coupon => (
            <div
              key={coupon.id}
              className="group relative bg-[#f8f8f8] rounded-lg p-8 border border-black/5 flex flex-col gap-8 overflow-hidden transition-all hover:bg-white hover:shadow-2xl hover:border-black/10"
            >
               <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="size-2 rounded-full bg-[#fa5d42]" />
                    <span className="text-[10px] font-bold text-[#fa5d42] uppercase tracking-[0.2em]">
                      {coupon.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black uppercase tracking-tight mb-3 leading-tight">{coupon.title}</h3>
                  <p className="text-[13px] text-black/50 leading-relaxed font-medium mb-8 max-w-[180px]">{coupon.desc}</p>
                  
                  <div className="flex flex-col gap-2">
                    <div className="h-14 bg-white border border-black/[0.08] rounded-2xl flex items-center justify-center font-mono text-[16px] font-bold text-black tracking-[0.2em] shadow-sm uppercase">
                      {coupon.code}
                    </div>
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className={`h-14 rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all ${
                        copied === coupon.code ? "bg-[#fa5d42] text-white" : "bg-black text-white hover:bg-[#fa5d42]"
                      }`}
                    >
                      {copied === coupon.code ? "Copied" : "Copy"}
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onOpenCart }: LandingPageProps) {
  const navigate = useNavigate();
  const instaSectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: instaSectionRef,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const x2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  const featured = products.slice(0, 5);
  const second = products.slice(4, 9);
  const mostOrdered = [...products].reverse().slice(0, 5);

  return (
    <div
      className="min-h-screen bg-white text-black selection:bg-[#fa5d42] selection:text-white"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <SiteHeader onOpenCart={onOpenCart} />

      {/* Announcement marquee */}
      <div className="bg-black py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee-banner shrink-0 gap-20">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-4">
              <span className="text-white text-[10px] font-bold tracking-[0.3em] uppercase">
                Free shipping on orders over $100 · 30-day returns · Ships worldwide
              </span>
              <div className="size-1.5 rounded-full bg-[#fa5d42]" />
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="aspect-[1400/678] relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img alt="" className="absolute h-full w-full object-cover" src={imgContent} />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-between pt-16 pb-0">
          <div className="px-16">
            <span className="text-white/70 text-[11px] font-bold uppercase tracking-[0.3em] mb-4 block">
              Spring / Summer 2026
            </span>
            <h2
              className="text-[54px] text-white leading-[1.05] max-w-4xl"
              style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700 }}
            >
              STYLE REDEFINED,<br />EFFORTLESSLY YOURS.
            </h2>
          </div>
          <div className="flex flex-col gap-16">
            <div className="px-16 flex flex-col gap-5">
              <p className="text-[18px] text-white/90 leading-[1.5] font-medium max-w-[520px]">
                Modern wardrobe essentials — engineered for everyday movement,
                built to outlive the season.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/shop")}
                  className="bg-white text-black px-8 py-3 rounded-full text-[15px] whitespace-nowrap hover:bg-[#fa5d42] hover:text-white transition-all font-bold shadow-xl active:scale-95"
                >
                  Shop the collection
                </button>
                <button
                  onClick={() => navigate("/shop?category=Hoodies")}
                  className="text-white text-[15px] font-medium underline underline-offset-4 hover:text-[#fa5d42] transition-colors"
                >
                  Explore hoodies →
                </button>
              </div>
            </div>

            {/* Trust strip */}
            <div className="w-full bg-white py-3 px-[60px]">
              <div className="w-full">
                <div className="bg-[#F7F7F7] rounded-full py-[14px] overflow-hidden relative">
                  <div
                    className="flex items-center whitespace-nowrap"
                    style={{
                      maskImage:
                        "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 10%, rgb(0, 0, 0) 90%, rgba(0, 0, 0, 0) 100%)",
                    }}
                  >
                    <div className="flex animate-marquee items-center gap-12 text-[#050505] text-xl font-medium tracking-tight">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-12 shrink-0">
                          {[
                            "Ships worldwide",
                            "30-day free returns",
                            "Secure checkout",
                            "Low-impact materials",
                            "Designed in-house",
                          ].map((text, idx) => (
                            <div key={idx} className="flex items-center gap-12">
                              <span>{text}</span>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="text-[#050505]"
                              >
                                <path d="M8 0L9.79611 6.20389H16L10.902 10.0922L12.6981 16.2961L8 12.4078L3.3019 16.2961L5.09796 10.0922L0 6.20389H6.20389L8 0Z" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CouponSection />

      {/* Foundational protocols */}
      <section className="w-full px-8 md:px-16 pt-10 md:pt-16 pb-20 border-b border-black/5 bg-white relative overflow-hidden">
        <div className="flex flex-col gap-5 mb-12">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-[#fa5d42] tracking-[0.3em] uppercase block">
              Foundational protocols
            </span>
            <h2
              className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[0.9] text-black tracking-tight max-w-[900px]"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              Engineered for<br />the next era.
            </h2>
          </div>
          <p className="text-black/50 text-[15px] font-medium leading-relaxed max-w-[500px]">
            Establishing a new baseline for high-fidelity wearable technology and archival permanence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-black/10 divide-y md:divide-y-0 md:divide-x divide-black/10 rounded-[32px] overflow-hidden bg-white shadow-sm">
          {[
            {
              title: "Tactile Synthesis",
              desc: "Bio-engineered, heavyweight cotton specimens developed for cellular comfort and architectural structural integrity.",
              icon: <ArrowRight className="w-8 h-8" />,
            },
            {
              title: "AI Fabrication Lab",
              desc: "Generative design protocols allowing for real-time 3D modulation of archival patterns and bespoke graphic synthesis.",
              icon: <Check className="w-8 h-8" />,
            },
            {
              title: "Archival Longevity",
              desc: "Every unit is registered with a unique signature, designed to withstand multi-decade deployment without structural fatigue.",
              icon: <ShieldCheck className="w-8 h-8" />,
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative p-8 md:p-12 flex flex-col gap-10 transition-all duration-500 hover:bg-[#fa5d42]/[0.02] cursor-default"
            >
              <div className="w-16 h-16 rounded-2xl bg-black text-white flex-shrink-0 flex items-center justify-center transition-all duration-500 group-hover:bg-[#fa5d42] shadow-lg">
                {item.icon}
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-black tracking-tight group-hover:text-[#fa5d42] transition-colors leading-none">
                  {item.title}
                </h3>
                <p className="text-black/50 text-[15px] font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
              
              <div className="absolute top-0 right-0 w-px h-0 group-hover:h-full bg-gradient-to-b from-transparent via-[#fa5d42]/40 to-transparent transition-all duration-1000" />
            </motion.div>
          ))}
        </div>
      </section>


      {/* Shop by */}
      <section className="px-8 py-16 bg-white">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
          <div className="flex flex-col gap-6">
            <h2
              className="text-[48px] text-[#0e0e0e] tracking-[-1.92px] leading-[1]"
              style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700 }}
            >
              New arrivals
            </h2>
            <div className="flex gap-[6px] items-center flex-wrap">
              <button className="px-4 py-[6px] rounded-[32px] text-[13px] transition-colors bg-[#0e0e0e] text-white font-medium">
                New Arrivals
              </button>
              <button
                onClick={() => navigate("/shop")}
                className="px-4 py-[6px] rounded-[32px] text-[13px] transition-colors bg-[#f3f6f5] text-[#5e6b64] font-medium hover:bg-black/5"
              >
                Best Sellers
              </button>
              <button
                onClick={() => navigate("/shop")}
                className="px-4 py-[6px] rounded-[32px] text-[13px] transition-colors bg-[#f3f6f5] text-[#5e6b64] font-medium hover:bg-black/5"
              >
                Classics
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="text-[12px] font-bold uppercase tracking-[0.25em] text-black/60 hover:text-black transition-colors"
          >
            View all →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => navigate(`/product?id=${p.id}`)}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {second.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => navigate(`/product?id=${p.id}`)}
            />
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/shop")}
            className="bg-[#0b0b0b] text-white px-8 py-3 rounded-full text-[15px] font-bold hover:bg-[#fa5d42] transition-all active:scale-95"
          >
            Shop everything
          </button>
        </div>
      </section>

      <GalleryMarquee />

      {/* Most Ordered */}
      <section className="px-8 py-20 bg-[#fafafa]">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h2
                className="text-[48px] text-[#0e0e0e] tracking-[-1.92px] leading-[1]"
                style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700 }}
              >
                Most Ordered in 24 Hrs
              </h2>
              <div className="h-[1px] w-24 bg-black/10 mt-4" />
            </div>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="text-[12px] font-bold uppercase tracking-[0.25em] text-black/60 hover:text-black transition-colors"
          >
            View all trending →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {mostOrdered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => navigate(`/product?id=${p.id}`)}
            />
          ))}
        </div>
      </section>

      <WatchAndBuy />

      {/* Visual narrative */}

      {/* Social feed */}
      <section ref={instaSectionRef} className="w-full py-16 md:py-24 overflow-hidden bg-white">

        <div className="flex flex-col gap-5">
          <div className="relative w-full">
            <motion.div 
              style={{ x: x1 }}
              className="flex gap-4 w-max"
            >
              {[
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
                "https://images.unsplash.com/photo-1483985988355-763728e1935b",
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
                "LOGO_MARK",
                "https://images.unsplash.com/photo-1539109132332-629ee0e9603a",
                "https://images.unsplash.com/photo-1554412933-514a83d2f3c8",
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
                "https://images.unsplash.com/photo-1483985988355-763728e1935b",
              ].map((src, i) => (
                <div
                  key={i}
                  className="group relative flex-none w-[120px] md:w-[180px] aspect-square rounded-xl overflow-hidden bg-[#fafafa]"
                >
                  {src === "LOGO_MARK" ? (
                    <div className="w-full h-full bg-black flex items-center justify-center p-6">
                      <img
                        src="/image.png"
                        className="w-full h-auto brightness-0 invert"
                        alt="HOODUDE"
                      />
                    </div>
                  ) : (
                    <img
                      src={`${src}?q=60&w=600&auto=format&fit=crop`}
                      className="w-full h-full object-cover"
                      alt="Customer wearing Hoodude"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative w-full">
            <motion.div 
              style={{ x: x2 }}
              className="flex gap-4 w-max"
            >
              {[
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
                "https://images.unsplash.com/photo-1554412933-514a83d2f3c8",
                "LOGO_MARK",
                "https://images.unsplash.com/photo-1539109132332-629ee0e9603a",
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
                "https://images.unsplash.com/photo-1483985988355-763728e1935b",
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
                "https://images.unsplash.com/photo-1554412933-514a83d2f3c8",
              ].map((src, i) => (
                <div
                  key={i}
                  className="group relative flex-none w-[120px] md:w-[180px] aspect-square rounded-xl overflow-hidden bg-[#fafafa]"
                >
                  {src === "LOGO_MARK" ? (
                    <div className="w-full h-full bg-[#fa5d42] flex items-center justify-center p-6">
                      <img
                        src="/image.png"
                        className="w-full h-auto brightness-0 invert"
                        alt="HOODUDE"
                      />
                    </div>
                  ) : (
                    <img
                      src={`${src}?q=60&w=600&auto=format&fit=crop`}
                      className="w-full h-full object-cover"
                      alt="Customer wearing Hoodude"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>


      <SiteFooter />
    </div>
  );
}
