import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "@/typechain-types";
import { clsx, type ClassValue } from "clsx";
import { Signer } from "ethers";
import { twMerge } from "tailwind-merge";
import evsdGovernorArtifacts from "../contracts/evsd-governor.json";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import { Proposal } from "@/types/proposal";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DeployedContracts {
  governor: EvsdGovernor;
  token: EvsdToken;
}

export async function getProposals(
  governor: EvsdGovernor
): Promise<Proposal[]> {
  const proposalCreatedFilter = governor.filters.ProposalCreated();
  const events = await governor.queryFilter(proposalCreatedFilter, 0, "latest");
  const results = await Promise.all(
    events.map(async (event) => {
      const proposalId = event.args.proposalId;
      const proposalState = await governor.state(proposalId);
      const countedVotes = await governor.proposalVotes(event.args.proposalId);
      const proposal: Proposal = {
        id: proposalId,
        title: "Test Proposal",
        dateAdded: "1/1/2000",
        description: "Test Description",
        author: "Test author",
        votesFor: countedVotes.forVotes,
        votesAgainst: countedVotes.againstVotes,
        votesAbstain: countedVotes.abstainVotes,
        status: "open",
        closesAt: "1/1/2026",
        yourVote: "didntVote",
      };
      return proposal;
    })
  );
  return results;
}

export function getDeployedContracts(signer: Signer): DeployedContracts {
  const governor = EvsdGovernor__factory.connect(
    evsdGovernorArtifacts.address,
    signer
  );
  const token = EvsdToken__factory.connect(evsdTokenArtifacts.address, signer);
  return { governor, token };
}
// Formatiranje datuma
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
// Funkcija za računanje preostalog vremena
export const getRemainingTime = (expiresAt: string) => {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diffMs = expiration.getTime() - now.getTime();

  if (diffMs <= 0) return "Isteklo";

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHrs}h ${diffMins}m`;
};
// Funkcija koja proverava da li je vreme za glasanje isteklo
export const hasVotingTimeExpired = (proposal: Proposal) => {
  const now = new Date();
  const expirationDate = new Date(proposal.closesAt);

  return now > expirationDate;
};
// Funkcija koja proverava da li je glasanje završeno
export const isVotingComplete = (proposal: Proposal) => {
  return proposal.status === "closed";
}; // Funkcija za grupisanje predloga po datumu (za aktivne predloge)
export const groupProposalsByDate = (proposals: Proposal[]) => {
  const grouped: Record<string, any[]> = {};

  proposals.forEach((proposal) => {
    const date = new Date(proposal.dateAdded);
    const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD format

    if (!grouped[dateString]) {
      grouped[dateString] = [];
    }

    grouped[dateString].push(proposal);
  });

  // Sortiraj datume od najnovijeg
  return Object.entries(grouped)
    .sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime()
    )
    .map(([date, props]) => ({
      date,
      proposals: props,
    }));
};

export const QUORUM = 20;

export function isQuorumReached(proposal: Proposal) {
  return countTotalVotes(proposal) > QUORUM;
}

export function countTotalVotes(proposal: Proposal) {
  return proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
}
