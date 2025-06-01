import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { BlockchainProposalService } from "../../lib/proposal-services/blockchain-proposal-service";
import {
  DuplicateProposalError,
  IneligibleProposerError,
} from "../../types/proposal-service-errors";
import {
  UIAddVoterVotableItem,
  UIProposal,
  UIVotableItem,
} from "../../types/proposal";
import { assertProposalEqual, deployAndCreateMocks } from "../utils";
import { voteItems } from "./voting.test";
import { v4 as uuidv4 } from "uuid";
function getProposalLargeNumberOfVoteItems(numVoteItems: number): UIProposal {
  const items: UIVotableItem[] = [];
  for (let i = 0; i < numVoteItems; i++) {
    items.push({
      title: `Vote item ${i}`,
      description: `Test description ${uuidv4()}`,
      UIOnlyId: `${i}`,
    });
  }

  return {
    title: `Test proposal ${uuidv4()}`,
    description: "Test proposal description",
    voteItems: items,
  };
}

describe("BlockchainProposalService integration", function () {
  let registeredVoterProposalServices: BlockchainProposalService[];
  let unregisteredVoterProposalServices: BlockchainProposalService[];
  let addVoterVoteItem: UIAddVoterVotableItem;
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
  beforeEach(async () => {
    const initData = await deployAndCreateMocks();
    registeredVoterProposalServices = initData.registeredVoterProposalServices;
    unregisteredVoterProposalServices =
      initData.unregisteredVoterProposalServices;
    addVoterVoteItem = initData.addVoterVoteItem;
  });
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
  it("should preserve the order of vote items of a proposal", async () => {
    const generatedProposal1 = getProposalLargeNumberOfVoteItems(20);
    const generatedProposal2 = getProposalLargeNumberOfVoteItems(10);

    const proposalId1 =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal1
      );
    const proposalId2 =
      await registeredVoterProposalServices[0].uploadProposal(
        generatedProposal2
      );
    await assertProposalSameForEveryone(generatedProposal1, proposalId1);
    await assertProposalSameForEveryone(generatedProposal2, proposalId2);
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
  it("should throw an appropriate error when a duplicate proposal is submitted", async () => {
    const generatedProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: voteItems,
    };

    await registeredVoterProposalServices[0].uploadProposal(generatedProposal);

    await expect(
      registeredVoterProposalServices[0].uploadProposal(generatedProposal)
    ).to.be.rejectedWith(DuplicateProposalError);
  });
  it("should throw an appropriate error when a proposal with same title and description but different vote items is submitted", async () => {
    const proposal1: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [voteItems[0]],
    };

    const proposal2: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [voteItems[1]],
    };

    await registeredVoterProposalServices[0].uploadProposal(proposal1);
    await expect(
      registeredVoterProposalServices[1].uploadProposal(proposal2)
    ).to.be.rejectedWith(DuplicateProposalError);
  });
});
