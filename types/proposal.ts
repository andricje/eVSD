import { getDeployedContracts, getProposals } from "@/lib/blockchain-utils";
import { EvsdGovernor, EvsdToken } from "@/typechain-types";
import { ethers } from "ethers";

export interface ProposalService {
  getProposals: () => Promise<Proposal[]>;
  createProposal: (
    title: string,
    description: string,
    file: File
  ) => Promise<Proposal>;
  getProposal: (id: bigint) => Promise<Proposal>;
  getProposalVoteResult: (id: bigint) => Promise<VoteResult>;
  voteForProposal: (id: bigint, vote: VoteOption) => Promise<void>;
}

class BlockchainProposalService implements ProposalService {
  private readonly governor: EvsdGovernor;
  private readonly token: EvsdToken;

  constructor(provider: ethers.BrowserProvider, signer: ethers.Signer) {
    const contracts = getDeployedContracts(signer);
    this.governor = contracts.governor;
    this.token = contracts.token;
  }
  createProposal: (
    title: string,
    description: string,
    file: File
  ) => Promise<Proposal>;
  getProposal: (id: bigint) => Promise<Proposal>;
  getProposalVoteResult: (id: bigint) => Promise<VoteResult>;
  voteForProposal: (id: bigint, vote: VoteOption) => Promise<void>;

  async getProposals(): Promise<Proposal[]> {
    return getProposals(this.governor, this.token);
  }
}
export interface Proposal {
  id: bigint;
  title: string;
  dateAdded: Date;
  description: string;
  fileUrl?: string;
  author: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  status: "open" | "closed";
  closesAt: Date;
  yourVote: VoteOption;
  votesForAddress: Record<string, VoteOption>;
  isMultilayered: boolean;
  mainVoteResult?: VoteResult;
  subItems?: ProposalSubItem[];
  canBeCanceled?: boolean;
}

export interface ProposalSubItem {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  yourVote: VoteOption;
  result?: VoteResult;
  votesForAddress: Record<string, VoteOption>;
}

export type VoteOption =
  | "for"
  | "against"
  | "abstain"
  | "didntVote"
  | "notEligible";

export type VoteResult = "passed" | "failed" | "returned";
export type ProposalSerializationData = Pick<
  Proposal,
  "title" | "description" | "fileUrl" | "isMultilayered" | "subItems"
>;
