// Section header is a hairline + uppercase eyebrow + section title. No icons —
// borrowed glyphs (and the third-party CDNs they live on) are the fastest way
// to look like a Shopify template.
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-black/10">
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-black/40">
        {eyebrow}
      </span>
      <h4 className="text-[17px] font-semibold text-black tracking-tight">{title}</h4>
    </div>
  );
}

export default function ProductSpecs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-14 border-t border-black/5">
      <div className="flex flex-col gap-6">
        <SectionHeader eyebrow="01" title="Customization" />
        <div className="flex flex-col gap-5">
          <div>
            <h5 className="text-[13px] font-medium uppercase tracking-[0.12em] text-black/45 mb-3">DTFlex print</h5>
            <ul className="flex flex-col gap-1.5 text-[14px] text-black/70">
              {["Front print", "Back print", "Inside label", "Sleeve top"].map(label => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[13px] font-medium uppercase tracking-[0.12em] text-black/45 mb-3">Embroidery</h5>
            <ul className="flex flex-col gap-1.5 text-[14px] text-black/70">
              {["Left chest", "Center chest", "Large center", "Sleeve top"].map(label => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SectionHeader eyebrow="02" title="Style and fit" />
        <div className="flex flex-col gap-5">
          {[
            { t: "Streetwear look", d: "Heavyweight fabric gives it a structured look, perfect for streetwear outfits." },
            { t: "Regular fit", d: "Standard length, the fabric easily gives into movement." },
            { t: "Tubular", d: "Constructed from a single piece of cloth — no side seams." },
          ].map(item => (
            <div key={item.t}>
              <h5 className="text-[14px] font-semibold text-black mb-1">{item.t}</h5>
              <p className="text-[13px] text-black/55 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SectionHeader eyebrow="03" title="Material" />
        <div className="flex flex-col gap-6">
          <div>
            <h5 className="text-[13px] font-medium uppercase tracking-[0.12em] text-black/45 mb-3">Fabric thickness</h5>
            <div className="h-px bg-black/10 relative mb-2">
              <div className="absolute inset-y-0 left-0 bg-black w-[80%]" />
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-black/40">
              <span>Lightweight</span>
              <span>Heavyweight</span>
            </div>
          </div>
          <div>
            <h5 className="text-[13px] font-medium uppercase tracking-[0.12em] text-black/45 mb-3">Softness scale</h5>
            <div className="h-px bg-black/10 relative mb-2">
              <div className="absolute inset-y-0 left-0 bg-black w-[40%]" />
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-black/40">
              <span>Rough</span>
              <span>Extra soft</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SectionHeader eyebrow="04" title="Features" />
        <div>
          <h5 className="text-[14px] font-semibold text-black mb-1">Tear-away tag</h5>
          <p className="text-[13px] text-black/55 leading-relaxed">
            Easily removable tear-away tag that lets you add a custom inside label for your brand.
          </p>
        </div>
      </div>
    </div>
  );
}
