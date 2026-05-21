import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: [true, "Payment ID is required"],
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order reference is required"],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "transfer",
        "credit_card",
        "e_wallet",
        "installment",
        "debt",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentGateway: {
      type: String,
      enum: ["midtrans", "stripe", "doku", "manual", "none"],
      default: "none",
    },
    gatewayTransactionId: {
      type: String,
      default: "",
    },
    gatewayReference: {
      type: String,
      default: "",
    },
    paymentProof: {
      type: String,
      default: "",
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ storeId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentGateway: 1 });

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
