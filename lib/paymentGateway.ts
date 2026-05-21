// Payment Gateway Integration Helpers
// Supports: Midtrans, Stripe, DOKU

export interface PaymentConfig {
  gateway: "midtrans" | "stripe" | "doku";
  clientKey?: string;
  serverKey?: string;
  merchantId?: string;
  apiKey?: string;
  environment: "sandbox" | "production";
}

// Midtrans Configuration
export const midtransConfig: PaymentConfig = {
  gateway: "midtrans",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
};

// Stripe Configuration
export const stripeConfig: PaymentConfig = {
  gateway: "stripe",
  apiKey: process.env.STRIPE_SECRET_KEY || "",
  clientKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
};

// DOKU Configuration
export const dokuConfig: PaymentConfig = {
  gateway: "doku",
  merchantId: process.env.DOKU_MERCHANT_ID || "",
  apiKey: process.env.DOKU_API_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
};

// Midtrans Payment Snap Token
export async function createMidtransSnapToken(
  orderId: string,
  amount: number,
  customerEmail: string,
  customerName: string,
  customerPhone: string,
) {
  try {
    const response = await fetch(
      "https://app.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(midtransConfig.serverKey!).toString("base64")}`,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: amount,
          },
          customer_details: {
            email: customerEmail,
            first_name: customerName,
            phone: customerPhone,
          },
        }),
      },
    );

    const data = await response.json();
    return {
      token: data.token,
      redirectUrl: data.redirect_url,
    };
  } catch (error) {
    console.error("Error creating Midtrans snap token:", error);
    throw error;
  }
}

// Stripe Payment Intent
export async function createStripePaymentIntent(
  orderId: string,
  amount: number,
  customerEmail: string,
  customerName: string,
) {
  try {
    const stripe = require("stripe")(stripeConfig.apiKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "idr",
      metadata: {
        orderId,
        customerName,
        customerEmail,
      },
      receipt_email: customerEmail,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Error creating Stripe payment intent:", error);
    throw error;
  }
}

// DOKU Payment
export async function createDokuPayment(
  orderId: string,
  amount: number,
  customerEmail: string,
  customerName: string,
) {
  try {
    const response = await fetch("https://api.doku.com/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": dokuConfig.apiKey,
      },
      body: JSON.stringify({
        order_id: orderId,
        amount,
        currency: "IDR",
        customer: {
          email: customerEmail,
          name: customerName,
        },
      }),
    });

    const data = await response.json();
    return {
      invoiceId: data.invoice_id,
      paymentUrl: data.payment_url,
    };
  } catch (error) {
    console.error("Error creating DOKU payment:", error);
    throw error;
  }
}

// Verify Payment (Midtrans)
export async function verifyMidtransPayment(transactionId: string) {
  try {
    const response = await fetch(
      `https://api.midtrans.com/v2/${transactionId}/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(midtransConfig.serverKey!).toString("base64")}`,
        },
      },
    );

    const data = await response.json();
    return {
      status: data.transaction_status,
      transactionId: data.transaction_id,
      orderId: data.order_id,
      paidAt: data.transaction_time,
    };
  } catch (error) {
    console.error("Error verifying Midtrans payment:", error);
    throw error;
  }
}

// Process Refund (Midtrans)
export async function processMidtransRefund(
  transactionId: string,
  refundAmount?: number,
) {
  try {
    const response = await fetch(
      `https://api.midtrans.com/v2/${transactionId}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(midtransConfig.serverKey!).toString("base64")}`,
        },
        body: JSON.stringify(
          refundAmount ? { refund_amount: refundAmount } : {},
        ),
      },
    );

    const data = await response.json();
    return {
      refundId: data.refund_key,
      status: data.refund_status,
    };
  } catch (error) {
    console.error("Error processing Midtrans refund:", error);
    throw error;
  }
}

// Process Refund (Stripe)
export async function processStripeRefund(
  paymentIntentId: string,
  amount?: number,
) {
  try {
    const stripe = require("stripe")(stripeConfig.apiKey);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      refundId: refund.id,
      status: refund.status,
    };
  } catch (error) {
    console.error("Error processing Stripe refund:", error);
    throw error;
  }
}
