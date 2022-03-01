import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, encodeParameter, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import { BigNumber } from "ethers";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import {AMP_ABI} from "./utils";
import { Interface } from "@ethersproject/abi";

// const SIGNATURE: string = "event TransferByPartition( bytes32 indexed fromPartition, address operator, address indexed from, address indexed to, uint256 value, bytes data, bytes operatorData )";
const AMP_IFACE: Interface = new Interface(AMP_ABI);
// const SIGNATURE2: string = "TransferByPartition(bytes,address,address,address,uint256,bytes,bytes)";
const FLEXA_CONTRACT: string = createAddress("0xffff");
const AMP_CONTRACT: string = createAddress("0xffff");

const PARTITIONS: string[] = [
    keccak256("part1"),
    keccak256("part2"),
    keccak256("part3"),
    keccak256("part4"),
]

const transferByPartitionFinding = (fromPartition: string, from: string, to: string, value: string): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager high transfer by partition detected",
  description: "High Transfer by Partition",
  alertId: "flexa-2-3",
  severity: FindingSeverity.Info,
  type: FindingType.Suspicious,
  protocol: "Flexa",
  metadata: { fromPartition, from, to, value },
});

describe("Forta Manager high transfer by partition agent test suite", () => {
    const mockIsPartition = jest.fn();
    const mockGetTotalSupplyByPartition = jest.fn();
    const mockPartitionFetcher = {
        isPartition: mockIsPartition,        
    };
    const mockSupplyFetcher = {
        getTotalSupplyByPartition: mockGetTotalSupplyByPartition,
    }
    const PERCENT: BigNumber = BigNumber.from(1);
    const handler: HandleTransaction = provideHandleTransaction(FLEXA_CONTRACT, AMP_CONTRACT, mockPartitionFetcher as any, mockSupplyFetcher as any, PERCENT);

    beforeEach(() => {
        mockPartitionFetcher.isPartition.mockClear();
        mockSupplyFetcher.getTotalSupplyByPartition.mockClear();
    });

    it("should report no findings for txs without events", async () => {
        when(mockIsPartition)
            .calledWith(42, PARTITIONS[0]).mockReturnValue(true)

        const tx: TransactionEvent = new TestTransactionEvent();
        const findings: Finding[] = await handler(tx);
        expect(findings).toStrictEqual([]);   
        expect(mockGetTotalSupplyByPartition).toBeCalled;   
    })

    it("should detect TransferByPartitionEvents in valid partitions", async () => {
        when(mockIsPartition)
            .calledWith(42, PARTITIONS[0]).mockReturnValue(true)
            .calledWith(42, PARTITIONS[2]).mockReturnValue(true);
        when(mockGetTotalSupplyByPartition)
            .calledWith(42, PARTITIONS[0]).mockReturnValue(BigNumber.from(200))
            .calledWith(42, PARTITIONS[2]).mockReturnValue(BigNumber.from(100))

        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log1 = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[0], createAddress('0xdead'),  createAddress('0xcccc'), createAddress("0xbaba"), "3243223", keccak256("gfgfgf"), keccak256("sasasas")]
        )
        const log2 = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[1], createAddress('0x9898'),  createAddress('0x1212'), createAddress("0x1010"), "99999", keccak256("cdcdcd"), keccak256("apppp")]
        )

        const tx: TransactionEvent =  new TestTransactionEvent()
            .setBlock(42)
            // .setTo(PARTITIONS[0])
            // .setValue("100")
            // .setFrom(createAddress('0xaa34'))                      
            .addAnonymousEventLog(PARTITIONS[0], log1.data, ...log1.topics) 
            .addAnonymousEventLog(PARTITIONS[2], log2.data, ...log2.topics);        

        
        const findings: Finding[] = await handler(tx);
        expect(findings).toStrictEqual([
            transferByPartitionFinding(PARTITIONS[0], createAddress('0xdead'), createAddress('0xcccc'), "3243223"),            
        ]);
    });
});
