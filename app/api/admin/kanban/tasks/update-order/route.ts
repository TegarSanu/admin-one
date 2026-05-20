import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { KanbanTask } from "@/models/Kanban";

/**
 * @swagger
 * /api/admin/kanban/tasks/update-order:
 *   put:
 *     summary: Update Kanban task order and columns
 *     description: Perform bulk updates to move tasks between columns or reorder them.
 *     tags:
 *       - Kanban
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - columnId
 *                     - order
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Task ID
 *                     columnId:
 *                       type: string
 *                       description: The target column ID (key)
 *                     order:
 *                       type: integer
 *                       description: Zero-based sort index
 *     responses:
 *       200:
 *         description: Kanban tasks updated successfully
 *       400:
 *         description: Invalid updates format
 *       500:
 *         description: Failed to update Kanban tasks
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid updates format" }, { status: 400 });
    }

    // Execute bulk update operations in parallel for performance
    const bulkOps = updates.map((update: any) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { columnId: update.columnId, order: update.order } }
      }
    }));

    if (bulkOps.length > 0) {
      await KanbanTask.bulkWrite(bulkOps);
    }

    return NextResponse.json({ success: true, message: "Tasks updated" });
  } catch (error) {
    console.error("Failed to update kanban tasks", error);
    return NextResponse.json({ error: "Failed to update kanban tasks" }, { status: 500 });
  }
}
