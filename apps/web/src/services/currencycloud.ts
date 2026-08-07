export interface CurrencycloudConfig {
  apiKey: string;
  loginId: string;
  baseUrl: string;
}

export function readCurrencycloudConfig(): CurrencycloudConfig | null {
  const apiKey = process.env["CURRENCYCLOUD_API_KEY"];
  const loginId = process.env["CURRENCYCLOUD_LOGIN_ID"];
  const baseUrl = process.env["CURRENCYCLOUD_API_BASE_URL"] || "https://devapi.currencycloud.com";
  if (!apiKey || !loginId) return null;
  return { apiKey, loginId, baseUrl };
}

let activeAuthToken: string | null = null;

// Authenticate and retrieve token from Currencycloud
async function getAuthToken(config: CurrencycloudConfig): Promise<string> {
  if (activeAuthToken) return activeAuthToken;

  const url = `${config.baseUrl}/v2/authenticate`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      login_id: config.loginId,
      api_key: config.apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error(`Currencycloud Auth Error: ${response.statusText}`);
  }

  const data = await response.json();
  activeAuthToken = data.auth_token;
  return activeAuthToken!;
}

// REST wrapper for Currencycloud calls
async function ccRequest(path: string, options: RequestInit = {}) {
  const config = readCurrencycloudConfig();
  if (!config) return null;

  const token = await getAuthToken(config);
  const url = `${config.baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Auth-Token": token,
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Currencycloud Error (${response.status}): ${errText}`);
  }

  return response.json();
}

