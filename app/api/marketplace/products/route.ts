import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product } from '@/models/Product';
import { Store } from '@/models/Store';

/**
 * @swagger
 * /api/marketplace/products:
 *   get:
 *     summary: Public - Retrieve available products
 *     description: Returns a list of available products with store info. Supports filtering by storeId, category, and search. No authentication required.
 *     tags:
 *       - Marketplace (Public)
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *     responses:
 *       200:
 *         description: A list of products
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const query: any = { status: 'available' };
    if (storeId) query.storeId = storeId;
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .populate('storeId', 'name address')
      .sort({ createdAt: -1 });

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
