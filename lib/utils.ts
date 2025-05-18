import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  countVoteForOption,
  Proposal,
  ProposalState,
  ProposalStateMap,
  User,
  VotableItem,
  VoteEvent,
  VoteOption,
  VoteResult,
} from "../types/proposal";
import { addressNameMap } from "./address-name-map";

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

export function convertGovernorState(stateId: number): ProposalState {
  const stateString = ProposalStateMap.get(stateId);
  if (stateString === "Active" || stateString === "Pending") {
    return "open";
  } else if (stateString === "Canceled") {
    return "cancelled";
  } else if (
    stateString === "Defeated" ||
    stateString === "Succeeded" ||
    stateString === "Queued" ||
    stateString === "Expired" ||
    stateString === "Executed"
  ) {
    return "closed";
  } else {
    throw new Error("Invalid proposal state id");
  }
}

export function convertGovernorToVoteOption(vote: bigint): VoteOption {
  const voteNumber = Number(vote);
  if (voteNumber in governorVoteMap) {
    return governorVoteMap[voteNumber];
  }
  throw new Error("Invalid vote option");
}

export function convertAddressToName(address: string): string {
  return address in addressNameMap
    ? (addressNameMap[address] as string)
    : "Nepoznato";
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

export const QUORUM = 20;

export function getVoteResult(
  votesFor: number,
  votesAgainst: number,
  votesAbstain: number
): VoteResult {
  const totalVotes = votesFor + votesAgainst + votesAbstain;
  if (totalVotes >= QUORUM) {
    if (votesFor > votesAgainst) {
      return "passed";
    } else {
      return "failed";
    }
  } else {
    return "returned";
  }
}

export function getVoteResultForItem(voteItem: VotableItem) {
  const votesFor = countVoteForOption(voteItem, "for");
  const votesAgainst = countVoteForOption(voteItem, "against");
  const votesAbstain = countVoteForOption(voteItem, "abstain");
  return getVoteResult(votesFor, votesAgainst, votesAbstain);
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

export function isQuorumReached(voteItem: VotableItem) {
  return countTotalVotes(voteItem) > QUORUM;
}

export function isQuorumReachedForAllPoints(proposal: Proposal) {
  return (
    proposal.voteItems.filter((voteItem) => !isQuorumReached(voteItem)).length >
    0
  );
}

export function countTotalVotes(voteItem: VotableItem) {
  return (
    countVoteForOption(voteItem, "for") +
    countVoteForOption(voteItem, "against") +
    countVoteForOption(voteItem, "abstain")
  );
}
export function tryParseAsBigInt(value: string): bigint | undefined {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}
export function getUserVotingHistory(proposals: Proposal[], user: User) {
  return proposals.reduce<{ event: VoteEvent; item: VotableItem }[]>(
    (acc, proposal) => {
      const votesForProposal = proposal.voteItems.reduce<
        { event: VoteEvent; item: VotableItem }[]
      >((acc, item) => {
        const userVote = item.userVotes.get(user);
        if (userVote) {
          acc.push({ event: userVote, item });
        }
        return acc;
      }, []);
      return acc.concat(votesForProposal);
    },
    []
  );
}

export function countUserRemainingItemsToVote(proposal: Proposal, user: User) {
  return proposal.voteItems.filter((voteItem) => !voteItem.userVotes.has(user))
    .length;
}

// Returns the hardcoded description for proposals that actually move tokens on chain and add new voters
// Always ignore the description on chain as it may be deceptive instead always use this one and read the address from the proposal calldata!
export function getNewVoterProposalDescription(newVoterAddress: string) {
  return {
    title: `Додавање ${convertAddressToName(newVoterAddress)} као новог члана Е-ВСД`,
    description: `Ово је предлог за додавање новог члана у састав Е-ВСД. Адреса члана је: ${newVoterAddress} (${convertAddressToName(newVoterAddress)})`,
  };
}
