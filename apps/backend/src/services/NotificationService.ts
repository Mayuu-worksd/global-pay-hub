import { INotificationProvider } from "../providers/INotificationProvider";
import { ResendAdapter } from "../providers/notifications/resend/ResendAdapter";
import { TwilioAdapter } from "../providers/notifications/twilio/TwilioAdapter";

export class NotificationService {
  private static resendInstance: ResendAdapter | null = null;
  private static twilioInstance: TwilioAdapter | null = null;

  private static getResend(): ResendAdapter {
    if (!this.resendInstance) {
      this.resendInstance = new ResendAdapter();
    }
    return this.resendInstance;
  }

  private static getTwilio(): TwilioAdapter {
    if (!this.twilioInstance) {
      this.twilioInstance = new TwilioAdapter();
    }
    return this.twilioInstance;
  }

  private static compositeProvider: INotificationProvider = {
    sendEmail: async (to: string, subject: string, body: string) => {
      try {
        if (!process.env.RESEND_API_KEY) {
          console.log(`[Notification Mock] Sending email to ${to}: Subject: ${subject}`);
          console.log(`Body: ${body}`);
          return { success: true, messageId: "mock-email-id" };
        }
        return await NotificationService.getResend().sendEmail(to, subject, body);
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
        return await NotificationService.getTwilio().sendSMS(to, body);
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
