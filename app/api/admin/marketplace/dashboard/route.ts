import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { Role } from '@/models/Role';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import { MarketplaceTransaction } from '@/models/MarketplaceTransaction';
import { CustomerDebt } from '@/models/CustomerDebt';
import { Cashflow } from '@/models/Cashflow';

async function getAuthenticatedUser(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
    );
    const { payload } = await jwtVerify(token, secret);
    await connectToDatabase();
    
    const user = await User.findById(payload.id).populate({ path: 'role', model: Role });
    return user;
  } catch (error) {
    console.error('Auth error in dashboard API:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin =
      user.role?.name === 'Super Admin' || user.role?.name === 'Administrator';

    // 2. Determine target store filter
    const { searchParams } = new URL(req.url);
    let storeIdParam = searchParams.get('storeId') || '';

    let storeFilter: any = {};
    let currentStore = null;

    if (!isSuperAdmin) {
      // Non-admin: search for the store owned by the user
      const ownedStore = await Store.findOne({ owner: user._id });
      if (!ownedStore) {
        return NextResponse.json({ 
          error: 'Forbidden', 
          message: 'User does not own a marketplace store.' 
        }, { status: 403 });
      }
      storeFilter = { storeId: ownedStore._id };
      currentStore = ownedStore;
    } else {
      // Super Admin: if storeId parameter is passed, filter by that store
      if (storeIdParam && storeIdParam !== 'all') {
        const selectedStore = await Store.findById(storeIdParam);
        if (selectedStore) {
          storeFilter = { storeId: selectedStore._id };
          currentStore = selectedStore;
        }
      }
    }

    const storeQueryFilter = currentStore ? { storeId: currentStore._id } : {};
    const productQueryFilter = currentStore ? { storeId: currentStore._id } : {};

    // 3. Today's date boundary
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 4. Aggregate Today's Sales
    const todaySalesData = await MarketplaceTransaction.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          type: 'sale',
          date: { $gte: startOfToday, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const todaySales = todaySalesData[0]?.total || 0;
    const todaySalesCount = todaySalesData[0]?.count || 0;

    // 5. Aggregate Total Transactions count (last 30 days)
    const startOf30DaysAgo = new Date();
    startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);
    startOf30DaysAgo.setHours(0, 0, 0, 0);

    const transactionCount = await MarketplaceTransaction.countDocuments({
      ...storeQueryFilter,
      type: 'sale',
      date: { $gte: startOf30DaysAgo }
    });

    // 6. Low stock products list and count (< 15 stock)
    const lowStockProducts = await Product.find({
      ...productQueryFilter,
      stock: { $lt: 15 },
      status: 'available'
    }).sort({ stock: 1 }).limit(10);
    const lowStockCount = await Product.countDocuments({
      ...productQueryFilter,
      stock: { $lt: 15 },
      status: 'available'
    });

    // 7. Store Balance
    let totalBalance = 0;
    if (currentStore) {
      totalBalance = currentStore.balance || 0;
    } else {
      const allStores = await Store.find({ status: 'active' });
      totalBalance = allStores.reduce((sum, s) => sum + (s.balance || 0), 0);
    }

    // 8. Aggregate 30 Days Sales & Cashflow history for Chart
    const salesHistory = await MarketplaceTransaction.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          date: { $gte: startOf30DaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          salesAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'sale'] }, '$amount', 0]
            }
          },
          purchaseAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'purchase'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Also get cashflow aggregate
    const cashflowHistory = await Cashflow.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          date: { $gte: startOf30DaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          cashIn: {
            $sum: {
              $cond: [{ $eq: ['$type', 'in'] }, '$amount', 0]
            }
          },
          cashOut: {
            $sum: {
              $cond: [{ $eq: ['$type', 'out'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Build complete daily series for the last 30 days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // JS months 0-indexed
      const dateVal = d.getDate();

      const dayName = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      // Match sales
      const salesMatch = salesHistory.find(
        sh => sh._id.year === year && sh._id.month === month && sh._id.day === dateVal
      );

      // Match cashflow
      const cfMatch = cashflowHistory.find(
        cf => cf._id.year === year && cf._id.month === month && cf._id.day === dateVal
      );

      chartData.push({
        dateStr: d.toISOString().split('T')[0],
        name: dayName,
        omzet: salesMatch?.salesAmount || 0,
        pengeluaran: salesMatch?.purchaseAmount || 0,
        cashIn: cfMatch?.cashIn || 0,
        cashOut: cfMatch?.cashOut || 0,
        netCashflow: (cfMatch?.cashIn || 0) - (cfMatch?.cashOut || 0)
      });
    }

    // 9. Best Selling Products (grouped by items in transactions)
    const bestSellers = await MarketplaceTransaction.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          type: 'sale',
          date: { $gte: startOf30DaysAgo }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // 10. Customer Debt and Receivables
    const activeDebts = await CustomerDebt.find({
      ...storeQueryFilter,
      status: { $in: ['unpaid', 'partial'] }
    }).sort({ dueDate: 1 });

    const totalReceivablesData = await CustomerDebt.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          type: 'receivable',
          status: { $in: ['unpaid', 'partial'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);
    const totalReceivables = totalReceivablesData[0]?.total || 0;

    const totalPayablesData = await CustomerDebt.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          type: 'payable',
          status: { $in: ['unpaid', 'partial'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);
    const totalPayables = totalPayablesData[0]?.total || 0;

    // 11. Recent Cashflow Entries
    const recentCashflow = await Cashflow.find(storeQueryFilter)
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    const totalCashInData = await Cashflow.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          type: 'in',
          date: { $gte: startOf30DaysAgo }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCashIn = totalCashInData[0]?.total || 0;

    const totalCashOutData = await Cashflow.aggregate([
      {
        $match: {
          ...storeQueryFilter,
          type: 'out',
          date: { $gte: startOf30DaysAgo }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCashOut = totalCashOutData[0]?.total || 0;

    // Return everything!
    return NextResponse.json({
      success: true,
      role: user.role?.name,
      isSuperAdmin,
      currentStoreName: currentStore?.name || 'Semua Toko (Konsolidasi)',
      currentStoreId: currentStore?._id || 'all',
      stats: {
        todaySales,
        todaySalesCount,
        transactionCount,
        lowStockCount,
        totalBalance,
        totalReceivables,
        totalPayables,
        netCashflowMonth: totalCashIn - totalCashOut
      },
      chartData,
      bestSellers,
      lowStockProducts,
      activeDebts,
      recentCashflow
    });

  } catch (error: any) {
    console.error('Dashboard Overview aggregation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
