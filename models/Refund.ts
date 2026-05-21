import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      unique: true,
      required: [true, "Refund ID is required"],
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order reference is required"],
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: [true, "Payment reference is required"],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required"],
    },
    returnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderReturn",
      default: null,
    },
    refundAmount: {
      type: Number,
      required: [true, "Refund amount is required"],
      min: 0,
    },
    refundReason: {
      type: String,
      enum: [
        "return",
        "cancellation",
        "product_issue",
        "payment_error",
        "customer_request",
        "other",
      ],
      required: true,
    },
    refundMethod: {
      type: String,
      enum: ["original_payment", "bank_transfer", "e_wallet", "store_credit"],
      default: "original_payment",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "rejected"],
      default: "pending",
    },
    bankAccount: {
      bankName: String,
      accountName: String,
      accountNumber: String,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    gatewayRefundId: {
      type: String,
      default: "",
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

refundSchema.index({ orderId: 1 });
refundSchema.index({ storeId: 1, createdAt: -1 });
refundSchema.index({ status: 1 });

export const Refund =
  mongoose.models.Refund || mongoose.model("Refund", refundSchema);
