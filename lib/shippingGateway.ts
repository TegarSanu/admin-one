// Shipping Integration Helpers
// Supports: JNE, TIKI, Grab, Pos Indonesia

export interface ShippingConfig {
  provider: "jne" | "tiki" | "grab" | "pos";
  apiKey: string;
  apiUrl: string;
}

// JNE Configuration
export const jneConfig: ShippingConfig = {
  provider: "jne",
  apiKey: process.env.JNE_API_KEY || "",
  apiUrl: "https://api.jne.co.id/api",
};

// TIKI Configuration
export const tikiConfig: ShippingConfig = {
  provider: "tiki",
  apiKey: process.env.TIKI_API_KEY || "",
  apiUrl: "https://api.tiki.id/v1",
};

// Grab Configuration
export const grabConfig: ShippingConfig = {
  provider: "grab",
  apiKey: process.env.GRAB_API_KEY || "",
  apiUrl: "https://api.grab.com/grabexpress/v1",
};

// POS Indonesia Configuration
export const posConfig: ShippingConfig = {
  provider: "pos",
  apiKey: process.env.POS_API_KEY || "",
  apiUrl: "https://api.posindonesia.co.id",
};

// Get shipping rates (JNE)
export async function getJNEShippingRates(
  origin: string,
  destination: string,
  weight: number,
) {
  try {
    const response = await fetch(`${jneConfig.apiUrl}/priceList`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jneConfig.apiKey}`,
      },
      body: JSON.stringify({
        origin,
        destination,
        weight,
      }),
    });

    const data = await response.json();
    return data.price_list || [];
  } catch (error) {
    console.error("Error getting JNE shipping rates:", error);
    return [];
  }
}

// Get shipping rates (TIKI)
export async function getTIKIShippingRates(
  origin: string,
  destination: string,
  weight: number,
) {
  try {
    const response = await fetch(`${tikiConfig.apiUrl}/catalogServices`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tikiConfig.apiKey}`,
      },
    });

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error getting TIKI shipping rates:", error);
    return [];
  }
}

// Create shipment (JNE)
export async function createJNEShipment(
  orderNumber: string,
  senderName: string,
  senderPhone: string,
  senderAddress: string,
  receiverName: string,
  receiverPhone: string,
  receiverAddress: string,
  weight: number,
  serviceCode: string,
  items: Array<{ name: string; quantity: number; price: number }>,
) {
  try {
    const response = await fetch(`${jneConfig.apiUrl}/shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jneConfig.apiKey}`,
      },
      body: JSON.stringify({
        ref_num: orderNumber,
        shipper_name: senderName,
        shipper_phone: senderPhone,
        shipper_addr: senderAddress,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_addr: receiverAddress,
        weight,
        service_code: serviceCode,
        items,
      }),
    });

    const data = await response.json();
    return {
      trackingNumber: data.waybill_number,
      shippingId: data.shipment_id,
      estimatedDelivery: data.estimated_delivery,
    };
  } catch (error) {
    console.error("Error creating JNE shipment:", error);
    throw error;
  }
}

// Create shipment (TIKI)
export async function createTIKIShipment(
  orderNumber: string,
  senderName: string,
  senderPhone: string,
  senderAddress: string,
  receiverName: string,
  receiverPhone: string,
  receiverAddress: string,
  weight: number,
  serviceCode: string,
) {
  try {
    const response = await fetch(`${tikiConfig.apiUrl}/shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tikiConfig.apiKey}`,
      },
      body: JSON.stringify({
        order_reference: orderNumber,
        shipper_name: senderName,
        shipper_phone: senderPhone,
        shipper_address: senderAddress,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
        weight,
        service_code: serviceCode,
      }),
    });

    const data = await response.json();
    return {
      trackingNumber: data.waybill_number,
      shippingId: data.shipment_id,
    };
  } catch (error) {
    console.error("Error creating TIKI shipment:", error);
    throw error;
  }
}

// Track shipment (JNE)
export async function trackJNEShipment(trackingNumber: string) {
  try {
    const response = await fetch(
      `${jneConfig.apiUrl}/track?waybill_number=${trackingNumber}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jneConfig.apiKey}`,
        },
      },
    );

    const data = await response.json();
    return {
      status: data.status,
      currentLocation: data.current_location,
      estimatedDelivery: data.estimated_delivery,
      history: data.tracking_history || [],
    };
  } catch (error) {
    console.error("Error tracking JNE shipment:", error);
    throw error;
  }
}

// Track shipment (TIKI)
export async function trackTIKIShipment(trackingNumber: string) {
  try {
    const response = await fetch(
      `${tikiConfig.apiUrl}/track?waybill=${trackingNumber}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tikiConfig.apiKey}`,
        },
      },
    );

    const data = await response.json();
    return {
      status: data.status,
      currentLocation: data.current_location,
      history: data.tracking_history || [],
    };
  } catch (error) {
    console.error("Error tracking TIKI shipment:", error);
    throw error;
  }
}

// Create Grab delivery
export async function createGrabDelivery(
  orderNumber: string,
  pickupLat: number,
  pickupLng: number,
  pickupName: string,
  pickupPhone: string,
  dropoffLat: number,
  dropoffLng: number,
  dropoffName: string,
  dropoffPhone: string,
  itemValue: number,
) {
  try {
    const response = await fetch(`${grabConfig.apiUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grabConfig.apiKey}`,
      },
      body: JSON.stringify({
        merchant_order_id: orderNumber,
        pickup_location: {
          lat: pickupLat,
          lng: pickupLng,
          address: pickupName,
          contact_name: pickupName,
          phone: pickupPhone,
        },
        dropoff_location: {
          lat: dropoffLat,
          lng: dropoffLng,
          address: dropoffName,
          contact_name: dropoffName,
          phone: dropoffPhone,
        },
        item: {
          name: "Order Items",
          value: itemValue,
        },
      }),
    });

    const data = await response.json();
    return {
      grabOrderId: data.grab_order_id,
      trackingUrl: data.tracking_url,
      estimatedDelivery: data.estimated_delivery_time,
    };
  } catch (error) {
    console.error("Error creating Grab delivery:", error);
    throw error;
  }
}
