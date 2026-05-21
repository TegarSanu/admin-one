import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Store } from '@/models/Store';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Fetch all completed transactions
    const transactions = await Transaction.find({ status: 'completed' })
      .populate('storeId', 'name owner address balance')
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 });

    // 2. Fetch all stores for balances
    const stores = await Store.find()
      .populate('owner', 'name email')
      .sort({ balance: -1 });

    // 3. Calculate Financial Metrics
    const totalTransactions = transactions.length;
    const gmv = transactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
    const averageOrderValue = totalTransactions > 0 ? gmv / totalTransactions : 0;
    
    // Platform fee simulation (e.g. 5% commission of GMV)
    const platformCommission = gmv * 0.05;

    // 4. Calculate Sales by Category
    const categorySales: Record<string, number> = {};
    const storeSales: Record<string, { id: string; name: string; sales: number; txCount: number }> = {};

    transactions.forEach((tx) => {
      // Store performance
      const storeIdStr = tx.storeId?._id?.toString() || tx.storeId?.toString();
      if (storeIdStr) {
        if (!storeSales[storeIdStr]) {
          storeSales[storeIdStr] = {
            id: storeIdStr,
            name: tx.storeId?.name || 'Toko Tidak Dikenal',
            sales: 0,
            txCount: 0,
          };
        }
        storeSales[storeIdStr].sales += tx.totalAmount || 0;
        storeSales[storeIdStr].txCount += 1;
      }

      // Category breakdown
      tx.items.forEach((item: any) => {
        const cat = item.category || 'Lainnya';
        categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
      });
    });

    // Format top stores
    const topStores = Object.values(storeSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Format category sales
    const categoryData = Object.entries(categorySales).map(([name, value]) => ({
      name,
      value,
      percentage: gmv > 0 ? Math.round((value / gmv) * 100) : 0,
    }));

    return NextResponse.json({
      metrics: {
        totalTransactions,
        gmv,
        averageOrderValue,
        platformCommission,
        totalWithdrawableBalance: stores.reduce((sum, s) => sum + (s.balance || 0), 0),
      },
      categorySales: categoryData,
      topStores,
      recentTransactions: transactions.slice(0, 20),
      stores: stores.map((s) => ({
        _id: s._id,
        name: s.name,
        ownerName: s.owner?.name || 'No Owner',
        balance: s.balance || 0,
        status: s.status,
      })),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Cashflow analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add simulated store payout processing endpoint
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { storeId, amount } = await req.json();

    if (!storeId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Store ID dan nominal penarikan valid diperlukan' }, { status: 400 });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });
    }

    if (store.balance < amount) {
      return NextResponse.json({ error: 'Saldo toko tidak mencukupi untuk penarikan ini' }, { status: 400 });
    }

    // Deduct balance (simulating payout)
    store.balance = Math.max(0, store.balance - amount);
    await store.save();

    return NextResponse.json({
      message: 'Penarikan dana/payout berhasil diproses',
      newBalance: store.balance,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Payout API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
