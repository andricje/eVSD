import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { BlockchainProposalService } from "../lib/proposal-services/blockchain-proposal-service";
import { InMemoryProposalFileService } from "../lib/file-upload";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import {
  AddVoterVotableItem,
  IsUIAddVoterVotableItem,
  Proposal,
  UIAddVoterVotableItem,
  UIProposal,
  UIVotableItem,
  User,
  VotableItem,
  VoteOption,
} from "../types/proposal";
import hardhat, { network } from "hardhat";
import { AddressLike, ethers } from "ethers";
import {
  EvsdGovernor,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";
import {
  IneligibleProposerError,
  IneligibleVoterError,
} from "../lib/proposal-services/proposal-service-errors";
import seedrandom from "seedrandom";
import {
  countTotalVotes,
  getVoteResult,
  getVoteResultForItem,
} from "../lib/utils";
import { bigint } from "zod";

const rng = seedrandom("42");

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

async function delegateVotesToAllSigners(token: EvsdToken) {
  const signers = await hardhat.ethers.getSigners();

  for (const signer of signers) {
    await delegateVoteToSelf(token, signer as unknown as ethers.Signer);
  }
}

async function distributeVotingRights(
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

const voteItems: UIVotableItem[] = [
  {
    title: "Test vote item title 1",
    description: "Test vote item description 1",
    UIOnlyId: "0",
  },
  {
    title: "Test vote item title 2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus non est eget mauris dignissim euismod non quis purus. Donec egestas sapien in felis tincidunt pellentesque. Morbi eu consectetur tellus, eu pellentesque nibh. Aliquam risus tortor, laoreet sed massa et, lobortis condimentum orci. Morbi posuere pellentesque sem, id pretium erat tincidunt sit amet. Ut ornare mattis faucibus. Sed felis sem, consectetur ac erat ut, viverra bibendum urna. Maecenas posuere, nulla quis luctus consectetur, massa nibh dignissim diam, in rutrum dolor metus blandit mi. Nam iaculis tortor non turpis sodales, sit amet placerat libero fringilla. Integer eu ultrices neque. Etiam aliquam rhoncus massa sit amet dignissim. Donec facilisis id tortor a placerat. Duis sodales massa a rhoncus gravida. Sed sit amet varius turpis.",
    UIOnlyId: "1",
  },
  {
    title: "Тест наслов на ћирлици",
    description: "Тест опис на ћирилици",
    UIOnlyId: "2",
  },
];

async function getEligibleVoters() {
  const [deployer, unregisteredVoter, ...voters] =
    await hardhat.ethers.getSigners();

  return voters;
}
async function getUnregisteredVoter() {
  const [deployer, unregisteredVoter, ...voters] =
    await hardhat.ethers.getSigners();
  return unregisteredVoter;
}

function assertVoteItemEqual(
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

function getRandomVotes(n: number): VoteOption[] {
  const result: VoteOption[] = [];
  const voteOptions: VoteOption[] = ["for", "against", "abstain"];
  for (let i = 0; i < n; i++) {
    const index = Math.floor(rng() * voteOptions.length);
    result.push(voteOptions[index]);
  }
  return result;
}

function getVotes(numFor: number, numAgainst: number, numAbstain: number) {
  const result: VoteOption[] = [];
  for (let i = 0; i < numFor; i++) {
    result.push("for");
  }
  for (let i = 0; i < numAgainst; i++) {
    result.push("against");
  }
  for (let i = 0; i < numAbstain; i++) {
    result.push("abstain");
  }
  return result;
}

function assertProposalEqual(uiProposal: UIProposal, proposal: Proposal) {
  expect(uiProposal.voteItems.length).to.equal(proposal.voteItems.length);
  for (let i = 0; i < uiProposal.voteItems.length; i++) {
    assertVoteItemEqual(uiProposal.voteItems[i], proposal.voteItems[i]);
  }
  expect(uiProposal.title).to.equal(proposal.title);
  expect(uiProposal.description).to.equal(proposal.description);
}

describe("BlockchainProposalService integration", function () {
  let registeredVoterProposalServices: BlockchainProposalService[];
  let unregisteredVoterProposalServices: BlockchainProposalService[];
  let addVoterVoteItem: UIAddVoterVotableItem;
  let votingPeriod: number;
  let evsdGovernor: EvsdGovernor;
  let evsdToken: EvsdToken;
  beforeEach(async () => {
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
    const governorAddr = await governor.getAddress();
    evsdGovernor = governor;
    evsdToken = token;
    await distributeVotingRights(
      owner as unknown as ethers.Signer,
      token,
      governor,
      voters
    );

    await delegateVotesToAllSigners(token);

    const fileService = new InMemoryProposalFileService();
    registeredVoterProposalServices = voters.map(
      (voter) =>
        new BlockchainProposalService(
          voter as unknown as ethers.Signer,
          fileService,
          hardhat.ethers.provider
        )
    );
    const unregisteredVoter = await getUnregisteredVoter();
    unregisteredVoterProposalServices = [
      new BlockchainProposalService(
        unregisteredVoter as unknown as ethers.Signer,
        fileService,
        hardhat.ethers.provider
      ),
    ];
    addVoterVoteItem = { newVoterAddress: unregisteredVoter.address };
    votingPeriod = Number(await governor.votingPeriod());
  });

  async function assertProposalSameForEveryone(
    uiProposal: UIProposal,
    proposalId: bigint
  ) {
    for (const proposalService of registeredVoterProposalServices) {
      const fetchedProposal = await proposalService.getProposal(proposalId);
      assertProposalEqual(uiProposal, fetchedProposal);
    }
    for (const proposalService of unregisteredVoterProposalServices) {
      const fetchedProposal = await proposalService.getProposal(proposalId);
      assertProposalEqual(uiProposal, fetchedProposal);
    }
  }

  async function deployAndGetProposalOneVoteItem() {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [voteItems[0]],
    };
    const proposalId =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal
      );
    const proposal =
      await registeredVoterProposalServices[0].getProposal(proposalId);
    return proposal;
  }
  async function castVotes(voteItem: VotableItem, votes: VoteOption[]) {
    for (let i = 0; i < votes.length; i++) {
      const proposalService = registeredVoterProposalServices[i];
      await proposalService.voteForItem(voteItem, votes[i]);
    }
  }
  async function fastForwardTime(days: number, hours: number, minutes: number) {
    const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60;
    await network.provider.send("evm_increaseTime", [totalSeconds]);
    await network.provider.send("evm_mine");
  }

  it("should create a proposal on-chain with correct title and description when there is only one simple vote item and fetch it", async () => {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [voteItems[0]],
    };

    const proposalId =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal
      );

    await assertProposalSameForEveryone(generatedProposal, proposalId);
  });
  it("should create a proposal on-chain with correct title and description when there are multiple vote items and fetch it", async () => {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: voteItems,
    };

    const proposalId =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal
      );
    await assertProposalSameForEveryone(generatedProposal, proposalId);
  });
  it("should create a proposal on-chain with correct title and description when there is a vote item to add a voter and fetch it", async () => {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [addVoterVoteItem],
    };

    const proposalId =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal
      );
    await assertProposalSameForEveryone(generatedProposal, proposalId);
  });
  it("should throw an appropriate error when an ineligible proposer tries to create a proposal", async () => {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: voteItems,
    };

    await expect(
      unregisteredVoterProposalServices[0].uploadProposal(generatedProposal)
    ).to.be.rejectedWith(IneligibleProposerError);
  });
  it("should throw an appropriate error when an ineligible voter tries to vote", async () => {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: voteItems,
    };

    const proposalId =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal
      );
    const proposal =
      await unregisteredVoterProposalServices[0].getProposal(proposalId);

    await expect(
      unregisteredVoterProposalServices[0].voteForItem(
        proposal.voteItems[0],
        "for"
      )
    ).to.be.rejectedWith(IneligibleVoterError);
  });
  it("should correctly record the votes for all addresses when everyone has voted", async () => {
    const proposal = await deployAndGetProposalOneVoteItem();
    const voterAddresses = (await getEligibleVoters()).map(
      (signer) => signer.address
    );
    for (
      let voteItemIndex = 0;
      voteItemIndex < proposal.voteItems.length;
      voteItemIndex++
    ) {
      const voteItem = proposal.voteItems[voteItemIndex];
      const numVoters = registeredVoterProposalServices.length;
      const votes = getRandomVotes(numVoters);
      await castVotes(voteItem, votes);

      const updatedProposal =
        await registeredVoterProposalServices[0].getProposal(proposal.id);
      for (let i = 0; i < numVoters; i++) {
        const voterAddress = voterAddresses[i];
        const user: User = {
          address: voterAddress,
          name: "Test user name",
        };
        expect(
          updatedProposal.voteItems[voteItemIndex].userVotes.get(user)
        ).to.be.equal(votes[i]);
      }
    }
  });
  it("should correctly record the votes for all addresses when not everyone has voted", async () => {
    const proposal = await deployAndGetProposalOneVoteItem();
    const voterAddresses = (await getEligibleVoters()).map(
      (signer) => signer.address
    );
    for (
      let voteItemIndex = 0;
      voteItemIndex < proposal.voteItems.length;
      voteItemIndex++
    ) {
      const voteItem = proposal.voteItems[voteItemIndex];
      const numVoters = registeredVoterProposalServices.length;
      const votes = getRandomVotes(numVoters).map((vote) => {
        const shouldVote = !!Math.floor(rng() * 2);
        if (shouldVote) {
          return vote;
        }
        return undefined;
      });
      for (let i = 0; i < numVoters; i++) {
        const vote = votes[i];
        if (vote) {
          const proposalService = registeredVoterProposalServices[i];
          await proposalService.voteForItem(voteItem, vote);
        }
      }
      const updatedProposal =
        await registeredVoterProposalServices[0].getProposal(proposal.id);
      for (let i = 0; i < numVoters; i++) {
        const voterAddress = voterAddresses[i];
        const user: User = {
          address: voterAddress,
          name: "Test user name",
        };
        const vote = votes[i];
        if (vote) {
          expect(
            updatedProposal.voteItems[voteItemIndex].userVotes.get(user)
          ).to.be.equal(votes[i]);
        } else {
          expect(
            updatedProposal.voteItems[voteItemIndex].userVotes
          ).to.not.contain(user);
        }
      }
    }
  });
  it("should update proposal state when everyone votes in favor and voting period is over", async () => {
    const proposal = await deployAndGetProposalOneVoteItem();
    const voteItem = proposal.voteItems[0];
    const numVoters = registeredVoterProposalServices.length;

    await castVotes(voteItem, getVotes(numVoters, 0, 0));
    await fastForwardTime(0, 0, votingPeriod + 10);
    const updatedProposal =
      await registeredVoterProposalServices[0].getProposal(proposal.id);
    const updatedVoteItem = updatedProposal.voteItems[0];

    expect(updatedProposal.status).to.equal("closed");
    expect(getVoteResultForItem(updatedVoteItem)).to.equal("passed");
  });
});
