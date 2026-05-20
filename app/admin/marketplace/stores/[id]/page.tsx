"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Store as StoreIcon, ArrowLeft, MapPin, Phone, User, Package, Plus, Edit, Trash2, RefreshCw, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", price: "", stock: "", category: "", description: "" });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/marketplace/stores/${params.id}`).then(r => r.json()),
      fetch(`/api/admin/marketplace/products?storeId=${params.id}`).then(r => r.json()),
    ]).then(([storeData, productsData]) => {
      setStore(storeData.store);
      setProducts(productsData.products || []);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { if (params.id) fetchData(); }, [params.id]);

  const deleteProduct = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/admin/marketplace/products/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/marketplace/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productForm, price: Number(productForm.price), stock: Number(productForm.stock), storeId: params.id }),
      });
      if (res.ok) { setIsAddProductOpen(false); setProductForm({ name: "", price: "", stock: "", category: "", description: "" }); fetchData(); }
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
      <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Memuat detail toko...</p>
    </div>
  );

  if (!store) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <StoreIcon className="w-10 h-10 text-muted-foreground opacity-20" />
      <p className="text-sm font-black text-foreground">Toko tidak ditemukan</p>
      <button onClick={() => router.back()} className="text-xs font-bold text-muted-foreground hover:text-foreground">Kembali</button>
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 shrink-0">
        <button onClick={() => router.back()} className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{store.name}</h1>
          <p className="text-muted-foreground mt-1 font-medium">Detail dan inventori toko</p>
        </div>
        <button onClick={fetchData} className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Store Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-sm">{store.name?.substring(0, 2)?.toUpperCase()}</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
            <span className={`inline-flex px-2.5 py-1 rounded-md border font-black text-[10px] uppercase tracking-widest mt-1 ${store.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>{store.status}</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-muted-foreground" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pemilik</p></div>
          <p className="font-black text-foreground">{store.owner?.name || "Unknown"}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-muted-foreground" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lokasi</p></div>
          <p className="font-bold text-foreground text-sm">{store.address}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-muted-foreground" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Produk</p></div>
          <h3 className="text-2xl font-black text-foreground">{products.length}</h3>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-border/50">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Inventori Produk</h2>
          <button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10">
            <Plus className="w-4 h-4" />Tambah Produk
          </button>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Package className="w-10 h-10 text-muted-foreground opacity-20" />
              <p className="text-sm font-black text-foreground">Belum ada produk</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Mulai tambahkan produk pertama</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Produk</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Kategori</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Harga</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Stok</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center"><Package className="w-4 h-4 text-foreground" /></div>
                        <p className="font-black text-foreground text-sm">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-muted-foreground">{p.category}</td>
                    <td className="px-6 py-5 font-black text-foreground">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-5 font-bold text-foreground">{p.stock}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-md border font-black text-[10px] uppercase tracking-widest ${p.status === "available" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>{p.status?.replace("_", " ")}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => deleteProduct(p._id)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-muted-foreground hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-3xl p-8 w-full max-w-lg mx-4 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-xl font-black text-foreground tracking-tight">Tambah Produk</h2><p className="text-xs text-muted-foreground mt-1">Tambahkan produk baru ke toko ini</p></div>
              <button onClick={() => setIsAddProductOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nama Produk *</label><input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5" placeholder="Beras Premium 5kg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Harga *</label><input type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5" placeholder="50000" /></div>
                <div><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Stok *</label><input type="number" required value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5" placeholder="100" /></div>
              </div>
              <div><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Kategori *</label><input type="text" required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5" placeholder="Sembako" /></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAddProductOpen(false)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">Batal</button>
                <button type="submit" disabled={submitting} className="bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 disabled:opacity-50">{submitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
