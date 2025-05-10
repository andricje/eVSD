import { addressNameMap } from "@/lib/address-name-map";
import { getDeployedContracts, castVote } from "@/lib/blockchain-utils";
import { ProposalFileService } from "@/lib/file-upload";
import { convertAddressToName, governorVoteMap } from "@/lib/utils";
import { EvsdGovernor, EvsdToken } from "@/typechain-types";
import { ethers } from "ethers";

export interface ProposalService {
  getProposals: () => Promise<Proposal[]>;
  uploadProposal: (proposal: Proposal) => Promise<bigint>;
  getProposal: (id: bigint) => Promise<Proposal>;
  voteForItem: (item: VotableItem, vote: VoteOption) => Promise<void>;
}

class BlockchainProposalService implements ProposalService {
  private readonly governor: EvsdGovernor;
  private readonly token: EvsdToken;
  private readonly signer: ethers.Signer;
  private readonly fileService: ProposalFileService;

  constructor(
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    fileService: ProposalFileService
  ) {
    const contracts = getDeployedContracts(signer);
    this.governor = contracts.governor;
    this.token = contracts.token;
    this.signer = signer;
    this.fileService = fileService;
  }

  async getProposal(id: bigint): Promise<Proposal> {
    const allProposals = await this.getProposals();
    const proposal = allProposals.find((proposal) => proposal.id === id);
    if (!proposal) {
      throw new Error("Invalid proposal id");
    }
    return proposal;
  }

  async getProposals(): Promise<Proposal[]> {
    const proposalCreatedFilter = this.governor.filters.ProposalCreated();
    const events = await this.governor.queryFilter(
      proposalCreatedFilter,
      0,
      "latest"
    );
    const decimals = await this.token.decimals();
    const oneToken = ethers.parseUnits("1", decimals);

    const proposals: Proposal[] = [];
    const voteItemsForProposalId: Record<string, VotableItem[]> = {};

    // First process all events - parse either a VotableItem or a Proposal
    for (const event of events) {
      const proposalId = event.args.proposalId;
      const proposalState = await this.governor.state(proposalId);
      const countedVotes = await this.governor.proposalVotes(
        event.args.proposalId
      );
      const allVotes = await this.getVotesForProposal(proposalId);
      const deadline = await this.governor.proposalDeadline(proposalId);
      const closesAt = new Date(Number(deadline) * 1000);
      const voteStart = new Date(Number(event.args.voteStart) * 1000);

      // All serializable data is stored as a json string inside the proposal description
      const deserializedData = this.deserializeChainData(
        event.args.description
      );
      if (deserializedData.type === "proposal") {
        // Create a proposal with an empty itemsToVote array - it will be filled after all of the VotableItems arrive
        const proposalData = deserializedData as ProposalSerializationData;
        const proposal = {
          id: BigInt(proposalId),
          title: proposalData.title,
          description: proposalData.description,
          file: await this.fileService.fetch(proposalData.fileHash),
          dateAdded: voteStart,
          status: "open",
          closesAt: closesAt,
          itemsToVote: [],
        } as Proposal;
        proposals.push(proposal);
      } else {
        // Create a VotableItem
        // Note that the code below removes decimals from the counted votes and therefore will not work properly if we allow decimal votes in the future
        const voteItemData = deserializedData as VotableItemSerializationData;
        const votableItem = {
          id: BigInt(proposalId),
          title: voteItemData.title,
          description: voteItemData.description,
          author: convertAddressToName(event.args.proposer),
          votesFor: Number(countedVotes.forVotes / oneToken),
          votesAgainst: Number(countedVotes.againstVotes / oneToken),
          votesAbstain: Number(countedVotes.abstainVotes / oneToken),
          status: "open",
          votesForAddress: allVotes,
        } as VotableItem;
        // Add to the map
        if (!voteItemsForProposalId[voteItemData.parentProposalId]) {
          voteItemsForProposalId[voteItemData.parentProposalId] = [];
        }
        voteItemsForProposalId[voteItemData.parentProposalId].push(votableItem);
      }
    }
    // Pair child VoteItems with Proposals
    for (const proposal of proposals) {
      const proposalId = proposal.id.toString();
      proposal.itemsToVote =
        proposalId in voteItemsForProposalId
          ? voteItemsForProposalId[proposalId]
          : [];
    }
    return proposals;
  }
  deserializeChainData(data: string): SerializationData {
    return JSON.parse(data) as SerializationData;
  }

  private async getVotesForProposal(
    proposalId: bigint
  ): Promise<Record<string, VoteOption>> {
    const votes: Record<string, VoteOption> = {};
    const filter = this.governor.filters.VoteCast();
    const events = await this.governor.queryFilter(filter);
    const eventsForProposal = events.filter(
      (event) => event.args.proposalId === proposalId
    );
    for (const address of Object.keys(addressNameMap)) {
      const eventsForAddress = eventsForProposal.filter(
        (event) => event.args.voter === address
      );
      if (eventsForAddress.length == 0) {
        votes[address] = "didntVote";
      } else {
        const vote = Number(eventsForAddress[0].args.support);
        votes[address] = governorVoteMap[vote];
      }
    }
    return votes;
  }

  // Creates a proposal on-chain that invokes the do nothing method of the contract. Returns the proposal id
  private async createProposalDoNothing(description: string): Promise<bigint> {
    const governorAddress = await this.governor.getAddress();
    const doNothingCalldata =
      this.governor.interface.encodeFunctionData("doNothing");

    const proposalId = await this.governor.propose(
      [governorAddress],
      [0],
      [doNothingCalldata],
      description
    );
    return proposalId;
  }

  async uploadVotableItem(item: VotableItem, parentId: bigint) {
    const serializationData: VotableItemSerializationData = {
      type: "voteItem",
      title: item.title,
      description: item.description,
      parentProposalId: parentId.toString(),
    };
    const serializedVoteItem = JSON.stringify(serializationData);
    await this.createProposalDoNothing(serializedVoteItem);
  }
  async uploadProposal(proposal: Proposal) {
    const serializationData: ProposalSerializationData = {
      type: "proposal",
      title: proposal.title,
      description: proposal.description,
      fileHash: await this.fileService.upload(proposal.file),
    };
    const serializedProposal = JSON.stringify(serializationData);
    console.log("Креирање предлога: " + serializedProposal);

    try {
      console.log("Креирање предлога...");
      const proposalId = await this.createProposalDoNothing(serializedProposal);
      console.log("Додавање тачака за гласање...");
      const uploadPromises = proposal.itemsToVote.map((voteItem) =>
        this.uploadVotableItem(voteItem, proposalId)
      );
      await Promise.all(uploadPromises);
      return proposalId;
    } catch (error) {
      console.error("Грешка при креирању предлога:", error);
      throw error;
    }
  }
  async voteForItem(item: VotableItem, vote: VoteOption) {
    return await castVote(this.signer, this.governor, item.id, vote);
  }
}

export interface VotableItem {
  id: bigint;
  title: string;
  description: string;
  author: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votesForAddress: Record<string, VoteOption>;
}

export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  file: File;
  dateAdded: Date;
  status: "open" | "closed";
  closesAt: Date;
  itemsToVote: VotableItem[];
}

export type VoteOption =
  | "for"
  | "against"
  | "abstain"
  | "didntVote"
  | "notEligible";

export type VoteResult = "passed" | "failed" | "returned";

interface SerializationData {
  title: string;
  description: string;
  type: "proposal" | "voteItem";
}

interface ProposalSerializationData extends SerializationData {
  fileHash: string;
}
interface VotableItemSerializationData extends SerializationData {
  parentProposalId: string;
}
