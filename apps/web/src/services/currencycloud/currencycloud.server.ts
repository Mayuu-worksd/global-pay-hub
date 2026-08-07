/**
 * Currencycloud adapter — FX rates, conversions and international payouts.
 * Architecture placeholder: the interface is final, the transport is not wired yet.
 */

export interface FxQuote {
  from: string;
  to: string;
  rate: number;
  amount: number;
  converted: number;
  expiresAt: string;
}

export interface PayoutRequest {
  beneficiaryId: string;
  amount: number;
  currency: string;
  reference: string;
}

export interface CurrencycloudConfig {
  apiKey: string;
  loginId: string;
  baseUrl: string;
}

export function readCurrencycloudConfig(): CurrencycloudConfig | null {
  const apiKey = process.env["CURRENCYCLOUD_API_KEY"];
  const loginId = process.env["CURRENCYCLOUD_LOGIN_ID"];
  const baseUrl = process.env["CURRENCYCLOUD_API_BASE_URL"];
  if (!apiKey || !loginId || !baseUrl) return null;
  return { apiKey, loginId, baseUrl };
}

export class CurrencycloudNotConfiguredError extends Error {
  constructor() {
    super("Currencycloud is not configured yet. Set CURRENCYCLOUD_* environment variables.");
    this.name = "CurrencycloudNotConfiguredError";
  }
}

export const currencycloudService = {
  async getQuote(_from: string, _to: string, _amount: number): Promise<FxQuote> {
    const config = readCurrencycloudConfig();
    if (!config) throw new CurrencycloudNotConfiguredError();
    throw new CurrencycloudNotConfiguredError();
  },

  async createPayout(_input: PayoutRequest): Promise<{ id: string; status: string }> {
    const config = readCurrencycloudConfig();
    if (!config) throw new CurrencycloudNotConfiguredError();
    throw new CurrencycloudNotConfiguredError();
  },
};
