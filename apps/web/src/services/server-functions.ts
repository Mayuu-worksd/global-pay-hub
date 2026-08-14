import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { unitService } from "./unit";
import { currencycloudService } from "./currencycloud";
import axios from "axios";

function randomHex(length: number) {
  const chars = "0123456789abcdef";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function tatumGenerateAddress(asset: string): Promise<string> {
  const apiKey = process.env['TATUM_API_KEY'] || "";
  const client = axios.create({ baseURL: "https://api.tatum.io/v3", headers: { "x-api-key": apiKey } });
  try {
    if (asset === "BTC") {
      const wallet = await client.get("/bitcoin/wallet");
      const addr = await client.get(`/bitcoin/address/${wallet.data.xpub}/0`);
      return addr.data.address;
    }
    if (asset === "ETH") {
      const wallet = await client.get("/ethereum/wallet");
      const addr = await client.get(`/ethereum/address/${wallet.data.xpub}/0`);
      return addr.data.address;
    }
    if (asset === "USDT") {
      const wallet = await client.get("/tron/wallet");
      const addr = await client.get(`/tron/address/${wallet.data.xpub}/0`);
      return addr.data.address;
    }
    throw new Error(`Unsupported asset for address generation: ${asset}`);
  } catch (err: any) {
    throw new Error(`Tatum address generation failed for ${asset}: ${err.message}`);
  }
}

export const serverSubmitKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: Record<string, unknown>) => data)
  .handler(async ({ data: values, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Trigger Unit application creation
    const app = await unitService.createApplication(userId, {
      first_name: String(values['first_name'] || ""),
      last_name: String(values['last_name'] || ""),
      date_of_birth: String(values['date_of_birth'] || ""),
      nationality: String(values['nationality'] || ""),
      phone: String(values['phone'] || ""),
      address_line1: String(values['address_line1'] || ""),
      city: String(values['city'] || ""),
      state: String(values['state'] || ""),
      postal_code: String(values['postal_code'] || ""),
      country: String(values['country'] || ""),
      email: String(values['email'] || context.claims.email || ""),
      id_document_type: String(values['id_document_type'] || "Passport"),
      id_document_number: String(values['id_document_number'] || ""),
    });

    const isApproved = app.status === "Approved";

    // 2. Save KYC application tracking references
    const { error: kycError } = await supabaseAdmin.from("kyc").upsert(
      {
        ...values,
        user_id: userId,
        status: isApproved ? "approved" : "pending",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (kycError) throw kycError;

    // 3. Update profile details
    const fullName = `${values['first_name'] || ""} ${values['last_name'] || ""}`.trim();
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName || null,
        phone: String(values['phone'] || ""),
        country: String(values['country'] || ""),
        unit_application_id: app.id,
        unit_customer_id: app.customerId || null,
        profile_completed: true,
        kyc_completed: isApproved,
        onboarding_completed: isApproved,
      })
      .eq("id", userId);
    if (profileError) throw profileError;

    // 4. Provision default wallets if approved instantly
    if (isApproved) {
      await supabaseAdmin.from("fiat_wallets").upsert([
        { user_id: userId, currency: "USD", label: "USD wallet", balance: 0, available_balance: 0, is_active: true },
        { user_id: userId, currency: "EUR", label: "EUR wallet", balance: 0, available_balance: 0, is_active: true },
      ], { onConflict: "user_id,currency" });

      // Generate real deposit addresses from Tatum
      const [btcAddress, ethAddress, usdtAddress] = await Promise.all([
        tatumGenerateAddress("BTC"),
        tatumGenerateAddress("ETH"),
        tatumGenerateAddress("USDT"),
      ]);
      await supabaseAdmin.from("crypto_wallets").upsert([
        { user_id: userId, asset: "BTC", network: "Bitcoin", label: "BTC wallet", deposit_address: btcAddress, balance: 0, is_active: true },
        { user_id: userId, asset: "ETH", network: "Ethereum", label: "ETH wallet", deposit_address: ethAddress, balance: 0, is_active: true },
        { user_id: userId, asset: "USDT", network: "TRC-20", label: "USDT wallet", deposit_address: usdtAddress, balance: 0, is_active: true },
      ], { onConflict: "user_id,asset" });

      // Create USD virtual account on Unit
      if (!app.customerId) throw new Error("Unit customer ID missing after KYC approval");
      const bankDetails = await unitService.createAccount(app.customerId, "USD");
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
    }

    return { status: app.status };
  });

export const serverCreateVirtualAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((currency: string) => currency)
  .handler(async ({ data: currency, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch user details
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) throw new Error("Profile not found");

    if (currency === "USD") {
      // Use Unit
      if (!profile.unit_customer_id) throw new Error("Unit customer not provisioned. Complete KYC first.");
      const customerId = profile.unit_customer_id;
      const bankDetails = await unitService.createAccount(customerId, "USD");

      const { error } = await supabaseAdmin.from("virtual_accounts").insert({
        user_id: userId,
        currency: "USD",
        account_name: "Nexus Pay USD Account",
        account_number: bankDetails.accountNumber,
        routing_number: bankDetails.routingNumber,
        bank_name: bankDetails.bankName,
        bank_address: bankDetails.bankAddress,
        status: "active",
      });
      if (error) throw error;
    } else {
      // Use Currencycloud
      let ccAccId = profile.currencycloud_account_id;
      let ccContId = profile.currencycloud_contact_id;

      if (!ccAccId) {
        // Create account
        const ccAcc = await currencycloudService.createSubAccount(userId, profile.full_name || `User_${userId}`);
        ccAccId = ccAcc.id;

        // Create contact
        const names = (profile.full_name || "User Name").split(" ");
        const first = names[0] || "User";
        const last = names.slice(1).join(" ") || "User";
        const ccCont = await currencycloudService.createContact(ccAccId!, first, last, profile.email || `${userId}@globalpay.com`);
        ccContId = ccCont.id;

        await supabaseAdmin
          .from("profiles")
          .update({
            currencycloud_account_id: ccAccId,
            currencycloud_contact_id: ccContId,
          })
          .eq("id", userId);
      }

      const bankDetails = await currencycloudService.createVirtualAccount(ccAccId!, currency);

      const { error } = await supabaseAdmin.from("virtual_accounts").insert({
        user_id: userId,
        currency: currency.toUpperCase(),
        account_name: "Nexus Pay Multi-currency Account",
        account_number: bankDetails.accountNumber,
        routing_number: bankDetails.routingNumber || null,
        iban: bankDetails.iban || null,
        swift_bic: bankDetails.swift_bic || null,
        bank_name: bankDetails.bankName || "Currencycloud Bank",
        bank_address: bankDetails.bankAddress || "London, GB",
        status: "active",
      });
      if (error) throw error;
    }

    return { ok: true };
  });

export const serverExchange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { from: string; to: string; amount: number }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Execute FX Conversion on Currencycloud
    const fx = await currencycloudService.createExchange(data.from, data.to, data.amount);

    // Record transaction
    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "exchange",
      amount: data.amount,
      currency: data.from,
      to_amount: fx.converted,
      to_currency: data.to,
      rate: fx.rate,
      status: "completed",
      description: `${data.from} → ${data.to}`,
    });
    if (txErr) throw txErr;

    // Apply wallet adjustments
    // Deduct From
    if (["USD", "EUR", "GBP"].includes(data.from.toUpperCase())) {
      const { data: w } = await supabaseAdmin.from("fiat_wallets").select("id, balance").eq("user_id", userId).eq("currency", data.from).maybeSingle();
      if (w) {
        const next = Math.max(0, Number(w.balance) - data.amount);
        await supabaseAdmin.from("fiat_wallets").update({ balance: next, available_balance: next }).eq("id", w.id);
      }
    } else {
      const { data: w } = await supabaseAdmin.from("crypto_wallets").select("id, balance").eq("user_id", userId).eq("asset", data.from).maybeSingle();
      if (w) {
        const next = Math.max(0, Number(w.balance) - data.amount);
        await supabaseAdmin.from("crypto_wallets").update({ balance: next }).eq("id", w.id);
      }
    }

    // Add To
    if (["USD", "EUR", "GBP"].includes(data.to.toUpperCase())) {
      const { data: w } = await supabaseAdmin.from("fiat_wallets").select("id, balance").eq("user_id", userId).eq("currency", data.to).maybeSingle();
      if (w) {
        const next = Math.max(0, Number(w.balance) + fx.converted);
        await supabaseAdmin.from("fiat_wallets").update({ balance: next, available_balance: next }).eq("id", w.id);
      }
    } else {
      const { data: w } = await supabaseAdmin.from("crypto_wallets").select("id, balance").eq("user_id", userId).eq("asset", data.to).maybeSingle();
      if (w) {
        const next = Math.max(0, Number(w.balance) + fx.converted);
        await supabaseAdmin.from("crypto_wallets").update({ balance: next }).eq("id", w.id);
      }
    }

    return { rate: fx.rate, converted: fx.converted };
  });

