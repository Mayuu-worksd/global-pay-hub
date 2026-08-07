import { ICryptoProvider } from "../../ICryptoProvider";
import axios, { AxiosInstance } from "axios";

// Tatum blockchain network mapping
const NETWORK_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tron", // USDT TRC-20 on Tron
};

export class TatumAdapter implements ICryptoProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.TATUM_API_KEY || "";
    this.client = axios.create({
      baseURL: "https://api.tatum.io/v3",
      headers: { "x-api-key": apiKey },
      timeout: 15000,
    });
  }

  // Generate a real deposit address using Tatum v3 wallet API
  async generateDepositAddress(asset: string): Promise<{ address: string; destinationTag?: string }> {
    const upper = asset.toUpperCase();

    if (upper === "BTC") {
      // Generate BTC wallet + address
      const walletRes = await this.client.get("/bitcoin/wallet");
      const xpub = walletRes.data.xpub;
      const addrRes = await this.client.get(`/bitcoin/address/${xpub}/0`);
      return { address: addrRes.data.address };
    }

    if (upper === "ETH") {
      const walletRes = await this.client.get("/ethereum/wallet");
      const xpub = walletRes.data.xpub;
      const addrRes = await this.client.get(`/ethereum/address/${xpub}/0`);
      return { address: addrRes.data.address };
    }

    if (upper === "USDT") {
      // USDT TRC-20 on Tron
      const walletRes = await this.client.get("/tron/wallet");
      const xpub = walletRes.data.xpub;
      const addrRes = await this.client.get(`/tron/address/${xpub}/0`);
      return { address: addrRes.data.address };
    }

    throw new Error(`Unsupported asset for address generation: ${asset}`);
  }

  // Get on-chain balance for a deposit address
  async getAddressBalance(asset: string, address: string): Promise<number> {
    const upper = asset.toUpperCase();
    try {
      if (upper === "BTC") {
        const res = await this.client.get(`/bitcoin/address/balance/${address}`);
        return parseFloat(res.data.incoming || "0") - parseFloat(res.data.outgoing || "0");
      }
      if (upper === "ETH") {
        const res = await this.client.get(`/ethereum/account/balance/${address}`);
        return parseFloat(res.data.balance || "0") / 1e18;
      }
      if (upper === "USDT") {
        const res = await this.client.get(`/tron/account/${address}`);
        const trc20 = res.data.trc20 || [];
        const usdt = trc20.find((t: any) => t["TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"]);
        return usdt ? parseFloat(Object.values(usdt)[0] as string) / 1e6 : 0;
      }
    } catch {
      return 0;
    }
    return 0;
  }

  // ICryptoProvider interface methods
  async createWallet(asset: string, name: string): Promise<{ id: string; status: string }> {
    const { address } = await this.generateDepositAddress(asset);
    return { id: address, status: "active" };
  }

  async generateAddress(walletId: string, asset: string): Promise<{ address: string; destinationTag?: string }> {
    return this.generateDepositAddress(asset);
  }

  async getBalance(walletId: string, asset: string): Promise<{ balance: number; available: number }> {
    const balance = await this.getAddressBalance(asset, walletId);
    return { balance, available: balance };
  }

  async sendTransaction(data: { walletId: string; asset: string; toAddress: string; amount: number }): Promise<{ txHash: string; status: "pending" | "completed" | "failed" }> {
    // Sending requires private keys — not handled server-side for security
    throw new Error("Outbound crypto transactions require custody key management.");
  }

  async getTransactions(walletId: string, asset: string): Promise<any[]> {
    const upper = asset.toUpperCase();
    try {
      if (upper === "BTC") {
        const res = await this.client.get(`/bitcoin/transaction/address/${walletId}?pageSize=50`);
        return (res.data || []).map((t: any) => ({
          txHash: t.hash,
          amount: Math.abs(t.outputs?.reduce((s: number, o: any) => s + (o.value || 0), 0) / 1e8 || 0),
          type: "receive",
          status: t.confirmations > 0 ? "completed" : "pending",
          created_at: new Date(t.time * 1000).toISOString(),
        }));
      }
      if (upper === "ETH") {
        const res = await this.client.get(`/ethereum/account/transaction/${walletId}?pageSize=50`);
        return (res.data || []).map((t: any) => ({
          txHash: t.hash,
          amount: parseFloat(t.value || "0") / 1e18,
          type: t.to?.toLowerCase() === walletId.toLowerCase() ? "receive" : "send",
          status: t.status === "0x1" ? "completed" : "pending",
          created_at: new Date(parseInt(t.timestamp, 16) * 1000).toISOString(),
        }));
      }
    } catch {
      return [];
    }
    return [];
  }
}
