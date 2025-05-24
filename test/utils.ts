import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { ethers, AddressLike } from "ethers";
import hardhat, { network } from "hardhat";
import { EvsdToken, EvsdGovernor } from "../typechain-types";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import {
  UIVotableItem,
  UIAddVoterVotableItem,
  VotableItem,
  AddVoterVotableItem,
  IsUIAddVoterVotableItem,
  UIProposal,
  Proposal,
  User,
  VoteOption,
} from "../types/proposal";
import seedrandom from "seedrandom";
import { BlockchainProposalService } from "../lib/proposal-services/blockchain-proposal-service";
import { InMemoryProposalFileService } from "../lib/file-upload";
import { ProposalService } from "@/lib/proposal-services/proposal-service";
export const rng = seedrandom("42");
export interface TestInitData {
  registeredVoterProposalServices: BlockchainProposalService[];
  unregisteredVoterProposalServices: BlockchainProposalService[];
  addVoterVoteItem: UIAddVoterVotableItem;
  votingPeriod: number;
  evsdGovernor: EvsdGovernor;
  evsdToken: EvsdToken;
  unregisteredVoterAddress: string;
}

export async function deployContracts(deployer: ethers.Signer) {
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
export async function delegateVoteToSelf(
  evsdToken: EvsdToken,
  voter: ethers.Signer
) {
  await evsdToken.connect(voter).delegate(await voter.getAddress());
}
export async function delegateVotesToAllSigners(token: EvsdToken) {
  const signers = await hardhat.ethers.getSigners();

  for (const signer of signers) {
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
export async function deployAndCreateMocks(): Promise<TestInitData> {
  // Reset the network after each test
  await network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
  // Deploy the contracts and distribute tokens
  const [owner] = await hardhat.ethers.getSigners();
  const voters = await getEligibleVoters();
  const { token, governor } = await deployContracts(
    owner as unknown as ethers.Signer
  );
  const evsdGovernor = governor;
  const evsdToken = token;
  await distributeVotingRights(
    owner as unknown as ethers.Signer,
    token,
    governor,
    voters
  );

  await delegateVotesToAllSigners(token);

  // Create mock services
  const fileService = new InMemoryProposalFileService();
  const registeredVoterProposalServices = voters.map(
    (voter) =>
      new BlockchainProposalService(
        voter as unknown as ethers.Signer,
        fileService,
        hardhat.ethers.provider
      )
  );
  const unregisteredVoter = await getUnregisteredVoter();
  const unregisteredVoterProposalServices = [
    new BlockchainProposalService(
      unregisteredVoter as unknown as ethers.Signer,
      fileService,
      hardhat.ethers.provider
    ),
  ];
  const addVoterVoteItem = { newVoterAddress: unregisteredVoter.address };
  const votingPeriod = Number(await governor.votingPeriod());
  const initData: TestInitData = {
    registeredVoterProposalServices,
    unregisteredVoterProposalServices,
    addVoterVoteItem,
    votingPeriod,
    evsdGovernor,
    evsdToken,
    unregisteredVoterAddress: unregisteredVoter.address,
  };
  return initData;
}
export async function getEligibleVoters() {
  const [, , ...voters] = await hardhat.ethers.getSigners();

  return voters;
}
async function getUnregisteredVoter() {
  const [, unregisteredVoter] = await hardhat.ethers.getSigners();
  return unregisteredVoter;
}
export function getRandomVotes(n: number): VoteOption[] {
  const result: VoteOption[] = [];
  const voteOptions: VoteOption[] = ["for", "against", "abstain"];
  for (let i = 0; i < n; i++) {
    const index = Math.floor(rng() * voteOptions.length);
    result.push(voteOptions[index]);
  }
  return result;
}
export async function castVotes(
  proposalServices: ProposalService[],
  voteItem: VotableItem,
  votes: VoteOption[]
) {
  for (let i = 0; i < votes.length; i++) {
    const proposalService = proposalServices[i];
    await proposalService.voteForItem(voteItem, votes[i]);
  }
}
export async function fastForwardTime(
  days: number,
  hours: number,
  minutes: number
) {
  const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60;
  await network.provider.send("evm_increaseTime", [totalSeconds]);
  await network.provider.send("evm_mine");
}
export function assertVoteItemEqual(
  uiVoteItem: UIVotableItem | UIAddVoterVotableItem,
  voteItem: VotableItem | AddVoterVotableItem
) {
  if (IsUIAddVoterVotableItem(uiVoteItem)) {
    const addVoterVoteItem = voteItem as AddVoterVotableItem;
    expect(addVoterVoteItem.newVoterAddress).to.equal(
      uiVoteItem.newVoterAddress
    );
  } else {
    expect(uiVoteItem.title).to.equal(voteItem.title);
    expect(uiVoteItem.description).to.equal(voteItem.description);
  }
}
export function assertProposalEqual(
  uiProposal: UIProposal,
  proposal: Proposal
) {
  expect(uiProposal.voteItems.length).to.equal(proposal.voteItems.length);
  for (let i = 0; i < uiProposal.voteItems.length; i++) {
    assertVoteItemEqual(uiProposal.voteItems[i], proposal.voteItems[i]);
  }
  expect(uiProposal.title).to.equal(proposal.title);
  expect(uiProposal.description).to.equal(proposal.description);
}
export function assertVoterVoteRecordedCorrectly(
  voteItem: VotableItem,
  voter: User,
  vote?: VoteOption
) {
  if (vote) {
    expect(voteItem.userVotes.get(voter.address)?.vote).to.be.equal(vote);
  } else {
    expect(voteItem.userVotes).to.not.contain(voter);
  }
}
