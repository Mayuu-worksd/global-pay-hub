import { IStablecoinProvider } from "../IStablecoinProvider";
import axios, { AxiosInstance } from "axios";
import { logger } from "../../../utils/logger";

export class BridgeAdapter implements IStablecoinProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.BRIDGE_API_KEY || "";
    const environment = process.env.BRIDGE_ENVIRONMENT || "sandbox";
    const baseUrl = environment === "production" 
      ? "https://api.bridge.xyz" 
      : "https://api.sandbox.bridge.xyz";

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
  }

  private checkApiKey() {
    if (!process.env.BRIDGE_API_KEY) {
      throw new Error("Bridge API Key not configured.");
    }
  }

  async testConnection(): Promise<boolean> {
    this.checkApiKey();
    try {
      const response = await this.client.get("/v0/customers", {
        params: { limit: 1 }
      });
      return response.status === 200;
    } catch (err: any) {
      logger.error(`Bridge testConnection failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async createCustomer(data: any): Promise<{ id: string; status: string; raw: any }> {
    this.checkApiKey();
    try {
      const idempotencyKey = data.idempotency_key || `bridge-cust-${Date.now()}`;
      
      const payload: any = {
        type: data.type || "individual",
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
      };

      if (data.phone) {
        payload.phone = data.phone;
      }
      if (data.date_of_birth) {
        payload.date_of_birth = data.date_of_birth;
      }
      if (data.address) {
        payload.address = {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          postal_code: data.address.postal_code,
          country: data.address.country,
        };
      }

      const response = await this.client.post("/v0/customers", payload, {
        headers: {
          "Idempotency-Key": idempotencyKey,
        }
      });

      return {
        id: response.data.id,
        status: response.data.status || response.data.kyc_status || "created",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Bridge createCustomer failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async getCustomer(customerId: string): Promise<{ id: string; status: string; raw: any }> {
    this.checkApiKey();
    try {
      const response = await this.client.get(`/v0/customers/${customerId}`);
      return {
        id: response.data.id,
        status: response.data.status || response.data.kyc_status || "unknown",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Bridge getCustomer failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async simulateKYCApproval(customerId: string): Promise<{ status: string; raw: any }> {
    this.checkApiKey();
    try {
      const response = await this.client.post(`/v0/customers/${customerId}/simulate_kyc_approval`);
      return {
        status: response.data.kyc_status || "approved",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Bridge simulateKYCApproval failed: ${err.response?.data?.message || err.message}`);
      throw err;
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
      const idempotencyKey = options?.idempotency_key || `bridge-va-${Date.now()}`;
      const payload = {
        currency: currency.toLowerCase(),
        payment_rail: options?.payment_rail || (currency.toLowerCase() === "eur" ? "sepa" : "ach"),
      };

      const response = await this.client.post(`/v0/customers/${customerId}/virtual_accounts`, payload, {
        headers: {
          "Idempotency-Key": idempotencyKey,
        }
      });

      return {
        id: response.data.id,
        accountNumber: response.data.bank_routing_details?.account_number || response.data.account_number || "",
        routingNumber: response.data.bank_routing_details?.routing_number || response.data.routing_number || "",
        bankName: response.data.bank_routing_details?.bank_name || "Bridge Bank Partner",
        bankAddress: response.data.bank_routing_details?.bank_address || "Bridge Partner Address",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Bridge createVirtualAccount failed: ${err.response?.data?.message || err.message}`);
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
      const response = await this.client.get(`/v0/customers/${customerId}/virtual_accounts`);
      const accounts = Array.isArray(response.data.data) ? response.data.data : [];
      return accounts.map((acc: any) => ({
        id: acc.id,
        accountNumber: acc.bank_routing_details?.account_number || acc.account_number || "",
        routingNumber: acc.bank_routing_details?.routing_number || acc.routing_number || "",
        status: acc.status || "active",
      }));
    } catch (err: any) {
      logger.error(`Bridge getVirtualAccounts failed: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  }

  async createTransferOrPaymentIntent(data: any): Promise<{ id: string; status: string; raw: any }> {
    this.checkApiKey();
    try {
      const idempotencyKey = data.idempotency_key || `bridge-tx-${Date.now()}`;
      
      const payload = {
        on_behalf_of: data.customerId,
        amount: data.amount,
        source: data.source || {
          payment_rail: "ach",
          currency: data.currency.toLowerCase(),
        },
        destination: data.destination || {
          payment_rail: "ethereum",
          currency: "usdc",
          to_address: data.toAddress || "0x0000000000000000000000000000000000000000",
        },
      };

      const response = await this.client.post("/v0/transfers", payload, {
        headers: {
          "Idempotency-Key": idempotencyKey,
        }
      });

      return {
        id: response.data.id,
        status: response.data.status || "pending",
        raw: response.data,
      };
    } catch (err: any) {
      logger.error(`Bridge createTransferOrPaymentIntent failed: ${err.response?.data?.message || err.message}`);
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
    // Bridge webhooks pass event payload inside body.
    // Example: { id: "evt_123", type: "transfer.updated", data: { id: "trsf_123", status: "completed", on_behalf_of: "cust_123" } }
    const eventId = body?.id || `bridge-evt-${Date.now()}`;
    const eventType = body?.type || "unknown";
    const customerId = body?.data?.on_behalf_of || body?.data?.customer_id;
    const status = body?.data?.status;

    return {
      eventId,
      eventType,
      customerId,
      status,
      raw: body,
    };
  }
}
