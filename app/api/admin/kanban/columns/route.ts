import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { KanbanColumn, KanbanTask } from "@/models/Kanban";

/**
 * @swagger
 * /api/admin/kanban/columns:
 *   get:
 *     summary: Retrieve Kanban columns and tasks
 *     description: Returns a list of Kanban columns, each containing their associated Kanban tasks sorted by order.
 *     tags:
 *       - Kanban
 *     responses:
 *       200:
 *         description: A list of columns and tasks
 *       500:
 *         description: Failed to fetch Kanban data
 */
export async function GET() {
  try {
    await connectDB();
    
    // Fetch all columns sorted by order
    const columns = await KanbanColumn.find().sort({ order: 1 }).lean();
    
    // Fetch all tasks
    const tasks = await KanbanTask.find().sort({ order: 1 }).lean();

    // Group tasks by column
    const formattedColumns = columns.map(col => ({
      id: col.key,
      title: col.title,
      tasks: tasks
        .filter(t => t.columnId === col.key)
        .map(t => ({
          id: t._id.toString(),
          title: t.title,
          priority: t.priority,
          date: t.date,
          category: t.category,
        }))
    }));

    return NextResponse.json(formattedColumns);
  } catch (error) {
    console.error("Failed to fetch kanban data", error);
    return NextResponse.json({ error: "Failed to fetch kanban data" }, { status: 500 });
  }
}
