import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { Role } from '@/models/Role';
import { Store } from '@/models/Store';
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
    return await User.findById(payload.id).populate({ path: 'role', model: Role });
  } catch (error) {
    return null;
  }
}

// Record a new debt/receivable
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { customerName, type, amount, description, dueDate } = data;
    let { storeId } = data;

    const isSuperAdmin =
      user.role?.name === 'Super Admin' || user.role?.name === 'Administrator';

    // Verify/get store
    let targetStore = null;
    if (!isSuperAdmin) {
      targetStore = await Store.findOne({ owner: user._id });
      if (!targetStore) {
        return NextResponse.json({ error: 'Forbidden', message: 'You do not own a store.' }, { status: 403 });
      }
      storeId = targetStore._id;
    } else {
      if (!storeId || storeId === 'all') {
        // Find first active store for default if none selected
        targetStore = await Store.findOne({ status: 'active' });
        storeId = targetStore?._id;
      }
    }

    if (!storeId) {
      return NextResponse.json({ error: 'Bad Request', message: 'Store reference required.' }, { status: 400 });
    }

    const newDebt = await CustomerDebt.create({
      storeId,
      customerName,
      type,
      amount: Number(amount),
      remainingAmount: Number(amount),
      description,
      status: 'unpaid',
      dueDate: new Date(dueDate)
    });

    return NextResponse.json({
      success: true,
      message: 'Catatan hutang/piutang berhasil dibuat!',
      debt: newDebt
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create debt error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Pay off a debt / record partial payment
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { debtId, paymentAmount } = data;

    if (!debtId || !paymentAmount || Number(paymentAmount) <= 0) {
      return NextResponse.json({ error: 'Bad Request', message: 'Missing debtId or invalid paymentAmount.' }, { status: 400 });
    }

    const debt = await CustomerDebt.findById(debtId);
    if (!debt) {
      return NextResponse.json({ error: 'Not Found', message: 'Debt entry not found.' }, { status: 404 });
    }

    const isSuperAdmin =
      user.role?.name === 'Super Admin' || user.role?.name === 'Administrator';

    // Authorization check
    if (!isSuperAdmin) {
      const ownedStore = await Store.findOne({ owner: user._id });
      if (!ownedStore || ownedStore._id.toString() !== debt.storeId.toString()) {
        return NextResponse.json({ error: 'Forbidden', message: 'Not authorized for this store.' }, { status: 403 });
      }
    }

    const pay = Number(paymentAmount);
    let newRemaining = debt.remainingAmount - pay;
    if (newRemaining < 0) newRemaining = 0;

    let newStatus = 'partial';
    if (newRemaining === 0) {
      newStatus = 'paid';
    }

    debt.remainingAmount = newRemaining;
    debt.status = newStatus;
    await debt.save();

    // Create Cashflow Entry automatically!
    const cfType = debt.type === 'receivable' ? 'in' : 'out';
    const cfCategory = debt.type === 'receivable' ? 'sale' : 'purchase';
    const cfDesc = debt.type === 'receivable'
      ? `Pembayaran piutang oleh ${debt.customerName} sebesar ${pay.toLocaleString('id-ID')}`
      : `Pembayaran hutang toko ke ${debt.customerName} sebesar ${pay.toLocaleString('id-ID')}`;

    await Cashflow.create({
      storeId: debt.storeId,
      type: cfType,
      amount: pay,
      category: cfCategory,
      description: cfDesc,
      date: new Date()
    });

    // Adjust store balance if applicable!
    const store = await Store.findById(debt.storeId);
    if (store) {
      if (cfType === 'in') {
        store.balance = (store.balance || 0) + pay;
      } else {
        store.balance = (store.balance || 0) - pay;
      }
      await store.save();
    }

    return NextResponse.json({
      success: true,
      message: newStatus === 'paid' ? 'Hutang/piutang lunas terbayar!' : 'Cicilan pembayaran berhasil dicatat!',
      debt
    });

  } catch (error: any) {
    console.error('Update debt error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
