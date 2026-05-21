"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Loader2, TrendingUp, TrendingDown, DollarSign,
  ArrowUpRight, ArrowDownRight, Calendar, Activity, PieChart,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CashflowTabProps {
  apiBase: string;
}

const categoryLabel: Record<string, { label: string; emoji: string }> = {
  sale: { label: "Penjualan", emoji: "💰" },
  purchase: { label: "Pembelian", emoji: "📦" },
  operational: { label: "Operasional", emoji: "⚙️" },
  other: { label: "Lainnya", emoji: "📋" },
};

export default function CashflowTab({ apiBase }: CashflowTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCashflow = () => {
    setLoading(true);
    fetch(`${apiBase}/cashflow`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCashflow();
  }, [apiBase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Memuat laporan...</p>
      </div>
    );
  }

  if (!data || !data.stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl bg-card border border-border/50">
        <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
        <h3 className="text-lg font-black text-foreground">Belum Ada Data</h3>
        <p className="text-sm text-muted-foreground">Data cashflow akan muncul setelah ada transaksi.</p>
      </div>
    );
  }

  const { stats, categoryBreakdown, dailyData, records } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          Laporan Cashflow
        </h3>
        <button
          onClick={fetchCashflow}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Pemasukan"
          value={formatCurrency(stats.totalIn)}
          icon={TrendingUp}
          color="emerald"
          delay={0}
        />
        <MetricCard
          label="Total Pengeluaran"
          value={formatCurrency(stats.totalOut)}
          icon={TrendingDown}
          color="rose"
          delay={0.1}
        />
        <MetricCard
          label="Laba Bersih"
          value={formatCurrency(stats.netIncome)}
          icon={DollarSign}
          color={stats.netIncome >= 0 ? "emerald" : "rose"}
          delay={0.2}
        />
        <MetricCard
          label="Total Transaksi"
          value={stats.totalTransactions.toString()}
          icon={Activity}
          color="blue"
          delay={0.3}
        />
      </div>

      {/* Chart */}
      {dailyData && dailyData.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Grafik Harian
          </h4>
          <CashflowChart data={dailyData} />
        </div>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown && Object.keys(categoryBreakdown).length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5" /> Breakdown Kategori
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(categoryBreakdown).map(([cat, val]: [string, any]) => {
              const info = categoryLabel[cat] || categoryLabel.other;
              const total = val.in + val.out;
              const inPct = total > 0 ? (val.in / total) * 100 : 0;
              return (
                <div key={cat} className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>{info.emoji}</span> {info.label}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">{val.count} transaksi</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> {formatCurrency(val.in)}
                    </span>
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3" /> {formatCurrency(val.out)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${inPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Records */}
      {records && records.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Catatan Terbaru
          </h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {records.slice(0, 20).map((rec: any, idx: number) => {
              const date = new Date(rec.date || rec.createdAt);
              const isIn = rec.type === "in";
              return (
                <motion.div
                  key={rec._id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isIn ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {isIn ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{rec.description || rec.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {rec.storeId?.name || "—"}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-black shrink-0",
                    isIn ? "text-emerald-500" : "text-rose-400"
                  )}>
                    {isIn ? "+" : "-"}{formatCurrency(rec.amount)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Metric Card ─────────────────────────────────────── */
function MetricCard({
  label, value, icon: Icon, color, delay,
}: {
  label: string; value: string; icon: any; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "p-4 rounded-2xl border bg-card space-y-2",
        color === "emerald" && "border-emerald-500/20",
        color === "rose" && "border-rose-500/20",
        color === "blue" && "border-blue-500/20",
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center",
        color === "emerald" && "bg-emerald-500/10 text-emerald-500",
        color === "rose" && "bg-rose-500/10 text-rose-400",
        color === "blue" && "bg-blue-500/10 text-blue-500",
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-foreground tracking-tight mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

/* ── SVG Chart ───────────────────────────────────────── */
function CashflowChart({ data }: { data: { date: string; in: number; out: number }[] }) {
  const W = 800;
  const H = 200;
  const PAD = 40;

  const maxVal = useMemo(() => {
    let m = 0;
    for (const d of data) {
      m = Math.max(m, d.in, d.out);
    }
    return m || 1;
  }, [data]);

  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const toY = (val: number) => PAD + chartH - (val / maxVal) * chartH;
  const toX = (i: number) => PAD + i * stepX;

  const inPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.in)}`).join(" ");
  const outPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.out)}`).join(" ");

  const inArea = `${inPath} L${toX(data.length - 1)},${H - PAD} L${PAD},${H - PAD} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ height: "auto" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = PAD + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="currentColor" strokeOpacity={0.06} strokeDasharray="4 4" />
              <text x={PAD - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontWeight={700}>
                {formatCurrency(maxVal * pct).replace("Rp", "").trim()}
              </text>
            </g>
          );
        })}

        {/* Date labels */}
        {data.map((d, i) => {
          if (data.length > 10 && i % Math.ceil(data.length / 7) !== 0) return null;
          const dateStr = new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          return (
            <text key={i} x={toX(i)} y={H - PAD + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={8} fontWeight={600}>
              {dateStr}
            </text>
          );
        })}

        {/* Income area fill */}
        <path d={inArea} fill="url(#incomeGrad)" opacity={0.15} />

        {/* Income line */}
        <path d={inPath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Expense line */}
        {data.some((d) => d.out > 0) && (
          <path d={outPath} fill="none" stroke="#f43f5e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
        )}

        {/* Income dots */}
        {data.map((d, i) => (
          <circle key={`in-${i}`} cx={toX(i)} cy={toY(d.in)} r={3} fill="#10b981" stroke="var(--card)" strokeWidth={2} />
        ))}

        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center mt-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="w-3 h-0.5 rounded-full bg-emerald-500 inline-block" /> Pemasukan
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="w-3 h-0.5 rounded-full bg-rose-400 inline-block border-dashed" /> Pengeluaran
        </span>
      </div>
    </div>
  );
}
