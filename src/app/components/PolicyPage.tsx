import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, ChevronLeft, Mail, MessageCircle, Truck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

interface PolicyPageProps {
  onOpenCart: () => void;
  slug:
    | "about"
    | "shipping"
    | "returns"
    | "privacy"
    | "terms"
    | "contact"
    | "faq"
    | "size-guide"
    | "sustainability"
    | "cookies"
    | "accessibility"
    | "careers"
    | "press"
    | "wholesale";
}

interface Section {
  heading: string;
  body: string | React.ReactNode;
}

const PAGES: Record<
  PolicyPageProps["slug"],
  { eyebrow: string; title: string; lead: string; sections: Section[] }
> = {
  about: {
    eyebrow: "About Hoodude",
    title: "Built on better basics.",
    lead: "Hoodude is a modern wardrobe label making the pieces you actually live in — heavier cottons, cleaner fits, and a price that reflects what it costs to make them, not what a mall wants to charge you.",
    sections: [
      {
        heading: "Our story",
        body: "Hoodude started in 2025 with a single hoodie pattern and a question: why does everything good cost triple? We cut out the retail markup, work directly with audited factories, and ship our drops straight to you. One house, one standard, worldwide.",
      },
      {
        heading: "The way we make things",
        body: "Every piece is cut in small batches — we'd rather sell out than overproduce. Our fabrics are bio-washed and pre-shrunk so the fit you get is the fit you keep. We dye with low-impact formulas and ship in recycled, compostable packaging.",
      },
      {
        heading: "What we stand for",
        body: "1% of every order goes to textile waste recycling. We publish our factory list annually. And we'll always replace anything that fails you — even years later.",
      },
    ],
  },
  shipping: {
    eyebrow: "Shipping",
    title: "Fast, tracked, and carbon-neutral.",
    lead: "Free standard shipping on all orders over $100. Every parcel is tracked end-to-end and offset at dispatch.",
    sections: [
      {
        heading: "Delivery windows",
        body: "Domestic orders arrive in 3–5 business days with standard shipping or 1–2 days with express. International orders ship within 24 hours and typically arrive in 7–14 business days depending on destination and customs.",
      },
      {
        heading: "Rates",
        body: "Standard: $8 (free over $100). Express: $18. International: calculated at checkout by destination and weight. Taxes and duties for international orders are shown before you pay — no customs surprises.",
      },
      {
        heading: "Tracking",
        body: "You'll get a tracking link the moment your order leaves the warehouse. If anything looks off, reply to the email and we'll sort it.",
      },
    ],
  },
  returns: {
    eyebrow: "Returns & exchanges",
    title: "30 days, no questions.",
    lead: "If something doesn't fit or feel right, send it back within 30 days. Returns are free on domestic orders; exchanges are always free.",
    sections: [
      {
        heading: "How to return",
        body: "Start a return from your order page — pick the items, print the prepaid label, drop it at any carrier point. We refund to your original payment method within 48 hours of receipt.",
      },
      {
        heading: "Conditions",
        body: "Items must be unworn, unwashed, with original tags attached. Underwear and final-sale items (marked on the product page) are not returnable for hygiene reasons.",
      },
      {
        heading: "Exchanges",
        body: "Pick the new size or color at return start — we dispatch the replacement the same day we receive yours, free of charge. No restock fees, ever.",
      },
    ],
  },
  privacy: {
    eyebrow: "Privacy policy",
    title: "What we collect, why, and how to delete it.",
    lead: "We keep only what we need to ship your order and improve the experience. No shady resale. No dark patterns. Here's the full picture.",
    sections: [
      {
        heading: "What we collect",
        body: "Email, name, shipping address, and the products you browse or buy. If you pay by card, the processor handles the number — we never see or store it.",
      },
      {
        heading: "How we use it",
        body: "To fulfil orders, send transactional emails, and (if you opt in) send you news about new drops. We use aggregated analytics to improve the site — never sold, never shared with third parties for marketing.",
      },
      {
        heading: "Your rights",
        body: "You can download or delete your data any time by emailing privacy@hoodude.store. We respond within 30 days. If you live in the EU/UK, you have full GDPR rights; in California, full CCPA rights.",
      },
    ],
  },
  terms: {
    eyebrow: "Terms of service",
    title: "The agreement between us.",
    lead: "Plain English. No lawyer traps. These are the terms you accept when you shop with Hoodude.",
    sections: [
      {
        heading: "Orders",
        body: "When you place an order, you're making an offer to buy. We confirm acceptance when we ship. Prices may change, but once you've paid, your price is locked.",
      },
      {
        heading: "Payments",
        body: "We accept major cards, PayPal, and Apple/Google Pay. You authorize us to charge the full amount — including shipping and any applicable taxes — when you hit place order.",
      },
      {
        heading: "Intellectual property",
        body: "Hoodude, the logo, product imagery, and copy are owned by us. You can share them socially with credit. Please don't copy our designs or resell our product without permission.",
      },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Real humans, fast replies.",
    lead: "Our support team is based in-house. Average reply time is under 6 hours, Mon–Fri.",
    sections: [
      {
        heading: "Support",
        body: (
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-3">
              <Mail size={16} className="text-[#fa5d42]" />
              <a href="mailto:help@hoodude.store" className="underline">
                help@hoodude.store
              </a>
            </span>
            <span className="flex items-center gap-3">
              <MessageCircle size={16} className="text-[#fa5d42]" />
              Live chat — bottom right, Mon–Fri 9am–6pm GMT
            </span>
            <span className="flex items-center gap-3">
              <Truck size={16} className="text-[#fa5d42]" />
              Order help via the email receipt — fastest route
            </span>
          </div>
        ),
      },
      {
        heading: "Wholesale & press",
        body: "For wholesale enquiries email wholesale@hoodude.store. For press or partnerships, press@hoodude.store.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Quick answers.",
    lead: "Here are the things we get asked most. Still stuck? Email help@hoodude.store.",
    sections: [
      { heading: "How long does shipping take?", body: "3–5 business days domestic, 7–14 days international." },
      { heading: "Do you ship internationally?", body: "Yes, to 40+ countries. Rates shown at checkout." },
      { heading: "Can I change my order after placing it?", body: "Yes, if we haven't dispatched it. Reply to your confirmation email asap." },
      { heading: "Do you restock sold-out items?", body: "Best-sellers are restocked roughly every 6 weeks. Add yourself to the waitlist on the product page." },
      { heading: "What is your fit like?", body: "True to size with a modern cut. Detailed size tables are on every product page." },
    ],
  },
  "size-guide": {
    eyebrow: "Size guide",
    title: "Find your fit.",
    lead: "Every product page has a fit-specific chart. The numbers below are measured flat across the garment in inches.",
    sections: [
      {
        heading: "How to measure",
        body: "Lay a favorite tee flat. Measure the chest pit-to-pit and the length from shoulder seam to hem. Compare to the chart on the product page — pick the size whose chest is 1–2\" larger than yours for a regular fit, 3–4\" for oversized.",
      },
      {
        heading: "Still unsure?",
        body: "Email help@hoodude.store with your usual size in another brand — we'll recommend the best match. Exchanges are always free.",
      },
    ],
  },
  sustainability: {
    eyebrow: "Sustainability",
    title: "Better by default, not by marketing.",
    lead: "We don't call ourselves sustainable — we just try to do less harm. Here's what that looks like in practice.",
    sections: [
      {
        heading: "Materials",
        body: "Bio-washed cotton, recycled poly blends, and wool certified by the Responsible Wool Standard. Every fabric has a spec sheet we can share on request.",
      },
      {
        heading: "Factories",
        body: "We publish our factory list. Each one is SA8000 audited. Workers are paid above regional minimums and we visit at least twice a year.",
      },
      {
        heading: "Packaging",
        body: "Recycled, LDPE-free mailers. Hang-tags are seed paper — plant them. Our returns paper is 100% post-consumer recycled.",
      },
    ],
  },
  cookies: {
    eyebrow: "Cookies",
    title: "What we store in your browser.",
    lead: "We use cookies for three things: keeping you signed in, remembering your cart, and understanding how the site is used.",
    sections: [
      {
        heading: "Essential",
        body: "Session, cart, and authentication. You can't turn these off — the site wouldn't work.",
      },
      {
        heading: "Analytics",
        body: "We use first-party analytics to measure site performance. No personally identifiable data leaves our servers. You can opt out in the cookie banner.",
      },
      {
        heading: "Marketing",
        body: "Off by default. Only turned on if you opt in. We don't sell data to third parties under any circumstance.",
      },
    ],
  },
  accessibility: {
    eyebrow: "Accessibility",
    title: "Designed to be usable by everyone.",
    lead: "We follow WCAG 2.2 AA. If anything stops you getting something done here, tell us — we fix accessibility bugs ahead of everything else.",
    sections: [
      {
        heading: "Our commitment",
        body: "Every page is audited quarterly against WCAG 2.2 AA. Our components are keyboard-navigable, screen-reader labeled, and meet minimum color contrast.",
      },
      {
        heading: "Report an issue",
        body: "Email accessibility@hoodude.store with the page URL and what broke. We target a fix within 14 days for critical issues.",
      },
    ],
  },
  careers: {
    eyebrow: "Careers",
    title: "Work where the work speaks.",
    lead: "We're a small, remote-first team hiring in design, operations, and community. No ping-pong tables — just real work, real autonomy.",
    sections: [
      {
        heading: "Open roles",
        body: "Senior Product Designer (Remote, EU/UK) · Operations Lead (London) · Community Manager (Remote). Apply at jobs@hoodude.store.",
      },
      {
        heading: "What we offer",
        body: "Transparent salary bands. 30 days PTO. Health cover. Equity from day one. Four-day work week in trial for 2026.",
      },
    ],
  },
  press: {
    eyebrow: "Press",
    title: "Brand assets & editorial.",
    lead: "Logos, lookbook imagery, and founder quotes are available on request. Usage permitted with attribution.",
    sections: [
      {
        heading: "Downloads",
        body: "Email press@hoodude.store with your publication and deadline. We reply with a branded media kit the same day.",
      },
    ],
  },
  wholesale: {
    eyebrow: "Wholesale",
    title: "Stock Hoodude in your store.",
    lead: "We work with boutiques, concept stores, and hotel retail partners globally. Minimums are deliberately low to support independent shops.",
    sections: [
      {
        heading: "Apply",
        body: "Email wholesale@hoodude.store with your store name, location, and website. We reply within three business days with our linesheet and terms.",
      },
    ],
  },
};

export default function PolicyPage({ onOpenCart, slug }: PolicyPageProps) {
  const navigate = useNavigate();
  const page = PAGES[slug];
  const isFaq = slug === "faq";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <SiteHeader onOpenCart={onOpenCart} />

      <div className="max-w-[820px] mx-auto px-8 pt-12 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[12px] text-black/50 hover:text-black mb-8 font-medium"
        >
          <ChevronLeft size={14} /> Back
        </button>

        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#fa5d42] mb-4 block">
          {page.eyebrow}
        </span>
        <h1
          className="text-[44px] md:text-[56px] leading-[1.02] tracking-tight mb-6"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
        >
          {page.title}
        </h1>
        <p className="text-[16px] text-black/70 leading-relaxed max-w-[640px] mb-12 pb-12 border-b border-black/10">
          {page.lead}
        </p>

        {isFaq ? (
          <div className="flex flex-col">
            {page.sections.map((s, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="border-b border-black/10">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex items-center justify-between w-full py-5 text-left"
                  >
                    <span className="text-[16px] font-bold">{s.heading}</span>
                    <div
                      className={`size-6 flex items-center justify-center transition-transform ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      <Plus size={18} />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 text-[14px] text-black/70 leading-relaxed">
                          {s.body}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {page.sections.map((s, i) => (
              <section key={i}>
                <h2
                  className="text-[22px] mb-4 tracking-tight"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                >
                  {s.heading}
                </h2>
                <div className="text-[15px] text-black/70 leading-[1.8]">{s.body}</div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-16 pt-10 border-t border-black/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-[13px] text-black/60">
            Still have a question? We reply in under 6 hours.
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="bg-black text-white h-11 px-6 rounded-full text-[13px] font-bold hover:bg-[#fa5d42] transition-colors"
          >
            Contact support →
          </button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
