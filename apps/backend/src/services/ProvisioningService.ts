import { supabaseAdmin } from "../config/database";
import { UnitAdapter } from "../providers/banking/unit/UnitAdapter";
import { CurrencycloudAdapter } from "../providers/banking/currencycloud/CurrencycloudAdapter";
import { TatumAdapter } from "../providers/crypto/tatum/TatumAdapter";
import { NotificationService } from "./NotificationService";
import { logger } from "../utils/logger";

export class ProvisioningService {
  static async provisionUser(userId: string, kycDetails: any, userEmail: string, userPhone: string) {
    logger.info(`Provisioning accounts and wallets for user ${userId}...`);

    try {
      // 1. Create Unit customer + virtual checking account
      logger.info(`[Provisioning] Creating Unit customer...`);
      const unitCust = await new UnitAdapter().createCustomer({
      first_name: kycDetails.first_name,
      last_name: kycDetails.last_name,
      email: userEmail,
      phone: userPhone,
      date_of_birth: kycDetails.date_of_birth,
      address: {
        street: kycDetails.address_line1,
        city: kycDetails.city,
        state: kycDetails.state || "",
        postal_code: kycDetails.postal_code,
        country: kycDetails.country,
      }
    });
      const unitCustomerId = unitCust.id;

      logger.info(`[Provisioning] Creating Unit virtual account...`);
      const unitBank = await new UnitAdapter().createVirtualAccount(unitCustomerId, "USD");
      const bankDetails = {
      accountNumber: unitBank.accountNumber,
      routingNumber: unitBank.routingNumber || "084009519",
      bankName: unitBank.bankName,
      bankAddress: unitBank.bankAddress,
      };

      // 2. Create Currencycloud sub-account
      logger.info(`[Provisioning] Creating Currencycloud customer...`);
      const ccCust = await new CurrencycloudAdapter().createCustomer({
        first_name: kycDetails.first_name,
        last_name: kycDetails.last_name,
        email: userEmail,
        city: kycDetails.city,
        country: kycDetails.country,
        address_line1: kycDetails.address_line1,
        postal_code: kycDetails.postal_code,
        state: kycDetails.state
      });
      const currencycloudAccountId = ccCust.id;

      // 3. Create fiat wallets (USD, EUR)
      logger.info(`[Provisioning] Creating fiat wallets in DB...`);
      await supabaseAdmin.from("fiat_wallets").upsert([
        { user_id: userId, currency: "USD", label: "USD wallet", balance: 0, available_balance: 0, is_active: true },
      { user_id: userId, currency: "EUR", label: "EUR wallet", balance: 0, available_balance: 0, is_active: true },
      ], { onConflict: "user_id,currency" });

      // 4. Generate BTC, ETH, USDT wallet addresses using Tatum
      logger.info(`[Provisioning] Generating Tatum crypto wallets...`);
      const tatum = new TatumAdapter();
      const [btcW, ethW, usdtW] = await Promise.all([
      tatum.createWallet("BTC", "BTC Wallet"),
      tatum.createWallet("ETH", "ETH Wallet"),
      tatum.createWallet("USDT", "USDT Wallet"),
    ]);

    // Insert into crypto_wallets table
    const cryptoWalletRows = [
      { user_id: userId, asset: "BTC", network: "Bitcoin", label: "BTC Wallet", deposit_address: btcW.id, balance: 0, is_active: true },
      { user_id: userId, asset: "ETH", network: "Ethereum", label: "ETH Wallet", deposit_address: ethW.id, balance: 0, is_active: true },
      { user_id: userId, asset: "USDT", network: "TRC-20", label: "USDT Wallet", deposit_address: usdtW.id, balance: 0, is_active: true },
    ];

    const { data: insertedWallets } = await supabaseAdmin
      .from("crypto_wallets")
      .upsert(cryptoWalletRows, { onConflict: "user_id,asset" })
      .select("id");

    const cryptoWalletIds = insertedWallets ? insertedWallets.map(w => w.id) : [];

    // Create USD virtual account in virtual_accounts table
    await supabaseAdmin.from("virtual_accounts").insert({
      user_id: userId,
      currency: "USD",
      account_name: "Nexus Pay Collection Account",
      account_number: bankDetails.accountNumber,
      routing_number: bankDetails.routingNumber,
      bank_name: bankDetails.bankName,
      bank_address: bankDetails.bankAddress,
      status: "active",
    });

    // Save unit_customer_id, currencycloud_account_id, crypto_wallet_ids to profiles
    await supabaseAdmin
      .from("profiles")
      .update({
        unit_customer_id: unitCustomerId,
        currencycloud_account_id: currencycloudAccountId,
        crypto_wallet_ids: cryptoWalletIds,
      })
      .eq("id", userId);

    // 5. Send notifications for approval
    const notifier = NotificationService.getProvider();
    await notifier.sendEmail(
      userEmail,
      "KYC Verification Approved",
      `<p>Hi ${kycDetails.first_name},</p><p>Congratulations! Your identity verification has been approved. Your wallets, accounts, and payouts are now fully unlocked.</p>`
    );

      if (userPhone) {
        await notifier.sendSMS(
          userPhone,
          "Nexus Pay: Your identity verification has been approved. Your account is now fully unlocked!"
        );
      }
      
      logger.info(`Successfully provisioned user ${userId}.`);
    } catch (err: any) {
      logger.error(`[Provisioning] Failed: ${err.message}`, err);
      throw err;
    }
  }
}
