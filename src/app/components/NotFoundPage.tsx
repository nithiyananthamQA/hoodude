import { useNavigate } from "react-router";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

interface NotFoundPageProps {
  onOpenCart: () => void;
}

export default function NotFoundPage({ onOpenCart }: NotFoundPageProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <SiteHeader onOpenCart={onOpenCart} />
      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="max-w-[520px] text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#fa5d42] mb-4 block">
            404
          </span>
          <h1
            className="text-[72px] md:text-[96px] leading-[0.95] tracking-tight mb-6"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            Lost thread.
          </h1>
          <p className="text-[15px] text-black/60 leading-relaxed mb-10">
            The page you're after has moved or never existed. Let's get you
            back to something you can wear.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="bg-black text-white px-7 h-12 rounded-full font-bold text-[13px] hover:bg-[#fa5d42] transition-colors"
            >
              Back to home
            </button>
            <button
              onClick={() => navigate("/shop")}
              className="border border-black/15 px-7 h-12 rounded-full font-bold text-[13px] hover:border-black transition-colors"
            >
              Shop all
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
