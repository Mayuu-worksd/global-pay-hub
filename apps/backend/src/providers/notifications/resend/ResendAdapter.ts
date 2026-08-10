import { INotificationProvider } from "../../INotificationProvider";
import axios, { AxiosInstance } from "axios";

export class ResendAdapter implements INotificationProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || "";
    this.client = axios.create({
      baseURL: "https://api.resend.com",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string }> {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Resend API Key not configured.");
    }
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const response = await this.client.post("/emails", {
      from: from,
      to: [to],
      subject: subject,
      html: body,
    });
    return {
      success: true,
      messageId: response.data.id,
    };
  }

  async sendSMS(to: string, body: string): Promise<{ success: boolean }> {
    throw new Error("SMS not supported by Resend.");
  }

  async sendPushNotification(userId: string, title: string, body: string): Promise<{ success: boolean }> {
    throw new Error("Push notifications not supported by Resend.");
  }
}
