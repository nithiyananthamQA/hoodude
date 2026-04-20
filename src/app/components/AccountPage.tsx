import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { User as UserIcon, Package, MapPin, Heart, LogOut, ChevronRight } from "lucide-react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useAuth } from "../store/AuthContext";
import { useWishlist } from "../store/WishlistContext";
import { formatPrice } from "../utils/currency";

interface AccountPageProps {
  onOpenCart: () => void;
}

type Tab = "orders" | "profile" | "addresses" | "wishlist";

export default function AccountPage({ onOpenCart }: AccountPageProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const mockOrders = [
    {
      id: "HD-A39B21",
      date: "Apr 12, 2026",
      status: "Delivered",
      total: 670,
      items: 3,
    },
    {
      id: "HD-9C72F0",
      date: "Mar 28, 2026",
      status: "In transit",
      total: 245,
      items: 1,
    },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <SiteHeader onOpenCart={onOpenCart} />

      <div className="max-w-[1080px] mx-auto px-8 pt-12 pb-24">
        <div className="flex items-center gap-5 mb-10">
          <div className="size-16 rounded-full bg-black text-white flex items-center justify-center text-[24px] font-bold">
            {user.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1
              className="text-[32px] tracking-tight leading-none"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Hi, {user.name.split(" ")[0]}.
            </h1>
            <p className="text-[13px] text-black/60 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-10">
          <aside className="flex flex-col gap-1 text-[13px]">
            {[
              { id: "orders", label: "Orders", icon: <Package size={15} /> },
              { id: "profile", label: "Profile", icon: <UserIcon size={15} /> },
              { id: "addresses", label: "Addresses", icon: <MapPin size={15} /> },
              { id: "wishlist", label: "Wishlist", icon: <Heart size={15} /> },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`flex items-center justify-between px-4 h-11 rounded-lg transition-colors ${
                    active ? "bg-black text-white" : "text-black/70 hover:bg-black/5"
                  }`}
                >
                  <span className="flex items-center gap-3 font-medium">
                    {t.icon}
                    {t.label}
                  </span>
                  {t.id === "wishlist" && wishlistIds.length > 0 && (
                    <span className={`text-[11px] font-bold ${active ? "text-white" : "text-[#fa5d42]"}`}>
                      {wishlistIds.length}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => {
                signOut();
                navigate("/");
              }}
              className="flex items-center gap-3 px-4 h-11 rounded-lg text-black/70 hover:bg-black/5 mt-4 text-[13px] font-medium"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </aside>

          <section>
            {tab === "orders" && (
              <div>
                <h2
                  className="text-[24px] mb-6"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                >
                  Orders
                </h2>
                <div className="flex flex-col gap-3">
                  {mockOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between border border-black/10 rounded-2xl p-5 hover:border-black transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-bold text-black/50 uppercase tracking-wider">
                          {o.id}
                        </span>
                        <span className="text-[15px] font-bold">
                          {o.items} {o.items === 1 ? "item" : "items"} · {formatPrice(o.total)}
                        </span>
                        <span className="text-[12px] text-black/50">{o.date}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                            o.status === "Delivered"
                              ? "bg-green-50 text-green-700"
                              : "bg-[#fa5d42]/10 text-[#fa5d42]"
                          }`}
                        >
                          {o.status}
                        </span>
                        <ChevronRight size={16} className="text-black/40" />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate("/shop")}
                    className="text-center text-[13px] font-bold text-black/60 hover:text-black mt-4 h-12 border border-dashed border-black/15 rounded-xl hover:border-black transition-colors"
                  >
                    Shop new arrivals →
                  </button>
                </div>
              </div>
            )}

            {tab === "profile" && (
              <div>
                <h2
                  className="text-[24px] mb-6"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                >
                  Profile
                </h2>
                <div className="border border-black/10 rounded-2xl p-6 flex flex-col gap-5">
                  <Row label="Name" value={user.name} />
                  <Row label="Email" value={user.email} />
                  <Row label="Member since" value="April 2026" />
                  <button className="self-start text-[12px] font-bold uppercase tracking-[0.25em] text-black/60 hover:text-black">
                    Edit profile
                  </button>
                </div>
              </div>
            )}

            {tab === "addresses" && (
              <div>
                <h2
                  className="text-[24px] mb-6"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                >
                  Addresses
                </h2>
                <div className="border border-dashed border-black/15 rounded-2xl p-10 text-center">
                  <MapPin size={28} strokeWidth={1.3} className="text-black/30 mx-auto mb-3" />
                  <p className="text-[14px] text-black/60 mb-4">
                    No saved addresses yet. Add one at checkout.
                  </p>
                  <button
                    onClick={() => navigate("/shop")}
                    className="bg-black text-white px-6 h-11 rounded-full text-[13px] font-bold hover:bg-[#fa5d42] transition-colors"
                  >
                    Start shopping
                  </button>
                </div>
              </div>
            )}

            {tab === "wishlist" && (
              <div>
                <h2
                  className="text-[24px] mb-6"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                >
                  Wishlist
                </h2>
                <p className="text-[13px] text-black/60 mb-4">
                  You have {wishlistIds.length}{" "}
                  {wishlistIds.length === 1 ? "item" : "items"} saved.
                </p>
                <button
                  onClick={() => navigate("/wishlist")}
                  className="bg-black text-white px-6 h-11 rounded-full text-[13px] font-bold hover:bg-[#fa5d42] transition-colors"
                >
                  Open wishlist →
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px] border-b border-black/5 pb-4 last:border-b-0 last:pb-0">
      <span className="text-black/50 uppercase tracking-wider font-bold text-[11px]">
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
