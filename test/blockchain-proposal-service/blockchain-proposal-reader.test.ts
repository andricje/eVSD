import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import { ProposalChainData } from "../../lib/proposal-services/blockchain/blockchain-proposal-parser";
import { BlockchainProposalService } from "../../lib/proposal-services/blockchain/blockchain-proposal-service";
import { EvsdGovernor } from "../../typechain-types";
import { getDummyUIProposal } from "../dummy-objects";
import { assertProposalEqual, deployAndCreateMocks } from "../utils";

describe("BlockchainProposalReader", () => {
  let governor: EvsdGovernor;

  let proposalService: BlockchainProposalService;

  beforeEach(async () => {
    const initData = await deployAndCreateMocks();
    proposalService = initData.eligibleVoterProposalServices[0];
    const eligibleSigner = initData.eligibleSigners[0];
    governor = initData.evsdGovernor.connect(eligibleSigner);
  });
  it("Should correctly read other proposals even if one fails due to a missing file", async () => {
    const uiProposal1 = getDummyUIProposal("1");
    await proposalService.uploadProposal(uiProposal1);

    // Manually create an invalid proposal and call governor propose
    const serializationData: ProposalChainData = {
      type: "proposal",
      title: "Broken file hash proposal",
      description: "Broken file hash proposal description",
      fileHash: "123",
    };
    const serializedString = JSON.stringify(serializationData);
    const governorAddress = await governor.getAddress();
    const doNothingCalldata =
      governor.interface.encodeFunctionData("doNothing");
    await governor.propose(
      [governorAddress],
      [0],
      [doNothingCalldata],
      serializedString
    );

    const proposals = await proposalService.getProposals();
    expect(proposals.length).to.eq(1);
    assertProposalEqual(uiProposal1, proposals[0]);
  });
});
