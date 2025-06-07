import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import {
  IsUserActivityVote,
  UIProposal,
  User,
  UserActivityEventProposal,
} from "../../types/proposal";
import { deployAndCreateMocks } from "../utils";
import { voteItems } from "./voting.test";
import { areProposalsEqual } from "../../lib/utils";
import { BlockchainProposalService } from "@/lib/proposal-services/blockchain/blockchain-proposal-service";

describe("BlockchainProposalService integration", function () {
  describe("getAllUserActivity", function () {
    let eligibleVoterProposalServices: BlockchainProposalService[];
    let eligibleVoters: User[];

    beforeEach(async () => {
      const initData = await deployAndCreateMocks();
      eligibleVoterProposalServices = initData.eligibleVoterProposalServices;
      eligibleVoters = initData.eligibleVoters;
    });
    it("should not show other users' activity (create and vote)", async () => {
      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [voteItems[0]],
      };
      const proposalId =
        await eligibleVoterProposalServices[0].uploadProposal(
          generatedProposal
        );
      const proposal =
        await eligibleVoterProposalServices[0].getProposal(proposalId);
      await eligibleVoterProposalServices[0].voteForItem(
        proposal.voteItems[0],
        "for"
      );

      const activity =
        await eligibleVoterProposalServices[1].getAllUserActivity(
          eligibleVoters[1]
        );

      expect(activity.length).to.equal(0);
    });
    it("should not show other users' activity (create and cancel)", async () => {
      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [voteItems[0]],
      };
      const proposalId =
        await eligibleVoterProposalServices[0].uploadProposal(
          generatedProposal
        );
      const proposal =
        await eligibleVoterProposalServices[0].getProposal(proposalId);
      await eligibleVoterProposalServices[0].cancelProposal(proposal);

      const activity =
        await eligibleVoterProposalServices[1].getAllUserActivity(
          eligibleVoters[1]
        );

      expect(activity.length).to.equal(0);
    });
    it("should show that the current user created a proposal and voted", async () => {
      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [voteItems[0]],
      };
      const proposalId =
        await eligibleVoterProposalServices[0].uploadProposal(
          generatedProposal
        );
      const proposal =
        await eligibleVoterProposalServices[0].getProposal(proposalId);
      await eligibleVoterProposalServices[0].voteForItem(
        proposal.voteItems[0],
        "for"
      );

      const activity =
        await eligibleVoterProposalServices[0].getAllUserActivity(
          eligibleVoters[0]
        );

      const voteAcitivty = activity.filter((x) => IsUserActivityVote(x));
      const proposalActivity = activity
        .filter((x) => !IsUserActivityVote(x))
        .map((x) => x as UserActivityEventProposal);

      expect(voteAcitivty.length).to.equal(1);
      expect(voteAcitivty[0].voteItem.id).to.equal(proposal.voteItems[0].id);
      expect(voteAcitivty[0].voteEvent.vote).to.equal("for");
      expect(voteAcitivty[0].voteEvent.voter.address).to.equal(
        eligibleVoters[0].address
      );

      expect(proposalActivity.length).to.equal(1);
      const proposalsEqual = await areProposalsEqual(
        generatedProposal,
        proposalActivity[0].proposal
      );
      expect(proposalsEqual).to.equal(true);
      expect(proposalActivity[0].type).to.equal("Create");
    });
  });
});
