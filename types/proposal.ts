export interface Proposal {
  id: bigint;
  title: string;
  dateAdded: Date;
  description: string;
  author: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  status: "open" | "closed";
  closesAt: Date;
  yourVote: VoteOption;
  votesForAddress: Record<string, VoteOption>;
}

export type VoteOption =
  | "for"
  | "against"
  | "abstain"
  | "didntVote"
  | "notEligible";

export type VoteResult = "passed" | "failed" | "returned";
export type ProposalSerializationData = Pick<Proposal, "title" | "description">;
