import SupplyFetcher from "./supply.fetcher"
import { Interface } from "@ethersproject/abi";
import { createAddress, MockEthersProvider } from 'forta-agent-tools';
import utils from "./utils";
import { BigNumber } from "ethers";
import { keccak256 } from "forta-agent/dist/sdk/utils";

const AMP_IFACE: Interface = new Interface(utils.AMP_ABI);

//partition address, block number, partition supply
const SUPPLY_DATA: [string, number, BigNumber][] = [
    [keccak256("csfkfd"), 22, BigNumber.from(345325)],
    [keccak256("gggggggg"), 23, BigNumber.from(324242)],
    [keccak256("awawawa"), 24, BigNumber.from(65654654)]
]

const WRONG_CONTRACT_DATA: [string, string, number, BigNumber][] = [
    [createAddress("0xaaa1"), keccak256("part22"), 50, BigNumber.from(1111111)],
    [createAddress("0xaaa2"), keccak256("part23"), 51, BigNumber.from(1111112)],
    [createAddress("0xaaa3"), keccak256("part24"), 52, BigNumber.from(1111113)],
    [createAddress("0xaaa4"), keccak256("part25"), 53, BigNumber.from(1111114)]
]

describe("SupplyFetcher test suite", () => {
    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const amp: string = createAddress("0xdade");
    const fetcher: SupplyFetcher = new SupplyFetcher(amp, mockProvider as any);
    
    beforeEach(() => {
        mockProvider.clear();    
    })

    it("should set the flexa manager correctly", async () => {
        for(let i = 0; i < 10; ++i){
        const addr: string = createAddress(`0xfff${i}`);
        const supplyFetcher: SupplyFetcher = new SupplyFetcher(addr, mockProvider as any);
        expect(supplyFetcher.amp).toStrictEqual(addr);
        }
    });

    it("should return catch value when called with a non partition address", async () => {
        for (let [addr, part, block, supply] of WRONG_CONTRACT_DATA) {
            mockProvider.addCallTo(addr, block, AMP_IFACE, 'totalSupplyByPartition', { inputs: [part], outputs: [BigNumber.from(supply)]});
            const value: BigNumber = await fetcher.getTotalSupplyByPartition(block, part);
            expect(value).toStrictEqual(BigNumber.from(1000000000000000))
        }
    })
    
    it("should return the total supply of a partition", async () => {
        for(let [part, block, supply] of SUPPLY_DATA) {
            mockProvider.addCallTo(amp, block, AMP_IFACE, 'totalSupplyByPartition', { inputs: [part], outputs: [BigNumber.from(supply)]});
            const value: BigNumber = await fetcher.getTotalSupplyByPartition(block, part);
            expect(value).toStrictEqual(BigNumber.from(supply));
        }
    })
})