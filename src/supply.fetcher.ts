import { Contract, providers, BigNumber } from "ethers";
import utils from "./utils";
import LRU from "lru-cache";

export default class SupplyFetcher {
  readonly amp: string;
  private ampContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber>;

  constructor(amp: string, provider: providers.Provider){
      this.provider = provider;
      this.amp = amp;
      this.ampContract = new Contract(amp, utils.AMP_ABI, provider);
      this.cache = new LRU<string,  BigNumber>({max: 10000})
  }

   public async getTotalSupplyByPartition(block: number, partition: string): Promise<BigNumber> {
   const key: string = `${partition}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as BigNumber;
    try {
      const partitionSupply: BigNumber = await this.ampContract.totalSupplyByPartition(partition, {blockTag: block});
      this.cache.set(key, partitionSupply);
      return partitionSupply;
    } catch {
      //this.cache.set(key, BigNumber.from(1))
      return BigNumber.from(1000000000000000);
    }
  }
}