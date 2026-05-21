import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Store } from "@/models/Store";

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags:
 *       - Admin Orders
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled, completed]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of orders
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .populate("storeId", "name")
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/admin/orders:
 *   post:
 *     summary: Create a new order
 *     tags:
 *       - Admin Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      storeId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      items,
      paymentMethod,
      shippingMethod,
      shippingAddress,
      notes,
    } = body;

    if (!storeId || !customerName || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate order number
    const timestamp = Date.now().toString();
    const orderNumber = `ORD-${storeId.slice(-4)}-${timestamp.slice(-8)}`;

    // Fetch products and calculate totals
    const productIds = items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        discount: item.discount || 0,
        total: itemTotal - (item.discount || 0),
      };
    });

    const tax = subtotal * 0.1; // 10% tax
    const shippingCost = shippingMethod === "pickup" ? 0 : 50000;
    const totalAmount = subtotal + tax + shippingCost;

    const order = new Order({
      orderNumber,
      storeId,
      customerId: customerId || null,
      customerName,
      customerPhone,
      customerEmail,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      paymentMethod: paymentMethod || "cash",
      shippingMethod: shippingMethod || "pickup",
      shippingAddress,
      notes,
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          notes: "Order created",
        },
      ],
    });

    await order.save();

    return NextResponse.json(
      { success: true, order, message: "Order created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
