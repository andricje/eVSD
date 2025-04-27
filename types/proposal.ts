export interface Proposal {
    id: bigint;
    title: string;
    dateAdded: string;
    description: string;
    author: string;
    votesFor: bigint;
    votesAgainst: bigint;
    votesAbstain: bigint;
    status: 'open' | 'closed';
    closesAt: string;
    yourVote: 'for' | 'against' | 'abstain' | 'didntVote';
  }