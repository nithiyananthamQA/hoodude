import { BrowserRouter, Routes, Route } from "react-router";
import { useState } from "react";
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
import { CartProvider } from "./store/CartContext";
import { WishlistProvider } from "./store/WishlistContext";
import { AuthProvider } from "./store/AuthContext";

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage onOpenCart={openCart} />} />
              <Route path="/shop" element={<ShopPage onOpenCart={openCart} />} />
              <Route path="/product" element={<ProductPage onOpenCart={openCart} />} />
              <Route path="/customize" element={<CustomizePage onOpenCart={openCart} />} />
              <Route path="/checkout" element={<CheckoutPage onOpenCart={openCart} />} />
              <Route path="/login" element={<AuthPage onOpenCart={openCart} mode="signin" />} />
              <Route path="/signup" element={<AuthPage onOpenCart={openCart} mode="signup" />} />
              <Route path="/account" element={<AccountPage onOpenCart={openCart} />} />
              <Route path="/wishlist" element={<WishlistPage onOpenCart={openCart} />} />
              <Route path="/about" element={<PolicyPage onOpenCart={openCart} slug="about" />} />
              <Route path="/shipping" element={<PolicyPage onOpenCart={openCart} slug="shipping" />} />
              <Route path="/returns" element={<PolicyPage onOpenCart={openCart} slug="returns" />} />
              <Route path="/privacy" element={<PolicyPage onOpenCart={openCart} slug="privacy" />} />
              <Route path="/terms" element={<PolicyPage onOpenCart={openCart} slug="terms" />} />
              <Route path="/contact" element={<PolicyPage onOpenCart={openCart} slug="contact" />} />
              <Route path="/faq" element={<PolicyPage onOpenCart={openCart} slug="faq" />} />
              <Route path="/size-guide" element={<PolicyPage onOpenCart={openCart} slug="size-guide" />} />
              <Route path="/sustainability" element={<PolicyPage onOpenCart={openCart} slug="sustainability" />} />
              <Route path="/cookies" element={<PolicyPage onOpenCart={openCart} slug="cookies" />} />
              <Route path="/accessibility" element={<PolicyPage onOpenCart={openCart} slug="accessibility" />} />
              <Route path="/careers" element={<PolicyPage onOpenCart={openCart} slug="careers" />} />
              <Route path="/press" element={<PolicyPage onOpenCart={openCart} slug="press" />} />
              <Route path="/wholesale" element={<PolicyPage onOpenCart={openCart} slug="wholesale" />} />
              <Route path="*" element={<NotFoundPage onOpenCart={openCart} />} />
            </Routes>
            <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
