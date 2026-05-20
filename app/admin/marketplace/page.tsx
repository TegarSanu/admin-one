"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Store as StoreIcon,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Package,
  TrendingUp,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import MemberStorefront from "@/components/marketplace/MemberStorefront";

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

type ViewMode = "admin" | "member";

export default function MarketplaceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { user } = useAuthStore();

  const isSuperAdmin =
    user?.role?.name === "Super Admin" || user?.role?.name === "Administrator";
  const [viewMode, setViewMode] = useState<ViewMode>(
    isSuperAdmin ? "admin" : "member",
  );

  // Update viewMode when role data loads
  useEffect(() => {
    if (!isSuperAdmin) setViewMode("member");
  }, [isSuperAdmin]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-10">
      {/* Page Header with View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {viewMode === "admin" ? "Marketplace Overview" : "Marketplace"}
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 font-medium text-sm">
              {viewMode === "admin"
                ? "Kelola dan pantau semua Toko Kelontong dan produk di marketplace."
                : "Belanja kebutuhan sehari-hari dari toko kelontong terpercaya."}
            </p>
          </div>

          {viewMode === "admin" && (
            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground self-start"
            >
              <RefreshCw
                className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"}
              />
            </button>
          )}
        </div>

        {/* View Mode Toggle — Only for Super Admin */}
        {isSuperAdmin && (
          <div className="flex p-1 rounded-xl bg-muted/50 border border-border w-fit">
            <button
              onClick={() => setViewMode("admin")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === "admin"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin Overview
            </button>
            <button
              onClick={() => setViewMode("member")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === "member"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Belanja (Member)
            </button>
          </div>
        )}
      </motion.div>

      {/* Render based on view mode */}
      {viewMode === "member" ? (
        <MemberStorefront />
      ) : (
        <>
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
                  Daftar toko terbaru yang terdaftar
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
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </div>
  );
}
