// test/GreeterService.test.ts
import { expect } from "chai";
import { BlockchainProposalService } from "../lib/blockchain-proposal-service";
import { InMemoryProposalFileService } from "../lib/file-upload";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import evsdGovernorArtifacts from "../contracts/evsd-governor.json";
import { UIProposal, UIVotableItem } from "../types/proposal";
import hardhat from "hardhat";
import { AddressLike, ethers } from "ethers";
import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";

async function deployContracts(deployer: ethers.Signer) {
  const EvsdTokenFactory = await hardhat.ethers.getContractFactory(
    "EvsdToken",
    deployer
  );
  const evsdToken = await EvsdTokenFactory.deploy(deployer);
  await evsdToken.waitForDeployment();

  const EvsdGovernorFactory = await hardhat.ethers.getContractFactory(
    "EvsdGovernor",
    deployer
  );
  const evsdGovernor = await EvsdGovernorFactory.deploy(
    evsdTokenArtifacts.address
  );
  await evsdGovernor.waitForDeployment();
  return {
    token: evsdToken as EvsdToken,
    governor: evsdGovernor as EvsdGovernor,
  };
}

async function delegateVoteToSelf(evsdToken: EvsdToken, voter: ethers.Signer) {
  await evsdToken.connect(voter).delegate(await voter.getAddress());
}

export async function delegateVotesToAllSigners() {
  const signers = await hardhat.ethers.getSigners();

  for (const signer of signers) {
    const token = EvsdToken__factory.connect(
      evsdTokenArtifacts.address,
      signer
    );
    token.delegate(await signer.getAddress());
    await delegateVoteToSelf(token, signer as unknown as ethers.Signer);
  }
}

export async function distributeVotingRights(
  deployer: ethers.Signer,
  evsdToken: EvsdToken,
  governor: EvsdGovernor,
  voters: AddressLike[]
) {
  const decimals = await evsdToken.decimals();
  const oneToken = ethers.parseUnits("1", decimals);
  // Send exactly one token to each voter
  for (const adr of voters) {
    await evsdToken.transfer(adr, oneToken);
  }

  // Send all remaining tokens to the governor contract
  const remainingTokens = await evsdToken.balanceOf(deployer);
  await evsdToken.transfer(await governor.getAddress(), remainingTokens);
}

describe("BlockchainProposalService integration", function () {
  let proposalService: BlockchainProposalService;

  beforeEach(async () => {
    const [owner, ...voters] = await hardhat.ethers.getSigners();
    const { token, governor } = await deployContracts(
      owner as unknown as ethers.Signer
    );
    await delegateVotesToAllSigners();
    await distributeVotingRights(
      owner as unknown as ethers.Signer,
      token,
      governor,
      voters
    );
    const fileService = new InMemoryProposalFileService();
    proposalService = new BlockchainProposalService(
      voters[0] as unknown as ethers.Signer,
      fileService,
      hardhat.ethers.provider
    );
  });

  it("should create a proposal on-chain", async () => {
    const voteItem: UIVotableItem = {
      title: "Test vote item title",
      description: "Test vote item description",
      UIOnlyId: "0",
    };
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [voteItem],
    };

    const proposalId = await proposalService.uploadProposal(generatedProposal);
    const fetchedProposal = await proposalService.getProposal(proposalId);

    expect(fetchedProposal).to.deep.equal(generatedProposal);
  });
});
