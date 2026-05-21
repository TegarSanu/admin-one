"use client";

import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  Printer,
  Download,
  MoreVertical,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number; total: number }>;
}

interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  onViewDetails?: (order: Order) => void;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: ArrowRight,
  delivered: CheckCircle2,
  cancelled: XCircle,
  completed: CheckCircle2,
};

export default function OrdersTable({
  orders = [],
  loading = false,
  onViewDetails,
}: OrdersTableProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Package className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          Tidak ada pesanan
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order, index) => {
        const isExpanded = expandedOrders.has(order._id);
        const orderStatusLabel = getOrderStatusLabel(order.orderStatus);
        const paymentStatusLabel = getPaymentStatusLabel(order.paymentStatus);
        const StatusIcon = statusIcons[order.orderStatus] || Package;

        return (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-border/50 rounded-lg overflow-hidden bg-card hover:border-border transition-colors"
          >
            {/* Main Row */}
            <div
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpand(order._id)}
            >
              {/* Order Number & Customer */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.customerName}
                </p>
              </div>

              {/* Items Count */}
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {order.items.length} item
                </p>
              </div>

              {/* Amount */}
              <div className="text-right w-32">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>

              {/* Order Status */}
              <div className="w-32">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${orderStatusLabel.color}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {orderStatusLabel.label}
                </div>
              </div>

              {/* Payment Status */}
              <div className="w-40">
                <div
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${paymentStatusLabel.color}`}
                >
                  {paymentStatusLabel.label}
                </div>
              </div>

              {/* Date */}
              <div className="text-right w-32">
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
                </p>
              </div>

              {/* Expand Icon */}
              <div className="text-muted-foreground">
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </div>

            {/* Expanded Details */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: isExpanded ? "auto" : 0,
                opacity: isExpanded ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/50 bg-muted/30"
            >
              <div className="p-4 space-y-3">
                {/* Items List */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    ITEMS
                  </p>
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-foreground">
                          {item.productName}
                        </span>
                        <span className="text-muted-foreground">
                          x{item.quantity}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onViewDetails?.(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-medium hover:bg-foreground/90 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Detail
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors text-foreground">
                    <Printer className="w-3.5 h-3.5" />
                    Cetak
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors text-foreground">
                    <Download className="w-3.5 h-3.5" />
                    Invoice
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
