import { NextRequest, NextResponse } from "next/server";
import {
  createMidtransSnapToken,
  createStripePaymentIntent,
  verifyMidtransPayment,
} from "@/lib/paymentGateway";
import { Payment } from "@/models/Payment";
import connectDB from "@/lib/db";

/**
 * Create Midtrans Payment Token
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      gateway,
      orderId,
      amount,
      customerEmail,
      customerName,
      customerPhone,
    } = body;

    if (!gateway || !orderId || !amount || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    let paymentToken: any;

    if (gateway === "midtrans") {
      paymentToken = await createMidtransSnapToken(
        orderId,
        amount,
        customerEmail,
        customerName,
        customerPhone || "",
      );
    } else if (gateway === "stripe") {
      paymentToken = await createStripePaymentIntent(
        orderId,
        amount,
        customerEmail,
        customerName,
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported payment gateway" },
        { status: 400 },
      );
    }

    // Save payment record
    const payment = new Payment({
      paymentId: `${gateway.toUpperCase()}-${Date.now()}`,
      orderId,
      amount,
      paymentMethod: "credit_card",
      paymentGateway: gateway,
      status: "pending",
      gatewayTransactionId: paymentToken.paymentIntentId || paymentToken.token,
    });

    await payment.save();

    return NextResponse.json({
      success: true,
      paymentToken,
      payment,
    });
  } catch (error: any) {
    console.error("Error creating payment token:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * Verify Payment
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gateway = searchParams.get("gateway");
    const transactionId = searchParams.get("transactionId");

    if (!gateway || !transactionId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    let result: any;

    if (gateway === "midtrans") {
      result = await verifyMidtransPayment(transactionId);
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported payment gateway" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
