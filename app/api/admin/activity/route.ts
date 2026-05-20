import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Activity } from '@/models/Activity';

/**
 * @swagger
 * /api/admin/activity:
 *   get:
 *     summary: Retrieve system and lead activity logs
 *     description: Returns a list of activity logs, optionally filtered by lead ID.
 *     tags:
 *       - Activities
 *     parameters:
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Optional ID of a lead to filter activities
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: A list of activities
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    
    await connectToDatabase();
    
    let query: any = {};
    if (leadId) {
      query['metadata.leadId'] = leadId;
    }
    
    const activities = await Activity.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
      
    return NextResponse.json({ activities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
