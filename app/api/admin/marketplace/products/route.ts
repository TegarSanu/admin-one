import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product } from '@/models/Product';
import { Store } from '@/models/Store';

/**
 * @swagger
 * /api/admin/marketplace/products:
 *   get:
 *     summary: Retrieve products
 *     description: Returns a list of products, optionally filtered by store ID, search term, and category.
 *     tags:
 *       - Marketplace - Products
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Optional ID of a store to filter products
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional search term for product name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category filter
 *     responses:
 *       200:
 *         description: A list of products
 *       500:
 *         description: Failed to retrieve products
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const products = await Product.find(query).populate('storeId', 'name status').sort({ createdAt: -1 });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/marketplace/products:
 *   post:
 *     summary: Create a product
 *     description: Creates a new product for a specific store.
 *     tags:
 *       - Marketplace - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - storeId
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               storeId:
 *                 type: string
 *                 description: Associated store ID
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    const storeExists = await Store.findById(data.storeId);
    if (!storeExists) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    const newProduct = await Product.create(data);
    return NextResponse.json({ message: 'Product created successfully', product: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
