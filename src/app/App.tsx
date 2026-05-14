import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { motion } from "motion/react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import LandingPage from "./components/LandingPage";
import ProductPage from "./components/ProductPage";
import CustomizePage from "./components/CustomizePage";
import ShopPage from "./components/ShopPage";
import CheckoutPage from "./components/CheckoutPage";
import AuthPage from "./components/AuthPage";
import AccountPage from "./components/AccountPage";
import WishlistPage from "./components/WishlistPage";
import PolicyPage from "./components/PolicyPage";
import NotFoundPage from "./components/NotFoundPage";
import CartDrawer from "./components/CartDrawer";
import WishlistDrawer from "./components/WishlistDrawer";
import { CartProvider, useCart } from "./store/CartContext";
import { WishlistProvider } from "./store/WishlistContext";
import { AuthProvider } from "./store/AuthContext";
import { OrderProvider } from "./store/OrderContext";
import AppErrorBoundary from "./components/AppErrorBoundary";

const QUADRANT_DURATION = 0.65;
const QUADRANT_STAGGER = 0.02;
const REVEAL_DURATION = 0.6;
const REVEAL_STAGGER = 0.02;
const COVER_ANIM_MS = (QUADRANT_DURATION + QUADRANT_STAGGER * 3) * 1000;
const REVEAL_ANIM_MS = (REVEAL_DURATION + REVEAL_STAGGER * 3) * 1000;
const LOGO_HOLD_MS = 320;
// Swap the route while the curtain is fully covering, well before reveal.
// Mounting the new page happens during the hold so reveal frames are clean.
const SWAP_AT_MS = COVER_ANIM_MS + 30;
const COVER_HOLD_MS = COVER_ANIM_MS + LOGO_HOLD_MS;
// Soft, velocity-matched curves. Cover decelerates into rest (easeOutExpo);
// reveal eases out of rest gently (easeInQuad) — no snap on either end.
const COVER_EASE = [0.16, 1, 0.3, 1] as const;
const REVEAL_EASE = [0.5, 0, 0.75, 0] as const;

type TransitionStage = "idle" | "cover" | "reveal";

const QUADRANTS = [
  // top-left
  { positionTop: 0, positionLeft: 0, fromX: "-100%", fromY: "-100%", innerTop: "0%", innerLeft: "0%" },
  // top-right
  { positionTop: 0, positionLeft: "50%", fromX: "100%", fromY: "-100%", innerTop: "0%", innerLeft: "-100%" },
  // bottom-left
  { positionTop: "50%", positionLeft: 0, fromX: "-100%", fromY: "100%", innerTop: "-100%", innerLeft: "0%" },
  // bottom-right
  { positionTop: "50%", positionLeft: "50%", fromX: "100%", fromY: "100%", innerTop: "-100%", innerLeft: "-100%" },
] as const;

