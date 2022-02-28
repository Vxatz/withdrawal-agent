import PartitionsFetcher from "./partition.fetcher";
import { Interface } from "@ethersproject/abi";
import { createAddress, MockEthersProvider } from 'forta-agent-tools';
import utils from "./utils";
import { BigNumber } from "ethers";
import { keccak256 } from "forta-agent/dist/sdk/utils";

const AMP_IFACE: Interface = new Interface(utils.AMP_ABI);
const FLEXA_IFACE: Interface = new Interface(utils.FLEXA_ABI);

//contract address, partition address, block number, isPartition
const WRONG_CONTRACT_DATA: [string, string, number, boolean][] = [
    [createAddress("0xa311"), keccak256("part1"), 11, false],
    [createAddress("0xa399"), keccak256("part2"), 12, true],
    [createAddress("0xa3aa"), keccak256("part3"), 13, false],
]

const SUPPLY_DATA: [string, number, BigNumber][] = [
    [keccak256("csfkfd"), 22, BigNumber.from(345325)],
    [keccak256("gggggggg"), 23, BigNumber.from(324242)],
]


//partition address, block number, isPartition
const PARTITIONS: [string, number, boolean][] = [
    [keccak256("csfkfdsk"), 13, true],
    [keccak256("ooooooo"), 14, false],
    [keccak256("dfdsf9ssf"), 15, true],
    [keccak256("dfdsf9ssf"), 16, false]
]

describe("PartitionsFetcher test suite", () => {
    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const flexa: string = createAddress("0xdead");
    const amp: string = createAddress("0xdade");
    const fetcher: PartitionsFetcher = new PartitionsFetcher(flexa, mockProvider as any);
    
    beforeEach(() => {
        mockProvider.clear();    
    })

    it("should set the flexa manager correctly", async () => {
        for(let i = 0; i < 10; ++i){
        const addr: string = createAddress(`0xfff${i}`);
        const partitionsFetcher: PartitionsFetcher = new PartitionsFetcher(addr, mockProvider as any);
        expect(partitionsFetcher.manager).toStrictEqual(addr);
        }
    });

    it("should return false when isPartition is called with a wrong contract address", async () => {
        for(let [addr, partition, block, isPart] of WRONG_CONTRACT_DATA){
            mockProvider.addCallTo(addr, block, FLEXA_IFACE, 'partitions', { inputs: [partition], outputs: [isPart]});
            expect(await fetcher.isPartition(block, partition)).toStrictEqual(false);            
    }
    })

    it("should return true (false) when isPartition is called with the correct contract address and an address that is (is not) a partition", async () => {        
        for(let [part, block, isPart] of PARTITIONS) {
            mockProvider.addCallTo(flexa, block, FLEXA_IFACE, 'partitions', { inputs: [part], outputs: [isPart]});        
            const value: boolean = await fetcher.isPartition(block, part);
            expect(value).toStrictEqual(isPart);
            //  clear mock and use cached values
            mockProvider.clear();
            expect(value).toStrictEqual(isPart);  
        }                      
    })

    it("should return the total supply of a partition", async () => {
        for(let [part, block, supply] of SUPPLY_DATA) {
            mockProvider.addCallTo(amp, block, AMP_IFACE, 'totalSupplyByPartition', { inputs: [part], outputs: [BigNumber.from(supply)]});
            const value: BigNumber = await fetcher.getTotalSupplyByPartition(block, part);
            console.log(value);
            expect(value).toStrictEqual(BigNumber.from(supply));
        }
    })

});
