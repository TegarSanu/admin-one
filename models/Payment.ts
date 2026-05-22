import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    checkoutId: { type: String, required: true },
    transactionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["cash", "qris"], required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
    qrPayload: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ checkoutId: 1 });

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
