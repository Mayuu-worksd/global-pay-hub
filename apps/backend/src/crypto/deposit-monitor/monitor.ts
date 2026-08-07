import { logger } from "../../utils/logger";
import { supabaseAdmin } from "../../config/database";
import { TatumAdapter } from "../../providers/crypto/tatum/TatumAdapter";

const tatum = new TatumAdapter();

export async function startDepositMonitor() {
  logger.info("Initializing Blockchain Deposit Monitor...");

  // Wait 5s after startup before first poll to ensure env is fully loaded
  setTimeout(() => runMonitor(), 5000);
  setInterval(() => runMonitor(), 60000);
}

async function runMonitor() {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

    if (!url || !key) {
      logger.error("Deposit monitor: Supabase env vars not loaded yet, skipping cycle");
      return;
    }

    const { data: wallets, error } = await supabaseAdmin
      .from("crypto_wallets")
      .select("id, user_id, asset, deposit_address, balance")
      .eq("is_active", true)
      .not("deposit_address", "is", null);

    if (error) {
      logger.error(`Failed to fetch crypto wallets: ${error.message} | code: ${error.code} | details: ${error.details}`);
      return;
    }

    logger.info(`Deposit monitor: polling ${(wallets || []).length} active crypto wallets`);

    for (const wallet of wallets || []) {
      try {
        const onChainBalance = await tatum.getAddressBalance(wallet.asset, wallet.deposit_address);
        const currentBalance = parseFloat(wallet.balance || "0");

        if (onChainBalance > currentBalance) {
          const depositAmount = onChainBalance - currentBalance;
          logger.info(`Deposit detected: ${depositAmount} ${wallet.asset} on ${wallet.deposit_address}`);

          await supabaseAdmin
            .from("crypto_wallets")
            .update({ balance: onChainBalance })
            .eq("id", wallet.id);

          await supabaseAdmin.from("transactions").insert({
            user_id: wallet.user_id,
            type: "deposit",
            amount: depositAmount,
            currency: wallet.asset,
            status: "completed",
            description: `${wallet.asset} deposit detected on-chain`,
            reference: `CRYPTO-DEP-${Date.now()}`,
          });

          logger.info(`Updated balance for wallet ${wallet.id}: ${currentBalance} → ${onChainBalance} ${wallet.asset}`);
        }
      } catch (err: any) {
        logger.error(`Error polling wallet ${wallet.id} (${wallet.asset}): ${err.message}`);
      }
    }
  } catch (err: any) {
    logger.error(`Deposit monitor cycle error: ${err.message} | stack: ${err.stack}`);
  }
}
