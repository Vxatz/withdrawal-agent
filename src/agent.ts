import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from 'forta-agent';
import utils, { createFinding, transferByPartitionFinding, AMP_CONTRACT, FLEXA_MANAGER_CONTRACT } from './utils';
import PartitionsFetcher from './partition.fetcher';
import SupplyFetcher from './supply.fetcher';
import { BigNumber } from 'ethers';

const PERCENT: BigNumber = BigNumber.from(1);

export const provideHandleTransaction = (
  amp_contract: string,
  flexa_manager_contract: string,
  partitionFetcher: PartitionsFetcher,
  supplyFetcher: SupplyFetcher,
  percent: BigNumber,
): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const block: number = txEvent.blockNumber;    
    const findings: Finding[] = [];

    const logs: LogDescription[] = (txEvent.filterLog(utils.AMP_ABI, amp_contract));
    const isFlexaPartition: boolean[] = await Promise.all(
      logs.map(log => partitionFetcher.isPartition(block, log.args["fromPartition"]))
    );
    const totalPartitionSupply: BigNumber[] = await Promise.all(
      logs.map(log => supplyFetcher.getTotalSupplyByPartition(block, log.args["fromPartition"]))
    )
    logs.forEach((log, i) => {
      const from: string = log.args["from"]
      if (from.toLowerCase() === flexa_manager_contract) {
        if (isFlexaPartition[i]) {
          if (BigNumber.from(log.args["value"]).gt((BigNumber.from(totalPartitionSupply[i]).mul(percent).div(100)))) {
              findings.push(createFinding(log));              
            }  
        }
      }
    })

    return findings;    
  }  

export default {
  handleTransaction: provideHandleTransaction(AMP_CONTRACT, FLEXA_MANAGER_CONTRACT, new PartitionsFetcher(FLEXA_MANAGER_CONTRACT, getEthersProvider()), new SupplyFetcher(AMP_CONTRACT, getEthersProvider()) , PERCENT),
};
