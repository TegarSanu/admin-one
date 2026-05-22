import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for Guest checkouts
    },
    buyerName: {
      type: String,
      default: "Guest",
    },
    checkoutId: {
      type: String, // Groups multiple store transactions into one unified receipt
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required"],
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        category: {
          type: String,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "balance"],
      default: "cash",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },
    cashReceived: {
      type: Number,
    },
    changeDue: {
      type: Number,
    },
    shippingAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({ buyerId: 1 });
transactionSchema.index({ storeId: 1 });
transactionSchema.index({ createdAt: -1 });

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
