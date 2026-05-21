import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectDB from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Store } from '@/models/Store';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const idsParam = searchParams.get('ids');

    const query: any = {};

    // Filter by specific store if requested
    if (storeId) {
      query.storeId = storeId;
    }

    // Determine buyer details via cookie or guest transaction IDs
    const token = req.cookies.get('auth_token')?.value;
    let loggedInUserId: string | null = null;

    if (token) {
      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
        );
        const { payload } = await jwtVerify(token, secret);
        if (payload && payload.id) {
          loggedInUserId = payload.id as string;
        }
      } catch (err) {
        console.warn('History auth verification failed, checking other filters:', err);
      }
    }

    if (loggedInUserId) {
      query.buyerId = loggedInUserId;
    } else if (idsParam) {
      const ids = idsParam.split(',').filter((id) => id.match(/^[0-9a-fA-F]{24}$/));
      if (ids.length > 0) {
        query._id = { $in: ids };
      } else {
        return NextResponse.json({ transactions: [] });
      }
    } else if (!storeId) {
      return NextResponse.json({ transactions: [] });
    }

    const rawTransactions = await Transaction.find(query)
      .populate('storeId', 'name address phone')
      .sort({ createdAt: -1 })
      .lean();

    // Group transactions by checkoutId server-side
    const grouped = new Map<string, any>();
    const standalone: any[] = [];

    for (const tx of rawTransactions) {
      const checkoutId = (tx as any).checkoutId;
      if (checkoutId) {
        if (!grouped.has(checkoutId)) {
          grouped.set(checkoutId, {
            _id: checkoutId,
            isGrouped: true,
            createdAt: tx.createdAt,
            totalAmount: 0,
            paymentMethod: tx.paymentMethod,
            buyerName: tx.buyerName,
            status: tx.status,
            cashReceived: 0,
            changeDue: 0,
            items: [],
            storeNames: [] as string[],
          });
        }
        const group = grouped.get(checkoutId)!;
        group.totalAmount += tx.totalAmount;
        group.cashReceived = Math.max(group.cashReceived, tx.cashReceived || 0);
        group.changeDue = Math.max(group.changeDue, tx.changeDue || 0);

        const storeName = (tx.storeId as any)?.name || 'Toko Kelontong';
        const itemsWithStore = (tx.items || []).map((it: any) => ({
          ...it,
          storeName,
        }));
        group.items.push(...itemsWithStore);

        if (storeName && !group.storeNames.includes(storeName)) {
          group.storeNames.push(storeName);
        }
      } else {
        // Legacy transactions without checkoutId
        standalone.push({
          ...tx,
          isGrouped: false,
          storeNames: [(tx.storeId as any)?.name || 'Toko Kelontong'],
        });
      }
    }

    const orders = [
      ...Array.from(grouped.values()),
      ...standalone,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ transactions: orders });
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
