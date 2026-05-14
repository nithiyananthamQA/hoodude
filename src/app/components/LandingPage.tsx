import { Play, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { products } from "./products";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { formatPrice } from "../utils/currency";
import ProductCard from "./ProductCard";
import PageHead, { organizationSchema, websiteSchema } from "./PageHead";
import Image from "./ui/Image";
import MagneticButton from "./ui/MagneticButton";

const imgContent = "/hero-team.png";

interface LandingPageProps {
  onOpenCart: () => void;
}

function GalleryMarquee() {
  // Editorial portrait set, single visual register: full-body / 3-quarter
  // street portraits, daylight, neutral backdrops. Cohesive feel — no mix of
  // studio-pack-shot, lifestyle, and product photography. Replace with real
  // shoot when assets are available.
  const images = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485518882345-15568b007407?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
  ];

  return (
    <div className="py-24 bg-white overflow-hidden border-y border-black/5">
       <div className="flex whitespace-nowrap animate-marquee-banner hover:[animation-play-state:paused] cursor-pointer">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="flex gap-3 px-[6px]">
                {images.map((img, idx) => (
                   <div key={idx} className="w-[400px] h-[500px] rounded-lg overflow-hidden bg-[#f5f5f5]">
                      <Image
                        src={img}
                        alt=""
                        sizes="400px"
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
  // Vertical 9:16 portraits, neutral editorial source (Unsplash, no
  // attribution required for free commercial use). Swap to your own UGC clips
  // when those land — the structure is unchanged.
  const influencerContent = [
    {
      id: 1,
      thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=480&h=854&fit=crop&auto=format",
      username: "@hoodude",
      caption: "From desk to the block...",
    },
    {
      id: 2,
      thumbnail: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=480&h=854&fit=crop&auto=format",
      username: "@hoodude",
      caption: "When life shows 404 error...",
    },
    {
      id: 3,
      thumbnail: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=480&h=854&fit=crop&auto=format",
      username: "@hoodude",
      caption: "Beyond trends. Beyond rules.",
    },
    {
      id: 4,
      thumbnail: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=480&h=854&fit=crop&auto=format",
      username: "@hoodude",
      caption: "Stealing the spotlight...",
    },
    {
      id: 5,
      thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=480&h=854&fit=crop&auto=format",
      username: "@hoodude",
      caption: "For women who own the streets...",
    },
    {
      id: 6,
      thumbnail: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=480&h=854&fit=crop&auto=format",
      username: "@hoodude",
      caption: "Control + Z my life...",
    },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // Heading drifts up gently as section enters; rail offsets the opposite way
  // for a soft parallax separation between heading and content.
  const headingY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const railY = useTransform(scrollYProgress, [0, 1], [60, -20]);

  return (
    <section ref={sectionRef} className="px-8 md:px-16 py-24 md:py-32 bg-white">
      <motion.div style={{ y: headingY }} className="mb-16">
        <h2 className="text-h2 font-semibold tracking-tight text-black leading-[1]">
          Watch & Buy
        </h2>
      </motion.div>

      <motion.div
        style={{ y: railY }}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2"
      >
        {influencerContent.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ delay: idx * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="min-w-[280px] md:min-w-[320px] group cursor-pointer"
          >
            <div className="aspect-[9/16] rounded-lg overflow-hidden relative mb-4 bg-[#f5f5f5]">
              <Image
                src={item.thumbnail}
                alt=""
                sizes="(min-width: 768px) 320px, 280px"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                 <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                    <Play size={16} className="text-white fill-white" />
                 </div>
                 <p className="text-white text-xs font-semibold uppercase tracking-widest mb-1">{item.username}</p>
                 <p className="text-white/80 text-[13px] line-clamp-1">{item.caption}</p>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                 <span className="text-[10px] font-semibold uppercase tracking-widest text-brand">Shop the fit</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default function LandingPage({ onOpenCart }: LandingPageProps) {
  const navigate = useNavigate();
  const instaSectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: instaSectionRef,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const x2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  const heroImageY = useTransform(heroProgress, [0, 1], ["0%", "25%"]);
  const heroImageScale = useTransform(heroProgress, [0, 1], [1, 1.15]);
  const heroTextY = useTransform(heroProgress, [0, 1], [0, 80]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);

  const newDrops = products.slice(0, 10);
  const mostOrdered = [...products].reverse().slice(0, 5);
  const arrivalsRef = useRef<HTMLDivElement>(null);

  const mostOrderedRef = useRef<HTMLElement>(null);
  const { scrollYProgress: mostProgress } = useScroll({
    target: mostOrderedRef,
    offset: ["start end", "end start"],
  });
  // Headline floats up as section enters viewport; grid lifts a smaller amount
  // so the heading "leads" the cards into view.
  const mostHeadingY = useTransform(mostProgress, [0, 1], [60, -60]);
  const mostGridY = useTransform(mostProgress, [0, 1], [40, -10]);

  const cultRef = useRef<HTMLElement>(null);
  const { scrollYProgress: cultProgress } = useScroll({
    target: cultRef,
    offset: ["start end", "end start"],
  });
  // Image scales slowly through scroll — gives the cult shot a "pulled into the
  // frame" feel without ever cropping the right-side overlay text.
  const cultImageY = useTransform(cultProgress, [0, 1], ["-6%", "8%"]);
  const cultImageScale = useTransform(cultProgress, [0, 1], [1.05, 1.18]);

  const scrollArrivals = (dir: "prev" | "next") => {
    const el = arrivalsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "next" ? el.clientWidth : -el.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen bg-white text-black selection:bg-brand selection:text-white"
     
    >
      <PageHead
        title="HOODUDE"
        description="Streetwear essentials made for the crew you keep. Built to wear, repeat, remember."
        canonical="/"
        jsonLd={[
          organizationSchema({
            description: "Streetwear essentials made for the crew you keep.",
            sameAs: [
              "https://instagram.com/hoodude",
              "https://twitter.com/hoodude",
            ],
            contactEmail: "tech@icliniq.com",
          }),
          websiteSchema({ searchUrlTemplate: "/shop?search={search_term_string}" }),
        ]}
      />
      {/* Announcement marquee */}
      <div className="bg-black py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee-banner shrink-0 gap-20">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-4">
              <span className="text-white text-[12px] font-medium tracking-tight">
                Free shipping on orders over $100 · 30-day returns · Ships worldwide
              </span>
              <div className="size-1.5 rounded-full bg-brand" />
            </span>
          ))}
        </div>
      </div>

      <SiteHeader onOpenCart={onOpenCart} />

      {/* Hero */}
      <div ref={heroRef} className="aspect-[1400/678] relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            alt=""
            className="absolute h-[115%] w-full object-cover object-[center_25%] -top-[7.5%]"
            src={imgContent}
            style={{ y: heroImageY, scale: heroImageScale }}
          />

          {/* Base darkening + left-side gradient for text legibility */}
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

          {/* Animated grain (film noise) */}
          <div
            className="absolute -inset-[50%] mix-blend-overlay opacity-[0.18] pointer-events-none animate-grain"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              backgroundSize: "240px 240px",
            }}
          />

          {/* Warm light leak — slow pulse + drift */}
          <motion.div
            animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.08, 1], x: [0, 20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/3 -right-1/4 w-[70%] h-[100%] rounded-full pointer-events-none blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,140,60,0.55) 0%, rgba(220,40,40,0.18) 45%, transparent 70%)",
            }}
          />

          {/* Cool counter-leak from bottom-left */}
          <motion.div
            animate={{ opacity: [0.1, 0.22, 0.1], scale: [1, 1.05, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute -bottom-1/3 -left-1/4 w-[60%] h-[80%] rounded-full pointer-events-none blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(80,120,255,0.4) 0%, rgba(40,40,80,0.15) 45%, transparent 70%)",
            }}
          />

          {/* Vignette flicker */}
          <motion.div
            animate={{ opacity: [0.55, 0.7, 0.55] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.7)" }}
          />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-end pb-0">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ opacity: heroTextOpacity }}
            className="absolute right-16 bottom-[120px] flex flex-col items-center gap-2 z-20"
          >
            <span className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.3em] [writing-mode:vertical-rl] rotate-180">
              Scroll
            </span>
            <ChevronDown size={20} className="text-white/80" strokeWidth={1.5} />
          </motion.div>
          <div className="flex flex-col gap-16">
            <motion.div
              style={{ y: heroTextY, opacity: heroTextOpacity }}
              className="px-16 flex flex-col gap-8 pb-20"
            >
              <span className="text-white/80 text-[11px] font-semibold uppercase tracking-[0.3em] block">
                The 2026 Lineup
              </span>
              <h1 className="text-display text-white leading-[1.02] max-w-3xl tracking-[-0.02em] font-semibold">
                Built for the<br />crew you keep.
              </h1>
              <p className="text-[17px] text-white/85 leading-[1.6] font-medium max-w-[480px]">
                Everyday essentials made to move with you — and the people you show up with.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <MagneticButton
                  onClick={() => navigate("/shop")}
                  className="bg-white text-black px-8 py-3 rounded-full text-[15px] whitespace-nowrap hover:bg-brand hover:text-white transition-colors font-semibold shadow-xl"
                >
                  Shop the collection
                </MagneticButton>
                <button
                  onClick={() => navigate("/shop?category=Hoodies")}
                  className="text-white text-[15px] font-medium underline underline-offset-4 hover:text-brand transition-colors"
                >
                  Explore hoodies →
                </button>
              </div>
            </motion.div>

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

      {/* New Drops */}
      <section className="px-8 md:px-16 py-24 md:py-32 bg-white">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-16">
          <h2 className="text-h2 text-ink font-semibold tracking-tight leading-[1]">
            New Drops
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollArrivals("prev")}
              aria-label="Previous"
              className="size-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              onClick={() => scrollArrivals("next")}
              aria-label="Next"
              className="size-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div
          ref={arrivalsRef}
          className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {newDrops.map((p) => (
            <div
              key={p.id}
              className="flex-none snap-start w-[80%] sm:w-[45%] md:w-[30%] lg:w-[calc((100%-48px)/5)]"
            >
              <ProductCard
                product={p}
                onClick={() => navigate(`/product/${p.id}`)}
              />
            </div>
          ))}
        </div>
      </section>

      <GalleryMarquee />

      {/* Most Ordered */}
      <section
        ref={mostOrderedRef}
        className="px-8 md:px-16 py-24 md:py-32 bg-[#f5f5f5] overflow-hidden"
      >
        <motion.div
          style={{ y: mostHeadingY }}
          className="flex items-end justify-between gap-6 flex-wrap mb-16"
        >
          <h2 className="text-h2 text-ink font-semibold tracking-tight leading-[1]">
            Most ordered, last 24 hours
          </h2>
        </motion.div>

        <motion.div
          style={{ y: mostGridY }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {mostOrdered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 32, clipPath: "inset(20% 0% 20% 0%)" }}
              whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ delay: i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductCard
                product={p}
                onClick={() => navigate(`/product/${p.id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <WatchAndBuy />

      {/* Cult — full-bleed image with right-side content overlay */}
      <section ref={cultRef} className="relative w-full bg-black overflow-hidden">
        <motion.img
          src="/voodoo.png"
          alt="HOODUDE cult — characters from the universe"
          style={{ y: cultImageY, scale: cultImageScale }}
          className="w-full h-auto block origin-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent from-30% via-black/50 to-black/95 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-full md:w-3/5 lg:w-1/2 flex items-center justify-end px-8 md:px-16 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6 max-w-[520px]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">
              Enter the cult
            </span>
            <h2
              className="font-serif text-display leading-[0.95] tracking-[-0.01em] text-white"
              style={{ fontWeight: 400, fontStyle: "italic" }}
            >
              Not a brand.<br />A universe.
            </h2>
            <p className="text-[15px] md:text-[16px] text-white/80 leading-relaxed max-w-[440px]">
              Built with the strangest crew you've never met. Every drop carries
              a piece of them — pull the thread and find the lore.
            </p>
            <MagneticButton
              onClick={() => navigate("/shop")}
              className="self-start px-8 h-14 bg-brand text-white text-[13px] font-semibold uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-colors"
            >
              See the drops
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* Social feed */}

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
                  className="group relative flex-none w-[120px] md:w-[180px] aspect-square rounded-xl overflow-hidden bg-[#f5f5f5]"
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
                    <Image
                      src={src}
                      sizes="(min-width: 768px) 180px, 120px"
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
                  className="group relative flex-none w-[120px] md:w-[180px] aspect-square rounded-xl overflow-hidden bg-[#f5f5f5]"
                >
                  {src === "LOGO_MARK" ? (
                    <div className="w-full h-full bg-brand flex items-center justify-center p-6">
                      <img
                        src="/image.png"
                        className="w-full h-auto brightness-0 invert"
                        alt="HOODUDE"
                      />
                    </div>
                  ) : (
                    <Image
                      src={src}
                      sizes="(min-width: 768px) 180px, 120px"
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
