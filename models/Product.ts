import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required"],
    },
    sku: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    subcategory: {
      type: String,
      default: "",
      trim: true,
    },
    tags: [String],
    image: {
      type: String,
      default: "",
    },
    images: [String],
    variants: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        sku: String,
        price: Number,
        stock: Number,
        image: String,
        options: [
          {
            name: String,
            value: String,
          },
        ],
      },
    ],
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    weight: {
      type: Number,
      default: 0,
      min: 0,
    },
    weightUnit: {
      type: String,
      enum: ["kg", "g", "oz", "lb"],
      default: "kg",
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      unit: { type: String, enum: ["cm", "m", "in"], default: "cm" },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["available", "out_of_stock", "archived", "draft"],
      default: "available",
    },
    visibility: {
      type: String,
      enum: ["public", "private", "hidden"],
      default: "public",
    },
    seo: {
      metaTitle: {
        type: String,
        default: "",
      },
      metaDescription: {
        type: String,
        default: "",
      },
      metaKeywords: [String],
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ storeId: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
