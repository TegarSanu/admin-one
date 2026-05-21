"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Search, Plus, RefreshCw, Package, Trash2, X, Store as StoreIcon, Pencil, Layers, Tag, Grid } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  out_of_stock: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  archived: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  draft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    storeId: "",
    description: "",
    status: "available",
    visibility: "public",
  });

  const resetForm = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      price: "",
      stock: "",
      category: "",
      storeId: "",
      description: "",
      status: "available",
      visibility: "public",
    });
  };

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/marketplace/products?search=${encodeURIComponent(searchQuery)}&storeId=${encodeURIComponent(storeFilter)}`).then((r) => r.json()),
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

  const openProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product._id);
      setForm({
        name: product.name || "",
        price: product.price?.toString() ?? "",
        stock: product.stock?.toString() ?? "",
        category: product.category || "",
        storeId: product.storeId?._id || product.storeId || "",
        description: product.description || "",
        status: product.status || "available",
        visibility: product.visibility || "public",
      });
    } else {
      resetForm();
    }
    setIsAddOpen(true);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    try {
      await fetch(`/api/admin/marketplace/products/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        storeId: form.storeId,
        description: form.description,
        status: form.status,
        visibility: form.visibility,
      };

      const url = editingProduct
        ? `/api/admin/marketplace/products/${editingProduct}`
        : "/api/admin/marketplace/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsAddOpen(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockCount = products.filter((product) => product.stock <= (product.minStockLevel || 10)).length;

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Semua Produk</h1>
          <p className="text-muted-foreground mt-1 font-medium">Kelola semua produk marketplace dengan jelas dan cepat.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-all text-muted-foreground hover:text-foreground hover:scale-105"
          >
            <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          </button>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="bg-muted text-foreground text-xs font-bold px-4 py-2.5 rounded-xl border border-border outline-none hover:border-border/80 transition-all"
          >
            <option value="">Semua Toko</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
          >
            <Plus className="w-4 h-4" />Tambah Produk
          </button>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, staggerChildren: 0.1 }}
      >
        {[
          {
            label: "Total Produk",
            value: products.length,
            icon: ShoppingCart,
            description: "Semua item"
          },
          {
            label: "Stok Rendah",
            value: lowStockCount,
            icon: Tag,
            description: "Perlu perhatian"
          },
          {
            label: "Tersedia",
            value: products.filter((p) => p.status === "available").length,
            icon: Layers,
            description: "Produk aktif"
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            className="glass-panel p-6 rounded-3xl border border-border/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
                <p className="text-xs font-medium text-muted-foreground mt-2">{stat.description}</p>
              </div>
              <div className="p-3 rounded-2xl bg-foreground/5">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="glass-panel rounded-3xl overflow-hidden border border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {products.length} produk ditemukan
          </div>
        </div>

        <div className="overflow-x-auto min-h-[420px]">
          {loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Memuat produk...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Package className="w-10 h-10 text-muted-foreground opacity-20" />
              <p className="text-sm font-black text-foreground">Tidak ada produk</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Tambahkan produk baru untuk mulai menjual</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="divide-y divide-border/50">
                {products.map((product, idx) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="border-b border-border/30 last:border-0"
                  >
                    <div className="p-5 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-center">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-foreground text-sm">{product.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{product.category || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StoreIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-bold text-foreground">{product.storeId?.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Harga</span>
                          <span className="font-black text-foreground">{formatCurrency(product.price)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusClasses[product.status] ?? statusClasses.draft}`}>
                          {product.status?.replaceAll("_", " ")}
                        </span>
                        <span className="inline-flex px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                          Stok: {product.stock}
                        </span>
                        <button
                          onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-all"
                        >
                          <Grid className="w-3.5 h-3.5" /> Detail
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedProduct === product._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-muted/10 px-5 pb-5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Deskripsi</p>
                              <p className="text-sm text-foreground">{product.description || "Tidak ada deskripsi."}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Visibilitas</p>
                              <p className="text-sm text-foreground">{product.visibility}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Diskon</p>
                              <p className="text-sm text-foreground">{product.discount ? `${product.discount}%` : "Tidak ada"}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 justify-end">
                            <button
                              onClick={() => openProductModal(product)}
                              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-blue-500 hover:bg-blue-500/10 transition-all"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => deleteProduct(product._id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-500 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsAddOpen(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel rounded-3xl p-8 w-full max-w-xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">
                    {editingProduct ? "Edit Produk" : "Tambah Produk"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editingProduct
                      ? "Perbarui informasi produk marketplace"
                      : "Isi detail produk untuk ditambahkan ke marketplace"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nama Produk *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                      placeholder="Beras Premium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Toko *</label>
                    <select
                      required
                      value={form.storeId}
                      onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                    >
                      <option value="">Pilih toko...</option>
                      {stores.map((store) => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Harga *</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Stok *</label>
                    <input
                      type="number"
                      required
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Kategori *</label>
                    <input
                      type="text"
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                      placeholder="Sembako"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                    >
                      <option value="available">Available</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="archived">Archived</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Visibilitas</label>
                    <select
                      value={form.visibility}
                      onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Deskripsi</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all resize-none"
                    placeholder="Deskripsi singkat produk..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddOpen(false);
                      resetForm();
                    }}
                    className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan..." : editingProduct ? "Update Produk" : "Simpan Produk"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
