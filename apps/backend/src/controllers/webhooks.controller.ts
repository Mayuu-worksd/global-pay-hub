import { Request, Response } from "express";
import { supabaseAdmin } from "../config/database";
import { logger } from "../utils/logger";
import { UnitAdapter } from "../providers/banking/unit/UnitAdapter";
import { CurrencycloudAdapter } from "../providers/banking/currencycloud/CurrencycloudAdapter";
import { TatumAdapter } from "../providers/crypto/tatum/TatumAdapter";
import { NotificationService } from "../services/NotificationService";
import { ProvisioningService } from "../services/ProvisioningService";

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

    const eventType = event.type || "";
    // Handle deposit transaction completion
    if (eventType === "transaction.created" || eventType === "transaction.updated" || event.data?.type === "transaction") {
      const txData = event.data;
      if (txData && txData.attributes.direction === "Credit" && txData.attributes.status === "Completed") {
        const customerId = txData.relationships?.customer?.data?.id;
        const amount = txData.attributes.amount / 100; // Cents to USD
        const reference = txData.id;

        if (customerId) {
          const { data: existingTx } = await supabaseAdmin
            .from("transactions")
            .select("id")
            .eq("reference", reference)
            .maybeSingle();

          if (!existingTx) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("unit_customer_id", customerId)
              .maybeSingle();

            if (profile) {
              const userId = profile.id;
              const { data: wallet } = await supabaseAdmin
                .from("fiat_wallets")
                .select("id, balance")
                .eq("user_id", userId)
                .eq("currency", "USD")
                .maybeSingle();

              if (wallet) {
                const nextBalance = Number(wallet.balance) + amount;
                await supabaseAdmin
                  .from("fiat_wallets")
                  .update({ balance: nextBalance, available_balance: nextBalance })
                  .eq("id", wallet.id);

                await supabaseAdmin.from("transactions").insert({
                  user_id: userId,
                  type: "deposit",
                  amount: amount,
                  currency: "USD",
                  status: "completed",
                  description: txData.attributes.description || "Incoming Unit ACH Credit",
                  reference: reference,
                });

                logger.info(`Unit Webhook: Credited ${amount} USD to user ${userId}`);
              }
            }
          }
        }
      }
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

    const eventType = event.event || "";
    if (eventType === "transaction_completed" || eventType === "transaction_created") {
      const txData = event.data;
      if (txData && txData.action === "credit") {
        const ccAccountId = txData.account_id;
        const amount = parseFloat(txData.amount);
        const currency = txData.currency;
        const reference = txData.transaction_id;

        if (ccAccountId) {
          const { data: existingTx } = await supabaseAdmin
            .from("transactions")
            .select("id")
            .eq("reference", reference)
            .maybeSingle();

          if (!existingTx) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("currencycloud_account_id", ccAccountId)
              .maybeSingle();

            if (profile) {
              const userId = profile.id;
              const { data: wallet } = await supabaseAdmin
                .from("fiat_wallets")
                .select("id, balance")
                .eq("user_id", userId)
                .eq("currency", currency.toUpperCase())
                .maybeSingle();

              if (wallet) {
                const nextBalance = Number(wallet.balance) + amount;
                await supabaseAdmin
                  .from("fiat_wallets")
                  .update({ balance: nextBalance, available_balance: nextBalance })
                  .eq("id", wallet.id);

                await supabaseAdmin.from("transactions").insert({
                  user_id: userId,
                  type: "deposit",
                  amount: amount,
                  currency: currency.toUpperCase(),
                  status: "completed",
                  description: `Incoming Currencycloud ${currency} credit`,
                  reference: reference,
                });

                logger.info(`Currencycloud Webhook: Credited ${amount} ${currency} to user ${userId}`);
              }
            }
          }
        }
      }
    }

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

    const address = event.address;
    const amount = parseFloat(event.amount || "0");
    const asset = event.asset || event.currency;
    const txId = event.txId || event.hash;
    const type = event.type;

    if (address && amount > 0 && type === "incoming") {
      const { data: existingTx } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("reference", txId)
        .maybeSingle();

      if (!existingTx) {
        const { data: wallet } = await supabaseAdmin
          .from("crypto_wallets")
          .select("id, user_id, balance")
          .eq("deposit_address", address)
          .maybeSingle();

        if (wallet) {
          const nextBalance = Number(wallet.balance) + amount;
          await supabaseAdmin
            .from("crypto_wallets")
            .update({ balance: nextBalance })
            .eq("id", wallet.id);

          await supabaseAdmin.from("transactions").insert({
            user_id: wallet.user_id,
            type: "deposit",
            amount: amount,
            currency: asset.toUpperCase(),
            status: "completed",
            description: `${asset.toUpperCase()} on-chain deposit detected`,
            reference: txId,
          });

          logger.info(`Crypto Webhook: Credited ${amount} ${asset} to user ${wallet.user_id}`);
        }
      }
    }

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

      // Update KYC Records first using updated columns (provider_reference, rejection_reason)
      const { data: kyc } = await supabaseAdmin
        .from("kyc_records")
        .update({ status, rejection_reason: reason, payload: event, updated_at: new Date().toISOString() })
        .eq("provider_reference", applicantId)
        .select()
        .maybeSingle();

      if (kyc) {
        const userId = kyc.user_id;

        // Retrieve user form details to provision banking
        const { data: kycDetails } = await supabaseAdmin
          .from("kyc")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .maybeSingle();

        const userEmail = profile?.email || kycDetails?.email || "user@example.com";
        const userPhone = kycDetails?.phone || "";

        // Update basic verification statuses on kyc and profiles table
        await supabaseAdmin
          .from("profiles")
          .update({
            verification_status: status,
            kyc_completed: isApproved,
            onboarding_completed: isApproved,
          })
          .eq("id", userId);

        await supabaseAdmin
          .from("kyc")
          .update({ status })
          .eq("user_id", userId);

        if (isApproved && kycDetails) {
          await ProvisioningService.provisionUser(userId, kycDetails, userEmail, userPhone);
        } else if (status === "rejected" && kycDetails) {
          // Send notification for rejection
          const notifier = NotificationService.getProvider();
          await notifier.sendEmail(
            userEmail,
            "KYC Verification Rejected",
            `<p>Hi ${kycDetails.first_name},</p><p>Unfortunately, your identity verification application was not approved.</p><p><strong>Reason:</strong> ${reason || "Information verification failed"}</p><p>Please start the verification process again and ensure all documents are correct.</p>`
          );
        }
      } else {
        // Fallback or Check KYB Records using updated columns (provider_reference, rejection_reason)
        const { data: kyb } = await supabaseAdmin
          .from("kyb_records")
          .update({ status, rejection_reason: reason, payload: event, updated_at: new Date().toISOString() })
          .eq("provider_reference", applicantId)
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
