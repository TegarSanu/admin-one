"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Plus, Minus, Trash2, ChevronRight, ChevronLeft, User,
  CreditCard, Banknote, AlertTriangle, CheckCircle, Loader2, ShoppingBag,
  QrCode, Building2, Wallet, ArrowLeft
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CartItem } from "../MemberStorefront";

const categoryEmoji: Record<string, string> = {
  Sembako: "🌾", Makanan: "🍜", Minuman: "☕", "Kebutuhan Rumah": "🏠",
};

const PAYMENT_METHODS = [
  { id: "cash" as const, label: "Tunai", icon: Banknote, desc: "Bayar langsung", color: "emerald" },
  { id: "transfer" as const, label: "Transfer", icon: Building2, desc: "Transfer bank / QRIS", color: "blue" },
  { id: "debt" as const, label: "Hutang", icon: Wallet, desc: "Bayar nanti", color: "amber" },
];

interface CartTabProps {
  cart: CartItem[];
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  cartTotal: number;
  apiBase: string;
  onCheckoutSuccess: () => void;
  onContinueShopping: () => void;
}

export default function CartTab({
  cart, updateQty, removeFromCart, cartTotal, apiBase, onCheckoutSuccess, onContinueShopping,
}: CartTabProps) {
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "debt">("cash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const handleCheckout = async () => {
    setProcessing(true);
    setError(null);
    setErrorDetails([]);

    try {
      const res = await fetch(`${apiBase}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c._id, quantity: c.quantity })),
          customerName: customerName || "Guest",
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Checkout gagal");
        setErrorDetails(data.details || []);
        setProcessing(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onCheckoutSuccess();
        setStep(1);
        setSuccess(false);
        setCustomerName("");
        setPaymentMethod("cash");
        setPaymentConfirmed(false);
      }, 3000);
    } catch (e: any) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setProcessing(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <h3 className="text-2xl font-black text-foreground">Checkout Berhasil! 🎉</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Pesanan Anda telah tercatat. Stok produk telah diperbarui dan laporan cashflow telah dibuat otomatis.
        </p>
      </motion.div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl bg-card border border-border/50">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-black text-foreground">Keranjang Kosong</h3>
        <p className="text-sm text-muted-foreground">Belum ada produk di keranjang belanja Anda.</p>
        <button
          onClick={onContinueShopping}
          className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/25"
        >
          Mulai Belanja
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 p-4 rounded-2xl bg-card border border-border/50">
        {[
          { n: 1, label: "Keranjang" },
          { n: 2, label: "Info & Bayar" },
          { n: 3, label: "Konfirmasi" },
        ].map((s, idx) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0",
              step >= s.n
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-muted text-muted-foreground"
            )}>
              {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
            </div>
            <span className={cn(
              "text-xs font-bold hidden sm:block",
              step >= s.n ? "text-foreground" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
            {idx < 2 && (
              <div className={cn(
                "flex-1 h-0.5 rounded-full mx-1",
                step > s.n ? "bg-emerald-500" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Cart Items */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                    {categoryEmoji[item.category] || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.storeName}</p>
                    <p className="text-xs font-black text-emerald-500 mt-1">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item._id, -1)} className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                    <button onClick={() => updateQty(item._id, 1)} className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-sm font-bold text-muted-foreground">Total</span>
              <span className="text-xl font-black text-foreground">{formatCurrency(cartTotal)}</span>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              Lanjutkan
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 2: Customer Info + Payment Method */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Customer Name */}
            <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" /> Informasi Pembeli
              </h4>
              <input
                type="text"
                placeholder="Nama pembeli (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            {/* Payment Method */}
            <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" /> Metode Pembayaran
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => { setPaymentMethod(pm.id); setPaymentConfirmed(false); }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-200",
                      paymentMethod === pm.id
                        ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                        : "border-border hover:border-emerald-500/30"
                    )}
                  >
                    <pm.icon className={cn("w-6 h-6 mb-2", paymentMethod === pm.id ? "text-emerald-500" : "text-muted-foreground")} />
                    <p className="text-sm font-bold text-foreground">{pm.label}</p>
                    <p className="text-[10px] text-muted-foreground">{pm.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" /> Ringkasan
              </h4>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                    <span className="font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-lg font-black text-emerald-500">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                Proses Pembayaran
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Payment Simulator */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Payment Simulator Content */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-5">
              {paymentMethod === "transfer" && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="text-lg font-black text-foreground">Transfer Bank / QRIS</h4>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nomor Rekening</p>
                    <p className="text-2xl font-black text-foreground tracking-widest">8820-4491-7756</p>
                    <p className="text-xs text-muted-foreground">Bank BCA - KelontongHub</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Total Transfer</p>
                    <p className="text-2xl font-black text-blue-500">{formatCurrency(cartTotal)}</p>
                  </div>

                  {/* QR Code Simulator */}
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
                    <div className="w-40 h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-2 grid grid-cols-8 grid-rows-8 gap-0.5 opacity-80">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div key={i} className={cn("rounded-[1px]", Math.random() > 0.4 ? "bg-white" : "bg-transparent")} />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-gray-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Scan QRIS untuk pembayaran instan</p>

                  {!paymentConfirmed ? (
                    <button
                      onClick={() => setPaymentConfirmed(true)}
                      className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25"
                    >
                      Saya Sudah Transfer
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 justify-center text-emerald-500 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Pembayaran Dikonfirmasi
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Banknote className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-black text-foreground">Pembayaran Tunai</h4>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Total yang Harus Dibayar</p>
                    <p className="text-3xl font-black text-emerald-500">{formatCurrency(cartTotal)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Siapkan uang tunai sesuai nominal di atas. Pembayaran dilakukan langsung di toko.</p>
                  {!paymentConfirmed ? (
                    <button
                      onClick={() => setPaymentConfirmed(true)}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25"
                    >
                      Konfirmasi Pembayaran Tunai
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 justify-center text-emerald-500 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Pembayaran Tunai Dikonfirmasi
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "debt" && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <h4 className="text-lg font-black text-foreground">Pembayaran Hutang</h4>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Total Hutang</p>
                    <p className="text-3xl font-black text-amber-500">{formatCurrency(cartTotal)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Perhatian: Hutang harus dilunasi sesuai ketentuan toko.
                    </p>
                  </div>
                  {customerName ? (
                    !paymentConfirmed ? (
                      <button
                        onClick={() => setPaymentConfirmed(true)}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/25"
                      >
                        Setuju & Catat Hutang
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 justify-center text-emerald-500 text-sm font-bold">
                        <CheckCircle className="w-4 h-4" /> Hutang Dicatat atas nama {customerName}
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-rose-400 font-bold">⚠️ Nama pembeli wajib diisi untuk pembayaran hutang. Kembali ke langkah sebelumnya.</p>
                  )}
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <p className="text-sm font-bold text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </p>
                {errorDetails.map((d, i) => (
                  <p key={i} className="text-xs text-rose-400 ml-6">• {d}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep(2); setPaymentConfirmed(false); }}
                className="px-5 py-3.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                onClick={handleCheckout}
                disabled={processing || !paymentConfirmed || (paymentMethod === "debt" && !customerName)}
                className={cn(
                  "flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                  processing || !paymentConfirmed || (paymentMethod === "debt" && !customerName)
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Selesaikan Checkout
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
