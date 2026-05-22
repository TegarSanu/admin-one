import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const secret = process.env.WEBHOOK_SECRET || "";

    if (secret) {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(raw)
        .digest("hex");
      if (!signature || signature !== expected) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Basic event handling: update transaction status
    const { type, data } = payload;
    if (!type || !data) return NextResponse.json({ ok: true });

    if (type === "payment.succeeded" && data.transactionId) {
      await Transaction.findByIdAndUpdate(data.transactionId, {
        status: "completed",
      });
    }
    if (type === "payment.failed" && data.transactionId) {
      await Transaction.findByIdAndUpdate(data.transactionId, {
        status: "cancelled",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
