export interface User {
  address: string;
  name: string;
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
  userVotes: Map<User, VoteEvent>;
}

export function countVoteForOption(
  votableItem: VotableItem,
  option: VoteOption
) {
  return votableItem.userVotes
    .values()
    .reduce((acc, item) => (item.vote === option ? acc + 1 : acc), 0);
}

export interface AddVoterVotableItem extends VotableItem {
  newVoterAddress: string;
}

export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  author: User;
  file?: File;
  dateAdded: Date;
  status: "open" | "closed" | "cancelled";
  closesAt: Date;
  voteItems: VotableItem[];
}

export interface VoteEvent {
  vote: VoteOption;
  date: Date;
  voter: User;
}

export type VoteOption =
  | "for"
  | "against"
  | "abstain"
  | "didntVote"
  | "notEligible";

export type VoteResult = "passed" | "failed" | "returned";
