import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { Order } from "@/models/Order";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const storeId = searchParams.get("storeId");
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query)
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    return NextResponse.json({
      success: true,
      invoices,
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

    const { orderId, storeId } = body;

    if (!orderId || !storeId) {
      return NextResponse.json(
        { success: false, error: "Order ID and Store ID are required" },
        { status: 400 },
      );
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    // Generate invoice number
    const timestamp = Date.now().toString();
    const invoiceNumber = `INV-${storeId.slice(-4)}-${timestamp.slice(-8)}`;

    const invoice = new Invoice({
      invoiceNumber,
      orderId,
      storeId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      discount: order.discount,
      totalAmount: order.totalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    await invoice.save();

    // Update order with invoice reference
    order.invoiceNumber = invoiceNumber;
    order.invoiceDate = new Date();
    await order.save();

    return NextResponse.json(
      { success: true, invoice, message: "Invoice created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
