import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { NotificationService } from "../services/NotificationService";
import { notificationSchema } from "../validators/schema";
import { supabaseAdmin } from "../config/database";

export async function sendNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const validated = notificationSchema.parse(req.body);

    const provider = NotificationService.getProvider();
    let result;

    if (validated.type === "email") {
      result = await provider.sendEmail(validated.to, validated.title || "Notification", validated.body);
    } else if (validated.type === "sms") {
      result = await provider.sendSMS(validated.to, validated.body);
    } else {
      result = await provider.sendPushNotification(userId || "", validated.title || "Alert", validated.body);
    }

    // Save to Database `notifications`
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: validated.type,
      title: validated.title || "System Notification",
      message: validated.body,
      is_read: false,
    });

    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
