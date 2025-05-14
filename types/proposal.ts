export interface ProposalService {
  getProposals: () => Promise<Proposal[]>;
  uploadProposal: (proposal: UIProposal) => Promise<bigint>;
  getProposal: (id: bigint) => Promise<Proposal>;
  voteForItem: (item: VotableItem, vote: VoteOption) => Promise<void>;
  cancelProposal(proposal: Proposal): Promise<boolean>;
  getCurrentUserVote(voteItem: VotableItem): Promise<VoteOption>;
}

export type UIVotableItem = Pick<VotableItem, "title" | "description"> & {
  UIOnlyId: string;
};

export type UIAddVoterVotableItem = {
  newVoterAddress: string;
};

export function IsUIAddVoterVotableItem(
  votableItem: UIVotableItem | UIAddVoterVotableItem
): votableItem is UIAddVoterVotableItem {
  return (votableItem as UIAddVoterVotableItem).newVoterAddress !== undefined;
}

export interface UIProposal {
  title: string;
  description: string;
  file?: File;
  voteItems: (UIVotableItem | UIAddVoterVotableItem)[];
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

export interface VotableItemAddVoter extends VotableItem {
  newVoterAddress: string;
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
