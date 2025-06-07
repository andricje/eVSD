import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { BlockchainProposalService } from "../../lib/proposal-services/blockchain-proposal-service";
import { UIAddVoterVotableItem, UIProposal } from "../../types/proposal";
import { deployAndCreateMocks, fastForwardTime } from "../utils";
import { voteItems } from "./voting.test";

describe("BlockchainProposalService integration", function () {
  describe("canCurrentUserAcceptVotingRights", function () {
    let registeredVoterProposalServices: BlockchainProposalService[];
    let unregisteredVoterProposalServices: BlockchainProposalService[];
    let addVoterVoteItem: UIAddVoterVotableItem;

    beforeEach(async () => {
      const initData = await deployAndCreateMocks();
      registeredVoterProposalServices =
        initData.registeredVoterProposalServices;
      unregisteredVoterProposalServices =
        initData.unregisteredVoterProposalServices;
      addVoterVoteItem = initData.addVoterVoteItem;
    });
    it("should return false if there is no proposal to add the user", async () => {
      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [voteItems[0]],
      };

      const canAccept =
        await unregisteredVoterProposalServices[0].canCurrentUserAcceptVotingRights();
      expect(canAccept).to.equal(false);
    });
    it("should return false if there is a proposal to add the user but it has not passed yet", async () => {
      const generatedProposal: UIProposal = {
        title: "Test proposal",
        description: "Test proposal description",
        voteItems: [addVoterVoteItem],
      };

      const canAccept =
        await unregisteredVoterProposalServices[0].canCurrentUserAcceptVotingRights();
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
        await unregisteredVoterProposalServices[0].canCurrentUserAcceptVotingRights();
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
        await unregisteredVoterProposalServices[0].canCurrentUserAcceptVotingRights();
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
        await unregisteredVoterProposalServices[0].canCurrentUserAcceptVotingRights();
      expect(canAccept).to.equal(true);
    });
  });
});
