import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { OrderReturn } from "@/models/OrderReturn";
import { Order } from "@/models/Order";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const storeId = searchParams.get("storeId");
    const returnStatus = searchParams.get("returnStatus");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (returnStatus) query.returnStatus = returnStatus;
    if (search) {
      query.$or = [{ returnNumber: { $regex: search, $options: "i" } }];
    }

    const returns = await OrderReturn.find(query)
      .populate("orderId", "orderNumber customerName")
      .populate("storeId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await OrderReturn.countDocuments(query);

    return NextResponse.json({
      success: true,
      returns,
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

    const { orderId, storeId, returnItems, returnReason, customerNotes } = body;

    if (!orderId || !storeId || !returnItems || returnItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate return number
    const timestamp = Date.now().toString();
    const returnNumber = `RET-${storeId.slice(-4)}-${timestamp.slice(-8)}`;

    // Calculate total refund
    const totalRefundAmount = returnItems.reduce(
      (sum: number, item: any) => sum + (item.refundAmount || 0),
      0,
    );

    const orderReturn = new OrderReturn({
      returnNumber,
      orderId,
      storeId,
      returnItems,
      totalRefundAmount,
      returnReason,
      customerNotes,
      statusHistory: [
        {
          status: "requested",
          timestamp: new Date(),
          notes: "Return request created",
        },
      ],
    });

    await orderReturn.save();

    return NextResponse.json(
      {
        success: true,
        return: orderReturn,
        message: "Return request created successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
