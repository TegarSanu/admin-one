"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  RefreshCw,
  Award,
  Wallet,
  Building,
  Check,
  Search,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const categoryEmoji: Record<string, string> = {
  Sembako: "🌾",
  Makanan: "🍜",
  Minuman: "☕",
  "Kebutuhan Rumah": "🏠",
  Lainnya: "📦",
};

export default function CashflowPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [payoutStoreId, setPayoutStoreId] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/marketplace/cashflow")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch cashflow data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutStoreId || !payoutAmount || Number(payoutAmount) <= 0) return;

    setPayoutLoading(true);
    setPayoutError("");
    setPayoutSuccess(false);

    fetch("/api/admin/marketplace/cashflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: payoutStoreId,
        amount: Number(payoutAmount),
      }),
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res.error || "Penarikan gagal");
        return res;
      })
      .then(() => {
        setPayoutSuccess(true);
        setPayoutAmount("");
        setTimeout(() => {
          setPayoutStoreId(null);
          setPayoutSuccess(false);
        }, 2000);
        fetchData(); // Refresh metrics and balances
      })
      .catch((err) => {
        setPayoutError(err.message);
      })
      .finally(() => {
        setPayoutLoading(false);
      });
  };

  const filteredTransactions = data?.recentTransactions?.filter((tx: any) => {
    const q = searchQuery.toLowerCase();
    return (
      tx.buyerName?.toLowerCase().includes(q) ||
      tx.storeId?.name?.toLowerCase().includes(q) ||
      tx._id?.toLowerCase().includes(q) ||
      tx.paymentMethod?.toLowerCase().includes(q)
    );
  }) || [];

  const metrics = data?.metrics || {
    totalTransactions: 0,
    gmv: 0,
    averageOrderValue: 0,
    platformCommission: 0,
    totalWithdrawableBalance: 0,
  };

  const statCards = [
    {
      label: "Total Volume Penjualan (GMV)",
      value: formatCurrency(metrics.gmv),
      sub: "Total perputaran uang di marketplace",
      icon: DollarSign,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Komisi Platform (5%)",
      value: formatCurrency(metrics.platformCommission),
      sub: "Estimasi pendapatan bersih admin",
      icon: TrendingUp,
      color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      label: "Dana Mengendap Toko",
      value: formatCurrency(metrics.totalWithdrawableBalance),
      sub: "Total saldo yang dapat ditarik oleh toko",
      icon: Wallet,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Total Transaksi",
      value: metrics.totalTransactions.toString(),
      sub: "Jumlah checkout berhasil diproses",
      icon: ShoppingCart,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  const selectedPayoutStore = data?.stores?.find((s: any) => s._id === payoutStoreId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Marketplace
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            Laporan Keuangan
          </h1>
          <p className="text-muted-foreground font-medium text-sm">
            Pantau arus kas, performa penjualan toko kelontong, dan kelola penarikan dana.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-sm self-start"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Perbarui Data
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-10 h-10 border-3 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Memuat laporan keuangan...
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 sm:space-y-10"
        >
          {/* Stats Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-border/50 hover:border-foreground/20 transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {stat.label}
                    </span>
                    <div className={cn("p-2.5 rounded-xl border shrink-0", stat.color)}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {stat.value}
                  </h3>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase tracking-wide">
                  {stat.sub}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Breakdown and Top Stores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Sales by Category */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-3xl border border-border/50 lg:col-span-1 space-y-6"
            >
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Penjualan per Kategori
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                  Arus produk berdasarkan kategori
                </p>
              </div>

              {data.categorySales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs font-bold">Belum ada data penjualan</p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {data.categorySales.map((cat: any) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <span>{categoryEmoji[cat.name] || "📦"}</span>
                          {cat.name}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(cat.value)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Top Stores Performance */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-3xl border border-border/50 lg:col-span-2 space-y-6"
            >
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Top 5 Toko Terlaris
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                  Toko kelontong dengan omzet tertinggi
                </p>
              </div>

              {data.topStores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Building className="w-10 h-10 opacity-20 mb-2" />
                  <p className="text-xs font-bold">Belum ada transaksi terdaftar</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {data.topStores.map((store: any, idx: number) => {
                    const topGmv = data.topStores[0]?.sales || 1;
                    const percent = Math.round((store.sales / topGmv) * 100);
                    return (
                      <div key={store.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-foreground text-background font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">
                              {store.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                                {store.txCount} trx
                              </span>
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-foreground rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-foreground">
                            {formatCurrency(store.sales)}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                            Total Penjualan
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Balance and Payout Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Store Balances List */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-3xl border border-border/50 lg:col-span-2 space-y-6"
            >
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Saldo Saluran Toko & Payout
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                  Kelola dana terhimpun dan proses pencairan dana toko
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-black uppercase tracking-widest text-[9px]">
                      <th className="pb-3">Nama Toko</th>
                      <th className="pb-3">Pemilik</th>
                      <th className="pb-3">Saldo Berjalan</th>
                      <th className="pb-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.stores.map((s: any) => (
                      <tr key={s._id} className="group hover:bg-muted/10 transition-colors">
                        <td className="py-4">
                          <p className="font-bold text-foreground text-sm">{s.name}</p>
                        </td>
                        <td className="py-4 text-muted-foreground font-semibold">
                          {s.ownerName}
                        </td>
                        <td className="py-4 font-black text-foreground">
                          {formatCurrency(s.balance)}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => {
                              setPayoutStoreId(s._id);
                              setPayoutAmount(s.balance.toString());
                              setPayoutError("");
                              setPayoutSuccess(false);
                            }}
                            disabled={s.balance <= 0}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white transition-all shadow shadow-emerald-500/10"
                          >
                            Pencairan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Payout Processing Widget */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-3xl border border-border/50 lg:col-span-1"
            >
              <div className="mb-6">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Proses Pencairan (Payout)
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                  Simulasi penarikan saldo toko ke rekening bank
                </p>
              </div>

              {payoutStoreId ? (
                <form onSubmit={handlePayoutSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Toko Terpilih</p>
                    <p className="text-sm font-black text-foreground mt-1">{selectedPayoutStore?.name}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Saldo: {formatCurrency(selectedPayoutStore?.balance || 0)}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Nominal Pencairan (Rp)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedPayoutStore?.balance}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="Masukkan nominal penarikan"
                      className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs font-bold"
                    />
                  </div>

                  {payoutError && (
                    <div className="p-3 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/25 rounded-xl uppercase tracking-wide">
                      {payoutError}
                    </div>
                  )}

                  {payoutSuccess ? (
                    <div className="p-4 flex flex-col items-center justify-center gap-2 text-center text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
                      <Check className="w-6 h-6 animate-bounce" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Pencairan Berhasil!</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPayoutStoreId(null)}
                        className="flex-1 py-2.5 rounded-xl border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={payoutLoading}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/15"
                      >
                        {payoutLoading ? "Memproses..." : "Kirim Payout"}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border-2 border-dashed border-border rounded-2xl">
                  <Wallet className="w-8 h-8 text-muted-foreground/30" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Formulir Pencairan</p>
                    <p className="text-[9px] text-muted-foreground font-semibold mt-1 uppercase tracking-wider">
                      Pilih tombol &apos;Pencairan&apos; pada baris toko kelontong di tabel
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Ledger - Transaction History */}
          <motion.div
            variants={itemVariants}
            className="glass-panel p-6 rounded-3xl border border-border/50 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Buku Besar Transaksi Marketplace
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                  Log lengkap arus kas dan riwayat pembayaran checkout
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari pembeli, toko, metode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/20" />
                <p className="text-sm font-bold text-foreground">Transaksi tidak ditemukan</p>
                <p className="text-xs text-muted-foreground">Tidak ada riwayat transaksi yang cocok dengan kata kunci.</p>
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground font-black uppercase tracking-widest text-[9px]">
                      <th className="px-4 py-3">ID Transaksi</th>
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Toko Kelontong</th>
                      <th className="px-4 py-3">Pembeli</th>
                      <th className="px-4 py-3">Item Belanja</th>
                      <th className="px-4 py-3">Metode</th>
                      <th className="px-4 py-3 text-right">Total Transaksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredTransactions.map((tx: any) => (
                      <tr key={tx._id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4 font-mono text-[10px] text-muted-foreground">
                          {tx._id?.substring(0, 10)}...
                        </td>
                        <td className="px-4 py-4 font-semibold text-muted-foreground text-[10px]">
                          {new Date(tx.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-4 font-bold text-foreground">
                          {tx.storeId?.name || "Toko dihapus"}
                        </td>
                        <td className="px-4 py-4 font-bold text-foreground">
                          {tx.buyerName}
                        </td>
                        <td className="px-4 py-4 max-w-[200px] truncate font-semibold text-muted-foreground text-[10px]">
                          {tx.items?.map((it: any) => `${it.name} (${it.quantity})`).join(", ")}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider border",
                              tx.paymentMethod === "cash"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                                : "bg-violet-500/10 text-violet-500 border-violet-500/25"
                            )}
                          >
                            {tx.paymentMethod === "cash" ? "Cash/COD" : "Saldo/Wallet"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-foreground text-sm">
                          {formatCurrency(tx.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
