import { HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from 'forta-agent';
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
    const eventsMap: LogDescription[] = [];

    // let partitions: string[] = [];
    // const partitionEvents: LogDescription[] = (txEvent.filterLog(utils.FLEXA_PARTITIONS_ABI, fetcher.manager));
    // const withdrawalEvents: LogDescription[] = (txEvent.filterLog(utils.FLEXA_ABI, fetcher.manager));
    const transferByPartitionEvents: LogDescription[] = (txEvent.filterLog(utils.AMP_ABI, AMP_CONTRACT));
  
    // const handlePartitionEvent = async (event: LogDescription) => {
    //   partitions.indexOf(event.args["partition"]) === -1 ? partitions.push(event.args["partition"]) : partitions = partitions.filter((p) => (p) !== event.args["partition"]);
    //   eventsMap.push(event);
    // }
    
    // const handleWithdrawalEvent = async (event: LogDescription) => {
    //   const partition: string = event.args["partition"];
    //   const totalPartitionSupply: BigNumber = await fetcher.getTotalSupplyByPartition(block, partition);
    //   if (BigNumber.from(event.args["amount"]).gt((BigNumber.from(totalPartitionSupply).mul(percent).div(100000000000)))) {
    //     eventsMap.push(event);
    //   }
    // }

    const handleTransferByPartitionEvent = async (event: LogDescription) => {
      const from: string = (event.args["from"]);
        if (from.toLowerCase() === FLEXA_MANAGER_CONTRACT) {
          const fromPartition: string = event.args["fromPartition"];
          const isFlexaPartition: boolean =  await fetcher.isPartition(block, fromPartition); 
          if (isFlexaPartition) {
            const totalPartitionSupply: BigNumber = await fetcher.getTotalSupplyByPartition(block, fromPartition);
            if (BigNumber.from(event.args["value"]).gt((BigNumber.from(totalPartitionSupply).mul(percent).div(100000000000)))) {
              eventsMap.push(event);
            }                
          }
        }        
     }

    if (transferByPartitionEvents) {
      for (let i=0; i<transferByPartitionEvents.length; i++) {
        await handleTransferByPartitionEvent(transferByPartitionEvents[i]);
      }
    }

    // if (withdrawalEvents) {
    //   for (let i=0; i<withdrawalEvents.length; i++) {
    //     await handleWithdrawalEvent(withdrawalEvents[i]);
    //   }
    // }

    // if (partitionEvents) {
    //   for (let i=0; i<partitionEvents.length; i++) {
    //    handlePartitionEvent(partitionEvents[i]);
    //   }
    // }

    return eventsMap.map(utils.createFinding);
  }  

export default {
  handleTransaction: provideHandleTransaction(new PartitionsFetcher(FLEXA_MANAGER_CONTRACT, getEthersProvider()), PERCENT),
};
