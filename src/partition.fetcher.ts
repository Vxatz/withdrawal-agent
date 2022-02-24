import { Contract, providers, BigNumber } from "ethers";
import utils, {AMP_CONTRACT} from "./utils";
import LRU from "lru-cache";

export default class PartitionsFetcher {
  readonly manager: string;
  private mContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber | boolean>>;

  constructor(manager: string, provider: providers.Provider){
      this.provider = provider;
      this.manager = manager;
      this.mContract = new Contract(manager, utils.FLEXA_ABI, provider);
      this.cache = new LRU<string, Promise<BigNumber | boolean>>({max: 10000})
  }

  public async isPartition(block: number, partition: string): Promise<boolean> {
    const key: string = `all-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<boolean>;
    const isPartition: Promise<boolean> = this.mContract.partitions(partition);
    this.cache.set(key, isPartition);
    return isPartition;
  }

  public async getTotalSupplyByPartition(block: number, partition: string): Promise<BigNumber> {
    const key: string = `${block}-${partition}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<BigNumber>;
    const contract: Contract = new Contract(AMP_CONTRACT, utils.AMP_ABI, this.provider);
    const partitionSupply: Promise<BigNumber> = contract.totalSupplyByPartition(partition);
    this.cache.set(key, partitionSupply);
    return partitionSupply;

  }
}