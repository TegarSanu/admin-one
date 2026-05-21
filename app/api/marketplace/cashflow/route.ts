import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Cashflow } from '@/models/Cashflow';

/**
 * @swagger
 * /api/marketplace/cashflow:
 *   get:
 *     summary: Public - Retrieve cashflow analytics
 *     description: Returns aggregated cashflow statistics and recent entries. No authentication required.
 *     tags:
 *       - Marketplace (Public)
 *     responses:
 *       200:
 *         description: Cashflow statistics and records
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const records = await Cashflow.find({})
      .populate('storeId', 'name address')
      .sort({ date: -1 })
      .limit(200);

    // Aggregate stats
    let totalIn = 0;
    let totalOut = 0;
    const categoryBreakdown: Record<string, { in: number; out: number; count: number }> = {};

    // Daily aggregation for chart (last 30 days)
    const dailyMap: Record<string, { in: number; out: number }> = {};

    for (const record of records) {
      const amount = record.amount || 0;
      if (record.type === 'in') {
        totalIn += amount;
      } else {
        totalOut += amount;
      }

      // Category breakdown
      const cat = record.category || 'other';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { in: 0, out: 0, count: 0 };
      }
      categoryBreakdown[cat].count++;
      if (record.type === 'in') {
        categoryBreakdown[cat].in += amount;
      } else {
        categoryBreakdown[cat].out += amount;
      }

      // Daily aggregation
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { in: 0, out: 0 };
      }
      if (record.type === 'in') {
        dailyMap[dateKey].in += amount;
      } else {
        dailyMap[dateKey].out += amount;
      }
    }

    // Convert daily map to sorted array
    const dailyData = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return NextResponse.json({
      stats: {
        totalIn,
        totalOut,
        netIncome: totalIn - totalOut,
        totalTransactions: records.length,
      },
      categoryBreakdown,
      dailyData,
      records,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
