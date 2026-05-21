import mongoose from 'mongoose';

const cashflowSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
    },
    type: {
      type: String,
      enum: ['in', 'out'], // in = cash masuk, out = cash keluar
      required: [true, 'Cashflow type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    category: {
      type: String,
      enum: ['sale', 'purchase', 'operational', 'other'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

cashflowSchema.index({ storeId: 1, date: -1 });

export const Cashflow =
  mongoose.models.Cashflow ||
  mongoose.model('Cashflow', cashflowSchema);
