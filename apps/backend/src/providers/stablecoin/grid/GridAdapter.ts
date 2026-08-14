import { IStablecoinProvider } from "../IStablecoinProvider";
import axios, { AxiosInstance } from "axios";
import { logger } from "../../../utils/logger";

export class GridAdapter implements IStablecoinProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.GRID_API_KEY || "";
    const environment = process.env.GRID_ENVIRONMENT || "sandbox";
    // Base URL is typically https://grid.squads.xyz/api
    const baseUrl = environment === "production"
      ? "https://grid.squads.xyz/api"
      : "https://grid.squads.xyz/api"; // Same for sandbox, but we can customize or append environment details if needed.

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
  }

  private checkApiKey() {
    if (!process.env.GRID_API_KEY) {
      throw new Error("Grid API Key not configured.");
    }
  }

  async testConnection(): Promise<boolean> {
    this.checkApiKey();
    try {
      // Basic call to get balances or verify API keys
      const response = await this.client.get("/grid/v1/accounts/balances");
      return response.status === 200;
    } catch (err: any) {
      logger.error(`Grid testConnection failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async createCustomer(data: any): Promise<{ id: string; status: string; raw: any }> {
    this.checkApiKey();
    try {
      const payload = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        address: data.address ? {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          postal_code: data.address.postal_code,
          country: data.address.country,
        } : undefined,
      };

      const response = await this.client.post("/grid/v1/accounts", payload);
      return {
        id: response.data.id || response.data.address || "",
        status: response.data.status || "created",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Grid createCustomer failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async getCustomer(customerId: string): Promise<{ id: string; status: string; raw: any }> {
    this.checkApiKey();
    try {
      const response = await this.client.get(`/grid/v1/accounts/${customerId}`);
      return {
        id: response.data.id || response.data.address || customerId,
        status: response.data.status || "active",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Grid getCustomer failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async simulateKYCApproval(customerId: string): Promise<{ status: string; raw: any }> {
    this.checkApiKey();
    try {
      const response = await this.client.post(`/grid/v1/kyc/${customerId}/simulate-approval`, {});
      return {
        status: response.data.status || "approved",
        raw: response.data,
      };
    } catch (err: any) {
      logger.warn(`Grid simulateKYCApproval endpoint failed: ${err.message}. Simulating local approval fallback.`);
      return {
        status: "approved",
        raw: { simulated: true, status: "approved" },
      };
    }
  }

  async createVirtualAccount(customerId: string, currency: string, options?: any): Promise<{
    id: string;
    accountNumber: string;
    routingNumber?: string;
    bankName?: string;
    bankAddress?: string;
    raw: any;
  }> {
    this.checkApiKey();
    try {
      const payload = {
        accountId: customerId,
        currency: currency.toUpperCase(),
        rail: options?.rail || "ACH",
      };

      const response = await this.client.post("/grid/v1/virtual-accounts", payload);
      return {
        id: response.data.id || "",
        accountNumber: response.data.accountNumber || "",
        routingNumber: response.data.routingNumber || "",
        bankName: response.data.bankName || "Grid Partner Bank",
        bankAddress: response.data.bankAddress || "Grid Partner Address",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Grid createVirtualAccount failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async getVirtualAccounts(customerId: string): Promise<Array<{
    id: string;
    accountNumber: string;
    routingNumber?: string;
    status: string;
  }>> {
    this.checkApiKey();
    try {
      const response = await this.client.get(`/grid/v1/virtual-accounts`, {
        params: { accountId: customerId }
      });
      const accounts = Array.isArray(response.data) ? response.data : (response.data.data || []);
      return accounts.map((acc: any) => ({
        id: acc.id || "",
        accountNumber: acc.accountNumber || "",
        routingNumber: acc.routingNumber || "",
        status: acc.status || "active",
      }));
    } catch (err: any) {
      logger.error(`Grid getVirtualAccounts failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async createTransferOrPaymentIntent(data: any): Promise<{ id: string; status: string; raw: any }> {
    this.checkApiKey();
    try {
      const payload = {
        accountId: data.customerId,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        destination: data.destination || data.toAddress,
        feeConfiguration: data.feeConfiguration || {},
      };

      const response = await this.client.post("/grid/v1/payment-intents", payload);
      return {
        id: response.data.id || response.data.paymentIntentId || "",
        status: response.data.status || "pending",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Grid createTransferOrPaymentIntent failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async getBalance(accountId: string): Promise<{ balance: number; available: number }> {
    this.checkApiKey();
    try {
      const response = await this.client.get(`/grid/v1/accounts/${accountId}/balances`);
      return {
        balance: response.data.balance || 0,
        available: response.data.available || response.data.balance || 0,
      };
    } catch (err: any) {
      logger.error(`Grid getBalance failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async parseWebhook(headers: any, body: any): Promise<{
    eventId: string;
    eventType: string;
    customerId?: string;
    status?: string;
    raw: any;
  }> {
    // Grid webhook schema: { eventId: "evt_xxx", type: "payment_intent.succeeded", data: { id: "pi_xxx", accountId: "acc_xxx", status: "succeeded" } }
    const eventId = body?.eventId || `grid-evt-${Date.now()}`;
    const eventType = body?.type || body?.eventType || "unknown";
    const customerId = body?.data?.accountId || body?.accountId;
    const status = body?.data?.status || body?.status;

    return {
      eventId,
      eventType,
      customerId,
      status,
      raw: body,
    };
  }
}
