export type FiatCurrency = "USD" | "EUR";
export type CryptoAsset = "BTC" | "ETH" | "USDT";

export type TransactionType = "deposit" | "withdrawal" | "exchange" | "send" | "receive";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";
export type KycStatus = "not_started" | "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  onboarding_completed: boolean;
}

export interface FiatWallet {
  id: string;
  user_id: string;
  currency: string;
  label: string | null;
  balance: number;
  available_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface CryptoWallet {
  id: string;
  user_id: string;
  asset: string;
  network: string | null;
  label: string | null;
  balance: number;
  deposit_address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VirtualAccount {
  id: string;
  user_id: string;
  currency: string;
  account_name: string | null;
  account_number: string;
  routing_number: string | null;
  iban: string | null;
  swift_bic: string | null;
  bank_name: string | null;
  bank_address: string | null;
  status: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  to_amount: number | null;
  to_currency: string | null;
  rate: number | null;
  fee: number;
  reference: string;
  description: string | null;
  counterparty: string | null;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  user_id: string;
  name: string;
  type: string;
  currency: string | null;
  email: string | null;
  bank_name: string | null;
  account_number: string | null;
  routing_number: string | null;
  iban: string | null;
  swift_bic: string | null;
  country: string | null;
  crypto_asset: string | null;
  crypto_network: string | null;
  crypto_address: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  base_currency: string;
  email_notifications: boolean;
  transaction_alerts: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
}
