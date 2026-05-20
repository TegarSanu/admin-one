import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import User from '@/models/User';

/**
 * @swagger
 * /api/admin/marketplace/stores/{id}:
 *   get:
 *     summary: Get a store by ID
 *     description: Retrieve detailed information for a single store by its ID.
 *     tags:
 *       - Marketplace - Stores
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store details retrieved successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const store = await Store.findById(id).populate('owner', 'name email role avatar');
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    return NextResponse.json({ store });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/marketplace/stores/{id}:
 *   put:
 *     summary: Update a store
 *     description: Updates an existing store's fields by ID.
 *     tags:
 *       - Marketplace - Stores
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();
    const updatedStore = await Store.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedStore) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    return NextResponse.json({ message: 'Store updated successfully', store: updatedStore });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/marketplace/stores/{id}:
 *   delete:
 *     summary: Delete a store
 *     description: Deletes an existing store by ID, and deletes all products associated with this store.
 *     tags:
 *       - Marketplace - Stores
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store and its products deleted successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const store = await Store.findByIdAndDelete(id);
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    await Product.deleteMany({ storeId: id });
    return NextResponse.json({ message: 'Store and its products deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
