import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product } from '@/models/Product';
import { MarketplaceTransaction } from '@/models/MarketplaceTransaction';
import { Cashflow } from '@/models/Cashflow';

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface CheckoutBody {
  items: CheckoutItem[];
  customerName?: string;
  paymentMethod?: 'cash' | 'transfer' | 'debt';
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body: CheckoutBody = await req.json();
    const { items, customerName = '', paymentMethod = 'cash' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 1. Fetch all products and validate stock
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products were not found. Please refresh and try again.' },
        { status: 404 }
      );
    }

    const errors: string[] = [];
    const validatedItems: {
      product: any;
      quantity: number;
    }[] = [];

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }
      if (product.status !== 'available') {
        errors.push(`"${product.name}" is no longer available`);
        continue;
      }
      if (product.stock < item.quantity) {
        errors.push(
          `"${product.name}" only has ${product.stock} left in stock (requested ${item.quantity})`
        );
        continue;
      }
      validatedItems.push({ product, quantity: item.quantity });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Stock validation failed', details: errors },
        { status: 400 }
      );
    }

    // 2. Deduct stock for all products
    for (const { product, quantity } of validatedItems) {
      const newStock = product.stock - quantity;
      product.stock = newStock;
      if (newStock === 0) {
        product.status = 'out_of_stock';
      }
      await product.save();
    }

    // 3. Group items by storeId and create transactions
    const storeGroups: Record<string, typeof validatedItems> = {};
    for (const item of validatedItems) {
      const storeId = item.product.storeId.toString();
      if (!storeGroups[storeId]) storeGroups[storeId] = [];
      storeGroups[storeId].push(item);
    }

    const transactions = [];

    for (const [storeId, storeItems] of Object.entries(storeGroups)) {
      const transactionItems = storeItems.map(({ product, quantity }) => ({
        productId: product._id,
        name: product.name,
        quantity,
        price: product.price,
      }));

      const totalAmount = transactionItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      // Create MarketplaceTransaction
      const transaction = await MarketplaceTransaction.create({
        storeId,
        type: 'sale',
        amount: totalAmount,
        paymentMethod,
        customerName,
        items: transactionItems,
        date: new Date(),
      });

      // 4. Create Cashflow entry
      const itemNames = transactionItems.map((i) => `${i.name} x${i.quantity}`).join(', ');
      await Cashflow.create({
        storeId,
        type: 'in',
        amount: totalAmount,
        category: 'sale',
        description: `Penjualan: ${itemNames} (${paymentMethod}) - ${customerName || 'Guest'}`,
        date: new Date(),
      });

      transactions.push(transaction);
    }

    return NextResponse.json({
      success: true,
      message: `Checkout berhasil! ${transactions.length} transaksi tercatat.`,
      transactions,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
