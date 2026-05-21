"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ShoppingCart, Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ShopTab from "./tabs/ShopTab";
import CartTab from "./tabs/CartTab";
import HistoryTab from "./tabs/HistoryTab";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  category: string;
  storeName: string;
  storeId: string;
}

const TABS = [
  { id: "shop", label: "Belanja", icon: ShoppingBag, emoji: "🛍️" },
  { id: "cart", label: "Keranjang", icon: ShoppingCart, emoji: "🛒" },
  { id: "history", label: "Riwayat", icon: Receipt, emoji: "📋" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface MemberStorefrontProps {
  apiBase?: string;
}

export default function MemberStorefront({
  apiBase = "/api/marketplace",
}: MemberStorefrontProps) {
  const [activeTab, setActiveTab] = useState<TabId>("shop");
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${apiBase}/stores`).then((r) => r.json()),
      fetch(`${apiBase}/products`).then((r) => r.json()),
    ])
      .then(([s, p]) => {
        setStores(s.stores || []);
        setProducts(p.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiBase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  const cartTotal = cart.reduce((a, c) => a + c.price * c.quantity, 0);

  const getStoreName = (p: any) => {
    if (p.storeId?.name) return p.storeId.name;
    const s = stores.find((s: any) => s._id === (p.storeId?._id || p.storeId));
    return s?.name || "Toko";
  };

  const getStoreId = (p: any): string => {
    return p.storeId?._id || p.storeId || "";
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((c) =>
          c._id === product._id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
          category: product.category,
          storeName: getStoreName(product),
          storeId: getStoreId(product),
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c._id !== id) return c;
        const newQty = c.quantity + delta;
        if (newQty < 1 || newQty > c.stock) return c;
        return { ...c, quantity: newQty };
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c._id !== id));
  };

  const clearCart = () => setCart([]);

  const onCheckoutSuccess = () => {
    clearCart();
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Memuat marketplace...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="relative">
        <div className="flex gap-1.5 p-1.5 rounded-2xl bg-card border border-border/50 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === "cart" && cartCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex-1 justify-center whitespace-nowrap",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="marketplace-tab-bg"
                    className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/25"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 hidden sm:inline">
                  {tab.emoji}
                </span>
                <tab.icon className="relative z-10 w-4 h-4 sm:hidden" />
                <span className="relative z-10">{tab.label}</span>
                {showBadge && (
                  <span className="relative z-10 w-5 h-5 rounded-full bg-white text-emerald-600 text-[10px] font-black flex items-center justify-center ml-0.5">
                    {cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "shop" && (
            <ShopTab
              products={products}
              stores={stores}
              cart={cart}
              addToCart={addToCart}
              getStoreName={getStoreName}
              onGoToCart={() => setActiveTab("cart")}
              cartCount={cartCount}
              cartTotal={cartTotal}
            />
          )}
          {activeTab === "cart" && (
            <CartTab
              cart={cart}
              updateQty={updateQty}
              removeFromCart={removeFromCart}
              cartTotal={cartTotal}
              apiBase={apiBase}
              onCheckoutSuccess={onCheckoutSuccess}
              onContinueShopping={() => setActiveTab("shop")}
            />
          )}
          {activeTab === "history" && <HistoryTab apiBase={apiBase} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
