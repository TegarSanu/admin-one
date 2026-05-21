"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Plus,
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import OrdersTable from "@/components/admin/OrdersTable";

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: any[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        ...(statusFilter && { status: statusFilter }),
        ...(paymentStatusFilter && { paymentStatus: paymentStatusFilter }),
      });

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        toast.error("Gagal memuat pesanan");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, statusFilter, paymentStatusFilter]);

  const handleExport = () => {
    const csv = [
      [
        "Nomor Pesanan",
        "Pelanggan",
        "Total",
        "Status",
        "Status Bayar",
        "Tanggal",
      ],
      ...orders.map((o) => [
        o.orderNumber,
        o.customerName,
        formatCurrency(o.totalAmount),
        o.orderStatus,
        o.paymentStatus,
        new Date(o.createdAt).toLocaleDateString("id-ID"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Pesanan
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Kelola semua pesanan di marketplace.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"}
            />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors text-foreground"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-3xl"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Total Pesanan
          </p>
          <h3 className="text-2xl font-black text-foreground">
            {orders.length}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-3xl"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Menunggu Bayar
          </p>
          <h3 className="text-2xl font-black text-amber-600">
            {orders.filter((o) => o.paymentStatus === "pending").length}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-3xl"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Proses
          </p>
          <h3 className="text-2xl font-black text-blue-600">
            {orders.filter((o) => o.orderStatus === "processing").length}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-3xl"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Total Revenue
          </p>
          <h3 className="text-2xl font-black text-emerald-600">
            {formatCurrency(
              orders
                .filter((o) => o.paymentStatus === "completed")
                .reduce((sum, o) => sum + o.totalAmount, 0),
            )}
          </h3>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-3xl p-4 border border-border/50 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nomor pesanan atau pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="processing">Diproses</option>
          <option value="shipped">Dikirim</option>
          <option value="delivered">Sampai</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>

        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="px-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10"
        >
          <option value="">Semua Status Bayar</option>
          <option value="pending">Menunggu Bayar</option>
          <option value="completed">Bayar Diterima</option>
          <option value="failed">Gagal</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-3xl border border-border/50 overflow-hidden">
        <OrdersTable
          orders={orders}
          loading={loading}
          onViewDetails={(order) => {
            setSelectedOrder(order);
            setShowDetailModal(true);
          }}
        />
      </div>
    </div>
  );
}
