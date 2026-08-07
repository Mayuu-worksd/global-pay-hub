import { ICryptoProvider } from "../../ICryptoProvider";
import axios, { AxiosInstance } from "axios";

export class TronGridAdapter implements ICryptoProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.TRONGRID_API_KEY || "";
    const baseUrl = process.env.TRONGRID_API_BASE_URL || "https://api.trongrid.io";
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "TRON-PRO-API-KEY": apiKey,
      },
    });
  }

  async createWallet(asset: string, name: string): Promise<{ id: string; status: string }> {
    return {
      id: `tron_${Math.random().toString(36).substring(2, 10)}`,
      status: "active",
    };
  }

  async generateAddress(walletId: string, asset: string): Promise<{ address: string; destinationTag?: string }> {
    // Generate a dummy Tron address standard starting with T
    return {
      address: `T${Array.from({ length: 33 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    };
  }

  async getBalance(walletId: string, asset: string): Promise<{ balance: number; available: number }> {
    if (!process.env.TRONGRID_API_KEY) {
      throw new Error("Trongrid API Key not configured.");
    }
    // Return dummy balance check
    return { balance: 0, available: 0 };
  }

  async sendTransaction(data: { walletId: string; asset: string; toAddress: string; amount: number; destinationTag?: string }): Promise<{ txHash: string; status: "pending" | "completed" | "failed" }> {
    if (!process.env.TRONGRID_API_KEY) {
      throw new Error("Trongrid API Key not configured.");
    }
    return {
      txHash: `tx_${Math.random().toString(36).substring(2, 15)}`,
      status: "pending",
    };
  }

  async getTransactions(walletId: string, asset: string): Promise<any[]> {
    return [];
  }
}
