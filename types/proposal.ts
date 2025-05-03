export interface Proposal {
  id: bigint;
  title: string;
  dateAdded: string;
  description: string;
  author: string;
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  status: "open" | "closed";
  closesAt: string;
  yourVote: VoteOption;
  votesForAddress: Record<string, VoteOption>;
}

export type VoteOption = "for" | "against" | "abstain" | "didntVote";

export type VoteResult = "passed" | "failed" | "returned";