export const serverRecordMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { type: "deposit" | "withdrawal" | "send" | "receive"; amount: number; currency: string; counterparty?: string }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let payoutStatus = "completed";

    // Handle withdrawal payout mapping via Currencycloud
    if (data.type === "withdrawal" || data.type === "send") {
      const payout = await currencycloudService.createPayout({
        beneficiaryId: data.counterparty || "",
        currency: data.currency,
        amount: data.amount,
        reference: `TX-${randomHex(8).toUpperCase()}`,
      });
      payoutStatus = payout.status === "completed" ? "completed" : "pending";
    }

    // Record in local database
    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      status: payoutStatus as any,
      counterparty: data.counterparty || null,
      description: `${data.type.toUpperCase()} - ${data.currency}`,
      reference: `TX-${randomHex(8).toUpperCase()}`,
    });
    if (txErr) throw txErr;

    // Apply adjustments
    const delta = (data.type === "deposit" || data.type === "receive") ? data.amount : -data.amount;
    
    if (["USD", "EUR", "GBP"].includes(data.currency.toUpperCase())) {
      const { data: w } = await supabaseAdmin.from("fiat_wallets").select("id, balance").eq("user_id", userId).eq("currency", data.currency).maybeSingle();
      if (w) {
        const next = Math.max(0, Number(w.balance) + delta);
        await supabaseAdmin.from("fiat_wallets").update({ balance: next, available_balance: next }).eq("id", w.id);
      }
    } else {
      const { data: w } = await supabaseAdmin.from("crypto_wallets").select("id, balance").eq("user_id", userId).eq("asset", data.currency).maybeSingle();
      if (w) {
        const next = Math.max(0, Number(w.balance) + delta);
        await supabaseAdmin.from("crypto_wallets").update({ balance: next }).eq("id", w.id);
      }
    }

    return { ok: true };
  });

