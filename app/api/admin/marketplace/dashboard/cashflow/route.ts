import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { Role } from '@/models/Role';
import { Store } from '@/models/Store';
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

// Record a new cashflow entry manually
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { type, amount, category, description } = data;
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
      } else {
        targetStore = await Store.findById(storeId);
      }
    }

    if (!storeId || !targetStore) {
      return NextResponse.json({ error: 'Bad Request', message: 'Store reference required.' }, { status: 400 });
    }

    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      return NextResponse.json({ error: 'Bad Request', message: 'Invalid cashflow amount.' }, { status: 400 });
    }

    const newCashflow = await Cashflow.create({
      storeId,
      type,
      amount: val,
      category,
      description,
      date: new Date()
    });

    // Update store balance!
    if (type === 'in') {
      targetStore.balance = (targetStore.balance || 0) + val;
    } else {
      targetStore.balance = (targetStore.balance || 0) - val;
    }
    await targetStore.save();

    return NextResponse.json({
      success: true,
      message: 'Transaksi arus kas berhasil dicatat!',
      cashflow: newCashflow,
      newBalance: targetStore.balance
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create cashflow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
