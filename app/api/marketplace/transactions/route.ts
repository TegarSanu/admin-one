import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { MarketplaceTransaction } from '@/models/MarketplaceTransaction';

/**
 * @swagger
 * /api/marketplace/transactions:
 *   get:
 *     summary: Public - Retrieve marketplace transactions
 *     description: Returns a list of all marketplace transactions with store info. No authentication required.
 *     tags:
 *       - Marketplace (Public)
 *     responses:
 *       200:
 *         description: A list of transactions
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const transactions = await MarketplaceTransaction.find({})
      .populate('storeId', 'name address')
      .sort({ date: -1 })
      .limit(100);

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
