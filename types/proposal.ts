export interface User {
  address: string;
  name: string;
}

export type UserVotingStatus =
  | "NotEligible"
  | "CanAcceptVotingRights"
  | "Eligible";

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

export interface UserActivityEventVote {
  voteEvent: VoteEvent;
  proposal: Proposal;
  voteItem: VotableItem;
  date: Date;
}

export interface UserActivityEventProposal {
  type: "Create" | "Delete";
  proposal: Proposal;
  date: Date;
}

export function IsUserActivityVote(
  userActivityEvent: UserActivityEvent
): userActivityEvent is UserActivityEventVote {
  return (userActivityEvent as UserActivityEventVote).voteEvent !== undefined;
}

export type UserActivityEvent =
  | UserActivityEventVote
  | UserActivityEventProposal;

export type UserVotingStatus =
  | "NotEligible"
  | "CanAcceptVotingRights"
  | "Eligible";

export function countVoteForOption(
  votableItem: VotableItem,
  option: VoteOption
) {
  return Array.from(votableItem.userVotes.values()).reduce(
    (acc, item) => (item.vote === option ? acc + 1 : acc),
    0
  );
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

export type VoteOption = "for" | "against" | "abstain";

export type VoteResult = "passed" | "failed" | "no-quorum";
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
