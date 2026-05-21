"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Edit2,
  ChevronDown,
  Mail,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    owner: "",
    status: "active",
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

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = editingStore ? "PUT" : "POST";
      const url = editingStore
        ? `/api/admin/marketplace/stores/${editingStore}`
        : "/api/admin/marketplace/stores";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setEditingStore(null);
        setFormData({
          name: "",
          address: "",
          phone: "",
          description: "",
          owner: "",
          status: "active",
        });
        fetchStores();
      }
    } catch (err) {
      console.error("Failed to save store:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (store: any) => {
    setEditingStore(store._id);
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone || "",
      description: store.description || "",
      owner: store.owner?._id || "",
      status: store.status || "active",
    });
    setIsAddModalOpen(true);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Toko Kelontong
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Kelola semua member toko kelontong marketplace.
          </p>
        </motion.div>

        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <button
            onClick={fetchStores}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-all text-muted-foreground hover:text-foreground hover:scale-105"
          >
            <RefreshCw
              className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"}
            />
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted text-foreground text-xs font-bold px-4 py-2.5 rounded-xl border border-border outline-none hover:border-border/80 transition-all"
          >
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={() => {
              setEditingStore(null);
              setFormData({
                name: "",
                address: "",
                phone: "",
                description: "",
                owner: "",
                status: "active",
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Tambah Toko
          </button>
        </motion.div>
      </div>

      {/* Stats Cards with Animation */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, staggerChildren: 0.1 }}
      >
        {[
          {
            label: "Total Toko",
            value: stores.length,
            icon: StoreIcon,
            color: "from-blue-500/10 to-blue-600/5",
          },
          {
            label: "Toko Aktif",
            value: stores.filter((s) => s.status === "active").length,
            icon: TrendingUp,
            color: "from-emerald-500/10 to-emerald-600/5",
          },
          {
            label: "Toko Suspended",
            value: stores.filter((s) => s.status === "suspended").length,
            icon: AlertTriangle,
            color: "from-rose-500/10 to-rose-600/5",
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            className={`glass-panel p-6 rounded-3xl bg-gradient-to-br ${stat.color} border border-border/30`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-foreground">
                  {stat.value}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-foreground/5">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        className="glass-panel rounded-3xl overflow-hidden border border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
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
            <AnimatePresence>
              <div className="divide-y divide-border/50">
                {filteredStores.map((store, idx) => (
                  <motion.div
                    key={store._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <div
                      className="p-5 hover:bg-muted/30 transition-all cursor-pointer border-b border-border/30 last:border-0"
                      onClick={() =>
                        setExpandedStore(
                          expandedStore === store._id ? null : store._id,
                        )
                      }
                    >
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{
                            rotate: expandedStore === store._id ? 180 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>

                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-foreground/20 to-foreground/5 flex items-center justify-center font-black text-xs text-foreground shrink-0">
                          {store.name?.substring(0, 2)?.toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div>
                              <p className="font-black text-foreground text-sm tracking-tight">
                                {store.name}
                              </p>
                              {store.description && (
                                <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                                  {store.description}
                                </p>
                              )}
                            </div>
                            <motion.span
                              className={`inline-flex px-2.5 py-1 rounded-md border font-black text-[10px] uppercase tracking-widest ${getStatusStyle(
                                store.status,
                              )}`}
                              whileHover={{ scale: 1.05 }}
                            >
                              {store.status}
                            </motion.span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(store);
                            }}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-muted-foreground hover:text-blue-500"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStore(store._id);
                            }}
                            className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-muted-foreground hover:text-rose-500"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedStore === store._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-muted/10 border-t border-border/30"
                        >
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                  Lokasi
                                </p>
                                <p className="text-sm font-bold text-foreground">
                                  {store.address}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                  Telepon
                                </p>
                                <p className="text-sm font-bold text-foreground">
                                  {store.phone || "-"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                  Pemilik
                                </p>
                                <p className="text-sm font-bold text-foreground">
                                  {store.owner?.name || "Unknown"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                  Saldo
                                </p>
                                <p className="text-sm font-bold text-emerald-500">
                                  Rp{" "}
                                  {(store.balance || 0).toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>
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

        <div className="px-6 py-4 bg-muted/10 border-t border-border/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <p>
            Menampilkan {filteredStores.length} dari {stores.length} Toko
          </p>
        </div>
      </motion.div>

      {/* Add/Edit Store Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsAddModalOpen(false);
              setEditingStore(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel rounded-3xl p-8 w-full max-w-lg border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">
                    {editingStore ? "Edit Toko" : "Tambah Toko Baru"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editingStore
                      ? "Update informasi toko kelontong"
                      : "Daftarkan toko kelontong baru ke marketplace"}
                  </p>
                </div>
                <motion.button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStore(null);
                  }}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>

              <form onSubmit={handleSaveStore} className="space-y-4">
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
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
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
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
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
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
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
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                      placeholder="08123456789"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all resize-none"
                    placeholder="Toko sembako dan kebutuhan sehari-hari"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingStore(null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {submitting
                      ? "Menyimpan..."
                      : editingStore
                        ? "Simpan Perubahan"
                        : "Simpan Toko"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
