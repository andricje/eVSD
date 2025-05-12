import evsdGovernorArtifacts from "../contracts/evsd-governor.json";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import { fileToDigestHex, ProposalFileService } from "@/lib/file-upload";
import {
  convertAddressToName,
  convertVoteOptionToGovernor,
  governorVoteMap,
} from "@/lib/utils";
import { ethers, EventLog } from "ethers";

export interface ProposalService {
  getProposals: () => Promise<Proposal[]>;
  uploadProposal: (proposal: UIProposal) => Promise<bigint>;
  getProposal: (id: bigint) => Promise<Proposal>;
  voteForItem: (item: VotableItem, vote: VoteOption) => Promise<void>;
  cancelProposal(proposal: Proposal): Promise<boolean>;
  getCurrentUserVote(voteItem: VotableItem): Promise<VoteOption>;
}

export class BlockchainProposalService implements ProposalService {
  private readonly governor: ethers.Contract;
  private readonly token: ethers.Contract;
  private readonly fileService: ProposalFileService;
  private readonly signer: ethers.Signer;
  private readonly provider: ethers.Provider;

  constructor(
    signer: ethers.Signer,
    fileService: ProposalFileService,
    provider: ethers.Provider
  ) {
    this.governor = new ethers.Contract(
      evsdGovernorArtifacts.address,
      evsdGovernorArtifacts.abi,
      signer
    );
    this.token = new ethers.Contract(
      evsdTokenArtifacts.address,
      evsdTokenArtifacts.abi,
      signer
    );
    this.fileService = fileService;
    this.signer = signer;
    this.provider = provider;
  }
  async getCurrentUserVote(voteItem: VotableItem): Promise<VoteOption> {
    return voteItem.votesForAddress[await this.signer.getAddress()].vote;
  }
  async cancelProposal(proposal: Proposal): Promise<boolean> {
    try {
      const description = await this.serializeProposal(proposal);
      const descriptionHash = ethers.id(description);

      const governorAddress = await this.governor.getAddress();
      const doNothingCalldata =
        this.governor.interface.encodeFunctionData("doNothing");

      const tx = await this.governor.cancel(
        [governorAddress],
        [0],
        [doNothingCalldata],
        descriptionHash
      );
      await tx.wait();

      return true;
    } catch (error) {
      console.error("Greška pri otkazivanju predloga:", error);
      return false;
    }
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
    const allVoteEvents = await this.getAllVoteEvents();
    const voteEventsForId = allVoteEvents.reduce<Record<string, VoteEvent[]>>(
      (acc, item) => {
        if (!acc[item.proposalId]) {
          acc[item.proposalId] = [];
        }
        acc[item.proposalId].push(item.voteEvent);
        return acc;
      },
      {}
    );

    // First process all events - parse either a VotableItem or a Proposal
    for (const event of events) {
      const args = (event as EventLog).args;
      if (!args) {
        continue;
      }
      const proposalId = args.proposalId;
      const proposalState = await this.governor.state(proposalId);
      const countedVotes = await this.governor.proposalVotes(args.proposalId);
      const deadline = await this.governor.proposalDeadline(proposalId);
      const closesAt = new Date(Number(deadline) * 1000);
      const voteStart = new Date(Number(args.voteStart) * 1000);

      // All serializable data is stored as a json string inside the proposal description
      const deserializedData = this.deserializeChainData(args.description);
      if (deserializedData.type === "proposal") {
        // Create a proposal with an empty itemsToVote array - it will be filled after all of the VotableItems arrive
        const proposalData = deserializedData as ProposalSerializationData;
        const proposal = {
          id: proposalId,
          title: proposalData.title,
          description: proposalData.description,
          author: convertAddressToName(args.proposer),
          file:
            proposalData.fileHash !== ""
              ? await this.fileService.fetch(proposalData.fileHash)
              : undefined,
          dateAdded: voteStart,
          status: "open",
          closesAt: closesAt,
          itemsToVote: [],
        } as Proposal;
        proposals.push(proposal);
      } else {
        // Create a VotableItem
        const proposalIdStr = proposalId.toString();
        // Convert an array of VoteEvents into a map of voter -> voteEvent
        const votesForAddress =
          proposalIdStr in voteEventsForId
            ? voteEventsForId[proposalIdStr].reduce<Record<string, VoteEvent>>(
                (acc, item) => {
                  acc[item.voterAddress] = item;
                  return acc;
                },
                {}
              )
            : [];
        // Note that the code below removes decimals from the counted votes and therefore will not work properly if we allow decimal votes in the future
        const voteItemData = deserializedData as VotableItemSerializationData;
        const votableItem = {
          id: proposalId,
          title: voteItemData.title,
          description: voteItemData.description,
          author: convertAddressToName(args.proposer),
          votesFor: Number(countedVotes.forVotes / oneToken),
          votesAgainst: Number(countedVotes.againstVotes / oneToken),
          votesAbstain: Number(countedVotes.abstainVotes / oneToken),
          status: "open",
          votesForAddress,
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

  private async getAllVoteEvents() {
    // Filteriramo događaje za glasanje korisnika
    const filter = this.governor.filters.VoteCast(
      await this.signer.getAddress()
    );
    const events = await this.governor.queryFilter(filter, 0, "latest");

    // Mapiramo događaje u format za istoriju glasanja
    const votingHistory = events.map(async (event) => {
      const args = (event as EventLog).args;
      if (!args) {
        return undefined;
      }
      const vote = Number(args.support);
      const block = await this.provider.getBlock(event.blockNumber);
      const voteEvent = {
        vote: governorVoteMap[vote],
        date: new Date(block ? block.timestamp * 1000 : 0),
        voterAddress: args.voter,
      } as VoteEvent;
      return {
        proposalId: args.proposalId.toString(),
        voteEvent,
      };
    });
    return (await Promise.all(votingHistory)).filter(
      (item) => item !== undefined
    );
  }

  private async serializeProposal(proposal: UIProposal | Proposal) {
    const serializationData: ProposalSerializationData = {
      type: "proposal",
      title: proposal.title,
      description: proposal.description,
      fileHash: proposal.file ? await fileToDigestHex(proposal.file) : "",
    };
    return JSON.stringify(serializationData);
  }

  private serializeVotableItem(item: UIVotableItem, parentId: bigint): string {
    const serializationData: VotableItemSerializationData = {
      type: "voteItem",
      title: item.title,
      description: item.description,
      parentProposalId: parentId.toString(),
    };
    return JSON.stringify(serializationData);
  }

  // Creates a proposal on-chain that invokes the do nothing method of the contract. Returns the proposal id
  private async createProposalDoNothing(description: string): Promise<bigint> {
    const governorAddress = await this.governor.getAddress();
    const doNothingCalldata =
      this.governor.interface.encodeFunctionData("doNothing");

    const tx = await this.governor.propose(
      [governorAddress],
      [0],
      [doNothingCalldata],
      description
    );
    const receipt = await tx.wait();
    for (const log of receipt.logs) {
      try {
        const parsed = this.governor.interface.parseLog(log);
        if (parsed?.name === "ProposalCreated") {
          return parsed.args.proposalId;
        }
      } catch (err) {
        // This log might not match the contract interface, ignore it
        console.log(err);
      }
    }
    throw new Error("Failed to find proposalId in the transaction receipt");
  }

  async uploadVotableItem(item: UIVotableItem, parentId: bigint) {
    await this.createProposalDoNothing(
      this.serializeVotableItem(item, parentId)
    );
  }
  async uploadProposal(proposal: UIProposal) {
    const serializedProposal = await this.serializeProposal(proposal);
    console.log("Креирање предлога: " + serializedProposal);

    try {
      console.log("Креирање предлога...");
      const proposalId = await this.createProposalDoNothing(serializedProposal);
      console.log("Додавање тачака за гласање...");
      const uploadPromises = proposal.voteItems.map((voteItem) =>
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
    const voteGovernor = convertVoteOptionToGovernor(vote);
    await this.governor.castVote(item.id, voteGovernor);
  }
}

export type UIVotableItem = Pick<VotableItem, "title" | "description"> & {
  UIOnlyId: string;
};
export interface UIProposal {
  title: string;
  description: string;
  file?: File;
  voteItems: UIVotableItem[];
}

export interface VotableItem {
  id: bigint;
  title: string;
  description: string;
  author: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votesForAddress: Record<string, VoteEvent>;
}

export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  author: string;
  file?: File;
  dateAdded: Date;
  status: "open" | "closed";
  closesAt: Date;
  itemsToVote: VotableItem[];
}

export interface VoteEvent {
  vote: VoteOption;
  date: Date;
  voterAddress: string;
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
