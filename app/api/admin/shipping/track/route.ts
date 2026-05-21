import { NextRequest, NextResponse } from "next/server";
import { trackJNEShipment, trackTIKIShipment } from "@/lib/shippingGateway";

/**
 * Track Shipment
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const trackingNumber = searchParams.get("trackingNumber");

    if (!provider || !trackingNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    let trackingInfo: any;

    if (provider === "jne") {
      trackingInfo = await trackJNEShipment(trackingNumber);
    } else if (provider === "tiki") {
      trackingInfo = await trackTIKIShipment(trackingNumber);
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported shipping provider" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      trackingInfo,
      provider,
    });
  } catch (error: any) {
    console.error("Error tracking shipment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
