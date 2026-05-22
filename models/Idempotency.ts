import mongoose from "mongoose";

const idempotencySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    checkoutId: { type: String, required: true },
    transactions: { type: Array, default: [] },
    responseData: { type: Object, default: {} },
  },
  { timestamps: true },
);

// TTL index to expire records after 24 hours
idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export const Idempotency =
  mongoose.models.Idempotency ||
  mongoose.model("Idempotency", idempotencySchema);
