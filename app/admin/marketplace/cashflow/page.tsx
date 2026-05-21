"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Download,
  Activity,
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

const categoryLabel: Record<string, { label: string; emoji: string }> = {
  sale: { label: "Penjualan", emoji: "💰" },
  purchase: { label: "Pembelian", emoji: "📦" },
  operational: { label: "Operasional", emoji: "⚙️" },
  other: { label: "Lainnya", emoji: "📋" },
};

type ChartTab = "daily" | "category";

export default function CashflowPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const [chartTab, setChartTab] = useState<ChartTab>("daily");

  const isSuperAdmin =
    user?.role?.name === "Super Admin" || user?.role?.name === "Administrator";

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

  const fetchCashflowData = async (storeId: string) => {
    setLoading(true);
    try {
      const url =
        storeId === "all"
          ? "/api/marketplace/cashflow"
          : `/api/marketplace/cashflow?storeId=${storeId}`;
      const res = await fetch(url);
      if (res.ok) {
        const cashflowData = await res.json();
        setData(cashflowData);
      } else {
        toast.error("Gagal memuat data cashflow");
      }
    } catch (err) {
      console.error("Failed to fetch cashflow data:", err);
      toast.error("Terjadi kesalahan saat memuat cashflow");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStores();
    }
    fetchCashflowData(selectedStoreId);
  }, [selectedStoreId, isSuperAdmin]);

  const handleRefresh = () => {
    fetchCashflowData(selectedStoreId);
  };

  const handleDownload = () => {
    if (!data) return;
    const csv = [
      ["Laporan Cashflow Marketplace"],
      ["Tanggal", new Date().toLocaleDateString("id-ID")],
      [],
      ["Metrik", "Nilai"],
      ["Total Pemasukan", data.stats?.totalIn || 0],
      ["Total Pengeluaran", data.stats?.totalOut || 0],
      ["Laba Bersih", data.stats?.netIncome || 0],
      [],
      ["Kategori", "Masuk", "Keluar", "Jumlah Transaksi"],
    ];

    if (data.categoryBreakdown) {
      Object.entries(data.categoryBreakdown).forEach(
        ([cat, values]: [string, any]) => {
          csv.push([
            categoryLabel[cat]?.label || cat,
            values.in,
            values.out,
            values.count,
          ]);
        },
      );
    }

    const csvContent = csv
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashflow-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading && !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
        <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
          Memuat laporan cashflow...
        </p>
      </div>
    );
  }

  if (!data || !data.stats) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl bg-card border border-border/50">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
          <h3 className="text-lg font-black text-foreground">Belum Ada Data</h3>
          <p className="text-sm text-muted-foreground">
            Data cashflow akan muncul setelah ada transaksi.
          </p>
        </div>
      </div>
    );
  }

  const { stats, categoryBreakdown, dailyData, records } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Laporan Cashflow
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Pantau arus kas masuk dan keluar dari marketplace Anda
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors border border-border"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* Store Filter (Super Admin only) */}
      {isSuperAdmin && stores.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          <label className="text-sm font-bold text-muted-foreground">
            Filter Toko:
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="all">Semua Toko</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.name}
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="p-6 rounded-2xl border border-border/50 bg-card space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Pemasukan
            </span>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {formatCurrency(stats.totalIn)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-border/50 bg-card space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Pengeluaran
            </span>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {formatCurrency(stats.totalOut)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-border/50 bg-card space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Laba Bersih
            </span>
            <div
              className={cn(
                "p-2.5 rounded-lg",
                stats.netIncome >= 0
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600",
              )}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p
            className={cn(
              "text-2xl font-black",
              stats.netIncome >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {formatCurrency(stats.netIncome)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-border/50 bg-card space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Transaksi
            </span>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {stats.totalTransactions}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Chart Tabs */}
        {(dailyData || categoryBreakdown) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
            <button
              onClick={() => setChartTab("daily")}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                chartTab === "daily"
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Grafik Harian
            </button>
            <button
              onClick={() => setChartTab("category")}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                chartTab === "category"
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Breakdown Kategori
            </button>
          </motion.div>
        )}

        {/* Daily Chart */}
        {chartTab === "daily" && dailyData && dailyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <h3 className="text-sm font-black text-foreground mb-4">
              Arus Kas Harian
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="in"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIn)"
                  name="Pemasukan"
                />
                <Area
                  type="monotone"
                  dataKey="out"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#colorOut)"
                  name="Pengeluaran"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Category Chart */}
        {chartTab === "category" &&
          categoryBreakdown &&
          Object.keys(categoryBreakdown).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <h3 className="text-sm font-black text-foreground mb-4">
                Breakdown Kategori
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(categoryBreakdown).map(
                    ([category, values]: [string, any]) => ({
                      name: categoryLabel[category]?.label || category,
                      Masuk: values.in,
                      Keluar: values.out,
                    }),
                  )}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="Masuk" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Keluar" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
      </div>

      {/* Category Cards */}
      {categoryBreakdown && Object.keys(categoryBreakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {Object.entries(categoryBreakdown).map(
            ([cat, val]: [string, any]) => {
              const info = categoryLabel[cat] || categoryLabel.other;
              return (
                <div
                  key={cat}
                  className="p-4 rounded-xl bg-card border border-border/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>{info.emoji}</span> {info.label}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {val.count}x
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs font-bold">
                    <div className="flex-1">
                      <p className="text-muted-foreground mb-1">Masuk</p>
                      <p className="text-emerald-600">
                        {formatCurrency(val.in)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-muted-foreground mb-1">Keluar</p>
                      <p className="text-rose-600">{formatCurrency(val.out)}</p>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </motion.div>
      )}

      {/* Recent Transactions */}
      {records && records.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-border/50 space-y-4"
        >
          <h3 className="text-sm font-black text-foreground">
            Transaksi Terbaru
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left py-3 px-3 font-bold">Keterangan</th>
                  <th className="text-center py-3 px-3 font-bold">Kategori</th>
                  <th className="text-right py-3 px-3 font-bold">Nominal</th>
                  <th className="text-left py-3 px-3 font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 10).map((record: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-foreground">
                      {record.description}
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-xs font-bold">
                        {categoryLabel[record.category]?.emoji}
                        {categoryLabel[record.category]?.label ||
                          record.category}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "text-right py-3 px-3 font-bold",
                        record.type === "in"
                          ? "text-emerald-600"
                          : "text-rose-600",
                      )}
                    >
                      {record.type === "in" ? "+" : "-"}
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">
                      {new Date(record.createdAt).toLocaleDateString("id-ID", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
