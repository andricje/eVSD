import {
  AddVoterVotableItem,
  IsUIAddVoterVotableItem,
  Proposal,
  UIAddVoterVotableItem,
  UIProposal,
  UIVotableItem,
  VotableItem,
  VoteEvent,
} from "../../../types/proposal";
import {
  convertGovernorState,
  getNewVoterProposalDescription,
} from "../../utils";
import { ProposalFileService } from "../../file-upload";
import { EvsdGovernor } from "../../../typechain-types";
import { ProposalParseError } from "../../../types/proposal-service-errors";
import { UserService } from "../../../lib/user-services/user-service";
import { STRINGS } from "../../../constants/strings";

export interface ChainData {
  title: string;
  description: string;
  type: "proposal" | "voteItem" | "addVoterVoteItem";
}

export interface ProposalChainData extends ChainData {
  type: "proposal";
  fileHash: string;
}
export interface VotableItemChainData extends ChainData {
  type: "voteItem";
  parentProposalId: string;
  index: number;
}
export interface AddVoterVotableItemChainData extends ChainData {
  type: "addVoterVoteItem";
  parentProposalId: string;
  index: number;
  newVoterAddress: string;
  newVoterName: string;
}

export interface ProposalCreatedEventArgs {
  proposalId: bigint;
  voteStart: bigint;
  proposerAddress: string;
}

export const isProposalChainData = (
  data: ChainData
): data is ProposalChainData => data.type === "proposal";
export const isVotableItemChainData = (
  data: ChainData
): data is VotableItemChainData => data.type === "voteItem";
export const isAddVoterVotableItemChainData = (
  data: ChainData
): data is AddVoterVotableItemChainData => data.type === "addVoterVoteItem";

export class BlockchainProposalParser {
  private readonly governor: EvsdGovernor;
  private readonly fileService: ProposalFileService;
  private readonly userService: UserService;

  constructor(
    governor: EvsdGovernor,
    fileService: ProposalFileService,
    userService: UserService
  ) {
    this.governor = governor;
    this.fileService = fileService;
    this.userService = userService;
  }

  public deserializeChainData(data: string): ChainData {
    return JSON.parse(data) as ChainData;
  }

  public async parseProposal(
    proposalData: ProposalChainData,
    args: ProposalCreatedEventArgs
  ): Promise<Proposal> {
    const proposalId = args.proposalId;
    const voteStart = new Date(Number(args.voteStart) * 1000);
    try {
      const stateIndex = Number(
        (await this.governor.state(proposalId)) as bigint
      );
      const proposalState = convertGovernorState(stateIndex);
      const deadline = await this.governor.proposalDeadline(proposalId);
      const closesAt = new Date(Number(deadline) * 1000);
      let author = await this.userService.getUserForAddress(
        args.proposerAddress
      );
      if (!author) {
        console.error("Failed to find the author name for the given address");
        author = {
          name: STRINGS.user.unknownUser,
          address: args.proposerAddress,
        };
      }

      // Create a proposal with an empty itemsToVote array - it will be filled after all of the VotableItems arrive
      return {
        id: proposalId,
        title: proposalData.title,
        description: proposalData.description,
        author,
        file:
          proposalData.fileHash !== ""
            ? await this.fileService.fetch(proposalData.fileHash)
            : undefined,
        dateAdded: voteStart,
        status: proposalState,
        closesAt: closesAt,
        voteItems: [],
      };
    } catch (err) {
      let msg = "Unknown parser error";
      if (err instanceof Error) {
        msg = err.message;
      }
      throw new ProposalParseError(`${proposalId}`, msg);
    }
  }
  public async parseVotableItem(
    deserializedData: VotableItemChainData | AddVoterVotableItemChainData,
    args: ProposalCreatedEventArgs,
    voteEventsForId: Record<string, VoteEvent[]>
  ): Promise<VotableItem> {
    const proposalId = args.proposalId;
    const proposalIdStr = proposalId.toString();

    // Convert an array of VoteEvents into a map of voter -> voteEvent
    const votesForAddress =
      proposalIdStr in voteEventsForId
        ? voteEventsForId[proposalIdStr].reduce<Map<string, VoteEvent>>(
            (acc, item) => {
              acc.set(item.voter.address, item);
              return acc;
            },
            new Map()
          )
        : new Map<string, VoteEvent>();

    return {
      id: proposalId,
      title: deserializedData.title,
      description: deserializedData.description,
      userVotes: votesForAddress,
    };
  }
  public async parseAddVoterVotableItem(
    deserializedData: AddVoterVotableItemChainData,
    args: ProposalCreatedEventArgs,
    voteEventsForId: Record<string, VoteEvent[]>
  ): Promise<AddVoterVotableItem> {
    const votableItem = await this.parseVotableItem(
      deserializedData,
      args,
      voteEventsForId
    );
    const { description } = getNewVoterProposalDescription(
      deserializedData.newVoterAddress,
      deserializedData.newVoterName
    );
    return {
      ...votableItem,
      newVoterAddress: deserializedData.newVoterAddress,
      title: description,
      description: "",
    };
  }
  public serializeProposal(proposal: UIProposal | Proposal) {
    if (proposal.file) {
      throw new Error("Proposal file upload not supported yet");
    }

    const serializationData: ProposalChainData = {
      type: "proposal",
      title: proposal.title,
      description: proposal.description,
      fileHash: "",
    };
    return JSON.stringify(serializationData);
  }
  public serializeVotableItem(
    item: UIVotableItem | UIAddVoterVotableItem,
    parentId: bigint,
    index: number
  ): string {
    const serializationData:
      | VotableItemChainData
      | AddVoterVotableItemChainData = IsUIAddVoterVotableItem(item)
      ? {
          type: "addVoterVoteItem",
          parentProposalId: parentId.toString(),
          newVoterAddress: item.newVoterAddress,
          newVoterName: item.newVoterName,
          index: 0,
          title: "" /* Left blank on purpose */,
          description: "" /* Left blank on purpose */,
        }
      : {
          type: "voteItem",
          title: item.title,
          description: item.description,
          parentProposalId: parentId.toString(),
          index,
        };
    return JSON.stringify(serializationData);
  }
}
