import {
  Proposal,
  UIProposal,
  VotableItem,
  VoteOption,
} from "@/types/proposal";
import {
  UserActivityEventVote,
  UserActivityEventProposal,
} from "@/components/user-activity/user-activity";

export type onProposalsChangedUnsubscribe = () => void;

export interface ProposalReader {
  getProposals: () => Promise<Proposal[]>;
  onProposalsChanged(
    callback: (newProposals: Proposal[]) => void
  ): onProposalsChangedUnsubscribe;
}

export interface UserActivityTracker {
  getAllUserActivity: () => Promise<
    (UserActivityEventVote | UserActivityEventProposal)[]
  >;
  canCurrentUserAcceptVotingRights(): Promise<boolean>;
  acceptVotingRights(): Promise<void>;
}

export interface ProposalWriter {
  uploadProposal: (proposal: UIProposal) => Promise<bigint>;
  voteForItem: (item: VotableItem, vote: VoteOption) => Promise<void>;
  cancelProposal(proposal: Proposal): Promise<boolean>;
}

export interface ProposalService
  extends ProposalReader,
    ProposalWriter,
    UserActivityTracker {}
