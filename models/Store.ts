import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Store owner is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Store address is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

storeSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'storeId',
  justOne: false,
});

storeSchema.set('toJSON', { virtuals: true });
storeSchema.set('toObject', { virtuals: true });

export const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
