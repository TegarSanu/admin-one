"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store as StoreIcon,
  ShoppingCart,
  DollarSign,
  RefreshCw,
  Package,
  TrendingUp,
  LayoutDashboard,
  ShoppingBag,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Coins,
  Check,
  Briefcase,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 25 },
  },
};

type ChartTab = "omzet" | "cashflow";

export default function MarketplaceDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const [chartTab, setChartTab] = useState<ChartTab>("omzet");

  // Modals state
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [isNewCashflowOpen, setIsNewCashflowOpen] = useState(false);
  const [isPayoffOpen, setIsPayoffOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  // Forms state
  const [debtForm, setDebtForm] = useState({
    customerName: "",
    type: "receivable", // receivable = piutang, payable = hutang
    amount: "",
    description: "",
    dueDate: "",
  });

  const [cashflowForm, setCashflowForm] = useState({
    type: "in", // in = kas masuk, out = kas keluar
    amount: "",
    category: "sale",
    description: "",
  });

  const [payoffForm, setPayoffForm] = useState({
    paymentAmount: "",
  });

  // Stock refill inline input state
  const [refillStockInput, setRefillStockInput] = useState<{
    [key: string]: string;
  }>({});
  const [refillingId, setRefillingId] = useState<string | null>(null);

  // Submitting loaders
  const [submittingDebt, setSubmittingDebt] = useState(false);
  const [submittingCashflow, setSubmittingCashflow] = useState(false);
  const [submittingPayoff, setSubmittingPayoff] = useState(false);

  const isSuperAdmin =
    user?.role?.name === "Super Admin" || user?.role?.name === "Administrator";

  // Fetch all active stores for dropdown selector
  const fetchStores = async () => {
    try {
      const res = await fetch("/api/admin/marketplace/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error("Failed to fetch stores list:", err);
    }
  };

  // Fetch full dashboard overview data
  const fetchDashboardData = async (storeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/marketplace/dashboard?storeId=${storeId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        if (data.currentStoreId) {
          setSelectedStoreId(data.currentStoreId);
        }
      } else {
        toast.error("Gagal memuat data ringkasan dashboard");
      }
    } catch (err) {
      console.error("Failed to fetch dashboard overview stats:", err);
      toast.error("Terjadi kesalahan koneksi saat memuat dashboard");
    } finally {
      setLoading(false);
    }
  };

  const reloadData = () => {
    fetchDashboardData(selectedStoreId);
    if (isSuperAdmin) {
      fetchStores();
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedStoreId);
    if (isSuperAdmin) {
      fetchStores();
    }
  }, [selectedStoreId, isSuperAdmin]);

  // Inline Quick Refill Product Stock
  const handleRefillStock = async (productId: string, currentStock: number) => {
    const refillVal = refillStockInput[productId];
    if (!refillVal || isNaN(Number(refillVal)) || Number(refillVal) <= 0) {
      toast.error("Masukkan jumlah stok refill yang valid");
      return;
    }

    setRefillingId(productId);
    try {
      const addStock = Number(refillVal);
      const res = await fetch(`/api/admin/marketplace/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: currentStock + addStock }),
      });

      if (res.ok) {
        toast.success(`Berhasil menambah stok produk sebanyak +${addStock}!`);
        setRefillStockInput((prev) => ({ ...prev, [productId]: "" }));
        reloadData();
      } else {
        toast.error("Gagal memperbarui stok produk");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kesalahan koneksi saat refill stok");
    } finally {
      setRefillingId(null);
    }
  };

  // Create New Customer Debt / Supplier Payable
  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtForm.customerName || !debtForm.amount || !debtForm.dueDate) {
      toast.error("Mohon lengkapi semua field bertanda bintang (*)");
      return;
    }

    setSubmittingDebt(true);
    try {
      const res = await fetch("/api/admin/marketplace/dashboard/debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...debtForm,
          storeId: selectedStoreId,
          amount: Number(debtForm.amount),
        }),
      });

      if (res.ok) {
        toast.success("Berhasil mencatat hutang/piutang baru!");
        setIsNewDebtOpen(false);
        setDebtForm({
          customerName: "",
          type: "receivable",
          amount: "",
          description: "",
          dueDate: "",
        });
        reloadData();
      } else {
        toast.error("Gagal menyimpan catatan hutang/piutang");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kesalahan jaringan saat menyimpan catatan");
    } finally {
      setSubmittingDebt(false);
    }
  };

  // Payoff or pay down debt partial/full
  const handlePayoffDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoffForm.paymentAmount || Number(payoffForm.paymentAmount) <= 0) {
      toast.error("Masukkan jumlah pembayaran yang valid");
      return;
    }

    if (Number(payoffForm.paymentAmount) > selectedDebt.remainingAmount) {
      toast.error("Jumlah pembayaran melebihi sisa hutang/piutang!");
      return;
    }

    setSubmittingPayoff(true);
    try {
      const res = await fetch("/api/admin/marketplace/dashboard/debt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debtId: selectedDebt._id,
          paymentAmount: Number(payoffForm.paymentAmount),
        }),
      });

      if (res.ok) {
        toast.success("Pembayaran berhasil dicatat, arus kas ter-update!");
        setIsPayoffOpen(false);
        setSelectedDebt(null);
        setPayoffForm({ paymentAmount: "" });
        reloadData();
      } else {
        toast.error("Gagal mencatat pembayaran hutang");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kesalahan jaringan saat mencatat pembayaran");
    } finally {
      setSubmittingPayoff(false);
    }
  };

  // Record manual cashflow log
  const handleCreateCashflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashflowForm.amount || !cashflowForm.description) {
      toast.error("Mohon lengkapi nominal dan keterangan transaksi");
      return;
    }

    setSubmittingCashflow(true);
    try {
      const res = await fetch("/api/admin/marketplace/dashboard/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cashflowForm,
          storeId: selectedStoreId,
          amount: Number(cashflowForm.amount),
        }),
      });

      if (res.ok) {
        toast.success("Transaksi kas berhasil dicatat!");
        setIsNewCashflowOpen(false);
        setCashflowForm({
          type: "in",
          amount: "",
          category: "sale",
          description: "",
        });
        reloadData();
      } else {
        toast.error("Gagal mencatat transaksi arus kas");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kesalahan jaringan saat mencatat arus kas");
    } finally {
      setSubmittingCashflow(false);
    }
  };

  // Dynamic statistics cards config
  const statCards = dashboardData
    ? [
        {
          label: "Total Penjualan Hari Ini",
          value: formatCurrency(dashboardData.stats?.todaySales || 0),
          subtitle: `${dashboardData.stats?.todaySalesCount || 0} transaksi berhasil`,
          icon: DollarSign,
          color:
            "from-emerald-500/20 to-teal-500/5 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5",
        },
        {
          label: "Jumlah Transaksi (30 Hari)",
          value: `${dashboardData.stats?.transactionCount || 0} Kali`,
          subtitle: "Transaksi pelanggan terdaftar",
          icon: ShoppingCart,
          color:
            "from-indigo-500/20 to-purple-500/5 text-indigo-500 border-indigo-500/20 shadow-indigo-500/5",
        },
        {
          label: "Stok Menipis (Peringatan)",
          value: `${dashboardData.stats?.lowStockCount || 0} Produk`,
          subtitle: "Produk dengan stok < 15 unit",
          icon: Package,
          color:
            dashboardData.stats?.lowStockCount > 0
              ? "from-amber-500/20 to-orange-500/5 text-amber-500 border-amber-500/20 shadow-amber-500/5 animate-pulse"
              : "from-slate-500/20 to-slate-500/5 text-muted-foreground border-border shadow-sm",
        },
        {
          label: "Saldo Kas & Sederhana",
          value: formatCurrency(dashboardData.stats?.totalBalance || 0),
          subtitle: `Arus bersih: ${dashboardData.stats?.netCashflowMonth >= 0 ? "+" : ""}${formatCurrency(dashboardData.stats?.netCashflowMonth || 0)}`,
          icon: Coins,
          color:
            "from-violet-500/20 to-fuchsia-500/5 text-violet-500 border-violet-500/20 shadow-violet-500/5",
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent-dynamic animate-pulse" />
              Marketplace Overview
            </h1>
            <p className="text-muted-foreground mt-1 font-medium text-sm">
              Ringkasan performa penjualan, hutang pelanggan, dan cashflow toko
              kelontong: {dashboardData?.currentStoreName || "Memuat..."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Store Switcher for Super Admin */}
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider hidden sm:inline">
                  Pilih Toko:
                </span>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic transition-all cursor-pointer text-foreground"
                >
                  <option value="all">Semua Toko (Konsolidasi)</option>
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={reloadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw
                className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Admin Dashboard View */}
      <>
        {/* Stats Cards Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {loading && !dashboardData
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-2xl animate-pulse h-32 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-slate-200/20 dark:bg-slate-700/20 mix-blend-overlay" />
                </div>
              ))
            : statCards.map((stat, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={cn(
                    "glass-panel p-6 rounded-2xl flex flex-col justify-between border bg-gradient-to-br shadow-md relative overflow-hidden transition-all duration-300",
                    stat.color,
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">
                      {stat.label}
                    </h3>
                    <div className="w-8 h-8 rounded-lg bg-card/65 flex items-center justify-center border border-border shadow-sm shrink-0">
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none mb-1">
                      {stat.value}
                    </p>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                      {stat.subtitle}
                    </span>
                  </div>
                </motion.div>
              ))}
        </motion.div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Left Column - Financial Graphs, Debts, Cashflow Ledger */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Sales Turnover and Cashflow Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="glass-panel p-6 rounded-2xl sm:rounded-3xl border border-border/50 shadow-lg bg-card/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    Grafik Penjualan & Aliran Kas
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Visualisasi omzet turnover dan pergerakan kas masuk vs
                    keluar 30 hari terakhir.
                  </p>
                </div>

                {/* Tabs Toggle */}
                <div className="flex p-0.5 rounded-lg bg-muted border border-border w-fit text-[10px] font-bold">
                  <button
                    onClick={() => setChartTab("omzet")}
                    className={cn(
                      "px-3 py-1.5 rounded-md transition-all uppercase tracking-widest",
                      chartTab === "omzet"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Turnover (Omzet)
                  </button>
                  <button
                    onClick={() => setChartTab("cashflow")}
                    className={cn(
                      "px-3 py-1.5 rounded-md transition-all uppercase tracking-widest",
                      chartTab === "cashflow"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Arus Kas (Cashflow)
                  </button>
                </div>
              </div>

              <div className="h-[280px] w-full mt-4">
                {loading && !dashboardData ? (
                  <div className="w-full h-full animate-pulse rounded-2xl bg-muted/20" />
                ) : dashboardData?.chartData?.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <TrendingUp className="w-8 h-8 text-muted-foreground opacity-25 mb-2" />
                    <p className="text-xs font-bold text-muted-foreground">
                      Belum ada data grafik
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTab === "omzet" ? (
                      <AreaChart
                        data={dashboardData.chartData}
                        margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorOmzet"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--accent-glow)"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--accent-glow)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border)"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                          tickFormatter={(val) => `Rp ${val / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            "Omzet",
                          ]}
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            borderColor: "var(--border)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="omzet"
                          stroke="var(--accent-dynamic)"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorOmzet)"
                          name="Turnover Penjualan"
                        />
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={dashboardData.chartData}
                        margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border)"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                          tickFormatter={(val) => `Rp ${val / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            name === "cashIn"
                              ? "Kas Masuk (In)"
                              : "Kas Keluar (Out)",
                          ]}
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            borderColor: "var(--border)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        />
                        <Bar
                          dataKey="cashIn"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          name="Kas Masuk"
                        />
                        <Bar
                          dataKey="cashOut"
                          fill="#f43f5e"
                          radius={[4, 4, 0, 0]}
                          name="Kas Keluar"
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Customer Debt & Receivables Ledger */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="glass-panel rounded-2xl sm:rounded-3xl border border-border/50 shadow-lg bg-card/40 overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    Hutang & Piutang Pelanggan
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Catat dan lacak pembayaran piutang pembeli atau hutang toko
                    ke pihak ketiga.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewDebtOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-600/10 self-start"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat Hutang Baru
                </button>
              </div>

              <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                <div className="p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Piutang (Pelanggan Owes Store)
                  </p>
                  <h4 className="text-lg font-black text-emerald-500 mt-1">
                    {formatCurrency(
                      dashboardData?.stats?.totalReceivables || 0,
                    )}
                  </h4>
                </div>
                <div className="p-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Hutang Toko (Store Owes Supplier)
                  </p>
                  <h4 className="text-lg font-black text-rose-500 mt-1">
                    {formatCurrency(dashboardData?.stats?.totalPayables || 0)}
                  </h4>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading && !dashboardData ? (
                  <div className="p-10 text-center animate-pulse text-xs text-muted-foreground uppercase tracking-widest font-black">
                    Memuat buku hutang...
                  </div>
                ) : !dashboardData?.activeDebts ||
                  dashboardData.activeDebts.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold text-muted-foreground">
                    Tidak ada catatan hutang/piutang yang aktif. Semua lunas!
                  </div>
                ) : (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-foreground">
                          Klien
                        </th>
                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-foreground">
                          Tipe
                        </th>
                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-foreground">
                          Nominal
                        </th>
                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-foreground">
                          Sisa
                        </th>
                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-foreground">
                          Jatuh Tempo
                        </th>
                        <th className="px-5 py-3.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {dashboardData.activeDebts.map((debt: any) => (
                        <tr
                          key={debt._id}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-5 py-4 font-bold text-foreground">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
                                {debt.customerName
                                  ?.substring(0, 2)
                                  ?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold truncate max-w-[120px]">
                                  {debt.customerName}
                                </p>
                                <span className="text-[9px] text-muted-foreground font-medium block truncate max-w-[120px]">
                                  {debt.description || "Tanpa keterangan"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "inline-flex px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider",
                                debt.type === "receivable"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                              )}
                            >
                              {debt.type === "receivable"
                                ? "Piutang"
                                : "Hutang"}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-black text-foreground">
                            {formatCurrency(debt.amount)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <p className="font-black text-foreground">
                                {formatCurrency(debt.remainingAmount)}
                              </p>
                              <span
                                className={cn(
                                  "text-[8px] font-black uppercase tracking-wider block mt-0.5",
                                  debt.status === "unpaid"
                                    ? "text-rose-500 animate-pulse"
                                    : "text-amber-500",
                                )}
                              >
                                {debt.status === "unpaid"
                                  ? "Belum Bayar"
                                  : "Sebagian"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-bold text-muted-foreground">
                            {new Date(debt.dueDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedDebt(debt);
                                setPayoffForm({
                                  paymentAmount:
                                    debt.remainingAmount.toString(),
                                });
                                setIsPayoffOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-wider transition-all"
                            >
                              Bayar Cicil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>

            {/* Simple Cashflow Ledger */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-panel rounded-2xl sm:rounded-3xl border border-border/50 shadow-lg bg-card/40 overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-500" />
                    Buku Kas Arus Sederhana (Cashflow)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Catatan harian uang masuk dan uang keluar untuk memantau
                    likuiditas.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewCashflowOpen(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/10 self-start"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat Transaksi Kas
                </button>
              </div>

              <div className="p-4 divide-y divide-border/40">
                {loading && !dashboardData ? (
                  <div className="py-10 text-center animate-pulse text-xs text-muted-foreground uppercase tracking-widest font-black">
                    Memuat buku kas...
                  </div>
                ) : !dashboardData?.recentCashflow ||
                  dashboardData.recentCashflow.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-muted-foreground">
                    Belum ada pergerakan kas tercatat.
                  </div>
                ) : (
                  dashboardData.recentCashflow.map((entry: any) => (
                    <div
                      key={entry._id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-muted/10 px-2 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                            entry.type === "in"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                          )}
                        >
                          {entry.type === "in" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground text-xs truncate leading-snug">
                            {entry.description}
                          </h4>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">
                            {entry.category} ·{" "}
                            {new Date(entry.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "font-black text-xs shrink-0",
                          entry.type === "in"
                            ? "text-emerald-500"
                            : "text-rose-500",
                        )}
                      >
                        {entry.type === "in" ? "+" : "-"}
                        {formatCurrency(entry.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Best Selling Products & Low Stock Alerts */}
          <div className="space-y-6 sm:space-y-8">
            {/* Best Selling Products Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="glass-panel p-6 rounded-2xl sm:rounded-3xl border border-border/50 shadow-lg bg-card/40"
            >
              <div className="mb-5">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent-dynamic" />
                  Produk Terlaris (30 Hari)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Peringkat produk dengan volume penjualan tertinggi.
                </p>
              </div>

              <div className="space-y-4">
                {loading && !dashboardData ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse bg-muted/20 rounded-xl"
                    />
                  ))
                ) : !dashboardData?.bestSellers ||
                  dashboardData.bestSellers.length === 0 ? (
                  <div className="py-10 text-center text-xs font-bold text-muted-foreground">
                    Belum ada penjualan produk tercatat.
                  </div>
                ) : (
                  dashboardData.bestSellers.map((item: any, idx: number) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 p-2 hover:bg-muted/10 rounded-xl transition-all"
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border",
                          idx === 0
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : idx === 1
                              ? "bg-slate-300/20 text-slate-400 border-slate-300/20"
                              : idx === 2
                                ? "bg-amber-700/10 text-amber-700 border-amber-700/20"
                                : "bg-card text-muted-foreground border-border",
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-xs truncate leading-snug">
                          {item.name}
                        </h4>
                        <span className="text-[9px] text-muted-foreground font-semibold block mt-0.5">
                          Terjual: {item.totalSold} unit
                        </span>
                      </div>
                      <span className="font-black text-xs text-foreground shrink-0">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Low Stock Alerts Card with Quick Refill Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="glass-panel p-6 rounded-2xl sm:rounded-3xl border border-border/50 shadow-lg bg-card/40"
              id="low-stock-panel"
            >
              <div className="mb-5">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Stok Menipis (Alert!)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Segera isi ulang stok produk di bawah ini untuk mencegah
                  kehabisan barang.
                </p>
              </div>

              <div className="space-y-4">
                {loading && !dashboardData ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse bg-muted/20 rounded-xl"
                    />
                  ))
                ) : !dashboardData?.lowStockProducts ||
                  dashboardData.lowStockProducts.length === 0 ? (
                  <div className="py-10 text-center text-xs font-bold text-emerald-500 flex flex-col items-center justify-center gap-2">
                    <Check className="w-8 h-8 rounded-full bg-emerald-500/10 p-1.5" />
                    <span>Semua aman! Tidak ada stok yang menipis.</span>
                  </div>
                ) : (
                  dashboardData.lowStockProducts.map((product: any) => (
                    <div
                      key={product._id}
                      className="p-3 border border-border/60 hover:border-border rounded-xl bg-card/20 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground text-xs truncate leading-snug">
                            {product.name}
                          </h4>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">
                            {product.category} · {formatCurrency(product.price)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0",
                            product.stock <= 5
                              ? "bg-rose-500/15 text-rose-500 border-rose-500/25 animate-bounce"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20",
                          )}
                        >
                          Sisa {product.stock}
                        </span>
                      </div>

                      {/* Interactive Quick Refill Widget */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                        <input
                          type="number"
                          placeholder="+ Tambah stok (e.g. 50)"
                          value={refillStockInput[product._id] || ""}
                          onChange={(e) =>
                            setRefillStockInput((prev) => ({
                              ...prev,
                              [product._id]: e.target.value,
                            }))
                          }
                          disabled={refillingId === product._id}
                          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-accent-dynamic font-bold"
                        />
                        <button
                          onClick={() =>
                            handleRefillStock(product._id, product.stock)
                          }
                          disabled={refillingId === product._id}
                          className="bg-foreground text-background p-1.5 rounded-lg hover:bg-foreground/90 transition-all shadow-md shadow-foreground/10 shrink-0"
                          aria-label="Refill Stock"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* 1. Modal: Record New Debt */}
        {isNewDebtOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="mb-5">
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Catat Hutang / Piutang Baru
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tambahkan catatan hutang supplier atau piutang pelanggan.
                </p>
              </div>

              <form onSubmit={handleCreateDebt} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                    Nama Klien / Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    value={debtForm.customerName}
                    onChange={(e) =>
                      setDebtForm({ ...debtForm, customerName: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic text-foreground"
                    placeholder="Nama lengkap klien..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                      Tipe Pencatatan *
                    </label>
                    <select
                      value={debtForm.type}
                      onChange={(e) =>
                        setDebtForm({ ...debtForm, type: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic cursor-pointer text-foreground"
                    >
                      <option value="receivable">
                        Piutang (Pembeli owes store)
                      </option>
                      <option value="payable">
                        Hutang Toko (Store owes supplier)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                      Nominal Rupiah (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      value={debtForm.amount}
                      onChange={(e) =>
                        setDebtForm({ ...debtForm, amount: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic text-foreground"
                      placeholder="150000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                    Tanggal Jatuh Tempo *
                  </label>
                  <input
                    type="date"
                    required
                    value={debtForm.dueDate}
                    onChange={(e) =>
                      setDebtForm({ ...debtForm, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                    Deskripsi / Keterangan Belanja
                  </label>
                  <textarea
                    value={debtForm.description}
                    onChange={(e) =>
                      setDebtForm({ ...debtForm, description: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic text-foreground h-16 resize-none"
                    placeholder="Contoh: Belanja beras premium 2 sak..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsNewDebtOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDebt}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
                  >
                    {submittingDebt ? "Menyimpan..." : "Simpan Catatan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 2. Modal: Record Cashflow Entry */}
        {isNewCashflowOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="mb-5">
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Catat Transaksi Buku Kas
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Catat uang masuk atau pengeluaran operasional toko kelontong.
                </p>
              </div>

              <form onSubmit={handleCreateCashflow} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                      Arah Kas (Type) *
                    </label>
                    <select
                      value={cashflowForm.type}
                      onChange={(e) =>
                        setCashflowForm({
                          ...cashflowForm,
                          type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic cursor-pointer text-foreground"
                    >
                      <option value="in">Uang Masuk (Cash-In)</option>
                      <option value="out">
                        Uang Keluar (Cash-Out / Expense)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                      Kategori Transaksi *
                    </label>
                    <select
                      value={cashflowForm.category}
                      onChange={(e) =>
                        setCashflowForm({
                          ...cashflowForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic cursor-pointer text-foreground"
                    >
                      <option value="sale">Penjualan (Sales)</option>
                      <option value="purchase">
                        Kulakan Stok (Supply Buy)
                      </option>
                      <option value="operational">
                        Biaya Operasional (Listrik/Air/Gaji)
                      </option>
                      <option value="other">Lain-lain (Other Entries)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                    Nominal Rupiah (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={cashflowForm.amount}
                    onChange={(e) =>
                      setCashflowForm({
                        ...cashflowForm,
                        amount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic text-foreground"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                    Keterangan Transaksi *
                  </label>
                  <textarea
                    required
                    value={cashflowForm.description}
                    onChange={(e) =>
                      setCashflowForm({
                        ...cashflowForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic text-foreground h-20 resize-none"
                    placeholder="Contoh: Bayar tagihan listrik PLN bulan Mei..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsNewCashflowOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCashflow}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                  >
                    {submittingCashflow ? "Menyimpan..." : "Catat Transaksi"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 3. Modal: Payoff Debt / Receivable */}
        {isPayoffOpen && selectedDebt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Bayar / Lunasi Catatan
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lakukan cicilan atau pelunasan untuk{" "}
                  {selectedDebt.type === "receivable" ? "piutang" : "hutang"}{" "}
                  {selectedDebt.customerName}.
                </p>
              </div>

              <div className="bg-muted/50 border border-border p-4 rounded-2xl mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-muted-foreground">
                  <span>Nama Klien:</span>
                  <span className="text-foreground">
                    {selectedDebt.customerName}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-muted-foreground">
                  <span>Total Awal:</span>
                  <span className="text-foreground">
                    {formatCurrency(selectedDebt.amount)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-indigo-500">
                  <span>Sisa Hutang:</span>
                  <span>{formatCurrency(selectedDebt.remainingAmount)}</span>
                </div>
              </div>

              <form onSubmit={handlePayoffDebt} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                    Nominal Pembayaran (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={payoffForm.paymentAmount}
                    onChange={(e) =>
                      setPayoffForm({
                        ...payoffForm,
                        paymentAmount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-accent-dynamic text-foreground"
                    placeholder="Nominal pembayaran..."
                  />
                  <div className="flex justify-end gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPayoffForm({
                          paymentAmount:
                            selectedDebt.remainingAmount.toString(),
                        })
                      }
                      className="text-[9px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-wider"
                    >
                      Bayar Lunas (Full)
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPayoffOpen(false);
                      setSelectedDebt(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayoff}
                    className="bg-foreground text-background px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-foreground/10 disabled:opacity-50"
                  >
                    {submittingPayoff ? "Memproses..." : "Konfirmasi Bayar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
