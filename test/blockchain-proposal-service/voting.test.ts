import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { BlockchainProposalService } from "../../lib/proposal-services/blockchain-proposal-service";
import {
  UIAddVoterVotableItem,
  UIProposal,
  UIVotableItem,
  User,
  VoteOption,
} from "../../types/proposal";
import {
  IneligibleVoterError,
} from "../../lib/proposal-services/proposal-service-errors";
import {
  getVoteResultForItem,
} from "../../lib/utils";
import { assertVoterVoteRecordedCorrectly, castVotes, deployAndCreateMocks, fastForwardTime, getEligibleVoters, getRandomVotes, rng } from "../utils";
import { ProposalService } from "@/lib/proposal-services/proposal-service";


export const voteItems: UIVotableItem[] = [
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
  {
    title: "Тест наслов на ћирлици 2",
    description: "Тест опис на ћирилици",
    UIOnlyId: "3",
  },
];


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

describe("BlockchainProposalService integration", function () {
  let registeredVoterProposalServices: BlockchainProposalService[];
  let unregisteredVoterProposalServices: BlockchainProposalService[];
  let addVoterVoteItem: UIAddVoterVotableItem;
  let votingPeriod: number;
  let unregisteredVoterAddress: string;
  beforeEach(async () => {
    const initData = await deployAndCreateMocks();
    registeredVoterProposalServices = initData.registeredVoterProposalServices;
    unregisteredVoterProposalServices = initData.unregisteredVoterProposalServices;
    addVoterVoteItem = initData.addVoterVoteItem;
    votingPeriod = initData.votingPeriod;
    unregisteredVoterAddress = initData.unregisteredVoterAddress;
  });

  async function deployAndGetProposalOneVoteItem(proposer: BlockchainProposalService | undefined = undefined) {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [voteItems[0]],
    };
    if (!proposer) {
      proposer = registeredVoterProposalServices[0];
    }
    const proposalId =
      await proposer.uploadProposal(
        generatedProposal
      );
    const proposal =
      await proposer.getProposal(proposalId);
    return proposal;
  }
  async function deployAndGetProposalAddVoter() {
    const generatedProposal: UIProposal = {
      title: "Test proposal add voter",
      description: "Test proposal description",
      voteItems: [addVoterVoteItem],
    };
    const proposalId =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal
      );
    const proposal =
      await registeredVoterProposalServices[0].getProposal(proposalId);
    return proposal;
  }

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

    await expect(function () {
      unregisteredVoterProposalServices[0].voteForItem(
        proposal.voteItems[0],
        "for"
      );
    }
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
      await castVotes(registeredVoterProposalServices, voteItem, votes);

      const updatedProposal =
        await registeredVoterProposalServices[0].getProposal(proposal.id);
      for (let i = 0; i < numVoters; i++) {
        const voterAddress = voterAddresses[i];
        const user: User = {
          address: voterAddress,
          name: "Test user name",
        };
        assertVoterVoteRecordedCorrectly(updatedProposal.voteItems[voteItemIndex], user, votes[i]);
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
        assertVoterVoteRecordedCorrectly(updatedProposal.voteItems[voteItemIndex], user, votes[i]);
      }
    }
  });
  it("should update proposal state when everyone votes in favor and voting period is over", async () => {
    const proposal = await deployAndGetProposalOneVoteItem();
    const voteItem = proposal.voteItems[0];
    const numVoters = registeredVoterProposalServices.length;

    await castVotes(registeredVoterProposalServices, voteItem, getVotes(numVoters, 0, 0));
    await fastForwardTime(0, 0, votingPeriod + 10);
    const updatedProposal =
      await registeredVoterProposalServices[0].getProposal(proposal.id);
    const updatedVoteItem = updatedProposal.voteItems[0];

    expect(updatedProposal.status).to.equal("closed");
    expect(getVoteResultForItem(updatedVoteItem)).to.equal("passed");
  });
  it("should allow a new voter to vote after the proposal to add the voter has passed", async () => {
    const proposal = await deployAndGetProposalAddVoter();
    const voteItem = proposal.voteItems[0];
    const numVoters = registeredVoterProposalServices.length;
    await castVotes(registeredVoterProposalServices, voteItem, getVotes(numVoters, 0, 0));
    await fastForwardTime(0, 0, votingPeriod + 10);

    const newProposal = await deployAndGetProposalOneVoteItem();
    const newVoterProposalService = unregisteredVoterProposalServices[0];
    newVoterProposalService.voteForItem(newProposal.voteItems[0], "for");
    const newProposalUpdated = await newVoterProposalService.getProposal(newProposal.id);
    const newVoter: User = {
      address: unregisteredVoterAddress,
      name: "New voter"
    };
    assertVoterVoteRecordedCorrectly(newProposalUpdated.voteItems[0], newVoter, "for");
  });
  it("should allow a proposer to cancel the proposal 10 hours after creating and update the proposal state accordingly", async () => {
    // Take some proposer other than the first account
    const proposalService = registeredVoterProposalServices[12];
    const proposal = await deployAndGetProposalOneVoteItem(proposalService);

    await fastForwardTime(0, 10, 0);
    await expect(proposalService.cancelProposal(proposal)).to.eventually.equal(true);
  });
});
