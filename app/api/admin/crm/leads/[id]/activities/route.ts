import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/CRM';
import { Activity } from '@/models/Activity';
import User from '@/models/User';

/**
 * @swagger
 * /api/admin/crm/leads/{id}/activities:
 *   post:
 *     summary: Log a new activity for a lead
 *     description: Creates an activity log entry linked to a specific lead and updates the lead's last contacted timestamp.
 *     tags:
 *       - CRM - Leads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of activity (e.g., 'call', 'email', 'meeting')
 *               description:
 *                 type: string
 *                 description: Details of the activity
 *     responses:
 *       201:
 *         description: Activity logged successfully
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Internal server error
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();
    const { type, description } = body;
    
    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const systemUser = await User.findOne({ role: 'Admin' });
    if (!systemUser) {
        return NextResponse.json({ error: 'System user not found' }, { status: 500 });
    }

    // Create Activity record
    const activity = await Activity.create({
      user: systemUser._id,
      type: type, // 'call', 'email', etc.
      module: 'CRM',
      description: description,
      metadata: { leadId: id }
    });

    // Update Lead's last contacted date
    lead.lastContacted = new Date();
    await lead.save();

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to log lead activity:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
