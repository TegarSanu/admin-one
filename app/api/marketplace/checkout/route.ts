import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectDB from "@/lib/db";
import { Product } from "@/models/Product";
import { Store } from "@/models/Store";
import { Transaction } from "@/models/Transaction";
import { Payment } from "@/models/Payment";
import User from "@/models/User";
import { Idempotency } from "@/models/Idempotency";
import { computeCashDistribution } from "@/lib/checkoutUtils";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      items,
      paymentMethod,
      cashReceived,
      buyerName: customBuyerName,
      shippingAddress,
    } = body;
    const idempotencyKey =
      req.headers.get("idempotency-key") || (body && body.idempotencyKey);

    // Idempotency check: if this key was already processed, return previous response
    if (idempotencyKey) {
      const existing = await Idempotency.findOne({ key: idempotencyKey });
      if (existing) {
        // fetch latest transactions by checkoutId
        const existingTx = await Transaction.find({
          checkoutId: existing.checkoutId,
        });
        return NextResponse.json(
          { message: "Request already processed", transactions: existingTx },
          { status: 200 },
        );
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Keranjang belanja kosong" },
        { status: 400 },
      );
    }

    // Determine buyer details
    let buyerId: string | null = null;
    let buyerName = customBuyerName || "Guest";

    const token = req.cookies.get("auth_token")?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
        );
        const { payload } = await jwtVerify(token, secret);
        if (payload && payload.id) {
          const user = await User.findById(payload.id);
          if (user) {
            buyerId = user._id.toString();
            buyerName = user.name;
          }
        }
      } catch (err) {
        console.warn(
          "Checkout auth token verification failed, checking out as guest:",
          err,
        );
      }
    }

    // 1. Fetch products and check stock availability
    const productIds = items.map((i) => i._id);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    // Build a map of products for easy access
    const productMap = new Map();
    dbProducts.forEach((p) => productMap.set(p._id.toString(), p));

    // Basic buyer/shipping validation
    if (
      customBuyerName &&
      String(customBuyerName).trim().length > 0 &&
      String(customBuyerName).trim().length < 2
    ) {
      return NextResponse.json(
        { error: "Nama pembeli terlalu singkat" },
        { status: 400 },
      );
    }
    if (shippingAddress && String(shippingAddress).trim().length < 8) {
      return NextResponse.json(
        { error: "Alamat pengiriman terlalu singkat" },
        { status: 400 },
      );
    }

    // Validate stocks and prices (protect against client price tampering)
    for (const item of items) {
      const dbProd = productMap.get(item._id);
      if (!dbProd) {
        return NextResponse.json(
          { error: `Produk "${item.name}" tidak ditemukan di database` },
          { status: 404 },
        );
      }
      if (dbProd.status === "out_of_stock" || dbProd.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Stok produk "${dbProd.name}" tidak mencukupi. Tersedia: ${dbProd.stock}, Diminta: ${item.quantity}`,
          },
          { status: 400 },
        );
      }
      // Ensure submitted price matches server price
      if (typeof item.price !== "number" || item.price !== dbProd.price) {
        return NextResponse.json(
          {
            error: `Harga untuk produk \"${dbProd.name}\" telah berubah. Segarkan keranjang dan coba lagi.`,
          },
          { status: 400 },
        );
      }
    }

    // 2. Group items by storeId
    const itemsByStore: Record<string, typeof items> = {};
    for (const item of items) {
      const dbProd = productMap.get(item._id);
      const sId = dbProd.storeId.toString();
      if (!itemsByStore[sId]) {
        itemsByStore[sId] = [];
      }
      itemsByStore[sId].push({
        ...item,
        category: dbProd.category,
      });
    }

    const checkoutId = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const createdTransactions = [];

    // Pre-calculate totals per store and overall to validate payments (especially cash)
    const storeEntries = Object.entries(itemsByStore);
    let totalCheckoutAmount = 0;
    const storeTotals = storeEntries.map(([storeId, storeItems]) => {
      const storeTotal = storeItems.reduce((sum, item) => {
        const dbProd = productMap.get(item._id);
        return sum + dbProd.price * item.quantity;
      }, 0);
      totalCheckoutAmount += storeTotal;
      return { storeId, storeTotal };
    });

    let storeCashDistributions: Array<{
      storeId: string;
      storeTotal: number;
      cashReceived: number;
      changeDue: number;
    }> = [];
    if (paymentMethod === "cash") {
      storeCashDistributions = computeCashDistribution(
        storeTotals,
        Number(cashReceived),
      );
    }

    // 3. Process checkout transaction for each store
    for (let si = 0; si < storeEntries.length; si++) {
      const [storeId, storeItems] = storeEntries[si];
      const store = await Store.findById(storeId);
      if (!store) {
        return NextResponse.json(
          { error: `Toko dengan ID ${storeId} tidak ditemukan` },
          { status: 404 },
        );
      }
      if (store.status !== "active") {
        return NextResponse.json(
          { error: `Toko "${store.name}" sedang tidak aktif/ditangguhkan` },
          { status: 400 },
        );
      }

      let storeTotal = 0;
      const transactionItems = [];

      for (const item of storeItems) {
        const dbProd = productMap.get(item._id);
        const newStock = dbProd.stock - item.quantity;

        // Update product stock and status
        dbProd.stock = newStock;
        if (newStock === 0) {
          dbProd.status = "out_of_stock";
        }
        await dbProd.save();

        const itemTotal = dbProd.price * item.quantity;
        storeTotal += itemTotal;

        transactionItems.push({
          productId: dbProd._id,
          name: dbProd.name,
          price: dbProd.price,
          quantity: item.quantity,
          category: dbProd.category,
        });
      }

      // For cash payments, add balance immediately. For QRIS, defer until payment confirmed.
      if (paymentMethod === "cash") {
        store.balance = (store.balance || 0) + storeTotal;
        await store.save();
      }

      const cashInfo =
        paymentMethod === "cash"
          ? storeCashDistributions.find((entry) => entry.storeId === storeId)
          : undefined;

      // Create transaction
      const transaction = await Transaction.create({
        buyerId: buyerId || undefined,
        buyerName,
        checkoutId,
        storeId: store._id,
        items: transactionItems,
        totalAmount: storeTotal,
        paymentMethod: paymentMethod || "cash",
        status: paymentMethod === "cash" ? "completed" : "pending",
        cashReceived:
          paymentMethod === "cash" ? cashInfo?.cashReceived : undefined,
        changeDue: paymentMethod === "cash" ? cashInfo?.changeDue : undefined,
        shippingAddress: shippingAddress || undefined,
      });

      createdTransactions.push(transaction);
    }

    // Persist idempotency mapping if key provided
    if (idempotencyKey && typeof idempotencyKey === "string") {
      const txIds = createdTransactions.map((t: any) => t._id.toString());
      try {
        await Idempotency.create({
          key: idempotencyKey,
          checkoutId,
          transactions: txIds,
          responseData: { transactions: createdTransactions },
        });
      } catch (err) {
        console.warn("Failed to persist idempotency record:", err);
      }
    }

    // If QRIS, create a Payment object and return payment info for client to display QR
    if (paymentMethod === "qris") {
      const qrPayload = `QRIS:${checkoutId}:${crypto.randomBytes(6).toString("hex")}`;
      const payment = await Payment.create({
        checkoutId,
        transactionIds: createdTransactions.map((t: any) => t._id),
        amount: totalCheckoutAmount,
        method: "qris",
        status: "pending",
        qrPayload,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
      });

      return NextResponse.json(
        {
          message: "Checkout created",
          payment,
          transactions: createdTransactions,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Checkout berhasil", transactions: createdTransactions },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
