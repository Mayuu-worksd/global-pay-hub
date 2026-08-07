import { ICryptoProvider } from "../providers/ICryptoProvider";
import { TatumAdapter } from "../providers/crypto/tatum/TatumAdapter";
import { FireblocksAdapter } from "../providers/crypto/fireblocks/FireblocksAdapter";
import { AlchemyAdapter } from "../providers/crypto/alchemy/AlchemyAdapter";
import { TronGridAdapter } from "../providers/crypto/trongrid/TronGridAdapter";

export class CryptoService {
  private static instance: ICryptoProvider;

  public static getProvider(): ICryptoProvider {
    if (!this.instance) {
      const providerType = process.env.CRYPTO_PROVIDER || "tatum";
      switch (providerType) {
        case "tatum":
          this.instance = new TatumAdapter();
          break;
        case "fireblocks":
          this.instance = new FireblocksAdapter();
          break;
        case "alchemy":
          this.instance = new AlchemyAdapter();
          break;
        case "trongrid":
          this.instance = new TronGridAdapter();
          break;
        default:
          throw new Error(`Unsupported crypto provider: ${providerType}`);
      }
    }
    return this.instance;
  }
}
