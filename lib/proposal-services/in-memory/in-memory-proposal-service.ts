import { getNewVoterProposalDescription } from "@/lib/utils";
import {
  Proposal,
  UserVotingStatus,
  UserActivityEventVote,
  UserActivityEventProposal,
  UIProposal,
  VotableItem,
  VoteOption,
  UIVotableItem,
  UIAddVoterVotableItem,
  IsUIAddVoterVotableItem,
  User,
} from "@/types/proposal";
import { ProposalService, Unsubscribe } from "../proposal-service";

export class InMemoryProposalService implements ProposalService {
  private readonly user: User;
  private onProposalsChangedCallback: (newProposals: Proposal[]) => void =
    () => {};
  private proposals: Proposal[] = [];

  constructor(user: User) {
    this.user = user;
  }
  async uploadAddVoterProposal(
    addVoterItem: UIAddVoterVotableItem
  ): Promise<bigint> {
    throw new Error("Method not implemented.");
  }
  getUserVotingStatus(): Promise<UserVotingStatus> {
    throw new Error("Method not implemented.");
  }
  canUserAcceptVotingRights(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getCurrentUserVotingStatus(): Promise<UserVotingStatus> {
    throw new Error("Method not implemented.");
  }
  async canCurrentUserAcceptVotingRights(): Promise<boolean> {
    return false;
  }
  async acceptVotingRights(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getAllUserActivity(): Promise<
    (UserActivityEventVote | UserActivityEventProposal)[]
  > {
    throw new Error("Method not implemented.");
  }

  async getProposals(): Promise<Proposal[]> {
    return this.proposals;
  }

  async uploadProposal(proposal: UIProposal): Promise<bigint> {
    const newProposal = this.proposalFromUIProposal(proposal);
    this.proposals.push(newProposal);
    this.notifyProposalsChanged();
    return newProposal.id;
  }

  async getProposal(id: bigint): Promise<Proposal> {
    const proposal = this.proposals.find((p) => p.id === id);
    if (!proposal) {
      throw new Error("Invalid proposal id");
    }
    return proposal;
  }

  async voteForItem(item: VotableItem, vote: VoteOption) {
    const proposal = this.proposals.find((p) =>
      p.voteItems.some((i) => i.id === item.id)
    );
    if (!proposal) {
      throw new Error("Invalid proposal id");
    }
    const votableItem = proposal.voteItems.find((i) => i.id === item.id);
    if (!votableItem) {
      throw new Error("Invalid votable item id");
    }
    if (votableItem.userVotes.has(this.user.address)) {
      throw new Error("Already voted");
    }
    votableItem.userVotes.set(this.user.address, {
      vote,
      date: new Date(),
      voter: this.user,
    });
    this.notifyProposalsChanged();
  }

  async cancelProposal(proposal: Proposal): Promise<boolean> {
    const proposalToCancel = this.proposals.find((p) => p.id === proposal.id);
    if (!proposalToCancel) {
      throw new Error("Invalid proposal id");
    }

    proposalToCancel.status = "cancelled";
    this.notifyProposalsChanged();
    return true;
  }

  onProposalsChanged(
    callback: (newProposals: Proposal[]) => void
  ): Unsubscribe {
    this.onProposalsChangedCallback = callback;
    return () => {
      this.onProposalsChangedCallback = () => {};
    };
  }

  private randomId(): bigint {
    return BigInt(Math.floor(Math.random() * 1000000));
  }

  private votableItemFromUIVotableItem(
    item: UIVotableItem | UIAddVoterVotableItem
  ): VotableItem {
    if (IsUIAddVoterVotableItem(item)) {
      return {
        id: this.randomId(),
        userVotes: new Map(),
        ...item,
        ...getNewVoterProposalDescription(
          item.newVoterAddress,
          item.newVoterName
        ),
      };
    }
    return {
      id: this.randomId(),
      userVotes: new Map(),
      ...item,
    };
  }

  private proposalFromUIProposal(proposal: UIProposal): Proposal {
    return {
      ...proposal,
      id: this.randomId(),
      author: this.user,
      dateAdded: new Date(),
      status: "open",
      closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      voteItems: proposal.voteItems.map((v) =>
        this.votableItemFromUIVotableItem(v)
      ),
    };
  }

  private notifyProposalsChanged() {
    this.onProposalsChangedCallback([...this.proposals]);
  }
}
