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
      (await this.reader.getUserVotingStatus(user)) === "CanAcceptVotingRights"
    );
  }
  public async getAllUserActivity(
    user: User
  ): Promise<(UserActivityEventVote | UserActivityEventProposal)[]> {
    const proposalsForUser = (await this.reader.getProposals()).filter(
      (proposal) => proposal.author.address === user.address
    );
    const createEvents = proposalsForUser.map((proposal) => {
      const proposalCreateEvt: UserActivityEventProposal = {
        type: "Create",
        proposal,
        date: proposal.dateAdded,
      };
      return proposalCreateEvt;
    });

    const allVoteEvents = await this.eventProvider.getAllVoteEvents();
    const voteEvents: UserActivityEventVote[] = [];
    for (const x of allVoteEvents) {
      for (const proposal of proposalsForUser) {
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
      const proposal = proposalsForUser.find(
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
