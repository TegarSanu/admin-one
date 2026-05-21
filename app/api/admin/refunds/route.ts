import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Refund } from "@/models/Refund";
import { Payment } from "@/models/Payment";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (status) query.status = status;

    const refunds = await Refund.find(query)
      .populate("orderId", "orderNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Refund.countDocuments(query);

    return NextResponse.json({
      success: true,
      refunds,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      orderId,
      paymentId,
      storeId,
      refundAmount,
      refundReason,
      refundMethod,
      returnId,
    } = body;

    if (!orderId || !paymentId || !storeId || !refundAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate refund ID
    const timestamp = Date.now().toString();
    const refundId = `REF-${storeId.slice(-4)}-${timestamp.slice(-8)}`;

    const refund = new Refund({
      refundId,
      orderId,
      paymentId,
      storeId,
      refundAmount,
      refundReason,
      refundMethod: refundMethod || "original_payment",
      returnId: returnId || null,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          notes: "Refund request created",
        },
      ],
    });

    await refund.save();

    // Update payment status
    await Payment.findByIdAndUpdate(paymentId, {
      status: "pending",
    });

    return NextResponse.json(
      { success: true, refund, message: "Refund request created" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
