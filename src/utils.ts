import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export const FLEXA_MANAGER_CONTRACT: string = "0x706d7f8b3445d8dfc790c524e3990ef014e7c578";
const FLEXA_ABI: string[] = [
    "function partitions(bytes32) view returns (bool)",
    "event Withdrawal( address indexed supplier, bytes32 indexed partition, uint256 amount, uint256 indexed rootNonce, uint256 authorizedAccountNonce )",
    "event FallBackWithdrawal( address indexed supplier, bytes32 indexed partition, uint256 amount )"    
];

const FLEXA_PARTITIONS_ABI: string[] = [
  "event PartitionAdded( bytes32 indexed partition )",
  "event PartitionRemoved( bytes32 indexed partition )"
];

export const AMP_CONTRACT: string = "0xff20817765cb7f73d4bde2e66e067e58d11095c2";
const AMP_ABI: string[] = [
    "function totalSupplyByPartition(bytes32) view returns (uint256)",
    "event TransferByPartition( bytes32 indexed fromPartition, address operator, address indexed from, address indexed to, uint256 value, bytes data, bytes operatorData )"
]

const withdrawalFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager high withdrawal detected",
  description: "High Withdrawal",
  alertId: "flexa-2-1",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "Flexa",
  metadata: {
    supplier: log.args['supplier'].toLowerCase(),
    partition: log.args['partition'].toLowerCase(),
    amount: log.args['amount'].toString(),
  }
});

const fallbackWithdrawalFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager high fallback withdrawal detected",
  description: "High Fallback Withdrawal",
  alertId: "flexa-2-2",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "Flexa",
  metadata: {
    supplier: log.args['supplier'].toLowerCase(),
    partition: log.args['partition'].toLowerCase(),
    amount: log.args['amount'].toString(),
  }
});

const transferByPartitionFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager high transfer by partition detected",
  description: "High Transfer by Partition",
  alertId: "flexa-2-3",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "Flexa",
  metadata: {
    fromPartition: log.args['fromPartition'].toLowerCase(),
    fromAddress: log.args['from'].toLowerCase(),
    toAddress: log.args['to'].toLowerCase(),
    amount: log.args['value'].toString(),
  }
});

const partitionAddedFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager partition addition detected",
  description: "Partition Added",
  alertId: "flexa-2-4",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "Flexa",
  metadata: {
    partition: log.args['partition'].toLowerCase(),
  }
});

const partitionRemovedFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager partition remove detected",
  description: "Partition Removed",
  alertId: "flexa-2-5",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "Flexa",
  metadata: {
    partition: log.args['partition'].toLowerCase(),
  }
});

const findingsMap: Record<string, (_: LogDescription) => Finding> = {
  "Withdrawal": withdrawalFinding,
  "FallbackWithdrawal": fallbackWithdrawalFinding,
  "TransferByPartition": transferByPartitionFinding,
  "PartitionAdded": partitionAddedFinding,
  "PartitionRemoved": partitionRemovedFinding
};

const createFinding = (log: LogDescription): Finding => findingsMap[log.name](log);

export default {
    FLEXA_MANAGER_CONTRACT,
    FLEXA_ABI,
    FLEXA_PARTITIONS_ABI,
    AMP_CONTRACT,
    AMP_ABI,
    createFinding
}
