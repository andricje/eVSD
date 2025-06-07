import { BlockchainProposalReader } from "./blockchain-proposal-reader";
import { BlockchainEventProvider } from "./blockchain-event-provider";
import { UserActivityTracker } from "../proposal-service";
import {
  User,
  UserActivityEventProposal,
  UserActivityEventVote,
} from "@/types/proposal";

export class BlockchainUserActivityTracker implements UserActivityTracker {
  private readonly reader: BlockchainProposalReader;
  private readonly eventProvider: BlockchainEventProvider;

  constructor(
    blockchainReader: BlockchainProposalReader,
    blockchainEventProvider: BlockchainEventProvider
  ) {
    this.reader = blockchainReader;
    this.eventProvider = blockchainEventProvider;
  }
  async canUserAcceptVotingRights(user: User): Promise<boolean> {
    return (
      (await this.reader.getUserVotingStatus(user.address)) ===
      "CanAcceptVotingRights"
    );
  }
  public async getAllUserActivity(): Promise<
    (UserActivityEventVote | UserActivityEventProposal)[]
  > {
    const proposals = await this.reader.getProposals();
    const createEvents = proposals.map((proposal) => {
      const proposalCreateEvt: UserActivityEventProposal = {
        type: "Create",
        proposal,
        date: proposal.dateAdded,
      };
      return proposalCreateEvt;
    });

    const voteEventsWithId = await this.eventProvider.getAllVoteEvents();
    const voteEvents: UserActivityEventVote[] = [];
    for (const x of voteEventsWithId) {
      for (const proposal of proposals) {
        const voteItem = proposal.voteItems.find(
          (voteItem) => voteItem.id === BigInt(x.proposalId)
        );
        if (voteItem) {
          const evt: UserActivityEventVote = {
            voteEvent: x.voteEvent,
            proposal,
            voteItem,
            date: x.voteEvent.date,
          };
          voteEvents.push(evt);
        }
      }
    }

    const cancelEventsWithId = await this.eventProvider.getAllCancelEvents();
    const cancelEvents: UserActivityEventProposal[] = [];
    for (const x of cancelEventsWithId) {
      const proposal = proposals.find(
        (proposal) => proposal.id === BigInt(x.proposalId)
      );
      if (proposal) {
        const evt: UserActivityEventProposal = {
          proposal,
          type: "Delete",
          date: x.date,
        };
        cancelEvents.push(evt);
      }
    }

    return [...createEvents, ...voteEvents, ...cancelEvents];
  }
}
