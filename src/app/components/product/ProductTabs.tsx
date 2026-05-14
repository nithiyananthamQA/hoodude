import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus } from "lucide-react";

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
            className={`px-5 py-2.5 rounded-xl text-[12px] font-semibold uppercase tracking-widest transition-all ${
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              "Submit files in PNG or JPEG format at 150 DPI minimum.",
              "Use the sRGB color profile for maximum accuracy.",
              "Delete guide layers from templates before saving.",
            ].map((text, i) => (
              <div key={i} className="flex flex-col gap-4 border-t border-black/15 pt-6">
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-black/40 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[14px] leading-relaxed text-black/70">{text}</p>
              </div>
            ))}
          </div>

          {tech === "Embroidery" && (
            <>
              <div className="flex flex-col gap-8">
                <h3 className="text-2xl font-semibold tracking-tight">Placement Guidelines</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className="py-4 text-[11px] font-semibold tracking-widest uppercase text-black/40">Placement</th>
                        <th className="py-4 text-[11px] font-semibold tracking-widest uppercase text-black/40">Sizes</th>
                        <th className="py-4 text-[11px] font-semibold tracking-widest uppercase text-black/40">File Size</th>
                        <th className="py-4 text-[11px] font-semibold tracking-widest uppercase text-black/40 text-right">Template</th>
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
                            <button className="text-[11px] font-semibold text-brand uppercase tracking-widest hover:underline">Download</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="flex flex-col gap-8">
                  <h3 className="text-2xl font-semibold tracking-tight">Standard vs Unlimited</h3>
                  <div className="flex flex-col gap-6 text-[14px] text-black/60 leading-relaxed">
                    <p>
                      <strong className="text-black">Standard color embroidery</strong> — choose from 15 thread colors, combine up to 6 within a single design.
                    </p>
                    <p>
                      <strong className="text-black">Unlimited embroidery</strong> — thread can transform into nearly any color except metallic and neon. Multi-color, gradient, or solid-color designs with no limits.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <h3 className="text-2xl font-semibold tracking-tight">Available thread colors</h3>
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
                              <span className="text-[11px] font-semibold text-black uppercase tracking-tight">{color.n}</span>
                              <span className="text-[10px] text-black/30 font-mono">{color.h}</span>
                           </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-8">
            <h3 className="text-2xl font-semibold tracking-tight">Tutorial Videos</h3>
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
                  <h4 className="text-[13px] font-semibold text-black uppercase tracking-tight">{video.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState("Description");
  const tabs = ["Description", "Shipping", "File guidelines"];

  return (
    <div className="mt-10 border-t border-black/5 pt-8">
      <div className="flex items-center gap-6 mb-6 overflow-x-auto no-scrollbar pb-1 border-b border-black/5">
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[12px] font-medium uppercase tracking-[0.15em] transition-colors relative shrink-0 ${
                isActive ? "text-black" : "text-black/40 hover:text-black/60"
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

              <div className="p-6 bg-[#f5f5f5] rounded-2xl border border-black/5">
                <div className="flex flex-col gap-6">
                   <div>
                    <h5 className="text-[12px] font-semibold uppercase tracking-widest text-brand mb-3">Environmental qualities</h5>
                    <div className="space-y-2 text-[13px] text-black/60">
                      <p>• Knitting: Honduras, Dominican Republic</p>
                      <p>• Dyeing: Honduras, Dominican Republic</p>
                      <p>• Manufacturing: Nicaragua, Honduras, Haiti, El Salvador, or DR</p>
                      <p>• Contains 0% recycled polyester</p>
                    </div>
                  </div>
                  <div className="h-px bg-black/5" />
                  <div>
                    <h5 className="text-[12px] font-semibold uppercase tracking-widest text-black/40 mb-3">EU GPSR-related info</h5>
                    <div className="text-[11px] text-black/50 space-y-1">
                      <p>Manufacturer: Printful</p>
                      <p>Address: Raina bulvaris 25, Riga, Latvia, LV-1050</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <h4 className="text-[10px] font-medium text-black/40 mb-5 uppercase tracking-[0.22em]">Care</h4>
                <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-[13px] text-black/70">
                  {[
                    "Wash cold, inside-out",
                    "Tumble dry low",
                    "Cool iron, inside-out",
                    "Do not dry clean",
                  ].map(text => (
                    <li key={text} className="border-t border-black/10 pt-3">{text}</li>
                  ))}
                </ul>
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
                  <h5 className="text-[12px] font-semibold uppercase tracking-widest text-black/40">Select your location</h5>
                </div>
                <div className="relative max-w-[320px]">
                  <button className="w-full h-14 px-5 bg-[#f5f5f5] border border-black/5 rounded-2xl flex items-center justify-between group hover:border-black/20 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <img src="https://flagcdn.com/in.svg" alt="India" className="h-4 rounded-[2px]" />
                      <span className="text-[14px] font-semibold text-black uppercase tracking-tight">India</span>
                    </div>
                    <Check size={18} className="text-brand" strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="py-4 text-[11px] font-semibold uppercase tracking-widest text-black/40">Country / Region</th>
                      <th className="py-4 text-[11px] font-semibold uppercase tracking-widest text-black/40">Delivery Time</th>
                      <th className="py-4 text-[11px] font-semibold uppercase tracking-widest text-black/40 text-right">First Item</th>
                      <th className="py-4 text-[11px] font-semibold uppercase tracking-widest text-black/40 text-right">Next Item</th>
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
                        <td className="py-5 text-[14px] font-semibold text-black text-right">{rate.first}</td>
                        <td className="py-5 text-[14px] font-semibold text-black text-right">{rate.next}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-8 p-6 bg-black/[0.02] rounded-2xl flex items-start gap-4">
                <div className="size-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-semibold">!</span>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
