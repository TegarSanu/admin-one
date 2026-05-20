import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Store } from '@/models/Store';
import User from '@/models/User';

/**
 * @swagger
 * /api/admin/marketplace/stores:
 *   get:
 *     summary: Retrieve stores
 *     description: Returns a list of stores, optionally filtered by search term and status.
 *     tags:
 *       - Marketplace - Stores
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching name or address
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (e.g., 'Active', 'Inactive')
 *     responses:
 *       200:
 *         description: A list of stores
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    const stores = await Store.find(query)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ stores });
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/marketplace/stores:
 *   post:
 *     summary: Create a store
 *     description: Creates a new store record in the marketplace.
 *     tags:
 *       - Marketplace - Stores
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - owner
 *             properties:
 *               name:
 *                 type: string
 *               owner:
 *                 type: string
 *                 description: Owner User ID reference
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: 'Active'
 *     responses:
 *       201:
 *         description: Store created successfully
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    const newStore = await Store.create(data);
    return NextResponse.json({ message: 'Store created successfully', store: newStore }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
