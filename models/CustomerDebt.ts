import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer/Supplier name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['payable', 'receivable'], // payable = hutang toko ke pihak lain, receivable = piutang pelanggan ke toko
      required: [true, 'Debt type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining amount is required'],
      min: [0, 'Remaining amount cannot be negative'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
  },
  {
    timestamps: true,
  }
);

debtSchema.index({ storeId: 1, status: 1 });

export const CustomerDebt =
  mongoose.models.CustomerDebt ||
  mongoose.model('CustomerDebt', debtSchema);
