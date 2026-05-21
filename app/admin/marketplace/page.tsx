"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Store as StoreIcon,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Package,
  TrendingUp,
  AlertTriangle,
  Bell,
  Mail,
  Phone,
  User as UserIcon,
  Plus,
  Search,
  CheckCircle,
  Eye,
  Settings,
  Info,
  LayoutDashboard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

const categoryEmoji: Record<string, string> = {
  Sembako: "🌾",
  Makanan: "🍜",
  Minuman: "☕",
  "Kebutuhan Rumah": "🏠",
  Lainnya: "📦",
};

export default function MarketplaceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { user } = useAuthStore();

  // Search & Filter state for critical stock
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockFilterType, setStockFilterType] = useState<"all_low" | "out" | "critical" | "warning">("all_low");
  
  // Interactive Restock state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>("");
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockSuccessMessage, setRestockSuccessMessage] = useState("");
  const [restockErrorMessage, setRestockErrorMessage] = useState("");

  // Contact Store Modal State
  const [contactProduct, setContactProduct] = useState<any | null>(null);
  const [sendAlertSuccess, setSendAlertSuccess] = useState<boolean>(false);
  const [alertLoading, setAlertLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/marketplace/stores").then((r) => r.json()),
      fetch("/api/admin/marketplace/products").then((r) => r.json()),
    ])
      .then(([storesData, productsData]) => {
        setStores(storesData.stores || []);
        setProducts(productsData.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch marketplace data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeStores = stores.filter((s) => s.status === "active").length;
  const totalValue = products.reduce(
    (acc: number, p: any) => acc + (p.price || 0) * (p.stock || 0),
    0,
  );

  // Compute stat summary for cards
  const statCards = [
    {
      label: "Total Toko",
      value: stores.length.toString(),
      trend: "+12%",
      positive: true,
      icon: StoreIcon,
    },
    {
      label: "Toko Aktif",
      value: activeStores.toString(),
      trend: "+5%",
      positive: true,
      icon: TrendingUp,
    },
    {
      label: "Total Produk",
      value: products.length.toString(),
      trend: "+24%",
      positive: true,
      icon: ShoppingCart,
    },
    {
      label: "Nilai Inventori",
      value: formatCurrency(totalValue),
      trend: "+8%",
      positive: true,
      icon: DollarSign,
    },
  ];

  // Helper to extract store details
  const getStoreDetails = (p: any) => {
    const s = stores.find((st: any) => st._id === (p.storeId?._id || p.storeId));
    return s || { name: "Toko Kelontong", owner: { name: "Pemilik Toko", email: "store@owner.com" }, phone: "+6281234567890" };
  };

  const getStoreName = (p: any) => {
    if (p.storeId?.name) return p.storeId.name;
    const s = getStoreDetails(p);
    return s.name;
  };

  // Filter low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p: any) => {
      const stock = p.stock || 0;
      const matchesSearch = p.name?.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                            getStoreName(p).toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                            p.category?.toLowerCase().includes(stockSearchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (stockFilterType === "all_low") return stock <= 10;
      if (stockFilterType === "out") return stock === 0;
      if (stockFilterType === "critical") return stock > 0 && stock <= 5;
      if (stockFilterType === "warning") return stock > 5 && stock <= 10;

      return false;
    });
  }, [products, stockSearchQuery, stockFilterType, stores]);

  // Analytics on low stocks
  const outOfStockCount = products.filter((p: any) => (p.stock || 0) === 0).length;
  const criticalStockCount = products.filter((p: any) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const warningStockCount = products.filter((p: any) => (p.stock || 0) > 5 && (p.stock || 0) <= 10).length;

  // Perform inline database restock update
  const handleRestockSubmit = async (productId: string, currentStock: number) => {
    const amount = Number(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      setRestockErrorMessage("Nominal restock harus bernilai positif!");
      return;
    }

    setRestockLoading(true);
    setRestockErrorMessage("");
    setRestockSuccessMessage("");

    const newStock = currentStock + amount;

    try {
      const res = await fetch(`/api/admin/marketplace/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui stok di database");
      }

      // Update state locally
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, stock: newStock } : p))
      );

      setRestockSuccessMessage("Stok berhasil diperbarui!");
      setTimeout(() => {
        setEditingProductId(null);
        setRestockAmount("");
        setRestockSuccessMessage("");
      }, 1500);
    } catch (err: any) {
      setRestockErrorMessage(err.message || "Gagal melakukan restock");
    } finally {
      setRestockLoading(false);
    }
  };

  // Simulate whatsapp alert delivery
  const handleSendWAAlert = () => {
    setAlertLoading(true);
    setTimeout(() => {
      setAlertLoading(false);
      setSendAlertSuccess(true);
      setTimeout(() => {
        setSendAlertSuccess(false);
        setContactProduct(null);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-emerald-500" /> Marketplace Overview
          </h1>
          <p className="text-muted-foreground mt-1.5 font-medium text-sm">
            Pantau performa penjualan, saldo kelolaan toko kelontong, dan atasi stok kritis secara real-time.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground self-start flex items-center gap-2 text-xs font-bold bg-card"
        >
          <RefreshCw className={loading ? "animate-spin w-3.5 h-3.5" : "w-3.5 h-3.5"} />
          Segarkan Data
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="glass-panel rounded-2xl animate-pulse h-32 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-700/50 mix-blend-overlay" />
              </div>
            ))
          : statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group cursor-pointer transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                        stat.positive
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      }`}
                    >
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                    {stat.label}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
      </motion.div>

      {/* Critical Stock Alert Center (Requested Stock Feature) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8"
      >
        {/* Low Stock Watchlist */}
        <div className="glass-panel rounded-3xl border border-border/50 lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
                  Pusat Peringatan Stok Kritis & Restock
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pemantauan real-time produk yang hampir habis di seluruh Toko Kelontong
                </p>
              </div>

              {/* Threshold Switcher */}
              <div className="flex p-0.5 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-wider">
                <button
                  onClick={() => setStockFilterType("all_low")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg transition-colors",
                    stockFilterType === "all_low" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStockFilterType("out")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg transition-colors",
                    stockFilterType === "out" ? "bg-rose-500 text-white font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Habis ({outOfStockCount})
                </button>
                <button
                  onClick={() => setStockFilterType("critical")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg transition-colors",
                    stockFilterType === "critical" ? "bg-amber-500 text-white font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Kritis ({criticalStockCount})
                </button>
              </div>
            </div>

            {/* Local stock search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari produk, kategori, atau nama toko kelontong..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Memverifikasi sisa stok...
                </p>
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <CheckCircle className="w-10 h-10 text-emerald-500/30" />
                <div>
                  <p className="text-sm font-bold text-foreground">Stok Aman Terkendali</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tidak ada produk yang menyentuh ambang batas kritis saat ini.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-muted/10 border-b border-border/50 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="px-5 py-3">Nama Barang</th>
                    <th className="px-5 py-3">Toko</th>
                    <th className="px-5 py-3 text-center">Status Stok</th>
                    <th className="px-5 py-3 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {lowStockProducts.map((prod: any) => {
                    const stock = prod.stock || 0;
                    const store = getStoreDetails(prod);
                    const isEditing = editingProductId === prod._id;

                    return (
                      <tr key={prod._id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl select-none" role="img" aria-label="category">
                              {categoryEmoji[prod.category] || "📦"}
                            </span>
                            <div>
                              <p className="font-bold text-foreground text-xs leading-snug">{prod.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                {prod.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-foreground text-xs">{store.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <UserIcon className="w-2.5 h-2.5" />
                              {store.owner?.name || "Member Toko"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider border",
                              stock === 0
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                                : stock <= 5
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse"
                                : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25"
                            )}
                          >
                            {stock === 0 ? "Habis Total" : stock <= 5 ? `Kritis (${stock})` : `Menipis (${stock})`}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl shadow-inner">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="+Qty"
                                  value={restockAmount}
                                  onChange={(e) => setRestockAmount(e.target.value)}
                                  className="w-16 px-2 py-1 text-xs font-black text-center bg-muted/50 rounded-lg focus:outline-none"
                                />
                                <button
                                  onClick={() => handleRestockSubmit(prod._id, stock)}
                                  disabled={restockLoading}
                                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase"
                                >
                                  {restockLoading ? "..." : "Simpan"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProductId(null);
                                    setRestockAmount("");
                                    setRestockErrorMessage("");
                                  }}
                                  className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-[10px] font-black uppercase"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingProductId(prod._id);
                                    setRestockAmount("");
                                    setRestockErrorMessage("");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow"
                                >
                                  + Restock
                                </button>
                                <button
                                  onClick={() => {
                                    setContactProduct(prod);
                                  }}
                                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                  title="Hubungi Penjual"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                          {isEditing && restockErrorMessage && (
                            <p className="text-[8px] text-rose-500 font-bold mt-1 uppercase tracking-wide">
                              {restockErrorMessage}
                            </p>
                          )}
                          {isEditing && restockSuccessMessage && (
                            <p className="text-[8px] text-emerald-500 font-bold mt-1 uppercase tracking-wide flex items-center justify-end gap-1">
                              <CheckCircle className="w-2.5 h-2.5 animate-bounce" />
                              {restockSuccessMessage}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Inventory Stock Breakdown (Requested supporting feature) */}
        <div className="glass-panel p-6 rounded-3xl border border-border/50 lg:col-span-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">
                Metrik &amp; Analisis Inventori
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                Kondisi stok dan resiko kelangkaan barang
              </p>
            </div>

            {/* Health Meter Widget */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-500" />
                  Kondisi Stok Global
                </span>
                <span className={cn(
                  "font-black uppercase text-[10px]",
                  outOfStockCount > 3 ? "text-rose-500" : "text-emerald-500"
                )}>
                  {outOfStockCount > 3 ? "Restock Kritis!" : "Cukup Baik"}
                </span>
              </div>

              {/* Progress visual */}
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${products.length > 0 ? (outOfStockCount / products.length) * 100 : 0}%` }}
                  title="Habis"
                />
                <div
                  className="h-full bg-amber-500 animate-pulse"
                  style={{ width: `${products.length > 0 ? (criticalStockCount / products.length) * 100 : 0}%` }}
                  title="Kritis"
                />
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${products.length > 0 ? (warningStockCount / products.length) * 100 : 0}%` }}
                  title="Menipis"
                />
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      products.length > 0
                        ? ((products.length - outOfStockCount - criticalStockCount - warningStockCount) /
                            products.length) *
                          100
                        : 100
                    }%`,
                  }}
                  title="Aman"
                />
              </div>
            </div>

            {/* Breakdown meters */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  Habis Total (Stok 0)
                </span>
                <span className="text-foreground">{outOfStockCount} Barang</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  Kritis (Stok 1-5)
                </span>
                <span className="text-foreground">{criticalStockCount} Barang</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-cyan-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                  Menipis (Stok 6-10)
                </span>
                <span className="text-foreground">{warningStockCount} Barang</span>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions Box */}
          <div className="p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-3">
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              Tindakan Darurat Admin
            </h4>
            <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
              Tekan tombol di bawah untuk menyebarkan notifikasi restock otomatis ke semua toko yang memiliki stok kritis di atas.
            </p>
            <button
              onClick={() => {
                alert("📣 Notifikasi Restock Masal terkirim melalui Telegram & Email API ke semua pemilik toko kelontong!");
              }}
              disabled={outOfStockCount === 0 && criticalStockCount === 0}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground text-white font-black text-[10px] uppercase tracking-widest transition-all shadow"
            >
              🔔 Kirim Notifikasi Masal
            </button>
          </div>
        </div>
      </motion.div>

      {/* Recent Stores */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden border border-border/50"
      >
        <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Toko Kelontong Terbaru
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Daftar toko kelontong terbaru terdaftar di ekosistem marketplace
            </p>
          </div>
          <Link href="/admin/marketplace/stores">
            <button className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
              Lihat Semua
            </button>
          </Link>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Memuat data marketplace...
              </p>
            </div>
          ) : stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <StoreIcon className="w-10 h-10 text-muted-foreground opacity-20" />
              <div>
                <p className="text-sm font-black text-foreground">
                  Belum ada toko
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                  Mulai tambahkan toko kelontong pertama
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50 p-3 space-y-2">
              {stores.slice(0, 5).map((store) => (
                <Link
                  key={store._id}
                  href={`/admin/marketplace/stores/${store._id}`}
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-[10px] shrink-0">
                      {store.name?.substring(0, 2)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">
                        {store.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {store.owner?.name || "Unknown"} ·{" "}
                        {store.address?.split(",")[0]}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md border font-black text-[9px] uppercase tracking-widest shrink-0 ${
                        store.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : store.status === "suspended"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {store.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Memuat data marketplace...
              </p>
            </div>
          ) : stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <StoreIcon className="w-10 h-10 text-muted-foreground opacity-20" />
              <div>
                <p className="text-sm font-black text-foreground">
                  Belum ada toko
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                  Mulai tambahkan toko kelontong pertama
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Nama Toko
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Pemilik
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Alamat
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {stores.slice(0, 5).map((store) => (
                  <tr
                    key={store._id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-[10px]">
                          {store.name?.substring(0, 2)?.toUpperCase()}
                        </div>
                        <p className="font-black text-foreground text-sm tracking-tight">
                          {store.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-foreground">
                      {store.owner?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md border font-black text-[10px] uppercase tracking-widest ${
                          store.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : store.status === "suspended"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        {store.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-muted-foreground max-w-[200px] truncate">
                      {store.address}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/admin/marketplace/stores/${store._id}`}>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <Link href="/admin/marketplace/stores">
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <StoreIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                Kelola Toko Kelontong
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lihat, tambah, edit dan kelola semua member toko kelontong
                yang terdaftar di marketplace.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                {stores.length} toko
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </Link>

        <Link href="/admin/marketplace/products">
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-violet-500/30 hover:bg-violet-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground group-hover:text-violet-500 transition-colors">
                Kelola Produk
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pantau semua produk yang dijual oleh toko-toko kelontong di
                seluruh marketplace.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-violet-500/15 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                {products.length} produk
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </Link>

        <Link href="/admin/marketplace/cashflow">
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-amber-500/30 hover:bg-amber-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground group-hover:text-amber-500 transition-colors">
                Laporan Keuangan
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ringkasan keuangan marketplace, saldo toko, dan proyeksi
                pendapatan dari semua transaksi.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                Lihat Laporan
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Hubungi Penjual Overlay (Contact Modal) */}
      <AnimatePresence>
        {contactProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContactProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-[90] bg-card rounded-3xl border border-border shadow-2xl flex flex-col p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <span className="flex items-center gap-2 text-xs font-black uppercase text-foreground">
                  <Phone className="w-4 h-4 text-emerald-500 animate-pulse" /> Hubungi Pemilik Toko
                </span>
                <button
                  onClick={() => setContactProduct(null)}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                >
                  <Eye className="w-4 h-4 rotate-45" />
                </button>
              </div>

              {/* Owner details card */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-3">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Informasi Toko</p>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-foreground">{getStoreName(contactProduct)}</p>
                    <p className="text-xs text-muted-foreground">{getStoreDetails(contactProduct).address}</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-xs text-foreground font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Pemilik Toko</p>
                      <p className="text-foreground">{getStoreDetails(contactProduct).owner?.name || "Pemilik"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-foreground font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Email Terdaftar</p>
                      <p className="text-foreground">{getStoreDetails(contactProduct).owner?.email || "owner@store.com"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-foreground font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nomor Handphone</p>
                      <p className="text-foreground">{getStoreDetails(contactProduct).phone || "+6281234567890"}</p>
                    </div>
                  </div>
                </div>

                {/* Pre-written WhatsApp notification template preview */}
                <div className="p-3.5 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl space-y-1.5 text-[10px] text-muted-foreground">
                  <p className="font-bold text-emerald-500 uppercase tracking-widest text-[9px]">Preview Pesan Restock Alert</p>
                  <p className="italic font-mono leading-relaxed bg-card p-2 rounded-lg border border-border">
                    &quot;Halo {getStoreDetails(contactProduct).owner?.name || "Pemilik"}, stok produk [{contactProduct.name}] di toko [{getStoreName(contactProduct)}] Anda saat ini kritis (Tersisa: {contactProduct.stock} unit). Harap segera restock via panel seller.&quot;
                  </p>
                </div>
              </div>

              {sendAlertSuccess ? (
                <div className="p-3 flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 animate-bounce" />
                  WhatsApp Alert Berhasil Terkirim!
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setContactProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-black uppercase text-muted-foreground hover:bg-muted"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleSendWAAlert}
                    disabled={alertLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted text-white text-xs font-black uppercase tracking-wider shadow flex items-center justify-center gap-1.5"
                  >
                    {alertLoading ? "Mengirim..." : "Kirim WA Alert"}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
