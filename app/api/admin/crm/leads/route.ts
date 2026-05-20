import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/CRM';

/**
 * @swagger
 * /api/admin/crm/leads:
 *   get:
 *     summary: Get all leads
 *     description: Returns a list of all leads, optionally filtered by status and priority.
 *     tags:
 *       - CRM - Leads
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Optional status filter (e.g., 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Optional priority filter (e.g., 'Low', 'Medium', 'High')
 *     responses:
 *       200:
 *         description: A list of leads
 *       500:
 *         description: Failed to fetch leads
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    let query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const leads = await Lead.find(query)
      .populate('company', 'name industry')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/crm/leads:
 *   post:
 *     summary: Create a new lead
 *     description: Creates a new lead in the CRM.
 *     tags:
 *       - CRM - Leads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - company
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *                 description: Company ObjectId reference
 *               status:
 *                 type: string
 *                 default: 'New'
 *               value:
 *                 type: number
 *               priority:
 *                 type: string
 *                 default: 'Medium'
 *               assignedTo:
 *                 type: string
 *                 description: User ObjectId reference
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         description: Bad request (validation error)
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const lead = await Lead.create(body);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
