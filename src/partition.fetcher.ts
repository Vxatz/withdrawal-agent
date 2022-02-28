import { Contract, providers, BigNumber } from "ethers";
import utils, {AMP_CONTRACT} from "./utils";
import LRU from "lru-cache";

export default class PartitionsFetcher {
  readonly manager: string;
  private mContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber | boolean>;

  constructor(manager: string, provider: providers.Provider){
      this.provider = provider;
      this.manager = manager;
      this.mContract = new Contract(manager, utils.FLEXA_ABI, provider);
      this.cache = new LRU<string,  BigNumber |  boolean>({max: 10000})
  }

  public async isPartition(block: number, partition: string): Promise<boolean> {
    const key: string = `is-${partition}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as boolean;
    try {
      const isPartition: boolean = await this.mContract.partitions(partition, {blockTag: block});
      this.cache.set(key, isPartition);
      return isPartition;
    } catch {
       this.cache.set(key, false);
       return false;
    }
  }

  public async getTotalSupplyByPartition(block: number, partition: string): Promise<BigNumber> {
   const key: string = `${partition}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as BigNumber;
    try {
      const contract: Contract = new Contract(AMP_CONTRACT, utils.AMP_ABI, this.provider);
      const partitionSupply: BigNumber = await contract.totalSupplyByPartition(partition, {blockTag: block});
      this.cache.set(key, partitionSupply);
      return partitionSupply;
    } catch {
      this.cache.set(key, BigNumber.from(1))
      return BigNumber.from(1);
    }
  }

}