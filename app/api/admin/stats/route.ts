import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/CRM';
import User from '@/models/User';
import { Activity } from '@/models/Activity';

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Retrieve CRM statistics
 *     description: Returns aggregated data for leads, revenue, and win rates for the dashboard.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Successful response with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                 charts:
 *                   type: object
 */
export async function GET() {
  try {
    await connectToDatabase();
    
    // Aggregations for dashboard
    const totalLeads = await Lead.countDocuments();
    const closedWon = await Lead.countDocuments({ status: 'Closed Won' });
    const winRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;
    
    const revenueAgg = await Lead.aggregate([
      { $match: { status: 'Closed Won' } },
      { $group: { _id: null, total: { $sum: '$value' }, count: { $sum: 1 } } }
    ]);
    
    const totalRevenue = revenueAgg[0]?.total || 0;
    const avgDealSize = revenueAgg[0]?.count > 0 ? totalRevenue / revenueAgg[0]?.count : 0;
    
    // Get total counts for dashboard overview
    const totalUsers = await User.countDocuments();
    const totalActivities = await Activity.countDocuments();
    
    // Static data for charts (would be aggregated by month in a real app)
    const revenueData = [
      { month: 'Jan', revenue: 45000, forecast: 48000 },
      { month: 'Feb', revenue: 52000, forecast: 50000 },
      { month: 'Mar', revenue: 48000, forecast: 55000 },
      { month: 'Apr', revenue: 61000, forecast: 58000 },
      { month: 'May', revenue: 55000, forecast: 62000 },
      { month: 'Jun', revenue: totalRevenue || 67000, forecast: 65000 },
    ];

    const sourceData = [
      { name: 'Referral', value: 400 },
      { name: 'Direct', value: 300 },
      { name: 'Social', value: 200 },
      { name: 'Ad Campaign', value: 100 },
    ];

    return NextResponse.json({
      stats: {
        totalRevenue,
        winRate,
        totalLeads,
        avgDealSize,
        totalUsers,
        totalActivities
      },
      charts: {
        revenueData,
        sourceData
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

