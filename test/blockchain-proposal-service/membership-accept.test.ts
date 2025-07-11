import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { UIAddVoterVotableItem, UIProposal, User } from "../../types/proposal";
import { deployAndCreateMocks, fastForwardTime } from "../utils";
import { BlockchainProposalService } from "@/lib/proposal-services/blockchain/blockchain-proposal-service";

describe("BlockchainProposalService integration", function () {
  describe("canCurrentUserAcceptVotingRights", function () {
    let registeredVoterProposalServices: BlockchainProposalService[];
    let ineligibleVoterProposalServices: BlockchainProposalService[];
    let ineligibleVoter: User;
    let addVoterVoteItem: UIAddVoterVotableItem;

    beforeEach(async () => {
      const initData = await deployAndCreateMocks();
      registeredVoterProposalServices = initData.eligibleVoterProposalServices;
      ineligibleVoterProposalServices =
        initData.ineligibleVoterProposalServices;
      addVoterVoteItem = initData.addVoterVoteItem1;
      ineligibleVoter = {
        address: initData.ineligibleVoterAddress,
        name: "Ineligible voter",
      };
    });
    it("should return false if there is no proposal to add the user", async () => {
      const canAccept =
        await ineligibleVoterProposalServices[0].canUserAcceptVotingRights(
          ineligibleVoter
        );
      expect(canAccept).to.equal(false);
    });
    it("should return false if there is a proposal to add the user but it has not passed yet", async () => {
      const canAccept =
        await ineligibleVoterProposalServices[0].canUserAcceptVotingRights(
          ineligibleVoter
        );
      expect(canAccept).to.equal(false);
    });
    it("should return false if there is a proposal to add the user but it has failed", async () => {
      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [addVoterVoteItem],
      };

      const proposalId =
        await registeredVoterProposalServices[0].uploadProposal(
          generatedProposal
        );

      const voteItem = (
        await registeredVoterProposalServices[0].getProposal(proposalId)
      ).voteItems[0];
      // Everyone votes against
      for (const proposalService of registeredVoterProposalServices) {
        await proposalService.voteForItem(voteItem, "against");
      }
      await fastForwardTime(7, 0, 0);

      const canAccept =
        await ineligibleVoterProposalServices[0].canUserAcceptVotingRights(
          ineligibleVoter
        );
      expect(canAccept).to.equal(false);
    });
    it("should return true if there is a proposal to add the user and it has passed", async () => {
      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [addVoterVoteItem],
      };

      const proposalId =
        await registeredVoterProposalServices[0].uploadProposal(
          generatedProposal
        );

      const voteItem = (
        await registeredVoterProposalServices[0].getProposal(proposalId)
      ).voteItems[0];
      // Everyone votes in favor
      for (const proposalService of registeredVoterProposalServices) {
        await proposalService.voteForItem(voteItem, "for");
      }
      await fastForwardTime(7, 0, 0);

      const canAccept =
        await ineligibleVoterProposalServices[0].canUserAcceptVotingRights(
          ineligibleVoter
        );
      expect(canAccept).to.equal(true);
    });
    it("should return true if there is a proposal to add the user and it has passed even if there are other malformed proposals", async () => {
      const malformedProposal: UIProposal = {
        title: "Malformed proposal",
        description: "Test proposal description",
        voteItems: [],
      };
      await registeredVoterProposalServices[0].uploadProposal(
        malformedProposal
      );

      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [addVoterVoteItem],
      };

      const proposalId =
        await registeredVoterProposalServices[0].uploadProposal(
          generatedProposal
        );

      const voteItem = (
        await registeredVoterProposalServices[0].getProposal(proposalId)
      ).voteItems[0];
      // Everyone votes in favor
      for (const proposalService of registeredVoterProposalServices) {
        await proposalService.voteForItem(voteItem, "for");
      }
      await fastForwardTime(7, 0, 0);

      const canAccept =
        await ineligibleVoterProposalServices[0].canUserAcceptVotingRights(
          ineligibleVoter
        );
      expect(canAccept).to.equal(true);
    });
  });
});
