import { ICryptoProvider } from "../../ICryptoProvider";
import axios, { AxiosInstance } from "axios";

export class FireblocksAdapter implements ICryptoProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.FIREBLOCKS_API_KEY || "";
    // Note: In real life, Fireblocks SDK or requests require JWT signing using a private key.
    // For this generic adapter we scaffold the client targeting Fireblocks API.
    const baseUrl = process.env.FIREBLOCKS_API_BASE_URL || "https://api.fireblocks.io/v1";
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "X-API-Key": apiKey,
      },
    });
  }

  async createWallet(asset: string, name: string): Promise<{ id: string; status: string }> {
    if (!process.env.FIREBLOCKS_API_KEY) {
      throw new Error("Fireblocks API Key not configured.");
    }
    const response = await this.client.post("/vault/accounts", {
      name,
    });
    return {
      id: response.data.id,
      status: "active",
    };
  }

  async generateAddress(walletId: string, asset: string): Promise<{ address: string; destinationTag?: string }> {
    if (!process.env.FIREBLOCKS_API_KEY) {
      throw new Error("Fireblocks API Key not configured.");
    }
    const response = await this.client.post(`/vault/accounts/${walletId}/${asset.toUpperCase()}/addresses`);
    return {
      address: response.data.address,
      destinationTag: response.data.tag || undefined,
    };
  }

  async getBalance(walletId: string, asset: string): Promise<{ balance: number; available: number }> {
    if (!process.env.FIREBLOCKS_API_KEY) {
      throw new Error("Fireblocks API Key not configured.");
    }
    const response = await this.client.get(`/vault/accounts/${walletId}/${asset.toUpperCase()}`);
    return {
      balance: parseFloat(response.data.balance || "0"),
      available: parseFloat(response.data.available || "0"),
    };
  }

  async sendTransaction(data: { walletId: string; asset: string; toAddress: string; amount: number; destinationTag?: string }): Promise<{ txHash: string; status: "pending" | "completed" | "failed" }> {
    if (!process.env.FIREBLOCKS_API_KEY) {
      throw new Error("Fireblocks API Key not configured.");
    }
    const response = await this.client.post("/transactions", {
      source: {
        type: "VAULT_ACCOUNT",
        id: data.walletId,
      },
      destination: {
        type: "ONE_TIME_ADDRESS",
        oneTimeAddress: {
          address: data.toAddress,
          tag: data.destinationTag,
        },
      },
      assetId: data.asset.toUpperCase(),
      amount: String(data.amount),
    });
    return {
      txHash: response.data.id,
      status: "pending",
    };
  }

  async getTransactions(walletId: string, asset: string): Promise<any[]> {
    if (!process.env.FIREBLOCKS_API_KEY) {
      throw new Error("Fireblocks API Key not configured.");
    }
    const response = await this.client.get(`/transactions?vaultAccountId=${walletId}&assetId=${asset.toUpperCase()}`);
    return (response.data || []).map((t: any) => ({
      id: t.id,
      txHash: t.txHash || t.id,
      amount: parseFloat(t.amount),
      fee: parseFloat(t.networkFee || "0"),
      type: t.source.id === walletId ? "send" : "receive",
      status: t.status === "COMPLETED" ? "completed" : t.status === "FAILED" ? "failed" : "pending",
      created_at: new Date(t.createdAt).toISOString(),
    }));
  }
}
