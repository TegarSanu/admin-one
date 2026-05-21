import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { StockAlert } from "@/models/StockAlert";
import { Product } from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const storeId = searchParams.get("storeId");
    const alertStatus = searchParams.get("alertStatus");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (alertStatus) query.alertStatus = alertStatus;

    const alerts = await StockAlert.find(query)
      .populate("productId", "name stock")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StockAlert.countDocuments(query);

    return NextResponse.json({
      success: true,
      alerts,
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
      productId,
      storeId,
      minStockLevel,
      reorderQuantity,
      alertFrequency,
      notifyVia,
    } = body;

    if (!productId || !storeId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get current stock from product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    // Check if alert already exists
    let alert = await StockAlert.findOne({ productId });
    if (alert) {
      alert.minStockLevel = minStockLevel || alert.minStockLevel;
      alert.reorderQuantity = reorderQuantity || alert.reorderQuantity;
      alert.alertFrequency = alertFrequency || alert.alertFrequency;
      if (notifyVia) alert.notifyVia = notifyVia;
      await alert.save();
    } else {
      alert = new StockAlert({
        productId,
        storeId,
        minStockLevel: minStockLevel || 10,
        currentStock: product.stock,
        reorderQuantity: reorderQuantity || 50,
        alertFrequency: alertFrequency || "once",
        notifyVia: notifyVia || { email: true, in_app: true, sms: false },
      });
      await alert.save();
    }

    return NextResponse.json(
      {
        success: true,
        alert,
        message: "Stock alert created/updated successfully",
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
