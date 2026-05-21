import { NextRequest, NextResponse } from "next/server";
import {
  getJNEShippingRates,
  getTIKIShippingRates,
  trackJNEShipment,
  trackTIKIShipment,
} from "@/lib/shippingGateway";

/**
 * Get Shipping Rates
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const weight = parseInt(searchParams.get("weight") || "1");

    if (!provider || !origin || !destination) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    let rates: any[] = [];

    if (provider === "jne") {
      rates = await getJNEShippingRates(origin, destination, weight);
    } else if (provider === "tiki") {
      rates = await getTIKIShippingRates(origin, destination, weight);
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported shipping provider" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      rates,
      provider,
    });
  } catch (error: any) {
    console.error("Error getting shipping rates:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * Create Shipment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Implementation for creating shipment
    // This will be handled by specific route handlers

    return NextResponse.json({
      success: true,
      message: "Use specific endpoints for shipment creation",
    });
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
