import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Notification } from "@/models/Notification";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const isRead = searchParams.get("isRead");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (userId) query.userId = userId;
    if (isRead !== null) query.isRead = isRead === "true";

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      link,
      priority,
      channel,
    } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId: relatedId || null,
      relatedModel: relatedModel || null,
      link: link || "",
      priority: priority || "medium",
      channel: channel || "in_app",
    });

    await notification.save();

    return NextResponse.json(
      {
        success: true,
        notification,
        message: "Notification created successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
