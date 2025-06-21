import { VoteEvent, Proposal, VotableItem } from "./proposal";

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
