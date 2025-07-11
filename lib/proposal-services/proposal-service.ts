import {
  Proposal,
  UIAddVoterVotableItem,
  UIProposal,
  User,
  UserActivityEventProposal,
  UserActivityEventVote,
  UserVotingStatus,
  VotableItem,
  VoteOption,
} from "@/types/proposal";
export type onProposalsChangedUnsubscribe = () => void;

export interface ProposalReader {
  getProposals: () => Promise<Proposal[]>;
  onProposalsChanged(
    callback: (newProposals: Proposal[]) => void
  ): onProposalsChangedUnsubscribe;
  getUserVotingStatus(user: User): Promise<UserVotingStatus>;
}

export interface UserActivityTracker {
  getAllUserActivity: (
    user: User
  ) => Promise<(UserActivityEventVote | UserActivityEventProposal)[]>;
  canUserAcceptVotingRights(user: User): Promise<boolean>;
}

export interface ProposalWriter {
  uploadAddVoterProposal: (
    addVoterItem: UIAddVoterVotableItem
  ) => Promise<bigint>;
  uploadProposal: (proposal: UIProposal) => Promise<bigint>;
  voteForItem: (item: VotableItem, vote: VoteOption) => Promise<void>;
  cancelProposal(proposal: Proposal): Promise<boolean>;
  acceptVotingRights(): Promise<void>;
}

export interface ProposalService
  extends ProposalReader,
    ProposalWriter,
    UserActivityTracker {}
