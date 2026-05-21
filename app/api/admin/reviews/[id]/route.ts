import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { ProductReview } from "@/models/ProductReview";
import { Product } from "@/models/Product";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const review = await ProductReview.findById(params.id)
      .populate("productId", "name")
      .populate("customerId", "name email")
      .populate("approvedBy", "name");

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const body = await req.json();
    const { status, approvedBy, moderationNotes, sellerComment } = body;

    const review = await ProductReview.findById(params.id);
    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    // Update review
    review.status = status || review.status;
    review.moderationNotes = moderationNotes || review.moderationNotes;
    review.approvedBy = approvedBy || review.approvedBy;

    if (status === "approved") {
      review.approvedAt = new Date();

      // Update product rating
      const allApprovedReviews = await ProductReview.find({
        productId: review.productId,
        status: "approved",
      });

      const totalRating = allApprovedReviews.reduce(
        (sum, r) => sum + r.rating,
        0,
      );
      const averageRating = totalRating / allApprovedReviews.length;

      await Product.findByIdAndUpdate(review.productId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allApprovedReviews.length,
      });
    }

    // Add seller response
    if (sellerComment) {
      review.response = {
        seller_comment: sellerComment,
        respondedAt: new Date(),
        respondedBy: approvedBy,
      };
    }

    await review.save();

    return NextResponse.json({
      success: true,
      review,
      message: "Review updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const review = await ProductReview.findByIdAndDelete(params.id);

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
