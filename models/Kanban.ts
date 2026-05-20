import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKanbanColumn extends Document {
  title: string;
  key: string;
  order: number;
}

export interface IKanbanTask extends Document {
  title: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  date: string;
  columnId: string;
  order: number;
}

const KanbanColumnSchema = new Schema<IKanbanColumn>(
  {
    title: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const KanbanTaskSchema = new Schema<IKanbanTask>(
  {
    title: { type: String, required: true },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    category: { type: String, default: "General" },
    date: { type: String, required: true },
    columnId: { type: String, required: true }, // References KanbanColumn.key
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent mongoose from compiling the model multiple times in Next.js development
export const KanbanColumn: Model<IKanbanColumn> =
  mongoose.models.KanbanColumn || mongoose.model<IKanbanColumn>("KanbanColumn", KanbanColumnSchema);

export const KanbanTask: Model<IKanbanTask> =
  mongoose.models.KanbanTask || mongoose.model<IKanbanTask>("KanbanTask", KanbanTaskSchema);
