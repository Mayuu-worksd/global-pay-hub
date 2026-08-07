import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { BankingService } from "../services/BankingService";
import { exchangeSchema, beneficiarySchema, withdrawSchema } from "../validators/schema";
import { supabaseAdmin } from "../config/database";

export async function getWallets(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { data, error } = await supabaseAdmin.from("wallets").select("*").eq("user_id", userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createWallet(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { currency, label } = req.body;
    if (!currency) return res.status(400).json({ error: "Currency is required." });

    const { data, error } = await supabaseAdmin.from("fiat_wallets").insert({
      user_id: userId,
      currency: currency.toUpperCase(),
      label: label || `${currency.toUpperCase()} Wallet`,
      balance: 0,
      available_balance: 0,
      is_active: true,
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function executeExchange(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const validated = exchangeSchema.parse(req.body);

    const bankingProvider = BankingService.getProvider();
    // Assuming simple conversion rate for demo / mapping Currencycloud FX
    const rate = 1.1; // Simulated exchange rate
    const convertedAmount = validated.amount * rate;

    // Save in DB exchange_orders
    const { data, error: dbErr } = await supabaseAdmin.from("exchange_orders").insert({
      user_id: userId,
      from_currency: validated.from,
      to_currency: validated.to,
      from_amount: validated.amount,
      to_amount: convertedAmount,
      rate,
      status: "completed",
    }).select().single();

    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function createBeneficiary(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const validated = beneficiarySchema.parse(req.body);

    const bankingProvider = BankingService.getProvider();
    const result = await bankingProvider.createBeneficiary(validated);

    // Save to DB beneficiaries
    const { data, error: dbErr } = await supabaseAdmin.from("beneficiaries").insert({
      user_id: userId,
      name: validated.name,
      currency: validated.currency,
      country: validated.country,
      iban: validated.iban,
      swift_bic: validated.swift_bic || result.id,
      bank_name: "Mapped Bank",
    }).select().single();

    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function executeWithdraw(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const validated = withdrawSchema.parse(req.body);

    const bankingProvider = BankingService.getProvider();
    const result = await bankingProvider.sendPayment({
      accountId: validated.accountId,
      beneficiaryId: validated.beneficiaryId,
      amount: validated.amount,
      currency: validated.currency,
      reference: validated.reference,
    });

    // Record transaction
    const { data, error: dbErr } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "withdrawal",
      amount: validated.amount,
      currency: validated.currency,
      status: "pending",
      description: `Withdrawal via banking integration`,
      reference: result.id,
    }).select().single();

    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getStatements(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed");

    if (error) return res.status(500).json({ error: error.message });
    return res.json({
      userId,
      generatedAt: new Date().toISOString(),
      transactionsCount: data.length,
      transactions: data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createVirtualAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { currency } = req.body;
    if (!currency) return res.status(400).json({ error: "Currency is required." });

    // 1. Fetch user role
    const { data: userRecord, error: userErr } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (userErr || !userRecord) {
      return res.status(404).json({ error: "User record not found." });
    }

    const bankingProvider = BankingService.getProvider();
    let accountDetails;

    if (userRecord.role === "merchant") {
      // Merchant: Use Currencycloud (or Unit if corporate USD is target)
      const { data: bizProfile, error: bizErr } = await supabaseAdmin
        .from("business_profiles")
        .select("currencycloud_account_id, legal_name")
        .eq("merchant_id", userId)
        .maybeSingle();

      if (bizErr || !bizProfile) {
        return res.status(404).json({ error: "Business profile not found." });
      }

      let ccAccountId = bizProfile.currencycloud_account_id;
      if (!ccAccountId) {
        // Create Currencycloud sub-account on the fly
        const ccRes = await bankingProvider.createCustomer({
          first_name: bizProfile.legal_name,
          last_name: "Corp",
          email: req.user?.email || `${userId}@merchant.com`,
          phone: "0000000000",
          date_of_birth: "2000-01-01",
          address: { street: "Main St", city: "London", state: "", postal_code: "EC1A", country: "GB" }
        });
        ccAccountId = ccRes.id;
        
        await supabaseAdmin
          .from("business_profiles")
          .update({ currencycloud_account_id: ccAccountId })
          .eq("merchant_id", userId);
      }

      accountDetails = await bankingProvider.createVirtualAccount(ccAccountId, currency);
    } else {
      // Individual: Use Unit (or Currencycloud contact for multi-currency EUR/GBP)
      const { data: profile, error: profErr } = await supabaseAdmin
        .from("profiles")
        .select("unit_customer_id, first_name, last_name, phone, address_street, address_city, address_state, address_zip, address_country")
        .eq("id", userId)
        .maybeSingle();

      if (profErr || !profile) {
        return res.status(404).json({ error: "User profile not found." });
      }

      let customerId = profile.unit_customer_id;
      if (!customerId) {
        const unitRes = await bankingProvider.createCustomer({
          first_name: profile.first_name || "Individual",
          last_name: profile.last_name || "User",
          email: req.user?.email || `${userId}@individual.com`,
          phone: profile.phone || "0000000000",
          date_of_birth: "2000-01-01",
          address: {
            street: profile.address_street || "Street",
            city: profile.address_city || "City",
            state: profile.address_state || "State",
            postal_code: profile.address_zip || "00000",
            country: profile.address_country || "US"
          }
        });
        customerId = unitRes.id;

        await supabaseAdmin
          .from("profiles")
          .update({ unit_customer_id: customerId })
          .eq("id", userId);
      }

      accountDetails = await bankingProvider.createVirtualAccount(customerId, currency);
    }

    // Save virtual account details in DB
    const { data: virtualAcc, error: dbErr } = await supabaseAdmin.from("virtual_accounts").insert({
      user_id: userId,
      currency: currency.toUpperCase(),
      account_number: accountDetails.accountNumber,
      routing_number: accountDetails.routingNumber || null,
      iban: accountDetails.iban || null,
      swift_bic: accountDetails.swift_bic || null,
      bank_name: accountDetails.bankName,
      bank_address: accountDetails.bankAddress,
      status: "active",
    }).select().single();

    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.json(virtualAcc);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

