import mongoose from "mongoose";

const loyaltySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
    },
    lastOrderDate: {
      type: Date,
      default: null,
    },
    pointsHistory: [
      {
        orderId: mongoose.Schema.Types.ObjectId,
        points: Number,
        type: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    redeemedRewards: [
      {
        rewardId: mongoose.Schema.Types.ObjectId,
        redeemDate: { type: Date, default: Date.now },
        pointsSpent: Number,
      },
    ],
  },
  {
    timestamps: true,
  },
);

loyaltySchema.index({ storeId: 1, customerId: 1 });
loyaltySchema.index({ tier: 1 });

export const Loyalty =
  mongoose.models.Loyalty || mongoose.model("Loyalty", loyaltySchema);
