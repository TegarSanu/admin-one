"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, Store as StoreIcon,
  Package, CheckCircle, ChevronRight, ShoppingBag, Sparkles, Filter,
  MapPin, Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  storeName: string;
}

const CATEGORIES = ["Semua", "Sembako", "Makanan", "Minuman", "Kebutuhan Rumah"];

const categoryEmoji: Record<string, string> = {
  Sembako: "🌾",
  Makanan: "🍜",
  Minuman: "☕",
  "Kebutuhan Rumah": "🏠",
};

interface MemberStorefrontProps {
  apiBase?: string;
}

export default function MemberStorefront({ apiBase = "/api/admin/marketplace" }: MemberStorefrontProps) {
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const [checkoutDone, setCheckoutDone] = useState(false);

  useEffect(() => {
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

  const filtered = useMemo(() => {
    let list = products;
    if (selectedStore) list = list.filter((p: any) => (p.storeId?._id || p.storeId) === selectedStore);
    if (selectedCategory !== "Semua") list = list.filter((p: any) => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedStore, selectedCategory, search]);

  const getStoreName = (p: any) => {
    if (p.storeId?.name) return p.storeId.name;
    const s = stores.find((s: any) => s._id === (p.storeId?._id || p.storeId));
    return s?.name || "Toko";
  };

  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  const cartTotal = cart.reduce((a, c) => a + c.price * c.quantity, 0);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === product._id);
      if (existing) return prev.map((c) => c._id === product._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { _id: product._id, name: product.name, price: product.price, quantity: 1, category: product.category, storeName: getStoreName(product) }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c._id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c._id !== id));
  };

  const handleCheckout = () => {
    setCheckoutDone(true);
    setTimeout(() => {
      setCart([]);
      setCartOpen(false);
      setTimeout(() => setCheckoutDone(false), 300);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-3 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 sm:p-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-white/80" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Marketplace</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Belanja Kebutuhan<br className="hidden sm:block" /> Sehari-hari
          </h2>
          <p className="text-white/70 text-sm sm:text-base mt-2 max-w-md">
            Temukan produk terbaik dari toko kelontong terpercaya di sekitar Anda.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari produk, kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
              selectedCategory === cat
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25"
                : "bg-card text-muted-foreground border-border hover:border-emerald-500/30 hover:text-foreground"
            )}
          >
            {cat !== "Semua" && <span className="mr-1.5">{categoryEmoji[cat]}</span>}
            {cat}
          </button>
        ))}
      </div>

      {/* Store Selector */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <StoreIcon className="w-3.5 h-3.5" /> Pilih Toko
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setSelectedStore(null)}
            className={cn(
              "flex-shrink-0 px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200",
              !selectedStore
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            Semua Toko
          </button>
          {stores.map((store) => (
            <button
              key={store._id}
              onClick={() => setSelectedStore(store._id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 rounded-xl border text-xs font-bold transition-all duration-200 text-left",
                selectedStore === store._id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              <span className="block">{store.name}</span>
              <span className="flex items-center gap-1 text-[10px] opacity-60 mt-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {store.address?.split(",")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-foreground">{filtered.length} Produk Ditemukan</h3>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center glass-panel rounded-2xl">
            <Package className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm font-bold text-foreground">Produk tidak ditemukan</p>
            <p className="text-xs text-muted-foreground">Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product: any) => {
                const inCart = cart.find((c) => c._id === product._id);
                return (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group glass-panel rounded-2xl overflow-hidden border border-border/50 hover:border-emerald-500/30 transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => setDetailProduct(product)}
                  >
                    {/* Product Image Placeholder */}
                    <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden">
                      <span className="text-4xl sm:text-5xl">{categoryEmoji[product.category] || "📦"}</span>
                      {inCart && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                          {inCart.quantity}
                        </div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500/90 text-white rounded-md text-[9px] font-black uppercase">
                          Stok Terbatas
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">{product.category}</p>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-2 mb-2 flex-1">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mb-1 truncate">
                        {getStoreName(product)}
                      </p>
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-wider mb-2",
                        product.stock > 20 ? "text-emerald-500" : product.stock > 5 ? "text-amber-500" : "text-rose-500"
                      )}>
                        Stok: {product.stock}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm sm:text-base font-black text-foreground tracking-tight">
                          {formatCurrency(product.price)}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/25"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 100 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 hover:bg-emerald-600 transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-emerald-600 text-[10px] font-black rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <span className="text-sm font-bold hidden sm:block">{formatCurrency(cartTotal)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-[420px] bg-card border-l border-border flex flex-col shadow-2xl"
            >
              {checkoutDone ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-xl font-black text-foreground">Checkout Berhasil!</h3>
                  <p className="text-sm text-muted-foreground text-center">Pesanan Anda sedang diproses dan akan segera dikirim.</p>
                </motion.div>
              ) : (
                <>
                  <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-foreground">Keranjang</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{cartCount} item</p>
                      </div>
                    </div>
                    <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <ShoppingCart className="w-10 h-10 text-muted-foreground/20" />
                        <p className="text-sm font-bold text-muted-foreground">Keranjang kosong</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <motion.div
                          key={item._id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                        >
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                            {categoryEmoji[item.category] || "📦"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.storeName}</p>
                            <p className="text-xs font-black text-foreground mt-0.5">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => updateQty(item._id, -1)} className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-black">{item.quantity}</span>
                            <button onClick={() => updateQty(item._id, 1)} className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item._id)} className="p-1.5 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-5 border-t border-border space-y-4 shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-muted-foreground">Total</span>
                        <span className="text-xl font-black text-foreground">{formatCurrency(cartTotal)}</span>
                      </div>
                      <button
                        onClick={handleCheckout}
                        className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                      >
                        Checkout Sekarang
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {detailProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-[90] bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <button
                onClick={() => setDetailProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-card/80 backdrop-blur-sm hover:bg-muted rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center shrink-0">
                <span className="text-7xl sm:text-8xl">{categoryEmoji[detailProduct.category] || "📦"}</span>
              </div>

              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                <div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{detailProduct.category}</span>
                  <h3 className="text-xl font-black text-foreground mt-1 tracking-tight">{detailProduct.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <StoreIcon className="w-3 h-3" /> {getStoreName(detailProduct)}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detailProduct.description || "Deskripsi produk belum tersedia."}
                </p>

                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Harga</p>
                    <p className="text-2xl font-black text-foreground tracking-tight">{formatCurrency(detailProduct.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stok</p>
                    <p className="text-lg font-black text-foreground">{detailProduct.stock}</p>
                  </div>
                </div>

                <button
                  onClick={() => { addToCart(detailProduct); setDetailProduct(null); }}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
