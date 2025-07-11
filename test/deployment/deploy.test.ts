import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployEvsd } from "../../lib/deployment";
import { EvsdToken } from "@/typechain-types/contracts/EvsdToken";
import { EvsdGovernor } from "@/typechain-types/contracts/EvsdGovernor";
import { AddressLike } from "ethers";

describe("EvsdGovernor Deployment", () => {
  let governor: EvsdGovernor;
  let token: EvsdToken;
  let initialVoters: AddressLike[];
  beforeEach(async () => {
    initialVoters = [
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
    ];
    async function deploy() {
      return await deployEvsd(initialVoters);
    }
    const fixture = await loadFixture(deploy);
    governor = fixture.governor;
    token = fixture.token;
  });

  it("should have the governor contract as the token owner", async () => {
    const ownerAddress = await token.owner();
    const governorAddress = await governor.getAddress();
    expect(ownerAddress).to.equal(governorAddress);
  });

  it("should have token supply equal to number of initial voters", async () => {
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(initialVoters.length);
  });

  it("should have minted one token for each initial voter", async () => {
    for (const address of initialVoters) {
      const balance = await token.balanceOf(address);
      expect(balance).to.equal(1);
    }
  });
});
