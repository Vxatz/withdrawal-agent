import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export const FLEXA_MANAGER_CONTRACT: string = "0x706d7f8b3445d8dfc790c524e3990ef014e7c578";
const FLEXA_ABI: string[] = [
    "function partitions(bytes32) view returns (bool)",
    "event Withdrawal( address indexed supplier, bytes32 indexed partition, uint256 amount, uint256 indexed rootNonce, uint256 authorizedAccountNonce )",
    "event FallBackWithdrawal( address indexed supplier, bytes32 indexed partition, uint256 amount )"    
];

export const AMP_CONTRACT: string = "0xff20817765cb7f73d4bde2e66e067e58d11095c2";
export const AMP_ABI: string[] = [
    "function totalSupplyByPartition(bytes32) view returns (uint256)",
    "event TransferByPartition( bytes32 indexed fromPartition, address operator, address indexed from, address indexed to, uint256 value, bytes data, bytes operatorData )"
];

export const transferByPartitionFinding = (log: LogDescription): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager high transfer by partition detected",
  description: "High Transfer by Partition",
  alertId: "FLEXA-2",
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

export const createFinding = (log: LogDescription): Finding => transferByPartitionFinding(log);

export default {
    FLEXA_MANAGER_CONTRACT,
    FLEXA_ABI,
    AMP_CONTRACT,
    AMP_ABI,  
    transferByPartitionFinding
};
