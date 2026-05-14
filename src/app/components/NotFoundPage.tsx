import { useNavigate } from "react-router";
import { motion } from "motion/react";
import SiteHeader from "./SiteHeader";
import PageHead from "./PageHead";
import SiteFooter from "./SiteFooter";

interface NotFoundPageProps {
  onOpenCart: () => void;
}

export default function NotFoundPage({ onOpenCart }: NotFoundPageProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHead title="Page not found" noindex />
      <SiteHeader onOpenCart={onOpenCart} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[calc(100vh-76px)]">
        {/* Editorial half — image */}
        <div className="relative bg-black overflow-hidden hidden lg:block">
          <motion.img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop"
            alt=""
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />
          <div className="absolute bottom-10 left-10 text-white/70 text-[10px] uppercase tracking-[0.3em] font-medium">
            HOODUDE — 404
          </div>
        </div>

        {/* Editorial half — copy */}
        <div className="flex items-center justify-center px-8 md:px-16 py-24">
          <div className="max-w-[460px]">
            <span className="text-eyebrow font-medium uppercase tracking-[0.3em] text-fg-faint">
              Error 404
            </span>
            <h1 className="font-serif text-display italic leading-[0.95] tracking-[-0.01em] text-fg mt-6">
              That isn't here.
            </h1>
            <p className="text-body text-fg-mute leading-relaxed mt-8 max-w-[380px]">
              The page you're after has moved, or never existed. Let's get you
              back to something you can actually wear.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-12">
              <button
                onClick={() => navigate("/")}
                className="bg-black text-white px-7 h-12 rounded-full font-medium text-[13px] hover:bg-brand transition-colors"
              >
                Back to home
              </button>
              <button
                onClick={() => navigate("/shop")}
                className="border border-black/15 px-7 h-12 rounded-full font-medium text-[13px] hover:border-black transition-colors"
              >
                Shop all
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
