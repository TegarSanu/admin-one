import mongoose from "mongoose";

const orderReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
      required: [true, "Return number is required"],
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
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    returnItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        reason: String,
        condition: {
          type: String,
          enum: ["unopened", "opened", "damaged", "defective", "wrong_item"],
          default: "unopened",
        },
        refundAmount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalRefundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    returnReason: {
      type: String,
      required: true,
    },
    returnStatus: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "received",
        "processed",
        "completed",
      ],
      default: "requested",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    customerNotes: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    returnImages: [String],
    requestDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    receivedDate: {
      type: Date,
      default: null,
    },
    processedDate: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        notes: String,
        updatedBy: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  {
    timestamps: true,
  },
);

orderReturnSchema.index({ orderId: 1 });
orderReturnSchema.index({ storeId: 1, createdAt: -1 });
orderReturnSchema.index({ returnStatus: 1 });

export const OrderReturn =
  mongoose.models.OrderReturn ||
  mongoose.model("OrderReturn", orderReturnSchema);