export const serverSaveBeneficiary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((values: Record<string, unknown>) => values)
  .handler(async ({ data: values, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Register with Currencycloud
    let ccBenId = "";
    const beneficiaryData: {
      name: string;
      currency: string;
      country: string;
      iban?: string;
      account_number?: string;
      routing_number?: string;
      swift_bic?: string;
    } = {
      name: String(values['name'] || ""),
      currency: String(values['currency'] || "USD"),
      country: String(values['country'] || "US"),
    };

    if (values['iban']) beneficiaryData.iban = String(values['iban']);
    if (values['account_number']) beneficiaryData.account_number = String(values['account_number']);
    if (values['routing_number']) beneficiaryData.routing_number = String(values['routing_number']);
    if (values['swift_bic']) beneficiaryData.swift_bic = String(values['swift_bic']);

    const ben = await currencycloudService.createBeneficiary(beneficiaryData);
    ccBenId = ben.id;

    // Insert locally
    const { error } = await supabaseAdmin.from("beneficiaries").insert({
      user_id: userId,
      name: String(values['name'] || ""),
      currency: String(values['currency'] || "USD"),
      country: String(values['country'] || "US"),
      iban: values['iban'] ? String(values['iban']) : null,
      account_number: values['account_number'] ? String(values['account_number']) : null,
      routing_number: values['routing_number'] ? String(values['routing_number']) : null,
      bank_name: values['bank_name'] ? String(values['bank_name']) : null,
      swift_bic: ccBenId,
    });
    if (error) throw error;

    return { ok: true };
  });

export const serverTriggerWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { accountNumber: string; amount: number }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await (supabaseAdmin as any).from("webhook_events").insert({
      merchant_id: userId,
      event_type: "payment.received",
      payload: {
        accountNumber: data.accountNumber,
        amount: data.amount,
        currency: "USD",
        reference: `SIM-${Date.now()}`,
        debtorName: "Mock Sender Corp",
      },
      endpoint_url: "/api/webhooks/banking-circle",
      status: "pending",
      attempts: 0,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const serverCreateSandboxApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((name: string) => name)
  .handler(async ({ data: name, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const crypto = await import("crypto");

    const prefix = "gph_test_";
    const secret = crypto.randomBytes(24).toString("hex");
    const plainTextKey = `${prefix}${secret}`;
    const hash = crypto.createHash("sha256").update(plainTextKey).digest("hex");

    const { data, error } = await (supabaseAdmin as any).from("merchant_api_keys").insert({
      merchant_id: userId,
      name,
      api_key_prefix: prefix,
      api_key_hash: hash,
      is_live: false,
      is_active: true,
    }).select().single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      apiKey: plainTextKey,
      is_live: data.is_live,
      is_active: data.is_active,
      created_at: data.created_at,
    };
  });

export const serverListSandboxApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await (supabaseAdmin as any)
      .from("merchant_api_keys")
      .select("id, name, api_key_prefix, is_live, is_active, created_at")
      .eq("merchant_id", userId)
      .eq("is_live", false);

    if (error) throw new Error(error.message);
    return data;
  });

export const serverRevokeSandboxApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await (supabaseAdmin as any)
      .from("merchant_api_keys")
      .update({ is_active: false })
      .eq("id", id)
      .eq("merchant_id", userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const serverGetSandboxLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await (supabaseAdmin as any)
      .from("webhook_events")
      .select("id, event_type, payload, endpoint_url, status, attempts, created_at")
      .eq("merchant_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });

export const serverExecuteSandboxApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { method: string; endpoint: string; body: any }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { method, endpoint, body } = data;

    let responsePayload: any = {};
    const randomId = () => Math.random().toString(36).substring(2, 15);

    try {
      if (endpoint === "/v1/customers") {
        const first_name = body.name ? body.name.split(" ")[0] : "Test";
        const last_name = body.name ? body.name.split(" ").slice(1).join(" ") || "Client" : "Customer";
        const mappedData = {
          first_name,
          last_name,
          email: body.email || "test@example.com",
          address_line1: body.address?.street || "123 Main St",
          city: body.address?.city || "New York",
          state: body.address?.state || "NY",
          postal_code: body.address?.postal_code || "10001",
          country: body.address?.country || "US",
        };

        const provider = process.env['BANKING_PROVIDER'] || "currencycloud";
        let res: { id: string; status: string };

        // Strip company signifiers CurrencyCloud rejects
        const sanitizeName = (n: string) =>
          n.replace(/\b(ltd|limited|llc|inc|corp|corporation|co\.|company|corporates?|group|holdings?|plc|gmbh|bv|sa|sas|srl)\b\.?/gi, "").replace(/\s{2,}/g, " ").trim() || n;

        if (provider === "unit") {
          res = await unitService.createApplication(userId, {
            ...mappedData,
            date_of_birth: "1990-01-01",
            nationality: "US",
            phone: "5550000000",
            id_document_type: "Passport",
            id_document_number: "000000000",
          }).then(r => ({ id: r.id, status: r.status }));
        } else {
          const ccAcc = await currencycloudService.createSubAccount(userId, sanitizeName(body.name || "Test Client"));
          res = { id: ccAcc.id, status: "active" };
        }

        responsePayload = {
          id: res.id,
          name: body.name || "Test Client Corp",
          email: body.email || "client@example.com",
          status: res.status,
          provider,
          created_at: new Date().toISOString(),
        };

      } else if (endpoint === "/v1/virtual-accounts") {
        if (!body.customer_id) throw new Error("Missing required field: customer_id");

        const provider = process.env['BANKING_PROVIDER'] || "currencycloud";
        let res: any;

        if (provider === "unit") {
          res = await unitService.createAccount(body.customer_id, body.currency || "USD");
        } else {
          res = await currencycloudService.createVirtualAccount(body.customer_id, body.currency || "USD");
        }

        responsePayload = {
          id: `va_test_${randomId()}`,
          customer_id: body.customer_id,
          currency: body.currency || "USD",
          account_name: body.account_name || "Collections Account",
          account_number: res.accountNumber || res.iban || "N/A",
          routing_number: res.routingNumber || res.swift_bic || "N/A",
          bank_name: res.bankName || "Partner Bank",
          bank_address: res.bankAddress || "London, UK",
          status: "active",
          provider,
        };

        await (supabaseAdmin as any).from("virtual_accounts").insert({
          user_id: userId,
          account_number: res.accountNumber || res.iban || "N/A",
          routing_number: res.routingNumber || res.swift_bic || "N/A",
          bank_name: res.bankName || "Partner Bank",
          currency: body.currency || "USD",
          account_name: body.account_name || "Collections Account",
          status: "active",
        });

      } else if (endpoint === "/v1/wallets") {
        const currency = (body.currency || "USD").toUpperCase();
        const type = body.type || "fiat";

        if (type === "crypto") {
          if (!process.env['TATUM_API_KEY']) {
            responsePayload = {
              error: "CREDENTIAL_REQUIRED",
              message: "Tatum API key is missing. Configure TATUM_API_KEY in your env file.",
              status: "failed",
            };
          } else {
            const address = await tatumGenerateAddress(currency);
            responsePayload = {
              id: address,
              currency,
              type,
              balance: 0.00,
              available_balance: 0.00,
              deposit_address: address,
              status: "active",
              provider: "tatum",
            };
            await (supabaseAdmin as any).from("crypto_wallets").insert({
              user_id: userId,
              asset: currency,
              network: currency === "USDT" ? "TRON" : currency === "ETH" ? "ETH" : "BTC",
              deposit_address: address,
              balance: 0,
              is_active: true,
            });
          }
        } else {
          responsePayload = {
            id: `wal_fiat_${randomId()}`,
            currency,
            type,
            balance: 0.00,
            available_balance: 0.00,
            status: "active",
            provider: "database",
          };
          await (supabaseAdmin as any).from("fiat_wallets").insert({
            user_id: userId,
            currency,
            balance: 0,
            is_active: true,
            label: "Sandbox Wallet",
          });
        }

      } else if (endpoint === "/v1/payments" || endpoint === "/v1/payouts") {
        const amount = Number(body.amount) || 100.0;
        const currency = (body.currency || "USD").toUpperCase();
        const reference = body.reference || `REF-${Date.now()}`;
        const provider = process.env['BANKING_PROVIDER'] || "currencycloud";

        // Only call real payout if a valid beneficiary destination is provided
        let paymentId = `pay_test_${randomId()}`;
        let paymentStatus = "completed";

        if (body.destination) {
          const payout = await currencycloudService.createPayout({
            beneficiaryId: body.destination,
            currency,
            amount,
            reference,
          });
          paymentId = payout.id;
          paymentStatus = payout.status;
        }

        responsePayload = {
          id: paymentId,
          amount,
          currency,
          destination: body.destination || "sandbox_internal",
          reference,
          status: paymentStatus,
          provider,
          created_at: new Date().toISOString(),
        };

        await (supabaseAdmin as any).from("transactions").insert({
          user_id: userId,
          type: "withdrawal",
          amount,
          currency,
          status: "completed",
          reference,
          provider_tx_id: paymentId,
        });

      } else if (endpoint === "/v1/conversions" || endpoint === "/v1/exchange") {
        const from = (body.from || "USD").toUpperCase();
        const to = (body.to || "EUR").toUpperCase();
        const amount = Number(body.amount) || 100.0;

        // Use real Currencycloud FX rate
        let rate = from === "USD" ? 0.92 : 1.09;
        let convertedAmount = amount * rate;

        try {
          const fx = await currencycloudService.createExchange(from, to, amount);
          rate = fx.rate;
          convertedAmount = fx.converted;
        } catch {
          // Fall back to simulated rate if CC call fails
        }

        responsePayload = {
          id: `conv_${randomId()}`,
          from,
          to,
          amount,
          converted_amount: convertedAmount,
          rate,
          status: "completed",
          provider: "currencycloud",
          created_at: new Date().toISOString(),
        };

      } else {
        responsePayload = {
          message: "Endpoint processed successfully in Sandbox",
          ok: true,
          input: body,
        };
      }
    } catch (err: any) {
      console.error("[SandboxExecutionError]", err);
      responsePayload = {
        error: "PROVIDER_ERROR",
        message: err.message || "Failed to process sandbox query via provider API.",
        status: "failed",
      };
    }

    // Log the API call inside webhook_events table
    const { error: logErr } = await (supabaseAdmin as any).from("webhook_events").insert({
      merchant_id: userId,
      event_type: `api.log:${method} ${endpoint}`,
      payload: {
        request: body,
        response: responsePayload,
      },
      endpoint_url: "https://api.sandbox.globalpay.io",
      status: responsePayload.error ? "400" : "200",
      attempts: Math.floor(40 + Math.random() * 80),
    });

    if (logErr) throw new Error(logErr.message);

    return responsePayload;
  });
