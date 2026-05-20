import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Store } from '@/models/Store';

/**
 * @swagger
 * /api/marketplace/stores:
 *   get:
 *     summary: Public - Retrieve active stores
 *     description: Returns a list of active stores. No authentication required.
 *     tags:
 *       - Marketplace (Public)
 *     responses:
 *       200:
 *         description: A list of active stores
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    await connectDB();
    const stores = await Store.find({ status: 'active' }).sort({ createdAt: -1 });
    return NextResponse.json({ stores });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
