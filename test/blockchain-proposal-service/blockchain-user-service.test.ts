import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { BlockchainProposalService } from "../../lib/proposal-services/blockchain/blockchain-proposal-service";
import { deployAndCreateMocks, fastForwardTime } from "../utils";
import { BlockchainUserService } from "@/lib/user-services/blockchain-user-service";
import { UIAddVoterVotableItem, UIProposal, User } from "@/types/proposal";

describe("BlockchainUserService", () => {
  let proposalService: BlockchainProposalService;
  let userService: BlockchainUserService;
  let addVoterProposal: UIProposal;
  let eligibleVoterProposalServices: BlockchainProposalService[];
  let newVoterVoteItem: UIAddVoterVotableItem;
  let newVoterService: BlockchainProposalService;

  beforeEach(async () => {
    const initData = await deployAndCreateMocks();
    proposalService = initData.eligibleVoterProposalServices[0];
    userService = initData.userService;
    addVoterProposal = {
      title: "Test add voter proposal",
      description: "Test add voter description",
      voteItems: [initData.addVoterVoteItem1],
    };
    eligibleVoterProposalServices = initData.eligibleVoterProposalServices;
    newVoterVoteItem = initData.addVoterVoteItem1;
    newVoterService = initData.ineligibleVoterProposalServices[0];
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
    const newVoterUser: User = {
      address: newVoterAddress,
      name: newVoterName,
    };
    await expect(
      newVoterService.canUserAcceptVotingRights(newVoterUser)
    ).to.become(true);
    await newVoterService.acceptVotingRights();

    // For some reason the ProposalExecuted event is not fired after the call to .acceptVotingRights so we force reload here
    // TODO: Investigate why this event is not fired and remove the forceReload option
    const newVoter = await userService.getUserForAddress(newVoterAddress, true);

    expect(newVoter?.address).to.eq(newVoterAddress);
    expect(newVoter?.name).to.eq(newVoterName);
  });
});
