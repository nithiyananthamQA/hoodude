import { lazy, Suspense, useEffect, useMemo, useState } from "react";
const Product3DViewer = lazy(() => import("./Product3DViewer"));
import { useNavigate, useSearchParams } from "react-router";
import {
  ShoppingBag,
  X,
  Star,
  Palette,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Share2,
  Facebook,
  Twitter,
  Mail,
  Plus as PlusIcon,
  Ruler,
  Heart,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { findProduct, products } from "./products";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useCart } from "../store/CartContext";
import { useWishlist } from "../store/WishlistContext";
import { formatPrice } from "../utils/currency";

interface ProductPageProps {
  onOpenCart: () => void;
}

function ProductSpecs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16 border-t border-black/5">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-3 border-b border-black/5">
          <img src="https://static.cdn.printful.com/static/v877/images/products-catalog/product-specs/branding_options.svg?v=2" alt="" className="h-10" />
          <h4 className="text-[18px] font-bold text-black uppercase tracking-tight">Customization</h4>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <h5 className="text-[13px] font-bold text-black mb-3">DTFlex print</h5>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {["Front print", "Back print", "Inside label", "Sleeve top"].map(label => (
                <div key={label} className="flex items-center gap-1.5 text-[12px] text-black/60 font-medium whitespace-nowrap">
                  <Check size={14} className="text-[#fa5d42]" strokeWidth={3} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[13px] font-bold text-black mb-3">Embroidery</h5>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {["Left chest", "Center chest", "Large center", "Sleeve top"].map(label => (
                <div key={label} className="flex items-center gap-1.5 text-[12px] text-black/60 font-medium whitespace-nowrap">
                  <Check size={14} className="text-[#fa5d42]" strokeWidth={3} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 text-[11px] font-bold text-[#fa5d42] hover:underline uppercase tracking-widest">See file guidelines</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-3 border-b border-black/5">
          <img src="https://static.cdn.printful.com/static/v877/images/products-catalog/product-specs/style_and_fit.svg?v=2" alt="" className="h-10" />
          <h4 className="text-[18px] font-bold text-black uppercase tracking-tight">Style and fit</h4>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { t: "Streetwear look", d: "Heavyweight fabric gives it a structured look, perfect for streetwear outfits." },
            { t: "Regular fit", d: "Standard length, the fabric easily gives into movement." },
            { t: "Tubular", d: "Constructed from a single piece of cloth—no side seams." },
          ].map(item => (
            <div key={item.t}>
              <h5 className="text-[13px] font-bold text-black mb-1">{item.t}</h5>
              <p className="text-[12px] text-black/50 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-3 border-b border-black/5">
          <img src="https://static.cdn.printful.com/static/v877/images/products-catalog/product-specs/material.svg?v=2" alt="" className="h-10" />
          <h4 className="text-[18px] font-bold text-black uppercase tracking-tight">Material</h4>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <h5 className="text-[13px] font-bold text-black mb-3">Fabric thickness</h5>
            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-black w-[80%]" />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-black/30">
              <span>Lightweight</span>
              <span>Heavyweight</span>
            </div>
          </div>
          <div>
            <h5 className="text-[13px] font-bold text-black mb-3">Softness scale</h5>
            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-black w-[40%]" />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-black/30">
              <span>Rough</span>
              <span>Extra Soft</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-3 border-b border-black/5">
          <img src="https://static.cdn.printful.com/static/v877/images/products-catalog/product-specs/features.svg?v=2" alt="" className="h-10" />
          <h4 className="text-[18px] font-bold text-black uppercase tracking-tight">Features</h4>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <h5 className="text-[13px] font-bold text-black mb-2">Tear-away tag</h5>
            <p className="text-[12px] text-black/50 leading-relaxed">
              Easily removable tear-away tag that allows you to add a custom inside label for your brand.
            </p>
          </div>
        </div>
      </div>
    </div>
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
    <div className="pt-20 pb-0 border-t border-black/5">
      <div className="flex items-end justify-between mb-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tighter uppercase">Active Coupons</h2>
          <p className="text-[14px] text-black/50 font-medium">Get 20% off your entire first purchase when you sign up.</p>
        </div>
        <button className="text-[12px] font-bold uppercase tracking-widest text-[#fa5d42] hover:underline">View All</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {coupons.map(coupon => (
          <div
            key={coupon.id}
            className="group relative bg-[#f8f8f8] rounded-lg p-8 border border-black/5 flex flex-col gap-6 overflow-hidden transition-all hover:bg-white hover:shadow-2xl hover:shadow-black/5 hover:border-black/10"
          >
             <div className="flex-1 text-center md:text-left">
                <span className="inline-block px-3 py-1 bg-white border border-black/5 rounded-full text-[10px] font-bold text-[#fa5d42] uppercase tracking-widest mb-4">
                  {coupon.badge}
                </span>
                <h3 className="text-[18px] font-black uppercase tracking-tight mb-2 leading-none">{coupon.title}</h3>
                <p className="text-[12px] text-black/50 leading-relaxed font-medium mb-6">{coupon.desc}</p>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-12 bg-white border border-black/10 rounded-2xl flex items-center px-4 font-mono text-[14px] font-bold text-black tracking-widest uppercase">
                    {coupon.code}
                  </div>
                  <button
                    onClick={() => copyToClipboard(coupon.code)}
                    className={`h-12 px-6 rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all ${
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
  );
}

function FileGuidelinesContent() {
  const [tech, setTech] = useState("Embroidery");
  const techs = ["DTG Printing", "Embroidery", "DTFlex Printing"];

  return (
    <div className="flex flex-col gap-12">
      <div className="flex gap-4 p-1.5 bg-black/[0.03] rounded-2xl self-start">
        {techs.map(t => (
          <button
            key={t}
            onClick={() => setTech(t)}
            className={`px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all ${
              tech === t ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tech}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex flex-col gap-16"
        >
          {/* TOP HIGHLIGHTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { img: "3b72483e6c6bdce4e6fb0ce517bdd315", text: "Submit files in PNG or JPEG format with at least 150 DPI" },
              { img: "e559f45afa96e88f5d19c4909da98a49", text: "Create files in sRGB color profile for maximum accuracy" },
              { img: "3ea21a3f4ea0ffaed88dfabb7a2651f7", text: "Delete guide layers from templates before saving" },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 items-center p-6 bg-black/[0.02] rounded-3xl group hover:bg-black/[0.04] transition-colors">
                <img src={`https://printful.s3-accelerate.amazonaws.com/upload/file-upload/3b/${item.img}`} alt="" className="size-16 object-contain" />
                <p className="text-[13px] font-medium leading-relaxed text-black/70">{item.text}</p>
              </div>
            ))}
          </div>

          {tech === "Embroidery" && (
            <>
              <div className="flex flex-col gap-8">
                <h3 className="text-2xl font-bold tracking-tight">Placement Guidelines</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className="py-4 text-[11px] font-bold tracking-widest uppercase text-black/40">Placement</th>
                        <th className="py-4 text-[11px] font-bold tracking-widest uppercase text-black/40">Sizes</th>
                        <th className="py-4 text-[11px] font-bold tracking-widest uppercase text-black/40">File Size</th>
                        <th className="py-4 text-[11px] font-bold tracking-widest uppercase text-black/40 text-right">Template</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.03]">
                      {[
                        { p: "Left Chest", s: "All sizes", fs: "10.16 × 10.16 cm" },
                        { p: "Centered", s: "All sizes", fs: "10.16 × 10.16 cm" },
                        { p: "Large Front", s: "All sizes", fs: "25.40 × 15.24 cm" },
                        { p: "Top Sleeves", s: "All sizes", fs: "5.08 × 7.62 cm" },
                      ].map((row, i) => (
                        <tr key={i} className="group hover:bg-black/[0.01] transition-colors font-medium">
                          <td className="py-4 text-[14px] text-black"><strong>{row.p}</strong></td>
                          <td className="py-4 text-[13px] text-black/50">{row.s}</td>
                          <td className="py-4 text-[14px] text-black">{row.fs}</td>
                          <td className="py-4 text-right">
                            <button className="text-[11px] font-bold text-[#fa5d42] uppercase tracking-widest hover:underline">Download</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="flex flex-col gap-8">
                  <h3 className="text-2xl font-bold tracking-tight">Standard vs Unlimited</h3>
                  <div className="flex flex-col gap-6 text-[14px] text-black/60 leading-relaxed">
                    <p>
                      <strong className="text-black">Standard color embroidery:</strong> choose from 15 thread colors and combine up to 6 within a single design.
                    </p>
                    <p>
                      <strong className="text-black">Unlimited embroidery:</strong> thread can transform into nearly any color except metallic and neon. multi-color, gradient, or solid-color designs with no limits.
                    </p>
                    <img 
                      src="https://files.cdn.printful.com/o/upload/file-upload/e2/e21c1c5505b33e95cdfa80d801cc2c48_l?v=f29d46ad76ecadedc23f1a7fd7040d4b" 
                      alt="" 
                      className="rounded-3xl w-full aspect-video object-cover" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <h3 className="text-2xl font-bold tracking-tight">Available thread colors</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { n: "1801 White", h: "#FFFFFF" },
                      { n: "1800 Black", h: "#000000" },
                      { n: "1718 Grey", h: "#96A1A8" },
                      { n: "1672 Old Gold", h: "#A67843" },
                      { n: "1951 Gold", h: "#FFCC00" },
                      { n: "1987 Orange", h: "#E25C27" },
                      { n: "1910 Flamingo", h: "#CC3366" },
                      { n: "1839 Red", h: "#CC3333" },
                      { n: "1784 Maroon", h: "#660000" },
                      { n: "1966 Navy", h: "#333366" },
                      { n: "1842 Royal", h: "#005397" },
                      { n: "1832 Purple", h: "#6B5294" },
                    ].map(color => (
                        <div key={color.n} className="flex flex-col gap-2 p-3 bg-black/[0.02] rounded-2xl border border-black/5">
                           <div className="h-8 w-full rounded-lg shadow-inner" style={{ background: color.h }} />
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-black uppercase tracking-tight">{color.n}</span>
                              <span className="text-[10px] text-black/30 font-mono">{color.h}</span>
                           </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TUTORIAL VIDEOS */}
          <div className="flex flex-col gap-8">
            <h3 className="text-2xl font-bold tracking-tight">Tutorial Videos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: "1ZPEiosTssE", title: "Design Maker Tutorial" },
                { id: "XvJ0bA_jg-o", title: "Embroidery Guidelines" },
                { id: "OIE2cjfPJGs", title: "Design Maker tutorial" },
                { id: "IEQsqdyXAOc", title: "Color Correcting" },
              ].map(video => (
                <div key={video.id} className="group cursor-pointer">
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-3">
                    <img src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                       <div className="size-10 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Plus size={20} className="rotate-45" />
                       </div>
                    </div>
                  </div>
                  <h4 className="text-[13px] font-bold text-black uppercase tracking-tight">{video.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ProductTabs() {
  const [activeTab, setActiveTab] = useState("Description");
  const tabs = ["Description", "Shipping", "File guidelines", "Source"];

  return (
    <div className="mt-16 border-t border-black/5 pt-12">
      <div className="flex items-center gap-8 mb-10 overflow-x-auto no-scrollbar pb-1 border-b border-black/5">
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[13px] font-bold uppercase tracking-[0.2em] transition-all relative shrink-0 ${
                isActive ? "text-black" : "text-black/30 hover:text-black/50"
              }`}
            >
              {tab}
              {isActive && (
                <motion.div
                  layoutId="tabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === "Description" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              key="desc"
              className="flex flex-col gap-6"
            >
              <div className="text-[15px] text-black/70 leading-relaxed space-y-4">
                <p>
                  The <strong className="text-black">Gildan 5000</strong> Classic Tee gives a structured look that elevates the basic t-shirt.
                  Its sturdy cotton fabric keeps edges crisp, holds shape through repeated washes, and layers perfectly for streetwear looks.
                  Add your design for a long-lasting tee that feels timeless and chic.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[14px]">
                  {[
                    "100% Cotton (Sport Grey: 90% Cotton, 10% Poly)",
                    "Fabric weight: 5.0–5.3 oz/yd² (170–180 g/m²)",
                    "Pre-shrunk jersey knit & Open-end yarn",
                    "Tubular construction & Taped neck/shoulders",
                    "Double seam at sleeves and bottom hem",
                    "Tear-away tag for custom branding",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <div className="size-1 rounded-full bg-black/20 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-[#f8f8f8] rounded-2xl border border-black/5">
                <div className="flex flex-col gap-6">
                   <div>
                    <h5 className="text-[12px] font-bold uppercase tracking-widest text-[#fa5d42] mb-3">Environmental qualities</h5>
                    <div className="space-y-2 text-[13px] text-black/60">
                      <p>• Knitting: Honduras, Dominican Republic</p>
                      <p>• Dyeing: Honduras, Dominican Republic</p>
                      <p>• Manufacturing: Nicaragua, Honduras, Haiti, El Salvador, or DR</p>
                      <p>• Contains 0% recycled polyester</p>
                    </div>
                  </div>
                  <div className="h-px bg-black/5" />
                  <div>
                    <h5 className="text-[12px] font-bold uppercase tracking-widest text-black/40 mb-3">EU GPSR-related info</h5>
                    <div className="text-[11px] text-black/50 space-y-1">
                      <p>Manufacturer: Printful</p>
                      <p>Address: Raina bulvaris 25, Riga, Latvia, LV-1050</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-[15px] font-bold text-black mb-4 uppercase tracking-tighter">Print care instructions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: "01-wash-cold", text: "Wash cold, inside-out" },
                    { icon: "02-thubmle-low", text: "Tumble dry low" },
                    { icon: "03-iron-cool", text: "Cool iron inside-out" },
                    { icon: "04-no-dry-clean", text: "Do not dry clean" },
                  ].map(item => (
                    <div key={item.text} className="flex flex-col items-center text-center gap-2 p-3 bg-black/[0.02] rounded-xl">
                      <img src={`https://static.cdn.printful.com/static/v877//images/icons/${item.icon}.svg`} alt="" className="size-8" />
                      <span className="text-[10px] font-medium text-black/60">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-8 text-[11px] text-black/30 italic">
                Blank product sourced from Honduras, Nicaragua, Haiti, Dominican Republic, Bangladesh, and Mexico.
              </p>
            </motion.div>
          )}
          {activeTab === "Shipping" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              key="shipping"
              className="w-full flex flex-col gap-10"
            >
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <h5 className="text-[12px] font-bold uppercase tracking-widest text-black/40">Select your location</h5>
                </div>
                <div className="relative max-w-[320px]">
                  <button className="w-full h-14 px-5 bg-[#f8f8f8] border border-black/5 rounded-2xl flex items-center justify-between group hover:border-black/20 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <img src="https://flagcdn.com/in.svg" alt="India" className="h-4 rounded-[2px]" />
                      <span className="text-[14px] font-bold text-black uppercase tracking-tight">India</span>
                    </div>
                    <Check size={18} className="text-[#fa5d42]" strokeWidth={3} />
                  </button>
                  {/* Dropdown would go here - simplified for now */}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="py-4 text-[11px] font-bold uppercase tracking-widest text-black/40">Country / Region</th>
                      <th className="py-4 text-[11px] font-bold uppercase tracking-widest text-black/40">Delivery Time</th>
                      <th className="py-4 text-[11px] font-bold uppercase tracking-widest text-black/40 text-right">First Item</th>
                      <th className="py-4 text-[11px] font-bold uppercase tracking-widest text-black/40 text-right">Next Item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.03]">
                    {[
                      { region: "India", time: "6-11 business days", first: "$4.50", next: "$1.50", flag: "in" },
                      { region: "United States (USA)", time: "3-8 business days", first: "$4.19", next: "$1.49", flag: "us" },
                      { region: "United Kingdom (UK)", time: "4-9 business days", first: "$4.25", next: "$1.45", flag: "gb" },
                      { region: "Canada", time: "5-10 business days", first: "$6.49", next: "$1.95", flag: "ca" },
                      { region: "Australia", time: "5-10 business days", first: "$7.15", next: "$1.85", flag: "au" },
                      { region: "Europe (Mainland)", time: "4-10 business days", first: "$4.95", next: "$1.25", flag: "eu" },
                    ].map((rate, i) => (
                      <tr key={i} className="group hover:bg-black/[0.01] transition-colors">
                        <td className="py-5 text-[14px] font-medium text-black">
                          <div className="flex items-center gap-3">
                             <img src={`https://flagcdn.com/${rate.flag === "eu" ? "eu" : rate.flag}.svg`} alt="" className="h-3 rounded-[1px] opacity-60 group-hover:opacity-100 transition-opacity" />
                            {rate.region}
                          </div>
                        </td>
                        <td className="py-5 text-[13px] text-black/60 tracking-tight">{rate.time}</td>
                        <td className="py-5 text-[14px] font-bold text-black text-right">{rate.first}</td>
                        <td className="py-5 text-[14px] font-bold text-black text-right">{rate.next}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-8 p-6 bg-black/[0.02] rounded-2xl flex items-start gap-4">
                <div className="size-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-bold">!</span>
                </div>
                <div className="text-[12px] text-black/50 leading-relaxed">
                  Shipping costs and delivery times are estimates and may vary based on the specific carrier and seasonal demand. 
                  International orders may be subject to customs duties and local taxes upon arrival.
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "File guidelines" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              key="guidelines"
              className="w-full flex flex-col gap-10"
            >
              <FileGuidelinesContent />
            </motion.div>
          )}

          {activeTab === "Source" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="empty"
              className="py-12 text-[13px] text-black/30 font-medium tracking-widest uppercase text-center border-2 border-dashed border-black/5 rounded-3xl"
            >
              Section under development
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ProductPage({ onOpenCart }: ProductPageProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const product = useMemo(() => findProduct(params.get("id")), [params]);

  const { add } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);
  const [show3D, setShow3D] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [quantity, setQuantity] = useState(1);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [technique, setTechnique] = useState<"printing" | "embroidery">("embroidery");
  const [embroideryOption, setEmbroideryOption] = useState<"standard" | "plus">("standard");
  const [bulkCount, setBulkCount] = useState(25);

  useEffect(() => {
    setSelectedSize(product.sizes[0]);
    setSelectedColor(product.colors[0].name);
    setQuantity(1);
    setSelectedImage(0);
    setShow3D(false);
    setJustAdded(false);
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
      quantity,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    onOpenCart();
  };

  const faqItems = [
    {
      title: "Fabric & Care",
      content: (
        <div className="flex flex-col gap-2 text-[13px] text-black/70 leading-relaxed">
          <span>
            <strong className="text-black">Fabric:</strong> {product.fabric}
          </span>
          <span>
            <strong className="text-black">Weight:</strong> {product.gsm} GSM
          </span>
          <span>
            <strong className="text-black">Fit:</strong> {product.fit}
          </span>
          <span>
            <strong className="text-black">Care:</strong> Machine wash cold
            (inside out). Tumble dry low. Do not bleach. Iron on reverse.
          </span>
        </div>
      ),
    },
    {
      title: "Shipping & Returns",
      content: (
        <div className="flex flex-col gap-2 text-[13px] text-black/70 leading-relaxed">
          <span>• Free standard shipping on orders over $100.</span>
          <span>• Delivered in 3–5 business days (domestic), 7–14 days (international).</span>
          <span>• 30-day free returns. Item must be unworn with original tags.</span>
          <span>• Exchanges are free and processed within 48 hours of receipt.</span>
        </div>
      ),
    },
    {
      title: "Sustainability",
      content: (
        <p className="text-[13px] text-black/70 leading-relaxed">
          Every Hoodude piece is cut and stitched in audited facilities, using
          low-impact dyes and recycled packaging. 1% of every order funds
          textile waste recycling.
        </p>
      ),
    },
  ];

  const similarProducts = useMemo(() => {
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.category === product.category
    );
    const others = products.filter(
      (p) => p.id !== product.id && p.category !== product.category
    );
    return [...sameCategory, ...others].slice(0, 5);
  }, [product.id, product.category]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <SiteHeader onOpenCart={onOpenCart} />

      <div className="px-8 pt-8 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6 max-w-[1440px]">
          <button
            onClick={() => navigate("/")}
            className="text-[13px] font-medium text-black/40 hover:text-black transition-colors"
          >
            Home
          </button>
          <span className="text-black/20 text-[12px]">/</span>
          <button
            onClick={() => navigate(`/shop?category=${encodeURIComponent(product.category)}`)}
            className="text-[13px] font-medium text-black/40 hover:text-black transition-colors"
          >
            {product.category}
          </button>
          <span className="text-black/20 text-[12px]">/</span>
          <span className="text-[13px] font-semibold text-black">{product.name}</span>
        </div>

        <div className="flex items-start justify-between gap-8">
          {/* LEFT: Image Gallery (Vertical Stack) */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 3D Viewer Block */}
            {product.modelPath && (
              <div className="bg-[#f8f8f8] rounded-[32px] overflow-hidden relative w-full aspect-[3/4] shrink-0 shadow-sm border border-black/5 group">
                <Suspense
                  fallback={
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#f8f8f8]">
                      <div className="size-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span className="text-[12px] text-black/40 font-bold uppercase tracking-widest">
                        Initializing 3D
                      </span>
                    </div>
                  }
                >
                  <Product3DViewer
                    colorHex={activeColor.hex}
                    modelPath={product.modelPath}
                  />
                </Suspense>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl border border-white/20 text-[11px] uppercase font-black tracking-[0.2em] text-white flex items-center gap-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                    <span>Interact</span>
                  </div>
                </div>
              </div>
            )}

            {/* Images Stack */}
            {images.map((img, idx) => (
              <div 
                key={idx}
                className="w-full aspect-[3/4] rounded-[32px] overflow-hidden bg-[#f5f5f5] border border-black/5 shadow-sm"
              >
                <img
                  src={img}
                  alt={`${product.name} - view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* RIGHT: Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1 min-w-0 sticky top-[92px]"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-4">
              <span>{product.category}</span>
              <span className="text-black/20">/</span>
              <span className="text-black/70 truncate">{product.neck}</span>
            </div>

            <h1
              className="text-[44px] text-black leading-[1.02] tracking-[-0.02em] uppercase mb-5"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              {product.name}
            </h1>

            <div className="flex items-end justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] text-black font-bold tracking-tight tabular-nums">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[12px] text-black/40 line-through tabular-nums">$18.50</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} size={14} className="fill-[#eab308] text-[#eab308]" />
                  ))}
                  <div className="relative">
                    <Star size={14} className="text-[#eab308]" />
                    <div className="absolute inset-0 overflow-hidden w-1/2">
                      <Star size={14} className="fill-[#eab308] text-[#eab308]" />
                    </div>
                  </div>
                  <button className="ml-2 text-[13px] font-medium text-black/60 hover:underline">
                    2,830 Reviews
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider">In Stock & Ready to ship</span>
                </div>
              </div>
            </div>

            <p className="text-[14px] text-black/60 leading-[1.7] max-w-[520px] mb-6">
              {product.description}
            </p>

            <div className="h-px bg-black/10 mb-6" />

            {/* TECHNIQUE */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-black">
                  Technique
                </span>
                <button className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fa5d42] hover:underline">
                  File guidelines
                </button>
              </div>
              <div className="flex gap-2">
                {["printing", "embroidery"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTechnique(t as any)}
                    className={`flex-1 h-12 rounded-xl text-[13px] font-bold capitalize tracking-wide transition-all border ${
                      technique === t
                        ? "bg-black border-black text-white shadow-lg shadow-black/10"
                        : "bg-white border-black/10 text-black/60 hover:border-black/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {technique === "embroidery" && (
              <div className="mb-8 p-5 bg-[#f8f8f8] rounded-2xl border border-black/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">
                    Embroidery color option
                  </span>
                  <button className="text-[10px] font-bold text-[#fa5d42] hover:underline">
                    Which to choose?
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { id: "standard", label: "Standard", desc: "Solid colors, classic finish" },
                    { id: "plus", label: "Unlimited color", desc: "Full spectrum gradients", extra: "+$3.95" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setEmbroideryOption(opt.id as any)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                        embroideryOption === opt.id
                          ? "bg-white border-black shadow-sm"
                          : "bg-transparent border-black/5 hover:border-black/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-4 rounded-full border-2 flex items-center justify-center ${
                          embroideryOption === opt.id ? "border-black" : "border-black/20"
                        }`}>
                          {embroideryOption === opt.id && <div className="size-2 rounded-full bg-black" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-black">{opt.label} {opt.extra && <span className="text-[#fa5d42] ml-1">{opt.extra}</span>}</p>
                          <p className="text-[11px] text-black/40 font-medium">{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* COLOR */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-black">
                Color
              </span>
              <span className="text-[10px] text-black/40 font-medium uppercase tracking-wider">
                {selectedColor}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-8">
              {product.colors.map((color) => {
                const isActive = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    title={`${color.name}`}
                    className={`relative aspect-square rounded-full overflow-hidden transition-all duration-200 p-1 ${
                      isActive
                        ? "ring-2 ring-black"
                        : "border border-black/10 hover:border-black"
                    }`}
                  >
                    <span className="block w-full h-full rounded-full" style={{ backgroundColor: color.hex }} />
                  </button>
                );
              })}
            </div>

            {/* SIZE */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-black">
                Size
              </span>
              <button
                onClick={() => setShowSizeChart(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:text-[#fa5d42] transition-colors"
              >
                <Ruler size={12} strokeWidth={2} />
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-8">
              {product.sizes.map((size) => {
                const isActive = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 text-[13px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center border ${
                      isActive
                        ? "bg-black border-black text-white"
                        : "bg-white border-black/15 text-black hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* PRICE & SHIPPING CARDS */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 bg-[#f8f8f8] rounded-2xl border border-black/5">
                <div className="flex justify-between items-start mb-4">
                   <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/60">Price</p>
                   <span className="text-[#fa5d42] font-black">*</span>
                </div>
                <p className="text-[24px] font-bold text-black leading-none mb-2">{formatPrice(product.price * (technique === "embroidery" && embroideryOption === "plus" ? 1.4 : 1))}</p>
                <p className="text-[10px] text-black/40 font-medium">One placement included</p>
              </div>
              <div className="p-4 bg-[#f8f8f8] rounded-2xl border border-black/5">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black/60 mb-4">Shipping starts at</p>
                <p className="text-[24px] font-bold text-black leading-none mb-2">$11.99</p>
              </div>
            </div>

            {/* DIGITIZATION ACCORDION */}
            <div className="mb-4">
              <div className="p-4 bg-[#f8f8f8] rounded-2xl border border-black/5 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold">Digitization fee:</span>
                  <span className="text-[13px] text-black/60">See the pricing</span>
                </div>
                <Plus size={14} className="group-hover:rotate-45 transition-transform" />
              </div>
            </div>

            {/* BULK CALCULATOR */}
            <div className="mb-6 bg-[#f8f8f8] rounded-2xl border border-black/5 overflow-hidden">
              <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.1em]">Bulk price calculator</span>
                <span className="text-[12px] text-black/40 font-medium">{bulkCount} items</span>
              </div>
              <div className="p-4 py-6">
                <input 
                  type="range" 
                  min="1" 
                  max="500" 
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black mb-6"
                />
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-black/40 font-bold uppercase tracking-wider">Discounted price</span>
                    <span className="text-[18px] font-bold text-black">{formatPrice(product.price * 0.92)}</span>
                  </div>
                  <div className="px-3 py-1 bg-black text-white rounded-full text-[11px] font-black">
                    8% OFF
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-black/50 leading-relaxed italic">
                  Order any 25+ embroidery items and we’ll digitize all the design files in that order for free.
                </p>
              </div>
            </div>

            {/* ADD TO CART ACTION */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={() => navigate("/customize?id=" + product.id)}
                className="w-full bg-[#fa5d42] text-white flex items-center justify-center gap-3 px-8 text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-black active:scale-[0.99] transition-all h-[64px] rounded-2xl shadow-xl shadow-[#fa5d42]/20"
              >
                Start Designing
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddToCart}
                  className="h-14 rounded-xl border border-black/10 text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} />
                  Quick add
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`h-14 rounded-xl border flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
                    wishlisted
                      ? "border-[#fa5d42] bg-[#fa5d42]/5 text-[#fa5d42]"
                      : "border-black/10 text-black/60 hover:border-black hover:text-black"
                  }`}
                >
                  <Heart size={14} className={wishlisted ? "fill-[#fa5d42]" : ""} />
                  {wishlisted ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* LATEST ORDER */}
            <div className="mb-6 p-4 bg-[#f8f8f8] rounded-2xl border border-black/5 flex items-center gap-4">
              <div className="size-10 rounded-full bg-black/5 flex items-center justify-center overflow-hidden border border-black/5">
                <img src="/static/images/layout/lord.png" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-black">Latest order from Hyderabad, IN</p>
                <p className="text-[11px] text-black/40 font-medium">9 hours ago</p>
              </div>
            </div>

            <p className="text-[11px] text-black/40 leading-relaxed mb-8">
              <span className="text-[#fa5d42] font-black">*</span> Price varies depending on the production technique, print placement, product color and size, taxes, and shipping. See <button className="text-[#fa5d42] font-bold hover:underline">detailed info</button>
            </p>

            {/* Share */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40">
                Share
              </span>
              <div className="flex items-center gap-1">
                {[
                  { icon: <Facebook size={13} strokeWidth={1.8} />, label: "Facebook" },
                  { icon: <Twitter size={13} strokeWidth={1.8} />, label: "Twitter" },
                  { icon: <Mail size={13} strokeWidth={1.8} />, label: "Email" },
                  { icon: <Share2 size={13} strokeWidth={1.8} />, label: "Copy link" },
                ].map((s) => (
                  <button
                    key={s.label}
                    title={s.label}
                    className="size-9 flex items-center justify-center border border-black/10 text-black/50 hover:bg-black hover:text-white hover:border-black transition-all"
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Reassurance */}
            <div className="grid grid-cols-3 border-y border-black/10 py-5 mb-8">
              {[
                { icon: <Truck size={20} strokeWidth={1.3} />, label: "Free shipping $100+" },
                { icon: <RotateCcw size={20} strokeWidth={1.3} />, label: "30-day returns" },
                { icon: <ShieldCheck size={20} strokeWidth={1.3} />, label: "Secure checkout" },
              ].map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-2 text-center px-2">
                  <div className="text-black/70">{r.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60">
                    {r.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Spec strip */}
            <div className="grid grid-cols-3 border-y border-black/10 divide-x divide-black/10 mb-8">
              {[
                { label: "Fabric", value: `${product.gsm} GSM` },
                { label: "Fit", value: product.fit },
                { label: "Neck", value: product.neck },
              ].map((item) => (
                <div
                  key={item.label}
                  className="py-4 px-3 flex flex-col items-center gap-1 text-center"
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-black/40">
                    {item.label}
                  </span>
                  <span className="text-[14px] font-bold text-black">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Accordion */}
            <div className="flex flex-col border-t border-black/10">
              {faqItems.map((faq) => {
                const isOpen = openFaq === faq.title;
                return (
                  <div key={faq.title} className="border-b border-black/10">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.title)}
                      className="flex items-center justify-between w-full py-5 group"
                    >
                      <span className="text-[12px] font-bold uppercase tracking-[0.25em] text-black text-left">
                        {faq.title}
                      </span>
                      <div
                        className={`size-5 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      >
                        <PlusIcon
                          size={16}
                          strokeWidth={2}
                          className="text-black/60 group-hover:text-black"
                        />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-5">{faq.content}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <CouponSection />
          <ProductSpecs />
          <ProductTabs />
        </div>

        {/* SHOP SIMILAR */}
        <section className="mt-24">
          <div className="flex items-end justify-between mb-8">
            <h3
              className="text-[32px] text-black"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              You may also like
            </h3>
            <button
              onClick={() => navigate("/shop")}
              className="text-[12px] font-bold uppercase tracking-[0.25em] text-black/60 hover:text-black transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3 mb-12">
            {similarProducts.map((p) => (
              <div
                key={p.id}
                className="cursor-pointer group"
                onClick={() => navigate(`/product?id=${p.id}`)}
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden mb-[9px] bg-[#f5f5f5]">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[14px] text-black tracking-tight leading-snug mb-1 font-medium">
                  {p.name}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] text-black font-bold tabular-nums">
                    {formatPrice(p.price)}
                  </span>
                  <div className="flex items-center gap-1">
                    {p.colors.slice(0, 4).map((c) => (
                      <span
                        key={c.name}
                        title={c.name}
                        className="size-3 rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    {p.colors.length > 4 && (
                      <span className="text-[10px] text-black/50 font-medium ml-0.5">
                        +{p.colors.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />

      {/* SIZE CHART MODAL */}
      {showSizeChart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            onClick={() => setShowSizeChart(false)}
          />
          <div className="relative w-full max-w-[460px] bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden font-sans">
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-6 right-6 size-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-all duration-200 z-10"
              aria-label="Close modal"
            >
              <X size={20} strokeWidth={1.5} className="text-black/40" />
            </button>

            <div className="p-10 pt-12">
              <div className="text-center mb-10">
                <h3
                  className="text-[24px] font-semibold text-black tracking-tight mb-2"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Size Guide
                </h3>
                <p className="text-[14px] text-black/40 font-medium tracking-wide uppercase">
                  Measurements in inches
                </p>
              </div>

              <div className="flex flex-col">
                <div className="grid grid-cols-3 pb-6 border-b border-[#f4f4f4] text-[11px] font-bold uppercase tracking-[0.2em] text-black/30">
                  <span className="pl-4">Size</span>
                  <span className="text-center">Chest</span>
                  <span className="text-right pr-4">Length</span>
                </div>

                <div className="pt-2">
                  {product.sizeChart.map((row) => (
                    <div
                      key={row.size}
                      className="grid grid-cols-3 py-5 px-4 text-[15px] font-semibold text-black hover:bg-[#fcfcfc] transition-colors rounded-2xl group"
                    >
                      <span className="text-black/40 group-hover:text-black transition-colors">
                        {row.size}
                      </span>
                      <span className="text-center">{row.chest}"</span>
                      <span className="text-right">{row.length}"</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-[#f4f4f4]">
                <p className="text-[12px] text-black/30 leading-relaxed text-center font-medium max-w-[320px] mx-auto">
                  Standard industry tolerance of +/- 0.5" applies. Measure a
                  favorite tee flat for comparison.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
