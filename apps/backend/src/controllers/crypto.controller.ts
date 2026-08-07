import { Response, Request } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { CryptoService } from "../services/CryptoService";
import { createWalletSchema, cryptoSendSchema } from "../validators/schema";
import { supabaseAdmin } from "../config/database";

export async function createCryptoWallet(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const validated = createWalletSchema.parse(req.body);

    const cryptoProvider = CryptoService.getProvider();
    const wallet = await cryptoProvider.createWallet(validated.asset, validated.name);

    // Save in crypto_wallets DB
    const { data: dbWallet, error: dbErr } = await supabaseAdmin.from("crypto_wallets").insert({
      user_id: userId,
      asset: validated.asset.toUpperCase(),
      network: validated.asset.toUpperCase() === "TRX" || validated.asset.toUpperCase() === "USDT" ? "TRON" : validated.asset.toUpperCase() === "BTC" ? "Bitcoin" : "Ethereum",
      label: validated.name,
      balance: 0,
      is_active: true,
    }).select().single();

    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.json({ walletId: wallet.id, databaseId: dbWallet.id, status: wallet.status });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getCryptoBalance(req: Request, res: Response) {
  try {
    const { walletId } = req.params;
    const asset = (req.query.asset as string) || "BTC";

    const cryptoProvider = CryptoService.getProvider();
    const balance = await cryptoProvider.getBalance(walletId, asset);

    return res.json(balance);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function generateDepositAddress(req: Request, res: Response) {
  try {
    const { asset } = req.body;
    if (!asset) return res.status(400).json({ error: "asset is required" });

    const tatum = CryptoService.getProvider() as any;
    const result = await tatum.generateDepositAddress(asset.toUpperCase());

    const networkMap: Record<string, string> = {
      BTC: "Bitcoin",
      ETH: "Ethereum",
      USDT: "TRC-20",
    };

    return res.json({
      address: result.address,
      network: networkMap[asset.toUpperCase()] || asset.toUpperCase(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function generateCryptoAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { walletId, asset } = req.body;
    if (!walletId || !asset) return res.status(400).json({ error: "walletId and asset are required." });

    const cryptoProvider = CryptoService.getProvider();
    const result = await cryptoProvider.generateAddress(walletId, asset);

    // Save to database `wallet_addresses`
    const { data, error: dbErr } = await supabaseAdmin.from("wallet_addresses").insert({
      user_id: userId,
      asset: asset.toUpperCase(),
      address: result.address,
      network: asset.toUpperCase() === "TRX" || asset.toUpperCase() === "USDT" ? "TRON" : asset.toUpperCase() === "BTC" ? "Bitcoin" : "Ethereum",
      destination_tag: result.destinationTag || null,
      is_active: true,
    }).select().single();

    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function sendCrypto(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const validated = cryptoSendSchema.parse(req.body);

    const cryptoProvider = CryptoService.getProvider();
    const tx = await cryptoProvider.sendTransaction({
      walletId: validated.walletId,
      asset: validated.asset,
      toAddress: validated.toAddress,
      amount: validated.amount,
      destinationTag: validated.destinationTag,
    });

    // Save to transactions DB
    const { data, error: dbErr } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "send",
      amount: validated.amount,
      currency: validated.asset.toUpperCase(),
      status: tx.status,
      description: `Crypto Transfer to ${validated.toAddress}`,
      reference: tx.txHash,
    }).select().single();

    if (dbErr) return res.status(500).json({ error: dbErr.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getCryptoTransactions(req: AuthenticatedRequest, res: Response) {
  try {
    const walletId = req.query.walletId as string;
    const asset = (req.query.asset as string) || "BTC";

    if (!walletId) return res.status(400).json({ error: "walletId is required." });

    const cryptoProvider = CryptoService.getProvider();
    const txs = await cryptoProvider.getTransactions(walletId, asset);

    return res.json(txs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
