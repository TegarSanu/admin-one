import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { Product } from "@/models/Product";
import { ProductReview } from "@/models/ProductReview";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const storeId = searchParams.get("storeId");
    const period = searchParams.get("period") || "month"; // day, week, month, year

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Store ID is required" },
        { status: 400 },
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let daysCount = 30;

    if (period === "day") {
      startDate.setDate(now.getDate() - 1);
      daysCount = 1;
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
      daysCount = 7;
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
      daysCount = 30;
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
      daysCount = 365;
    }

    const query = {
      storeId,
      createdAt: { $gte: startDate, $lte: now },
    };

    // Get orders data
    const orders = await Order.find(query);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (o) => o.orderStatus === "completed",
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.orderStatus === "cancelled",
    ).length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const completedRevenue = orders
      .filter((o) => o.orderStatus === "completed")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Get payment data
    const payments = await Payment.find(query);
    const completedPayments = payments.filter(
      (p) => p.status === "completed",
    ).length;
    const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get reviews data
    const reviews = await ProductReview.find({
      storeId,
      createdAt: { $gte: startDate, $lte: now },
    });
    const approvedReviews = reviews.filter((r) => r.status === "approved");
    const averageRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
          approvedReviews.length
        : 0;

    // Get daily sales data
    const dailyData: any[] = [];
    for (let i = 0; i < daysCount && i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = await Order.find({
        storeId,
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const dayCount = dayOrders.length;
      const dayCompleted = dayOrders.filter(
        (o) => o.orderStatus === "completed",
      ).length;

      dailyData.push({
        date: date.toISOString().split("T")[0],
        sales: dayCount,
        completed: dayCompleted,
        revenue: dayRevenue,
      });
    }

    // Top products
    const products = await Product.find({ storeId });
    const topProducts = products
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 10)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        sold: p.soldCount,
        revenue: p.price * p.soldCount,
        stock: p.stock,
      }));

    // Payment methods breakdown
    const paymentMethodBreakdown = orders.reduce((acc: any, o: any) => {
      if (!acc[o.paymentMethod]) {
        acc[o.paymentMethod] = { count: 0, amount: 0 };
      }
      acc[o.paymentMethod].count += 1;
      acc[o.paymentMethod].amount += o.totalAmount;
      return acc;
    }, {});

    // Order status breakdown
    const orderStatusBreakdown = orders.reduce((acc: any, o: any) => {
      if (!acc[o.orderStatus]) {
        acc[o.orderStatus] = 0;
      }
      acc[o.orderStatus] += 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          completedRevenue,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          conversionRate:
            totalOrders > 0
              ? ((completedOrders / totalOrders) * 100).toFixed(2)
              : 0,
          completedPayments,
          paymentSuccessRate:
            payments.length > 0
              ? ((completedPayments / payments.length) * 100).toFixed(2)
              : 0,
          totalReviews: reviews.length,
          approvedReviews: approvedReviews.length,
          averageRating: averageRating.toFixed(2),
        },
        dailyData,
        topProducts,
        paymentMethodBreakdown,
        orderStatusBreakdown,
        reviewStats: {
          total: reviews.length,
          approved: approvedReviews.length,
          pending: reviews.filter((r) => r.status === "pending").length,
          rejected: reviews.filter((r) => r.status === "rejected").length,
          average_rating: averageRating.toFixed(2),
        },
      },
      period,
    });
  } catch (error: any) {
    console.error("Error fetching marketplace analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
