import { IBankingProvider } from "../../IBankingProvider";
import axios, { AxiosInstance } from "axios";

export class CurrencycloudAdapter implements IBankingProvider {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    const baseUrl = process.env.CURRENCYCLOUD_API_BASE_URL || "https://devapi.currencycloud.com";
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
    });
  }

  private async authenticate() {
    if (this.authToken) return;
    const loginId = process.env.CURRENCYCLOUD_LOGIN_ID;
    const apiKey = process.env.CURRENCYCLOUD_API_KEY;

    if (!loginId || !apiKey) {
      throw new Error("Currencycloud configuration missing.");
    }

    const response = await this.client.post("/v2/authenticate/api", {
      login_id: loginId,
      api_key: apiKey,
    });

    this.authToken = response.data.auth_token;
    this.client.defaults.headers.common["X-Auth-Token"] = this.authToken;
  }

  async createCustomer(data: any): Promise<{ id: string; status: string }> {
    await this.authenticate();
    const countryCode = (data.country && data.country.length === 2) ? data.country.toUpperCase() : "US";
    const response = await this.client.post("/v2/accounts/create", {
      account_name: `${data.first_name} ${data.last_name}`,
      legal_entity_type: "individual",
      your_reference: data.email ? `CUST-${data.email}`.substring(0, 25) : "CUST-NEW",
      city: data.city || "New York",
      country: countryCode,
      street: data.address_line1 || "123 Main St",
      postal_code: data.postal_code || "10001",
      state_or_province: data.state || "NY",
    });
    return {
      id: response.data.id,
      status: response.data.status,
    };
  }

  async createAccount(customerId: string, currency: string): Promise<any> {
    await this.authenticate();
    const response = await this.client.post("/v2/virtual_accounts/create", {
      account_id: customerId,
      currency: currency.toUpperCase(),
    });
    return {
      accountNumber: response.data.account_number,
      routingNumber: response.data.routing_code,
      iban: response.data.iban,
      swift_bic: response.data.bic,
      bankName: "Currencycloud Partner Bank",
      bankAddress: "London, UK",
    };
  }

  async getBalance(accountId: string): Promise<{ balance: number; available: number }> {
    await this.authenticate();
    const response = await this.client.get(`/v2/balances/find?account_id=${accountId}`);
    const firstBalance = response.data.balances[0];
    const balance = firstBalance ? parseFloat(firstBalance.amount) : 0;
    return { balance, available: balance };
  }

  async createBeneficiary(data: any): Promise<{ id: string }> {
    await this.authenticate();
    const response = await this.client.post("/v2/beneficiaries/create", {
      bank_account_holder_name: data.name,
      currency: data.currency,
      destination_country_code: data.country,
      iban: data.iban,
      bic_swift: data.swift_bic,
    });
    return { id: response.data.id };
  }

  async sendPayment(data: any): Promise<{ id: string; status: string }> {
    await this.authenticate();
    const response = await this.client.post("/v2/payments/create", {
      beneficiary_id: data.beneficiaryId,
      amount: data.amount,
      currency: data.currency,
      reference: data.reference,
    });
    return {
      id: response.data.id,
      status: response.data.status,
    };
  }

  async getTransactions(accountId: string): Promise<any[]> {
    await this.authenticate();
    const response = await this.client.get(`/v2/transactions/find?account_id=${accountId}`);
    return (response.data.transactions || []).map((t: any) => ({
      id: t.id,
      amount: parseFloat(t.amount),
      currency: t.currency,
      type: t.action === "credit" ? "deposit" : "withdrawal",
      description: t.related_entity_type,
      status: t.status === "completed" ? "completed" : "pending",
      created_at: t.created_at,
    }));
  }

  async createVirtualAccount(customerId: string, currency: string): Promise<any> {
    return this.createAccount(customerId, currency);
  }
}
