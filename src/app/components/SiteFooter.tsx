import { useNavigate } from "react-router";
import { Instagram, Facebook, Twitter, Send } from "lucide-react";
import { useState } from "react";
import { NAV_CATEGORIES, categoryHref } from "../utils/nav";
import { subscribeNewsletter } from "../utils/api";

export default function SiteFooter() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const columns = [
    {
      title: "Shop",
      links: [
        { label: "New Arrivals", to: "/shop" },
        ...NAV_CATEGORIES.map((c) => ({ label: c, to: categoryHref(c) })),
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Shipping", to: "/shipping" },
        { label: "Returns", to: "/returns" },
        { label: "Size Guide", to: "/size-guide" },
        { label: "Contact", to: "/contact" },
        { label: "FAQ", to: "/faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", to: "/about" },
        { label: "Sustainability", to: "/sustainability" },
        { label: "Careers", to: "/careers" },
        { label: "Press", to: "/press" },
        { label: "Wholesale", to: "/wholesale" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", to: "/privacy" },
        { label: "Terms", to: "/terms" },
        { label: "Cookies", to: "/cookies" },
        { label: "Accessibility", to: "/accessibility" },
      ],
    },
  ];

  return (
    <footer
      className="bg-ink text-white"
     
    >
      <div className="px-8 md:px-16 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_2.2fr_1fr] gap-12 mb-16">
          <div>
            <h2 className="text-h2 font-semibold leading-none tracking-tight mb-5">
              HOODUDE
            </h2>
            <p className="text-[14px] text-white/60 leading-relaxed max-w-[320px]">
              Streetwear essentials, made to live in.
            </p>
            <div className="flex items-center gap-2 mt-6">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  aria-label="Social"
                  className="size-10 border border-white/15 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                >
                  <Icon size={16} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 mb-4">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => navigate(link.to)}
                        className="text-[13px] text-white/80 hover:text-white transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 mb-4">
              Notebook
            </h4>
            <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
              New drops and field notes. Twice a month, never spam.
            </p>
            {subscribed ? (
              <p className="text-[13px] text-white/80">
                ✓ You're on the list. Check your inbox.
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const trimmed = email.trim();
                  if (!trimmed || subscribing) return;
                  setSubscribing(true);
                  setSubscribeError(null);
                  const res = await subscribeNewsletter(trimmed);
                  setSubscribing(false);
                  if (res.ok) {
                    setSubscribed(true);
                    setEmail("");
                  } else {
                    setSubscribeError(res.error ?? "Subscription failed. Try again.");
                  }
                }}
                className="flex items-stretch border border-white/15 rounded-full overflow-hidden focus-within:border-white/40 transition-colors"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  disabled={subscribing}
                  className="flex-1 bg-transparent px-4 py-2.5 text-[13px] outline-none placeholder:text-white/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  disabled={subscribing}
                  className="px-4 bg-white text-black hover:bg-brand hover:text-white transition-colors disabled:opacity-60"
                >
                  <Send size={14} strokeWidth={2} />
                </button>
              </form>
            )}
            {subscribeError && !subscribed && (
              <p className="text-[12px] text-brand mt-2" role="alert">
                {subscribeError}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-10 border-t border-white/10 text-[12px] text-white/40">
          <span>© {new Date().getFullYear()} Hoodude. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Ships worldwide · Secure payments · 30-day returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
