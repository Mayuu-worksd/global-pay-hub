import { IKYCProvider } from "../providers/IKYCProvider";
import { SumsubAdapter } from "../providers/kyc/sumsub/SumsubAdapter";

export class KYCService {
  private static instance: IKYCProvider;

  public static getProvider(): IKYCProvider {
    if (!this.instance) {
      const providerType = process.env.KYC_PROVIDER || "sumsub";
      if (providerType === "sumsub") {
        this.instance = new SumsubAdapter();
      } else {
        throw new Error(`Unsupported KYC provider: ${providerType}`);
      }
    }
    return this.instance;
  }
}
