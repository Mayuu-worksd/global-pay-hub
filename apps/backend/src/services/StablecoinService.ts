import { IStablecoinProvider } from "../providers/stablecoin/IStablecoinProvider";
import { BridgeAdapter } from "../providers/stablecoin/bridge/BridgeAdapter";
import { GridAdapter } from "../providers/stablecoin/grid/GridAdapter";

export class StablecoinService {
  private static instance: IStablecoinProvider;

  public static getProvider(): IStablecoinProvider {
    if (!this.instance) {
      const providerType = process.env.STABLECOIN_PROVIDER || "bridge";
      if (providerType === "bridge") {
        this.instance = new BridgeAdapter();
      } else if (providerType === "grid") {
        this.instance = new GridAdapter();
      } else {
        throw new Error(`Unsupported stablecoin provider: ${providerType}`);
      }
    }
    return this.instance;
  }
}
