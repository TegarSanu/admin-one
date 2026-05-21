// Order Management Utilities

import { Order } from "@/models/Order";
import { sendMultiChannelNotification } from "@/lib/notificationService";

/**
 * Create order status history entry
 */
export interface OrderStatusUpdate {
  status: string;
  notes?: string;
  timestamp?: Date;
}

/**
 * Update order status and send notifications
 */
export async function updateOrderStatusWithNotification(
  orderId: string,
  newStatus: string,
  notes?: string,
  userId?: string,
  userEmail?: string,
  userPhone?: string,
) {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Add to status history
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      notes: notes || "",
    });

    order.orderStatus = newStatus;
    await order.save();

    // Send notification based on status
    const notificationConfig: Record<string, any> = {
      pending: {
        type: "order_received",
        title: "Pesanan Diterima",
        message: `Pesanan ${order.orderNumber} telah diterima.`,
        channels: ["in_app", "email"],
      },
      processing: {
        type: "order_confirmed",
        title: "Pesanan Dikonfirmasi",
        message: `Pesanan ${order.orderNumber} sedang diproses.`,
        channels: ["in_app", "email"],
      },
      shipped: {
        type: "order_shipped",
        title: "Pesanan Dikirim",
        message: `Pesanan ${order.orderNumber} telah dikirim.`,
        channels: ["in_app", "email", "sms"],
      },
      delivered: {
        type: "order_delivered",
        title: "Pesanan Sampai",
        message: `Pesanan ${order.orderNumber} telah sampai. Terima kasih!`,
        channels: ["in_app", "email", "sms"],
      },
      cancelled: {
        type: "order_cancelled",
        title: "Pesanan Dibatalkan",
        message: `Pesanan ${order.orderNumber} telah dibatalkan.`,
        channels: ["in_app", "email"],
      },
      completed: {
        type: "order_completed",
        title: "Pesanan Selesai",
        message: `Pesanan ${order.orderNumber} selesai. Terima kasih telah berbelanja!`,
        channels: ["in_app", "email"],
      },
    };

    const config = notificationConfig[newStatus];
    if (config && userId) {
      await sendMultiChannelNotification(
        userId,
        userEmail || "",
        userPhone || "",
        config.type,
        config.title,
        config.message,
        {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          link: `/orders/${order._id}`,
        },
        config.channels,
      );
    }

    return order;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

/**
 * Auto-cancel unpaid orders after timeout
 */
export async function autoCancelUnpaidOrders(timeoutMinutes: number = 30) {
  try {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const unpaidOrders = await Order.find({
      paymentStatus: "pending",
      orderStatus: "pending",
      createdAt: { $lt: timeoutDate },
    });

    for (const order of unpaidOrders) {
      await updateOrderStatusWithNotification(
        order._id.toString(),
        "cancelled",
        "Auto-cancelled due to unpaid timeout",
      );
    }

    console.log(`Auto-cancelled ${unpaidOrders.length} unpaid orders`);
  } catch (error) {
    console.error("Error auto-cancelling unpaid orders:", error);
  }
}

/**
 * Calculate order metrics
 */
export async function getOrderMetrics(storeId: string, days: number = 30) {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const orders = await Order.find({
      storeId,
      createdAt: { $gte: dateFrom },
    });

    const metrics = {
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.orderStatus === "completed")
        .length,
      cancelledOrders: orders.filter((o) => o.orderStatus === "cancelled")
        .length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      completedRevenue: orders
        .filter((o) => o.orderStatus === "completed")
        .reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: 0,
      conversionRate: 0,
      completionRate: 0,
    };

    if (orders.length > 0) {
      metrics.averageOrderValue = metrics.totalRevenue / orders.length;
      metrics.conversionRate =
        (orders.filter((o) => o.paymentStatus === "completed").length /
          orders.length) *
        100;
      metrics.completionRate = (metrics.completedOrders / orders.length) * 100;
    }

    return metrics;
  } catch (error) {
    console.error("Error calculating order metrics:", error);
    return null;
  }
}
