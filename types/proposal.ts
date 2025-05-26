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
  userVotes: Map<string, VoteEvent>;
}

export function countVoteForOption(
  votableItem: VotableItem,
  option: VoteOption
) {
  return [...votableItem.userVotes
    .values()]
    .reduce((acc, item) => (item.vote === option ? acc + 1 : acc), 0);
}

export interface AddVoterVotableItem extends VotableItem {
  newVoterAddress: string;
}
export function IsAddVoterVotableItem(
  votableItem: AddVoterVotableItem | VotableItem
): votableItem is AddVoterVotableItem {
  return (votableItem as AddVoterVotableItem).newVoterAddress !== undefined;
}

export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  author: User;
  file?: File;
  dateAdded: Date;
  status: ProposalState;
  closesAt: Date;
  voteItems: (VotableItem | AddVoterVotableItem)[];
}

export interface VoteEvent {
  vote: VoteOption;
  date: Date;
  voter: User;
}

export type VoteOption =
  | "for"
  | "against"
  | "abstain";

export type VoteResult = "passed" | "failed" | "returned";
export type ProposalState = "open" | "closed" | "cancelled";
export const ProposalStateMap: Map<number, string> = new Map([
  [0, "Pending"],
  [1, "Active"],
  [2, "Canceled"],
  [3, "Defeated"],
  [4, "Succeeded"],
  [5, "Queued"],
  [6, "Expired"],
  [7, "Executed"],
]);
