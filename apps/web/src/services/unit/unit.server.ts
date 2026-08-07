/**
 * Unit adapter — virtual bank accounts & ACH/wire rails.
 * Architecture placeholder: the interface is final, the transport is not wired yet.
 */

export interface UnitAccountRequest {
  userId: string;
  currency: string;
  fullName: string;
}

export interface UnitAccountResponse {
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  bankAddress: string;
}

export interface UnitConfig {
  token: string;
  baseUrl: string;
}

export function readUnitConfig(): UnitConfig | null {
  const token = process.env["UNIT_API_TOKEN"] || process.env["UNIT_API_KEY"];
  const baseUrl = process.env["UNIT_API_BASE_URL"] || "https://api.s.unit.sh";
  if (!token || !baseUrl) return null;
  return { token, baseUrl };
}

export class UnitNotConfiguredError extends Error {
  constructor() {
    super("Unit is not configured yet. Set UNIT_API_TOKEN and UNIT_API_BASE_URL.");
    this.name = "UnitNotConfiguredError";
  }
}

export const unitService = {
  async createDepositAccount(_input: UnitAccountRequest): Promise<UnitAccountResponse> {
    const config = readUnitConfig();
    if (!config) throw new UnitNotConfiguredError();
    throw new UnitNotConfiguredError();
  },

  async listAccountTransactions(_accountId: string): Promise<unknown[]> {
    const config = readUnitConfig();
    if (!config) throw new UnitNotConfiguredError();
    return [];
  },
};
