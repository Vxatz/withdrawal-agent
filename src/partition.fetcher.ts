import { Contract, providers} from "ethers";
import utils from "./utils";
import LRU from "lru-cache";

export default class PartitionsFetcher {
  readonly manager: string;
  private mContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, boolean>;

  constructor(manager: string, provider: providers.Provider){
      this.provider = provider;
      this.manager = manager;
      this.mContract = new Contract(manager, utils.FLEXA_ABI, provider);
      this.cache = new LRU<string, boolean>({max: 10000})
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
}