import { useNavigate } from "react-router";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import SiteHeader from "./SiteHeader";
import PageHead from "./PageHead";
import SiteFooter from "./SiteFooter";
import { useWishlist } from "../store/WishlistContext";
import { useCart } from "../store/CartContext";
import { products } from "./products";
import { formatPrice } from "../utils/currency";

interface WishlistPageProps {
  onOpenCart: () => void;
}

export default function WishlistPage({ onOpenCart }: WishlistPageProps) {
  const navigate = useNavigate();
  const { ids, remove } = useWishlist();
  const { add } = useCart();

  const wishlistProducts = products.filter((p) => ids.includes(p.id));

  const addToBag = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      color: product.colors[0].name,
      colorHex: product.colors[0].hex,
      size: product.sizes[0],
      price: product.price,
      quantity: 1,
    });
    onOpenCart();
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHead title="Wishlist" noindex />
      <SiteHeader onOpenCart={onOpenCart} />

      <div className="max-w-[1200px] mx-auto px-8 pt-12 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand mb-2 block">
              Your saves
            </span>
            <h1
              className="text-[40px] tracking-tight leading-none"
              style={{ fontWeight: 600 }}
            >
              Wishlist
            </h1>
          </div>
          <span className="text-[13px] text-black/50">
            {wishlistProducts.length}{" "}
            {wishlistProducts.length === 1 ? "item" : "items"}
          </span>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="size-20 rounded-full bg-black/5 flex items-center justify-center mb-6">
              <Heart size={28} strokeWidth={1.3} className="text-black/30" />
            </div>
            <h2
              className="text-[22px] mb-2"
              style={{ fontWeight: 600 }}
            >
              Nothing saved yet
            </h2>
            <p className="text-[13px] text-black/60 mb-8 max-w-[360px]">
              Tap the heart on any product to save it for later. Your list
              syncs across devices when you're signed in.
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="bg-black text-white px-8 h-12 rounded-full font-semibold text-[13px] hover:bg-brand transition-colors"
            >
              Shop new arrivals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistProducts.map((p) => (
              <div
                key={p.id}
                className="border border-black/10 rounded-2xl p-4 flex flex-col hover:border-black transition-colors"
              >
                <div
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="aspect-[3/4] bg-[#f5f5f5] overflow-hidden mb-4 cursor-pointer group"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate">{p.name}</p>
                    <p className="text-[11px] text-black/50 uppercase tracking-wider mt-1">
                      {p.category}
                    </p>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums">
                    {formatPrice(p.price)}
                  </span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => addToBag(p.id)}
                    className="flex-1 bg-black text-white h-11 rounded-full text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-brand transition-colors"
                  >
                    <ShoppingBag size={13} strokeWidth={2} />
                    Add to bag
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="size-11 rounded-full border border-black/10 flex items-center justify-center text-black/50 hover:border-brand hover:text-brand transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