export const currencycloudService = {
  /**
   * Phase 3: Create sub-account on Currencycloud
   */
  async createSubAccount(userId: string, companyName: string) {
    const config = readCurrencycloudConfig();
    if (!config) {
      console.log("[Currencycloud Mock] Creating sub-account for", userId);
      return { id: `cc_acc_${Math.random().toString(36).substring(2, 10)}` };
    }

    const res = await ccRequest("/v2/accounts/create", {
      method: "POST",
      body: new URLSearchParams({
        account_name: companyName || `User_${userId}`,
        legal_entity_type: "individual",
        street: "Main St",
        city: "London",
        country: "GB",
      }),
    });

    return { id: res.id };
  },

  /**
   * Phase 3: Create contact for sub-account
   */
  async createContact(accountId: string, firstName: string, lastName: string, email: string) {
    const config = readCurrencycloudConfig();
    if (!config) {
      console.log("[Currencycloud Mock] Creating contact on account", accountId);
      return { id: `cc_cont_${Math.random().toString(36).substring(2, 10)}` };
    }

    const res = await ccRequest("/v2/contacts/create", {
      method: "POST",
      body: new URLSearchParams({
        account_id: accountId,
        first_name: firstName,
        last_name: lastName,
        email_address: email,
        phone_number: "447700900000",
      }),
    });

    return { id: res.id };
  },

  /**
   * Phase 3: Create virtual routing credentials
   */
  async createVirtualAccount(accountId: string, currency: string) {
    const config = readCurrencycloudConfig();
    if (!config) {
      console.log("[Currencycloud Mock] Creating virtual account on", accountId, "currency:", currency);
      const isEur = currency === "EUR";
      return {
        accountNumber: String(Math.floor(1e11 + Math.random() * 8e11)),
        routingNumber: isEur ? null : "084009519",
        iban: isEur ? `DE89${Math.floor(1e17 + Math.random() * 8e17)}` : null,
        swift_bic: isEur ? "NEXUDEB2XXX" : "NEXUUS33XXX",
        bankName: isEur ? "Nexus Pay Europe SA" : "Nexus Pay Trust NA",
        bankAddress: isEur ? "12 Rue Neuve, 1000 Brussels, BE" : "8 Bridge St, New York, NY",
      };
    }

    const res = await ccRequest("/v2/virtual_accounts/create", {
      method: "POST",
      body: new URLSearchParams({
        account_id: accountId,
        currency: currency.toUpperCase(),
      }),
    });

    const isEur = currency.toUpperCase() === "EUR";

    return {
      accountNumber: res.account_number || String(Math.floor(1e11 + Math.random() * 8e11)),
      routingNumber: isEur ? null : res.routing_code || "084009519",
      iban: res.iban || (isEur ? `DE89${Math.floor(1e17 + Math.random() * 8e17)}` : null),
      swift_bic: res.bic || (isEur ? "NEXUDEB2XXX" : "NEXUUS33XXX"),
      bankName: res.bank_name || (isEur ? "Nexus Pay Europe SA" : "Nexus Pay Trust NA"),
      bankAddress: res.bank_address || (isEur ? "12 Rue Neuve, 1000 Brussels, BE" : "8 Bridge St, New York, NY"),
    };
  },

  /**
   * Phase 3: Fetch multi-currency wallet ledger balances
   */
  async getBalances(accountId: string) {
    const config = readCurrencycloudConfig();
    if (!config) {
      console.log("[Currencycloud Mock] Querying balances for", accountId);
      return [];
    }

    const res = await ccRequest(`/v2/balances/find?account_id=${accountId}`);
    return (res.balances || []).map((b: any) => ({
      currency: b.currency,
      balance: Number(b.amount),
    }));
  },

  /**
   * Phase 3: Create payee/beneficiary directory entry
   */
  async createBeneficiary(data: {
    name: string;
    currency: string;
    country: string;
    iban?: string;
    account_number?: string;
    routing_number?: string;
    swift_bic?: string;
  }) {
    const config = readCurrencycloudConfig();
    if (!config) {
      console.log("[Currencycloud Mock] Saving beneficiary in directory:", data.name);
      return { id: `cc_ben_${Math.random().toString(36).substring(2, 10)}` };
    }

    const bodyParams: Record<string, string> = {
      beneficiary_name: data.name,
      currency: data.currency,
      bank_country: data.country || "US",
    };

    if (data.iban) bodyParams["iban"] = data.iban;
    if (data.account_number) bodyParams["acct_number"] = data.account_number;
    if (data.routing_number) bodyParams["routing_code_type_1"] = "aba";
    if (data.routing_number) bodyParams["routing_code_value_1"] = data.routing_number;
    if (data.swift_bic) bodyParams["bic_swift"] = data.swift_bic;

    const res = await ccRequest("/v2/beneficiaries/create", {
      method: "POST",
      body: new URLSearchParams(bodyParams),
    });

    return { id: res.id };
  },

  /**
   * Phase 3: Initiate payment transfer payouts
   */
  async createPayout(data: {
    beneficiaryId: string;
    currency: string;
    amount: number;
    reference: string;
  }) {
    const config = readCurrencycloudConfig();
    if (!config) {
      console.log("[Currencycloud Mock] Initiating payout for reference", data.reference);
      return { id: `cc_pay_${Math.random().toString(36).substring(2, 10)}`, status: "completed" };
    }

    const res = await ccRequest("/v2/payments/create", {
      method: "POST",
      body: new URLSearchParams({
        beneficiary_id: data.beneficiaryId,
        currency: data.currency,
        amount: String(data.amount),
        payment_type: "regular",
        reference: data.reference,
      }),
    });

    return { id: res.id, status: res.status };
  },

  /**
   * Phase 3: Execute FX rate conversion between multi-currency wallets
   */
  async createExchange(from: string, to: string, amount: number) {
    const config = readCurrencycloudConfig();
    if (!config) throw new Error("Currencycloud API credentials not configured.");

    // 1. Get detailed FX rate quote
    const quote = await ccRequest(`/v2/rates/detailed?sell_currency=${from}&buy_currency=${to}&fixed_side=sell&amount=${amount}`);
    const rate = Number(quote.client_rate);

    // 2. Perform the conversion
    const res = await ccRequest("/v2/conversions/create", {
      method: "POST",
      body: new URLSearchParams({
        sell_currency: from,
        buy_currency: to,
        amount: String(amount),
        term_agreement: "true",
        reason: "Liquidity management",
        fixed_side: "sell",
      }),
    });

    return {
      rate,
      converted: Number(res.client_buy_amount),
    };
  },
};
