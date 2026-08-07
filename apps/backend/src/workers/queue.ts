import { logger } from "../utils/logger";
import axios from "axios";
import { supabaseAdmin } from "../config/database";

export async function processQueueJob(job: { type: string; payload: any }) {
  logger.info(`Processing background queue job of type: ${job.type}`);
  try {
    switch (job.type) {
      case "NOTIFICATION_EMAIL":
        logger.info(`Processing email delivery to ${job.payload.to}`);
        break;
      case "WITHDRAWAL_PAYOUT":
        logger.info(`Processing outbound banking wire transaction`);
        break;
      case "MERCHANT_WEBHOOK":
        const { eventId, merchantId, url, eventType, data } = job.payload;
        logger.info(`Dispatching webhook event ${eventType} to merchant ${merchantId} at ${url}`);
        
        try {
          await axios.post(url, {
            event: eventType,
            data: data,
            timestamp: new Date().toISOString(),
          }, {
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "GlobalPay-Webhook-Dispatcher/1.0",
            },
            timeout: 10000, // 10s timeout
          });

          await supabaseAdmin
            .from("webhook_events")
            .update({ status: "delivered", attempts: 1 })
            .eq("id", eventId);
            
          logger.info(`Successfully delivered webhook ${eventId}`);
        } catch (err: any) {
          logger.error(`Webhook delivery failed for ${eventId}: ${err.message}`);
          await supabaseAdmin
            .from("webhook_events")
            .update({ status: "failed", attempts: 1 })
            .eq("id", eventId);
        }
        break;
      default:
        logger.warn(`Unregistered queue job type: ${job.type}`);
    }
  } catch (err: any) {
    logger.error(`Queue job failed: ${err.message}`);
  }
}

