import PartitionsFetcher from "./partition.fetcher";
import { Interface } from "@ethersproject/abi";
import { createAddress, MockEthersProvider } from 'forta-agent-tools';
import utils from "./utils";
import { BigNumber } from "ethers";

const AMP_IFACE: Interface = new Interface(utils.AMP_ABI);
const FLEXA_IFACE: Interface = new Interface(utils.FLEXA_ABI);

const DATA: [string, string, number][] = [
    [createAddress("0xa31115bc"), createAddress("0xa32345bc"), 11],
    [createAddress("0xa39995bc"), createAddress("0xff6765ab"), 12],
    [createAddress("0xa3aaaabc"), createAddress("0x1c5b6ee4"), 13],
]


describe("PartitionsFetcher test suite", () => {
    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const flexa: string = createAddress("0xaaaaa");
    const fetcher: PartitionsFetcher = new PartitionsFetcher(flexa, mockProvider as any);

    beforeEach(() => {
        mockProvider.clear();    
    })


    it("should set the flexa manager correctly", async () => {
        for(let i = 0; i < 10; ++i){
        const addr: string = createAddress(`0xff${i}`);
        const partitionsFetcher: PartitionsFetcher = new PartitionsFetcher(addr, mockProvider as any);
        expect(partitionsFetcher.manager).toStrictEqual(addr);
        }
    });

    it("should return false when isPartition is called with address that is not a partition", async () => {
        for(let [, partition, block] of DATA){
            //mockProvider.addCallTo(addr, block, AMP_IFACE, "partitions", { inputs:[partition], outputs:[false]})
            expect(await fetcher.isPartition(block, partition)).toStrictEqual(false);
    }
    })
});
