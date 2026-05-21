"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Plus,
  RefreshCw,
  Package,
  Trash2,
  X,
  Store as StoreIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    storeId: "",
    description: "",
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(
        `/api/admin/marketplace/products?search=${searchQuery}&storeId=${storeFilter}`,
      ).then((r) => r.json()),
      fetch("/api/admin/marketplace/stores").then((r) => r.json()),
    ])
      .then(([pData, sData]) => {
        setProducts(pData.products || []);
        setStores(sData.stores || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    fetchData();
  }, [searchQuery, storeFilter]);

  const deleteProduct = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/admin/marketplace/products/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/marketplace/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setForm({
          name: "",
          price: "",
          stock: "",
          category: "",
          storeId: "",
          description: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Semua Produk
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Kelola semua produk di marketplace.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"}
            />
          </button>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="bg-muted text-foreground text-xs font-bold px-4 py-2.5 rounded-xl border border-border outline-none"
          >
            <option value="">Semua Toko</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Total Produk
          </p>
          <h3 className="text-2xl font-black text-foreground">
            {products.length}
          </h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Tersedia
          </p>
          <h3 className="text-2xl font-black text-foreground">
            {products.filter((p) => p.status === "available").length}
          </h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Stok Habis
          </p>
          <h3 className="text-2xl font-black text-foreground">
            {products.filter((p) => p.status === "out_of_stock").length}
          </h3>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-border/50">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          {loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Memuat produk...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Package className="w-10 h-10 text-muted-foreground opacity-20" />
              <p className="text-sm font-black text-foreground">
                Tidak ada produk
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Produk
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Toko
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Kategori
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Harga
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Stok
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center">
                          <Package className="w-4 h-4 text-foreground" />
                        </div>
                        <p className="font-black text-foreground text-sm">
                          {p.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <StoreIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-bold text-foreground">
                          {p.storeId?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-muted-foreground">
                      {p.category}
                    </td>
                    <td className="px-6 py-5 font-black text-foreground">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-6 py-5 font-bold text-foreground">
                      {p.stock}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md border font-black text-[10px] uppercase tracking-widest ${p.status === "available" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}
                      >
                        {p.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => deleteProduct(p._id)}
                        className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 bg-muted/10 border-t border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Menampilkan {products.length} produk
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl p-8 w-full max-w-lg mx-4 border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  Tambah Produk
                </h2>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-2 hover:bg-muted rounded-xl"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Nama *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                  placeholder="Beras Premium"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Toko *
                </label>
                <select
                  required
                  value={form.storeId}
                  onChange={(e) =>
                    setForm({ ...form, storeId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                >
                  <option value="">Pilih toko...</option>
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Harga *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Stok *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Kategori *
                </label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                  placeholder="Sembako"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 shadow-lg shadow-foreground/10 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
