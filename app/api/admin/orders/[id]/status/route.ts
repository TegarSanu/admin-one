import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order } from "@/models/Order";

/**
 * Update order status with history tracking
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderStatus, notes } = body;

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    // Add status history
    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date(),
      notes: notes || "",
    });

    order.orderStatus = orderStatus;
    order.updatedAt = new Date();
    await order.save();

    return NextResponse.json({
      success: true,
      order,
      message: "Order status updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
