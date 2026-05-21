import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Refund } from "@/models/Refund";
import { Payment } from "@/models/Payment";
import {
  processMidtransRefund,
  processStripeRefund,
} from "@/lib/paymentGateway";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const refund = await Refund.findById(params.id)
      .populate("orderId", "orderNumber")
      .populate("paymentId", "gatewayTransactionId paymentGateway");

    if (!refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, refund });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const body = await req.json();
    const { status, notes } = body;

    const refund = await Refund.findById(params.id);
    if (!refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 },
      );
    }

    // If processing refund
    if (status === "processing") {
      const payment = await Payment.findById(refund.paymentId);

      if (payment && payment.paymentGateway === "midtrans") {
        try {
          const result = await processMidtransRefund(
            payment.gatewayTransactionId,
            refund.refundAmount,
          );
          refund.gatewayRefundId = result.refundId;
        } catch (error) {
          console.error("Error processing Midtrans refund:", error);
        }
      } else if (payment && payment.paymentGateway === "stripe") {
        try {
          const result = await processStripeRefund(
            payment.gatewayTransactionId,
            refund.refundAmount,
          );
          refund.gatewayRefundId = result.refundId;
        } catch (error) {
          console.error("Error processing Stripe refund:", error);
        }
      }

      refund.processedAt = new Date();
    }

    if (status === "completed") {
      refund.completedAt = new Date();
    }

    // Add status history
    refund.statusHistory.push({
      status,
      timestamp: new Date(),
      notes: notes || "",
    });

    refund.status = status;
    await refund.save();

    return NextResponse.json({
      success: true,
      refund,
      message: "Refund updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
