import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { OrderReturn } from "@/models/OrderReturn";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const orderReturn = await OrderReturn.findById(params.id)
      .populate("orderId", "orderNumber customerName")
      .populate("storeId", "name")
      .populate("approvedBy", "name email");

    if (!orderReturn) {
      return NextResponse.json(
        { success: false, error: "Return not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, return: orderReturn });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const body = await req.json();
    const { returnStatus, adminNotes, approvedBy } = body;

    const orderReturn = await OrderReturn.findById(params.id);
    if (!orderReturn) {
      return NextResponse.json(
        { success: false, error: "Return not found" },
        { status: 404 },
      );
    }

    // Add status history
    orderReturn.statusHistory.push({
      status: returnStatus,
      timestamp: new Date(),
      notes: adminNotes || "",
      updatedBy: approvedBy,
    });

    orderReturn.returnStatus = returnStatus;
    orderReturn.adminNotes = adminNotes || orderReturn.adminNotes;
    orderReturn.approvedBy = approvedBy || orderReturn.approvedBy;

    if (returnStatus === "approved") {
      orderReturn.approvalDate = new Date();
    } else if (returnStatus === "received") {
      orderReturn.receivedDate = new Date();
    } else if (returnStatus === "completed") {
      orderReturn.processedDate = new Date();
    }

    await orderReturn.save();

    return NextResponse.json({
      success: true,
      return: orderReturn,
      message: "Return status updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
