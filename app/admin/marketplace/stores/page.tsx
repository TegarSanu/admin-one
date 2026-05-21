"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Store as StoreIcon,
  Search,
  Plus,
  RefreshCw,
  MapPin,
  ArrowRight,
  Trash2,
  Phone,
  X,
} from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Store form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    owner: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const fetchStores = () => {
    setLoading(true);
    fetch(
      `/api/admin/marketplace/stores?search=${searchQuery}&status=${statusFilter}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setStores(data.stores || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch stores:", err);
        setLoading(false);
      });
  };

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch((err) => console.error("Failed to fetch users:", err));
  };

  useEffect(() => {
    fetchStores();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchStores();
  }, [searchQuery, statusFilter]);

  const deleteStore = async (id: string) => {
    if (!confirm("Hapus toko ini beserta semua produknya?")) return;
    try {
      await fetch(`/api/admin/marketplace/stores/${id}`, { method: "DELETE" });
      fetchStores();
    } catch (err) {
      console.error("Failed to delete store:", err);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/marketplace/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          address: "",
          phone: "",
          description: "",
          owner: "",
        });
        fetchStores();
      }
    } catch (err) {
      console.error("Failed to add store:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "suspended":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "inactive":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Toko Kelontong
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Kelola semua member toko kelontong marketplace.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchStores}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"}
            />
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted text-foreground text-xs font-bold px-4 py-2.5 rounded-xl border border-border outline-none"
          >
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
          >
            <Plus className="w-4 h-4" />
            Tambah Toko
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Total Toko
          </p>
          <h3 className="text-2xl font-black text-foreground">
            {stores.length}
          </h3>
          <p className="text-xs font-medium text-muted-foreground mt-2">
            Terdaftar di marketplace
          </p>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Toko Aktif
          </p>
          <h3 className="text-2xl font-black text-foreground">
            {stores.filter((s) => s.status === "active").length}
          </h3>
          <p className="text-xs font-medium text-muted-foreground mt-2">
            Beroperasi saat ini
          </p>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Toko Suspended
          </p>
          <h3 className="text-2xl font-black text-foreground">
            {stores.filter((s) => s.status === "suspended").length}
          </h3>
          <p className="text-xs font-medium text-muted-foreground mt-2">
            Perlu ditinjau ulang
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl border border-border/50">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama toko, alamat, atau pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading && stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Memuat data toko...
              </p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <StoreIcon className="w-10 h-10 text-muted-foreground opacity-20" />
              <div>
                <p className="text-sm font-black text-foreground">
                  Tidak ada toko ditemukan
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                  Coba ubah kata kunci pencarian
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
                    Lokasi
                  </th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">
                    Telepon
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredStores.map((store) => (
                  <tr
                    key={store._id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-[10px]">
                          {store.name?.substring(0, 2)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-foreground text-sm tracking-tight">
                            {store.name}
                          </p>
                          {store.description && (
                            <p className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[150px]">
                              {store.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-foreground">
                      {store.owner?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md border font-black text-[10px] uppercase tracking-widest ${getStatusStyle(
                          store.status,
                        )}`}
                      >
                        {store.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground truncate max-w-[150px]">
                          {store.address}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground">
                          {store.phone || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/marketplace/stores/${store._id}`}>
                          <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStore(store._id);
                          }}
                          className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-muted/10 border-t border-border/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <p>
            Menampilkan {filteredStores.length} dari {stores.length} Toko
          </p>
        </div>
      </div>

      {/* Add Store Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel rounded-3xl p-8 w-full max-w-lg mx-4 border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  Tambah Toko Baru
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Daftarkan toko kelontong baru ke marketplace
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleAddStore} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Nama Toko *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                  placeholder="Toko Maju Jaya"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Pemilik *
                </label>
                <select
                  required
                  value={formData.owner}
                  onChange={(e) =>
                    setFormData({ ...formData, owner: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                >
                  <option value="">Pilih pemilik...</option>
                  {users.map((user: any) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Alamat *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                  placeholder="Jl. Contoh No. 123, Jakarta"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                    placeholder="08123456789"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5"
                    placeholder="Toko sembako"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Toko"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
