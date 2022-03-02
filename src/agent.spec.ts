import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { when } from "jest-when";
import { BigNumber } from "ethers";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import { AMP_ABI } from "./utils";
import { Interface } from "@ethersproject/abi";

const AMP_IFACE: Interface = new Interface(AMP_ABI);

const PARTITIONS: string[] = [
    keccak256("part1"),
    keccak256("part2"),
    keccak256("part3"),
    keccak256("part4"),
];

const transferByPartitionFinding = (fromPartition: string, fromAddress: string, toAddress: string, amount: string): Finding => Finding.fromObject({
  name: "Flexa Collateral Manager high transfer by partition detected",
  description: "High Transfer by Partition",
  alertId: "FLEXA-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Flexa",
  metadata: { fromPartition, fromAddress, toAddress, amount },
});

describe("Forta Manager high transfer by partition agent test suite", () => {
    const mockIsPartition = jest.fn();
    const mockGetTotalSupplyByPartition = jest.fn();
    const FLEXA_CONTRACT: string = createAddress("0xfffd");
    const AMP_CONTRACT: string = createAddress("0xffff");
    const mockFetcher = {
        getTotalSupplyByPartition: mockGetTotalSupplyByPartition,
        isPartition: mockIsPartition,
        flexa: FLEXA_CONTRACT,
        amp: AMP_CONTRACT
    }
    const PERCENT: BigNumber = BigNumber.from(1);
    const handler: HandleTransaction = provideHandleTransaction(mockFetcher as any, PERCENT);

    beforeEach(() => {
        mockFetcher.isPartition.mockClear();
        mockFetcher.getTotalSupplyByPartition.mockClear();
    });

    it("should report no findings for txs without events", async () => {
        when(mockIsPartition)
            .calledWith(42, PARTITIONS[0]).mockReturnValue(true);

        const tx: TransactionEvent = new TestTransactionEvent();
        const findings: Finding[] = await handler(tx);
        expect(findings).toStrictEqual([]);   
        expect(mockGetTotalSupplyByPartition).toBeCalled;   
    });

    it("should ignore regular, below the threshold, transfers", async () => {
        when(mockIsPartition)
            .calledWith(38, PARTITIONS[1]).mockReturnValue(true);
            
        when(mockGetTotalSupplyByPartition)
            .calledWith(38, PARTITIONS[1]).mockReturnValue(BigNumber.from(20000000000));
        
        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[1], createAddress('0xdead'),  mockFetcher.flexa, createAddress("0xbaba"), "3243223", keccak256("gfgfgf"), keccak256("sasasas")]
        );
        
        const txEvent: TransactionEvent =  new TestTransactionEvent()
            .setBlock(38)
            .addAnonymousEventLog(mockFetcher.amp, log.data, ...log.topics)        

        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([]);

    })

    it("should detect multiple TransferByPartitionEvents", async () => {
        when(mockIsPartition)
            .calledWith(42, PARTITIONS[0]).mockReturnValue(true)
            .calledWith(42, PARTITIONS[2]).mockReturnValue(true);
        when(mockGetTotalSupplyByPartition)
            .calledWith(42, PARTITIONS[0]).mockReturnValue(BigNumber.from(200))
            .calledWith(42, PARTITIONS[2]).mockReturnValue(BigNumber.from(100));

        const event = AMP_IFACE.getEvent("TransferByPartition");
        const log1 = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[0], createAddress('0xdead'),  mockFetcher.flexa, createAddress("0xbaba"), "3243223", keccak256("gfgfgf"), keccak256("sasasas")]
        );
        const log2 = AMP_IFACE.encodeEventLog(
            event, [PARTITIONS[2], createAddress('0x9898'),  mockFetcher.flexa, createAddress("0x1010"), "99999", keccak256("cdcdcd"), keccak256("apppp")]
        );

        const txEvent: TransactionEvent =  new TestTransactionEvent()
            .setBlock(42)
            .addAnonymousEventLog(mockFetcher.amp, log1.data, ...log1.topics) 
            .addAnonymousEventLog(mockFetcher.amp, log2.data, ...log2.topics);        

        const findings: Finding[] = await handler(txEvent);
        expect(findings).toStrictEqual([
            transferByPartitionFinding(PARTITIONS[0], mockFetcher.flexa, createAddress("0xbaba"), "3243223"),  
            transferByPartitionFinding(PARTITIONS[2], mockFetcher.flexa, createAddress("0x1010"), "99999")          
        ]);
    });
});
