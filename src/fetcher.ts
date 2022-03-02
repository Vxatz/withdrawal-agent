import { Contract, providers, BigNumber } from "ethers";
import utils from "./utils";
import LRU from "lru-cache";

export default class Fetcher {
  readonly amp: string;
  readonly flexa: string;
  private ampContract: Contract;
  private flexaContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber | boolean>;

  constructor(amp: string, flexa: string, provider: providers.Provider){
      this.provider = provider;
      this.amp = amp;
      this.flexa = flexa;
      this.ampContract = new Contract(amp, utils.AMP_ABI, provider);
      this.flexaContract = new Contract(flexa, utils.FLEXA_ABI, provider);
      this.cache = new LRU<string,  BigNumber | boolean>({max: 10000});
  }

   public async getTotalSupplyByPartition(block: number, partition: string): Promise<BigNumber> {
   const key: string = `${partition}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as BigNumber;
    const partitionSupply: BigNumber = await this.ampContract.totalSupplyByPartition(partition, { blockTag: block });
    this.cache.set(key, partitionSupply);
    return partitionSupply;   
  }

  public async isPartition(block: number, partition: string): Promise<boolean> {
    const key: string = `is-${partition}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as boolean;
    const isPartition: boolean = await this.flexaContract.partitions(partition, { blockTag: block });
    this.cache.set(key, isPartition);
    return isPartition;
  }
}