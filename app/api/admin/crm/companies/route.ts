import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Company, Lead } from '@/models/CRM';

/**
 * @swagger
 * /api/admin/crm/companies:
 *   get:
 *     summary: Get all companies with statistics
 *     description: Returns a list of all companies along with their aggregated lead counts and total lead values.
 *     tags:
 *       - CRM - Companies
 *     responses:
 *       200:
 *         description: A list of companies with stats
 *       500:
 *         description: Failed to fetch companies
 */
export async function GET() {
  try {
    await connectToDatabase();
    
    // Use aggregation to get companies with lead stats
    const companies = await Company.aggregate([
      {
        $lookup: {
          from: 'leads',
          localField: '_id',
          foreignField: 'company',
          as: 'leads'
        }
      },
      {
        $project: {
          name: 1,
          industry: 1,
          size: 1,
          website: 1,
          address: 1,
          createdAt: 1,
          activeLeads: { $size: '$leads' },
          totalValue: { $sum: '$leads.value' }
        }
      },
      { $sort: { name: 1 } }
    ]);

    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error("Failed to fetch companies:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/crm/companies:
 *   post:
 *     summary: Create a new company
 *     description: Creates a new company record in the CRM module.
 *     tags:
 *       - CRM - Companies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *               size:
 *                 type: string
 *               website:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Bad request (validation error)
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const company = await Company.create(body);
    return NextResponse.json({ company }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
