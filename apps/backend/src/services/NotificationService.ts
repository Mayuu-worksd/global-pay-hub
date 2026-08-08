import { INotificationProvider } from "../providers/INotificationProvider";
import { ResendAdapter } from "../providers/notifications/resend/ResendAdapter";
import { TwilioAdapter } from "../providers/notifications/twilio/TwilioAdapter";

export class NotificationService {
  private static resend = new ResendAdapter();
  private static twilio = new TwilioAdapter();

  private static compositeProvider: INotificationProvider = {
    sendEmail: async (to: string, subject: string, body: string) => {
      try {
        if (!process.env.RESEND_API_KEY) {
          console.log(`[Notification Mock] Sending email to ${to}: Subject: ${subject}`);
          console.log(`Body: ${body}`);
          return { success: true, messageId: "mock-email-id" };
        }
        return await this.resend.sendEmail(to, subject, body);
      } catch (err: any) {
        console.error(`Failed to send email to ${to}: ${err.message}`);
        return { success: false };
      }
    },
    sendSMS: async (to: string, body: string) => {
      try {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
          console.log(`[Notification Mock] Sending SMS to ${to}: ${body}`);
          return { success: true, messageId: "mock-sms-id" };
        }
        return await this.twilio.sendSMS(to, body);
      } catch (err: any) {
        console.error(`Failed to send SMS to ${to}: ${err.message}`);
        return { success: false };
      }
    },
    sendPushNotification: async (userId: string, title: string, body: string) => {
      console.log(`[Notification Mock] Sending push notification to ${userId}: [${title}] ${body}`);
      return { success: true };
    }
  };

  public static getProvider(): INotificationProvider {
    return this.compositeProvider;
  }
}
