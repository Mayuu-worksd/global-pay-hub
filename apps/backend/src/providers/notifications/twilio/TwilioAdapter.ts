import { INotificationProvider } from "../../INotificationProvider";
import axios, { AxiosInstance } from "axios";

export class TwilioAdapter implements INotificationProvider {
  private client: AxiosInstance;
  private accountSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const auth = Buffer.from(`${this.accountSid}:${authToken}`).toString("base64");

    this.client = axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`,
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean }> {
    throw new Error("Email not supported by Twilio SMS API.");
  }

  async sendSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string }> {
    if (!this.accountSid || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio configuration missing.");
    }
    const from = process.env.TWILIO_PHONE_NUMBER || "";
    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", from);
    params.append("Body", body);

    const response = await this.client.post("/Messages.json", params.toString());
    return {
      success: true,
      messageId: response.data.sid,
    };
  }

  async sendPushNotification(userId: string, title: string, body: string): Promise<{ success: boolean }> {
    throw new Error("Push notifications not supported by Twilio SMS API.");
  }
}
