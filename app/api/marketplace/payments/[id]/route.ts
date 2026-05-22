import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Transaction } from "@/models/Transaction";
import { Store } from "@/models/Store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const payment = await Payment.findById(id);
    if (!payment)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    return NextResponse.json({ payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Confirm payment (sandbox) - this will set payment to succeeded and finalize linked transactions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const payment = await Payment.findById(id);
    if (!payment)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (payment.status !== "pending")
      return NextResponse.json(
        { error: "Payment not pending" },
        { status: 400 },
      );

    // Mark payment succeeded
    payment.status = "succeeded";
    await payment.save();

    // Finalize transactions: mark completed and add store balance
    const txs = await Transaction.find({
      _id: { $in: payment.transactionIds },
    });
    for (const tx of txs) {
      tx.status = "completed";
      await tx.save();
      // Add balance to store
      const store = await Store.findById(tx.storeId);
      if (store) {
        store.balance = (store.balance || 0) + tx.totalAmount;
        await store.save();
      }
    }

    return NextResponse.json({ ok: true, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
