import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Lead, Company } from "@/models/CRM";

/**
 * @swagger
 * /api/admin/search:
 *   get:
 *     summary: Global dashboard search
 *     description: Performs concurrent search for leads and companies matching the query query parameter 'q'.
 *     tags:
 *       - Global Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query matching name, value, status, or industry
 *     responses:
 *       200:
 *         description: Concurrent list of leads and companies matching the query
 *       500:
 *         description: Failed to search
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");

    if (!q || q.trim() === "") {
      return NextResponse.json({ leads: [], companies: [] });
    }

    const searchRegex = new RegExp(q, "i");

    // Execute concurrent queries for extreme performance
    const [leads, companies] = await Promise.all([
      Lead.find({ name: searchRegex })
        .select("name value status _id")
        .limit(5)
        .lean(),
      Company.find({ name: searchRegex })
        .select("name industry _id")
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({ leads, companies });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
