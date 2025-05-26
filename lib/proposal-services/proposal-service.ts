import {
  Proposal,
  UIProposal,
  VotableItem,
  VoteOption,
} from "@/types/proposal";
import { onProposalsChangedUnsubscribe } from "./blockchain-proposal-service";
import { UserActivityEventVote, UserActivityEventProposal } from "@/components/user-activity/user-activity";

export interface ProposalService {
  getProposals: () => Promise<Proposal[]>;
  uploadProposal: (proposal: UIProposal) => Promise<bigint>;
  voteForItem: (item: VotableItem, vote: VoteOption) => Promise<void>;
  cancelProposal(proposal: Proposal): Promise<boolean>;
  onProposalsChanged(
    callback: (newProposals: Proposal[]) => void
  ): onProposalsChangedUnsubscribe;
  getAllUserActivity(): Promise<(UserActivityEventVote | UserActivityEventProposal)[]>;
}
