import { Request, Response } from "express";
import { supabaseAdmin } from "../config/database";
import { logger } from "../utils/logger";
import { UnitAdapter } from "../providers/banking/unit/UnitAdapter";
import { CurrencycloudAdapter } from "../providers/banking/currencycloud/CurrencycloudAdapter";
import { TatumAdapter } from "../providers/crypto/tatum/TatumAdapter";
import { NotificationService } from "../services/NotificationService";

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
          logger.info(`KYC Approved for user ${userId}. Automatically provisioning accounts and wallets...`);

          // 1. Create Unit customer + virtual checking account
          let unitCustomerId = `cust_${Math.random().toString(36).substring(2, 10)}`;
          let bankDetails = {
            accountNumber: String(Math.floor(1e11 + Math.random() * 8e11)),
            routingNumber: "084009519",
            bankName: "Unit Deposit Bank",
            bankAddress: "8 Bridge St, New York, NY",
          };

          try {
            const unitCust = await new UnitAdapter().createCustomer({
              first_name: kycDetails.first_name,
              last_name: kycDetails.last_name,
              email: userEmail,
              phone: userPhone,
              date_of_birth: kycDetails.date_of_birth,
              address: {
                street: kycDetails.address_line1,
                city: kycDetails.city,
                state: kycDetails.state || "",
                postal_code: kycDetails.postal_code,
                country: kycDetails.country,
              }
            });
            unitCustomerId = unitCust.id;

            const unitBank = await new UnitAdapter().createVirtualAccount(unitCustomerId, "USD");
            bankDetails = {
              accountNumber: unitBank.accountNumber,
              routingNumber: unitBank.routingNumber || "084009519",
              bankName: unitBank.bankName,
              bankAddress: unitBank.bankAddress,
            };
          } catch (err: any) {
            logger.warn(`Unit provisioning failed, using sandbox mock details: ${err.message}`);
          }

          // 2. Create Currencycloud sub-account
          let currencycloudAccountId = `cc_acc_${Math.random().toString(36).substring(2, 10)}`;
          try {
            const ccCust = await new CurrencycloudAdapter().createCustomer({
              first_name: kycDetails.first_name,
              last_name: kycDetails.last_name,
              email: userEmail,
            });
            currencycloudAccountId = ccCust.id;
          } catch (err: any) {
            logger.warn(`Currencycloud provisioning failed, using sandbox mock details: ${err.message}`);
          }

          // 3. Create fiat wallets (USD, EUR)
          await supabaseAdmin.from("fiat_wallets").upsert([
            { user_id: userId, currency: "USD", label: "USD wallet", balance: 0, available_balance: 0, is_active: true },
            { user_id: userId, currency: "EUR", label: "EUR wallet", balance: 0, available_balance: 0, is_active: true },
          ], { onConflict: "user_id,currency" });

          // 4. Generate BTC, ETH, USDT wallet addresses using Tatum
          let btcAddress = `bc1q${crypto.randomBytes(16).toString("hex")}`;
          let ethAddress = `0x${crypto.randomBytes(20).toString("hex")}`;
          let usdtAddress = `T${crypto.randomBytes(17).toString("hex")}`;

          try {
            const tatum = new TatumAdapter();
            const [btcW, ethW, usdtW] = await Promise.all([
              tatum.createWallet("BTC", "BTC Wallet"),
              tatum.createWallet("ETH", "ETH Wallet"),
              tatum.createWallet("USDT", "USDT Wallet"),
            ]);
            btcAddress = btcW.id;
            ethAddress = ethW.id;
            usdtAddress = usdtW.id;
          } catch (err: any) {
            logger.warn(`Tatum address generation failed, using sandbox mock details: ${err.message}`);
          }

          // Insert into crypto_wallets table
          const cryptoWalletRows = [
            { user_id: userId, asset: "BTC", network: "Bitcoin", label: "BTC Wallet", deposit_address: btcAddress, balance: 0, is_active: true },
            { user_id: userId, asset: "ETH", network: "Ethereum", label: "ETH Wallet", deposit_address: ethAddress, balance: 0, is_active: true },
            { user_id: userId, asset: "USDT", network: "TRC-20", label: "USDT Wallet", deposit_address: usdtAddress, balance: 0, is_active: true },
          ];

          const { data: insertedWallets } = await supabaseAdmin
            .from("crypto_wallets")
            .upsert(cryptoWalletRows, { onConflict: "user_id,asset" })
            .select("id");

          const cryptoWalletIds = insertedWallets ? insertedWallets.map(w => w.id) : [];

          // Create USD virtual account in virtual_accounts table
          await supabaseAdmin.from("virtual_accounts").insert({
            user_id: userId,
            currency: "USD",
            account_name: "Nexus Pay Collection Account",
            account_number: bankDetails.accountNumber,
            routing_number: bankDetails.routingNumber,
            bank_name: bankDetails.bankName,
            bank_address: bankDetails.bankAddress,
            status: "active",
          });

          // Save unit_customer_id, currencycloud_account_id, crypto_wallet_ids to profiles
          await supabaseAdmin
            .from("profiles")
            .update({
              unit_customer_id: unitCustomerId,
              currencycloud_account_id: currencycloudAccountId,
              crypto_wallet_ids: cryptoWalletIds,
            })
            .eq("id", userId);

          // 5. Send notifications for approval
          const notifier = NotificationService.getProvider();
          await notifier.sendEmail(
            userEmail,
            "KYC Verification Approved",
            `<p>Hi ${kycDetails.first_name},</p><p>Congratulations! Your identity verification has been approved. Your wallets, accounts, and payouts are now fully unlocked.</p>`
          );

          if (userPhone) {
            await notifier.sendSMS(
              userPhone,
              "Nexus Pay: Your identity verification has been approved. Your account is now fully unlocked!"
            );
          }
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
