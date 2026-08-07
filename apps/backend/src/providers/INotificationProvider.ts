export interface INotificationProvider {
  sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string }>;
  sendSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string }>;
  sendPushNotification(userId: string, title: string, body: string): Promise<{ success: boolean }>;
}
