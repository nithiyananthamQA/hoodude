import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronLeft, Lock, CreditCard, Truck, Package } from "lucide-react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useCart } from "../store/CartContext";
import { useAuth } from "../store/AuthContext";
import { formatPrice } from "../utils/currency";

type Step = "contact" | "shipping" | "payment";

interface ShippingMethod {
  id: string;
  label: string;
  sub: string;
  price: number;
  eta: string;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Standard", sub: "Free on orders over $100", price: 8, eta: "3–5 business days" },
  { id: "express", label: "Express", sub: "Priority dispatch", price: 18, eta: "1–2 business days" },
];

interface CheckoutPageProps {
  onOpenCart: () => void;
}

export default function CheckoutPage({ onOpenCart }: CheckoutPageProps) {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>("contact");
  const [email, setEmail] = useState(user?.email ?? "");
  const [firstName, setFirstName] = useState(user?.name.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.name.split(" ").slice(1).join(" ") ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("United States");
  const [phone, setPhone] = useState("");

  const [shippingId, setShippingId] = useState<string>("standard");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const shipping = SHIPPING_METHODS.find((m) => m.id === shippingId) ?? SHIPPING_METHODS[0];
  const shippingCost = shipping.id === "standard" && subtotal >= 100 ? 0 : shipping.price;
  const tax = useMemo(() => Math.round(subtotal * 0.08), [subtotal]);
  const total = subtotal + shippingCost + tax;

  if (items.length === 0 && !placedOrderId) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <SiteHeader onOpenCart={onOpenCart} />
        <div className="max-w-[720px] mx-auto px-8 py-24 text-center">
          <div className="size-20 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-6">
            <Package size={30} strokeWidth={1.3} className="text-black/40" />
          </div>
          <h1
            className="text-[32px] mb-3"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            Your bag is empty
          </h1>
          <p className="text-[14px] text-black/60 mb-8">
            Add something you love before you check out.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="bg-black text-white px-8 h-12 rounded-full font-bold text-[14px] hover:bg-[#fa5d42] transition-colors"
          >
            Continue shopping
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (placedOrderId) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <SiteHeader onOpenCart={onOpenCart} />
        <div className="max-w-[680px] mx-auto px-8 py-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="size-16 rounded-full bg-[#fa5d42] flex items-center justify-center mx-auto mb-6"
          >
            <Check size={28} strokeWidth={3} className="text-white" />
          </motion.div>
          <h1
            className="text-[36px] text-center mb-2"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            Order placed.
          </h1>
          <p className="text-[14px] text-black/60 text-center mb-10">
            A confirmation will be sent to <strong>{email}</strong>.
          </p>

          <div className="border border-black/10 rounded-2xl p-8 mb-6">
            <div className="flex items-center justify-between text-[13px] mb-4 pb-4 border-b border-black/10">
              <span className="text-black/50 uppercase tracking-wider font-bold text-[11px]">
                Order ID
              </span>
              <span className="font-bold tabular-nums">{placedOrderId}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] mb-2">
              <span className="text-black/50">Shipping to</span>
              <span className="font-medium text-right max-w-[60%]">
                {firstName} {lastName}, {address}, {city}, {region} {postal}, {country}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px] mb-2">
              <span className="text-black/50">Method</span>
              <span className="font-medium">{shipping.label} · {shipping.eta}</span>
            </div>
            <div className="flex items-center justify-between text-[15px] pt-4 mt-4 border-t border-black/10">
              <span className="font-bold">Paid</span>
              <span className="font-bold tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/shop")}
              className="flex-1 border border-black h-12 rounded-full font-bold text-[13px] hover:bg-black hover:text-white transition-colors"
            >
              Keep shopping
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? "/account" : "/")}
              className="flex-1 bg-black text-white h-12 rounded-full font-bold text-[13px] hover:bg-[#fa5d42] transition-colors"
            >
              {isAuthenticated ? "View orders" : "Back to home"}
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const canContinueFromContact = email.trim().length > 3 && email.includes("@");
  const canContinueFromShipping =
    firstName.trim() && lastName.trim() && address.trim() && city.trim() && postal.trim();
  const canPlaceOrder =
    cardNumber.replace(/\s/g, "").length >= 12 &&
    expiry.trim().length >= 4 &&
    cvc.trim().length >= 3 &&
    nameOnCard.trim().length > 1;

  const placeOrder = async () => {
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 900));
    const id = "HD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setPlacedOrderId(id);
    clear();
    setPlacing(false);
  };

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "contact", label: "Contact", icon: <Package size={14} strokeWidth={2} /> },
    { id: "shipping", label: "Shipping", icon: <Truck size={14} strokeWidth={2} /> },
    { id: "payment", label: "Payment", icon: <CreditCard size={14} strokeWidth={2} /> },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <SiteHeader onOpenCart={onOpenCart} />

      <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-24 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-16">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[12px] text-black/50 hover:text-black mb-6 font-medium"
          >
            <ChevronLeft size={14} /> Back
          </button>

          <h1
            className="text-[36px] tracking-tight mb-2"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            Checkout
          </h1>
          <p className="text-[13px] text-black/50 mb-8">
            Secure checkout — your information is encrypted.
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-10">
            {steps.map((s, i) => {
              const isActive = step === s.id;
              const isDone = i < stepIndex;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold transition-colors ${
                      isActive
                        ? "bg-black text-white"
                        : isDone
                        ? "bg-[#fa5d42] text-white"
                        : "bg-black/5 text-black/40"
                    }`}
                  >
                    {isDone ? <Check size={14} /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                      isActive ? "text-black" : "text-black/40"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px bg-black/10" />
                  )}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {step === "contact" && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full border border-black/15 rounded-lg px-4 h-12 text-[14px] outline-none focus:border-black"
                  />
                </Field>
                <label className="flex items-center gap-2 text-[12px] text-black/60">
                  <input type="checkbox" defaultChecked className="accent-black" />
                  Email me news and offers. Unsubscribe anytime.
                </label>
                <button
                  onClick={() => canContinueFromContact && setStep("shipping")}
                  disabled={!canContinueFromContact}
                  className="mt-4 bg-black text-white h-12 rounded-full font-bold text-[13px] disabled:opacity-30 hover:bg-[#fa5d42] transition-colors"
                >
                  Continue to shipping
                </button>
                {!isAuthenticated && (
                  <p className="text-center text-[12px] text-black/50">
                    Have an account?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="font-bold text-black underline underline-offset-4 hover:text-[#fa5d42]"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </motion.div>
            )}

            {step === "shipping" && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name">
                    <Input value={firstName} onChange={setFirstName} />
                  </Field>
                  <Field label="Last name">
                    <Input value={lastName} onChange={setLastName} />
                  </Field>
                </div>
                <Field label="Address">
                  <Input value={address} onChange={setAddress} placeholder="Street, apt" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <Input value={city} onChange={setCity} />
                  </Field>
                  <Field label="State / Region">
                    <Input value={region} onChange={setRegion} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Postal code">
                    <Input value={postal} onChange={setPostal} />
                  </Field>
                  <Field label="Country">
                    <Input value={country} onChange={setCountry} />
                  </Field>
                </div>
                <Field label="Phone (optional)">
                  <Input value={phone} onChange={setPhone} />
                </Field>

                <div className="mt-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-black mb-3 block">
                    Shipping method
                  </span>
                  <div className="flex flex-col gap-2">
                    {SHIPPING_METHODS.map((m) => {
                      const cost =
                        m.id === "standard" && subtotal >= 100 ? 0 : m.price;
                      const isActive = shippingId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setShippingId(m.id)}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors text-left ${
                            isActive
                              ? "border-black bg-black/[0.02]"
                              : "border-black/10 hover:border-black/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`size-4 rounded-full border-2 flex items-center justify-center ${
                                  isActive ? "border-black" : "border-black/30"
                                }`}
                              >
                                {isActive && (
                                  <div className="size-2 rounded-full bg-black" />
                                )}
                              </div>
                              <span className="text-[14px] font-bold">{m.label}</span>
                              <span className="text-[12px] text-black/50">· {m.eta}</span>
                            </div>
                            <span className="text-[11px] text-black/50 ml-6">{m.sub}</span>
                          </div>
                          <span className="text-[14px] font-bold tabular-nums">
                            {cost === 0 ? (
                              <span className="text-[#fa5d42] uppercase text-[11px] tracking-wider">
                                Free
                              </span>
                            ) : (
                              formatPrice(cost)
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setStep("contact")}
                    className="flex-1 border border-black/15 h-12 rounded-full font-bold text-[13px] hover:border-black transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => canContinueFromShipping && setStep("payment")}
                    disabled={!canContinueFromShipping}
                    className="flex-[2] bg-black text-white h-12 rounded-full font-bold text-[13px] disabled:opacity-30 hover:bg-[#fa5d42] transition-colors"
                  >
                    Continue to payment
                  </button>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 p-3 rounded-lg bg-black/5 text-[12px] text-black/70">
                  <Lock size={14} strokeWidth={2} />
                  Encrypted — we never store your card details.
                </div>
                <Field label="Card number">
                  <Input
                    value={cardNumber}
                    onChange={(v) => setCardNumber(v.replace(/[^\d ]/g, ""))}
                    placeholder="4242 4242 4242 4242"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry (MM/YY)">
                    <Input value={expiry} onChange={setExpiry} placeholder="12/28" />
                  </Field>
                  <Field label="CVC">
                    <Input value={cvc} onChange={setCvc} placeholder="123" />
                  </Field>
                </div>
                <Field label="Name on card">
                  <Input value={nameOnCard} onChange={setNameOnCard} />
                </Field>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setStep("shipping")}
                    className="flex-1 border border-black/15 h-12 rounded-full font-bold text-[13px] hover:border-black transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => canPlaceOrder && placeOrder()}
                    disabled={!canPlaceOrder || placing}
                    className="flex-[2] bg-black text-white h-12 rounded-full font-bold text-[13px] disabled:opacity-30 hover:bg-[#fa5d42] transition-colors flex items-center justify-center gap-2"
                  >
                    {placing ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing order…
                      </>
                    ) : (
                      <>
                        <Lock size={14} strokeWidth={2.5} />
                        Pay {formatPrice(total)}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-[92px] self-start bg-[#fafafa] border border-black/5 rounded-2xl p-6 h-fit">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-black/50 mb-4 block">
            Order summary
          </span>
          <div className="flex flex-col gap-4 mb-6 max-h-[320px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="size-16 rounded-lg bg-white border border-black/5 overflow-hidden shrink-0 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate">{item.name}</p>
                  <p className="text-[11px] text-black/50">
                    {item.color} · {item.size}
                  </p>
                </div>
                <span className="text-[13px] font-bold tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-black/10">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row
              label="Shipping"
              value={
                shippingCost === 0 ? (
                  <span className="text-[#fa5d42] uppercase text-[11px] tracking-wider">
                    Free
                  </span>
                ) : (
                  formatPrice(shippingCost)
                )
              }
            />
            <Row label="Tax (est.)" value={formatPrice(tax)} />
            <div className="flex items-center justify-between pt-3 border-t border-black/10 mt-2">
              <span className="text-[15px] font-bold">Total</span>
              <span className="text-[15px] font-bold tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-black/15 rounded-lg px-4 h-12 text-[14px] outline-none focus:border-black"
    />
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-black/60">{label}</span>
      <span className="font-bold text-black tabular-nums">{value}</span>
    </div>
  );
}
