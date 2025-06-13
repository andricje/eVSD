import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;
import {
  BlockchainProposalParser,
  isAddVoterVotableItemChainData,
  isProposalChainData,
  isVotableItemChainData,
  ProposalChainData,
  VotableItemChainData,
} from "../../lib/proposal-services/blockchain/blockchain-proposal-parser";
import { EvsdGovernor } from "../../typechain-types";
import { deployAndCreateMocks } from "../utils";
import { Proposal, UIProposal, UIVotableItem } from "@/types/proposal";

describe("BlockchainProposalParser", () => {
  let parser: BlockchainProposalParser;
  let governor: EvsdGovernor;
  beforeEach(async () => {
    const initData = await deployAndCreateMocks();
    governor = initData.evsdGovernor;
    parser = new BlockchainProposalParser(governor, initData.fileService);
  });
  it("Correctly parses old voteItem", () => {
    const serialized = `{"type":"voteItem","title":"Tačka","description":"opis","parentProposalId":"25315704052034162828107394350950734504221201779046180126766683394550105475975","index":0}`;
    const chainData = parser.deserializeChainData(serialized);
    expect(chainData.title).to.eq("Tačka");
    expect(chainData.description).to.eq("opis");
    expect(chainData.type).to.eq("voteItem");

    expect(isVotableItemChainData(chainData)).to.eq(true);
    expect(isAddVoterVotableItemChainData(chainData)).to.eq(false);
    expect(isProposalChainData(chainData)).to.eq(false);

    const voteItemChainData = chainData as VotableItemChainData;
    expect(voteItemChainData.index).to.eq(0);
    expect(voteItemChainData.parentProposalId).to.eq(
      25315704052034162828107394350950734504221201779046180126766683394550105475975n
    );
  });
  it("Correctly parses old proposal", () => {
    const serialized = `{"type":"proposal","title":"dsfs","description":"dfsdfdsf","fileHash":""}`;
    const chainData = parser.deserializeChainData(serialized);
    expect(chainData.title).to.eq("dsfs");
    expect(chainData.description).to.eq("dfsdfdsf");
    expect(chainData.type).to.eq("proposal");

    expect(isVotableItemChainData(chainData)).to.eq(false);
    expect(isAddVoterVotableItemChainData(chainData)).to.eq(false);
    expect(isProposalChainData(chainData)).to.eq(true);

    const voteItemChainData = chainData as ProposalChainData;
    expect(voteItemChainData.fileHash).to.eq("");
  });
  it("Correctly parses old addVoterVoteItem", () => {
    const serialized = `{"title":"Додавање Nepoznato као новог члана Е-ВСД","description":"Ово је предлог за додавање новог члана у састав Е-ВСД. Адреса члана је: 0x94fF003306b35746cf75496997f3f38058BBD772 (Nepoznato)","type":"addVoterVoteItem","parentProposalId":"86586622210884794226387089848406633984024428160492896951632127840152243531765","newVoterAddress":"0x94fF003306b35746cf75496997f3f38058BBD772","index":0}`;
    const chainData = parser.deserializeChainData(serialized);
    expect(chainData.title).to.eq("Додавање Nepoznato као новог члана Е-ВСД");
    expect(chainData.description).to.eq(
      "Ово је предлог за додавање новог члана у састав Е-ВСД. Адреса члана је: 0x94fF003306b35746cf75496997f3f38058BBD772 (Nepoznato)"
    );
    expect(chainData.type).to.eq("addVoterVoteItem");

    expect(isVotableItemChainData(chainData)).to.eq(false);
    expect(isAddVoterVotableItemChainData(chainData)).to.eq(true);
    expect(isProposalChainData(chainData)).to.eq(false);
  });
  it("Throws FileNotFound if an invalid fileHash is provided", () => {
    const uiVotableItem: UIVotableItem = {
      title: "Test votable item",
      description: "Test votable item description",
      UIOnlyId: "1",
    };
    const uiProposal: UIProposal = {
      title: "Test proposal",
      description: "Test proposal description",
      voteItems: [uiVotableItem],
    };
    const serialized = parser.serializeProposal(uiProposal);
    const deserializedData = parser.deserializeChainData(serialized);
    (deserializedData as ProposalChainData).fileHash = "123";
    parser.parseProposal(deserializedData);
  });
});
