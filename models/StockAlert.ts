import mongoose from "mongoose";

const stockAlertSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      unique: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required"],
    },
    minStockLevel: {
      type: Number,
      required: [true, "Minimum stock level is required"],
      min: 0,
      default: 10,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      required: true,
      min: 1,
      default: 50,
    },
    alertStatus: {
      type: String,
      enum: ["ok", "low", "critical", "out_of_stock"],
      default: "ok",
    },
    lastAlertSent: {
      type: Date,
      default: null,
    },
    alertFrequency: {
      type: String,
      enum: ["once", "daily", "weekly"],
      default: "once",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    notifyVia: {
      email: { type: Boolean, default: true },
      in_app: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

stockAlertSchema.index({ storeId: 1, alertStatus: 1 });
stockAlertSchema.index({ productId: 1 });

export const StockAlert =
  mongoose.models.StockAlert || mongoose.model("StockAlert", stockAlertSchema);
