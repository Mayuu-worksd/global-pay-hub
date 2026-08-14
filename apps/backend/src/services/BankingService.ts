import { IBankingProvider } from "../providers/IBankingProvider";
import { UnitAdapter } from "../providers/banking/unit/UnitAdapter";
import { CurrencycloudAdapter } from "../providers/banking/currencycloud/CurrencycloudAdapter";
import { BankingCircleProvider } from "../providers/banking/banking_circle/BankingCircleProvider";

export class BankingService {
  private static instance: IBankingProvider;

  public static getProvider(): IBankingProvider {
    if (!this.instance) {
      const providerType = process.env.BANKING_PROVIDER || "unit";
      if (providerType === "unit") {
        this.instance = new UnitAdapter();
      } else if (providerType === "currencycloud") {
        this.instance = new CurrencycloudAdapter();
      } else if (providerType === "banking_circle") {
        this.instance = new BankingCircleProvider();
      } else {
        throw new Error(`Unsupported banking provider: ${providerType}`);
      }
    }
    return this.instance;
  }
}

