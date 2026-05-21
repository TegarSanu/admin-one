import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import { Product } from '@/models/Product';
import { Store } from '@/models/Store';
import { Transaction } from '@/models/Transaction';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { items, paymentMethod, cashReceived, buyerName: customBuyerName } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja kosong' }, { status: 400 });
    }

    // Determine buyer details
    let buyerId: string | null = null;
    let buyerName = customBuyerName || 'Guest';

    const token = req.cookies.get('auth_token')?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
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
        console.warn('Checkout auth token verification failed, checking out as guest:', err);
      }
    }

    // 1. Fetch products and check stock availability
    const productIds = items.map((i) => i._id);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    // Build a map of products for easy access
    const productMap = new Map();
    dbProducts.forEach((p) => productMap.set(p._id.toString(), p));

    // Validate stocks
    for (const item of items) {
      const dbProd = productMap.get(item._id);
      if (!dbProd) {
        return NextResponse.json({ error: `Produk "${item.name}" tidak ditemukan di database` }, { status: 404 });
      }
      if (dbProd.status === 'out_of_stock' || dbProd.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stok produk "${dbProd.name}" tidak mencukupi. Tersedia: ${dbProd.stock}, Diminta: ${item.quantity}` },
          { status: 400 }
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

    // 3. Process checkout transaction for each store
    for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
      const store = await Store.findById(storeId);
      if (!store) {
        return NextResponse.json({ error: `Toko dengan ID ${storeId} tidak ditemukan` }, { status: 404 });
      }
      if (store.status !== 'active') {
        return NextResponse.json({ error: `Toko "${store.name}" sedang tidak aktif/ditangguhkan` }, { status: 400 });
      }

      let storeTotal = 0;
      const transactionItems = [];

      for (const item of storeItems) {
        const dbProd = productMap.get(item._id);
        const newStock = dbProd.stock - item.quantity;
        
        // Update product stock and status
        dbProd.stock = newStock;
        if (newStock === 0) {
          dbProd.status = 'out_of_stock';
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

      // Add balance to store
      store.balance = (store.balance || 0) + storeTotal;
      await store.save();

      // Determine cash simulation change
      let changeDue = 0;
      let actualCashReceived = storeTotal;
      if (paymentMethod === 'cash' && cashReceived) {
        // Approximate proportions for multi-store cash receipt if needed, or simply assign
        actualCashReceived = Number(cashReceived);
        changeDue = Math.max(0, actualCashReceived - storeTotal);
      }

      // Create transaction
      const transaction = await Transaction.create({
        buyerId: buyerId || undefined,
        buyerName,
        checkoutId,
        storeId: store._id,
        items: transactionItems,
        totalAmount: storeTotal,
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        cashReceived: paymentMethod === 'cash' ? actualCashReceived : undefined,
        changeDue: paymentMethod === 'cash' ? changeDue : undefined,
      });

      createdTransactions.push(transaction);
    }

    return NextResponse.json({
      message: 'Checkout berhasil',
      transactions: createdTransactions,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
