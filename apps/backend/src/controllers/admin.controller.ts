import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../config/database";
import {
  handleUnitWebhook,
  handleCurrencycloudWebhook,
  handleCryptoWebhook,
  handleSumsubWebhook,
} from "./webhooks.controller";

export async function getAdminData(req: AuthenticatedRequest, res: Response) {
  try {
    const [
      profiles,
      fiatWallets,
      cryptoWallets,
      transactions,
      apiKeys,
      webhooks,
      auditLogs,
      kycRecords
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("fiat_wallets").select("*"),
      supabaseAdmin.from("crypto_wallets").select("*"),
      supabaseAdmin.from("transactions").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("merchant_api_keys").select("*"),
      supabaseAdmin.from("webhook_events").select("*").order("created_at", { ascending: false }).limit(100),
      supabaseAdmin.from("audit_logs").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("kyc").select("*").order("created_at", { ascending: false }),
    ]);

    return res.json({
      profiles: profiles.data || [],
      fiatWallets: fiatWallets.data || [],
      cryptoWallets: cryptoWallets.data || [],
      transactions: transactions.data || [],
      merchantApiKeys: apiKeys.data || [],
      webhooks: webhooks.data || [],
      auditLogs: auditLogs.data || [],
      kycs: kycRecords.data || [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}

export async function toggleUserSuspension(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId, currentStatus } = req.body;
    if (!userId || !currentStatus) {
      return res.status(400).json({ error: "userId and currentStatus are required." });
    }
    const targetStatus = currentStatus === "rejected" ? "approved" : "rejected";
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ verification_status: targetStatus })
      .eq("id", userId);
    if (error) throw error;

    // Add audit log
    const actionName = targetStatus === "rejected" ? "SUSPEND_USER" : "REACTIVATE_USER";
    await supabaseAdmin.from("audit_logs").insert({
      user_id: req.user?.id || null,
      action: actionName,
      entity_type: "profile",
      entity_id: userId,
      details: {
        admin_email: req.user?.email || "System",
        target: userId
      }
    });

    return res.json({ success: true, status: targetStatus });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}

export async function toggleMerchantSuspension(req: AuthenticatedRequest, res: Response) {
  try {
    const { merchantId, currentStatus } = req.body;
    if (!merchantId || !currentStatus) {
      return res.status(400).json({ error: "merchantId and currentStatus are required." });
    }
    const targetStatus = currentStatus === "rejected" ? "approved" : "rejected";
    const { error } = await supabaseAdmin
      .from("business_profiles")
      .update({ verification_status: targetStatus })
      .eq("id", merchantId);
    if (error) throw error;

    const actionName = targetStatus === "rejected" ? "SUSPEND_MERCHANT" : "REACTIVATE_MERCHANT";
    await supabaseAdmin.from("audit_logs").insert({
      user_id: req.user?.id || null,
      action: actionName,
      entity_type: "business_profile",
      entity_id: merchantId,
      details: {
        admin_email: req.user?.email || "System",
        target: merchantId
      }
    });

    return res.json({ success: true, status: targetStatus });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}

export async function toggleWalletFreeze(req: AuthenticatedRequest, res: Response) {
  try {
    const { walletId, kind, currentActive } = req.body;
    if (!walletId || !kind || currentActive === undefined) {
      return res.status(400).json({ error: "walletId, kind, and currentActive are required." });
    }
    const targetState = !currentActive;
    const table = kind === "fiat" ? "fiat_wallets" : "crypto_wallets";
    const { error } = await supabaseAdmin
      .from(table)
      .update({ is_active: targetState })
      .eq("id", walletId);
    if (error) throw error;

    const actionName = targetState ? "UNFREEZE_WALLET" : "FREEZE_WALLET";
    await supabaseAdmin.from("audit_logs").insert({
      user_id: req.user?.id || null,
      action: actionName,
      entity_type: table,
      entity_id: walletId,
      details: {
        admin_email: req.user?.email || "System",
        target: walletId
      }
    });

    return res.json({ success: true, active: targetState });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}

export async function toggleApiKey(req: AuthenticatedRequest, res: Response) {
  try {
    const { keyId, currentActive } = req.body;
    if (!keyId || currentActive === undefined) {
      return res.status(400).json({ error: "keyId and currentActive are required." });
    }
    const targetState = !currentActive;
    const { error } = await supabaseAdmin
      .from("merchant_api_keys")
      .update({ is_active: targetState })
      .eq("id", keyId);
    if (error) throw error;

    return res.json({ success: true, active: targetState });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}

export async function retryWebhook(req: AuthenticatedRequest, res: Response) {
  try {
    const { webhookId } = req.body;
    if (!webhookId) {
      return res.status(400).json({ error: "webhookId is required." });
    }

    const { data: record, error } = await supabaseAdmin
      .from("webhook_events")
      .select("*")
      .eq("id", webhookId)
      .maybeSingle();

    if (error || !record) {
      return res.status(404).json({ error: "Webhook record not found." });
    }

    // Mock Express Request & Response
    const mockReq = {
      body: record.payload,
      headers: {},
    } as any;

    let responseStatus = 200;
    let responseData: any = null;

    const mockRes = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(data: any) {
        responseData = data;
        return this;
      },
      send(data: any) {
        responseData = data;
        return this;
      }
    } as any;

    // Dispatch to the correct provider handler based on provider
    const provider = record.provider?.toLowerCase();
    if (provider === "unit") {
      await handleUnitWebhook(mockReq, mockRes);
    } else if (provider === "currencycloud") {
      await handleCurrencycloudWebhook(mockReq, mockRes);
    } else if (provider === "crypto" || provider === "tatum") {
      await handleCryptoWebhook(mockReq, mockRes);
    } else if (provider === "sumsub") {
      await handleSumsubWebhook(mockReq, mockRes);
    } else {
      return res.status(400).json({ error: `Unsupported webhook provider: ${provider}` });
    }

    // Update status in the database
    const success = responseStatus >= 200 && responseStatus < 300;
    const finalStatus = success ? "processed" : "failed";
    
    await supabaseAdmin
      .from("webhook_events")
      .update({
        status: finalStatus,
        processed_at: new Date().toISOString()
      })
      .eq("id", webhookId);

    // Save to audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: req.user?.id || null,
      action: "RETRY_WEBHOOK",
      entity_type: "webhook",
      entity_id: webhookId,
      details: {
        admin_email: req.user?.email || "System",
        provider,
        responseStatus,
        responseData
      }
    });

    return res.json({ success, status: finalStatus, responseStatus, responseData });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
}
