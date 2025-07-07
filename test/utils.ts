import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { ethers } from "ethers";
import hardhat, { network } from "hardhat";
import { EvsdToken, EvsdGovernor } from "../typechain-types";
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
import { BlockchainProposalService } from "../lib/proposal-services/blockchain/blockchain-proposal-service";
import {
  InMemoryProposalFileService,
  ProposalFileService,
} from "../lib/file-upload";
import { ProposalService } from "../lib/proposal-services/proposal-service";
import { BlockchainUserService } from "../lib/user-services/blockchain-user-service";
import { deployEvsd } from "../lib/deployment";
export const rng = seedrandom("42");
export interface TestInitData {
  eligibleVoterProposalServices: BlockchainProposalService[];
  ineligibleVoterProposalServices: BlockchainProposalService[];
  addVoterVoteItem1: UIAddVoterVotableItem;
  addVoterVoteItem2: UIAddVoterVotableItem;
  votingPeriod: number;
  evsdGovernor: EvsdGovernor;
  evsdToken: EvsdToken;
  eligibleSigners: ethers.Signer[];
  eligibleVoters: User[];
  ineligibleVoterAddress: string;
  fileService: ProposalFileService;
  userService: BlockchainUserService;
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
export async function deployAndCreateMocks(): Promise<TestInitData> {
  // Reset the network after each test
  await network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
  const [owner] = await hardhat.ethers.getSigners();
  // Deploy the contracts and distribute tokens
  const voters = await getEligibleVoters();
  const { token, governor } = await deployEvsd(
    voters.map((voter) => voter.address)
  );

  await delegateVotesToAllSigners(token);

  // Create mock services
  const fileService = new InMemoryProposalFileService();
  const userService = new BlockchainUserService(
    [],
    governor,
    owner as unknown as ethers.Signer
  );
  const registeredVoterProposalServices = voters.map(
    (voter) =>
      new BlockchainProposalService(
        governor,
        token,
        voter as unknown as ethers.Signer,
        fileService,
        userService,
        hardhat.ethers.provider
      )
  );
  const unregisteredVoters = await getUnregisteredVoters();
  const unregisteredVoterProposalServices = unregisteredVoters.map(
    (unregisteredVoter) =>
      new BlockchainProposalService(
        governor,
        token,
        unregisteredVoter as unknown as ethers.Signer,
        fileService,
        userService,
        hardhat.ethers.provider
      )
  );
  const addVoterVoteItem1: UIAddVoterVotableItem = {
    newVoterAddress: unregisteredVoters[0].address,
    newVoterName: "New voter 1",
  };
  const addVoterVoteItem2: UIAddVoterVotableItem = {
    newVoterAddress: unregisteredVoters[1].address,
    newVoterName: "New voter 2",
  };
  const votingPeriod = Number(await governor.votingPeriod());
  const initData: TestInitData = {
    eligibleVoterProposalServices: registeredVoterProposalServices,
    ineligibleVoterProposalServices: unregisteredVoterProposalServices,
    addVoterVoteItem1: addVoterVoteItem1,
    addVoterVoteItem2: addVoterVoteItem2,
    votingPeriod,
    evsdGovernor: governor,
    evsdToken: token,
    eligibleSigners: voters.map((voter) => voter as unknown as ethers.Signer),
    ineligibleVoterAddress: unregisteredVoter.address,
    eligibleVoters: voters.map((voter) => {
      return { name: voter.address, address: voter.address };
    }),
    fileService,
    userService,
  };
  return initData;
}
export async function getEligibleVoters() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, unregisteredVoter1, unregisteredVoter2, ...voters] =
    await hardhat.ethers.getSigners();

  return voters;
}
async function getUnregisteredVoters() {
  const [, unregisteredVoter1, unregisteredVoter2] =
    await hardhat.ethers.getSigners();
  return [unregisteredVoter1, unregisteredVoter2];
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
