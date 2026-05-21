"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Receipt, Loader2, Package, Banknote, Building2, Wallet,
  Calendar, User, Store as StoreIcon, ChevronDown, ChevronUp
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const paymentBadge: Record<string, { label: string; color: string; icon: any }> = {
  cash: { label: "Tunai", color: "emerald", icon: Banknote },
  transfer: { label: "Transfer", color: "blue", icon: Building2 },
  debt: { label: "Hutang", color: "amber", icon: Wallet },
};

interface HistoryTabProps {
  apiBase: string;
}

export default function HistoryTab({ apiBase }: HistoryTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/transactions`)
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiBase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Memuat riwayat...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl bg-card border border-border/50">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <Receipt className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-black text-foreground">Belum Ada Transaksi</h3>
        <p className="text-sm text-muted-foreground">Riwayat transaksi akan muncul setelah Anda melakukan checkout.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-500" />
          {transactions.length} Transaksi
        </h3>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.map((tx, idx) => {
          const pm = paymentBadge[tx.paymentMethod] || paymentBadge.cash;
          const PayIcon = pm.icon;
          const isExpanded = expandedId === tx._id;
          const date = new Date(tx.date || tx.createdAt);

          return (
            <motion.div
              key={tx._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl bg-card border border-border/50 overflow-hidden"
            >
              {/* Transaction Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : tx._id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  pm.color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                  pm.color === "blue" && "bg-blue-500/10 text-blue-500",
                  pm.color === "amber" && "bg-amber-500/10 text-amber-500",
                )}>
                  <PayIcon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">
                      {tx.customerName || "Guest"}
                    </p>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase",
                      pm.color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                      pm.color === "blue" && "bg-blue-500/10 text-blue-500",
                      pm.color === "amber" && "bg-amber-500/10 text-amber-500",
                    )}>
                      {pm.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <StoreIcon className="w-2.5 h-2.5" />
                      {tx.storeId?.name || "Toko"}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-500">{formatCurrency(tx.amount)}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded Items */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="border-t border-border/50"
                >
                  <div className="p-4 space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Detail Item</p>
                    {tx.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span className="text-foreground font-medium">{item.name}</span>
                          <span className="text-muted-foreground">x{item.quantity}</span>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-xs font-bold text-muted-foreground">Total</span>
                      <span className="text-sm font-black text-emerald-500">{formatCurrency(tx.amount)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
