import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Proposal, VoteOption, VoteResult } from "../types/proposal";
import { addressNameMap, getAddressNameMap } from "./address-name-map";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const governorVoteMap: Record<number, VoteOption> = {
  0: "against",
  1: "for",
  2: "abstain",
};

const inverseGovernorVoteMap: Record<VoteOption, bigint> = {
  notEligible: BigInt(-1),
  didntVote: BigInt(-1),
  against: BigInt(0),
  for: BigInt(1),
  abstain: BigInt(2),
};

export function convertVoteOptionToGovernor(vote: VoteOption): bigint {
  if (vote === "didntVote") {
    throw new Error("didntVote can't be converted to a governor vote");
  }
  return inverseGovernorVoteMap[vote];
}

export function convertGovernorToVoteOption(vote: bigint): VoteOption {
  const voteNumber = Number(vote);
  if (voteNumber in governorVoteMap) {
    return governorVoteMap[voteNumber];
  }
  throw new Error("Invalid vote option");
}

export function convertAddressToName(address: string): string {
  const currentAddressMap = getAddressNameMap();
  
  if (currentAddressMap[address]) {
    return currentAddressMap[address];
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function convertVoteOptionToString(vote: VoteOption): string {
  const voteOptionMap: Record<VoteOption, string> = {
    for: "за",
    against: "против",
    abstain: "уздржан",
    didntVote: "нисте гласали",
    notEligible: "немате право гласа",
  };
  return voteOptionMap[vote];
}

// Broj adresa koje su registrovane u sistemu
export function getTotalVoters(): number {
  const currentMap = getAddressNameMap();
  return Object.keys(currentMap).length;
}

// Inicijalni broj adresa za kvorumu
export const INITIAL_VOTERS_COUNT = Object.keys(addressNameMap).length;

// Dinamički kvorumu - 50% + 1 registrovanih adresa
export function getQuorum(): number {
  // Koristimo dinamičko računanje broja glasača umesto konstante
  const totalVoters = getTotalVoters();
  return Math.floor(totalVoters / 2) + 1;
}

// Originalni konstantni kvorumu - ovo zadržavamo za kompatibilnost sa postojećim kodom
export let QUORUM = Math.floor(INITIAL_VOTERS_COUNT / 2) + 1;

export function getVoteResult(
  votesFor: number,
  votesAgainst: number,
  votesAbstain: number
): VoteResult {
  const totalVotes = votesFor + votesAgainst + votesAbstain;
  const currentQuorum = getQuorum();
  
  if (totalVotes >= currentQuorum) {
    if (votesFor > votesAgainst) {
      return "passed";
    } else {
      return "failed";
    }
  } else {
    return "returned";
  }
}

// Formatiranje datuma
export const formatDateString = (dateString: string) => {
  const date = new Date(dateString);
  return formatDate(date);
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const getRemainingTime = (expiresAt: Date) => {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Isteklo";
  }

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
};

export function isQuorumReached(proposal: Proposal) {
  return countTotalVotes(proposal) >= getQuorum();
}

export function countTotalVotes(proposal: Proposal) {
  return proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
}
export function tryParseAsBigInt(value: string): bigint | undefined {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}
