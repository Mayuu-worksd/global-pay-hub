import { Request, Response } from "express";
import { supabaseAdmin } from "../config/database";
import { logger } from "../utils/logger";

export async function handleUnitWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    logger.info(`Received Unit Webhook Event: ${event.type || "unknown"}`);

    // Log webhook event in database
    await supabaseAdmin.from("webhooks").insert({
      provider: "unit",
      event_type: event.type || "unknown",
      payload: event,
      status: "processed",
      processed_at: new Date().toISOString(),
    });

    // Handle specific event types
    // Unit events format usually: accounts.created, payments.completed, etc.
    const eventType = event.type || "";
    if (eventType === "accounts.created") {
      // Process account creation update
    } else if (eventType === "payments.completed") {
      // Process payment completion
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error(`Unit webhook processing failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleCurrencycloudWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    logger.info(`Received Currencycloud Webhook Event: ${event.event || "unknown"}`);

    await supabaseAdmin.from("webhooks").insert({
      provider: "currencycloud",
      event_type: event.event || "unknown",
      payload: event,
      status: "processed",
      processed_at: new Date().toISOString(),
    });

    return res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error(`Currencycloud webhook processing failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleCryptoWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    logger.info(`Received Crypto Webhook Event: ${event.event || "unknown"}`);

    await supabaseAdmin.from("webhooks").insert({
      provider: "crypto",
      event_type: event.event || "unknown",
      payload: event,
      status: "processed",
      processed_at: new Date().toISOString(),
    });

    return res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error(`Crypto webhook processing failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
import crypto from "crypto";

export async function handleSumsubWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-payload-digest"];
    const secret = process.env.SUMSUB_SECRET_KEY || "";
    
    if (secret && signature) {
      const calculated = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
        
      if (calculated !== signature) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
    }

    const event = req.body;
    logger.info(`Received Sumsub Webhook Event: ${event.type || "unknown"}`);

    await supabaseAdmin.from("webhooks").insert({
      provider: "sumsub",
      event_type: event.type || "unknown",
      payload: event,
      status: "processed",
      processed_at: new Date().toISOString(),
    });

    if (event.type === "applicantReviewed") {
      const applicantId = event.applicantId;
      const reviewResult = event.reviewResult;
      const isApproved = reviewResult?.reviewAnswer === "GREEN";
      const status = isApproved ? "approved" : "rejected";
      const reason = reviewResult?.rejectLabels?.join(", ") || "";

      // Update KYC Records first
      const { data: kyc } = await supabaseAdmin
        .from("kyc_records")
        .update({ status, reject_reason: reason, payload: event, updated_at: new Date().toISOString() })
        .eq("sumsub_applicant_id", applicantId)
        .select()
        .maybeSingle();

      if (kyc) {
        await supabaseAdmin
          .from("profiles")
          .update({ verification_status: status })
          .eq("id", kyc.profile_id);
      } else {
        // Check KYB Records
        const { data: kyb } = await supabaseAdmin
          .from("kyb_records")
          .update({ status, reject_reason: reason, payload: event, updated_at: new Date().toISOString() })
          .eq("sumsub_applicant_id", applicantId)
          .select()
          .maybeSingle();

        if (kyb) {
          await supabaseAdmin
            .from("business_profiles")
            .update({ verification_status: status })
            .eq("id", kyb.business_profile_id);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error(`Sumsub webhook processing failed: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
