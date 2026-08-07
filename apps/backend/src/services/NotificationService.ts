import { INotificationProvider } from "../providers/INotificationProvider";
import { ResendAdapter } from "../providers/notifications/resend/ResendAdapter";
import { TwilioAdapter } from "../providers/notifications/twilio/TwilioAdapter";

export class NotificationService {
  private static instance: INotificationProvider;

  public static getProvider(): INotificationProvider {
    if (!this.instance) {
      const providerType = process.env.NOTIFICATION_PROVIDER || "resend";
      if (providerType === "resend") {
        this.instance = new ResendAdapter();
      } else if (providerType === "twilio") {
        this.instance = new TwilioAdapter();
      } else {
        throw new Error(`Unsupported notification provider: ${providerType}`);
      }
    }
    return this.instance;
  }
}
