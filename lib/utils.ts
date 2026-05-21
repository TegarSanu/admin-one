import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Generate order number
export function generateOrderNumber(storeId: string): string {
  const timestamp = Date.now().toString();
  return `ORD-${storeId.slice(-4)}-${timestamp.slice(-8)}`;
}

// Generate invoice number
export function generateInvoiceNumber(storeId: string): string {
  const timestamp = Date.now().toString();
  return `INV-${storeId.slice(-4)}-${timestamp.slice(-8)}`;
}

// Generate return number
export function generateReturnNumber(storeId: string): string {
  const timestamp = Date.now().toString();
  return `RET-${storeId.slice(-4)}-${timestamp.slice(-8)}`;
}

// Generate refund ID
export function generateRefundId(storeId: string): string {
  const timestamp = Date.now().toString();
  return `REF-${storeId.slice(-4)}-${timestamp.slice(-8)}`;
}

// Format date to local
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

// Format date with time
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Get order status label
export function getOrderStatusLabel(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
    processing: { label: "Diproses", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "Dikirim", color: "bg-purple-100 text-purple-800" },
    delivered: { label: "Sampai", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-800" },
    completed: { label: "Selesai", color: "bg-emerald-100 text-emerald-800" },
  };
  return (
    statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  );
}

// Get payment status label
export function getPaymentStatusLabel(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: {
      label: "Menunggu Pembayaran",
      color: "bg-yellow-100 text-yellow-800",
    },
    completed: {
      label: "Pembayaran Diterima",
      color: "bg-green-100 text-green-800",
    },
    failed: { label: "Pembayaran Gagal", color: "bg-red-100 text-red-800" },
    refunded: { label: "Refund Penuh", color: "bg-blue-100 text-blue-800" },
    partial_refund: {
      label: "Refund Sebagian",
      color: "bg-purple-100 text-purple-800",
    },
  };
  return (
    statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  );
}

// Get return status label
export function getReturnStatusLabel(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    requested: { label: "Diminta", color: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Disetujui", color: "bg-green-100 text-green-800" },
    rejected: { label: "Ditolak", color: "bg-red-100 text-red-800" },
    received: { label: "Diterima", color: "bg-blue-100 text-blue-800" },
    processed: { label: "Diproses", color: "bg-purple-100 text-purple-800" },
    completed: { label: "Selesai", color: "bg-emerald-100 text-emerald-800" },
  };
  return (
    statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  );
}

// Calculate order total with tax and shipping
export function calculateOrderTotal(
  subtotal: number,
  taxRate: number = 0.1,
  shippingCost: number = 0,
  discount: number = 0,
): number {
  const tax = subtotal * taxRate;
  return subtotal + tax + shippingCost - discount;
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Indonesia)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  let formatted = phone.replace(/\D/g, "");
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.slice(1);
  } else if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }
  return "+" + formatted;
}

// Get days until date
export function getDaysUntil(date: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const difference = targetDate.getTime() - today.getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

// Is due soon (within 3 days)
export function isDueSoon(dueDate: Date | string): boolean {
  const daysUntil = getDaysUntil(dueDate);
  return daysUntil > 0 && daysUntil <= 3;
}

// Is overdue
export function isOverdue(dueDate: Date | string): boolean {
  return getDaysUntil(dueDate) < 0;
}
