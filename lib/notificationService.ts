// Notification Service
// Supports: Email, SMS, WhatsApp, In-App

import nodemailer from "nodemailer";
import { Notification } from "@/models/Notification";

// Email Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
});

// Email notification template
function getEmailTemplate(
  type: string,
  data: any,
): { subject: string; html: string } {
  const templates: Record<string, any> = {
    order_received: {
      subject: `Pesanan ${data.orderNumber} Diterima`,
      html: `
        <h2>Terima kasih telah berbelanja!</h2>
        <p>Pesanan Anda ${data.orderNumber} telah diterima.</p>
        <p>Total: <strong>Rp ${data.totalAmount?.toLocaleString("id-ID")}</strong></p>
        <p><a href="${data.trackingUrl}">Lihat Detail Pesanan</a></p>
      `,
    },
    order_shipped: {
      subject: `Pesanan ${data.orderNumber} Telah Dikirim`,
      html: `
        <h2>Pesanan Anda Telah Dikirim!</h2>
        <p>Tracking number: <strong>${data.trackingNumber}</strong></p>
        <p><a href="${data.trackingUrl}">Lacak Pesanan</a></p>
      `,
    },
    order_delivered: {
      subject: `Pesanan ${data.orderNumber} Telah Tiba`,
      html: `
        <h2>Pesanan Anda Telah Sampai!</h2>
        <p>Terima kasih sudah berbelanja bersama kami.</p>
        <p><a href="${data.reviewUrl}">Beri Review</a></p>
      `,
    },
    payment_received: {
      subject: `Pembayaran Diterima - ${data.orderNumber}`,
      html: `
        <h2>Pembayaran Berhasil!</h2>
        <p>Kami telah menerima pembayaran Anda sebesar Rp ${data.amount?.toLocaleString("id-ID")}.</p>
        <p>Reference: <strong>${data.paymentId}</strong></p>
      `,
    },
    refund_processed: {
      subject: `Refund Berhasil - ${data.orderNumber}`,
      html: `
        <h2>Refund Berhasil Diproses!</h2>
        <p>Refund sebesar Rp ${data.refundAmount?.toLocaleString("id-ID")} telah diproses.</p>
        <p>Perkiraan: ${data.estimatedDays} hari kerja untuk masuk ke rekening Anda.</p>
      `,
    },
  };

  return (
    templates[type] || { subject: "Notifikasi", html: "<p>Notification</p>" }
  );
}

// Send Email
export async function sendEmail(
  to: string,
  type: string,
  data: any,
): Promise<boolean> {
  try {
    const template = getEmailTemplate(type, data);

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@marketplace.com",
      to,
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Send SMS (using Twilio or similar)
export async function sendSMS(
  phone: string,
  type: string,
  data: any,
): Promise<boolean> {
  try {
    const messages: Record<string, string> = {
      order_received: `Pesanan ${data.orderNumber} diterima. Total: Rp ${data.totalAmount?.toLocaleString("id-ID")}`,
      order_shipped: `Pesanan Anda telah dikirim. No resi: ${data.trackingNumber}`,
      order_delivered: `Pesanan telah tiba. Terima kasih!`,
      payment_received: `Pembayaran Rp ${data.amount?.toLocaleString("id-ID")} berhasil diterima`,
      refund_processed: `Refund Rp ${data.refundAmount?.toLocaleString("id-ID")} sedang diproses`,
    };

    const message = messages[type] || "Notifikasi dari marketplace";

    // TODO: Implement actual SMS sending (Twilio, AWS SNS, etc)
    console.log(`SMS to ${phone}: ${message}`);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

// Send WhatsApp
export async function sendWhatsApp(
  phone: string,
  type: string,
  data: any,
): Promise<boolean> {
  try {
    const messages: Record<string, string> = {
      order_received: `Halo! Pesanan ${data.orderNumber} Anda telah diterima. Total: Rp ${data.totalAmount?.toLocaleString("id-ID")}`,
      order_shipped: `Pesanan Anda telah dikirim! 📦\nNo resi: ${data.trackingNumber}`,
      order_delivered: `Pesanan telah sampai! 🎉 Terima kasih sudah berbelanja.`,
      payment_received: `Pembayaran berhasil diterima! ✓ Rp ${data.amount?.toLocaleString("id-ID")}`,
      refund_processed: `Refund Anda sedang diproses. Rp ${data.refundAmount?.toLocaleString("id-ID")}`,
    };

    const message = messages[type] || "Notifikasi dari marketplace";

    // TODO: Implement actual WhatsApp sending (Twilio, WhatsApp Business API, etc)
    console.log(`WhatsApp to ${phone}: ${message}`);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return false;
  }
}

// Create in-app notification
export async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string,
  relatedModel?: string,
  link?: string,
): Promise<any> {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      link,
      channel: "in_app",
      priority: type.includes("urgent") ? "urgent" : "medium",
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating in-app notification:", error);
    return null;
  }
}

// Send multi-channel notification
export async function sendMultiChannelNotification(
  userId: string,
  userEmail: string,
  userPhone: string,
  type: string,
  title: string,
  message: string,
  data: any,
  channels: Array<"email" | "sms" | "whatsapp" | "in_app"> = ["in_app"],
): Promise<void> {
  try {
    // Create in-app notification
    if (channels.includes("in_app")) {
      await createInAppNotification(
        userId,
        type,
        title,
        message,
        data.relatedId,
        data.relatedModel,
        data.link,
      );
    }

    // Send email
    if (channels.includes("email") && userEmail) {
      await sendEmail(userEmail, type, data);
    }

    // Send SMS
    if (channels.includes("sms") && userPhone) {
      await sendSMS(userPhone, type, data);
    }

    // Send WhatsApp
    if (channels.includes("whatsapp") && userPhone) {
      await sendWhatsApp(userPhone, type, data);
    }
  } catch (error) {
    console.error("Error sending multi-channel notification:", error);
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  try {
    await Notification.findByIdAndUpdate(notificationId, {
      isRead: true,
      readAt: new Date(),
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}
