import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/CRM';
import { Activity } from '@/models/Activity';
import User from '@/models/User';

/**
 * @swagger
 * /api/admin/crm/leads/{id}:
 *   put:
 *     summary: Update a lead
 *     description: Updates an existing lead's fields by ID.
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *               value:
 *                 type: number
 *               priority:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *       400:
 *         description: Bad request (validation or input error)
 *       404:
 *         description: Lead not found
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();
    
    const lead = await Lead.findByIdAndUpdate(id, body, { new: true }).populate('company', 'name');
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Log Activity
    try {
      const systemUser = await User.findOne({ role: 'Admin' });
      if (systemUser) {
        await Activity.create({
          user: systemUser._id,
          type: 'Update',
          module: 'CRM',
          description: `Updated lead: ${lead.name} (${lead.company?.name})`,
          metadata: { leadId: lead._id }
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * @swagger
 * /api/admin/crm/leads/{id}:
 *   delete:
 *     summary: Delete a lead
 *     description: Deletes an existing lead from the CRM module by ID.
 *     tags:
 *       - CRM - Leads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Lead deleted successfully
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Failed to delete lead
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Log Activity
    try {
      const systemUser = await User.findOne({ role: 'Admin' });
      if (systemUser) {
        await Activity.create({
          user: systemUser._id,
          type: 'Delete',
          module: 'CRM',
          description: `Removed lead: ${lead.name}`,
          metadata: { leadId: lead._id }
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
