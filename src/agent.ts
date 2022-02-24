import { HandleTransaction, TransactionEvent, LogDescription, getEthersProvider} from 'forta-agent';
import utils, { AMP_CONTRACT, FLEXA_MANAGER_CONTRACT } from './utils';
import PartitionsFetcher from './partition.fetcher';
import { BigNumber } from 'ethers';

const PERCENT: BigNumber = BigNumber.from(1);

export const provideHandleTransaction = (
  fetcher: PartitionsFetcher,
  percent: BigNumber,
): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const block: number = txEvent.blockNumber;
    // let partitions: string[] = [];

    // let partitionEvent: LogDescription = (txEvent.filterLog(utils.FLEXA_PARTITIONS_ABI, fetcher.manager))[0];
    // let withdrawalEvent: LogDescription = (txEvent.filterLog(utils.FLEXA_ABI, fetcher.manager))[0];
    let transferByPartitionEvent: LogDescription = (txEvent.filterLog(utils.AMP_ABI, AMP_CONTRACT))[0];

    // if (partitionEvent) {
    //   partitions.indexOf(partitionEvent.args["partition"]) === -1 ? partitions.push(partitionEvent.args["partition"]) : partitions = partitions.filter(partition => partition !== partitionEvent.args["partition"]);
    // }
    
    // if (withdrawalEvent) {
    //   const partition: string = withdrawalEvent.args["partition"];
    //   const totalPartitionSupply: BigNumber = await fetcher.getTotalSupplyByPartition(partition);

    //   const filterEvent: LogDescription[] = txEvent
    //     .filterLog(utils.FLEXA_ABI, fetcher.manager)
    //     .filter((log: LogDescription) => 
    //       BigNumber.from(log.args["amount"])
    //       .gt((BigNumber.from(totalPartitionSupply.toString()).mul(percent).div(10000000000000))
    //     ));  
      
    //   return filterEvent.map(utils.createFinding);
    // } 

    if (transferByPartitionEvent) {
        const from: string = (transferByPartitionEvent.args["from"]);
        if (from.toLowerCase() == FLEXA_MANAGER_CONTRACT) {

          const fromPartition = transferByPartitionEvent.args["fromPartition"];
          const isFlexaPartition: boolean = await fetcher.isPartition(block, fromPartition); 

          if (isFlexaPartition) {
            const totalPartitionSupply: BigNumber = await fetcher.getTotalSupplyByPartition(block, fromPartition);

            const filterEvent: LogDescription[] = txEvent
              .filterLog(utils.AMP_ABI, AMP_CONTRACT)
              .filter((log: LogDescription) =>
                BigNumber.from(log.args["value"])
                .gt((BigNumber.from(totalPartitionSupply.toString()).mul(percent).div(100))
              ));

            return filterEvent.map(utils.createFinding);
          }
        }
        return []
    } else return []
   }  
  
export default {
  handleTransaction: provideHandleTransaction(new PartitionsFetcher(FLEXA_MANAGER_CONTRACT, getEthersProvider()), PERCENT),
};