function QuadrantCurtain({ stage }: { stage: TransitionStage }) {
  const isCover = stage === "cover";
  const isReveal = stage === "reveal";

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {QUADRANTS.map((q, i) => (
        <motion.div
          key={i}
          initial={{ x: q.fromX, y: q.fromY }}
          animate={
            isCover
              ? { x: 0, y: 0 }
              : { x: q.fromX, y: q.fromY }
          }
          transition={{
            duration: isReveal ? REVEAL_DURATION : QUADRANT_DURATION,
            ease: isReveal ? REVEAL_EASE : COVER_EASE,
            delay: isReveal
              ? (3 - i) * REVEAL_STAGGER
              : i * QUADRANT_STAGGER,
          }}
          style={{
            position: "absolute",
            top: q.positionTop,
            left: q.positionLeft,
            width: "50%",
            height: "50%",
            backgroundColor: "#ffffff",
            overflow: "hidden",
            willChange: "transform",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: q.innerTop,
              left: q.innerLeft,
              width: "100vw",
              height: "100vh",
            }}
          >
            <img
              src="/image.png"
              alt=""
              className="h-[280px] md:h-[420px] brightness-0"
              style={{ willChange: "transform" }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AnimatedRoutes({ onOpenCart }: { onOpenCart: () => void }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState<TransitionStage>("idle");

  // Clear any stale inline `--brand-accent` left on <html> by a previous
  // session of the (now-removed) brand color cycler. Inline styles on
  // documentElement persist across HMR until something explicitly clears them.
  useEffect(() => {
    document.documentElement.style.removeProperty("--brand-accent");
  }, []);
  // Read displayLocation via ref so the effect only re-runs on real
  // navigations, not when we swap displayLocation mid-transition. Otherwise
  // the cleanup wipes out the still-pending reveal/finish timers and the
  // curtain locks in cover state.
  const displayLocationRef = useRef(displayLocation);
  useEffect(() => {
    displayLocationRef.current = displayLocation;
  }, [displayLocation]);

  useEffect(() => {
    if (location.pathname === displayLocationRef.current.pathname) return;

    setStage("cover");

    // Swap route + scroll while the curtain is fully covering, in a paint-aligned
    // frame. This isolates React mount cost from the reveal animation so the
    // first reveal frames don't inherit mount jank.
    const swapTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        setDisplayLocation(location);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      });
    }, SWAP_AT_MS);

    // Reveal starts strictly after the new page has had time to mount and paint.
    const revealTimer = setTimeout(() => {
      setStage("reveal");
    }, COVER_HOLD_MS);

    const finishTimer = setTimeout(() => {
      setStage("idle");
    }, COVER_HOLD_MS + REVEAL_ANIM_MS + 50);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(revealTimer);
      clearTimeout(finishTimer);
    };
  }, [location]);

  return (
    <>
      <Routes location={displayLocation}>
        <Route path="/" element={<LandingPage onOpenCart={onOpenCart} />} />
        <Route path="/shop" element={<ShopPage onOpenCart={onOpenCart} />} />
        <Route path="/product" element={<ProductPage onOpenCart={onOpenCart} />} />
        <Route path="/product/:id" element={<ProductPage onOpenCart={onOpenCart} />} />
        <Route path="/customize" element={<CustomizePage onOpenCart={onOpenCart} />} />
        <Route path="/checkout" element={<CheckoutPage onOpenCart={onOpenCart} />} />
        <Route path="/login" element={<AuthPage onOpenCart={onOpenCart} mode="signin" />} />
        <Route path="/signup" element={<AuthPage onOpenCart={onOpenCart} mode="signup" />} />
        <Route path="/account" element={<AccountPage onOpenCart={onOpenCart} />} />
        <Route path="/wishlist" element={<WishlistPage onOpenCart={onOpenCart} />} />
        <Route path="/about" element={<PolicyPage onOpenCart={onOpenCart} slug="about" />} />
        <Route path="/shipping" element={<PolicyPage onOpenCart={onOpenCart} slug="shipping" />} />
        <Route path="/returns" element={<PolicyPage onOpenCart={onOpenCart} slug="returns" />} />
        <Route path="/privacy" element={<PolicyPage onOpenCart={onOpenCart} slug="privacy" />} />
        <Route path="/terms" element={<PolicyPage onOpenCart={onOpenCart} slug="terms" />} />
        <Route path="/contact" element={<PolicyPage onOpenCart={onOpenCart} slug="contact" />} />
        <Route path="/faq" element={<PolicyPage onOpenCart={onOpenCart} slug="faq" />} />
        <Route path="/size-guide" element={<PolicyPage onOpenCart={onOpenCart} slug="size-guide" />} />
        <Route path="/sustainability" element={<PolicyPage onOpenCart={onOpenCart} slug="sustainability" />} />
        <Route path="/cookies" element={<PolicyPage onOpenCart={onOpenCart} slug="cookies" />} />
        <Route path="/accessibility" element={<PolicyPage onOpenCart={onOpenCart} slug="accessibility" />} />
        <Route path="/careers" element={<PolicyPage onOpenCart={onOpenCart} slug="careers" />} />
        <Route path="/press" element={<PolicyPage onOpenCart={onOpenCart} slug="press" />} />
        <Route path="/wholesale" element={<PolicyPage onOpenCart={onOpenCart} slug="wholesale" />} />
        <Route path="*" element={<NotFoundPage onOpenCart={onOpenCart} />} />
      </Routes>
      <QuadrantCurtain stage={stage} />
    </>
  );
}

function AppRoutes() {
  const { openCart } = useCart();

  return (
    <BrowserRouter>
      <AnimatedRoutes onOpenCart={openCart} />
      <CartDrawer />
      <WishlistDrawer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <OrderProvider>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-full focus:text-[12px] focus:font-semibold focus:uppercase focus:tracking-[0.15em]"
                >
                  Skip to main content
                </a>
                <div id="aria-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
                <AppRoutes />
                <Toaster
                  position="bottom-right"
                  closeButton
                  theme="light"
                  toastOptions={{
                    style: {
                      borderRadius: "14px",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "13px",
                    },
                  }}
                />
              </OrderProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </HelmetProvider>
    </AppErrorBoundary>
  );
}
