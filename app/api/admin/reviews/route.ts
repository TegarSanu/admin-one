import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { ProductReview } from "@/models/ProductReview";
import { Product } from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const storeId = searchParams.get("storeId");
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (productId) query.productId = productId;
    if (status) query.status = status;

    const reviews = await ProductReview.find(query)
      .populate("productId", "name")
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProductReview.countDocuments(query);

    return NextResponse.json({
      success: true,
      reviews,
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
      orderId,
      storeId,
      customerId,
      customerName,
      rating,
      title,
      comment,
      images,
      verified,
    } = body;

    if (!productId || !orderId || !storeId || !rating || !title || !comment) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const review = new ProductReview({
      productId,
      orderId,
      storeId,
      customerId,
      customerName,
      rating,
      title,
      comment,
      images: images || [],
      verified: verified || true,
      status: "pending",
    });

    await review.save();

    return NextResponse.json(
      { success: true, review, message: "Review created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
