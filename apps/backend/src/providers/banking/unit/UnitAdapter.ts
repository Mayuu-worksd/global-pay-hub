import { IBankingProvider } from "../../IBankingProvider";
import axios, { AxiosInstance } from "axios";

export class UnitAdapter implements IBankingProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.UNIT_API_KEY || "";
    const baseUrl = process.env.UNIT_API_BASE_URL || "https://api.s.unit.sh";

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/vnd.api+json",
      },
      timeout: 15000,
    });
  }

  async createCustomer(data: any): Promise<{ id: string; status: string }> {
    if (!process.env.UNIT_API_KEY) {
      throw new Error("Unit API Key not configured.");
    }
    const response = await this.client.post("/customers", {
      data: {
        type: "customer",
        attributes: {
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          phone: data.phone,
        },
      },
    });
    return {
      id: response.data.data.id,
      status: response.data.data.attributes.status,
    };
  }

  async createAccount(customerId: string, currency: string): Promise<any> {
    if (!process.env.UNIT_API_KEY) {
      throw new Error("Unit API Key not configured.");
    }
    const response = await this.client.post("/accounts", {
      data: {
        type: "depositAccount",
        attributes: {
          depositProduct: "checking",
          currency: currency.toUpperCase(),
        },
        relationships: {
          customer: {
            data: {
              type: "customer",
              id: customerId,
            },
          },
        },
      },
    });
    return {
      accountNumber: response.data.data.attributes.accountNumber,
      routingNumber: response.data.data.attributes.routingNumber,
      bankName: "Unit Deposit Bank",
      bankAddress: "8 Bridge St, New York, NY",
    };
  }

  async getBalance(accountId: string): Promise<{ balance: number; available: number }> {
    if (!process.env.UNIT_API_KEY) {
      throw new Error("Unit API Key not configured.");
    }
    const response = await this.client.get(`/accounts/${accountId}`);
    const balance = response.data.data.attributes.balance / 100;
    const available = response.data.data.attributes.availableBalance / 100;
    return { balance, available };
  }

  async createBeneficiary(data: any): Promise<{ id: string }> {
    if (!process.env.UNIT_API_KEY) {
      throw new Error("Unit API Key not configured.");
    }
    // Simplification for the demo Unit logic
    const response = await this.client.post("/counterparties", {
      data: {
        type: "counterparty",
        attributes: {
          name: data.name,
          routingNumber: data.routing_number,
          accountNumber: data.account_number,
        },
      },
    });
    return { id: response.data.data.id };
  }

  async sendPayment(data: any): Promise<{ id: string; status: string }> {
    if (!process.env.UNIT_API_KEY) {
      throw new Error("Unit API Key not configured.");
    }
    const response = await this.client.post("/payments", {
      data: {
        type: "achPayment",
        attributes: {
          amount: Math.round(data.amount * 100),
          direction: "Credit",
          description: data.reference,
        },
        relationships: {
          account: {
            data: {
              type: "depositAccount",
              id: data.accountId,
            },
          },
          counterparty: {
            data: {
              type: "counterparty",
              id: data.beneficiaryId,
            },
          },
        },
      },
    });
    return {
      id: response.data.data.id,
      status: response.data.data.attributes.status,
    };
  }

  async getTransactions(accountId: string): Promise<any[]> {
    if (!process.env.UNIT_API_KEY) {
      throw new Error("Unit API Key not configured.");
    }
    const response = await this.client.get(`/transactions?filter[accountId]=${accountId}`);
    return (response.data.data || []).map((t: any) => ({
      id: t.id,
      amount: t.attributes.amount / 100,
      currency: t.attributes.currency,
      type: t.attributes.direction === "Debit" ? "withdrawal" : "deposit",
      description: t.attributes.description,
      status: t.attributes.status === "Pending" ? "pending" : "completed",
      created_at: t.attributes.created,
    }));
  }

  async createVirtualAccount(customerId: string, currency: string): Promise<any> {
    return this.createAccount(customerId, currency);
  }
}
