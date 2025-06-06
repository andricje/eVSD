import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { BlockchainProposalService } from "../../lib/proposal-services/blockchain-proposal-service";
import {
  IsUserActivityVote,
  UIAddVoterVotableItem,
  UIProposal,
  UserActivityEventProposal,
} from "../../types/proposal";
import { deployAndCreateMocks, fastForwardTime } from "../utils";
import { voteItems } from "./voting.test";
import { areProposalsEqual } from "../../lib/utils";

describe("BlockchainProposalService integration", function () {
  describe("getAllUserActivity", function () {
    let registeredVoterProposalServices: BlockchainProposalService[];
    let registeredVoterAddresses: string[];
    let unregisteredVoterProposalServices: BlockchainProposalService[];
    let addVoterVoteItem: UIAddVoterVotableItem;

    beforeEach(async () => {
      const initData = await deployAndCreateMocks();
      registeredVoterProposalServices =
        initData.registeredVoterProposalServices;
      unregisteredVoterProposalServices =
        initData.unregisteredVoterProposalServices;
      addVoterVoteItem = initData.addVoterVoteItem;
      registeredVoterAddresses = initData.registeredVoterAddresses;
    });
    it("should not show other users' activity", async () => {
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
      await registeredVoterProposalServices[0].voteForItem(
        proposal.voteItems[0],
        "for"
      );

      const activity =
        await registeredVoterProposalServices[1].getAllUserActivity();

      expect(activity.length).to.equal(0);
    });
    it("should show that the current user created a proposal and voted", async () => {
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
      await registeredVoterProposalServices[0].voteForItem(
        proposal.voteItems[0],
        "for"
      );

      const activity =
        await registeredVoterProposalServices[0].getAllUserActivity();

      const voteAcitivty = activity.filter((x) => IsUserActivityVote(x));
      const proposalActivity = activity
        .filter((x) => !IsUserActivityVote(x))
        .map((x) => x as UserActivityEventProposal);

      expect(voteAcitivty.length).to.equal(1);
      expect(voteAcitivty[0].voteItem.id).to.equal(proposal.voteItems[0].id);
      expect(voteAcitivty[0].voteEvent.vote).to.equal("for");
      expect(voteAcitivty[0].voteEvent.voter.address).to.equal(
        registeredVoterAddresses[0]
      );

      expect(proposalActivity.length).to.equal(1);
      expect(
        await areProposalsEqual(generatedProposal, proposalActivity[0].proposal)
      ).to.be.true;
      expect(proposalActivity[0].type).to.equal("Create");
    });
  });
});
