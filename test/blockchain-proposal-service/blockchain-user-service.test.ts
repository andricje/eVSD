import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { BlockchainProposalService } from "../../lib/proposal-services/blockchain/blockchain-proposal-service";
import { deployAndCreateMocks, fastForwardTime } from "../utils";
import { BlockchainUserService } from "@/lib/user-services/blockchain-user-service";
import { UIAddVoterVotableItem, UIProposal } from "@/types/proposal";

describe("BlockchainUserService", () => {
  let proposalService: BlockchainProposalService;
  let userService: BlockchainUserService;
  let addVoterProposal: UIProposal;
  let eligibleVoterProposalServices: BlockchainProposalService[];
  let newVoterVoteItem: UIAddVoterVotableItem;

  beforeEach(async () => {
    const initData = await deployAndCreateMocks();
    proposalService = initData.eligibleVoterProposalServices[0];
    userService = initData.userService;
    addVoterProposal = {
      title: "Test add voter proposal",
      description: "Test add voter description",
      voteItems: [initData.addVoterVoteItem],
    };
    eligibleVoterProposalServices = initData.eligibleVoterProposalServices;
    newVoterVoteItem = initData.addVoterVoteItem;
  });
  it("After a vote passes to add a new voter the service should show the correct name for the voter", async () => {
    const proposalId = await proposalService.uploadProposal(addVoterProposal);
    const proposal = await proposalService.getProposal(proposalId);
    const castVotePromises = eligibleVoterProposalServices.map(
      (proposalService) =>
        proposalService.voteForItem(proposal.voteItems[0], "for")
    );
    await Promise.all(castVotePromises);
    await fastForwardTime(7, 0, 0);
    const newVoterAddress = newVoterVoteItem.newVoterAddress;
    const newVoterName = newVoterVoteItem.newVoterName;
    const newVoter = await userService.getUserForAddress(newVoterAddress);

    expect(newVoter?.address).to.eq(newVoterAddress);
    expect(newVoter?.name).to.eq(newVoterName);
  });
});
